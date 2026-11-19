import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { routing } from '@/i18n/routing';

/**
 * The whole page depends on the language, and each language is fully
 * prerendered, so it can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/overview'>): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('overviewTitle'),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/overview`])
      ),
    },
  };
}

export default async function OverviewPage({
  params,
}: PageProps<'/[lang]/overview'>) {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Overview' });

  return (
    <Stack
      sx={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        pb: { xs: 6, md: '12vh' },
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 400,
          fontSize: { xs: '1.75rem', sm: '2.4rem' },
          letterSpacing: '-0.01em',
          textAlign: 'center',
          textWrap: 'balance',
        }}
      >
        {t('title')}
      </Typography>
    </Stack>
  );
}
