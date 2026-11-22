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
 * `/<lang>/learn/<topic>` opens the course home page of the newest edition.
 */
export default async function TopicPage({
  params,
}: PageProps<'/[lang]/learn/[topic]'>) {
  const { lang, topic } = await params;
  return redirectToOverview(lang, topic);
}
