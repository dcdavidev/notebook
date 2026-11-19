'use client';

import { Analytics } from '@vercel/analytics/next';

import { useHasConsent } from '@/lib/consent';

/**
 * Vercel Web Analytics, loaded only after the visitor accepts the
 * "analytics" category in the cookie banner.
 */
export function ConsentedAnalytics() {
  const hasAnalyticsConsent = useHasConsent('analytics');
  return hasAnalyticsConsent ? <Analytics /> : null;
}
