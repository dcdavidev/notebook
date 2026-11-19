'use client';

import { useEffect } from 'react';

/**
 * Sets the `lang` attribute of the `html` element. The root layout is
 * shared with the non-localized pages, so it cannot set the language.
 */
export function DocumentLanguage({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
