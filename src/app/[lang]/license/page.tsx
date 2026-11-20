import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { MarkdownContent } from '@/components/markdown/markdown-content';
import { routing } from '@/i18n/routing';
import { getRepositoryDocument } from '@/lib/repository-docs';

/**
 * The whole page depends on the language, and each language is fully
 * prerendered, so it can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/license'>): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Legal' });
  return {
    title: `${t('license')} · Notebook`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/license`])
      ),
    },
  };
}

const sectionTitleSx = {
  fontWeight: 700,
  fontSize: '1.75rem',
  lineHeight: 1.25,
  mt: 3,
};

/**
 * The license page: a short summary, the unofficial Italian translation on
 * the Italian page, and the official English text from `LICENSE`.
 */
export default async function LicensePage({
  params,
}: PageProps<'/[lang]/license'>) {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  setRequestLocale(locale);
  const [t, official, translation] = await Promise.all([
    getTranslations({ locale, namespace: 'Legal' }),
    getRepositoryDocument('license', 'en'),
    locale === 'en' ? null : getRepositoryDocument('license', locale),
  ]);

  return (
    <Stack
      component="article"
      sx={{
        flex: 1,
        width: '100%',
        maxWidth: 760,
        mx: 'auto',
        px: 2,
        pt: { xs: 6, md: 8 },
        pb: 10,
        gap: 3,
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 400,
          fontSize: { xs: '1.9rem', sm: '2.4rem' },
          letterSpacing: '-0.01em',
        }}
      >
        {t('license')}
      </Typography>
      <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
        {t('licenseSummary')}
      </Typography>

      {translation && (
        <Box component="section" aria-labelledby="license-translation">
          <Typography
            id="license-translation"
            component="h2"
            sx={sectionTitleSx}
          >
            {t('licenseTranslation')}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <MarkdownContent
              source={translation.source}
              locale={locale}
              headingOffset={1}
            />
          </Box>
        </Box>
      )}

      <Box component="section" aria-labelledby="license-official" lang="en">
        <Typography id="license-official" component="h2" sx={sectionTitleSx}>
          {t('licenseOfficial')}
        </Typography>
        {/* `LICENSE` is plain text with its own line breaks and indents. */}
        <Box
          component="pre"
          sx={{
            mt: 3,
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'color-mix(in oklch, var(--nb-text) 3%, transparent)',
            fontFamily: 'var(--nb-font-mono)',
            fontSize: { xs: '0.78rem', sm: '0.85rem' },
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {official.source}
        </Box>
      </Box>
    </Stack>
  );
}
