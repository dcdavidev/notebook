import { getTopicParams, redirectToOverview } from '@/lib/course-redirect';

/**
Prerenders the redirect of every course in every language.
*/
export async function generateStaticParams() {
  return getTopicParams();
}

/**
 * It only redirects, so there is no UI to validate for instant navigation.
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

/**
 * `/<lang>/learn/<topic>/course` opens the course home page of the newest version.
 */
export default async function CoursePage({
  params,
}: PageProps<'/[lang]/learn/[topic]/course'>) {
  const { lang, topic } = await params;
  return redirectToOverview(lang, topic);
}
