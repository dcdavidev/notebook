import 'server-only';

import { cacheLife } from 'next/cache';

import type { Root as HastRoot } from 'hast';
import type { Blockquote, Paragraph, Root as MdastRoot, Text } from 'mdast';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeShiki from '@shikijs/rehype';

import type { Locale } from '@/lib/locale';

/**
 * Callouts use the GitHub alert syntax, so they also render on GitHub:
 *
 * > [!TIP]
 * > Text of the analogy.
 *
 * Each type has a meaning in the courses and a title in every language.
 */
const calloutTitles = {
  note: { it: 'Riepilogo', en: 'Summary' },
  tip: { it: 'Analogia', en: 'Analogy' },
  important: { it: 'Esercizio', en: 'Exercise' },
  warning: { it: 'Attenzione', en: 'Warning' },
  caution: { it: 'Attenzione', en: 'Caution' },
} as const satisfies Record<string, Record<Locale, string>>;

type CalloutType = keyof typeof calloutTitles;

const calloutPattern = /^\[!(note|tip|important|warning|caution)\]\s*/i;

/**
 * Remark plugin that turns GitHub alerts into `&lt;aside>` callouts with a
 * translated title.
 */
function remarkCallouts(locale: Locale) {
  return (tree: MdastRoot) => {
    const visit = (
      node: MdastRoot | Blockquote | MdastRoot['children'][number]
    ) => {
      if ('children' in node) {
        for (const child of node.children) {
          visit(child);
        }
      }
      if (node.type !== 'blockquote') {
        return;
      }
      const first = node.children.at(0);
      const firstText =
        first?.type === 'paragraph' ? first.children.at(0) : undefined;
      if (firstText?.type !== 'text') {
        return;
      }
      const match = calloutPattern.exec(firstText.value);
      if (!match?.[1]) {
        return;
      }
      const type = match[1].toLowerCase() as CalloutType;
      firstText.value = firstText.value.slice(match[0].length);
      if (first?.type === 'paragraph' && firstText.value === '') {
        first.children.shift();
        // Drop the line break that followed the marker.
        if (first.children.at(0)?.type === 'break') {
          first.children.shift();
        }
      }

      const title: Paragraph = {
        type: 'paragraph',
        data: { hProperties: { className: ['callout-title'] } },
        children: [
          { type: 'text', value: calloutTitles[type][locale] } as Text,
        ],
      };
      node.children.unshift(title);
      node.data = {
        hName: 'aside',
        hProperties: { className: ['callout', `callout-${type}`] },
      };
    };
    visit(tree);
  };
}

/**
 * Converts a lesson from Markdown to an HTML syntax tree, with headings
 * anchors, GitHub tables, callouts, and highlighted code blocks.
 */
export async function markdownToHast(
  source: string,
  locale: Locale
): Promise<HastRoot> {
  'use cache';
  cacheLife('max');

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkCallouts, locale)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeShiki, {
      // Both themes are emitted as CSS variables; the `.dark` class on the
      // `html` element switches between them (see the lesson styles).
      themes: { light: 'github-light', dark: 'github-dark' },
      langs: [
        'abap',
        'sql',
        'json',
        'xml',
        'javascript',
        'typescript',
        'shellscript',
      ],
      fallbackLanguage: 'text',
      defaultLanguage: 'text',
    });

  return processor.run(processor.parse(source)) as Promise<HastRoot>;
}
