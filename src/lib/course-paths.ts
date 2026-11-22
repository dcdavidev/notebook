/**
 * Site paths of courses and glossaries, without the locale prefix: the
 * `Link` of `@/i18n/navigation` adds it, server pages prepend `/&lt;lang>`.
 *
 * /learn/&lt;topic>/&lt;edition>/course             course home page
 * /learn/&lt;topic>/&lt;edition>/course/&lt;lesson>    one lesson
 * /learn/&lt;topic>/&lt;edition>/glossary           glossary home page
 * /learn/&lt;topic>/&lt;edition>/glossary/&lt;term>    one glossary entry
 *
 * `&lt;edition>` is the edition slug, such as `2026-11`, or `latest`.
 */

/**
URL alias of the newest edition. It is never a folder name.
*/
export const latestEdition = 'latest';

/**
The path of a course edition, or of one of its lessons.
*/
export function coursePath(
  topic: string,
  edition: string,
  lesson?: string
): string {
  return `/learn/${topic}/${edition}/course${lesson ? `/${lesson}` : ''}`;
}

/**
The path of the glossary of a course edition, or of one of its entries.
*/
export function glossaryPath(
  topic: string,
  edition: string,
  term?: string
): string {
  return `/learn/${topic}/${edition}/glossary${term ? `/${term}` : ''}`;
}

/**
 * The parts of a path without the locale:
 * `/learn/&lt;topic>/&lt;edition>/&lt;course|glossary>/&lt;item>`.
 */
export function parseLearnPath(pathname: string): {
  topic?: string;
  edition?: string;
  area?: string;
  item?: string;
} {
  const [, learn, topic, edition, area, item] = pathname.split('/', 6);
  return learn === 'learn' ? { topic, edition, area, item } : {};
}
