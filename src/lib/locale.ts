/**
Languages that the site is available in.
*/
export const locales = ['it', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
Cookie that stores the language chosen by the visitor.
*/
export const localeCookie = 'nb-locale';

/**
Name of each language, written in that language.
*/
export const localeNames: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
};

/**
Countries where Italian is an official language.
*/
const italianCountries = new Set(['IT', 'SM', 'VA']);

/**
 * Checks that a value is one of the available languages.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale);
}

/**
 * Reads the region of the first language in an `Accept-Language` header,
 * for example `IT` from `it-IT,it;q=0.9,en;q=0.8`.
 */
export function regionFromAcceptLanguage(header: string | null): string | null {
  const first = header?.split(',', 1)[0]?.trim();
  const region = first?.split(/[-_]/, 2)[1];
  return region && /^[a-z]{2}$/i.test(region) ? region.toUpperCase() : null;
}

/**
 * Suggests a language from the visitor's country, or from the languages of
 * the browser when the country is unknown.
 */
export function suggestLocale(
  country: string | null,
  acceptLanguage: string | null
): Locale {
  if (country) {
    return italianCountries.has(country) ? 'it' : 'en';
  }
  const language = acceptLanguage?.split(',', 1)[0]?.trim().slice(0, 2);
  return language === 'it' ? 'it' : defaultLocale;
}

/**
 * Countries whose English name takes "the", like "the United States".
 */
const englishCountriesWithThe = new Set([
  'AE',
  'BS',
  'CD',
  'CF',
  'CG',
  'DO',
  'GB',
  'GM',
  'KY',
  'MH',
  'MV',
  'NL',
  'PH',
  'SB',
  'US',
  'VA',
]);

/**
 * Italian prepositions for the Italian-speaking countries.
 */
const italianPlaces: Record<string, string> = {
  IT: 'in Italia',
  SM: 'a San Marino',
  VA: 'nella Città del Vaticano',
};

/**
 * Country with the right preposition, ready for "you are …", for example
 * "in the United States" or "in Italia".
 */
export function countryPlace(country: string, locale: Locale): string {
  if (locale === 'it') {
    return italianPlaces[country] ?? `in ${countryName(country, locale)}`;
  }
  const article = englishCountriesWithThe.has(country) ? 'the ' : '';
  return `in ${article}${countryName(country, locale)}`;
}

/**
 * Name of a country in the given language, for example "Italia".
 */
export function countryName(country: string, locale: Locale): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: 'region' }).of(country) ?? country
    );
  } catch {
    return country;
  }
}
