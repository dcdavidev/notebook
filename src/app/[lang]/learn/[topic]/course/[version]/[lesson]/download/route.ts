import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import {
  findVersion,
  getAllLessonParams,
  getCourses,
  getLesson,
} from '@/lib/courses';

/**
Prerenders the Markdown file of every lesson in every language.
*/
export async function generateStaticParams() {
  return getAllLessonParams();
}

/**
 * Serves a lesson as a Markdown file to save: its title and description
 * as a heading and a lead paragraph, followed by the body.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<'/[lang]/learn/[topic]/course/[version]/[lesson]/download'>
) {
  const { lang, topic, version, lesson } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return new Response('Not found', { status: 404 });
  }
  const courses = await getCourses(lang);
  const course = courses.find((item) => item.slug === topic);
  const versionData = findVersion(course?.versions ?? [], version);
  const data = versionData
    ? await getLesson(lang, topic, versionData.name, lesson)
    : null;
  if (!data) {
    return new Response('Not found', { status: 404 });
  }

  const parts = [`# ${data.title}`, data.description, data.body.trim()];
  const file = `${parts.filter(Boolean).join('\n\n')}\n`;
  return new Response(file, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${data.slug}.${lang}.md"`,
    },
  });
}
