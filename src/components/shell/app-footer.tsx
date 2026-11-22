'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  IconArrowUp,
  IconGitPullRequest,
  IconHeart,
} from '@tabler/icons-react';

import { LinkButton } from '@/components/link-button';
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
 * Page footer: a big promise with the numbers of the site and two calls to
 * action, the links to the site pages and the project, a giant wordmark in
 * the palette colors, the author, and the "back to top" button.
 */
export function AppFooter({
  lessonCount,
  courseCount,
}: {
  lessonCount: number;
  courseCount: number;
}) {
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
      }}
    >
      {/* The promise of the site, with its numbers. */}
      <Stack
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          mb: { xs: 5, md: 7 },
          gap: 2.5,
          alignItems: 'flex-start',
        }}
      >
        <Typography
          component="p"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4rem' },
            lineHeight: 1,
            letterSpacing: '-0.035em',
          }}
        >
          {t('footerPromise')}
          <Box
            component="span"
            sx={{ display: 'block', color: 'var(--nb-secondary)' }}
          >
            {t('footerPromiseForever')}
          </Box>
        </Typography>
        <Stack
          component="ul"
          direction="row"
          sx={{ m: 0, p: 0, listStyle: 'none', gap: 1, flexWrap: 'wrap' }}
        >
          {[
            t('footerStatLessons', { count: lessonCount }),
            t('footerStatCourses', { count: courseCount }),
            t('footerStatLanguages'),
            t('footerStatPrice'),
          ].map((label) => (
            <Box
              key={label}
              component="li"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                border: 1,
                borderColor: 'divider',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {label}
            </Box>
          ))}
        </Stack>
        <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap' }}>
          <LinkButton
            href="/sponsor"
            variant="contained"
            disableElevation
            startIcon={<IconHeart size={18} />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
          >
            {t('footerCtaSponsor')}
          </LinkButton>
          <LinkButton
            href="/contribute"
            variant="outlined"
            startIcon={<IconGitPullRequest size={18} />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
          >
            {t('footerCtaContribute')}
          </LinkButton>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          gap: { xs: 4, sm: 6 },
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', maxWidth: 320 }}
        >
          {t('footerTagline')}
        </Typography>

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

      {/* A giant wordmark in the palette colors, cut by the bottom edge. */}
      <Box
        aria-hidden
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          mt: { xs: 5, md: 7 },
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontFamily: 'var(--nb-font-title)',
            fontSize: 'clamp(5rem, 21vw, 15rem)',
            lineHeight: 1,
            mb: '-0.28em',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            backgroundImage:
              'linear-gradient(100deg, var(--nb-primary), var(--nb-secondary))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Notebook
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          mt: 0,
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
