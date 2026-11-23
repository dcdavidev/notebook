import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconArrowLeft, IconArrowRight, IconPencil } from '@tabler/icons-react';

import { LessonActions } from '@/components/lesson-actions';
import { LinkButton } from '@/components/link-button';
import { MarkdownContent } from '@/components/markdown/markdown-content';
import { LessonCompletion } from '@/components/progress/lesson-completion';
import { routing } from '@/i18n/routing';
import { coursePath } from '@/lib/course-paths';
import {
  findEdition,
  getAllLessonParams,
  getCourses,
  getLesson,
} from '@/lib/courses';
import { createEditionHrefResolver } from '@/lib/edition-links';

/**
Prerenders every lesson of every edition in every language.
*/
export async function generateStaticParams() {
  return getAllLessonParams();
}

/**
 * Every lesson is prerendered, and its content depends on the URL, so the
 * route can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

const repository = 'https://github.com/dcdavidev/notebook';

type Props = PageProps<'/[lang]/learn/[topic]/[edition]/course/[lesson]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic, edition, lesson } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return {};
  }
  const courses = await getCourses(lang);
  const course = courses.find((item) => item.slug === topic);
  const editionData = findEdition(course?.editions ?? [], edition);
  const data = editionData
    ? await getLesson(lang, topic, editionData.name, lesson)
    : null;
  const courseTitle = course?.title;
  return data
    ? {
        title: `${data.title} · ${courseTitle ?? topic} · Notebook`,
        description: data.description,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((item) => [
              item,
              `/${item}${coursePath(topic, edition, lesson)}`,
            ])
          ),
        },
      }
    : {};
}

export default async function LessonPage({ params }: Props) {
  const { lang, topic, edition, lesson } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);

  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const courseData = courses.find((item) => item.slug === topic);
  // `latest` is an alias of the newest edition.
  const editionData = findEdition(courseData?.editions ?? [], edition);
  const data = editionData
    ? await getLesson(lang, topic, editionData.name, lesson)
    : null;
  if (!data || !courseData || !editionData) {
    notFound();
  }

  const { lessons } = editionData;
  const basePath = `/${lang}${coursePath(topic, edition)}`;
  const index = lessons.findIndex((item) => item.slug === lesson);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  // Archives exist only for named editions, not for `latest`.
  const archiveBase = `/${lang}${coursePath(topic, editionData.name)}/download`;
  const { sourcePath } = data;

  return (
    <Box
      component="article"
      sx={{ width: '100%', maxWidth: 780, mx: 'auto', px: 2, pt: 2, pb: 10 }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}
      >
        <Chip label={courseData.title} size="small" color="primary" />
        <Chip label={editionData.label} size="small" variant="outlined" />
        {data.level && (
          <Chip
            label={t('level', { level: data.level })}
            size="small"
            variant="outlined"
          />
        )}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('lessonOf', { step: index + 1, total: lessons.length })}
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
        {data.title}
      </Typography>
      {data.description && (
        <Typography
          sx={{ mt: 1.5, fontSize: '1.2rem', color: 'text.secondary' }}
        >
          {data.description}
        </Typography>
      )}
      <LessonActions
        title={data.title}
        lessonRef={{ course: topic, version: editionData.name, lesson }}
        downloads={[
          {
            scope: 'lesson',
            format: 'markdown',
            href: `${basePath}/${lesson}/download`,
          },
          {
            scope: 'course',
            format: 'markdown',
            href: `${archiveBase}/markdown`,
          },
        ]}
      />

      <Divider sx={{ my: 4 }} />

      <MarkdownContent
        source={data.body}
        locale={lang}
        resolveHref={createEditionHrefResolver(lang, topic, edition, 'course')}
        anchorLabel={t('headingAnchor')}
      />

      <Divider sx={{ my: 5 }} />

      <Stack sx={{ mb: 4 }}>
        <LessonCompletion
          course={topic}
          version={editionData.name}
          lesson={lesson}
        />
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ gap: 2, justifyContent: 'space-between' }}
      >
        {previous ? (
          <LinkButton
            href={`${basePath}/${previous.slug}`}
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              borderRadius: 3,
            }}
          >
            {t('previous')}: {previous.title}
          </LinkButton>
        ) : (
          <span />
        )}
        {next && (
          <LinkButton
            href={`${basePath}/${next.slug}`}
            variant="contained"
            endIcon={<IconArrowRight size={18} />}
            sx={{
              justifyContent: 'flex-end',
              textTransform: 'none',
              borderRadius: 3,
            }}
          >
            {t('next')}: {next.title}
          </LinkButton>
        )}
      </Stack>

      <Box sx={{ mt: 4 }}>
        <LinkButton
          href={`${repository}/edit/main/${sourcePath}`}
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
