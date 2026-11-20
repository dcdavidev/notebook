import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image once per language.
*/
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

/**
Shared image of the overview, in the language of the page.
*/
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Overview' });
  return renderOgImage({ title: t('title'), description: t('subtitle') });
}
