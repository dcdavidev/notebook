'use client';

import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
} from '@tabler/icons-react';

import { useAuth } from '@/components/auth/auth-context';
import { useProgress } from '@/components/progress/progress-context';
import { Link, usePathname } from '@/i18n/navigation';
import { accentFor } from '@/lib/accent';
import type { CourseSummary } from '@/lib/courses';

/**
Height of the player bar, in px.
*/
const playerHeight = 72;

/**
 * Tells the app shell, through `--nb-player-height`, that the player is
 * showing, so the page and the sidebar leave room for it.
 */
function ReservePlayerSpace() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nb-player-height', `${playerHeight}px`);
    return () => {
      root.style.removeProperty('--nb-player-height');
    };
  }, []);
  return null;
}

/**
 * Bar fixed to the bottom of the window, styled like a music player: the lesson to
 * pick up (the one read last, or the next one when that is completed),
 * buttons for the previous lesson, resume, and the next lesson, and how
 * much of the course is left. It shows only to signed-in visitors who have
 * opened a lesson.
 */
export function LessonPlayer({ courses }: { courses: CourseSummary[] }) {
  const t = useTranslations('Player');
  const { account } = useAuth();
  const progress = useProgress();
  const pathname = usePathname();

  if (!account || progress.loading) {
    return null;
  }

  // Rows are sorted by last read: take the newest lesson that still exists.
  let found:
    | {
        course: CourseSummary;
        version: CourseSummary['versions'][number];
        index: number;
        isCompleted: boolean;
      }
    | undefined;
  for (const row of progress.progress) {
    const course = courses.find((item) => item.slug === row.course);
    const version = course?.versions.find((item) => item.name === row.version);
    const index =
      version?.lessons.findIndex((item) => item.slug === row.lesson) ?? -1;
    if (course && version && index !== -1) {
      found = { course, version, index, isCompleted: !!row.completed_at };
      break;
    }
  }
  if (!found) {
    return null;
  }

  const { course, version } = found;
  const { lessons } = version;
  // A completed lesson moves the player on to the next one.
  const index =
    found.isCompleted && found.index < lessons.length - 1
      ? found.index + 1
      : found.index;
  const lesson = lessons[index];
  if (!lesson) {
    return null;
  }
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const versionPath = `/learn/${course.slug}/course/${version.name}`;
  const isNewest = course.versions[0]?.name === version.name;
  const isReading =
    pathname === `${versionPath}/${lesson.slug}` ||
    (isNewest &&
      pathname === `/learn/${course.slug}/course/latest/${lesson.slug}`);

  const completed = progress.completedIn(course.slug, version.name);
  const done = lessons.filter((item) => completed.has(item.slug)).length;
  const total = lessons.length;
  const left = total - done;
  const percent = total === 0 ? 0 : (done / total) * 100;
  const accent = accentFor(course.slug);

  const skip = (
    target: (typeof lessons)[number] | undefined,
    label: string,
    Icon: typeof IconPlayerSkipBackFilled
  ) => (
    <Tooltip title={target ? `${label}: ${target.title}` : label}>
      <span>
        <IconButton
          component={target ? Link : 'button'}
          href={target ? `${versionPath}/${target.slug}` : undefined}
          disabled={!target}
          aria-label={target ? `${label}: ${target.title}` : label}
          size="small"
        >
          <Icon size={18} />
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Box
      component="section"
      aria-label={t('label')}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 'appBar',
        height: playerHeight,
        display: 'flex',
        alignItems: 'center',
        px: { xs: 1, md: 2 },
        bgcolor: { xs: 'background.default', md: 'var(--nb-canvas)' },
        boxShadow: {
          xs: '0 -1px 0 var(--nb-divider)',
          md: 'none',
        },
      }}
    >
      <ReservePlayerSpace />
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', gap: { xs: 1.5, md: 3 } }}
      >
        {/* Lesson: a cover in the course color, the title, the course. */}
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1.5,
            minWidth: 0,
            flex: { xs: 1, md: '0 1 30%' },
          }}
        >
          <Box
            aria-hidden
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.02em',
              background: `linear-gradient(135deg, ${accent}, color-mix(in oklch, ${accent}, black 35%))`,
            }}
          >
            {String(lesson.step).padStart(2, '0')}
          </Box>
          <Stack sx={{ minWidth: 0 }}>
            <Typography
              component={Link}
              href={`${versionPath}/${lesson.slug}`}
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: 14,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {lesson.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {course.title} · {version.name}
            </Typography>
          </Stack>
        </Stack>

        {/* Controls and the course bar. */}
        <Stack sx={{ flex: 1, alignItems: 'center', gap: 0.25, minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            {skip(previous, t('previous'), IconPlayerSkipBackFilled)}
            <Tooltip title={t(isReading ? 'reading' : 'resume')}>
              <span>
                <IconButton
                  component={isReading ? 'button' : Link}
                  href={isReading ? undefined : `${versionPath}/${lesson.slug}`}
                  disabled={isReading}
                  aria-label={
                    isReading ? t('reading') : `${t('resume')}: ${lesson.title}`
                  }
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'text.primary',
                    color: 'background.default',
                    '&:hover': { bgcolor: 'text.primary', opacity: 0.85 },
                    '&.Mui-disabled': {
                      bgcolor: 'text.primary',
                      color: 'background.default',
                      opacity: 0.6,
                    },
                  }}
                >
                  {isReading ? (
                    <IconPlayerPauseFilled size={18} />
                  ) : (
                    <IconPlayerPlayFilled size={18} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            {skip(next, t('next'), IconPlayerSkipForwardFilled)}
          </Stack>
          <Stack
            direction="row"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              maxWidth: 560,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 52 }}
            >
              {done}/{total}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percent}
              aria-label={t('left', { left, total })}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: 'color-mix(in oklch, var(--nb-text) 12%, transparent)',
                '& .MuiLinearProgress-bar': { bgcolor: accent },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontVariantNumeric: 'tabular-nums',
                minWidth: 52,
                textAlign: 'right',
              }}
            >
              −{left}
            </Typography>
          </Stack>
        </Stack>

        {/* What is left, in words. */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            flex: '0 1 30%',
            textAlign: 'right',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {left === 0 ? t('finished') : t('left', { left, total })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('percent', { percent: Math.round(percent) })}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
