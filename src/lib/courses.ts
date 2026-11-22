import 'server-only';

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { cacheLife } from 'next/cache';

import { parse } from 'yaml';

import { latestEdition } from '@/lib/course-paths';
import { defaultLocale, type Locale, locales } from '@/lib/locale';

export { latestEdition } from '@/lib/course-paths';

/**
 * Courses are plain files in `learning-materials`, so anyone can contribute
 * by editing Markdown:
 *
 * learning-materials/&lt;topic>/&lt;YYYY.MM>/&lt;locale>/course/README.md        home page: title, description, tags
 * learning-materials/&lt;topic>/&lt;YYYY.MM>/&lt;locale>/course/NNNN-slug.md     one lesson per file
 * learning-materials/&lt;topic>/&lt;YYYY.MM>/&lt;locale>/glossary/README.md      glossary home page
 * learning-materials/&lt;topic>/&lt;YYYY.MM>/&lt;locale>/glossary/term-slug.md   one entry, with related terms
 *
 * An edition folder such as `2026.11` is `2026-11` in the URL. The file
 * names are the same in every language, so the URL
 * `/&lt;locale>/learn/&lt;topic>/2026-11/course/NNNN-slug` stays the same when
 * switching language. In the URL, `latest` stands for the newest edition.
 */
const contentRoot = path.join(process.cwd(), 'learning-materials');

/**
Edition folder name: a year and a month, such as `2026.11`.
*/
const editionFolderPattern = /^(\d{4})\.(0[1-9]|1[0-2])$/;

/**
Edition URL segment: a year and a month, such as `2026-11`.
*/
const editionSlugPattern = /^(\d{4})-(0[1-9]|1[0-2])$/;

/**
Lesson file name: a four-digit step and a kebab-case slug.
*/
const lessonPattern = /^(\d{4})-[a-z\d]+(?:-[a-z\d]+)*\.md$/;

/**
Lesson URL segment: the file name without the extension.
*/
const slugPattern = /^\d{4}-[a-z\d]+(?:-[a-z\d]+)*$/;

/**
Glossary entry file name, and URL segment without the extension.
*/
const termPattern = /^[a-z\d]+(?:-[a-z\d]+)*$/;

/**
Topic folder name, for example `abap` or `golang`.
*/
const namePattern = /^[a-z\d]+(?:[.-][a-z\d]+)*$/;

export interface LessonSummary {
  /**
  URL segment, for example `0001-what-is-sap`.
  */
  slug: string;
  step: number;
  title: string;
}

export interface CourseEdition {
  /**
  URL segment and stored name, for example `2026-11`.
  */
  name: string;
  /**
  The folder name, shown to readers: `2026.11`.
  */
  label: string;
  lessons: LessonSummary[];
  /**
  Whether the edition has a glossary in this language or in English.
  */
  hasGlossary: boolean;
  /**
  The glossary entries, in alphabetical order, for the course panel.
  */
  glossaryEntries: { slug: string; title: string }[];
}

export interface CourseSummary {
  /**
  The topic folder, for example `abap`.
  */
  slug: string;
  title: string;
  description: string;
  tags: string[];
  /**
  Editions with at least one lesson, newest first.
  */
  editions: CourseEdition[];
}

export interface Lesson extends LessonSummary {
  description: string;
  /**
  Markdown body, without the front matter.
  */
  body: string;
  /**
  Repository path, for the "Edit on GitHub" link.
  */
  sourcePath: string;
}

export interface CourseOverview {
  /**
  The leading `# Heading` of the README: the topic.
  */
  title?: string;
  description: string;
  tags: string[];
  /**
  Markdown body, without front matter and heading.
  */
  body: string;
  /**
  Repository path, for the "Edit on GitHub" link.
  */
  sourcePath: string;
}

export interface GlossaryEntrySummary {
  /**
  URL segment, for example `internal-table`.
  */
  slug: string;
  /**
  The main term.
  */
  title: string;
  /**
  Every term the entry explains: its `##` headings.
  */
  terms: string[];
}

export interface GlossaryEntry extends GlossaryEntrySummary {
  description: string;
  /**
  Markdown body, without the front matter.
  */
  body: string;
  /**
  Repository path, for the "Edit on GitHub" link.
  */
  sourcePath: string;
}

