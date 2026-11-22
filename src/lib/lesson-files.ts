import 'server-only';

import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { strToU8, type Zippable, zipSync } from 'fflate';

import packageJson from '../../package.json';

import {
  findVersion,
  getCourseOverview,
  getCourses,
  getGlossary,
  getGlossarySection,
  getLesson,
} from '@/lib/courses';
import { createGlossaryHrefResolver } from '@/lib/glossary-links';
import { renderLessonPdf } from '@/lib/lesson-pdf';
import type { Locale } from '@/lib/locale';

/**
A file to download: its bytes or text, and its name.
*/
export interface DownloadFile<T> {
  file: T;
  name: string;
}

export type ArchiveFormat = 'markdown' | 'pdf';

export const archiveFormats: readonly ArchiveFormat[] = ['markdown', 'pdf'];

/**
 * Fixed modification time of the files in the archives, so the same
 * course always produces the same archive.
 */
const archiveDate = new Date('2026-01-01T00:00:00Z');

/**
 * A lesson as a Markdown file: its title and description as a heading
 * and a lead paragraph, followed by the body.
 */
export async function getLessonMarkdown(
  lang: Locale,
  topic: string,
  version: string,
  lesson: string
): Promise<DownloadFile<string> | null> {
  const courses = await getCourses(lang);
  const course = courses.find((item) => item.slug === topic);
  const versionData = findVersion(course?.versions ?? [], version);
  const data = versionData
    ? await getLesson(lang, topic, versionData.name, lesson)
    : null;
  if (!data) {
    return null;
  }
  const parts = [`# ${data.title}`, data.description, data.body.trim()];
  return {
    file: `${parts.filter(Boolean).join('\n\n')}\n`,
    name: `${data.slug}.${lang}.md`,
  };
}

/**
 * A lesson as an A4 PDF. The PDF records its creation time, so the result
 * is cached to prerender it once.
 */
export async function getLessonPdf(
  lang: Locale,
  topic: string,
  version: string,
  lesson: string
): Promise<DownloadFile<Uint8Array<ArrayBuffer>> | null> {
  'use cache';
  cacheLife('max');

  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const course = courses.find((item) => item.slug === topic);
  const versionData = findVersion(course?.versions ?? [], version);
  const data = versionData
    ? await getLesson(lang, topic, versionData.name, lesson)
    : null;
  if (!course || !versionData || !data) {
    return null;
  }

  const index = versionData.lessons.findIndex((item) => item.slug === lesson);
  const baseUrl = new URL(
    `/${lang}/learn/${topic}/course/${version}`,
    packageJson.homepage
  ).href;
  const pdf = await renderLessonPdf({
    locale: lang,
    title: data.title,
    description: data.description,
    body: data.body,
    meta: [
      course.title,
      versionData.name,
      t('lessonOf', { step: index + 1, total: versionData.lessons.length }),
    ].join(' · '),
    url: `${baseUrl}/${lesson}`,
    baseUrl,
    pageLabel: (page, total) => t('pdfPage', { page, total }),
  });
  return { file: new Uint8Array(pdf), name: `${data.slug}.${lang}.pdf` };
}

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
 * Makes the links of a glossary file absolute URLs of the site, so they
 * work outside it.
 */
function absoluteGlossaryResolver(lang: Locale, topic: string) {
  const toSitePath = createGlossaryHrefResolver(lang, topic);
  return (href: string): string => {
    const target = toSitePath(href);
    return target.startsWith('/')
      ? new URL(target, packageJson.homepage).href
      : target;
  };
}

/**
 * The whole glossary of a topic as one Markdown text: the title, then
 * every section with its heading and its terms. `null` if the topic has no
 * glossary.
 */
async function buildGlossaryMarkdown(
  lang: Locale,
  topic: string,
  resolve: (href: string) => string
): Promise<{
  title: string;
  description: string;
  body: string;
  termCount: number;
} | null> {
  const glossary = await getGlossary(lang, topic);
  if (!glossary) {
    return null;
  }
  const sections = await Promise.all(
    glossary.sections.map((item) => getGlossarySection(lang, topic, item.slug))
  );
  const parts = sections.flatMap((section) =>
    section
      ? [
          `## ${section.title}`,
          section.description,
          rewriteLinks(section.body.trim(), resolve),
        ].filter(Boolean)
      : []
  );
  const t = await getTranslations({ locale: lang, namespace: 'Learn' });
  return {
    title: glossary.title ?? t('glossary'),
    description: glossary.description,
    body: parts.join('\n\n'),
    termCount: glossary.termCount,
  };
}

