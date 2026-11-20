'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconArrowUp } from '@tabler/icons-react';

import { NotebookLogo } from '@/components/notebook-logo';
import { visuallyHidden } from '@/components/visually-hidden';
import { Link } from '@/i18n/navigation';

const repositoryUrl = 'https://github.com/dcdavidev/notebook';

const linkSx = {
  color: 'text.secondary',
  textDecoration: 'none',
  '&:hover': { color: 'text.primary', textDecoration: 'underline' },
};

/**
 * A titled column of footer links.
 */
function FooterColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Box component="nav" aria-labelledby={id}>
      <Typography
        id={id}
        component="h2"
        variant="overline"
        sx={{ display: 'block', color: 'text.secondary', lineHeight: 2 }}
      >
        {title}
      </Typography>
      <Stack component="ul" sx={{ m: 0, p: 0, listStyle: 'none', gap: 0.75 }}>
        {children}
      </Stack>
    </Box>
  );
}

/**
 * Page footer: the site name and tagline, links to the site pages and the
 * project, the author and license, and the "back to top" button.
 */
export function AppFooter() {
  const t = useTranslations('Shell');
  const tLegal = useTranslations('Legal');
  const newTab = t('opensNewTab');

  const external = (href: string, label: string) => (
    <li>
      <MuiLink
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={linkSx}
      >
        {label}
        <Box component="span" sx={visuallyHidden}>
          {` ${newTab}`}
        </Box>
      </MuiLink>
    </li>
  );

  return (
    <Box
      component="footer"
      sx={{
        px: { xs: 2, md: 4 },
        pt: 5,
        pb: 3,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          gap: { xs: 4, sm: 6 },
          justifyContent: 'space-between',
        }}
      >
        <Stack sx={{ gap: 1, maxWidth: 320 }}>
          <Stack
            direction="row"
            component={Link}
            href="/overview"
            sx={{
              alignItems: 'center',
              gap: 1,
              color: 'text.primary',
              textDecoration: 'none',
              alignSelf: 'flex-start',
            }}
          >
            <NotebookLogo size={28} />
            <Typography
              component="span"
              sx={{ fontFamily: 'var(--nb-font-title)', fontSize: '1.5rem' }}
            >
              Notebook
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('footerTagline')}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          sx={{ gap: { xs: 4, sm: 6 }, flexWrap: 'wrap', rowGap: 3 }}
        >
          <FooterColumn id="footer-site" title={t('footerSite')}>
            <li>
              <MuiLink component={Link} href="/overview" sx={linkSx}>
                {t('home')}
              </MuiLink>
            </li>
            <li>
              <MuiLink component={Link} href="/sponsor" sx={linkSx}>
                {t('sponsor')}
              </MuiLink>
            </li>
            <li>
              <MuiLink component={Link} href="/contribute" sx={linkSx}>
                {t('contribute')}
              </MuiLink>
            </li>
          </FooterColumn>
          <FooterColumn id="footer-project" title={t('footerProject')}>
            {external(repositoryUrl, t('sourceCode'))}
            {external(
              `${repositoryUrl}/blob/main/learning-materials/README.md`,
              t('contentGuide')
            )}
          </FooterColumn>
          <FooterColumn id="footer-legal" title={t('footerLegal')}>
            <li>
              <MuiLink component={Link} href="/privacy" sx={linkSx}>
                {tLegal('privacy')}
              </MuiLink>
            </li>
            <li>
              <MuiLink component={Link} href="/cookies" sx={linkSx}>
                {tLegal('cookies')}
              </MuiLink>
            </li>
            <li>
              <MuiLink component={Link} href="/terms" sx={linkSx}>
                {tLegal('terms')}
              </MuiLink>
            </li>
            <li>
              <MuiLink component={Link} href="/license" sx={linkSx}>
                {tLegal('license')}
              </MuiLink>
            </li>
          </FooterColumn>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          mt: 4,
          pt: 2,
          gap: 1,
          borderTop: 1,
          borderColor: 'divider',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t.rich('madeBy', {
            author: (chunks) => (
              <MuiLink
                href="https://dcdavidev.me"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ ...linkSx, color: 'text.primary' }}
              >
                {chunks}
                <Box component="span" sx={visuallyHidden}>
                  {` ${newTab}`}
                </Box>
              </MuiLink>
            ),
          })}
        </Typography>
        <Button
          variant="text"
          startIcon={<IconArrowUp size={18} />}
          onClick={() => {
            const isReduceMotion = matchMedia(
              '(prefers-reduced-motion: reduce)'
            ).matches;
            window.scrollTo({
              top: 0,
              behavior: isReduceMotion ? 'auto' : 'smooth',
            });
            // Move keyboard focus back to the top of the page too.
            document.querySelector<HTMLElement>('main')?.focus({
              preventScroll: true,
            });
          }}
          sx={{
            ml: { xs: -1, sm: 0 },
            textTransform: 'none',
            borderRadius: 999,
            color: 'text.secondary',
          }}
        >
          {t('backToTop')}
        </Button>
      </Stack>
    </Box>
  );
}
