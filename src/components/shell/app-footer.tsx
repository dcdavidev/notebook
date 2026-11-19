'use client';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { IconArrowUp } from '@tabler/icons-react';

/**
 * Page footer. For now it only holds the "back to top" button.
 */
export function AppFooter() {
  const t = useTranslations('Shell');

  return (
    <Stack
      component="footer"
      direction="row"
      sx={{
        justifyContent: 'center',
        px: 2,
        py: 3,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
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
          textTransform: 'none',
          borderRadius: 999,
          color: 'text.secondary',
        }}
      >
        {t('backToTop')}
      </Button>
    </Stack>
  );
}
