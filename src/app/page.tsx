import { Suspense } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import packageJson from '../../package.json';

import { Waves } from '@/components/backgrounds/waves';
import { AnimatedTitle } from '@/components/landing/animated-title';
import { FadeIn } from '@/components/landing/fade-in';
import {
  LocalePrompt,
  LocalePromptSkeleton,
} from '@/components/landing/locale-prompt';
import { SettingsMenu } from '@/components/settings-menu';
import { getCourses } from '@/lib/courses';
import { locales } from '@/lib/locale';

/**
 * What the site offers, in numbers. Plain labels, not buttons. The landing
 * page is in English, like the rest of its text.
 */
function SiteStats({ labels }: { labels: string[] }) {
  return (
    <Stack
      component="ul"
      direction="row"
      aria-label="Notebook in numbers"
      sx={{
        m: 0,
        p: 0,
        listStyle: 'none',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {labels.map((label) => (
        <Box
          key={label}
          component="li"
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            border: 1,
            borderColor: 'divider',
            bgcolor:
              'color-mix(in oklch, var(--nb-background) 70%, transparent)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {label}
        </Box>
      ))}
    </Stack>
  );
}

export default async function LandingPage() {
  // The courses read from disk at build time; the newest version of each
  // course counts.
  const courses = await getCourses('en');
  const lessonCount = courses.reduce(
    (sum, course) => sum + (course.versions[0]?.lessons.length ?? 0),
    0
  );
  const stats = [
    `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`,
    `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`,
    `${locales.length} languages`,
    'Free forever',
  ];

  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '100dvh',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Waves fade={0.35} />

      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
        <SettingsMenu />
      </Box>

      <Stack
        sx={{
          position: 'relative',
          alignItems: 'center',
          textAlign: 'center',
          gap: { xs: 3, sm: 4 },
          px: 2,
          py: 8,
          maxWidth: 760,
        }}
      >
        <AnimatedTitle>Notebook</AnimatedTitle>

        <FadeIn delay={1}>
          <Typography
            component="p"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.375rem' },
              color: 'text.secondary',
              textWrap: 'balance',
            }}
          >
            {packageJson.description}
          </Typography>
        </FadeIn>

        <FadeIn delay={1.1}>
          <SiteStats labels={stats} />
        </FadeIn>

        <FadeIn delay={1.2}>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.875rem' },
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Start learning now
          </Typography>
        </FadeIn>

        <FadeIn delay={1.4}>
          <Suspense fallback={<LocalePromptSkeleton />}>
            <LocalePrompt />
          </Suspense>
        </FadeIn>
      </Stack>
    </Box>
  );
}
