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

import { LinkButton } from '@/components/link-button';
import { MarkdownContent } from '@/components/markdown/markdown-content';
import { routing } from '@/i18n/routing';
import { getGlossary, getGlossaryParams } from '@/lib/courses';

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

/**
A link to a course file: `../course/v2/0005-slug.en.md#part` or `../course/v2/README.en.md`.
*/
const courseLinkPattern =
  /^\.\.\/course\/(v\d+)\/(?:(\d{4}-[a-z\d-]+)|README)\.[a-z]{2}\.md(#.*)?$/;

/**
A link to this glossary in another language: `./README.it.md`.
*/
const glossaryLinkPattern = /^(?:\.\/)?README\.([a-z]{2})\.md(#.*)?$/;

/**
 * Turns the relative links of the glossary, written so that they also work
 * on GitHub, into site URLs.
 */
function createHrefResolver(lang: string, topic: string) {
  return (href: string): string => {
    const course = courseLinkPattern.exec(href);
    if (course) {
      const [, version, lesson, hash = ''] = course;
      return `/${lang}/learn/${topic}/course/${version}${lesson ? `/${lesson}` : ''}${hash}`;
    }
    const glossary = glossaryLinkPattern.exec(href);
    return glossary
      ? `/${glossary[1]}/learn/${topic}/glossary${glossary[2] ?? ''}`
      : href;
  };
}

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
 * `/<lang>/learn/<topic>/glossary`: the terms of a topic's courses, in
 * alphabetical order, from `learning-materials/<topic>/glossary`.
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

      <Divider sx={{ my: 4 }} />

      <MarkdownContent
        source={glossary.body}
        locale={lang}
        resolveHref={createHrefResolver(lang, topic)}
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
