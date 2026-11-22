'use client';

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * A lesson: its course topic, its named edition such as `2026-11` (never `latest`),
 * and its slug.
 */
export interface LessonRef {
  course: string;
  version: string;
  lesson: string;
}

/**
A bookmarked lesson.
*/
export interface Bookmark extends LessonRef {
  created_at: string;
}

interface BookmarksState {
  /**
  Bookmarks of the signed-in visitor, newest first. Empty when signed out.
  */
  bookmarks: Bookmark[];
  /**
  True until the bookmarks of the signed-in visitor have loaded.
  */
  loading: boolean;
  isBookmarked: (ref: LessonRef) => boolean;
  /**
   * Adds or removes a lesson. The change shows at once and is undone if
   * saving fails, in which case the promise rejects.
   */
  toggleBookmark: (ref: LessonRef) => Promise<void>;
}

const BookmarksContext = createContext<BookmarksState | null>(null);

function isSame(a: LessonRef, b: LessonRef): boolean {
  return (
    a.course === b.course && a.version === b.version && a.lesson === b.lesson
  );
}

/**
 * Keeps the bookmarked lessons of the signed-in visitor in the browser, so
 * every bookmark button on the page agrees.
 */
export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const userId = account?.id;
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      return;
    }
    let isCancelled = false;
    void supabase
      .from('bookmarks')
      .select('course, version, lesson, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (isCancelled) {
          return;
        }

        setBookmarks((data as Bookmark[] | null) ?? []);
        setLoadedFor(userId);
      });
    return () => {
      isCancelled = true;
      setBookmarks([]);
      setLoadedFor(null);
    };
  }, [userId]);

  const toggleBookmark = useCallback(
    async (ref: LessonRef) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !userId) {
        return;
      }
      const { course, version, lesson } = ref;
      const previous = bookmarks;
      const isAdding = bookmarks.every((item) => !isSame(item, ref));
      setBookmarks(
        isAdding
          ? [
              { course, version, lesson, created_at: new Date().toISOString() },
              ...bookmarks,
            ]
          : bookmarks.filter((item) => !isSame(item, ref))
      );
      const { error } = isAdding
        ? await supabase
            .from('bookmarks')
            .insert({ user_id: userId, course, version, lesson })
        : await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('course', course)
            .eq('version', version)
            .eq('lesson', lesson);
      if (!error) {
        return;
      }

      setBookmarks(previous);
      throw new Error(error.message);
    },
    [bookmarks, userId]
  );

  const value = useMemo<BookmarksState>(
    () => ({
      bookmarks,
      loading: Boolean(userId) && loadedFor !== userId,
      isBookmarked: (ref) => bookmarks.some((item) => isSame(item, ref)),
      toggleBookmark,
    }),
    [bookmarks, loadedFor, toggleBookmark, userId]
  );

  return <BookmarksContext value={value}>{children}</BookmarksContext>;
}

export function useBookmarks(): BookmarksState {
  const state = use(BookmarksContext);
  if (!state) {
    throw new Error('useBookmarks must be used inside BookmarksProvider');
  }
  return state;
}
