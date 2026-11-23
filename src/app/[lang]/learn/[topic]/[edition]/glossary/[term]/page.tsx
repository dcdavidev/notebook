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
import { glossaryPath } from '@/lib/course-paths';
import {
  findEdition,
  getCourses,
  getGlossary,
  getGlossaryEntry,
  getGlossaryEntryParams,
} from '@/lib/courses';
import { createEditionHrefResolver } from '@/lib/edition-links';

/**
Prerenders every glossary entry in every language.
*/
export async function generateStaticParams() {
  return getGlossaryEntryParams();
}

/**
 * Every entry is prerendered, and its content depends on the URL, so the
 * route can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

const repository = 'https://github.com/dcdavidev/notebook';

type Props = PageProps<'/[lang]/learn/[topic]/[edition]/glossary/[term]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic, edition, term } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return {};
  }
  const courses = await getCourses(lang);
  const editionData = findEdition(
    courses.find((item) => item.slug === topic)?.editions ?? [],
    edition
  );
  const data = editionData
    ? await getGlossaryEntry(lang, topic, editionData.name, term)
    : null;
  return data
    ? {
        title: `${data.title} · Notebook`,
        description: data.description,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((item) => [
              item,
              `/${item}${glossaryPath(topic, edition, term)}`,
            ])
          ),
        },
      }
    : {};
}

/**
 * `/<lang>/learn/<topic>/<edition>/glossary/<term>`: one glossary entry,
 * with its main term and the similar ones.
 */
export default async function GlossaryEntryPage({ params }: Props) {
  const { lang, topic, edition, term } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);

  const [courses, t] = await Promise.all([
    getCourses(lang),
    getTranslations({ locale: lang, namespace: 'Learn' }),
  ]);
  const editionData = findEdition(
    courses.find((item) => item.slug === topic)?.editions ?? [],
    edition
  );
  const [glossary, data] = editionData
    ? await Promise.all([
        getGlossary(lang, topic, editionData.name),
        getGlossaryEntry(lang, topic, editionData.name, term),
      ])
    : [null, null];
  if (!editionData || !glossary || !data) {
    notFound();
  }

  const basePath = `/${lang}${glossaryPath(topic, edition)}`;
  // Files exist only for named editions, not for `latest`.
  const filesBase = `/${lang}${glossaryPath(topic, editionData.name)}`;
  const index = glossary.entries.findIndex((item) => item.slug === term);
  const previous = glossary.entries[index - 1];
  const next = glossary.entries[index + 1];

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
        <Chip label={editionData.label} size="small" variant="outlined" />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('glossaryTermCount', { count: data.terms.length })}
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

      <Stack direction="row" sx={{ mt: 3, gap: 1.5, flexWrap: 'wrap' }}>
        <DownloadMenu
          label={t('downloadGlossary')}
          options={[
            {
              scope: 'glossary',
              format: 'markdown',
              href: `${filesBase}/download/markdown`,
            },
            {
              scope: 'glossarySections',
              format: 'markdown',
              href: `${filesBase}/archive/markdown`,
            },
          ]}
          sx={{ textTransform: 'none', borderRadius: 3, py: 0.75 }}
        />
      </Stack>

      <Divider sx={{ my: 4 }} />

      <MarkdownContent
        source={data.body}
        locale={lang}
        resolveHref={createEditionHrefResolver(
          lang,
          topic,
          edition,
          'glossary'
        )}
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
