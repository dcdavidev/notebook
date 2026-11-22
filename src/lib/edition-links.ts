import path from 'node:path';

import { coursePath, glossaryPath } from '@/lib/course-paths';
import { type Locale, locales } from '@/lib/locale';

/**
A file of an edition, relative to the edition folder: `&lt;lang>/&lt;area>/&lt;file>.md`.
*/
const editionFilePattern =
  /^([a-z]{2})\/(course|glossary)\/([a-z\d]+(?:-[a-z\d]+)*|README)\.md$/;

export type EditionArea = 'course' | 'glossary';

/**
A page of an edition that a relative link points to.
*/
export interface EditionLink {
  lang: Locale;
  area: EditionArea;
  /**
  The lesson or glossary entry, or nothing for the home page of the area.
  */
  item?: string;
  /**
  The fragment, without `#`.
  */
  hash?: string;
}

/**
 * Finds the page that a relative link of an edition file points to. The
 * file is in `&lt;lang>/&lt;area>/`; links work on GitHub as they are:
 *
 * - `./0005-slug.md` in a lesson, `../course/0005-slug.md` in the glossary:
 *   the lesson;
 * - `./README.md`, `../course/README.md`, `../glossary/README.md`: the home
 *   page of the course or of the glossary;
 * - `./internal-table.md#part` in the glossary: the glossary entry;
 * - `../../en/glossary/README.md`: the same page in another language.
 *
 * `null` for anything else, such as external links and anchors.
 */
export function parseEditionLink(
  href: string,
  lang: Locale,
  area: EditionArea
): EditionLink | null {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href)) {
    return null;
  }
  const [file = '', hash] = href.split('#', 2);
  const target = path.posix.normalize(path.posix.join(lang, area, file));
  const match = editionFilePattern.exec(target);
  const targetLang = locales.find((item) => item === match?.[1]);
  if (!match || !targetLang) {
    return null;
  }
  const name = match[3] ?? '';
  return {
    lang: targetLang,
    area: match[2] === 'course' ? 'course' : 'glossary',
    item: name === 'README' ? undefined : name,
    hash,
  };
}

/**
 * The site path, with the locale, of a page of an edition.
 */
export function editionLinkPath(
  link: EditionLink,
  topic: string,
  edition: string
): string {
  const sitePath =
    link.area === 'course'
      ? coursePath(topic, edition, link.item)
      : glossaryPath(topic, edition, link.item);
  return `/${link.lang}${sitePath}${link.hash === undefined ? '' : `#${link.hash}`}`;
}

/**
 * Turns the relative links of a Markdown file of a course edition into
 * site paths with the locale (see `parseEditionLink`). Other links are
 * returned as they are.
 */
export function createEditionHrefResolver(
  lang: Locale,
  topic: string,
  edition: string,
  area: EditionArea
) {
  return (href: string): string => {
    const link = parseEditionLink(href, lang, area);
    return link ? editionLinkPath(link, topic, edition) : href;
  };
}
