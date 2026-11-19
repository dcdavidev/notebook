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
import type { CourseSummary } from '@/lib/courses';

/**
URL alias of the newest version (mirrors `latestVersion` in `lib/courses`).
*/
const latest = 'latest';

/**
 * Chip with the course version being read. Without a version in the URL, or
 * with `latest`, it shows the newest one. Choosing another version opens the
 * same lesson in it when it exists there, otherwise its home page.
 */
export function VersionMenu({
  course,
  pathname,
}: {
  course: CourseSummary;
  /**
  Path without the locale: `/learn/<topic>/course/<version>/<lesson>`.
  */
  pathname: string;
}) {
  const t = useTranslations('Shell');
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const parts = pathname.split('/', 6);
  const segment = parts[4];
  const lesson = parts[5];
  const newest = course.versions[0];
  const current =
    course.versions.find((item) => item.name === segment) ?? newest;
  if (!newest || !current) {
    return null;
  }

  const label = t('versionLabel', { version: current.name });

  return (
    <>
      <Chip
        label={
          <Box
            component="span"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {current.name}
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
        {course.versions.map((version) => {
          const isNewest = version.name === newest.name;
          const urlVersion = isNewest ? latest : version.name;
          const hasLesson = version.lessons.some(
            (item) => item.slug === lesson
          );
          const target = `/learn/${course.slug}/course/${urlVersion}${
            hasLesson ? `/${lesson ?? ''}` : ''
          }`;
          return (
            <MenuItem
              key={version.name}
              selected={version.name === current.name}
              onClick={() => {
                setAnchor(null);
                router.push(target);
              }}
            >
              <ListItemText
                primary={version.name}
                secondary={isNewest ? t('latestVersion') : undefined}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
