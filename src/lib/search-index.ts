import 'server-only';

import { cacheLife } from 'next/cache';

import GithubSlugger from 'github-slugger';
import type { Nodes, Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { coursePath, glossaryPath, latestEdition } from '@/lib/course-paths';
import {
  getCourses,
  getGlossary,
  getGlossaryEntry,
  getLesson,
} from '@/lib/courses';
import type { Locale } from '@/lib/locale';
import type {
  SearchIndexData,
  SearchPage,
  SearchSection,
} from '@/lib/search-types';

/**
Nodes whose children are inline text, joined without spaces.
*/
const phrasingParents = new Set([
  'paragraph',
  'heading',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'tableCell',
]);

/**
The GitHub alert marker that opens a callout, such as `[!TIP]`.
*/
const calloutMarker = /^\[!(?:note|tip|important|warning|caution)\]\s*/i;

/**
 * The visible text of a node. Inline content is joined as the page shows
 * it, blocks and table cells are separated by spaces. Images and raw HTML
 * add nothing, as on the page.
 */
function nodeText(node: Nodes): string {
  if (node.type === 'html' || node.type === 'image') {
    return '';
  }
  if ('value' in node) {
    return node.value;
  }
  if (!('children' in node)) {
    return '';
  }
  const separator = phrasingParents.has(node.type) ? '' : ' ';
  return node.children
    .map((child) => nodeText(child))
    .join(separator)
    .replace(calloutMarker, '');
}

/**
Heading levels that start a section: `##` and `###`.
*/
const sectionDepths = new Set([2, 3]);

/**
Block nodes that hold other blocks.
*/
const containerTypes = new Set(['root', 'blockquote', 'list', 'listItem']);

/**
Collapses runs of white space into single spaces.
*/
function squash(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}

/**
 * Splits a Markdown body into sections at its `##` and `###` headings.
 * Heading ids come from the same slugger, in the same order, as
 * `rehype-slug` in the Markdown renderer, so they match the page.
 */
function splitSections(body: string): Omit<SearchSection, 'page'>[] {
  const tree: Root = unified().use(remarkParse).use(remarkGfm).parse(body);
  const slugger = new GithubSlugger();
  const sections: {
    heading?: string;
    anchor?: string;
    text: string[];
    code: string[];
  }[] = [{ text: [], code: [] }];

  const visit = (node: Nodes) => {
    const current = sections.at(-1);
    if (!current) {
      return;
    }
    if (node.type === 'heading') {
      const heading = nodeText(node);
      const anchor = slugger.slug(heading);
      if (sectionDepths.has(node.depth)) {
        sections.push({ heading: squash(heading), anchor, text: [], code: [] });
      } else {
        current.text.push(heading);
      }
      return;
    }
    if (node.type === 'code') {
      current.code.push(node.value);
      return;
    }
    // Recurse into containers, so headings nested in them still advance
    // the slugger; everything else is one block of text.
    if (containerTypes.has(node.type) && 'children' in node) {
      for (const child of node.children) {
        visit(child);
      }
      return;
    }
    current.text.push(nodeText(node));
  };
  visit(tree);

  return sections
    .map(({ heading, anchor, text, code }) => ({
      ...(heading && { heading, anchor }),
      text: squash(text.join(' ')),
      code: squash(code.join(' ')),
    }))
    .filter((section) => section.heading || section.text || section.code);
}

/**
Strips the backticks that mark code in a title.
*/
function plainTitle(title: string): string {
  return title.replaceAll('`', '');
}

/**
 * The search index of one language: every lesson and glossary entry of the
 * newest edition of every course.
 */
export async function getSearchIndex(locale: Locale): Promise<SearchIndexData> {
  'use cache';
  cacheLife('max');

  const pages: SearchPage[] = [];
  const sections: SearchSection[] = [];
  const add = (page: SearchPage, body: string) => {
    const index = pages.length;
    pages.push(page);
    for (const section of splitSections(body)) {
      sections.push({ page: index, ...section });
    }
  };

  const courses = await getCourses(locale);
  for (const course of courses) {
    const edition = course.editions[0];
    if (!edition) {
      continue;
    }
    const [lessons, glossary] = await Promise.all([
      Promise.all(
        edition.lessons.map((lesson) =>
          getLesson(locale, course.slug, edition.name, lesson.slug)
        )
      ),
      getGlossary(locale, course.slug, edition.name),
    ]);
    for (const lesson of lessons) {
      if (lesson) {
        add(
          {
            kind: 'lesson',
            topic: course.slug,
            course: course.title,
            title: plainTitle(lesson.title),
            description: lesson.description,
            ...(lesson.level && { level: lesson.level }),
            path: coursePath(course.slug, latestEdition, lesson.slug),
          },
          lesson.body
        );
      }
    }
    const entries = await Promise.all(
      (glossary?.entries ?? []).map((entry) =>
        getGlossaryEntry(locale, course.slug, edition.name, entry.slug)
      )
    );
    for (const entry of entries) {
      if (entry) {
        add(
          {
            kind: 'glossary',
            topic: course.slug,
            course: course.title,
            title: plainTitle(entry.title),
            description: entry.description,
            path: glossaryPath(course.slug, latestEdition, entry.slug),
          },
          entry.body
        );
      }
    }
  }

  return { pages, sections };
}
