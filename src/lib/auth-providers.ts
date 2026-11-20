import type { Provider } from '@supabase/supabase-js';

/**
 * Third-party accounts that a visitor can sign in with, in the order of
 * the buttons. Each one must also be turned on in the Supabase dashboard
 * (Authentication → Sign In / Providers). There is no email sign-in.
 *
 * `scopes` asks the provider for more than its default data. Microsoft
 * (Supabase calls it `azure`) sends the email address only with `email`.
 */
export const authProviders = [
  { id: 'google', name: 'Google' },
  { id: 'github', name: 'GitHub' },
  { id: 'azure', name: 'Microsoft', scopes: 'email' },
  { id: 'facebook', name: 'Facebook' },
] as const satisfies readonly {
  id: Provider;
  name: string;
  scopes?: string;
}[];

export type AuthProviderId = (typeof authProviders)[number]['id'];

/**
 * Keeps the redirect after sign-in on this site: only a path that starts
 * with a single `/` is allowed.
 */
export function safeNextPath(value: string | null | undefined): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}
