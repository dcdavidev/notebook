'use client';

import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { User, UserIdentity } from '@supabase/supabase-js';

import { type AuthProviderId, safeNextPath } from '@/lib/auth-providers';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
Row of `public.profiles` that the visitor can read and change.
*/
export interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  locale: string | null;
  color_mode: string | null;
  palette: string | null;
  created_at: string;
}

export type ProfileChanges = Partial<
  Pick<Profile, 'display_name' | 'locale' | 'color_mode' | 'palette'>
>;

const profileColumns =
  'display_name, avatar_url, locale, color_mode, palette, created_at';

/**
Signed-in visitor, reduced to what the interface shows.
*/
export interface Account {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
  /**
  Third-party accounts linked to this account.
  */
  identities: UserIdentity[];
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
  /**
  The profile row, or `null` while it loads or when signed out.
  */
  profile: Profile | null;
  signIn: (provider: AuthProviderId) => Promise<void>;
  signOut: () => Promise<void>;
  /**
  Links another third-party account to the signed-in account.
  */
  linkProvider: (provider: AuthProviderId) => Promise<void>;
  unlinkIdentity: (identity: UserIdentity) => Promise<void>;
  updateProfile: (changes: ProfileChanges) => Promise<void>;
  /**
  Deletes the account and all its data, then signs out.
  */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function toAccount(user: User, profile: Profile | null): Account {
  const metadata = user.user_metadata as Record<string, unknown>;
  const text = (key: string) =>
    typeof metadata[key] === 'string' && metadata[key] !== ''
      ? metadata[key]
      : undefined;

  return {
    id: user.id,
    name:
      profile?.display_name ??
      text('full_name') ??
      text('name') ??
      text('user_name') ??
      user.email ??
      'Account',
    email: user.email,
    avatarUrl:
      profile?.avatar_url ?? text('avatar_url') ?? text('picture') ?? undefined,
    createdAt: user.created_at,
    identities: user.identities ?? [],
  };
}

/**
 * Address the provider sends the visitor back to: the callback route, then
 * the current page.
 */
function callbackUrl(): string {
  const callback = new URL('/auth/callback', location.origin);
  callback.searchParams.set('next', safeNextPath(location.pathname));
  return callback.href;
}

/**
 * Throws the error of a Supabase call, so callers can show it.
 */
function check<T extends { error: unknown }>(result: T): T {
  if (result.error) {
    throw result.error instanceof Error
      ? result.error
      : new Error(String(result.error));
  }
  return result;
}

/**
 * Keeps track of the signed-in visitor and their profile in the browser.
 * The session lives in cookies managed by Supabase, so every page can stay
 * static.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }
    // Supabase calls must not run inside this callback, so the profile
    // loads in the effect below.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      return;
    }
    let isCancelled = false;
    void supabase
      .from('profiles')
      .select(profileColumns)
      .eq('id', userId)
      .maybeSingle<Profile>()
      .then(({ data }) => {
        if (!isCancelled) {
          setProfile(data);
        }
      });
    return () => {
      isCancelled = true;
      setProfile(null);
    };
  }, [userId]);

  const value = useMemo<AuthState>(() => {
    const client = () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }
      return supabase;
    };

    return {
      enabled: isSupabaseConfigured,
      loading,
      account: user ? toAccount(user, profile) : null,
      profile,
      async signIn(provider) {
        check(
          await client().auth.signInWithOAuth({
            provider,
            options: { redirectTo: callbackUrl() },
          })
        );
      },
      async signOut() {
        await getSupabaseBrowserClient()?.auth.signOut();
      },
      async linkProvider(provider) {
        check(
          await client().auth.linkIdentity({
            provider,
            options: { redirectTo: callbackUrl() },
          })
        );
      },
      async unlinkIdentity(identity) {
        const supabase = client();
        check(await supabase.auth.unlinkIdentity(identity));
        // Reloads the user, so the list of linked accounts updates.
        check(await supabase.auth.refreshSession());
      },
      async updateProfile(changes) {
        if (!user) {
          return;
        }
        const { data } = check(
          await client()
            .from('profiles')
            .upsert({ id: user.id, ...changes })
            .select(profileColumns)
            .single<Profile>()
        );
        setProfile(data);
      },
      async deleteAccount() {
        const supabase = client();
        check(await supabase.rpc('delete_own_account'));
        // The account is gone, so only the local session is left to clear.
        await supabase.auth.signOut({ scope: 'local' });
      },
    };
  }, [loading, profile, user]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const state = use(AuthContext);
  if (!state) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return state;
}
