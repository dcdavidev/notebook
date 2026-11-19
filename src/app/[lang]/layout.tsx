import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { DocumentLanguage } from '@/components/document-language';
import { AppShell } from '@/components/shell/app-shell';
import { routing } from '@/i18n/routing';
import { getCourses } from '@/lib/courses';

/**
Prerenders every page once per language.
*/
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

/**
 * The language changes every word of the page, so there is no
 * language-independent shell to show first. Each language is fully
 * prerendered by `generateStaticParams`, so the route can block on it.
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

/**
 * Any unknown first segment, such as `/does-not-exist`, reaches this
 * layout as a language. It renders the 404 page, so give it that title.
 */
export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(routing.locales, lang)
    ? {}
    : { title: 'Page not found · Notebook' };
}

/**
 * Layout of the localized pages: it validates the language, provides the
 * translations, and wraps the page in the app shell.
 */
export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);
  const courses = await getCourses(lang);

  return (
    <NextIntlClientProvider>
      <DocumentLanguage lang={lang} />
      <AppShell courses={courses}>{children}</AppShell>
    </NextIntlClientProvider>
  );
}
