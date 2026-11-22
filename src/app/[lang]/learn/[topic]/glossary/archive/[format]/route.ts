import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getGlossaryParams } from '@/lib/courses';
import {
  type ArchiveFormat,
  archiveFormats,
  getGlossaryArchive,
} from '@/lib/lesson-files';

/**
Prerenders the glossary archives of every topic in every language and format.
*/
export async function generateStaticParams() {
  const pairs = await getGlossaryParams();
  return pairs.flatMap((pair) =>
    archiveFormats.map((format) => ({ ...pair, format }))
  );
}

/**
Checks that a URL segment is a known archive format.
*/
function isArchiveFormat(value: string): value is ArchiveFormat {
  return archiveFormats.includes(value as ArchiveFormat);
}

/**
 * Serves every section of a glossary in one ZIP file, as PDF or as
 * Markdown.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<'/[lang]/learn/[topic]/glossary/archive/[format]'>
) {
  const { lang, topic, format } = await params;
  const archive =
    hasLocale(routing.locales, lang) && isArchiveFormat(format)
      ? await getGlossaryArchive(lang, topic, format)
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
