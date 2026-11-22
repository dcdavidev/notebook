'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Whether the signed-in visitor is a supporter: `null` while it loads or
 * when signed out.
 */
export function useSupporter(): boolean | null {
  const { account } = useAuth();
  const userId = account?.id;
  const [state, setState] = useState<{ userId: string; value: boolean }>();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      return;
    }
    let isCancelled = false;
    void supabase
      .from('supporters')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!isCancelled) {
          setState({ userId, value: data !== null });
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return state && state.userId === userId ? state.value : null;
}
