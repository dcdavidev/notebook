import { headers } from 'next/headers';

import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { IconWorld } from '@tabler/icons-react';

import { LanguageButtons } from './language-buttons';

import {
  countryPlace,
  type Locale,
  regionFromAcceptLanguage,
  suggestLocale,
} from '@/lib/locale';

/**
Question in each language, with and without a known country.
*/
const messages: Record<
  Locale,
  { withCountry: (place: string) => string; withoutCountry: string }
> = {
  it: {
    withCountry: (place) =>
      `Abbiamo rilevato che sei ${place}. Vuoi continuare in italiano?`,
    withoutCountry: 'Vuoi continuare in italiano?',
  },
  en: {
    withCountry: (place) =>
      `We detected that you are ${place}. Do you want to continue in English?`,
    withoutCountry: 'Do you want to continue in English?',
  },
};

/**
 * Suggests a language from the visitor's country and shows a button for
 * each available language.
 *
 * On Vercel, the country comes from the `x-vercel-ip-country` header. In
 * development, it falls back to the region of the browser language.
 */
export async function LocalePrompt() {
  const requestHeaders = await headers();
  const acceptLanguage = requestHeaders.get('accept-language');
  const country =
    requestHeaders.get('x-vercel-ip-country')?.toUpperCase() ??
    regionFromAcceptLanguage(acceptLanguage);
  const suggested = suggestLocale(country, acceptLanguage);
  const message = messages[suggested];

  return (
    <Stack sx={{ alignItems: 'center', gap: 2.5 }}>
      <Alert
        severity="info"
        variant="outlined"
        icon={<IconWorld size={22} />}
        lang={suggested}
        sx={{
          alignItems: 'center',
          borderRadius: 3,
          bgcolor: 'background.paper',
          fontSize: { xs: '0.95rem', sm: '1rem' },
          textAlign: 'start',
        }}
      >
        {country
          ? message.withCountry(countryPlace(country, suggested))
          : message.withoutCountry}
      </Alert>
      <LanguageButtons suggested={suggested} />
    </Stack>
  );
}

/**
Placeholder with the same size as the prompt, shown while it loads.
*/
export function LocalePromptSkeleton() {
  return (
    <Stack sx={{ alignItems: 'center', gap: 2.5 }} aria-hidden="true">
      <Skeleton
        variant="rounded"
        width={460}
        height={50}
        sx={{ maxWidth: '90vw', borderRadius: 3 }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5 }}>
        <Skeleton
          variant="rounded"
          width={160}
          height={42}
          sx={{ borderRadius: 99 }}
        />
        <Skeleton
          variant="rounded"
          width={160}
          height={42}
          sx={{ borderRadius: 99 }}
        />
      </Stack>
    </Stack>
  );
}
