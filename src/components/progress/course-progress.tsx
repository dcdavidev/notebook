'use client';

import { useTranslations } from 'next-intl';

import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconPlayerPlay } from '@tabler/icons-react';

import { useProgress } from './progress-context';

import { useAuth } from '@/components/auth/auth-context';
import { LinkButton } from '@/components/link-button';

interface CourseProgressProps {
  course: string;
  /**
  Named edition, for example `2026-11`, as stored with the progress.
  */
  version: string;
  lessons: { slug: string; title: string }[];
  /**
  Path of the course edition, for example `/it/learn/abap/latest/course`.
  */
  basePath: string;
}

/**
 * How much of a course edition the signed-in visitor completed, with a
 * button to open the lesson they read last. Nothing shows until they open
 * a lesson of this edition.
 */
export function CourseProgress({
  course,
  version,
  lessons,
  basePath,
}: CourseProgressProps) {
  const t = useTranslations('Progress');
  const { account } = useAuth();
  const progress = useProgress();

  if (!account || progress.loading) {
    return null;
  }

  const rows = progress.progress.filter(
    (item) => item.course === course && item.version === version
  );
  if (rows.length === 0) {
    return null;
  }

  const completed = progress.completedIn(course, version);
  const done = lessons.filter((item) => completed.has(item.slug)).length;
  const total = lessons.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  // Rows are sorted by last read, so the first one is the lesson to resume.
  const last = lessons.find((item) => item.slug === rows[0]?.lesson);

  return (
    <Stack sx={{ mt: 3, gap: 1.5 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('summary', { done, total })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {percent}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        color="success"
        aria-label={t('summary', { done, total })}
        sx={{ height: 8, borderRadius: 4 }}
      />
      {last && (
        <LinkButton
          href={`${basePath}/${last.slug}`}
          variant="outlined"
          startIcon={<IconPlayerPlay size={18} />}
          sx={{
            alignSelf: 'flex-start',
            textTransform: 'none',
            borderRadius: 3,
          }}
        >
          {t('resume', { lesson: last.title })}
        </LinkButton>
      )}
    </Stack>
  );
}