export interface Glossary {
  /**
  The leading `# Heading` of the README.
  */
  title?: string;
  description: string;
  /**
  Markdown body, without front matter and heading.
  */
  body: string;
  /**
  The entries, in alphabetical order of their main term.
  */
  entries: GlossaryEntrySummary[];
  /**
  Number of terms in all the entries.
  */
  termCount: number;
  /**
  Repository path, for the "Edit on GitHub" link.
  */
  sourcePath: string;
}

interface FrontMatter {
  title?: string;
  description?: string;
  tags?: string[];
}

/**
 * Splits a Markdown file into its YAML front matter and its body.
 */
function splitFrontMatter(source: string): {
  data: FrontMatter;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) {
    return { data: {}, body: source };
  }
  return {
    data: (parse(match[1] ?? '') ?? {}) as FrontMatter,
    body: source.slice(match[0].length),
  };
}

/**
 * Reads a UTF-8 file, or returns `null` if it does not exist.
 */
async function readOptionalFile(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Lists the names of the subfolders of a folder, or nothing if it is missing.
 */
async function listDirectories(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * Lists the names of the files of a folder, or nothing if it is missing.
 */
async function listFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * The folder of an edition from its URL segment: `2026-11` → `2026.11`.
 * `null` for anything else, so URLs never reach other folders.
 */
function editionFolder(edition: string): string | null {
  const match = editionSlugPattern.exec(edition);
  return match ? `${match[1]}.${match[2]}` : null;
}

/**
 * The folder of one area of an edition in one language.
 */
function areaDirectory(
  topic: string,
  folder: string,
  locale: Locale,
  area: 'course' | 'glossary'
): string {
  return path.join(contentRoot, topic, folder, locale, area);
}

/**
 * Reads a file of an edition area in one language, or in English as a
 * fallback.
 */
async function readLocalized(
  topic: string,
  folder: string,
  locale: Locale,
  area: 'course' | 'glossary',
  file: string
): Promise<{ source: string; sourcePath: string } | null> {
  const languages = new Set([locale, defaultLocale]);
  for (const lang of languages) {
    const source = await readOptionalFile(
      path.join(areaDirectory(topic, folder, lang, area), file)
    );
    if (source !== null) {
      return {
        source,
        sourcePath: `learning-materials/${topic}/${folder}/${lang}/${area}/${file}`,
      };
    }
  }
  return null;
}

/**
 * Finds the edition a URL segment points to: `latest` is the newest one.
 */
export function findEdition(
  editions: CourseEdition[],
  segment: string | undefined
): CourseEdition | undefined {
  return segment === latestEdition
    ? editions[0]
    : editions.find((item) => item.name === segment);
}

/**
 * Reads the lessons of one course edition in one language, in step order.
 */
async function readEditionLessons(
  topic: string,
  folder: string,
  locale: Locale
): Promise<LessonSummary[]> {
  const directory = areaDirectory(topic, folder, locale, 'course');
  const allFiles = await listFiles(directory);
  const files = allFiles.filter((file) => lessonPattern.test(file));
  const lessons = await Promise.all(
    files.map(async (file) => {
      const slug = file.slice(0, -'.md'.length);
      const { data } = splitFrontMatter(
        await readFile(path.join(directory, file), 'utf8')
      );
      return {
        slug,
        step: Number(slug.slice(0, 4)),
        title: data.title ?? slug,
      };
    })
  );
  return lessons.toSorted((a, b) => a.step - b.step);
}

/**
 * Every course in one language, in alphabetical order by title.
 */
export async function getCourses(locale: Locale): Promise<CourseSummary[]> {
  'use cache';
  cacheLife('max');

  const topics = await listDirectories(contentRoot);
  const courses = await Promise.all(
    topics.map(async (topic): Promise<CourseSummary | null> => {
      if (!namePattern.test(topic)) {
        return null;
      }
      const topicFolders = await listDirectories(path.join(contentRoot, topic));
      const folders = topicFolders
        .filter((name) => editionFolderPattern.test(name))
        // `YYYY.MM` sorts by date as text: newest first.
        .toSorted((a, b) => b.localeCompare(a, 'en'));
      const allEditions = await Promise.all(
        folders.map(async (folder) => {
          const name = folder.replace('.', '-');
          const [lessons, glossary] = await Promise.all([
            readEditionLessons(topic, folder, locale),
            getGlossary(locale, topic, name),
          ]);
          return {
            name,
            label: folder,
            lessons,
            hasGlossary: glossary !== null,
            glossaryEntries: (glossary?.entries ?? []).map(
              ({ slug, title }) => ({ slug, title })
            ),
          };
        })
      );
      const editions = allEditions.filter(
        (edition) => edition.lessons.length > 0
      );
      // Title, description, and tags come from the newest edition's README.
      const newest = editions[0];
      const overview = newest
        ? await readOverview(locale, topic, newest.label)
        : null;
      return {
        slug: topic,
        title: overview?.title ?? topic,
        description: overview?.description ?? '',
        tags: overview?.tags ?? [],
        editions,
      };
    })
  );

  return courses
    .filter((course): course is CourseSummary =>
      Boolean(course && course.editions.length > 0)
    )
    .toSorted((a, b) => a.title.localeCompare(b.title, locale));
}

/**
 * One lesson with its Markdown body, or `null` if it does not exist.
 * `edition` is a named edition such as `2026-11`, never `latest`.
 */
export async function getLesson(
  locale: Locale,
  topic: string,
  edition: string,
  slug: string
): Promise<Lesson | null> {
  'use cache';
  cacheLife('max');

  const folder = editionFolder(edition);
  if (!folder || !namePattern.test(topic) || !slugPattern.test(slug)) {
    return null;
  }
  const directory = areaDirectory(topic, folder, locale, 'course');
  const source = await readOptionalFile(path.join(directory, `${slug}.md`));
  if (source === null) {
    return null;
  }
  const { data, body } = splitFrontMatter(source);
  return {
    slug,
    step: Number(slug.slice(0, 4)),
    title: data.title ?? slug,
    description: data.description ?? '',
    body,
    sourcePath: `learning-materials/${topic}/${folder}/${locale}/course/${slug}.md`,
  };
}

/**
 * The home page of a course edition: its `README.md`, or the English one
 * as a fallback.
 */
export async function getCourseOverview(
  locale: Locale,
  topic: string,
  edition: string
): Promise<CourseOverview | null> {
  'use cache';
  cacheLife('max');

  const folder = editionFolder(edition);
  return folder && namePattern.test(topic)
    ? readOverview(locale, topic, folder)
    : null;
}

/**
 * Splits the leading `# Heading` off a Markdown body.
 */
function splitHeading(body: string): { title?: string; body: string } {
  const heading = /^\s*# (.+)\r?\n/.exec(body);
  return heading
    ? { title: heading[1]?.trim(), body: body.slice(heading[0].length) }
    : { body };
}

/**
 * Reads an edition README. Its leading `# Heading` (the topic) becomes the
 * title and is removed from the body; the front matter holds `description`
 * and `tags`.
 */
async function readOverview(
  locale: Locale,
  topic: string,
  folder: string
): Promise<CourseOverview | null> {
  const file = await readLocalized(
    topic,
    folder,
    locale,
    'course',
    'README.md'
  );
  if (!file) {
    return null;
  }
  const { data, body } = splitFrontMatter(file.source);
  const content = splitHeading(body);
  return {
    title: content.title,
    description: data.description ?? '',
    tags: data.tags ?? [],
    body: content.body,
    sourcePath: file.sourcePath,
  };
}

/**
 * The terms an entry explains: its `##` headings.
 */
function readTerms(body: string): string[] {
  return body
    .matchAll(/^## (.+)$/gm)
    .map((match) => (match[1] ?? '').trim())
    .toArray();
}

/**
 * Reads one glossary entry. Its front matter holds the main term as
 * `title` and a `description`.
 */
async function readGlossaryEntry(
  locale: Locale,
  topic: string,
  folder: string,
  slug: string
): Promise<GlossaryEntry | null> {
  const file = await readLocalized(
    topic,
    folder,
    locale,
    'glossary',
    `${slug}.md`
  );
  if (!file) {
    return null;
  }
  const { data, body } = splitFrontMatter(file.source);
  return {
    slug,
    title: data.title ?? slug,
    terms: readTerms(body),
    description: data.description ?? '',
    body,
    sourcePath: file.sourcePath,
  };
}

/**
 * The glossary of a course edition: its `README.md` and the list of its
 * entries, or `null` if the edition has none.
 */
export async function getGlossary(
  locale: Locale,
  topic: string,
  edition: string
): Promise<Glossary | null> {
  'use cache';
  cacheLife('max');

  const folder = editionFolder(edition);
  if (!folder || !namePattern.test(topic)) {
    return null;
  }
  const readme = await readLocalized(
    topic,
    folder,
    locale,
    'glossary',
    'README.md'
  );
  if (!readme) {
    return null;
  }
  // An entry exists if it has a file in this language or in English.
  const names = await Promise.all(
    [...new Set([locale, defaultLocale])].map((lang) =>
      listFiles(areaDirectory(topic, folder, lang, 'glossary'))
    )
  );
  const slugs = [
    ...new Set(
      names
        .flat()
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.slice(0, -'.md'.length))
        .filter((slug) => termPattern.test(slug))
    ),
  ];
  const read = await Promise.all(
    slugs.map((slug) => readGlossaryEntry(locale, topic, folder, slug))
  );
  const entries = read
    .filter((entry): entry is GlossaryEntry => entry !== null)
    .map(({ slug, title, terms }) => ({ slug, title, terms }))
    .toSorted((a, b) =>
      a.title
        .replaceAll('`', '')
        .localeCompare(b.title.replaceAll('`', ''), 'en', {
          sensitivity: 'base',
        })
    );

  const { data, body } = splitFrontMatter(readme.source);
  const content = splitHeading(body);
  return {
    title: content.title ?? data.title,
    description: data.description ?? '',
    body: content.body,
    entries,
    termCount: entries.reduce((sum, entry) => sum + entry.terms.length, 0),
    sourcePath: readme.sourcePath,
  };
}

/**
 * One glossary entry with its Markdown body, or `null` if it does not
 * exist.
 */
export async function getGlossaryEntry(
  locale: Locale,
  topic: string,
  edition: string,
  slug: string
): Promise<GlossaryEntry | null> {
  'use cache';
  cacheLife('max');

  const folder = editionFolder(edition);
  return folder && namePattern.test(topic) && termPattern.test(slug)
    ? readGlossaryEntry(locale, topic, folder, slug)
    : null;
}

/**
 * The URL segments of the editions of a course: `latest` and every named
 * edition.
 */
function editionSegments(course: CourseSummary) {
  return [
    ...(course.editions[0]
      ? [{ segment: latestEdition, edition: course.editions[0] }]
      : []),
    ...course.editions.map((edition) => ({ segment: edition.name, edition })),
  ];
}

/**
 * Every `{ lang, topic, edition }` triple, `latest` included, for static
 * generation.
 */
export async function getEditionParams(): Promise<
  { lang: Locale; topic: string; edition: string }[]
> {
  const perLocale = await Promise.all(
    locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses.flatMap((course) =>
        editionSegments(course).map(({ segment }) => ({
          lang,
          topic: course.slug,
          edition: segment,
        }))
      );
    })
  );
  return perLocale.flat();
}

