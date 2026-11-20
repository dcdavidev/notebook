'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconChevronDown,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from '@tabler/icons-react';

import { NotebookLogo } from '@/components/notebook-logo';
import { Link, usePathname } from '@/i18n/navigation';
import type { CourseSummary } from '@/lib/courses';

interface AppSidebarProps {
  /**
  Courses in alphabetical order.
  */
  courses: CourseSummary[];
  /**
  Shows only the toggle button.
  */
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  /**
  Called after a link is chosen, to close the mobile drawer.
  */
  onNavigate?: () => void;
}

const itemSx = {
  borderRadius: 2.5,
  '&.Mui-selected': {
    bgcolor: 'color-mix(in oklch, var(--nb-text) 8%, transparent)',
  },
};

/**
 * Sidebar with the site title, the button that collapses it into a narrow
 * rail, and the courses in alphabetical order. The open course also lists
 * the lessons of the version being read.
 */
export function AppSidebar({
  courses,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: AppSidebarProps) {
  const t = useTranslations('Shell');
  const tLearn = useTranslations('Learn');
  const pathname = usePathname();
  // Courses the user opened or closed with the arrow, by slug.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleLabel = t(collapsed ? 'expandSidebar' : 'collapseSidebar');

  return (
    <Stack sx={{ height: '100%', py: 1.5, px: 1, gap: 1.5 }}>
      <Stack
        direction={collapsed ? 'column' : 'row'}
        sx={{
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? 1 : 0,
          px: collapsed ? 0 : 1,
          minHeight: 40,
        }}
      >
        <Stack
          direction="row"
          component={Link}
          href="/overview"
          onClick={onNavigate}
          aria-label={collapsed ? 'Notebook' : undefined}
          sx={{
            alignItems: 'center',
            gap: 1,
            color: 'text.primary',
            textDecoration: 'none',
          }}
        >
          <NotebookLogo size={collapsed ? 32 : 30} />
          {!collapsed && (
            <Typography
              component="span"
              sx={{ fontFamily: 'var(--nb-font-title)', fontSize: '1.6rem' }}
            >
              Notebook
            </Typography>
          )}
        </Stack>
        {onToggleCollapsed && (
          <Tooltip title={toggleLabel} placement="right">
            <IconButton
              onClick={onToggleCollapsed}
              aria-label={toggleLabel}
              size="small"
            >
              {collapsed ? (
                <IconLayoutSidebarLeftExpand size={20} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={20} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {!collapsed && (
        <Box
          component="nav"
          aria-label={t('courses')}
          sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
          <List dense disablePadding>
            {courses.map((course) => {
              const coursePath = `/learn/${course.slug}`;
              const isActive = pathname.startsWith(`${coursePath}/`);
              // The course being read starts open; the arrow overrides it.
              const isOpen = expanded[course.slug] ?? isActive;
              const listId = `course-${course.slug}-lessons`;
              const arrowLabel = t(isOpen ? 'hideLessons' : 'showLessons', {
                course: course.title,
              });
              // `/learn/<topic>/course/<version>/<lesson>`: show the lessons
              // of the version being read. `latest` (the default) is the
              // newest one, which comes first.
              const segment = isActive ? pathname.split('/', 5)[4] : undefined;
              const pinned = course.versions.find(
                (item) => item.name === segment
              );
              const version = pinned ?? course.versions[0];
              const versionPath = `${coursePath}/course/${pinned ? pinned.name : 'latest'}`;
              // Pad the lesson numbers to the widest one, at least 2 digits,
              // so they line up: `01` with 20 lessons, `001` with 150.
              const lessons = version?.lessons ?? [];
              const digits = Math.max(
                2,
                String(lessons.at(-1)?.step ?? 0).length
              );
              const numberWidth = digits * 11;
              return (
                <li key={course.slug}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', gap: 0.5 }}
                  >
                    <ListItemButton
                      component={Link}
                      href={coursePath}
                      onClick={() => {
                        setExpanded((state) => ({
                          ...state,
                          [course.slug]: true,
                        }));
                        onNavigate?.();
                      }}
                      selected={isActive}
                      sx={{ ...itemSx, py: 1 }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {course.title}
                      </Typography>
                    </ListItemButton>
                    <Tooltip title={arrowLabel} placement="right">
                      <IconButton
                        size="small"
                        aria-label={arrowLabel}
                        aria-expanded={isOpen}
                        aria-controls={listId}
                        onClick={() =>
                          setExpanded((state) => ({
                            ...state,
                            [course.slug]: !isOpen,
                          }))
                        }
                      >
                        <IconChevronDown
                          size={18}
                          style={{
                            transform: isOpen ? 'none' : 'rotate(-90deg)',
                            transition: 'transform 150ms ease',
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Collapse id={listId} in={isOpen} unmountOnExit>
                    <List dense disablePadding sx={{ py: 0.5, pl: 1 }}>
                      <ListItemButton
                        component={Link}
                        href={versionPath}
                        onClick={onNavigate}
                        selected={pathname === versionPath}
                        aria-current={
                          pathname === versionPath ? 'page' : undefined
                        }
                        sx={{ ...itemSx, gap: 1, py: 0.5 }}
                      >
                        <ListItemText
                          primary={tLearn('overview')}
                          slotProps={{
                            primary: {
                              sx: {
                                fontSize: 13.5,
                                pl: `${numberWidth + 8}px`,
                              },
                            },
                          }}
                        />
                      </ListItemButton>
                      {lessons.map((lesson) => {
                        const lessonPath = `${versionPath}/${lesson.slug}`;
                        return (
                          <ListItemButton
                            key={lesson.slug}
                            component={Link}
                            href={lessonPath}
                            onClick={onNavigate}
                            selected={pathname === lessonPath}
                            aria-current={
                              pathname === lessonPath ? 'page' : undefined
                            }
                            sx={{ ...itemSx, gap: 1, py: 0.5 }}
                          >
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                minWidth: numberWidth,
                                color: 'text.secondary',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {String(lesson.step).padStart(digits, '0')}
                            </Typography>
                            <ListItemText
                              primary={lesson.title}
                              slotProps={{
                                primary: { sx: { fontSize: 13.5 } },
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                </li>
              );
            })}
          </List>
        </Box>
      )}
    </Stack>
  );
}
