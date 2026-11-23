import 'server-only';

import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { strToU8, type Zippable, zipSync } from 'fflate';

import packageJson from '../../package.json';

import {
  type CourseEdition,
  type CourseSummary,
  findEdition,
  getCourseOverview,
  getCourses,
  getGlossary,
  getGlossaryEntry,
  getLesson,
  type Lesson,
} from '@/lib/courses';
import {
  type EditionArea,
  type EditionLink,
  editionLinkPath,
  parseEditionLink,
} from '@/lib/edition-links';
import type { Locale } from '@/lib/locale';

/**
A file to download: its bytes or text, and its name.
*/
export interface DownloadFile<T> {
  file: T;
  name: string;
}

export type ArchiveFormat = 'markdown';

export const archiveFormats: readonly ArchiveFormat[] = ['markdown'];

/**
 * Fixed modification time of the files in the archives, so the same
 * course always produces the same archive.
 */
const archiveDate = new Date('2026-01-01T00:00:00Z');

/**
Name of the glossary file inside a course archive.
*/
const archiveGlossary = 'glossary';

/**
 * Rewrites the targets of the Markdown links in a text.
 */
function rewriteLinks(text: string, resolve: (href: string) => string) {
  return text.replaceAll(
    /\]\(([^)\s]+)\)/g,
    (_match, href: string) => `](${resolve(href)})`
  );
}

/**
 * Rewrites the relative links of an edition file: `local` may turn a link
 * into a file of the archive; otherwise it becomes an absolute URL of the
 * site, so it works outside it.
 */
function editionLinks(
  text: string,
  lang: Locale,
  topic: string,
  edition: string,
  area: EditionArea,
  local?: (link: EditionLink) => string | null
): string {
  return rewriteLinks(text, (href) => {
    const link = parseEditionLink(href, lang, area);
    return link
      ? (local?.(link) ??
          new URL(editionLinkPath(link, topic, edition), packageJson.homepage)
            .href)
      : href;
  });
}

/**
 * The text of a downloaded lesson: its title as a heading, its description
 * and level as lead paragraphs, then the body.
 */
async function lessonFileText(
  lang: Locale,
  data: Lesson,
  body: string
): Promise<string> {
  const t = await getTranslations({ locale: lang, namespace: 'Learn' });
  const level = data.level ? `_${t('level', { level: data.level })}_` : '';
  const parts = [`# ${data.title}`, data.description, level, body];
  return `${parts.filter(Boolean).join('\n\n')}\n`;
}

/**
 * Finds a course and one of its editions; `latest` is the newest one.
 */
async function findCourseEdition(
  lang: Locale,
  topic: string,
  edition: string
): Promise<{ course: CourseSummary; edition: CourseEdition } | null> {
  const courses = await getCourses(lang);
  const course = courses.find((item) => item.slug === topic);
  const editionData = findEdition(course?.editions ?? [], edition);
  return course && editionData ? { course, edition: editionData } : null;
}

/**
 * A lesson as a Markdown file: its title and description as a heading
 * and a lead paragraph, followed by the body, with absolute links.
 */
export async function getLessonMarkdown(
  lang: Locale,
  topic: string,
  edition: string,
  lesson: string
): Promise<DownloadFile<string> | null> {
  const found = await findCourseEdition(lang, topic, edition);
  const data = found
    ? await getLesson(lang, topic, found.edition.name, lesson)
    : null;
  if (!found || !data) {
    return null;
  }
  const body = editionLinks(
    data.body.trim(),
    lang,
    topic,
    found.edition.name,
    'course'
  );
  return {
    file: await lessonFileText(lang, data, body),
    name: `${data.slug}.${lang}.md`,
  };
}

/**
 * The whole glossary of an edition as one Markdown text: every term of
 * every entry, in alphabetical order of the entries. `null` if the edition
 * has no glossary.
 */
