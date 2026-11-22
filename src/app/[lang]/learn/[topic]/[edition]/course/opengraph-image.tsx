import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import {
  findEdition,
  getCourseOverview,
  getCourses,
  getEditionParams,
} from '@/lib/courses';
import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image of every course edition in every language.
*/
export async function generateStaticParams() {
  return getEditionParams();
}

/**
Shared image of a course home page: the course title and description.
*/
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; topic: string; edition: string }>;
}) {
  const { lang, topic, edition } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const course = courses.find((item) => item.slug === topic);
  const editionData = findEdition(course?.editions ?? [], edition);
  if (!course || !editionData) {
    notFound();
  }
  const overview = await getCourseOverview(lang, topic, editionData.name);

  return renderOgImage({
    eyebrow: `${t('overview')} · ${editionData.label}`,
    title: overview?.title ?? course.title,
    description: overview?.description || course.description,
    meta: t('lessonCount', { count: editionData.lessons.length }),
  });
}
