'use client';

import { useSyncExternalStore } from 'react';

import { readCookie, writeCookie } from '@/lib/consent';
import { isLocale, type Locale, localeCookie } from '@/lib/locale';

const changeEvent = 'nb-locale-change';

/**
 * Language that the visitor chose, or the browser language when there is
 * no choice yet.
 */
export function readPreferredLocale(): Locale {
  const stored = readCookie(localeCookie);
  if (isLocale(stored)) {
    return stored;
  }
  return navigator.language.toLowerCase().startsWith('it') ? 'it' : 'en';
}

/**
 * Saves the language and notifies the components that show it.
 */
export function savePreferredLocale(locale: Locale): void {
  writeCookie(localeCookie, locale);
  dispatchEvent(new Event(changeEvent));
}

/**
 * Listens for changes to the saved language.
 */
function subscribe(callback: () => void): () => void {
  addEventListener(changeEvent, callback);
  return () => {
    removeEventListener(changeEvent, callback);
  };
}

/**
 * Preferred language for pages outside `/[lang]`. It is `null` on the
 * server and during hydration, because only the browser knows it.
 */
export function usePreferredLocale(): Locale | null {
  return useSyncExternalStore(subscribe, readPreferredLocale, () => null);
}
