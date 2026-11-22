'use client';

import { type ReactNode, useState } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconMenu2 } from '@tabler/icons-react';

import { AppFooter } from './app-footer';
import { AppSidebar } from './app-sidebar';
import { ReadingProgress } from './reading-progress';
import { VersionMenu } from './version-menu';

import { AccountMenu } from '@/components/auth/account-menu';
import { LessonPlayer } from '@/components/player/lesson-player';
import { SettingsMenu } from '@/components/settings-menu';
import { Link, usePathname } from '@/i18n/navigation';
import type { CourseSummary } from '@/lib/courses';

const expandedWidth = 272;
const collapsedWidth = 64;

/**
 * App frame with a sidebar that collapses into a
 * rail of icons on the left, and a wide, quiet content area on the right.
 * On small screens, the sidebar opens as a drawer.
 */
export function AppShell({
  children,
  courses,
}: {
  children: ReactNode;
  courses: CourseSummary[];
}) {
  const t = useTranslations('Shell');
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pathname = usePathname();
  // `/learn/<topic>/...`: the topic shown on the left of the app bar.
  const topic = pathname.startsWith('/learn/')
    ? pathname.split('/', 3)[2]
    : undefined;
  const currentCourse = courses.find((item) => item.slug === topic);

  const width = collapsed ? collapsedWidth : expandedWidth;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        minHeight: '100dvh',
        p: { xs: 0, md: 1 },
        // Room for the player, which is fixed to the bottom of the window.
        pb: {
          xs: 'var(--nb-player-height, 0px)',
          md: 'calc(8px + var(--nb-player-height, 0px))',
        },
        bgcolor: { xs: 'background.default', md: 'var(--nb-canvas)' },
      }}
    >
      {/* The sidebar floats as a rounded panel on the canvas. */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: 8,
          height: 'calc(100dvh - 16px - var(--nb-player-height, 0px))',
          width,
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          bgcolor: 'background.default',
          borderRadius: '20px',
        }}
      >
        <AppSidebar
          courses={courses}
          collapsed={collapsed}
          onToggleCollapsed={() => {
            setCollapsed((current) => !current);
          }}
        />
      </Box>

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        sx={{ display: { md: 'none' } }}
        slotProps={{
          paper: {
            sx: {
              width: expandedWidth,
              bgcolor: 'background.default',
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
            },
          },
        }}
      >
        <AppSidebar
          courses={courses}
          collapsed={false}
          onNavigate={() => {
            setDrawerOpen(false);
          }}
        />
      </Drawer>

      {/* The page is one big rounded panel. `clip` rounds its corners
          without breaking the sticky header. */}
      <Stack
        sx={{
          flex: 1,
          minWidth: 0,
          bgcolor: 'background.default',
          borderRadius: { xs: 0, md: '20px' },
          overflow: 'clip',
        }}
      >
        <Stack
          direction="row"
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 'appBar',
            alignItems: 'center',
            gap: 1,
            px: { xs: 1, md: 2 },
            py: 1,
            minHeight: 56,
            bgcolor:
              'color-mix(in oklch, var(--nb-background) 85%, transparent)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <IconButton
            onClick={() => {
              setDrawerOpen(true);
            }}
            aria-label={t('openNavigation')}
            sx={{ display: { md: 'none' } }}
          >
            <IconMenu2 />
          </IconButton>
          <Stack
            direction="row"
            sx={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 1 }}
          >
            {currentCourse && (
              <>
                <Typography
                  component={Link}
                  href={`/learn/${currentCourse.slug}`}
                  noWrap
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'text.primary',
                    textDecoration: 'none',
                  }}
                >
                  {currentCourse.title}
                </Typography>
                <VersionMenu course={currentCourse} pathname={pathname} />
              </>
            )}
          </Stack>
          <SettingsMenu />
          <AccountMenu />
          {/* On course pages, a bar right under the app bar fills up while
              the reader scrolls to the end of the page. */}
          {currentCourse && <ReadingProgress resetKey={pathname} />}
        </Stack>
        <Box
          component="main"
          tabIndex={-1}
          sx={{ flex: 1, display: 'flex', minHeight: 0, outline: 'none' }}
        >
          {children}
        </Box>
        {/* Fixed to the bottom of the window, across the whole width. */}
        <LessonPlayer courses={courses} />
        <AppFooter
          courseCount={courses.length}
          lessonCount={courses.reduce(
            (sum, course) => sum + (course.versions[0]?.lessons.length ?? 0),
            0
          )}
        />
      </Stack>
    </Box>
  );
}
