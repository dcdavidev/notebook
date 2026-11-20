'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';

import { IconDownload, IconShare } from '@tabler/icons-react';

const buttonSx = { textTransform: 'none', borderRadius: 3 } as const;

/**
 * Buttons to share a lesson and to download it as Markdown. Sharing opens
 * the system share sheet where there is one, and copies the link
 * otherwise.
 */
export function LessonActions({
  title,
  downloadHref,
}: {
  title: string;
  /**
  URL of the Markdown file of the lesson.
  */
  downloadHref: string;
}) {
  const t = useTranslations('Learn');
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage(t('linkCopied'));
    } catch {
      setMessage(t('shareFailed'));
    }
  };

  return (
    <>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 3 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<IconShare size={16} />}
          onClick={share}
          sx={buttonSx}
        >
          {t('share')}
        </Button>
        <Button
          variant="outlined"
          size="small"
          href={downloadHref}
          download
          startIcon={<IconDownload size={16} />}
          sx={buttonSx}
        >
          {t('download')}
        </Button>
      </Stack>
      <Snackbar
        open={message !== null}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        message={message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
