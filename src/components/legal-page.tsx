import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { MarkdownContent } from '@/components/markdown/markdown-content';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/lib/locale';
import { getRepositoryDocument } from '@/lib/repository-docs';

/**
Legal pages, by URL segment. Each one is `docs/legal/<page>.<locale>.md`.
*/
export type LegalPageName = 'privacy' | 'cookies' | 'terms';

/**
 * Title and language alternates of a legal page.
 */
export async function legalPageMetadata(
  page: LegalPageName,
  locale: Locale
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Legal' });
  return {
    title: `${t(page)} · Notebook`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/${page}`])
      ),
    },
  };
}

/**
 * Links in the legal documents are written as `./cookies`, `./license`,
 * and so on: they point to the other pages in the same language.
 */
function createHrefResolver(locale: Locale) {
  return (href: string) => {
    const match = /^\.\/([a-z-]+)(#.*)?$/.exec(href);
    return match ? `/${locale}/${match[1]}${match[2] ?? ''}` : href;
  };
}

/**
 * A legal page: the title, then the Markdown document from `docs/legal`.
 */
export async function LegalPage({
  page,
  locale,
}: {
  page: LegalPageName;
  locale: Locale;
}) {
  setRequestLocale(locale);
  const [t, document] = await Promise.all([
    getTranslations({ locale, namespace: 'Legal' }),
    getRepositoryDocument(page, locale),
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
        {t(page)}
      </Typography>
      <MarkdownContent
        source={document.source}
        locale={locale}
        resolveHref={createHrefResolver(locale)}
      />
    </Stack>
  );
}
