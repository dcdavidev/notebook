import { headers } from 'next/headers';

import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { IconWorld } from '@tabler/icons-react';

import { ContinueButton, OtherLanguages } from './language-buttons';

import {
  countryPlace,
  type Locale,
  regionFromAcceptLanguage,
  suggestLocale,
} from '@/lib/locale';

/**
Message in each language, with and without a known country.
*/
const messages: Record<
  Locale,
  { withCountry: (place: string) => string; withoutCountry: string }
> = {
  it: {
    withCountry: (place) => `Abbiamo rilevato che sei ${place}`,
    withoutCountry: 'Lingua suggerita',
  },
  en: {
    withCountry: (place) => `We detected that you are ${place}`,
    withoutCountry: 'Suggested language',
  },
};

/**
 * Suggests a language from the visitor's country, with a button to continue
 * in it, and lists the other available languages below.
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
        action={<ContinueButton locale={suggested} />}
        sx={{
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          columnGap: 2,
          borderRadius: 3,
          bgcolor: 'background.paper',
          fontSize: { xs: '0.95rem', sm: '1rem' },
          textAlign: 'start',
          '& .MuiAlert-action': {
            m: 0,
            py: { xs: 1, sm: 0 },
            pl: 0,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: 'flex-end',
          },
        }}
      >
        {country
          ? message.withCountry(countryPlace(country, suggested))
          : message.withoutCountry}
      </Alert>
      <OtherLanguages suggested={suggested} />
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
        width={500}
        height={58}
        sx={{ maxWidth: '90vw', borderRadius: 3 }}
      />
      <Skeleton
        variant="rounded"
        width={150}
        height={36}
        sx={{ borderRadius: 99 }}
      />
    </Stack>
  );
}
