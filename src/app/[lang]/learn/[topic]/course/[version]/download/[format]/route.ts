import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { getCourses } from '@/lib/courses';
import {
  type ArchiveFormat,
  archiveFormats,
  getCourseArchive,
} from '@/lib/lesson-files';

/**
 * Prerenders the archives of every named version (`v1`, `v2`, ...) in every
 * language and format. The pages link to the named version, so `latest`
 * would only duplicate the newest archive.
 */
export async function generateStaticParams() {
  const perLocale = await Promise.all(
    routing.locales.map(async (lang) => {
      const courses = await getCourses(lang);
      return courses.flatMap((course) =>
        course.versions.flatMap((version) =>
          archiveFormats.map((format) => ({
            lang,
            topic: course.slug,
            version: version.name,
            format,
          }))
        )
      );
    })
  );
  return perLocale.flat();
}

/**
Checks that a URL segment is a known archive format.
*/
function isArchiveFormat(value: string): value is ArchiveFormat {
  return archiveFormats.includes(value as ArchiveFormat);
}

/**
 * Serves every lesson of a course version in one ZIP file, as PDF or as
 * Markdown.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<'/[lang]/learn/[topic]/course/[version]/download/[format]'>
) {
  const { lang, topic, version, format } = await params;
  const archive =
    hasLocale(routing.locales, lang) && isArchiveFormat(format)
      ? await getCourseArchive(lang, topic, version, format)
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
