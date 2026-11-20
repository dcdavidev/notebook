import { type NextRequest, NextResponse } from 'next/server';

import { safeNextPath } from '@/lib/auth-providers';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * The provider sends the visitor back here after sign-in. The handler
 * swaps the one-time code for a session, saves it in cookies, and opens
 * the page where the visitor started.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get('next'));
  const code = searchParams.get('code');

  if (isSupabaseConfigured && code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const failed = new URL(next, origin);
  failed.searchParams.set('auth', 'error');
  return NextResponse.redirect(failed);
}
