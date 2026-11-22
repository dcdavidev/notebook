import 'server-only';

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { cacheLife } from 'next/cache';

import { parse } from 'yaml';

import { type Locale, locales } from '@/lib/locale';

/**
 * Courses are plain files in `content`, so anyone can contribute by editing
 * Markdown:
 *
 * learning-materials/&lt;topic>/course/v&lt;N>/README.&lt;locale>.md      home page: title, description, tags
 * learning-materials/&lt;topic>/course/v&lt;N>/NNNN-slug.&lt;locale>.md   one lesson per file
 *
 * The lesson file name is the same in every language, so the URL
 * `/&lt;locale>/learn/&lt;topic>/course/&lt;version>/NNNN-slug` stays the same when
 * switching language. In the URL, `latest` stands for the highest `vN`.
 */
const contentRoot = path.join(process.cwd(), 'learning-materials');

/**
 * URL alias of the newest version (the highest `vN` folder). It is never a
 * folder name.
 */
export const latestVersion = 'latest';

/**
Version folder name: `v1`, `v2`, ...
*/
const versionPattern = /^v(\d+)$/;

/**
Lesson file name: a four-digit step, a kebab-case slug, and the locale.
*/
const lessonPattern = /^(\d{4})-([a-z\d]+(?:-[a-z\d]+)*)\.([a-z]{2})\.md$/;

/**
Lesson URL segment: the file name without locale and extension.
*/
const slugPattern = /^\d{4}-[a-z\d]+(?:-[a-z\d]+)*$/;

/**
Glossary section file name: a two-digit step, a kebab-case slug, and the locale.
*/
const glossaryFilePattern =
  /^(\d{2})-([a-z\d]+(?:-[a-z\d]+)*)\.([a-z]{2})\.md$/;

/**
Glossary section URL segment: the file name without locale and extension.
*/
const glossarySlugPattern = /^\d{2}-[a-z\d]+(?:-[a-z\d]+)*$/;

/**
Topic folder name, for example `abap` or `golang`.
*/
const namePattern = /^[a-z\d]+(?:[.-][a-z\d]+)*$/;

export interface LessonSummary {
  /**
  URL segment, for example `0001-welcome-to-sap-and-abap`.
  */
  slug: string;
  step: number;
  title: string;
}

export interface CourseVersion {
  name: string;
  lessons: LessonSummary[];
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
  Versions with at least one lesson, newest first.
  */
  versions: CourseVersion[];
  /**
  Whether the topic has a glossary in `glossary/README.&lt;locale>.md`.
  */
  hasGlossary: boolean;
}

