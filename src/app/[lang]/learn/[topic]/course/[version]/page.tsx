import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  IconArrowRight,
  IconPencil,
  IconVocabulary,
} from '@tabler/icons-react';

import { DownloadMenu } from '@/components/download-menu';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { LinkButton } from '@/components/link-button';
import { MarkdownContent } from '@/components/markdown/markdown-content';
import { CourseProgress } from '@/components/progress/course-progress';
import { routing } from '@/i18n/routing';
import { getVersionParams, redirectToFirstLesson } from '@/lib/course-redirect';
import { findVersion, getCourseOverview, getCourses } from '@/lib/courses';

/**
Prerenders the overview of every course version in every language.
*/
export async function generateStaticParams() {
  return getVersionParams();
}

/**
 * Every overview is prerendered, and its content depends on the URL, so the
 * route can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

const repository = 'https://github.com/dcdavidev/notebook';

type Props = PageProps<'/[lang]/learn/[topic]/course/[version]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic, version } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return {};
  }
  const courses = await getCourses(lang);
  const course = courses.find((item) => item.slug === topic);
  return course
    ? {
        title: `${course.title} · Notebook`,
        description: course.description,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((item) => [
              item,
              `/${item}/learn/${topic}/course/${version}`,
            ])
          ),
        },
      }
    : {};
}

/**
 * `/<lang>/learn/<topic>/course/<version>` is the course home page: the
 * version's `README` with the table of contents. Without a `README`, it
 * opens the first lesson.
 */
export default async function VersionPage({ params }: Props) {
  const { lang, topic, version } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);

  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const course = courses.find((item) => item.slug === topic);
  const versionData = findVersion(course?.versions ?? [], version);
  if (!course || !versionData) {
    notFound();
  }
  const overview = await getCourseOverview(lang, topic, versionData.name);
  if (!overview) {
    return redirectToFirstLesson(lang, topic, version);
  }

  const basePath = `/${lang}/learn/${topic}/course/${version}`;
  const first = versionData.lessons[0];
  // Archives exist only for named versions, not for `latest`.
  const archiveBase = `/${lang}/learn/${topic}/course/${versionData.name}/download`;

  return (
    <Box
      component="article"
      sx={{ width: '100%', maxWidth: 780, mx: 'auto', px: 2, pt: 2, pb: 10 }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}
      >
        <Chip label={t('overview')} size="small" color="primary" />
        <Chip label={versionData.name} size="small" variant="outlined" />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('lessonCount', { count: versionData.lessons.length })}
        </Typography>
      </Stack>

      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '2rem', sm: '2.6rem' },
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}
      >
        {overview.title ?? course.title}
      </Typography>
      {overview.description && (
        <Typography
          sx={{ mt: 1.5, fontSize: '1.2rem', color: 'text.secondary' }}
        >
          {overview.description}
        </Typography>
      )}
      {overview.tags.length > 0 && (
        <Stack
          direction="row"
          component="ul"
          aria-label={t('tags')}
          sx={{ flexWrap: 'wrap', gap: 0.75, mt: 2, p: 0, listStyle: 'none' }}
        >
          {overview.tags.map((tag) => (
            <Chip
              key={tag}
              component="li"
              label={tag}
              size="small"
              variant="outlined"
            />
          ))}
        </Stack>
      )}

      <Stack
        direction="row"
        sx={{ mt: 3, gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}
      >
        {first && (
          <LinkButton
            href={`${basePath}/${first.slug}`}
            variant="contained"
            endIcon={<IconArrowRight size={18} />}
            sx={{ textTransform: 'none', borderRadius: 3 }}
          >
            {t('startCourse')}
          </LinkButton>
        )}
        <DownloadMenu
          label={t('downloadCourse')}
          options={[
            { scope: 'course', format: 'pdf', href: `${archiveBase}/pdf` },
            {
              scope: 'course',
              format: 'markdown',
              href: `${archiveBase}/markdown`,
            },
          ]}
          sx={{ textTransform: 'none', borderRadius: 3, py: 0.75 }}
        />
        {course.hasGlossary && (
          <LinkButton
            href={`/${lang}/learn/${topic}/glossary`}
            variant="outlined"
            startIcon={<IconVocabulary size={18} />}
            sx={{ textTransform: 'none', borderRadius: 3 }}
          >
            {t('glossary')}
          </LinkButton>
        )}
        <FavoriteButton
          variant="button"
          course={topic}
          title={overview.title ?? course.title}
        />
      </Stack>

      <CourseProgress
        course={topic}
        version={versionData.name}
        lessons={versionData.lessons.map(({ slug, title }) => ({
          slug,
          title,
        }))}
        basePath={basePath}
      />

      <Divider sx={{ my: 4 }} />

      <MarkdownContent
        source={overview.body}
        locale={lang}
        lessonBase={basePath}
      />

      <Box sx={{ mt: 6 }}>
        <LinkButton
          href={`${repository}/edit/main/${overview.sourcePath}`}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          startIcon={<IconPencil size={16} />}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          {t('editOnGitHub')}
        </LinkButton>
      </Box>
    </Box>
  );
}
