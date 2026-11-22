'use client';

import { Fragment, useId, useState } from 'react';

import { useTranslations } from 'next-intl';

import Button, { type ButtonProps } from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import {
  IconChevronDown,
  IconDownload,
  IconFileText,
  IconFileZip,
  IconMarkdown,
} from '@tabler/icons-react';

export interface DownloadOption {
  href: string;
  format: 'pdf' | 'markdown';
  /**
  One lesson, the whole course in a ZIP file, the whole glossary in one
  file, or the glossary in a ZIP file with one file per subject.
  */
  scope: 'lesson' | 'course' | 'glossary' | 'glossarySections';
}

const hintKeys = {
  lesson: { pdf: 'downloadPdfHint', markdown: 'downloadMarkdownHint' },
  course: {
    pdf: 'downloadCoursePdfHint',
    markdown: 'downloadCourseMarkdownHint',
  },
  glossary: {
    pdf: 'downloadGlossaryPdfHint',
    markdown: 'downloadGlossaryMarkdownHint',
  },
  glossarySections: {
    pdf: 'downloadGlossarySectionsPdfHint',
    markdown: 'downloadGlossarySectionsMarkdownHint',
  },
} as const;

const scopes = ['lesson', 'glossary', 'glossarySections', 'course'] as const;

const scopeTitles = {
  lesson: 'thisLesson',
  glossary: 'glossaryOneFile',
  glossarySections: 'glossaryBySubject',
  course: 'wholeCourse',
} as const;

/**
Scopes whose files come in a ZIP archive.
*/
const archiveScopes = new Set<DownloadOption['scope']>([
  'course',
  'glossarySections',
]);

/**
 * A button that opens a menu of files to download, grouped by scope when
 * it offers more than one.
 */
export function DownloadMenu({
  options,
  label,
  variant = 'outlined',
  sx,
}: {
  options: DownloadOption[];
  /**
  Text of the button. Defaults to "Download".
  */
  label?: string;
  variant?: ButtonProps['variant'];
  sx?: ButtonProps['sx'];
}) {
  const t = useTranslations('Learn');
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const isGrouped = new Set(options.map((option) => option.scope)).size > 1;

  return (
    <>
      <Button
        id={`${id}-button`}
        variant={variant}
        size="small"
        aria-haspopup="menu"
        aria-controls={anchor ? `${id}-menu` : undefined}
        aria-expanded={anchor ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        startIcon={<IconDownload size={16} />}
        endIcon={<IconChevronDown size={14} />}
        sx={sx}
      >
        {label ?? t('download')}
      </Button>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        slotProps={{
          list: {
            'aria-labelledby': `${id}-button`,
            'aria-label': t('downloadMenu'),
          },
        }}
      >
        {scopes.map((scope) => {
          const items = options.filter((option) => option.scope === scope);
          if (items.length === 0) {
            return null;
          }
          return (
            <Fragment key={scope}>
              {isGrouped && (
                <ListSubheader sx={{ lineHeight: 2.5, bgcolor: 'inherit' }}>
                  {t(scopeTitles[scope])}
                </ListSubheader>
              )}
              {items.map((option) => {
                let icon = <IconMarkdown size={20} />;
                if (archiveScopes.has(scope)) {
                  icon = <IconFileZip size={20} />;
                } else if (option.format === 'pdf') {
                  icon = <IconFileText size={20} />;
                }
                return (
                  <MenuItem
                    key={option.href}
                    component="a"
                    href={option.href}
                    download
                    onClick={close}
                  >
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText
                      primary={t(
                        option.format === 'pdf'
                          ? 'downloadPdf'
                          : 'downloadMarkdown'
                      )}
                      secondary={t(hintKeys[scope][option.format])}
                    />
                  </MenuItem>
                );
              })}
            </Fragment>
          );
        })}
      </Menu>
    </>
  );
}
