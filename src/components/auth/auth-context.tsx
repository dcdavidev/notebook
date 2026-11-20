'use client';

import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { User } from '@supabase/supabase-js';

import { type AuthProviderId, safeNextPath } from '@/lib/auth-providers';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
Signed-in visitor, reduced to what the interface shows.
*/
export interface Account {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthState {
  /**
  False when the site has no Supabase project: the account UI is hidden.
  */
  enabled: boolean;
  /**
  True until the stored session has been read.
  */
  loading: boolean;
  account: Account | null;
  signIn: (provider: AuthProviderId) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function toAccount(user: User): Account {
  const metadata = user.user_metadata as Record<string, unknown>;
  const text = (key: string) =>
    typeof metadata[key] === 'string' && metadata[key] !== ''
      ? metadata[key]
      : undefined;

  return {
    id: user.id,
    name:
      text('full_name') ??
      text('name') ??
      text('user_name') ??
      user.email ??
      'Account',
    email: user.email,
    avatarUrl: text('avatar_url') ?? text('picture'),
  };
}

/**
 * Keeps track of the signed-in visitor in the browser. The session lives
 * in cookies managed by Supabase, so every page can stay static.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(session ? toAccount(session.user) : null);
      setLoading(false);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      enabled: isSupabaseConfigured,
      loading,
      account,
      async signIn(provider) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          return;
        }
        const callback = new URL('/auth/callback', location.origin);
        callback.searchParams.set('next', safeNextPath(location.pathname));
        await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: callback.href },
        });
      },
      async signOut() {
        await getSupabaseBrowserClient()?.auth.signOut();
      },
    }),
    [account, loading]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const state = use(AuthContext);
  if (!state) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return state;
}
