import type { Metadata } from 'next';

import { LegalSummaryPage } from '@/components/legal-summary-page';
import { locales } from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Privacy Policy · Notebook',
  alternates: {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `/${locale}/privacy`])
    ),
  },
};

/**
 * Summary of the Privacy Policy. It has no language in the URL: the browser picks
 * the saved language, and the full text is at `/[lang]/privacy`.
 */
export default function PrivacySummaryPage() {
  return <LegalSummaryPage page="privacy" />;
}
