import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { findVersion, getCourses, latestVersion } from '@/lib/courses';

/**
 * Redirects to the first lesson of a course version. Without a version it
 * opens `latest`, the alias of the newest `vN`.
 */
export async function redirectToFirstLesson(
  lang: string,
  topic: string,
  version: string = latestVersion
): Promise<never> {
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const courses = await getCourses(lang);
  const versions = courses.find((item) => item.slug === topic)?.versions ?? [];
  const first = findVersion(versions, version)?.lessons[0];
  if (!first) {
    notFound();
  }
  redirect(`/${lang}/learn/${topic}/course/${version}/${first.slug}`);
}

/**
 * Redirects to the course home page of the newest version.
 */
export async function redirectToOverview(
  lang: string,
  topic: string
): Promise<never> {
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const courses = await getCourses(lang);
  if (courses.every((item) => item.slug !== topic)) {
    notFound();
  }
  redirect(`/${lang}/learn/${topic}/course/${latestVersion}`);
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

/**
 * Every `{ lang, topic, version }` triple, for static generation.
 */
export async function getVersionParams(): Promise<
  { lang: string; topic: string; version: string }[]
> {
  const perLocale = await Promise.all(
    routing.locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses.flatMap((item) =>
        [latestVersion, ...item.versions.map((version) => version.name)].map(
          (version) => ({ lang, topic: item.slug, version })
        )
      );
    })
  );
  return perLocale.flat();
}
