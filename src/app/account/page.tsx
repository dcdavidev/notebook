import type { Metadata } from 'next';

import {
  AccountPage,
  type CourseTitles,
  type LessonTitles,
} from '@/components/account/account-page';
import { getCourses } from '@/lib/courses';
import { locales } from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Account · Notebook',
  robots: { index: false },
};

/**
 * Account page. It has no language in the URL: the browser picks the
 * saved language, and all account data loads in the browser, so the page
 * itself stays static.
 */
export default async function Page() {
  // Course and lesson titles in every language, for the lists of
  // favorites and bookmarks.
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const courses = await getCourses(locale);
      const lessons = courses.flatMap(({ slug, versions }) =>
        versions.flatMap(({ name, lessons: items }) =>
          items.map((item) => [`${slug}/${name}/${item.slug}`, item.title])
        )
      );
      return {
        locale,
        courses: Object.fromEntries(
          courses.map(({ slug, title }) => [slug, title])
        ),
        lessons: Object.fromEntries(lessons) as Record<string, string>,
      };
    })
  );
  return (
    <AccountPage
      courseTitles={
        Object.fromEntries(
          entries.map(({ locale, courses }) => [locale, courses])
        ) as CourseTitles
      }
      lessonTitles={
        Object.fromEntries(
          entries.map(({ locale, lessons }) => [locale, lessons])
        ) as LessonTitles
      }
    />
  );
}
