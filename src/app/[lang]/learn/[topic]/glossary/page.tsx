import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconPencil } from '@tabler/icons-react';

import { DownloadMenu } from '@/components/download-menu';
import { LinkButton } from '@/components/link-button';
import { MarkdownContent } from '@/components/markdown/markdown-content';
import { routing } from '@/i18n/routing';
import { getGlossary, getGlossaryParams } from '@/lib/courses';
import { createGlossaryHrefResolver } from '@/lib/glossary-links';

/**
Prerenders the glossary of every topic that has one, in every language.
*/
export async function generateStaticParams() {
  return getGlossaryParams();
}

/**
 * Every glossary is prerendered, and its content depends on the URL, so the
 * route can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

const repository = 'https://github.com/dcdavidev/notebook';

type Props = PageProps<'/[lang]/learn/[topic]/glossary'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return {};
  }
  const glossary = await getGlossary(lang, topic);
  return glossary
    ? {
        title: `${glossary.title ?? topic} · Notebook`,
        description: glossary.description,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((item) => [
              item,
              `/${item}/learn/${topic}/glossary`,
            ])
          ),
        },
      }
    : {};
}

/**
 * `/<lang>/learn/<topic>/glossary`: the glossary home page, with the list of
 * its sections, from `learning-materials/<topic>/glossary/README.<lang>.md`.
 */
export default async function GlossaryPage({ params }: Props) {
  const { lang, topic } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);

  const [glossary, t] = await Promise.all([
    getGlossary(lang, topic),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  if (!glossary) {
    notFound();
  }

  return (
    <Box
      component="article"
      sx={{ width: '100%', maxWidth: 780, mx: 'auto', px: 2, pt: 2, pb: 10 }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}
      >
        <Chip label={t('glossary')} size="small" color="primary" />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('glossaryTermCount', { count: glossary.termCount })}
        </Typography>
      </Stack>

      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '2rem', sm: '2.6rem' },
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}
      >
        {glossary.title ?? t('glossary')}
      </Typography>
      {glossary.description && (
        <Typography
          sx={{ mt: 1.5, fontSize: '1.2rem', color: 'text.secondary' }}
        >
          {glossary.description}
        </Typography>
      )}

      <Stack direction="row" sx={{ mt: 3, gap: 1.5, flexWrap: 'wrap' }}>
        <DownloadMenu
          label={t('downloadGlossary')}
          options={[
            {
              scope: 'glossary',
              format: 'pdf',
              href: `/${lang}/learn/${topic}/glossary/download/pdf`,
            },
            {
              scope: 'glossary',
              format: 'markdown',
              href: `/${lang}/learn/${topic}/glossary/download/markdown`,
            },
            {
              scope: 'glossarySections',
              format: 'pdf',
              href: `/${lang}/learn/${topic}/glossary/archive/pdf`,
            },
            {
              scope: 'glossarySections',
              format: 'markdown',
              href: `/${lang}/learn/${topic}/glossary/archive/markdown`,
            },
          ]}
          sx={{ textTransform: 'none', borderRadius: 3, py: 0.75 }}
        />
      </Stack>

      <Divider sx={{ my: 4 }} />

      <MarkdownContent
        source={glossary.body}
        locale={lang}
        resolveHref={createGlossaryHrefResolver(lang, topic)}
        anchorLabel={t('headingAnchor')}
      />

      <Box sx={{ mt: 6 }}>
        <LinkButton
          href={`${repository}/edit/main/${glossary.sourcePath}`}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          startIcon={<IconPencil size={16} />}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          {t('editOnGitHub')}
        </LinkButton>
      </Box>
    </Box>
  );
}
