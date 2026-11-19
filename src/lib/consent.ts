'use client';

import { useSyncExternalStore } from 'react';

/**
Cookie that stores the accepted categories, for example `necessary,analytics`.
*/
export const consentCookie = 'nb-cookie-consent';

/**
Categories of cookies and storage that the visitor can accept.
*/
export const consentCategories = [
  'necessary',
  'analytics',
  'external',
] as const;

export type ConsentCategory = (typeof consentCategories)[number];

/**
Categories that the visitor can turn off (necessary is always on).
*/
export const optionalCategories: ConsentCategory[] = ['analytics', 'external'];

export type ConsentChoice = Record<ConsentCategory, boolean>;

const oneYear = 60 * 60 * 24 * 365;
const changeEvent = 'nb-consent-change';

/**
 * Checks that a value is a known consent category.
 */
function isCategory(value: string): value is ConsentCategory {
  return consentCategories.includes(value as ConsentCategory);
}

/**
 * Reads a cookie value in the browser.
 */
export function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=', 2)[1];
}

/**
 * Writes a first-party cookie that lasts one year.
 */
export function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=${oneYear}; samesite=lax`;
}

/**
 * Reads the stored choice, or `null` if the visitor has not chosen yet.
 */
export function readConsent(): ConsentChoice | null {
  const raw = readCookie(consentCookie);
  if (!raw) {
    return null;
  }
  const accepted = new Set(
    decodeURIComponent(raw).split(',').filter(isCategory)
  );
  return {
    necessary: true,
    analytics: accepted.has('analytics'),
    external: accepted.has('external'),
  };
}

/**
 * Stores the choice and notifies the components that depend on it.
 */
export function saveConsent(choice: ConsentChoice): void {
  const accepted = consentCategories.filter(
    (category) => category === 'necessary' || choice[category]
  );
  writeCookie(consentCookie, encodeURIComponent(accepted.join(',')));
  dispatchEvent(new Event(changeEvent));
}

/**
 * Listens for changes to the stored choice.
 */
function subscribe(callback: () => void): () => void {
  addEventListener(changeEvent, callback);
  return () => {
    removeEventListener(changeEvent, callback);
  };
}

/**
 * Whether the visitor accepted a category. It is `false` on the server
 * and until the visitor chooses.
 */
export function useHasConsent(category: ConsentCategory): boolean {
  return useSyncExternalStore(
    subscribe,
    () => readConsent()?.[category] ?? false,
    () => false
  );
}

const openPreferencesEvent = 'nb-open-cookie-preferences';

/**
 * Opens the cookie preferences in the Dynamic Island, for example from the
 * settings menu.
 */
export function openCookiePreferences(): void {
  dispatchEvent(new Event(openPreferencesEvent));
}

/**
 * Calls `callback` every time something asks to open the cookie
 * preferences. Returns a function that stops listening.
 */
export function onOpenCookiePreferences(callback: () => void): () => void {
  addEventListener(openPreferencesEvent, callback);
  return () => {
    removeEventListener(openPreferencesEvent, callback);
  };
}
