/**
A link to a course file: `../course/v2/0005-slug.en.md#part` or `../course/v2/README.en.md`.
*/
const courseLinkPattern =
  /^\.\.\/course\/(v\d+)\/(?:(\d{4}-[a-z\d-]+)|README)\.[a-z]{2}\.md(#.*)?$/;

/**
A link to a glossary section: `./04-internal-tables.it.md#part`.
*/
const sectionLinkPattern = /^(?:\.\/)?(\d{2}-[a-z\d-]+)\.[a-z]{2}\.md(#.*)?$/;

/**
A link to the glossary index, maybe in another language: `./README.it.md`.
*/
const indexLinkPattern = /^(?:\.\/)?README\.([a-z]{2})\.md(#.*)?$/;

/**
 * Turns the relative links of a glossary file, written so that they also
 * work on GitHub, into site URLs: lessons, course home pages, glossary
 * sections, and the glossary index.
 */
export function createGlossaryHrefResolver(lang: string, topic: string) {
  const glossaryBase = `/${lang}/learn/${topic}/glossary`;
  return (href: string): string => {
    const course = courseLinkPattern.exec(href);
    if (course) {
      const [, version, lesson, hash = ''] = course;
      return `/${lang}/learn/${topic}/course/${version}${lesson ? `/${lesson}` : ''}${hash}`;
    }
    const section = sectionLinkPattern.exec(href);
    if (section) {
      return `${glossaryBase}/${section[1]}${section[2] ?? ''}`;
    }
    const index = indexLinkPattern.exec(href);
    return index
      ? `/${index[1]}/learn/${topic}/glossary${index[2] ?? ''}`
      : href;
  };
}
