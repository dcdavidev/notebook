'use client';

import NextLink from 'next/link';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconArrowRight, IconWorld } from '@tabler/icons-react';

import { PageSpinner } from '@/components/account/page-spinner';
import type { LegalPageName } from '@/components/legal-page';
import { LinkButton } from '@/components/link-button';
import { NotebookLogo } from '@/components/notebook-logo';
import { SettingsMenu } from '@/components/settings-menu';
import { legalSummaries } from '@/lib/legal-summaries';
import { type Locale, localeNames, locales } from '@/lib/locale';
import {
  savePreferredLocale,
  usePreferredLocale,
} from '@/lib/preferred-locale';

const pages: LegalPageName[] = ['privacy', 'cookies', 'terms'];

const labels: Record<
  Locale,
  {
    detected: (language: string) => string;
    switchTo: string;
    summary: string;
    readFull: (title: string) => string;
    otherPages: string;
    backToSite: string;
  }
> = {
  it: {
    detected: (language) => `Stai leggendo il riassunto in ${language}.`,
    switchTo: 'Cambia lingua:',
    summary: 'In breve',
    readFull: (title) => `Leggi il testo completo: ${title}`,
    otherPages: 'Altre note legali',
    backToSite: 'Torna a Notebook',
  },
  en: {
    detected: (language) => `You are reading the summary in ${language}.`,
    switchTo: 'Change language:',
    summary: 'In short',
    readFull: (title) => `Read the full text: ${title}`,
    otherPages: 'Other legal pages',
    backToSite: 'Back to Notebook',
  },
};

/**
 * Name of a language as written in another language, for example
 * "inglese" for English in Italian.
 */
function languageName(locale: Locale, inLocale: Locale): string {
  try {
    return (
      new Intl.DisplayNames([inLocale], { type: 'language' }).of(locale) ??
      localeNames[locale]
    );
  } catch {
    return localeNames[locale];
  }
}

function Header({ locale }: { locale: Locale }) {
  return (
    <Stack
      direction="row"
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 'appBar',
        alignItems: 'center',
        gap: 1,
        px: { xs: 1, md: 2 },
        py: 1,
        minHeight: 56,
        bgcolor: 'color-mix(in oklch, var(--nb-background) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack
        component={NextLink}
        href={`/${locale}/overview`}
        aria-label={labels[locale].backToSite}
        direction="row"
        sx={{
          flex: 1,
          alignItems: 'center',
          gap: 1,
          color: 'text.primary',
          textDecoration: 'none',
          px: 1,
        }}
      >
        <NotebookLogo size={32} />
        <Typography
          component="span"
          sx={{ fontFamily: 'var(--nb-font-title)', fontSize: '1.6rem' }}
        >
          Notebook
        </Typography>
      </Stack>
      <SettingsMenu stayOnPage />
    </Stack>
  );
}

/**
 * Language notice with a button for each other language. Choosing one saves
 * it, so the summary and the rest of the site switch to it.
 */
function LanguageSwitch({ locale }: { locale: Locale }) {
  const text = labels[locale];
  const others = locales.filter((item) => item !== locale);

  return (
    <Alert
      severity="info"
      variant="outlined"
      icon={<IconWorld size={22} />}
      sx={{
        alignItems: 'center',
        borderRadius: 3,
        bgcolor: 'background.paper',
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <span>{text.detected(languageName(locale, locale))}</span>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Typography component="span" variant="body2" color="text.secondary">
            {text.switchTo}
          </Typography>
          {others.map((item) => (
            <Button
              key={item}
              lang={item}
              size="small"
              variant="outlined"
              onClick={() => {
                savePreferredLocale(item);
              }}
              sx={{ borderRadius: 99, textTransform: 'none' }}
            >
              {localeNames[item]}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Alert>
  );
}

function Summary({ page, locale }: { page: LegalPageName; locale: Locale }) {
  const summary = legalSummaries[page][locale];
  const text = labels[locale];

  return (
    <Stack
      component="article"
      lang={locale}
      sx={{
        width: '100%',
        maxWidth: 760,
        mx: 'auto',
        px: 2,
        pt: { xs: 4, md: 6 },
        pb: 10,
        gap: 3,
      }}
    >
      <LanguageSwitch locale={locale} />

      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 400,
          fontSize: { xs: '1.9rem', sm: '2.4rem' },
          letterSpacing: '-0.01em',
        }}
      >
        {summary.title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
        {summary.intro}
      </Typography>

      <Box component="section" aria-labelledby="summary-heading">
        <Typography
          id="summary-heading"
          variant="h5"
          component="h2"
          sx={{ fontWeight: 700, mb: 2 }}
        >
          {text.summary}
        </Typography>
        <Stack component="ul" sx={{ m: 0, p: 0, listStyle: 'none', gap: 2 }}>
          {summary.points.map((point) => (
            <Box
              component="li"
              key={point.title}
              sx={{
                p: 2,
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {point.title}
              </Typography>
              <Typography color="text.secondary">{point.text}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <LinkButton
        href={`/${locale}/${page}`}
        variant="contained"
        size="large"
        endIcon={<IconArrowRight size={18} />}
        sx={{
          alignSelf: 'flex-start',
          borderRadius: 99,
          px: 3,
          textTransform: 'none',
        }}
      >
        {text.readFull(summary.title)}
      </LinkButton>

      <Box component="nav" aria-label={text.otherPages} sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {text.otherPages}
        </Typography>
        <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
          {pages
            .filter((item) => item !== page)
            .map((item) => (
              <MuiLink key={item} component={NextLink} href={`/${item}`}>
                {legalSummaries[item][locale].title}
              </MuiLink>
            ))}
        </Stack>
      </Box>
    </Stack>
  );
}

/**
 * Summary of a legal page in the visitor's language, with a link to the full
 * text at `/[lang]/[page]`. The language is the saved choice, or the browser
 * language when there is none.
 */
export function LegalSummaryPage({ page }: { page: LegalPageName }) {
  const locale = usePreferredLocale();

  // Only the browser knows the language, so the server renders a spinner.
  if (!locale) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
        <PageSpinner label="Loading" />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Header locale={locale} />
      <Box component="main">
        <Summary page={page} locale={locale} />
      </Box>
    </Box>
  );
}
