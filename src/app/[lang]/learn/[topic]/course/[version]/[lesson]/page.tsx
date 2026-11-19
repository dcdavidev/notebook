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

import { LinkButton } from '@/components/link-button';
import { MarkdownContent } from '@/components/markdown/markdown-content';
import { routing } from '@/i18n/routing';
import {
  findVersion,
  getAllLessonParams,
  getCourses,
  getLesson,
  getLessonSourcePath,
} from '@/lib/courses';

/**
Prerenders every lesson of every version in every language.
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

type Props = PageProps<'/[lang]/learn/[topic]/course/[version]/[lesson]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic, version, lesson } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return {};
  }
  const courses = await getCourses(lang);
  const course = courses.find((item) => item.slug === topic);
  const versionData = findVersion(course?.versions ?? [], version);
  const data = versionData
    ? await getLesson(lang, topic, versionData.name, lesson)
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
              `/${item}/learn/${topic}/course/${version}/${lesson}`,
            ])
          ),
        },
      }
    : {};
}

export default async function LessonPage({ params }: Props) {
  const { lang, topic, version, lesson } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);

  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const courseData = courses.find((item) => item.slug === topic);
  // `latest` is an alias of the newest `vN` folder.
  const versionData = findVersion(courseData?.versions ?? [], version);
  const data = versionData
    ? await getLesson(lang, topic, versionData.name, lesson)
    : null;
  if (!data || !courseData || !versionData) {
    notFound();
  }

  const { lessons } = versionData;
  const basePath = `/${lang}/learn/${topic}/course/${version}`;
  const index = lessons.findIndex((item) => item.slug === lesson);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const sourcePath = getLessonSourcePath(lang, topic, versionData.name, lesson);

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
        <Chip label={versionData.name} size="small" variant="outlined" />
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

      <Divider sx={{ my: 4 }} />

      <MarkdownContent source={data.body} locale={lang} lessonBase={basePath} />

      <Divider sx={{ my: 5 }} />

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