/**
 * The glossary of a topic as one Markdown file, with absolute links to the
 * lessons.
 */
export async function getGlossaryMarkdown(
  lang: Locale,
  topic: string
): Promise<DownloadFile<string> | null> {
  const data = await buildGlossaryMarkdown(
    lang,
    topic,
    absoluteGlossaryResolver(lang, topic)
  );
  if (!data) {
    return null;
  }
  const parts = [`# ${data.title}`, data.description, data.body];
  return {
    file: `${parts.filter(Boolean).join('\n\n')}\n`,
    name: `${topic}-glossary.${lang}.md`,
  };
}

/**
 * The glossary of a topic as an A4 PDF. Cached, like the lesson PDFs, to
 * prerender it once.
 */
export async function getGlossaryPdf(
  lang: Locale,
  topic: string
): Promise<DownloadFile<Uint8Array<ArrayBuffer>> | null> {
  'use cache';
  cacheLife('max');

  const [courses, t, data] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
    buildGlossaryMarkdown(lang, topic, absoluteGlossaryResolver(lang, topic)),
  ]);
  const course = courses.find((item) => item.slug === topic);
  if (!course || !data) {
    return null;
  }

  const url = new URL(`/${lang}/learn/${topic}/glossary`, packageJson.homepage)
    .href;
  const pdf = await renderLessonPdf({
    locale: lang,
    title: data.title,
    description: data.description,
    body: data.body,
    meta: [
      course.title,
      t('glossaryTermCount', { count: data.termCount }),
    ].join(' · '),
    url,
    baseUrl: url,
    pageLabel: (page, total) => t('pdfPage', { page, total }),
  });
  return { file: new Uint8Array(pdf), name: `${topic}-glossary.${lang}.pdf` };
}

/**
 * One section of a glossary as an A4 PDF, cached to prerender it once.
 */
