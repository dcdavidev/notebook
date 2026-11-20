import { cacheLife } from 'next/cache';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import packageJson from '../../../../../../../../../package.json';

import { routing } from '@/i18n/routing';
import {
  findVersion,
  getAllLessonParams,
  getCourses,
  getLesson,
} from '@/lib/courses';
import { renderLessonPdf } from '@/lib/lesson-pdf';
import type { Locale } from '@/lib/locale';

/**
Prerenders the PDF of every lesson in every language.
*/
export async function generateStaticParams() {
  return getAllLessonParams();
}

/**
 * Renders the PDF of one lesson, or returns `null` if the lesson does not
 * exist. The PDF records its creation time, so the result is cached to
 * prerender it once.
 */
async function buildPdf(
  lang: Locale,
  topic: string,
  version: string,
  lesson: string
): Promise<{ file: Uint8Array<ArrayBuffer>; name: string } | null> {
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
 * Serves a lesson as an A4 PDF to save or print.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<'/[lang]/learn/[topic]/course/[version]/[lesson]/pdf'>
) {
  const { lang, topic, version, lesson } = await params;
  const pdf = hasLocale(routing.locales, lang)
    ? await buildPdf(lang, topic, version, lesson)
    : null;
  if (!pdf) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(pdf.file, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdf.name}"`,
    },
  });
}
