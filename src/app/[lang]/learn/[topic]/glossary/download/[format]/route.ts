import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getGlossaryParams } from '@/lib/courses';
import {
  type ArchiveFormat,
  archiveFormats,
  getGlossaryMarkdown,
  getGlossaryPdf,
} from '@/lib/lesson-files';

/**
Prerenders the glossary files of every topic in every language and format.
*/
export async function generateStaticParams() {
  const pairs = await getGlossaryParams();
  return pairs.flatMap((pair) =>
    archiveFormats.map((format) => ({ ...pair, format }))
  );
}

/**
Checks that a URL segment is a known file format.
*/
function isFormat(value: string): value is ArchiveFormat {
  return archiveFormats.includes(value as ArchiveFormat);
}

/**
 * Serves the whole glossary of a topic as one PDF or Markdown file.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<'/[lang]/learn/[topic]/glossary/download/[format]'>
) {
  const { lang, topic, format } = await params;
  if (!hasLocale(routing.locales, lang) || !isFormat(format)) {
    return new Response('Not found', { status: 404 });
  }
  if (format === 'pdf') {
    const pdf = await getGlossaryPdf(lang, topic);
    return pdf
      ? new Response(pdf.file, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pdf.name}"`,
          },
        })
      : new Response('Not found', { status: 404 });
  }
  const markdown = await getGlossaryMarkdown(lang, topic);
  return markdown
    ? new Response(markdown.file, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${markdown.name}"`,
        },
      })
    : new Response('Not found', { status: 404 });
}
