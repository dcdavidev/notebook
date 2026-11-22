import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import {
  findEdition,
  getCourses,
  getGlossary,
  getGlossaryParams,
} from '@/lib/courses';
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
  params: Promise<{ lang: string; topic: string; edition: string }>;
}) {
  const { lang, topic, edition } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const editionData = findEdition(
    courses.find((item) => item.slug === topic)?.editions ?? [],
    edition
  );
  const glossary = editionData
    ? await getGlossary(lang, topic, editionData.name)
    : null;
  if (!editionData || !glossary) {
    notFound();
  }

  return renderOgImage({
    eyebrow: `${t('glossary')} · ${editionData.label}`,
    title: glossary.title ?? t('glossary'),
    description: glossary.description,
    meta: t('glossaryTermCount', { count: glossary.termCount }),
  });
}
