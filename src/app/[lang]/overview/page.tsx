import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconArrowRight } from '@tabler/icons-react';

import { GrainMass } from '@/components/backgrounds/grain-mass';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { LinkButton } from '@/components/link-button';
import {
  type ResumeLesson,
  ResumeReading,
} from '@/components/progress/resume-reading';
import { routing } from '@/i18n/routing';
import { accentFor } from '@/lib/accent';
import { type CourseSummary, getCourses } from '@/lib/courses';

/**
 * The whole page depends on the language, and each language is fully
 * prerendered, so it can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

/**
The topic promoted by the call to action.
*/
const featuredTopic = 'abap';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/overview'>): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('overviewTitle'),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/overview`])
      ),
    },
  };
}

/**
 * One topic in the masonry: a tinted card with the description, the tags,
 * and a button in the topic's color. Cards grow with their content, so the
 * columns get the uneven, Pinterest-like rhythm.
 */
function TopicCard({
  course,
  href,
  openLabel,
  lessonsLabel,
}: {
  course: CourseSummary;
  href: string;
  openLabel: string;
  lessonsLabel: string;
}) {
  const accent = accentFor(course.slug);
  return (
    <Box
      component="li"
      sx={{
        breakInside: 'avoid',
        mb: 2,
        p: 2.5,
        borderRadius: '12px',
        border: '1.5px solid',
        borderColor: `color-mix(in oklch, ${accent} 55%, transparent)`,
        bgcolor: `color-mix(in oklch, ${accent} 16%, var(--nb-background))`,
        boxShadow: `0 1px 2px rgb(0 0 0 / 0.08), 0 12px 28px -14px color-mix(in oklch, ${accent} 70%, transparent)`,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 1px 2px rgb(0 0 0 / 0.08), 0 18px 36px -14px color-mix(in oklch, ${accent} 80%, transparent)`,
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1 }}>
        <Typography
          component="h3"
          sx={{ fontWeight: 700, fontSize: '1.4rem', color: accent }}
        >
          {course.title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {lessonsLabel}
        </Typography>
        <Box sx={{ ml: 'auto', alignSelf: 'center', my: -1, mr: -1 }}>
          <FavoriteButton
            course={course.slug}
            title={course.title}
            color={accent}
          />
        </Box>
      </Stack>
      {course.description && (
        <Typography sx={{ color: 'text.secondary' }}>
          {course.description}
        </Typography>
      )}
      {course.tags.length > 0 && (
        <Stack
          direction="row"
          component="ul"
          sx={{ flexWrap: 'wrap', gap: 0.75, m: 0, p: 0, listStyle: 'none' }}
        >
          {course.tags.map((tag) => (
            <Chip
              key={tag}
              component="li"
              label={tag}
              size="small"
              variant="outlined"
              sx={{
                borderColor: `color-mix(in oklch, ${accent} 35%, transparent)`,
              }}
            />
          ))}
        </Stack>
      )}
      <LinkButton
        href={href}
        variant="contained"
        disableElevation
        endIcon={<IconArrowRight size={18} />}
        sx={{
          alignSelf: 'flex-start',
          mt: 0.5,
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
          bgcolor: accent,
          color: '#fff',
          '&:hover': {
            bgcolor: `color-mix(in oklch, ${accent}, black 15%)`,
          },
        }}
      >
        {openLabel}
      </LinkButton>
    </Box>
  );
}

export default async function OverviewPage({
  params,
}: PageProps<'/[lang]/overview'>) {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  setRequestLocale(locale);
  const [t, tLearn, courses] = await Promise.all([
    getTranslations({ locale, namespace: 'Overview' }),
    getTranslations({ locale, namespace: 'Learn' }),
    getCourses(locale),
  ]);
  const featured =
    courses.find((item) => item.slug === featuredTopic) ?? courses[0];
  // Every lesson, for the "continue" button of signed-in visitors.
  const resumeLessons: Record<string, ResumeLesson> = {};
  for (const course of courses) {
    for (const edition of course.editions) {
      for (const [index, lesson] of edition.lessons.entries()) {
        resumeLessons[`${course.slug}/${edition.name}/${lesson.slug}`] = {
          title: lesson.title,
          courseTitle: course.title,
          next: edition.lessons[index + 1]?.slug,
        };
      }
    }
  }

  return (
    <Stack
      sx={{
        flex: 1,
        width: '100%',
        pb: 10,
        gap: { xs: 6, md: 8 },
        // The hero spans the whole panel; the sections under it are centered.
        '& > :not(.nb-hero)': {
          width: '100%',
          maxWidth: 1100,
          mx: 'auto',
          px: 2,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box
        component="section"
        className="nb-hero"
        aria-labelledby="overview-title"
        sx={{
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
          bgcolor:
            'color-mix(in oklch, var(--nb-background), var(--nb-text) 3%)',
          minHeight: { xs: 420, md: 520 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: { xs: 8, md: 10 },
        }}
      >
        <GrainMass opacity={0.75} sx={{ zIndex: -1 }} />
        <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 2.5 }}>
          <Typography
            id="overview-title"
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.25rem', sm: '3.25rem', md: '4rem' },
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              textWrap: 'balance',
            }}
          >
            {t('title')}
          </Typography>
          <Typography
            sx={{
              maxWidth: 560,
              color: 'text.primary',
              fontWeight: 500,
              textShadow:
                '0 0 12px var(--nb-background), 0 0 4px var(--nb-background)',
              fontSize: '1.1rem',
              textWrap: 'balance',
            }}
          >
            {t('subtitle')}
          </Typography>
          {featured && (
            <LinkButton
              href={`/${locale}/learn/${featured.slug}`}
              variant="contained"
              size="large"
              disableElevation
              endIcon={<IconArrowRight size={20} />}
              sx={{
                mt: 1,
                px: 3.5,
                py: 1.25,
                borderRadius: 999,
                textTransform: 'none',
                fontSize: '1.05rem',
                fontWeight: 600,
              }}
            >
              {t('cta', { topic: featured.title })}
            </LinkButton>
          )}
          <ResumeReading lessons={resumeLessons} locale={locale} />
        </Stack>
      </Box>

      {courses.length > 0 && (
        <Box component="section" aria-labelledby="topics-title">
          <Typography
            id="topics-title"
            component="h2"
            sx={{ fontWeight: 700, fontSize: '1.5rem', mb: 2.5 }}
          >
            {t('topics')}
          </Typography>
          <Box
            component="ul"
            sx={{
              m: 0,
              p: 0,
              listStyle: 'none',
              columnCount: { xs: 1, sm: 2, md: 3 },
              columnGap: 2,
            }}
          >
            {courses.map((course) => (
              <TopicCard
                key={course.slug}
                course={course}
                href={`/${locale}/learn/${course.slug}`}
                openLabel={t('openCourse')}
                lessonsLabel={tLearn('lessonCount', {
                  count: course.editions[0]?.lessons.length ?? 0,
                })}
              />
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  );
}
