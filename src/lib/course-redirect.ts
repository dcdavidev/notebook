import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { coursePath, latestEdition } from '@/lib/course-paths';
import { findEdition, getCourses } from '@/lib/courses';

/**
 * Redirects to the first lesson of a course edition. Without an edition it
 * opens `latest`, the alias of the newest one.
 */
export async function redirectToFirstLesson(
  lang: string,
  topic: string,
  edition: string = latestEdition
): Promise<never> {
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const courses = await getCourses(lang);
  const editions = courses.find((item) => item.slug === topic)?.editions ?? [];
  const first = findEdition(editions, edition)?.lessons[0];
  if (!first) {
    notFound();
  }
  redirect(`/${lang}${coursePath(topic, edition, first.slug)}`);
}

/**
 * Redirects to the course home page of an edition, the newest one by
 * default.
 */
export async function redirectToOverview(
  lang: string,
  topic: string,
  edition: string = latestEdition
): Promise<never> {
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const courses = await getCourses(lang);
  const editions = courses.find((item) => item.slug === topic)?.editions ?? [];
  if (!findEdition(editions, edition)) {
    notFound();
  }
  redirect(`/${lang}${coursePath(topic, edition)}`);
}

/**
 * Every `{ lang, topic }` pair, for static generation of the redirects.
 */
export async function getTopicParams(): Promise<
  { lang: string; topic: string }[]
> {
  const perLocale = await Promise.all(
    routing.locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses.map((item) => ({ lang, topic: item.slug }));
    })
  );
  return perLocale.flat();
}
