/**
 * Address and public key of the Supabase project. Both are safe to ship to
 * the browser: Row Level Security on every table decides what a visitor can
 * read and write.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

/**
Accounts are off when the project is not configured, for example in a fork.
*/
export const isSupabaseConfigured = supabaseUrl !== '' && supabaseKey !== '';
