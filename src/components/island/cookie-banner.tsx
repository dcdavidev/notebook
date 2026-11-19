'use client';

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button, { type ButtonProps } from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import {
  IconAdjustmentsHorizontal,
  IconArrowLeft,
  IconCircleCheck,
  IconCookie,
} from '@tabler/icons-react';

import { DynamicIsland } from './dynamic-island';

import {
  consentCategories,
  type ConsentCategory,
  type ConsentChoice,
  onOpenCookiePreferences,
  readConsent,
  readCookie,
  saveConsent,
  writeCookie,
} from '@/lib/consent';
import { isLocale, type Locale, localeCookie, locales } from '@/lib/locale';

/**
Wait before showing the banner, so the page can appear first, in ms.
*/
const showDelay = 1800;
/**
How long the confirmation stays visible, in ms.
*/
const confirmationDuration = 1600;

type Status = 'unknown' | 'asking' | 'preferences' | 'saved' | 'done';

interface CategoryText {
  title: string;
  description: string;
}

const texts: Record<
  Locale,
  {
    label: string;
    title: string;
    body: string;
    acceptAll: string;
    necessaryOnly: string;
    preferences: string;
    preferencesTitle: string;
    back: string;
    save: string;
    alwaysOn: string;
    saved: string;
    language: string;
    categories: Record<ConsentCategory, CategoryText>;
  }
> = {
  it: {
    label: 'Preferenze sui cookie',
    title: 'Cookie',
    body: 'Usiamo cookie tecnici e la memoria del browser per ricordare lingua, tema e palette. Con il tuo consenso useremo anche cookie analitici anonimi e contenuti esterni.',
    acceptAll: 'Accetta tutti',
    necessaryOnly: 'Solo necessari',
    preferences: 'Preferenze',
    preferencesTitle: 'Preferenze cookie',
    back: 'Indietro',
    save: 'Salva preferenze',
    alwaysOn: 'Sempre attivi',
    saved: 'Preferenze salvate',
    language: 'Lingua',
    categories: {
      necessary: {
        title: 'Necessari',
        description:
          'Ricordano lingua, tema, palette e questa scelta. Senza di loro il sito non funziona.',
      },
      analytics: {
        title: 'Analitici',
        description:
          'Statistiche anonime sulle pagine visitate, per capire cosa migliorare.',
      },
      external: {
        title: 'Contenuti esterni',
        description:
          'Immagini, video e altri contenuti caricati da siti esterni.',
      },
    },
  },
  en: {
    label: 'Cookie preferences',
    title: 'Cookies',
    body: 'We use technical cookies and browser storage to remember your language, theme, and palette. With your consent, we will also use anonymous analytics cookies and external content.',
    acceptAll: 'Accept all',
    necessaryOnly: 'Necessary only',
    preferences: 'Preferences',
    preferencesTitle: 'Cookie preferences',
    back: 'Back',
    save: 'Save preferences',
    alwaysOn: 'Always on',
    saved: 'Preferences saved',
    language: 'Language',
    categories: {
      necessary: {
        title: 'Necessary',
        description:
          'Remember your language, theme, palette, and this choice. The site does not work without them.',
      },
      analytics: {
        title: 'Analytics',
        description:
          'Anonymous statistics about the pages you visit, to understand what to improve.',
      },
      external: {
        title: 'External content',
        description:
          'Images, videos, and other content loaded from external sites.',
      },
    },
  },
};

const allAccepted: ConsentChoice = {
  necessary: true,
  analytics: true,
  external: true,
};
const onlyNecessary: ConsentChoice = {
  necessary: true,
  analytics: false,
  external: false,
};

/**
Language of the banner: the chosen site language, or the browser one.
*/
function initialLocale(): Locale {
  const stored = readCookie(localeCookie);
  if (isLocale(stored)) {
    return stored;
  }
  return navigator.language.toLowerCase().startsWith('it') ? 'it' : 'en';
}

const lightButton: ButtonProps['sx'] = {
  borderRadius: 99,
  px: 2,
  color: '#050505',
  textTransform: 'none',
  fontWeight: 700,
  bgcolor: '#f5f5f5',
  '&:hover': { bgcolor: '#e5e5e5' },
};

const darkButton: ButtonProps['sx'] = {
  borderRadius: 99,
  px: 2,
  color: '#f5f5f5',
  textTransform: 'none',
  bgcolor: 'rgb(255 255 255 / 0.1)',
  '&:hover': { bgcolor: 'rgb(255 255 255 / 0.18)' },
};

/**
 * Cookie banner shown in the Dynamic Island on the first visit. The
 * visitor can accept all cookies, keep only the necessary ones, or choose
 * each category in the preferences. The banner switches between Italian
 * and English at any time.
 */
