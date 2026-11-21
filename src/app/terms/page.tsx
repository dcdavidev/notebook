import type { Metadata } from 'next';

import { LegalSummaryPage } from '@/components/legal-summary-page';
import { locales } from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Terms of Use · Notebook',
  alternates: {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `/${locale}/terms`])
    ),
  },
};

/**
 * Summary of the Terms of Use. It has no language in the URL: the browser picks
 * the saved language, and the full text is at `/[lang]/terms`.
 */
export default function TermsSummaryPage() {
  return <LegalSummaryPage page="terms" />;
}
