import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  IconArrowLeft,
  IconArrowRight,
  IconPencil,
  IconVocabulary,
} from '@tabler/icons-react';

import { DownloadMenu } from '@/components/download-menu';
import { LinkButton } from '@/components/link-button';
import { MarkdownContent } from '@/components/markdown/markdown-content';
import { routing } from '@/i18n/routing';
import {
  getGlossary,
  getGlossarySection,
  getGlossarySectionParams,
} from '@/lib/courses';
import { createGlossaryHrefResolver } from '@/lib/glossary-links';

/**
Prerenders every glossary section in every language.
*/
export async function generateStaticParams() {
  return getGlossarySectionParams();
}

/**
 * Every section is prerendered, and its content depends on the URL, so the
 * route can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

const repository = 'https://github.com/dcdavidev/notebook';

type Props = PageProps<'/[lang]/learn/[topic]/glossary/[section]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic, section } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return {};
  }
  const data = await getGlossarySection(lang, topic, section);
  return data
    ? {
        title: `${data.title} · Notebook`,
        description: data.description,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((item) => [
              item,
              `/${item}/learn/${topic}/glossary/${section}`,
            ])
          ),
        },
      }
    : {};
}

/**
 * `/<lang>/learn/<topic>/glossary/<NN-slug>`: the terms of one subject, in
 * alphabetical order, from `learning-materials/<topic>/glossary`.
 */
export default async function GlossarySectionPage({ params }: Props) {
  const { lang, topic, section } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);

  const [glossary, data, t] = await Promise.all([
    getGlossary(lang, topic),
    getGlossarySection(lang, topic, section),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  if (!glossary || !data) {
    notFound();
  }

  const basePath = `/${lang}/learn/${topic}/glossary`;
  const index = glossary.sections.findIndex((item) => item.slug === section);
  const previous = glossary.sections[index - 1];
  const next = glossary.sections[index + 1];

  return (
    <Box
      component="article"
      sx={{ width: '100%', maxWidth: 780, mx: 'auto', px: 2, pt: 2, pb: 10 }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}
      >
        <Chip
          component="a"
          href={basePath}
          clickable
          icon={<IconVocabulary size={16} />}
          label={glossary.title ?? t('glossary')}
          size="small"
          color="primary"
        />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('glossarySectionOf', {
            step: index + 1,
            total: glossary.sections.length,
          })}{' '}
          · {t('glossaryTermCount', { count: data.termCount })}
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
        {data.title}
      </Typography>
      {data.description && (
        <Typography
          sx={{ mt: 1.5, fontSize: '1.2rem', color: 'text.secondary' }}
        >
          {data.description}
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
        source={data.body}
        locale={lang}
        resolveHref={createGlossaryHrefResolver(lang, topic)}
        anchorLabel={t('headingAnchor')}
      />

      <Divider sx={{ my: 4 }} />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ gap: 2, justifyContent: 'space-between' }}
      >
        {previous ? (
          <LinkButton
            href={`${basePath}/${previous.slug}`}
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              borderRadius: 3,
            }}
          >
            {t('previous')}: {previous.title}
          </LinkButton>
        ) : (
          <span />
        )}
        {next && (
          <LinkButton
            href={`${basePath}/${next.slug}`}
            variant="contained"
            endIcon={<IconArrowRight size={18} />}
            sx={{
              justifyContent: 'flex-end',
              textTransform: 'none',
              borderRadius: 3,
            }}
          >
            {t('next')}: {next.title}
          </LinkButton>
        )}
      </Stack>

      <Box sx={{ mt: 4 }}>
        <LinkButton
          href={`${repository}/edit/main/${data.sourcePath}`}
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