export interface Lesson extends LessonSummary {
  description: string;
  /**
  Markdown body, without the front matter.
  */
  body: string;
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

export interface GlossarySectionSummary {
  /**
  URL segment, for example `04-internal-tables`.
  */
  slug: string;
  step: number;
  title: string;
  description: string;
  /**
  Number of entries: paragraphs that start with a bold term.
  */
  termCount: number;
}

export interface GlossarySection extends GlossarySectionSummary {
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
  The subject files, in step order.
  */
  sections: GlossarySectionSummary[];
  /**
  Number of entries in all the sections.
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
 * Orders versions from the newest to the oldest.
 */
function compareVersions(a: string, b: string): number {
  return b.localeCompare(a, 'en', { numeric: true });
}

/**
 * Finds the version a URL segment points to: `latest` is the newest one.
 */
export function findVersion(
  versions: CourseVersion[],
  segment: string | undefined
): CourseVersion | undefined {
  return segment === latestVersion
    ? versions[0]
    : versions.find((item) => item.name === segment);
}

/**
 * Reads the lessons of one course version in one language, in step order.
 */
async function readVersionLessons(
  topic: string,
  version: string,
  locale: Locale
): Promise<LessonSummary[]> {
  const directory = path.join(contentRoot, topic, 'course', version);
  let files: string[] = [];
  try {
    files = await readdir(directory);
  } catch {
    // The version folder is missing.
  }
  const entries = files
    .map((file) => ({ file, match: lessonPattern.exec(file) }))
    .filter(
      (entry): entry is { file: string; match: RegExpExecArray } =>
        entry.match?.[3] === locale
    );
  const lessons = await Promise.all(
    entries.map(async ({ file, match }) => {
      const slug = `${match[1]}-${match[2]}`;
      const { data } = splitFrontMatter(
        await readFile(path.join(directory, file), 'utf8')
      );
      return { slug, step: Number(match[1]), title: data.title ?? slug };
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
      const folders = await listDirectories(
        path.join(contentRoot, topic, 'course')
      );
      const versionNames = folders
        .filter((name) => versionPattern.test(name))
        .toSorted(compareVersions);
      const allVersions = await Promise.all(
        versionNames.map(async (name) => ({
          name,
          lessons: await readVersionLessons(topic, name, locale),
        }))
      );
      const versions = allVersions.filter(
        (version) => version.lessons.length > 0
      );
      // Title, description, and tags come from the newest version's README.
      const newest = versions[0];
      const [overview, glossary] = await Promise.all([
        newest ? readOverview(locale, topic, newest.name) : null,
        readGlossary(locale, topic),
      ]);
      return {
        slug: topic,
        title: overview?.title ?? topic,
        description: overview?.description ?? '',
        tags: overview?.tags ?? [],
        versions,
        hasGlossary: glossary !== null,
      };
    })
  );

  return courses
    .filter((course): course is CourseSummary =>
      Boolean(course && course.versions.length > 0)
    )
    .toSorted((a, b) => a.title.localeCompare(b.title, locale));
}

/**
 * One lesson with its Markdown body, or `null` if it does not exist.
 */
export async function getLesson(
  locale: Locale,
  topic: string,
  version: string,
  slug: string
): Promise<Lesson | null> {
  'use cache';
  cacheLife('max');

  if (
    !namePattern.test(topic) ||
    !versionPattern.test(version) ||
    !slugPattern.test(slug)
  ) {
    return null;
  }
  const source = await readOptionalFile(
    path.join(contentRoot, topic, 'course', version, `${slug}.${locale}.md`)
  );
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
  };
}

/**
 * The overview of a course version: `README.&lt;locale>.md`, or `README.en.md`
 * as a fallback.
 */
export async function getCourseOverview(
  locale: Locale,
  topic: string,
  version: string
): Promise<CourseOverview | null> {
  'use cache';
  cacheLife('max');

  return namePattern.test(topic) && versionPattern.test(version)
    ? readOverview(locale, topic, version)
    : null;
}

/**
 * Reads a version README. Its leading `# Heading` (the topic) becomes the
 * title and is removed from the body; the front matter holds `description`
 * and `tags`.
 */
async function readOverview(
  locale: Locale,
  topic: string,
  version: string
): Promise<CourseOverview | null> {
  const names = [...new Set([`README.${locale}.md`, 'README.en.md'])];
  const sources = await Promise.all(
    names.map((name) =>
      readOptionalFile(path.join(contentRoot, topic, 'course', version, name))
    )
  );
  const index = sources.findIndex((source) => source !== null);
  const source = sources[index];
  if (source === undefined || source === null) {
    return null;
  }
  const { data, body } = splitFrontMatter(source);
  const heading = /^\s*# (.+)\r?\n/.exec(body);
  return {
    title: heading?.[1]?.trim(),
    description: data.description ?? '',
    tags: data.tags ?? [],
    body: heading ? body.slice(heading[0].length) : body,
    sourcePath: `learning-materials/${topic}/course/${version}/${names[index]}`,
  };
}

/**
 * The glossary of a topic: `glossary/README.&lt;locale>.md` with the list of
 * its sections, or `null` if the topic has none.
 */
export async function getGlossary(
  locale: Locale,
  topic: string
): Promise<Glossary | null> {
  'use cache';
  cacheLife('max');

  return namePattern.test(topic) ? readGlossary(locale, topic) : null;
}

/**
 * One section of a glossary with its Markdown body, or `null` if it does
 * not exist.
 */
export async function getGlossarySection(
  locale: Locale,
  topic: string,
  slug: string
): Promise<GlossarySection | null> {
  'use cache';
  cacheLife('max');

  return namePattern.test(topic) && glossarySlugPattern.test(slug)
    ? readGlossarySection(locale, topic, slug)
    : null;
}

/**
 * Every `{ lang, topic }` pair with a glossary, for static generation.
 */
export async function getGlossaryParams(): Promise<
  { lang: Locale; topic: string }[]
> {
  const perLocale = await Promise.all(
    locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses
        .filter((course) => course.hasGlossary)
        .map((course) => ({ lang, topic: course.slug }));
    })
  );
  return perLocale.flat();
}

/**
 * Every `{ lang, topic, section }` triple, for static generation.
 */
export async function getGlossarySectionParams(): Promise<
  { lang: Locale; topic: string; section: string }[]
