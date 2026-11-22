import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getGlossaryParams, latestEdition } from '@/lib/courses';
import {
  type ArchiveFormat,
  archiveFormats,
  getGlossaryMarkdown,
  getGlossaryPdf,
} from '@/lib/lesson-files';

/**
Prerenders the glossary files of every named edition in every language and format.
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
Checks that a URL segment is a known file format.
*/
function isFormat(value: string): value is ArchiveFormat {
  return archiveFormats.includes(value as ArchiveFormat);
}

/**
 * Serves the whole glossary of a course edition as one PDF or Markdown file.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<'/[lang]/learn/[topic]/[edition]/glossary/download/[format]'>
) {
  const { lang, topic, edition, format } = await params;
  if (!hasLocale(routing.locales, lang) || !isFormat(format)) {
    return new Response('Not found', { status: 404 });
  }
  if (format === 'pdf') {
    const pdf = await getGlossaryPdf(lang, topic, edition);
    return pdf
      ? new Response(pdf.file, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pdf.name}"`,
          },
        })
      : new Response('Not found', { status: 404 });
  }
  const markdown = await getGlossaryMarkdown(lang, topic, edition);
  return markdown
    ? new Response(markdown.file, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${markdown.name}"`,
        },
      })
    : new Response('Not found', { status: 404 });
}
