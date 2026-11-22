'use client';

import { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconCircleCheckFilled,
  IconVocabulary,
  IconX,
} from '@tabler/icons-react';

import { useAuth } from '@/components/auth/auth-context';
import { useProgress } from '@/components/progress/progress-context';
import { Link, usePathname } from '@/i18n/navigation';
import { accentFor } from '@/lib/accent';
import type { CourseSummary } from '@/lib/courses';

const itemSx = {
  borderRadius: 2.5,
  gap: 1,
  py: 0.5,
  '&.Mui-selected': {
    bgcolor: 'color-mix(in oklch, var(--nb-text) 8%, transparent)',
  },
} as const;

/**
 * Every lesson of a course: the title, the version, how much the visitor
 * completed, and the list, with the lesson being read highlighted and
 * scrolled into view. It fills the course panel on desktop and the lessons
 * sheet on phones.
 */
export function CourseLessons({
  course,
  onNavigate,
  onClose,
}: {
  course: CourseSummary;
  /**
  Called after a lesson is chosen, for example to close the sheet.
  */
  onNavigate?: () => void;
  /**
  Shows a close button that calls it.
  */
  onClose?: () => void;
}) {
  const t = useTranslations('Shell');
  const tLearn = useTranslations('Learn');
  const tProgress = useTranslations('Progress');
  const { account } = useAuth();
  const progress = useProgress();
  const pathname = usePathname();
  const currentRef = useRef<HTMLAnchorElement>(null);

  // `/learn/<topic>/course/<version>/<lesson>`: list the version being
  // read. `latest` (the default) is the newest one, which comes first.
  const coursePath = `/learn/${course.slug}`;
  const segment = pathname.split('/', 5)[4];
  const pinned = course.versions.find((item) => item.name === segment);
  const version = pinned ?? course.versions[0];
  const versionPath = `${coursePath}/course/${pinned ? pinned.name : 'latest'}`;
  const glossaryPath = `${coursePath}/glossary`;
  // The glossary entry stays highlighted on its section pages too.
  const isGlossary =
    pathname === glossaryPath || pathname.startsWith(`${glossaryPath}/`);
  const lessons = version?.lessons ?? [];
  const completed = version
    ? progress.completedIn(course.slug, version.name)
    : new Set<string>();
  const done = lessons.filter((item) => completed.has(item.slug)).length;
  // Pad the lesson numbers to the widest one, at least 2 digits.
  const digits = Math.max(2, String(lessons.at(-1)?.step ?? 0).length);
  const accent = accentFor(course.slug);

  // Keep the lesson being read in view.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, [pathname]);

  return (
    <Stack sx={{ minHeight: 0, flex: 1 }}>
      <Stack
        sx={{
          px: 2,
          pt: 2,
          pb: 1.5,
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${accent}, color-mix(in oklch, ${accent}, black 35%))`,
            }}
          />
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component={Link}
              href={coursePath}
              onClick={onNavigate}
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: '1.1rem',
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              {course.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tLearn('lessonCount', { count: lessons.length })}
            </Typography>
          </Stack>
          {version && (
            <Chip label={version.name} size="small" variant="outlined" />
          )}
          {onClose && (
            <Tooltip title={t('hideLessons', { course: course.title })}>
              <IconButton
                size="small"
                onClick={onClose}
                aria-label={t('hideLessons', { course: course.title })}
              >
                <IconX size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        {account && done > 0 && (
          <Stack sx={{ gap: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={lessons.length === 0 ? 0 : (done / lessons.length) * 100}
              aria-label={tProgress('summary', {
                done,
                total: lessons.length,
              })}
              sx={{
                height: 4,
                borderRadius: 2,
                '& .MuiLinearProgress-bar': { bgcolor: accent },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {tProgress('summary', { done, total: lessons.length })}
            </Typography>
          </Stack>
        )}
      </Stack>

      <List
        dense
        aria-label={t('course')}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, py: 1 }}
      >
        <ListItemButton
          component={Link}
          href={versionPath}
          onClick={onNavigate}
          selected={pathname === versionPath}
          aria-current={pathname === versionPath ? 'page' : undefined}
          ref={pathname === versionPath ? currentRef : undefined}
          sx={itemSx}
        >
          <ListItemText
            primary={tLearn('overview')}
            slotProps={{
              primary: {
                sx: {
                  fontSize: 14,
                  fontWeight: 600,
                  pl: `${digits * 11 + 8}px`,
                },
              },
            }}
          />
        </ListItemButton>
        {course.hasGlossary && (
          <ListItemButton
            component={Link}
            href={glossaryPath}
            onClick={onNavigate}
            selected={isGlossary}
            aria-current={pathname === glossaryPath ? 'page' : undefined}
            ref={isGlossary ? currentRef : undefined}
            sx={itemSx}
          >
            <Box
              component="span"
              aria-hidden
              sx={{
                minWidth: digits * 11,
                display: 'flex',
                color: 'text.secondary',
              }}
            >
              <IconVocabulary size={16} />
            </Box>
            <ListItemText
              primary={tLearn('glossary')}
              slotProps={{
                primary: { sx: { fontSize: 14, fontWeight: 600 } },
              }}
            />
          </ListItemButton>
        )}
        {lessons.map((lesson) => {
          const lessonPath = `${versionPath}/${lesson.slug}`;
          const isCurrent = pathname === lessonPath;
          return (
            <ListItemButton
              key={lesson.slug}
              component={Link}
              href={lessonPath}
              onClick={onNavigate}
              selected={isCurrent}
              aria-current={isCurrent ? 'page' : undefined}
              ref={isCurrent ? currentRef : undefined}
              sx={itemSx}
            >
              <Typography
                component="span"
                variant="caption"
                sx={{
                  minWidth: digits * 11,
                  display: 'flex',
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {completed.has(lesson.slug) ? (
                  <Box
                    component="span"
                    role="img"
                    aria-label={tProgress('completedLesson')}
                    sx={{ display: 'flex', color: 'success.main' }}
                  >
                    <IconCircleCheckFilled size={16} />
                  </Box>
                ) : (
                  String(lesson.step).padStart(digits, '0')
                )}
              </Typography>
              <ListItemText
                primary={lesson.title}
                slotProps={{
                  primary: {
                    sx: { fontSize: 14, fontWeight: isCurrent ? 700 : 400 },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Stack>
  );
}
