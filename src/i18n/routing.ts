import { defineRouting } from 'next-intl/routing';

import { defaultLocale, locales } from '@/lib/locale';

/**
 * Localized routes live under `src/app/[lang]` and always carry the
 * language prefix, for example `/it/overview` and `/en/overview`. There is
 * no proxy: the landing page at `/` lets the visitor choose the language.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
