import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { getGlossarySection, getGlossarySectionParams } from '@/lib/courses';
import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
Prerenders the image of every glossary section in every language.
*/
export async function generateStaticParams() {
  return getGlossarySectionParams();
}

/**
Shared image of a glossary section: its title, description, and number of terms.
*/
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; topic: string; section: string }>;
}) {
  const { lang, topic, section } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const [data, t] = await Promise.all([
    getGlossarySection(lang, topic, section),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  if (!data) {
    notFound();
  }

  return renderOgImage({
    eyebrow: t('glossary'),
    title: data.title,
    description: data.description,
    meta: t('glossaryTermCount', { count: data.termCount }),
  });
}
