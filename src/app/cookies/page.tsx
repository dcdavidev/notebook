import type { Metadata } from 'next';

import { LegalSummaryPage } from '@/components/legal-summary-page';
import { locales } from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Cookie Policy · Notebook',
  alternates: {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `/${locale}/cookies`])
    ),
  },
};

/**
 * Summary of the Cookie Policy. It has no language in the URL: the browser picks
 * the saved language, and the full text is at `/[lang]/cookies`.
 */
export default function CookiesSummaryPage() {
  return <LegalSummaryPage page="cookies" />;
}
