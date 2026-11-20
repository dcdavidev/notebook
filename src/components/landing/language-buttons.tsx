'use client';

import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { IconArrowRight } from '@tabler/icons-react';

import { type Locale, localeCookie, localeNames, locales } from '@/lib/locale';

const oneYear = 60 * 60 * 24 * 365;

/**
 * Returns a function that stores the chosen language in a cookie and opens
 * the site in that language.
 */
function useChooseLocale() {
  const router = useRouter();

  return (locale: Locale) => {
    // The cookie lets the server render the site in the chosen language.
    // eslint-disable-next-line unicorn/no-document-cookie -- one simple, non-sensitive preference
    document.cookie = `${localeCookie}=${locale}; path=/; max-age=${oneYear}; samesite=lax`;
    router.push(`/${locale}/overview`);
  };
}

/**
Label of the main button, written in the suggested language.
*/
const continueLabels: Record<Locale, string> = {
  it: 'Continua in italiano',
  en: 'Continue in English',
};

/**
 * Main button that continues in the suggested language. It sits inside the
 * locale alert.
 */
export function ContinueButton({ locale }: { locale: Locale }) {
  const choose = useChooseLocale();

  return (
    <Button
      lang={locale}
      variant="contained"
      endIcon={<IconArrowRight size={18} />}
      onClick={() => {
        choose(locale);
      }}
      sx={{
        borderRadius: 99,
        px: 2.5,
        textTransform: 'none',
        whiteSpace: 'nowrap',
        fontSize: '0.95rem',
      }}
    >
      {continueLabels[locale]}
    </Button>
  );
}

/**
 * The other available languages, laid out in a masonry of columns below the
 * alert.
 */
export function OtherLanguages({ suggested }: { suggested: Locale }) {
  const choose = useChooseLocale();
  const others = locales.filter((locale) => locale !== suggested);

  if (others.length === 0) {
    return null;
  }

  const columns = Math.min(others.length, 3);

  return (
    <Box
      sx={{
        columnCount: { xs: Math.min(columns, 2), sm: columns },
        columnGap: 1.5,
        width: { xs: '100%', sm: 'auto' },
        maxWidth: 520,
      }}
    >
      {others.map((locale) => (
        <Button
          key={locale}
          lang={locale}
          variant="outlined"
          fullWidth
          onClick={() => {
            choose(locale);
          }}
          sx={{
            breakInside: 'avoid',
            mb: 1.5,
            minWidth: 150,
            borderRadius: 99,
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          {localeNames[locale]}
        </Button>
      ))}
    </Box>
  );
}
