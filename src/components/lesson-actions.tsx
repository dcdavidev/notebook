'use client';

import Stack from '@mui/material/Stack';

import { BookmarkButton } from '@/components/bookmarks/bookmark-button';
import type { LessonRef } from '@/components/bookmarks/bookmarks-context';
import { DownloadMenu, type DownloadOption } from '@/components/download-menu';
import { ShareButton } from '@/components/share-button';

const buttonSx = { textTransform: 'none', borderRadius: 3 } as const;

/**
 * Buttons to bookmark a lesson, share it, and download it, or the whole
 * course, as Markdown.
 */
export function LessonActions({
  title,
  lessonRef,
  downloads,
}: {
  title: string;
  /**
  The lesson, for its bookmark.
  */
  lessonRef: LessonRef;
  /**
  Files of the lesson and of the whole course.
  */
  downloads: DownloadOption[];
}) {
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 3 }}>
      <ShareButton title={title} sx={buttonSx} />
      <DownloadMenu options={downloads} sx={buttonSx} />
      <BookmarkButton
        variant="button"
        {...lessonRef}
        title={title}
        buttonSx={buttonSx}
      />
    </Stack>
  );
}
