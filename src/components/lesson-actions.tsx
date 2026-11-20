'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';

import {
  IconChevronDown,
  IconDownload,
  IconFileText,
  IconMarkdown,
  IconShare,
} from '@tabler/icons-react';

const buttonSx = { textTransform: 'none', borderRadius: 3 } as const;

/**
 * Buttons to share a lesson and to download it as Markdown or PDF. Sharing opens
 * the system share sheet where there is one, and copies the link
 * otherwise.
 */
export function LessonActions({
  title,
  markdownHref,
  pdfHref,
}: {
  title: string;
  /**
  URL of the Markdown file of the lesson.
  */
  markdownHref: string;
  /**
  URL of the PDF file of the lesson.
  */
  pdfHref: string;
}) {
  const t = useTranslations('Learn');
  const [message, setMessage] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setMenuAnchor(null);

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
          id="lesson-download-button"
          variant="outlined"
          size="small"
          aria-haspopup="menu"
          aria-controls={menuAnchor ? 'lesson-download-menu' : undefined}
          aria-expanded={menuAnchor ? 'true' : undefined}
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          startIcon={<IconDownload size={16} />}
          endIcon={<IconChevronDown size={14} />}
          sx={buttonSx}
        >
          {t('download')}
        </Button>
        <Menu
          id="lesson-download-menu"
          anchorEl={menuAnchor}
          open={menuAnchor !== null}
          onClose={closeMenu}
          slotProps={{
            list: {
              'aria-labelledby': 'lesson-download-button',
              'aria-label': t('downloadMenu'),
            },
          }}
        >
          <MenuItem component="a" href={pdfHref} download onClick={closeMenu}>
            <ListItemIcon>
              <IconFileText size={20} />
            </ListItemIcon>
            <ListItemText
              primary={t('downloadPdf')}
              secondary={t('downloadPdfHint')}
            />
          </MenuItem>
          <MenuItem
            component="a"
            href={markdownHref}
            download
            onClick={closeMenu}
          >
            <ListItemIcon>
              <IconMarkdown size={20} />
            </ListItemIcon>
            <ListItemText
              primary={t('downloadMarkdown')}
              secondary={t('downloadMarkdownHint')}
            />
          </MenuItem>
        </Menu>
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
