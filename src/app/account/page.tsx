import type { Metadata } from 'next';

import {
  AccountPage,
  type CourseTitles,
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
  // Course titles in every language, for the list of favorites.
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const courses = await getCourses(locale);
      return [
        locale,
        Object.fromEntries(courses.map(({ slug, title }) => [slug, title])),
      ] as const;
    })
  );
  return (
    <AccountPage courseTitles={Object.fromEntries(entries) as CourseTitles} />
  );
}
