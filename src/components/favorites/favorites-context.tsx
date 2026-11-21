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
A favorite course: its topic folder, for example `abap`.
*/
export interface Favorite {
  course: string;
  created_at: string;
}

interface FavoritesState {
  /**
  Favorites of the signed-in visitor, newest first. Empty when signed out.
  */
  favorites: Favorite[];
  /**
  True until the favorites of the signed-in visitor have loaded.
  */
  loading: boolean;
  isFavorite: (course: string) => boolean;
  /**
   * Adds or removes a course. The change shows at once and is undone if
   * saving fails, in which case the promise rejects.
   */
  toggleFavorite: (course: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

/**
 * Keeps the favorite courses of the signed-in visitor in the browser, so
 * every favorite button on the page agrees.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const userId = account?.id;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      return;
    }
    let isCancelled = false;
    void supabase
      .from('favorites')
      .select('course, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (isCancelled) {
          return;
        }

        setFavorites((data as Favorite[] | null) ?? []);
        setLoadedFor(userId);
      });
    return () => {
      isCancelled = true;
      setFavorites([]);
      setLoadedFor(null);
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    async (course: string) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !userId) {
        return;
      }
      const previous = favorites;
      const isAdding = favorites.every((item) => item.course !== course);
      setFavorites(
        isAdding
          ? [{ course, created_at: new Date().toISOString() }, ...favorites]
          : favorites.filter((item) => item.course !== course)
      );
      const { error } = isAdding
        ? await supabase.from('favorites').insert({ user_id: userId, course })
        : await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('course', course);
      if (!error) {
        return;
      }

      setFavorites(previous);
      throw new Error(error.message);
    },
    [favorites, userId]
  );

  const value = useMemo<FavoritesState>(
    () => ({
      favorites,
      loading: Boolean(userId) && loadedFor !== userId,
      isFavorite: (course) => favorites.some((item) => item.course === course),
      toggleFavorite,
    }),
    [favorites, loadedFor, toggleFavorite, userId]
  );

  return <FavoritesContext value={value}>{children}</FavoritesContext>;
}

export function useFavorites(): FavoritesState {
  const state = use(FavoritesContext);
  if (!state) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return state;
}
