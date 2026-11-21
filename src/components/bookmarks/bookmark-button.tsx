'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';

import { IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';

import { type LessonRef, useBookmarks } from './bookmarks-context';

import { useAuth } from '@/components/auth/auth-context';
import { requestSignIn } from '@/lib/sign-in-request';

interface BookmarkButtonProps extends LessonRef {
  /**
  Lesson title, for the accessible name of the icon button.
  */
  title: string;
  /**
   * `icon`: a bookmark only, for lists. `button`: a bookmark with a label,
   * for the lesson page.
   */
  variant?: 'icon' | 'button';
  /**
  Extra styles of the labelled button, for example to match its neighbours.
  */
  buttonSx?: Record<string, unknown>;
}

/**
 * Bookmark that saves a lesson or removes it. Signed out, it opens the
 * sign-in dialog. It is hidden when the site has no accounts.
 */
export function BookmarkButton({
  course,
  version,
  lesson,
  title,
  variant = 'icon',
  buttonSx,
}: BookmarkButtonProps) {
  const t = useTranslations('Bookmarks');
  const { enabled, loading, account } = useAuth();
  const bookmarks = useBookmarks();
  const [failed, setFailed] = useState(false);

  if (!enabled) {
    return null;
  }

  const ref = { course, version, lesson };
  const isBookmarked = account !== null && bookmarks.isBookmarked(ref);
  const isBusy = loading || (account !== null && bookmarks.loading);
  const label = t(isBookmarked ? 'remove' : 'add', { lesson: title });
  const shortLabel = t(isBookmarked ? 'saved' : 'save');

  const toggle = async () => {
    if (!account) {
      requestSignIn();
      return;
    }
    try {
      await bookmarks.toggleBookmark(ref);
    } catch {
      setFailed(true);
    }
  };

  const snackbar = (
    <Snackbar
      open={failed}
      autoHideDuration={5000}
      onClose={() => {
        setFailed(false);
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="error"
        variant="filled"
        onClose={() => {
          setFailed(false);
        }}
      >
        {t('error')}
      </Alert>
    </Snackbar>
  );

  if (variant === 'button') {
    return (
      <>
        <Button
          variant={isBookmarked ? 'contained' : 'outlined'}
          size="small"
          disableElevation
          startIcon={
            isBookmarked ? (
              <IconBookmarkFilled size={16} />
            ) : (
              <IconBookmark size={16} />
            )
          }
          aria-pressed={isBookmarked}
          disabled={isBusy}
          onClick={() => {
            void toggle();
          }}
          sx={buttonSx}
        >
          {shortLabel}
        </Button>
        {snackbar}
      </>
    );
  }

  return (
    <>
      <Tooltip title={shortLabel}>
        {/* The span keeps the tooltip working while the button is disabled. */}
        <span>
          <IconButton
            aria-label={label}
            aria-pressed={isBookmarked}
            disabled={isBusy}
            onClick={() => {
              void toggle();
            }}
            sx={{ color: isBookmarked ? 'primary.main' : 'text.secondary' }}
          >
            {isBookmarked ? (
              <IconBookmarkFilled size={20} />
            ) : (
              <IconBookmark size={20} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {snackbar}
    </>
  );
}
