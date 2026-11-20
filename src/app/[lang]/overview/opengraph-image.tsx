import { getTranslations } from 'next-intl/server';

import { localeParams, ogLocale, renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image once per language.
*/
export function generateStaticParams() {
  return localeParams();
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
  const t = await getTranslations({
    locale: ogLocale(lang),
    namespace: 'Overview',
  });
  return renderOgImage({ title: t('title'), description: t('subtitle') });
}
