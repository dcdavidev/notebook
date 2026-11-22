'use client';

import { useTranslations } from 'next-intl';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconPlayerPlay } from '@tabler/icons-react';

import { useProgress } from './progress-context';

import { useAuth } from '@/components/auth/auth-context';
import { LinkButton } from '@/components/link-button';

/**
A lesson, by its `course/version/lesson` key.
*/
export interface ResumeLesson {
  title: string;
  courseTitle: string;
  /**
  Slug of the next lesson of the same version, if any.
  */
  next?: string;
}

interface ResumeReadingProps {
  /**
  Every lesson of every course, by `course/version/lesson`.
  */
  lessons: Record<string, ResumeLesson>;
  locale: string;
}

/**
 * Button to the lesson the signed-in visitor read last, or to the one after
 * it when they completed it. Nothing shows before they open a lesson.
 */
export function ResumeReading({ lessons, locale }: ResumeReadingProps) {
  const t = useTranslations('Progress');
  const { account } = useAuth();
  const progress = useProgress();

  if (!account || progress.loading) {
    return null;
  }

  // Rows are sorted by last read, newest first.
  const last = progress.progress.find(
    (row) => lessons[`${row.course}/${row.version}/${row.lesson}`]
  );
  if (!last) {
    return null;
  }

  const base = `${last.course}/${last.version}`;
  const current = lessons[`${base}/${last.lesson}`];
  const nextSlug = last.completed_at ? current?.next : undefined;
  const slug = nextSlug ?? last.lesson;
  const target = lessons[`${base}/${slug}`];
  if (!target) {
    return null;
  }

  return (
    <Stack sx={{ alignItems: 'center', gap: 0.75, mt: 1 }}>
      <LinkButton
        href={`/${locale}/learn/${last.course}/course/${last.version}/${slug}`}
        variant="outlined"
        size="large"
        startIcon={<IconPlayerPlay size={20} />}
        sx={{
          px: 3,
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
          bgcolor: 'color-mix(in oklch, var(--nb-background) 80%, transparent)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {t(nextSlug ? 'continueNext' : 'resume', { lesson: target.title })}
      </LinkButton>
      <Typography variant="body2" color="text.secondary">
        {target.courseTitle} · {last.version}
      </Typography>
    </Stack>
  );
}
