import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconHome, IconLayoutDashboard } from '@tabler/icons-react';

import { FadeIn } from '@/components/landing/fade-in';
import { LinkButton } from '@/components/link-button';
import { SleepingCat } from '@/components/not-found/sleeping-cat';
import { SettingsMenu } from '@/components/settings-menu';

export const metadata: Metadata = {
  title: 'Page not found · Notebook',
};

export default function NotFound() {
  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 8,
        background: [
          'radial-gradient(circle at 50% 35%, color-mix(in oklch, var(--nb-secondary) 18%, transparent), transparent 45%)',
          'var(--nb-background)',
        ].join(', '),
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <SettingsMenu />
      </Box>

      <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 3 }}>
        <SleepingCat />

        <FadeIn delay={0.2}>
          <Typography
            component="p"
            sx={{
              fontFamily: 'var(--nb-font-title)',
              fontSize: 'clamp(3rem, 10vw, 5rem)',
              lineHeight: 1,
              color: 'primary.main',
            }}
          >
            Oops!
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, mt: 1 }}
          >
            Page not found
          </Typography>
          <Typography
            sx={{
              mt: 1,
              color: 'text.secondary',
              maxWidth: 440,
              textWrap: 'balance',
            }}
          >
            This page is taking a nap, or it never existed. Check the address,
            or go back to a page that is awake.
          </Typography>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ gap: 1.5, justifyContent: 'center' }}
          >
            <LinkButton
              href="/"
              variant="contained"
              size="large"
              startIcon={<IconHome size={18} />}
              sx={{ borderRadius: 99, px: 3, textTransform: 'none' }}
            >
              Back to home
            </LinkButton>
            <LinkButton
              href="/overview"
              variant="outlined"
              size="large"
              startIcon={<IconLayoutDashboard size={18} />}
              sx={{ borderRadius: 99, px: 3, textTransform: 'none' }}
            >
              Go to overview
            </LinkButton>
          </Stack>
        </FadeIn>
      </Stack>
    </Box>
  );
}