async function buildGlossaryMarkdown(
  lang: Locale,
  topic: string,
  edition: string,
  local?: (link: EditionLink) => string | null
): Promise<{
  title: string;
  description: string;
  body: string;
  termCount: number;
} | null> {
  const [glossary, t] = await Promise.all([
    getGlossary(lang, topic, edition),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  if (!glossary) {
    return null;
  }
  const entries = await Promise.all(
    glossary.entries.map((item) =>
      getGlossaryEntry(lang, topic, edition, item.slug)
    )
  );
  const parts = entries
    .filter((entry) => entry !== null)
    .map((entry) =>
      editionLinks(entry.body.trim(), lang, topic, edition, 'glossary', local)
    );
  return {
    title: glossary.title ?? t('glossary'),
    description: glossary.description,
    body: parts.join('\n\n'),
    termCount: glossary.termCount,
  };
}

/**
 * The glossary of an edition as one Markdown file, with absolute links to
 * the lessons.
 */
export async function getGlossaryMarkdown(
  lang: Locale,
  topic: string,
  edition: string
): Promise<DownloadFile<string> | null> {
  const found = await findCourseEdition(lang, topic, edition);
  const data = found
    ? await buildGlossaryMarkdown(lang, topic, found.edition.name)
    : null;
  if (!found || !data) {
    return null;
  }
  const parts = [`# ${data.title}`, data.description, data.body];
  return {
    file: `${parts.filter(Boolean).join('\n\n')}\n`,
    name: `${topic}-${found.edition.name}-glossary.${lang}.md`,
  };
}

/**
 * The glossary of an edition in one ZIP file, one Markdown file per
 * entry, with the index as `README.md`; links between the
 * files of the archive stay relative, links to lessons become absolute.
 */
export async function getGlossaryArchive(
  lang: Locale,
  topic: string,
  edition: string
): Promise<DownloadFile<Uint8Array<ArrayBuffer>> | null> {
  'use cache';
  cacheLife('max');

  const found = await findCourseEdition(lang, topic, edition);
  const glossary = found
    ? await getGlossary(lang, topic, found.edition.name)
    : null;
  if (!found || !glossary) {
    return null;
  }

  const editionData = found.edition;
  const folder = `${topic}-${editionData.name}-glossary-${lang}`;
  const files: Zippable = {};
  // Links to the glossary of the same language stay inside the archive.
  const local = (link: EditionLink): string | null =>
    link.area === 'glossary' && link.lang === lang
      ? `./${link.item ?? 'README'}.md${link.hash === undefined ? '' : `#${link.hash}`}`
      : null;
  const t = await getTranslations({ locale: lang, namespace: 'Learn' });
  const index = [
    `# ${glossary.title ?? t('glossary')}`,
    editionLinks(
      glossary.body.trim(),
      lang,
      topic,
      editionData.name,
      'glossary',
      local
    ),
  ];
  files['README.md'] = [
    strToU8(`${index.join('\n\n')}\n`),
    { mtime: archiveDate },
  ];
  const entries = await Promise.all(
    glossary.entries.map((item) =>
      getGlossaryEntry(lang, topic, editionData.name, item.slug)
    )
  );
  for (const entry of entries) {
    if (!entry) {
      continue;
    }
    const parts = [
      `# ${entry.title}`,
      editionLinks(
        entry.body.trim(),
        lang,
        topic,
        editionData.name,
        'glossary',
        local
      ),
    ];
    files[`${entry.slug}.md`] = [
      strToU8(`${parts.join('\n\n')}\n`),
      { mtime: archiveDate },
    ];
  }

  const zip = zipSync(
    { [folder]: [files, { mtime: archiveDate }] },
    { level: 9 }
  );
  return {
    file: new Uint8Array(zip),
    name: `${folder}-md.zip`,
  };
}

/**
 * Every lesson of a course edition in one ZIP file, as Markdown. The
 * files sit in a folder named after the course, edition, and language, and
 * keep the step number in their names, so they sort in order. The archive
 * also holds the course home page as `README.md` and, when the edition has
 * a glossary, `glossary.md`; links between the lessons, the home page, and
 * the glossary point to the files of the archive.
 */
export async function getCourseArchive(
  lang: Locale,
  topic: string,
  edition: string
): Promise<DownloadFile<Uint8Array<ArrayBuffer>> | null> {
  // Cached so the archive is prerendered once.
  'use cache';
  cacheLife('max');

  const found = await findCourseEdition(lang, topic, edition);
  if (!found) {
    return null;
  }
  const { course, edition: editionData } = found;

  const folder = `${topic}-${editionData.name}-${lang}`;
  const files: Zippable = {};
  const lessons = new Set(editionData.lessons.map((item) => item.slug));
  const local = (link: EditionLink): string | null => {
    if (link.lang !== lang) {
      return null;
    }
    const hash = link.hash === undefined ? '' : `#${link.hash}`;
    if (link.area === 'glossary') {
      return editionData.hasGlossary && link.item === undefined
        ? `./${archiveGlossary}.md${hash}`
        : null;
    }
    if (link.item === undefined) {
      return `./README.md${hash}`;
    }
    return lessons.has(link.item) ? `./${link.item}.md${hash}` : null;
  };

  const overview = await getCourseOverview(lang, topic, editionData.name);
  if (overview) {
    const title = overview.title ?? course.title;
    const body = editionLinks(
      overview.body.trim(),
      lang,
      topic,
      editionData.name,
      'course',
      local
    );
    files['README.md'] = [
      strToU8(`# ${title}\n\n${body}\n`),
      { mtime: archiveDate },
    ];
  }
  for (const lesson of editionData.lessons) {
    const data = await getLesson(lang, topic, editionData.name, lesson.slug);
    if (!data) {
      continue;
    }
    const body = editionLinks(
      data.body.trim(),
      lang,
      topic,
      editionData.name,
      'course',
      local
    );
    files[`${data.slug}.md`] = [
      strToU8(await lessonFileText(lang, data, body)),
      { mtime: archiveDate },
    ];
  }
  if (editionData.hasGlossary) {
    const glossary = await buildGlossaryMarkdown(
      lang,
      topic,
      editionData.name,
      local
    );
    if (glossary) {
      const parts = [
        `# ${glossary.title}`,
        glossary.description,
        glossary.body,
      ];
      files[`${archiveGlossary}.md`] = [
        strToU8(`${parts.filter(Boolean).join('\n\n')}\n`),
        { mtime: archiveDate },
      ];
    }
  }

  const zip = zipSync(
    { [folder]: [files, { mtime: archiveDate }] },
    { level: 9 }
  );
  return {
    file: new Uint8Array(zip),
    name: `${folder}-md.zip`,
  };
}