> {
  const pairs = await getGlossaryParams();
  const perPair = await Promise.all(
    pairs.map(async ({ lang, topic }) => {
      const glossary = await getGlossary(lang, topic);
      return (glossary?.sections ?? []).map((section) => ({
        lang,
        topic,
        section: section.slug,
      }));
    })
  );
  return perPair.flat();
}

/**
 * Reads `&lt;base>.&lt;locale>.md`, or `&lt;base>.en.md` as a fallback.
 */
async function readLocalized(
  directory: string,
  base: string,
  locale: Locale
): Promise<{ source: string; name: string } | null> {
  const names = [...new Set([`${base}.${locale}.md`, `${base}.en.md`])];
  const sources = await Promise.all(
    names.map((name) => readOptionalFile(path.join(directory, name)))
  );
  const index = sources.findIndex((source) => source !== null);
  const source = sources[index];
  const name = names[index];
  return source === undefined || source === null || name === undefined
    ? null
    : { source, name };
}

/**
 * Counts the entries of a glossary file: paragraphs that start with a bold
 * term.
 */
function countTerms(body: string): number {
  return body.match(/^\*\*/gm)?.length ?? 0;
}

/**
 * Reads one glossary section. Its front matter holds the title and the
 * description.
 */
async function readGlossarySection(
  locale: Locale,
  topic: string,
  slug: string
): Promise<GlossarySection | null> {
  const file = await readLocalized(
    path.join(contentRoot, topic, 'glossary'),
    slug,
    locale
  );
  if (!file) {
    return null;
  }
  const { data, body } = splitFrontMatter(file.source);
  return {
    slug,
    step: Number(slug.slice(0, 2)),
    title: data.title ?? slug,
    description: data.description ?? '',
    termCount: countTerms(body),
    body,
    sourcePath: `learning-materials/${topic}/glossary/${file.name}`,
  };
}

/**
 * Reads a glossary README and lists its sections. Like a course README, its
 * leading `# Heading` becomes the title and its front matter holds the
 * description.
 */
async function readGlossary(
  locale: Locale,
  topic: string
): Promise<Glossary | null> {
  const directory = path.join(contentRoot, topic, 'glossary');
  const readme = await readLocalized(directory, 'README', locale);
  if (!readme) {
    return null;
  }
  let files: string[] = [];
  try {
    files = await readdir(directory);
  } catch {
    // The glossary folder is missing.
  }
  // A section exists if it has a file in any language.
  const slugs = [
    ...new Set(
      files
        .map((file) => glossaryFilePattern.exec(file))
        .filter((match) => match !== null)
        .map((match) => `${match[1]}-${match[2]}`)
    ),
  ].toSorted((a, b) => a.localeCompare(b, 'en'));
  const read = await Promise.all(
    slugs.map((slug) => readGlossarySection(locale, topic, slug))
  );
  const sections = read
    .filter((section): section is GlossarySection => section !== null)
    .map(({ slug, step, title, description, termCount }) => ({
      slug,
      step,
      title,
      description,
      termCount,
    }));

  const { data, body } = splitFrontMatter(readme.source);
  const heading = /^\s*# (.+)\r?\n/.exec(body);
  return {
    title: heading?.[1]?.trim() ?? data.title,
    description: data.description ?? '',
    body: heading ? body.slice(heading[0].length) : body,
    sections,
    termCount: sections.reduce(
      (sum, section) => sum + section.termCount,
      countTerms(body)
    ),
    sourcePath: `learning-materials/${topic}/glossary/${readme.name}`,
  };
}

/**
 * The repository path of a lesson file, for the "Edit on GitHub" link.
 */
export function getLessonSourcePath(
  locale: Locale,
  topic: string,
  version: string,
  slug: string
): string {
  return `learning-materials/${topic}/course/${version}/${slug}.${locale}.md`;
}

/**
 * Every lesson URL in every language, for static generation, including the
 * `latest` alias of the newest version.
 */
export async function getAllLessonParams(): Promise<
  { lang: Locale; topic: string; version: string; lesson: string }[]
> {
  const perLocale = await Promise.all(
    locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses.flatMap((course) =>
        course.versions.flatMap((version, index) => {
          const segments =
            index === 0 ? [latestVersion, version.name] : [version.name];
          return segments.flatMap((segment) =>
            version.lessons.map((lesson) => ({
              lang,
              topic: course.slug,
              version: segment,
              lesson: lesson.slug,
            }))
          );
        })
      );
    })
  );
  return perLocale.flat();
}
