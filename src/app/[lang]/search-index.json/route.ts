import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getSearchIndex } from '@/lib/search-index';

/**
Prerenders the search index of every language.
*/
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

/**
 * Serves the search index of one language as JSON. The search field loads
 * it the first time it opens and searches it in the browser.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<'/[lang]/search-index.json'>
) {
  const { lang } = await params;
  return hasLocale(routing.locales, lang)
    ? Response.json(await getSearchIndex(lang))
    : new Response('Not found', { status: 404 });
}
