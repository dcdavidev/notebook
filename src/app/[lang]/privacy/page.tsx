import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';

import { LegalPage, legalPageMetadata } from '@/components/legal-page';
import { routing } from '@/i18n/routing';

/**
 * The whole page depends on the language, and each language is fully
 * prerendered, so it can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/privacy'>): Promise<Metadata> {
  const { lang } = await params;
  return legalPageMetadata(
    'privacy',
    hasLocale(routing.locales, lang) ? lang : routing.defaultLocale
  );
}

export default async function PrivacyPage({
  params,
}: PageProps<'/[lang]/privacy'>) {
  const { lang } = await params;
  return (
    <LegalPage
      page="privacy"
      locale={hasLocale(routing.locales, lang) ? lang : routing.defaultLocale}
    />
  );
}
