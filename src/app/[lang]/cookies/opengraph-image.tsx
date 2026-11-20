import { getTranslations } from 'next-intl/server';

import { localeParams, ogLocale, renderOgImage } from '@/lib/og-image';

export { contentType, size } from '@/lib/og-image';

export const alt = 'Notebook';

/**
Prerenders the image once per language.
*/
export function generateStaticParams() {
  return localeParams();
}

/**
Shared image of the cookie policy, in the language of the page.
*/
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getTranslations({
    locale: ogLocale(lang),
    namespace: 'Legal',
  });
  return renderOgImage({ title: t('cookies') });
}