/**
 * Every lesson URL in every language, `latest` included, for static
 * generation.
 */
export async function getAllLessonParams(): Promise<
  { lang: Locale; topic: string; edition: string; lesson: string }[]
> {
  const perLocale = await Promise.all(
    locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses.flatMap((course) =>
        editionSegments(course).flatMap(({ segment, edition }) =>
          edition.lessons.map((lesson) => ({
            lang,
            topic: course.slug,
            edition: segment,
            lesson: lesson.slug,
          }))
        )
      );
    })
  );
  return perLocale.flat();
}

/**
 * Every `{ lang, topic, edition }` triple with a glossary, `latest`
 * included, for static generation.
 */
export async function getGlossaryParams(): Promise<
  { lang: Locale; topic: string; edition: string }[]
> {
  const perLocale = await Promise.all(
    locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses.flatMap((course) =>
        editionSegments(course)
          .filter(({ edition }) => edition.hasGlossary)
          .map(({ segment }) => ({
            lang,
            topic: course.slug,
            edition: segment,
          }))
      );
    })
  );
  return perLocale.flat();
}

/**
 * Every glossary entry URL in every language, `latest` included, for
 * static generation.
 */
export async function getGlossaryEntryParams(): Promise<
  { lang: Locale; topic: string; edition: string; term: string }[]
> {
  const triples = await getGlossaryParams();
  const perTriple = await Promise.all(
    triples.map(async ({ lang, topic, edition }) => {
      const courses = await getCourses(lang);
      const named = findEdition(
        courses.find((course) => course.slug === topic)?.editions ?? [],
        edition
      );
      const glossary = named
        ? await getGlossary(lang, topic, named.name)
        : null;
      return (glossary?.entries ?? []).map((entry) => ({
        lang,
        topic,
        edition,
        term: entry.slug,
      }));
    })
  );
  return perTriple.flat();
}
