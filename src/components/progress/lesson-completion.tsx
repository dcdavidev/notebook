'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

import { IconCircle, IconCircleCheckFilled } from '@tabler/icons-react';

import { useProgress } from './progress-context';

import { useAuth } from '@/components/auth/auth-context';
import type { LessonRef } from '@/components/bookmarks/bookmarks-context';
import { requestSignIn } from '@/lib/sign-in-request';

/**
 * Saves that the signed-in visitor opened the lesson, and shows a button to
 * mark it as completed. Signed out, the button opens the sign-in dialog.
 * Nothing shows when the site has no accounts.
 */
export function LessonCompletion({ course, version, lesson }: LessonRef) {
  const t = useTranslations('Progress');
  const { enabled, loading, account } = useAuth();
  const progress = useProgress();
  const { recordVisit } = progress;
  const [failed, setFailed] = useState(false);
  const accountId = account?.id;

  // One visit per lesson opened while signed in.
  useEffect(() => {
    if (accountId) {
      recordVisit({ course, version, lesson });
    }
  }, [accountId, course, lesson, recordVisit, version]);

  if (!enabled) {
    return null;
  }

  const ref = { course, version, lesson };
  const isCompleted = account !== null && progress.isCompleted(ref);
  const isBusy = loading || (account !== null && progress.loading);

  const toggle = async () => {
    if (!account) {
      requestSignIn();
      return;
    }
    try {
      await progress.toggleCompleted(ref);
    } catch {
      setFailed(true);
    }
  };

  return (
    <>
      <Button
        variant={isCompleted ? 'contained' : 'outlined'}
        color="success"
        size="large"
        aria-pressed={isCompleted}
        disabled={isBusy}
        disableElevation
        startIcon={
          isCompleted ? (
            <IconCircleCheckFilled size={20} />
          ) : (
            <IconCircle size={20} />
          )
        }
        onClick={() => {
          void toggle();
        }}
        sx={{ alignSelf: 'center', textTransform: 'none', borderRadius: 3 }}
      >
        {t(isCompleted ? 'completed' : 'markCompleted')}
      </Button>
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
    </>
  );
}
