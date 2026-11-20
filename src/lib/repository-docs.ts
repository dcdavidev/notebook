import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cacheLife } from 'next/cache';

import type { Locale } from '@/lib/locale';

/**
 * Repository documents shown on the site, by repository path. English is
 * the original; the `.it.md` files are the Italian translations. Each reader
 * uses a literal path so the bundler traces only these files, not the
 * whole project.
 */
const readers = {
  'CONTRIBUTING.md': () =>
    readFile(path.join(process.cwd(), 'CONTRIBUTING.md'), 'utf8'),
  'docs/contributing/CONTRIBUTING.it.md': () =>
    readFile(
      path.join(process.cwd(), 'docs', 'contributing', 'CONTRIBUTING.it.md'),
      'utf8'
    ),
  'learning-materials/README.md': () =>
    readFile(
      path.join(process.cwd(), 'learning-materials', 'README.md'),
      'utf8'
    ),
  'learning-materials/README.it.md': () =>
    readFile(
      path.join(process.cwd(), 'learning-materials', 'README.it.md'),
      'utf8'
    ),
  'docs/legal/privacy.en.md': () =>
    readFile(
      path.join(process.cwd(), 'docs', 'legal', 'privacy.en.md'),
      'utf8'
    ),
  'docs/legal/privacy.it.md': () =>
    readFile(
      path.join(process.cwd(), 'docs', 'legal', 'privacy.it.md'),
      'utf8'
    ),
  'docs/legal/cookies.en.md': () =>
    readFile(
      path.join(process.cwd(), 'docs', 'legal', 'cookies.en.md'),
      'utf8'
    ),
  'docs/legal/cookies.it.md': () =>
    readFile(
      path.join(process.cwd(), 'docs', 'legal', 'cookies.it.md'),
      'utf8'
    ),
  'docs/legal/terms.en.md': () =>
    readFile(path.join(process.cwd(), 'docs', 'legal', 'terms.en.md'), 'utf8'),
  'docs/legal/terms.it.md': () =>
    readFile(path.join(process.cwd(), 'docs', 'legal', 'terms.it.md'), 'utf8'),
  LICENSE: () => readFile(path.join(process.cwd(), 'LICENSE'), 'utf8'),
  'docs/legal/license.it.md': () =>
    readFile(
      path.join(process.cwd(), 'docs', 'legal', 'license.it.md'),
      'utf8'
    ),
};

type RepositoryFile = keyof typeof readers;

/**
The documents, with their file in each language.
*/
const documents = {
  contributing: {
    en: 'CONTRIBUTING.md',
    it: 'docs/contributing/CONTRIBUTING.it.md',
  },
  contentGuide: {
    en: 'learning-materials/README.md',
    it: 'learning-materials/README.it.md',
  },
  privacy: { en: 'docs/legal/privacy.en.md', it: 'docs/legal/privacy.it.md' },
  cookies: { en: 'docs/legal/cookies.en.md', it: 'docs/legal/cookies.it.md' },
  terms: { en: 'docs/legal/terms.en.md', it: 'docs/legal/terms.it.md' },
  /**
   * The English license is the plain-text `LICENSE`, the only legally valid
   * text. The Italian file is an unofficial translation.
   */
  license: { en: 'LICENSE', it: 'docs/legal/license.it.md' },
} as const satisfies Record<string, Record<Locale, RepositoryFile>>;

export type RepositoryDocument = keyof typeof documents;

export interface RepositoryDocumentContent {
  /**
  Repository path of the file that was read, for links to GitHub.
  */
  file: RepositoryFile;
  /**
  Markdown body, without the leading `# Title`.
  */
  source: string;
}

/**
 * Reads a document in one language. The page shows its own heading, so the
 * leading `# Title` is removed.
 */
export async function getRepositoryDocument(
  document: RepositoryDocument,
  locale: Locale
): Promise<RepositoryDocumentContent> {
  'use cache';
  cacheLife('max');

  const file = documents[document][locale];
  const source = await readers[file]();
  return { file, source: source.replace(/^\s*# .+\r?\n/, '') };
}
