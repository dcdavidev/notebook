import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

/**
 * Loads the messages for the language of the request. The `[lang]` layout
 * and pages call `setRequestLocale`, which provides `requestLocale` and
 * keeps the pages statically rendered.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (
      (await import(`../../messages/${locale}.json`)) as {
        default: Record<string, unknown>;
      }
    ).default,
  };
});
