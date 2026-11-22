'use client';

import type { ReactNode } from 'react';

import NextLink from 'next/link';
import { NextIntlClientProvider, useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import enMessages from '../../../messages/en.json';
import itMessages from '../../../messages/it.json';

import { AccountSections } from './account-sections';
import { PageSpinner } from './page-spinner';

import { AccountMenu } from '@/components/auth/account-menu';
import { NotebookLogo } from '@/components/notebook-logo';
import { SettingsMenu } from '@/components/settings-menu';
import type { Locale } from '@/lib/locale';
import { usePreferredLocale } from '@/lib/preferred-locale';

/**
Only the namespaces that this page uses reach the provider.
*/
const pageMessages: Record<
  Locale,
  Pick<
    typeof enMessages,
    'Auth' | 'Account' | 'Favorites' | 'Bookmarks' | 'Progress'
  >
> = {
  en: {
    Auth: enMessages.Auth,
    Account: enMessages.Account,
    Favorites: enMessages.Favorites,
    Bookmarks: enMessages.Bookmarks,
    Progress: enMessages.Progress,
  },
  it: {
    Auth: itMessages.Auth,
    Account: itMessages.Account,
    Favorites: itMessages.Favorites,
    Bookmarks: itMessages.Bookmarks,
    Progress: itMessages.Progress,
  },
};

function Header({ locale }: { locale: Locale }) {
  const t = useTranslations('Account');

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
        aria-label={t('backToSite')}
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
      <AccountMenu />
    </Stack>
  );
}

function Layout({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Header locale={locale} />
      <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
        {children}
      </Container>
    </Box>
  );
}

/**
 * The `/account` page in the visitor's language.
 */
export function AccountPage() {
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
    <NextIntlClientProvider
      locale={locale}
      messages={pageMessages[locale]}
      timeZone={new Intl.DateTimeFormat().resolvedOptions().timeZone}
    >
      <Layout locale={locale}>
        <AccountSections locale={locale} />
      </Layout>
    </NextIntlClientProvider>
  );
}
