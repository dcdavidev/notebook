import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getAllLessonParams } from '@/lib/courses';
import { getLessonPdf } from '@/lib/lesson-files';

/**
Prerenders the PDF of every lesson in every language.
*/
export async function generateStaticParams() {
  return getAllLessonParams();
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
    ? await getLessonPdf(lang, topic, version, lesson)
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
