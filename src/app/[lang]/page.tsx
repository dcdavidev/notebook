import { hasLocale } from 'next-intl';

import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * It only redirects, so there is no UI to validate for instant navigation.
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

/**
 * `/it` and `/en` open the overview in that language.
 */
export default async function LocaleIndex({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  redirect({
    href: '/overview',
    locale: hasLocale(routing.locales, lang) ? lang : routing.defaultLocale,
  });
}
