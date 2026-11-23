import type { Locale } from '@/lib/locale';
import type { SearchEngine } from '@/lib/search';
import type { SearchIndexData } from '@/lib/search-types';

/**
The search engine of each language, loaded once per visit.
*/
const engines = new Map<Locale, Promise<SearchEngine>>();

/**
Downloads the search index of a language.
*/
async function fetchIndex(locale: Locale): Promise<SearchIndexData> {
  const response = await fetch(`/${locale}/search-index.json`);
  if (!response.ok) {
    throw new Error(`Search index: HTTP ${response.status}`);
  }
  return (await response.json()) as SearchIndexData;
}

/**
 * Downloads the index and the search library, and builds the engine. A
 * failed load is forgotten, so the next attempt tries again.
 */
async function createEngine(locale: Locale): Promise<SearchEngine> {
  try {
    const [{ createSearchEngine }, data] = await Promise.all([
      import('@/lib/search'),
      fetchIndex(locale),
    ]);
    return createSearchEngine(data);
  } catch (error) {
    engines.delete(locale);
    throw error;
  }
}

/**
 * The search engine of a language. The search library loads with the
 * index, so pages that never search skip both.
 */
export function loadSearchEngine(locale: Locale): Promise<SearchEngine> {
  let engine = engines.get(locale);
  if (!engine) {
    engine = createEngine(locale);
    engines.set(locale, engine);
  }
  return engine;
}
