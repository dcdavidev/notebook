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
  IconBrandGithub,
  IconCoffee,
  IconExternalLink,
  IconGitPullRequest,
  IconHeartHandshake,
  IconMug,
  IconShare,
  IconStar,
} from '@tabler/icons-react';

import { visuallyHidden } from '@/components/visually-hidden';
import { routing } from '@/i18n/routing';

/**
 * The whole page depends on the language, and each language is fully
 * prerendered, so it can block on `params` (see the `[lang]` layout).
 */
// eslint-disable-next-line unicorn/consistent-boolean-name -- Next.js route segment config name
export const instant = false;

const repositoryUrl = 'https://github.com/dcdavidev/notebook';

/**
 * The platforms in `.github/FUNDING.yml`, in the same order. Keep the two
 * lists in sync.
 */
const platforms = [
  {
    id: 'github',
    name: 'GitHub Sponsors',
    url: 'https://github.com/sponsors/dcdavidev',
    accent: '#be185d',
    icon: <IconBrandGithub size={22} aria-hidden />,
  },
  {
    id: 'kofi',
    name: 'Ko-fi',
    url: 'https://ko-fi.com/dcdavidev',
    accent: '#0e7490',
    icon: <IconMug size={22} aria-hidden />,
  },
  {
    id: 'buyMeACoffee',
    name: 'Buy Me a Coffee',
    url: 'https://buymeacoffee.com/dcdavidev',
    accent: '#a16207',
    icon: <IconCoffee size={22} aria-hidden />,
  },
  {
    id: 'thanksDev',
    name: 'thanks.dev',
    url: 'https://thanks.dev/u/gh/dcdavidev',
    accent: '#6d28d9',
    icon: <IconHeartHandshake size={22} aria-hidden />,
  },
] as const;

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/sponsor'>): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('sponsorTitle'),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}/sponsor`])
      ),
    },
  };
}

/**
 * One way to help that isn't money: an icon, a sentence, and a link.
 */
function HelpItem({
  icon,
  text,
  link,
}: {
  icon: ReactNode;
  text: string;
  link?: { href: string; label: string; newTab: string };
}) {
  return (
    <Stack component="li" direction="row" sx={{ gap: 1.5 }}>
      <Box sx={{ color: 'text.secondary', pt: 0.25, flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography>
        {text}
        {link && (
          <>
            {' '}
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontWeight: 600 }}
            >
              {link.label}
              <Box component="span" sx={visuallyHidden}>
                {` ${link.newTab}`}
              </Box>
            </Link>
          </>
        )}
      </Typography>
    </Stack>
  );
}

/**
 * The sponsor page: the platforms from `.github/FUNDING.yml` as cards, and
 * other ways to help the project.
 */
export default async function SponsorPage({
  params,
}: PageProps<'/[lang]/sponsor'>) {
  const { lang } = await params;
  const locale = hasLocale(routing.locales, lang)
    ? lang
    : routing.defaultLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Sponsor' });
  const newTab = t('opensNewTab');

  return (
    <Stack
      sx={{
        flex: 1,
        width: '100%',
        maxWidth: 900,
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
            maxWidth: 560,
            color: 'text.secondary',
            fontSize: '1.1rem',
            textWrap: 'balance',
          }}
        >
          {t('subtitle')}
        </Typography>
      </Stack>

      <Box component="section" aria-labelledby="platforms-title">
        <Typography
          id="platforms-title"
          component="h2"
          sx={{ fontWeight: 700, fontSize: '1.5rem', mb: 2.5 }}
        >
          {t('platforms')}
        </Typography>
        <Box
          component="ul"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {platforms.map((platform) => (
            <Stack
              key={platform.id}
              component="li"
              sx={{
                p: 2.5,
                gap: 1.5,
                borderRadius: 5,
                border: 1,
                borderColor: `color-mix(in oklch, ${platform.accent} 30%, transparent)`,
                bgcolor: `color-mix(in oklch, ${platform.accent} 10%, var(--nb-background))`,
              }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: 'center', gap: 1, color: platform.accent }}
              >
                {platform.icon}
                <Typography
                  component="h3"
                  sx={{ fontWeight: 700, fontSize: '1.25rem' }}
                >
                  {platform.name}
                </Typography>
              </Stack>
              <Typography sx={{ color: 'text.secondary', flex: 1 }}>
                {t(`${platform.id}Description`)}
              </Typography>
              <Button
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                disableElevation
                endIcon={<IconExternalLink size={18} aria-hidden />}
                sx={{
                  alignSelf: 'flex-start',
                  mt: 0.5,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: platform.accent,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: `color-mix(in oklch, ${platform.accent}, black 15%)`,
                  },
                }}
              >
                {t('cta', { platform: platform.name })}
                <Box component="span" sx={visuallyHidden}>
                  {` ${newTab}`}
                </Box>
              </Button>
            </Stack>
          ))}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="other-title">
        <Typography
          id="other-title"
          component="h2"
          sx={{ fontWeight: 700, fontSize: '1.5rem', mb: 2.5 }}
        >
          {t('other')}
        </Typography>
        <Stack component="ul" sx={{ m: 0, p: 0, listStyle: 'none', gap: 1.5 }}>
          <HelpItem
            icon={<IconStar size={20} aria-hidden />}
            text={t('star')}
            link={{ href: repositoryUrl, label: t('starLink'), newTab }}
          />
          <HelpItem
            icon={<IconGitPullRequest size={20} aria-hidden />}
            text={t('contribute')}
            link={{
              href: `${repositoryUrl}/blob/main/learning-materials/README.md`,
              label: t('contributeLink'),
              newTab,
            }}
          />
          <HelpItem
            icon={<IconShare size={20} aria-hidden />}
            text={t('share')}
          />
        </Stack>
        <Typography
          sx={{
            mt: 4,
            fontFamily: 'var(--nb-font-title)',
            fontSize: '1.8rem',
            textAlign: 'center',
          }}
        >
          {t('thanks')}
        </Typography>
      </Box>
    </Stack>
  );
}