export function CookieBanner() {
  const [status, setStatus] = useState<Status>('unknown');
  const [locale, setLocale] = useState<Locale>('en');
  const [choice, setChoice] = useState<ConsentChoice>(onlyNecessary);

  useEffect(() => {
    if (readConsent()) {
      return;
    }
    const timer = setTimeout(() => {
      setLocale(initialLocale());
      setStatus('asking');
    }, showDelay);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // The settings menu can reopen the preferences with the current choice.
  useEffect(
    () =>
      onOpenCookiePreferences(() => {
        setLocale(initialLocale());
        setChoice(readConsent() ?? onlyNecessary);
        setStatus('preferences');
      }),
    []
  );

  useEffect(() => {
    if (status !== 'saved') {
      return;
    }
    const timer = setTimeout(() => {
      setStatus('done');
    }, confirmationDuration);
    return () => {
      clearTimeout(timer);
    };
  }, [status]);

  const changeLocale = (next: Locale) => {
    setLocale(next);
    writeCookie(localeCookie, next);
  };

  const save = (next: ConsentChoice) => {
    saveConsent(next);
    setStatus('saved');
  };

  const text = texts[locale];
  const isAsking = status === 'asking' || status === 'preferences';

  const header = (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 34,
          height: 34,
          borderRadius: '50%',
          bgcolor: 'rgb(255 255 255 / 0.1)',
        }}
      >
        {status === 'preferences' ? (
          <IconAdjustmentsHorizontal size={20} />
        ) : (
          <IconCookie size={20} />
        )}
      </Box>
      <Typography sx={{ flex: 1, fontWeight: 700 }}>
        {status === 'preferences' ? text.preferencesTitle : text.title}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={locale}
        aria-label={text.language}
        onChange={(_, value: unknown) => {
          if (isLocale(value)) {
            changeLocale(value);
          }
        }}
        sx={{
          '& .MuiToggleButton-root': {
            px: 1.25,
            py: 0.25,
            color: 'rgb(255 255 255 / 0.6)',
            borderColor: 'rgb(255 255 255 / 0.18)',
            fontWeight: 600,
            '&.Mui-selected': { color: '#050505', bgcolor: '#f5f5f5' },
            '&.Mui-selected:hover': { bgcolor: '#e5e5e5' },
          },
        }}
      >
        {locales.map((item) => (
          <ToggleButton key={item} value={item} lang={item}>
            {item.toUpperCase()}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );

  let content;
  if (status === 'saved') {
    content = (
      <Stack
        direction="row"
        role="status"
        lang={locale}
        sx={{ alignItems: 'center', justifyContent: 'center', gap: 1, p: 1.5 }}
      >
        <IconCircleCheck size={20} color="#4ade80" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {text.saved}
        </Typography>
      </Stack>
    );
  } else if (status === 'preferences') {
    content = (
      <Stack lang={locale} sx={{ p: { xs: 2, sm: 2.5 }, gap: 1.5 }}>
        {header}
        <Stack sx={{ gap: 1 }}>
          {consentCategories.map((category) => {
            const isNecessary = category === 'necessary';
            const categoryText = text.categories[category];
            const switchId = `cookie-${category}`;
            return (
              <Stack
                key={category}
                direction="row"
                sx={{
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 4,
                  bgcolor: 'rgb(255 255 255 / 0.06)',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    component="label"
                    htmlFor={switchId}
                    variant="body2"
                    sx={{ fontWeight: 700, display: 'block' }}
                  >
                    {categoryText.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgb(255 255 255 / 0.65)', lineHeight: 1.45 }}
                  >
                    {categoryText.description}
                  </Typography>
                </Box>
                {isNecessary ? (
                  <Typography
                    variant="caption"
                    sx={{ color: '#4ade80', fontWeight: 600, flexShrink: 0 }}
                  >
                    {text.alwaysOn}
                  </Typography>
                ) : (
                  <Switch
                    id={switchId}
                    checked={choice[category]}
                    onChange={(event) => {
                      setChoice((current) => ({
                        ...current,
                        [category]: event.target.checked,
                      }));
                    }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#f5f5f5',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          bgcolor: '#4ade80',
                          opacity: 1,
                        },
                      '& .MuiSwitch-track': {
                        bgcolor: 'rgb(255 255 255 / 0.3)',
                      },
                    }}
                  />
                )}
              </Stack>
            );
          })}
        </Stack>
        <Stack direction="row" sx={{ gap: 1, justifyContent: 'space-between' }}>
          <Button
            size="small"
            startIcon={<IconArrowLeft size={16} />}
            onClick={() => {
              setStatus('asking');
            }}
            sx={darkButton}
          >
            {text.back}
          </Button>
          <Button
            size="small"
            onClick={() => {
              save(choice);
            }}
            sx={lightButton}
          >
            {text.save}
          </Button>
        </Stack>
      </Stack>
    );
  } else {
    content = (
      <Stack lang={locale} sx={{ p: { xs: 2, sm: 2.5 }, gap: 1.5 }}>
        {header}
        <Typography
          variant="body2"
          sx={{ color: 'rgb(255 255 255 / 0.75)', lineHeight: 1.55 }}
        >
          {text.body}
        </Typography>
        <Stack
          direction="row"
          sx={{ gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}
        >
          <Button
            size="small"
            startIcon={<IconAdjustmentsHorizontal size={16} />}
            onClick={() => {
              setStatus('preferences');
            }}
            sx={{ ...darkButton, mr: 'auto' }}
          >
            {text.preferences}
          </Button>
          <Button
            size="small"
            onClick={() => {
              save(onlyNecessary);
            }}
            sx={darkButton}
          >
            {text.necessaryOnly}
          </Button>
          <Button
            size="small"
            onClick={() => {
              save(allAccepted);
            }}
            sx={lightButton}
          >
            {text.acceptAll}
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <DynamicIsland
      open={isAsking || status === 'saved'}
      modal={isAsking}
      label={text.label}
    >
      {content}
    </DynamicIsland>
  );
}
