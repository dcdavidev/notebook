'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { IconChevronDown } from '@tabler/icons-react';

import { useRouter } from '@/i18n/navigation';
import {
  coursePath,
  glossaryPath,
  latestEdition,
  parseLearnPath,
} from '@/lib/course-paths';
import type { CourseSummary } from '@/lib/courses';

/**
 * Chip with the course edition being read. Without an edition in the URL,
 * or with `latest`, it shows the newest one. Choosing another edition opens
 * the same lesson or glossary entry in it when it exists there, otherwise
 * its home page.
 */
export function VersionMenu({
  course,
  pathname,
}: {
  course: CourseSummary;
  /**
  Path without the locale: `/learn/<topic>/<edition>/<course|glossary>/<item>`.
  */
  pathname: string;
}) {
  const t = useTranslations('Shell');
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const { edition: segment, area, item } = parseLearnPath(pathname);
  const newest = course.editions[0];
  const current =
    course.editions.find((edition) => edition.name === segment) ?? newest;
  if (!newest || !current) {
    return null;
  }

  const label = t('versionLabel', { version: current.label });

  return (
    <>
      <Chip
        label={
          <Box
            component="span"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {current.label}
            <IconChevronDown size={14} />
          </Box>
        }
        size="small"
        variant="outlined"
        clickable
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        sx={{ flexShrink: 0, fontWeight: 600 }}
      />
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => {
          setAnchor(null);
        }}
      >
        {course.editions.map((edition) => {
          const isNewest = edition.name === newest.name;
          const urlEdition = isNewest ? latestEdition : edition.name;
          // The same lesson or glossary entry, when the edition has it.
          let target = coursePath(course.slug, urlEdition);
          if (area === 'glossary' && edition.hasGlossary) {
            const hasEntry = edition.glossaryEntries.some(
              (entry) => entry.slug === item
            );
            target = glossaryPath(
              course.slug,
              urlEdition,
              hasEntry ? item : undefined
            );
          } else if (edition.lessons.some((lesson) => lesson.slug === item)) {
            target = coursePath(course.slug, urlEdition, item);
          }
          return (
            <MenuItem
              key={edition.name}
              selected={edition.name === current.name}
              onClick={() => {
                setAnchor(null);
                router.push(target);
              }}
            >
              <ListItemText
                primary={edition.label}
                secondary={isNewest ? t('latestVersion') : undefined}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
