'use client';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconBookmark,
  IconGitPullRequest,
  IconHeartHandshake,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconStar,
} from '@tabler/icons-react';

import { SidebarUser } from './sidebar-user';

import { useBookmarks } from '@/components/bookmarks/bookmarks-context';
import { useFavorites } from '@/components/favorites/favorites-context';
import { NotebookLogo } from '@/components/notebook-logo';
import { Link, usePathname } from '@/i18n/navigation';
import { accentFor } from '@/lib/accent';
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

const headingSx = {
  display: 'block',
  px: 1.5,
  pt: 2,
  pb: 0.5,
  color: 'text.secondary',
  lineHeight: 1.5,
} as const;

interface SavedItem {
  key: string;
  href: string;
  label: string;
  /**
  Course title, under a bookmarked lesson.
  */
  detail?: string;
}

/**
 * Favorite courses and bookmarked lessons of the signed-in visitor, newest
 * first. Each list shows only when it has something in it.
 */
function SavedSections({
  courses,
  onNavigate,
}: {
  courses: CourseSummary[];
  onNavigate?: () => void;
}) {
  const t = useTranslations('Shell');
  const pathname = usePathname();
  const { favorites } = useFavorites();
  const { bookmarks } = useBookmarks();
  const bySlug = new Map(courses.map((course) => [course.slug, course]));

  const favoriteItems: SavedItem[] = [];
  for (const { course } of favorites) {
    const data = bySlug.get(course);
    if (data) {
      favoriteItems.push({
        key: course,
        href: `/learn/${course}`,
        label: data.title,
      });
    }
  }
  const bookmarkItems: SavedItem[] = [];
  for (const { course, version, lesson } of bookmarks) {
    const data = bySlug.get(course);
    const title = data?.versions
      .find((item) => item.name === version)
      ?.lessons.find((item) => item.slug === lesson)?.title;
    if (data && title) {
      bookmarkItems.push({
        key: `${course}/${version}/${lesson}`,
        href: `/learn/${course}/course/${version}/${lesson}`,
        label: title,
        detail: data.title,
      });
    }
  }

  const sections = [
    {
      id: 'sidebar-favorites',
      title: t('favorites'),
      icon: IconStar,
      items: favoriteItems,
    },
    {
      id: 'sidebar-bookmarks',
      title: t('bookmarks'),
      icon: IconBookmark,
      items: bookmarkItems,
    },
  ];

  return sections.map(({ id, title, icon: Icon, items }) =>
    items.length === 0 ? null : (
      <Box key={id}>
        <Typography id={id} component="h2" variant="overline" sx={headingSx}>
          {title}
        </Typography>
        <List dense disablePadding aria-labelledby={id}>
          {items.map((item) => (
            <li key={item.key}>
              <ListItemButton
                component={Link}
                href={item.href}
                onClick={onNavigate}
                selected={pathname === item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                sx={{ ...itemSx, gap: 1, py: 0.5 }}
              >
                <Icon size={16} aria-hidden style={{ flexShrink: 0 }} />
                <ListItemText
                  primary={item.label}
                  secondary={item.detail}
                  slotProps={{
                    primary: { sx: { fontSize: 13.5 } },
                    secondary: { sx: { fontSize: 12 } },
                  }}
                />
              </ListItemButton>
            </li>
          ))}
        </List>
      </Box>
    )
  );
}

/**
 * Sidebar with the site title, the button that collapses it into a narrow
 * rail, the links to the home, sponsor, and contribute pages, the
 * favorite courses and bookmarked lessons, and the Learn section
 * with the courses in
 * alphabetical order. The open course also lists the lessons of the
 * version being read.
 */
export function AppSidebar({
  courses,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: AppSidebarProps) {
  const t = useTranslations('Shell');
  const pathname = usePathname();
  const toggleLabel = t(collapsed ? 'expandSidebar' : 'collapseSidebar');
  // Top-level pages, above the Learn section.
  const pages = [
    { href: '/overview', label: t('home'), icon: IconHome },
    { href: '/sponsor', label: t('sponsor'), icon: IconHeartHandshake },
    { href: '/contribute', label: t('contribute'), icon: IconGitPullRequest },
  ];

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

      {collapsed ? (
        <Stack
          component="nav"
          aria-label={t('navigation')}
          sx={{ alignItems: 'center' }}
        >
          {pages.map(({ href, label, icon: Icon }) => (
            <Tooltip key={href} title={label} placement="right">
              <IconButton
                component={Link}
                href={href}
                onClick={onNavigate}
                aria-label={label}
                aria-current={pathname === href ? 'page' : undefined}
              >
                <Icon size={20} />
              </IconButton>
            </Tooltip>
          ))}
        </Stack>
      ) : (
        <Box
          component="nav"
          aria-label={t('navigation')}
          sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
          <List dense disablePadding>
            {pages.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <ListItemButton
                  component={Link}
                  href={href}
                  onClick={onNavigate}
                  selected={pathname === href}
                  aria-current={pathname === href ? 'page' : undefined}
                  sx={{ ...itemSx, gap: 1, py: 1 }}
                >
                  <Icon size={18} aria-hidden />
                  <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                </ListItemButton>
              </li>
            ))}
          </List>

          <SavedSections courses={courses} onNavigate={onNavigate} />

          <Typography
            id="sidebar-learn"
            component="h2"
            variant="overline"
            sx={headingSx}
          >
            {t('learn')}
          </Typography>
          <List dense disablePadding aria-labelledby="sidebar-learn">
            {courses.map((course) => {
              const coursePath = `/learn/${course.slug}`;
              const isActive =
                pathname === coursePath ||
                pathname.startsWith(`${coursePath}/`);
              return (
                <li key={course.slug}>
                  {/* The lessons open next to the sidebar, in the course
                      panel, or in the lessons sheet on phones. */}
                  <ListItemButton
                    component={Link}
                    href={coursePath}
                    onClick={onNavigate}
                    selected={isActive}
                    sx={{ ...itemSx, gap: 1, py: 1 }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: accentFor(course.slug),
                      }}
                    />
                    <Typography sx={{ fontWeight: 600 }}>
                      {course.title}
                    </Typography>
                  </ListItemButton>
                </li>
              );
            })}
          </List>
        </Box>
      )}
      <SidebarUser collapsed={collapsed} onNavigate={onNavigate} />
    </Stack>
  );
}
