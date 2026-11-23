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
import { glossaryPath } from '@/lib/course-paths';
import {
  findEdition,
  getCourses,
  getGlossary,
  getGlossaryParams,
} from '@/lib/courses';
import { createEditionHrefResolver } from '@/lib/edition-links';

/**
Prerenders the glossary of every course edition that has one, in every language.
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

type Props = PageProps<'/[lang]/learn/[topic]/[edition]/glossary'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic, edition } = await params;
  if (!hasLocale(routing.locales, lang)) {
    return {};
  }
  const courses = await getCourses(lang);
  const editionData = findEdition(
    courses.find((item) => item.slug === topic)?.editions ?? [],
    edition
  );
  const glossary = editionData
    ? await getGlossary(lang, topic, editionData.name)
    : null;
  return glossary
    ? {
        title: `${glossary.title ?? topic} · Notebook`,
        description: glossary.description,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((item) => [
              item,
              `/${item}${glossaryPath(topic, edition)}`,
            ])
          ),
        },
      }
    : {};
}

/**
 * `/<lang>/learn/<topic>/<edition>/glossary`: the glossary home page, with
 * the index of its entries, from `glossary/README.md` of the edition.
 */
export default async function GlossaryPage({ params }: Props) {
  const { lang, topic, edition } = await params;
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
  const glossary = editionData
    ? await getGlossary(lang, topic, editionData.name)
    : null;
  if (!editionData || !glossary) {
    notFound();
  }
  // Files exist only for named editions, not for `latest`.
  const filesBase = `/${lang}${glossaryPath(topic, editionData.name)}`;

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
        <Chip label={editionData.label} size="small" variant="outlined" />
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
        source={glossary.body}
        locale={lang}
        resolveHref={createEditionHrefResolver(
          lang,
          topic,
          edition,
          'glossary'
        )}
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
