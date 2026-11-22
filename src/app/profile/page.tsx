import type { Metadata } from 'next';

import {
  type ProfileData,
  ProfilePage,
} from '@/components/profile/profile-page';
import { getCourses } from '@/lib/courses';
import { type Locale, locales } from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Profile · Notebook',
  robots: { index: false },
};

/**
 * Public-facing profile of the signed-in visitor: badges, progress,
 * favorites, and bookmarks. Like `/account`, it has no language in the URL
 * and loads the account data in the browser, so it stays static.
 */
export default async function Page() {
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const courses = await getCourses(locale);
      const lessonTitles = Object.fromEntries(
        courses.flatMap(({ slug, versions }) =>
          versions.flatMap(({ name, lessons }) =>
            lessons.map((item) => [`${slug}/${name}/${item.slug}`, item.title])
          )
        )
      ) as Record<string, string>;
      const courseTitles = Object.fromEntries(
        courses.map(({ slug, title }) => [slug, title])
      );
      return [locale, { courses, courseTitles, lessonTitles }] as const;
    })
  );
  return (
    <ProfilePage
      data={Object.fromEntries(entries) as Record<Locale, ProfileData>}
    />
  );
}