async function getGlossarySectionPdf(
  lang: Locale,
  topic: string,
  slug: string
): Promise<DownloadFile<Uint8Array<ArrayBuffer>> | null> {
  'use cache';
  cacheLife('max');

  const [glossary, section, t] = await Promise.all([
    getGlossary(lang, topic),
    getGlossarySection(lang, topic, slug),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  if (!glossary || !section) {
    return null;
  }

  const index = glossary.sections.findIndex((item) => item.slug === slug);
  const url = new URL(
    `/${lang}/learn/${topic}/glossary/${slug}`,
    packageJson.homepage
  ).href;
  const pdf = await renderLessonPdf({
    locale: lang,
    title: section.title,
    description: section.description,
    body: rewriteLinks(section.body, absoluteGlossaryResolver(lang, topic)),
    meta: [
      glossary.title ?? t('glossary'),
      t('glossarySectionOf', {
        step: index + 1,
        total: glossary.sections.length,
      }),
      t('glossaryTermCount', { count: section.termCount }),
    ].join(' · '),
    url,
    baseUrl: url,
    pageLabel: (page, total) => t('pdfPage', { page, total }),
  });
  return { file: new Uint8Array(pdf), name: `${slug}.${lang}.pdf` };
}

/**
 * The glossary of a topic in one ZIP file, one file per section. The
 * Markdown archive also holds the index as `README.md`; links between the
 * files of the archive stay relative, links to lessons become absolute.
 */
export async function getGlossaryArchive(
  lang: Locale,
  topic: string,
  format: ArchiveFormat
): Promise<DownloadFile<Uint8Array<ArrayBuffer>> | null> {
  'use cache';
  cacheLife('max');

  const glossary = await getGlossary(lang, topic);
  if (!glossary) {
    return null;
  }

  const folder = `${topic}-glossary-${lang}`;
  const files: Zippable = {};
  if (format === 'pdf') {
    // One section at a time, like the course archive, to save memory.
    for (const item of glossary.sections) {
      const pdf = await getGlossarySectionPdf(lang, topic, item.slug);
      if (pdf) {
        files[pdf.name] = [pdf.file, { level: 0, mtime: archiveDate }];
      }
    }
  } else {
    const toAbsolute = absoluteGlossaryResolver(lang, topic);
    const sectionNames = new Set(
      glossary.sections.map((item) => `${item.slug}.${lang}.md`)
    );
    const resolve = (href: string): string => {
      const [file = '', hash] = href.replace(/^\.\//, '').split('#', 2);
      if (sectionNames.has(file)) {
        return href;
      }
      if (file === `README.${lang}.md`) {
        return `./README.md${hash === undefined ? '' : `#${hash}`}`;
      }
      return toAbsolute(href);
    };
    const t = await getTranslations({ locale: lang, namespace: 'Learn' });
    const index = [
      `# ${glossary.title ?? t('glossary')}`,
      rewriteLinks(glossary.body.trim(), resolve),
    ];
    files['README.md'] = [
      strToU8(`${index.join('\n\n')}\n`),
      { mtime: archiveDate },
    ];
    const sections = await Promise.all(
      glossary.sections.map((item) =>
        getGlossarySection(lang, topic, item.slug)
      )
    );
    for (const section of sections) {
      if (!section) {
        continue;
      }
      const parts = [
        `# ${section.title}`,
        section.description,
        rewriteLinks(section.body.trim(), resolve),
      ];
      files[`${section.slug}.${lang}.md`] = [
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
    name: `${folder}-${format === 'pdf' ? 'pdf' : 'md'}.zip`,
  };
}

/**
 * Every lesson of a course version in one ZIP file, in one format. The
 * files sit in a folder named after the course and version, and keep the
 * step number in their names, so they sort in order. The Markdown archive
 * also holds the course overview as `README.md`. When the topic has a
 * glossary, the archive holds it too, as `glossary.&lt;lang>.md` or `.pdf`;
 * in Markdown, its links to lessons of the same version point to the files
 * next to it.
 */
export async function getCourseArchive(
  lang: Locale,
  topic: string,
  version: string,
  format: ArchiveFormat
): Promise<DownloadFile<Uint8Array<ArrayBuffer>> | null> {
  // Cached so the archive is prerendered once. Rendering every PDF takes a
  // while, hence the longer `staticPageGenerationTimeout` in the Next.js
  // configuration: cached functions may run for 90% of it.
  'use cache';
  cacheLife('max');

  const courses = await getCourses(lang);
  const course = courses.find((item) => item.slug === topic);
  const versionData = findVersion(course?.versions ?? [], version);
  if (!course || !versionData) {
    return null;
  }

  const folder = `${topic}-${versionData.name}-${lang}`;
  const files: Zippable = {};
  if (format === 'markdown') {
    const overview = await getCourseOverview(lang, topic, versionData.name);
    if (overview) {
      const title = overview.title ?? course.title;
      files['README.md'] = [
        strToU8(`# ${title}\n\n${overview.body.trim()}\n`),
        { mtime: archiveDate },
      ];
    }
  }
  // One lesson at a time: rendering every PDF at once uses a lot of memory.
  for (const lesson of versionData.lessons) {
    if (format === 'pdf') {
      const pdf = await getLessonPdf(
        lang,
        topic,
        versionData.name,
        lesson.slug
      );
      if (pdf) {
        // PDFs are already compressed.
        files[pdf.name] = [pdf.file, { level: 0, mtime: archiveDate }];
      }
    } else {
      const markdown = await getLessonMarkdown(
        lang,
        topic,
        versionData.name,
        lesson.slug
      );
      if (markdown) {
        files[markdown.name] = [strToU8(markdown.file), { mtime: archiveDate }];
      }
    }
  }

  if (course.hasGlossary) {
    if (format === 'pdf') {
      const pdf = await getGlossaryPdf(lang, topic);
      if (pdf) {
        files[`glossary.${lang}.pdf`] = [
          pdf.file,
          { level: 0, mtime: archiveDate },
        ];
      }
    } else {
      const toAbsolute = absoluteGlossaryResolver(lang, topic);
      const lessons = new Set(versionData.lessons.map((item) => item.slug));
      // `../course/<version>/<lesson>.<lang>.md` of this version: the file
      // next to the glossary in the archive.
      const sameVersion = new RegExp(
        String.raw`^\.\./course/${versionData.name}/(\d{4}-[a-z\d-]+)\.[a-z]{2}\.md(#.*)?$`
      );
      const data = await buildGlossaryMarkdown(lang, topic, (href) => {
        const match = sameVersion.exec(href);
        return match?.[1] && lessons.has(match[1])
          ? `./${match[1]}.${lang}.md${match[2] ?? ''}`
          : toAbsolute(href);
      });
      if (data) {
        const parts = [`# ${data.title}`, data.description, data.body];
        files[`glossary.${lang}.md`] = [
          strToU8(`${parts.filter(Boolean).join('\n\n')}\n`),
          { mtime: archiveDate },
        ];
      }
    }
  }

  const zip = zipSync(
    { [folder]: [files, { mtime: archiveDate }] },
    { level: 9 }
  );
  return {
    file: new Uint8Array(zip),
    name: `${folder}-${format === 'pdf' ? 'pdf' : 'md'}.zip`,
  };
}
