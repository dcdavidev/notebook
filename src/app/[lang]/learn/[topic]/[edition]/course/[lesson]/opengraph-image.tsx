import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import {
  findEdition,
  getAllLessonParams,
  getCourses,
  getLesson,
} from '@/lib/courses';
import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image of every lesson of every edition in every language.
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
    edition: string;
    lesson: string;
  }>;
}) {
  const { lang, topic, edition, lesson } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const course = courses.find((item) => item.slug === topic);
  const editionData = findEdition(course?.editions ?? [], edition);
  const data = editionData
    ? await getLesson(lang, topic, editionData.name, lesson)
    : null;
  if (!course || !editionData || !data) {
    notFound();
  }
  const index = editionData.lessons.findIndex((item) => item.slug === lesson);

  return renderOgImage({
    eyebrow: `${course.title} · ${editionData.label}`,
    title: data.title,
    description: data.description,
    meta: t('lessonOf', { step: index + 1, total: editionData.lessons.length }),
  });
}
