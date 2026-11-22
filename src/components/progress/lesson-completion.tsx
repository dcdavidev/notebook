'use client';

import { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { IconCircle, IconCircleCheckFilled } from '@tabler/icons-react';

import { useProgress } from './progress-context';

import { useAuth } from '@/components/auth/auth-context';
import type { LessonRef } from '@/components/bookmarks/bookmarks-context';
import { notify } from '@/lib/island-notify';
import { requestSignIn } from '@/lib/sign-in-request';

/**
 * How long a lesson must be open before reaching its end completes it, so
 * scrolling quickly through it does not count as reading it.
 */
const minReadMs = 5000;

/**
 * Saves that the signed-in visitor opened the lesson, and shows a button to
 * mark it as completed. Reaching the button, at the end of the lesson,
 * completes the lesson by itself, with an undo. Signed out, the button
 * opens the sign-in dialog. Nothing shows when the site has no accounts.
 */
export function LessonCompletion({ course, version, lesson }: LessonRef) {
  const t = useTranslations('Progress');
  const { enabled, loading, account } = useAuth();
  const progress = useProgress();
  const {
    recordVisit,
    setCompleted,
    isCompleted: isLessonCompleted,
  } = progress;
  const isProgressLoading = progress.loading;
  const accountId = account?.id;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lessonKey = `${course}/${version}/${lesson}`;
  // When the lesson was opened, and whether the end of this lesson was
  // already handled, so an undo is not overridden.
  // The time is set in the effect: reading the clock while rendering would
  // keep the page from being prerendered.
  const openedRef = useRef<{
    key: string | null;
    at: number;
    handled: boolean;
  }>({ key: null, at: 0, handled: false });

  // One visit per lesson opened while signed in.
  useEffect(() => {
    if (accountId) {
      recordVisit({ course, version, lesson });
    }
  }, [accountId, course, lesson, recordVisit, version]);

  // Reaching the end of the lesson completes it, once per lesson opened.
  useEffect(() => {
    if (openedRef.current.key !== lessonKey) {
      openedRef.current = { key: lessonKey, at: Date.now(), handled: false };
    }
    const opened = openedRef.current;
    const element = sentinelRef.current;
    if (!element || !accountId || isProgressLoading || opened.handled) {
      return;
    }
    const ref = { course, version, lesson };
    if (isLessonCompleted(ref)) {
      opened.handled = true;
      return;
    }
    // Undoing keeps the lesson handled, so it is not completed again
    // on this visit.
    const undo = async () => {
      try {
        await setCompleted(ref, false);
      } catch {
        notify({ message: t('error'), severity: 'error' });
      }
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (!entry?.isIntersecting) {
        return;
      }
      timer = setTimeout(
        () => {
          if (opened.handled) {
            return;
          }
          opened.handled = true;
          observer.disconnect();
          const complete = async () => {
            try {
              await setCompleted(ref, true);
              notify({
                message: t('autoCompleted'),
                severity: 'success',
                action: {
                  label: t('undo'),
                  onClick: () => {
                    void undo();
                  },
                },
              });
            } catch {
              opened.handled = false;
            }
          };
          void complete();
        },
        Math.max(0, minReadMs - (Date.now() - opened.at))
      );
    });
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [
    accountId,
    course,
    isLessonCompleted,
    isProgressLoading,
    lesson,
    lessonKey,
    setCompleted,
    t,
    version,
  ]);

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
      notify({ message: t('error'), severity: 'error' });
    }
  };

  return (
    <>
      {/* The end of the lesson: reaching it completes the lesson. */}
      <Box ref={sentinelRef} aria-hidden sx={{ height: 1 }} />
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
    </>
  );
}
