import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import {
  findVersion,
  getAllLessonParams,
  getCourses,
  getLesson,
} from '@/lib/courses';
import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image of every lesson of every version in every language.
*/
export async function generateStaticParams() {
  return getAllLessonParams();
}

/**
Shared image of a lesson: its title and description, under the course name.
*/
export default async function Image({
  params,
}: {
  params: Promise<{
    lang: string;
    topic: string;
    version: string;
    lesson: string;
  }>;
}) {
  const { lang, topic, version, lesson } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
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
    notFound();
  }
  const index = versionData.lessons.findIndex((item) => item.slug === lesson);

  return renderOgImage({
    eyebrow: `${course.title} · ${versionData.name}`,
    title: data.title,
    description: data.description,
    meta: t('lessonOf', { step: index + 1, total: versionData.lessons.length }),
  });
}
