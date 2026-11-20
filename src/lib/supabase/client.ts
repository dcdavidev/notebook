'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabaseKey, supabaseUrl } from './config';

/**
The browser shares one client, created on first use.
*/
const cache: { client?: SupabaseClient } = {};

/**
 * Supabase client for the browser. It keeps the session in first-party
 * cookies and refreshes the token by itself, so the pages stay static and
 * no proxy is needed.
 */
export function getSupabaseBrowserClient(): SupabaseClient | undefined {
  if (!isSupabaseConfigured) {
    return undefined;
  }
  cache.client ??= createBrowserClient(supabaseUrl, supabaseKey);
  return cache.client;
}
