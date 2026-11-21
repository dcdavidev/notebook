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
import { routing } from '@/i18n/routing';
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

/**
 * Accent colors for the topic cards. Each topic always gets the same one,
 * picked from its slug.
 */
const accents = [
  '#2e7d5b',
  '#c2410c',
  '#6d28d9',
  '#0e7490',
  '#be185d',
  '#a16207',
  '#1d4ed8',
];

/**
 * Picks a stable accent color for a topic.
 */
function accentFor(slug: string): string {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 997;
  }
  return accents[hash % accents.length] ?? accents[0] ?? 'currentColor';
}

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
        borderRadius: 5,
        border: 1,
        borderColor: `color-mix(in oklch, ${accent} 30%, transparent)`,
        bgcolor: `color-mix(in oklch, ${accent} 10%, var(--nb-background))`,
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

  return (
    <Stack
      sx={{
        flex: 1,
        width: '100%',
        maxWidth: 1100,
        mx: 'auto',
        px: 2,
        pt: { xs: 3, md: 5 },
        pb: 10,
        gap: { xs: 6, md: 8 },
      }}
    >
      <Box
        component="section"
        aria-labelledby="overview-title"
        sx={{
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
          borderRadius: { xs: 5, md: 8 },
          border: 1,
          borderColor: 'color-mix(in oklch, var(--nb-text) 10%, transparent)',
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
                  count: course.versions[0]?.lessons.length ?? 0,
                })}
              />
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  );
}
