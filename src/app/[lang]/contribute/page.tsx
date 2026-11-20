import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  IconArrowDown,
  IconBug,
  IconBulb,
  IconExternalLink,
  IconPencil,
} from '@tabler/icons-react';

import { MarkdownContent } from '@/components/markdown/markdown-content';
import { visuallyHidden } from '@/components/visually-hidden';
import { routing } from '@/i18n/routing';
import { getRepositoryDocument } from '@/lib/repository-docs';

/**
 * The whole page depends on the language, and each language is fully
 * prerendered, so it can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

const repositoryUrl = 'https://github.com/dcdavidev/notebook';

/**
Section ids, used as anchors.
*/
const contributingId = 'contributing';
const contentGuideId = 'content-guide';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/contribute'>): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('contributeTitle'),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/contribute`])
      ),
    },
  };
}

/**
 * Turns the links of a repository document into site links: the content
 * guide points to its section on this page, and the other relative links
 * point to the file on GitHub.
 */
function createHrefResolver(file: string, locale: string) {
  const directory = file.includes('/')
    ? file.slice(0, file.lastIndexOf('/') + 1)
    : '';
  return (href: string) => {
    if (/^(?:[a-z]+:|#|\/)/i.test(href)) {
      return href;
    }
    const target = new URL(
      href,
      `https://repo.invalid/${directory}`
    ).pathname.slice(1);
    if (/^learning-materials\/README(?:\.[a-z]{2})?\.md$/.test(target)) {
      return `#${contentGuideId}`;
    }
    return target === 'LICENSE' || /^LICENSE\.[a-z]{2}\.md$/.test(target)
      ? `/${locale}/license`
      : `${repositoryUrl}/blob/main/${target}`;
  };
}

/**
 * One quick action: an icon, a title, a sentence, and a button.
 */
function ActionCard({
  icon,
  title,
  text,
  cta,
  href,
  newTab,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  cta: string;
  href: string;
  /**
  Screen reader text for links that open a new tab, or nothing.
  */
  newTab?: string;
}) {
  return (
    <Stack
      component="li"
      sx={{
        p: 2.5,
        gap: 1.25,
        borderRadius: 5,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'color-mix(in oklch, var(--nb-background), var(--nb-text) 3%)',
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1, color: 'primary.main' }}
      >
        {icon}
        <Typography
          component="h3"
          sx={{ fontWeight: 700, fontSize: '1.15rem' }}
        >
          {title}
        </Typography>
      </Stack>
      <Typography sx={{ color: 'text.secondary', flex: 1 }}>{text}</Typography>
      <Button
        href={href}
        variant="outlined"
        endIcon={
          newTab ? (
            <IconExternalLink size={18} aria-hidden />
          ) : (
            <IconArrowDown size={18} aria-hidden />
          )
        }
        {...(newTab && { target: '_blank', rel: 'noopener noreferrer' })}
        sx={{
          alignSelf: 'flex-start',
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {cta}
        {newTab && (
          <Box component="span" sx={visuallyHidden}>
            {` ${newTab}`}
          </Box>
        )}
      </Button>
    </Stack>
  );
}

/**
 * The contribute page: quick actions, then the contributing guide and the
 * content guide, rendered from the Markdown files in the repository so
 * they stay in sync.
 */
export default async function ContributePage({
  params,
}: PageProps<'/[lang]/contribute'>) {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  setRequestLocale(locale);
  const [t, contributing, contentGuide] = await Promise.all([
    getTranslations({ locale, namespace: 'Contribute' }),
    getRepositoryDocument('contributing', locale),
    getRepositoryDocument('contentGuide', locale),
  ]);
  const newTab = t('opensNewTab');

  const guides = [
    { id: contributingId, title: t('contributing'), ...contributing },
    { id: contentGuideId, title: t('contentGuide'), ...contentGuide },
  ];

  return (
    <Stack
      sx={{
        flex: 1,
        width: '100%',
        maxWidth: 820,
        mx: 'auto',
        px: 2,
        pt: { xs: 6, md: '10vh' },
        pb: 10,
        gap: { xs: 6, md: 8 },
      }}
    >
      <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 2.5 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 400,
            fontSize: { xs: '1.75rem', sm: '2.4rem' },
            letterSpacing: '-0.01em',
            textWrap: 'balance',
          }}
        >
          {t('title')}
        </Typography>
        <Typography
          sx={{
            maxWidth: 600,
            color: 'text.secondary',
            fontSize: '1.1rem',
            textWrap: 'balance',
          }}
        >
          {t('subtitle')}
        </Typography>
      </Stack>

      <Box component="section" aria-labelledby="start-title">
        <Typography
          id="start-title"
          component="h2"
          sx={{ fontWeight: 700, fontSize: '1.5rem', mb: 2.5 }}
        >
          {t('start')}
        </Typography>
        <Box
          component="ul"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <ActionCard
            icon={<IconBug size={22} aria-hidden />}
            title={t('bugTitle')}
            text={t('bugText')}
            cta={t('bugCta')}
            href={`${repositoryUrl}/issues/new?template=bug_report.yml`}
            newTab={newTab}
          />
          <ActionCard
            icon={<IconBulb size={22} aria-hidden />}
            title={t('ideaTitle')}
            text={t('ideaText')}
            cta={t('ideaCta')}
            href={`${repositoryUrl}/issues/new?template=feature_request.yml`}
            newTab={newTab}
          />
          <ActionCard
            icon={<IconPencil size={22} aria-hidden />}
            title={t('lessonTitle')}
            text={t('lessonText')}
            cta={t('lessonCta')}
            href={`#${contentGuideId}`}
          />
        </Box>
      </Box>

      {guides.map((guide) => (
        <Box key={guide.id} component="section" aria-labelledby={guide.id}>
          <Typography
            id={guide.id}
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: '1.9rem',
              mb: 1,
              scrollMarginTop: '80px',
            }}
          >
            {guide.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {t('source', { file: guide.file })}{' '}
            <Link
              href={`${repositoryUrl}/blob/main/${guide.file}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('sourceLink')}
              <Box component="span" sx={visuallyHidden}>
                {` ${newTab}`}
              </Box>
            </Link>
          </Typography>
          <MarkdownContent
            source={guide.source}
            locale={locale}
            headingOffset={1}
            resolveHref={createHrefResolver(guide.file, locale)}
          />
        </Box>
      ))}
    </Stack>
  );
}
