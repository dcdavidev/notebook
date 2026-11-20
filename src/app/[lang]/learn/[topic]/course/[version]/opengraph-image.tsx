import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { getVersionParams } from '@/lib/course-redirect';
import { findVersion, getCourseOverview, getCourses } from '@/lib/courses';
import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image of every course version in every language.
*/
export async function generateStaticParams() {
  return getVersionParams();
}

/**
Shared image of a course home page: the course title and description.
*/
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; topic: string; version: string }>;
}) {
  const { lang, topic, version } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const course = courses.find((item) => item.slug === topic);
  const versionData = findVersion(course?.versions ?? [], version);
  if (!course || !versionData) {
    notFound();
  }
  const overview = await getCourseOverview(lang, topic, versionData.name);

  return renderOgImage({
    eyebrow: `${t('overview')} · ${versionData.name}`,
    title: overview?.title ?? course.title,
    description: overview?.description || course.description,
    meta: t('lessonCount', { count: versionData.lessons.length }),
  });
}
