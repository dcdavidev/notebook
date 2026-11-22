import { redirectToOverview } from '@/lib/course-redirect';
import { getEditionParams } from '@/lib/courses';

/**
Prerenders the redirect of every course edition in every language.
*/
export async function generateStaticParams() {
  return getEditionParams();
}

/**
 * It only redirects, so there is no UI to validate for instant navigation.
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

/**
 * `/<lang>/learn/<topic>/<edition>` opens the course home page of the
 * edition.
 */
export default async function EditionPage({
  params,
}: PageProps<'/[lang]/learn/[topic]/[edition]'>) {
  const { lang, topic, edition } = await params;
  return redirectToOverview(lang, topic, edition);
}
