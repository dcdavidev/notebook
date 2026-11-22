import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getAllLessonParams } from '@/lib/courses';
import { getLessonMarkdown } from '@/lib/lesson-files';

/**
Prerenders the Markdown file of every lesson in every language.
*/
export async function generateStaticParams() {
  return getAllLessonParams();
}

/**
 * Serves a lesson as a Markdown file to save.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<'/[lang]/learn/[topic]/[edition]/course/[lesson]/download'>
) {
  const { lang, topic, edition, lesson } = await params;
  const markdown = hasLocale(routing.locales, lang)
    ? await getLessonMarkdown(lang, topic, edition, lesson)
    : null;
  if (!markdown) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(markdown.file, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${markdown.name}"`,
    },
  });
}
