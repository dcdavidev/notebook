'use client';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';

import { IconShare } from '@tabler/icons-react';

import { notify } from '@/lib/island-notify';

/**
 * Shares the page being read: it opens the system share sheet where there
 * is one, and copies the link otherwise.
 */
export function ShareButton({
  title,
  size = 'small',
  sx,
}: {
  /**
  Title for the share sheet.
  */
  title: string;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}) {
  const t = useTranslations('Learn');

  const share = async () => {
    const url = new URL(location.href);
    url.hash = '';
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url: url.href });
        return;
      } catch (error) {
        // The visitor closed the share sheet.
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      notify({ message: t('linkCopied'), severity: 'success' });
    } catch {
      notify({ message: t('shareFailed'), severity: 'error' });
    }
  };

  return (
    <Button
      variant="outlined"
      size={size}
      startIcon={<IconShare size={size === 'small' ? 16 : 18} />}
      onClick={share}
      sx={sx}
    >
      {t('share')}
    </Button>
  );
}
