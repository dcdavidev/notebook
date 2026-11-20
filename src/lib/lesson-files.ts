import 'server-only';

import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { strToU8, type Zippable, zipSync } from 'fflate';

import packageJson from '../../package.json';

import {
  findVersion,
  getCourseOverview,
  getCourses,
  getLesson,
} from '@/lib/courses';
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
 * Every lesson of a course version in one ZIP file, in one format. The
 * files sit in a folder named after the course and version, and keep the
 * step number in their names, so they sort in order. The Markdown archive
 * also holds the course overview as `README.md`.
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

  const zip = zipSync(
    { [folder]: [files, { mtime: archiveDate }] },
    { level: 9 }
  );
  return {
    file: new Uint8Array(zip),
    name: `${folder}-${format === 'pdf' ? 'pdf' : 'md'}.zip`,
  };
}
