import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { getGlossary, getGlossaryParams } from '@/lib/courses';
import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image of every glossary in every language.
*/
export async function generateStaticParams() {
  return getGlossaryParams();
}

/**
Shared image of a glossary: its title, description, and number of terms.
*/
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; topic: string }>;
}) {
  const { lang, topic } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const [glossary, t] = await Promise.all([
    getGlossary(lang, topic),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  if (!glossary) {
    notFound();
  }

  return renderOgImage({
    eyebrow: t('glossary'),
    title: glossary.title ?? t('glossary'),
    description: glossary.description,
    meta: t('glossaryTermCount', { count: glossary.termCount }),
  });
}
