'use client';

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/components/auth/auth-context';
import type { LessonRef } from '@/components/bookmarks/bookmarks-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
A lesson the visitor opened, and whether they completed it.
*/
export interface LessonProgress extends LessonRef {
  last_read_at: string;
  completed_at: string | null;
}

interface ProgressState {
  /**
  Progress of the signed-in visitor, last read first. Empty when signed out.
  */
  progress: LessonProgress[];
  /**
  True until the progress of the signed-in visitor has loaded.
  */
  loading: boolean;
  isCompleted: (ref: LessonRef) => boolean;
  /**
  Lessons of one course version that the visitor completed.
  */
  completedIn: (course: string, version: string) => Set<string>;
  /**
  The lesson of a course the visitor read last, in any version.
  */
  lastRead: (course: string) => LessonProgress | undefined;
  /**
  Saves that the lesson was opened now. Errors are ignored.
  */
  recordVisit: (ref: LessonRef) => void;
  /**
   * Marks a lesson as completed or not. The change shows at once and is
   * undone if saving fails, in which case the promise rejects.
   */
  toggleCompleted: (ref: LessonRef) => Promise<void>;
  /**
  Marks a lesson as completed or not, like `toggleCompleted`.
  */
  setCompleted: (ref: LessonRef, isCompleted: boolean) => Promise<void>;
}

const ProgressContext = createContext<ProgressState | null>(null);

function isSame(a: LessonRef, b: LessonRef): boolean {
  return (
    a.course === b.course && a.version === b.version && a.lesson === b.lesson
  );
}

/**
 * Moves a row to the front, so the list stays sorted by last read.
 */
function withRow(
  rows: LessonProgress[],
  row: LessonProgress
): LessonProgress[] {
  return [row, ...rows.filter((item) => !isSame(item, row))];
}

/**
 * Keeps the reading progress of the signed-in visitor in the browser, so
 * the lesson page, the sidebar, and the course page agree.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const userId = account?.id;
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  // The latest rows, for callbacks that must not change on every update.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      return;
    }
    let isCancelled = false;
    void supabase
      .from('lesson_progress')
      .select('course, version, lesson, last_read_at, completed_at')
      .order('last_read_at', { ascending: false })
      .then(({ data }) => {
        if (isCancelled) {
          return;
        }

        setProgress((data as LessonProgress[] | null) ?? []);
        setLoadedFor(userId);
      });
    return () => {
      isCancelled = true;
      setProgress([]);
      setLoadedFor(null);
    };
  }, [userId]);

  const recordVisit = useCallback(
    (ref: LessonRef) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !userId) {
        return;
      }
      const { course, version, lesson } = ref;
      const now = new Date().toISOString();
      const existing = progressRef.current.find((item) => isSame(item, ref));
      setProgress((rows) =>
        withRow(rows, {
          course,
          version,
          lesson,
          last_read_at: now,
          completed_at: existing?.completed_at ?? null,
        })
      );
      // Only `last_read_at` is sent, so an existing `completed_at` stays.
      // A Supabase query runs only once it is awaited.
      const save = async () => {
        await supabase.from('lesson_progress').upsert({
          user_id: userId,
          course,
          version,
          lesson,
          last_read_at: now,
        });
      };
      void save();
    },
    [userId]
  );

  const setCompleted = useCallback(
    async (ref: LessonRef, isCompleted: boolean) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !userId) {
        return;
      }
      const { course, version, lesson } = ref;
      const previous = progressRef.current;
      const existing = previous.find((item) => isSame(item, ref));
      if (Boolean(existing?.completed_at) === isCompleted) {
        return;
      }
      const completedAt = isCompleted ? new Date().toISOString() : null;
      const lastReadAt = existing?.last_read_at ?? new Date().toISOString();
      setProgress(
        withRow(previous, {
          course,
          version,
          lesson,
          last_read_at: lastReadAt,
          completed_at: completedAt,
        })
      );
      const { error } = await supabase.from('lesson_progress').upsert({
        user_id: userId,
        course,
        version,
        lesson,
        last_read_at: lastReadAt,
        completed_at: completedAt,
      });
      if (!error) {
        return;
      }

      setProgress(previous);
      throw new Error(error.message);
    },
    [userId]
  );

  const toggleCompleted = useCallback(
    async (ref: LessonRef) => {
      const existing = progressRef.current.find((item) => isSame(item, ref));
      await setCompleted(ref, !existing?.completed_at);
    },
    [setCompleted]
  );

  const value = useMemo<ProgressState>(
    () => ({
      progress,
      loading: Boolean(userId) && loadedFor !== userId,
      isCompleted: (ref) =>
        progress.some((item) => isSame(item, ref) && item.completed_at),
      completedIn: (course, version) =>
        new Set(
          progress
            .filter(
              (item) =>
                item.course === course &&
                item.version === version &&
                item.completed_at
            )
            .map((item) => item.lesson)
        ),
      lastRead: (course) => progress.find((item) => item.course === course),
      recordVisit,
      toggleCompleted,
      setCompleted,
    }),
    [loadedFor, progress, recordVisit, setCompleted, toggleCompleted, userId]
  );

  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export function useProgress(): ProgressState {
  const state = use(ProgressContext);
  if (!state) {
    throw new Error('useProgress must be used inside ProgressProvider');
  }
  return state;
}
