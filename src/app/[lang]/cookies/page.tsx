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
}: PageProps<'/[lang]/cookies'>): Promise<Metadata> {
  const { lang } = await params;
  return legalPageMetadata(
    'cookies',
    hasLocale(routing.locales, lang) ? lang : routing.defaultLocale
  );
}

export default async function CookiesPage({
  params,
}: PageProps<'/[lang]/cookies'>) {
  const { lang } = await params;
  return (
    <LegalPage
      page="cookies"
      locale={hasLocale(routing.locales, lang) ? lang : routing.defaultLocale}
    />
  );
}
