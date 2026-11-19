'use client';

import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { IconArrowRight } from '@tabler/icons-react';

import { type Locale, localeCookie, localeNames, locales } from '@/lib/locale';

const oneYear = 60 * 60 * 24 * 365;

/**
 * One button per available language. The suggested language is the main
 * button. Choosing a language stores it in a cookie and opens the site.
 */
export function LanguageButtons({ suggested }: { suggested: Locale }) {
  const router = useRouter();

  const choose = (locale: Locale) => {
    // The cookie lets the server render the site in the chosen language.
    // eslint-disable-next-line unicorn/no-document-cookie -- one simple, non-sensitive preference
    document.cookie = `${localeCookie}=${locale}; path=/; max-age=${oneYear}; samesite=lax`;
    router.push(`/${locale}/overview`);
  };

  // The suggested language comes first.
  const ordered = locales.toSorted(
    (a, b) => Number(b === suggested) - Number(a === suggested)
  );

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ gap: 1.5, justifyContent: 'center' }}
    >
      {ordered.map((locale) => {
        const isSuggested = locale === suggested;
        return (
          <Button
            key={locale}
            lang={locale}
            size="large"
            variant={isSuggested ? 'contained' : 'outlined'}
            endIcon={isSuggested ? <IconArrowRight size={18} /> : undefined}
            onClick={() => {
              choose(locale);
            }}
            sx={{
              borderRadius: 99,
              px: 3.5,
              minWidth: 160,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {localeNames[locale]}
          </Button>
        );
      })}
    </Stack>
  );
}
