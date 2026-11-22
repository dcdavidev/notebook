import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getGlossaryParams, latestEdition } from '@/lib/courses';
import {
  type ArchiveFormat,
  archiveFormats,
  getGlossaryArchive,
} from '@/lib/lesson-files';

/**
Prerenders the glossary archives of every named edition in every language and format.
*/
export async function generateStaticParams() {
  // The pages link to the named edition, so `latest` would only duplicate
  // the newest files.
  const triples = await getGlossaryParams();
  return triples
    .filter((triple) => triple.edition !== latestEdition)
    .flatMap((triple) =>
      archiveFormats.map((format) => ({ ...triple, format }))
    );
}

/**
Checks that a URL segment is a known archive format.
*/
function isArchiveFormat(value: string): value is ArchiveFormat {
  return archiveFormats.includes(value as ArchiveFormat);
}

/**
 * Serves every entry of a glossary in one ZIP file, as PDF or as
 * Markdown.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<'/[lang]/learn/[topic]/[edition]/glossary/archive/[format]'>
) {
  const { lang, topic, edition, format } = await params;
  const archive =
    hasLocale(routing.locales, lang) && isArchiveFormat(format)
      ? await getGlossaryArchive(lang, topic, edition, format)
      : null;
  if (!archive) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(archive.file, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${archive.name}"`,
    },
  });
}
