import MiniSearch from 'minisearch';

import type {
  SearchIndexData,
  SearchPage,
  SearchSection,
} from '@/lib/search-types';

/**
Words too common to help a search, in both languages.
*/
const stopWords = new Set([
  'a',
  'an',
  'and',
  'in',
  'is',
  'of',
  'or',
  'the',
  'to',
  'con',
  'da',
  'del',
  'della',
  'di',
  'e',
  'gli',
  'il',
  'la',
  'le',
  'lo',
  'per',
  'su',
  'un',
  'una',
]);

/**
 * Lowercases a text and strips its accents, one character at a time, so
 * the result has the same length and its positions match the original.
 */
export function foldText(text: string): string {
  let folded = '';
  for (const char of text) {
    const plain = char.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase();
    // Keep the length when a character folds to more or fewer units.
    folded += plain.length === char.length ? plain : char;
  }
  return folded;
}

/**
Normalizes a word for the index and the queries; drops common words.
*/
function processTerm(term: string): string | null {
  const folded = foldText(term);
  return folded && !stopWords.has(folded) ? folded : null;
}

/**
One searchable section: its page's fields and its own.
*/
interface SearchDocument {
  id: number;
  title: string;
  heading: string;
  description: string;
  text: string;
  code: string;
}

export interface SearchEngine {
  data: SearchIndexData;
  index: MiniSearch<SearchDocument>;
}

/**
 * Builds the search engine from the index of one language. Each section
 * carries the title of its page; only the first one carries the
 * description, so a match there opens the page at the top.
 */
export function createSearchEngine(data: SearchIndexData): SearchEngine {
  const index = new MiniSearch<SearchDocument>({
    fields: ['title', 'heading', 'description', 'text', 'code'],
    processTerm,
    searchOptions: {
      boost: { title: 6, heading: 3, description: 2, text: 1, code: 0.3 },
      prefix: (term) => term.length > 1,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
    },
  });
  const firstSection = new Set<number>();
  index.addAll(
    data.sections.map((section, id) => {
      const page = data.pages[section.page];
      const isFirst = !firstSection.has(section.page);
      firstSection.add(section.page);
      return {
        id,
        title: page?.title ?? '',
        heading: section.heading ?? '',
        description: isFirst ? (page?.description ?? '') : '',
        text: section.text,
        code: section.code,
      };
    })
  );
  return { data, index };
}

/**
A piece of a snippet, highlighted when it matches the query.
*/
export interface SnippetPart {
  text: string;
  match: boolean;
  /**
  Position of the part in the snippet, unique among its parts.
  */
  start: number;
}

export interface SearchResult {
  /**
  Index of the best section, unique in a result list.
  */
  id: number;
  page: SearchPage;
  /**
  The section the snippet comes from.
  */
  section: SearchSection;
  /**
  Whether the heading of the section matched more words of the query than
  the page title: then the link opens the page at that heading.
  */
  isHeadingMatch: boolean;
  /**
  Path of the page, with the anchor of the heading when it matched.
  */
  href: string;
  snippet: SnippetPart[];
}

const snippetLength = 160;

/**
 * Splits a text into plain and highlighted parts: every word that starts
 * with one of the matched terms is highlighted.
 */
export function highlight(text: string, terms: string[]): SnippetPart[] {
  const escaped = terms
    .filter(Boolean)
    .toSorted((a, b) => b.length - a.length)
    .map((term) => term.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`));
  if (escaped.length === 0) {
    return [{ text, match: false, start: 0 }];
  }
  const pattern = new RegExp(
    String.raw`(?<![\p{L}\p{N}])(?:${escaped.join('|')})[\p{L}\p{N}]*`,
    'gu'
  );
  const parts: SnippetPart[] = [];
  let last = 0;
  for (const found of foldText(text).matchAll(pattern)) {
    const start = found.index;
    const end = start + found[0].length;
    if (start > last) {
      parts.push({ text: text.slice(last, start), match: false, start: last });
    }
    parts.push({ text: text.slice(start, end), match: true, start });
    last = end;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), match: false, start: last });
  }
  return parts;
}

/**
 * A short piece of a text around the first matched term, or its start.
 */
function snippet(text: string, terms: string[]): SnippetPart[] {
  const folded = foldText(text);
  const first = Math.min(
    ...terms
      .map((term) => {
        const found = new RegExp(
          String.raw`(?<![\p{L}\p{N}])${term.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}`,
          'u'
        ).exec(folded);
        return found ? found.index : Infinity;
      })
      .filter((position) => Number.isFinite(position))
  );
  let start = Number.isFinite(first) ? Math.max(0, first - 50) : 0;
  if (start > 0) {
    // Start at a word.
    const space = text.indexOf(' ', start);
    start = space === -1 || space > first ? start : space + 1;
  }
  let end = Math.min(text.length, start + snippetLength);
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    end = space > start ? space : end;
  }
  const piece = `${start > 0 ? '… ' : ''}${text.slice(start, end)}${end < text.length ? ' …' : ''}`;
  return highlight(piece, terms);
}

const maxResults = 20;

/**
 * Searches the index. Every word must match, by prefix or with a typo
 * (one in words of five letters or more, two from eight letters); if no
 * page has them all, any word is enough. Each page appears once, at its
 * best section; among sections that score the same, the first one
 * wins. The link opens the page at the heading of that section only when
 * the heading matched more words than the page title.
 */
export function search(engine: SearchEngine, query: string): SearchResult[] {
  if (!query.trim()) {
    return [];
  }
  let hits = engine.index.search(query, { combineWith: 'AND' });
  if (hits.length === 0) {
    hits = engine.index.search(query, { combineWith: 'OR' });
  }

  const best = new Map<
    number,
    {
      id: number;
      score: number;
      terms: string[];
      match: Record<string, string[]>;
    }
  >();
  for (const hit of hits) {
    const id = hit.id as number;
    const section = engine.data.sections[id];
    if (!section) {
      continue;
    }
    const current = best.get(section.page);
    // Scores within 1% count as equal: the earlier section wins.
    if (
      !current ||
      hit.score > current.score * 1.01 ||
      (hit.score >= current.score * 0.99 && id < current.id)
    ) {
      best.set(section.page, {
        id,
        score: hit.score,
        terms: hit.terms,
        match: hit.match,
      });
    }
  }

  const results: (SearchResult & { score: number })[] = [];
  for (const [pageIndex, { id, score, terms, match }] of best) {
    const page = engine.data.pages[pageIndex];
    const section = engine.data.sections[id];
    if (!page || !section) {
      continue;
    }
    // The heading must match more words than the page title, or the top
    // of the page is the better place to open.
    const fields = Object.values(match);
    const count = (field: string) =>
      fields.filter((matched) => matched.includes(field)).length;
    const isHeadingMatch =
      section.anchor !== undefined && count('heading') > count('title');
    results.push({
      id,
      score,
      page,
      section,
      isHeadingMatch,
      href: isHeadingMatch ? `${page.path}#${section.anchor}` : page.path,
      snippet: snippet(section.text || page.description || section.code, terms),
    });
  }
  return results.toSorted((a, b) => b.score - a.score).slice(0, maxResults);
}
