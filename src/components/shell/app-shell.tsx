'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IconListNumbers, IconMenu2 } from '@tabler/icons-react';

import { AppFooter } from './app-footer';
import { AppSidebar } from './app-sidebar';
import { CourseLessons } from './course-lessons';
import { ReadingProgress } from './reading-progress';
import { VersionMenu } from './version-menu';

import { AccountMenu } from '@/components/auth/account-menu';
import { LessonPlayer } from '@/components/player/lesson-player';
import { SettingsMenu } from '@/components/settings-menu';
import { Link, usePathname } from '@/i18n/navigation';
import type { CourseSummary } from '@/lib/courses';
import { mainScrollId, scrollToTop } from '@/lib/main-scroll';

const expandedWidth = 272;
const collapsedWidth = 64;

/**
 * Rounded panel on the canvas, as used on desktop.
 */
const panelSx = {
  bgcolor: 'background.default',
  borderRadius: { xs: 0, md: '20px' },
} as const;

/**
 * App frame. On desktop it fills the window: rounded panels on a canvas
 * for the sidebar (which collapses into a rail of icons), the lessons of
 * the open course, the app bar, and the page, which scrolls inside its own
 * panel. The footer sits below the frame, across the whole width, and the
 * lesson player is fixed to the bottom of the window. On phones the window
 * scrolls, the app bar sticks to the top, and the sidebar is a drawer.
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
  // Desktop: the course panel next to the sidebar, open until closed.
  const [isCoursePanelOpen, setIsCoursePanelOpen] = useState(true);
  // Phones: the lessons sheet, opened from the app bar.
  const [isLessonsSheetOpen, setIsLessonsSheetOpen] = useState(false);
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'));

  const pathname = usePathname();
  // `/learn/<topic>/...`: the topic shown on the left of the app bar.
  const topic = pathname.startsWith('/learn/')
    ? pathname.split('/', 3)[2]
    : undefined;
  const currentCourse = courses.find((item) => item.slug === topic);

  const width = collapsed ? collapsedWidth : expandedWidth;

  // The page panel keeps its scroll position across navigations, and the
  // router may scroll the window to bring the new page into view, so start
  // every new page with both at the top, unless the link points at a heading.
  useEffect(() => {
    if (!location.hash) {
      scrollToTop();
    }
  }, [pathname]);

  return (
    <Box
      sx={{
        // Room for the player, which is fixed to the bottom of the window.
        pb: 'var(--nb-player-height, 0px)',
        bgcolor: { xs: 'background.default', md: 'var(--nb-canvas)' },
      }}
    >
      {/* The frame: as tall as the window above the player on desktop. */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: { xs: 0, md: 1 },
          minHeight: { xs: '100dvh', md: 0 },
          height: {
            md: 'calc(100dvh - var(--nb-player-height, 0px))',
          },
        }}
      >
        {/* The sidebar floats as a rounded panel on the canvas. */}
        <Box
          component="aside"
          sx={{
            display: { xs: 'none', md: 'block' },
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

        {/* Desktop: every lesson of the open course, in a second panel. */}
        {currentCourse && isCoursePanelOpen && (
          <Box
            component="aside"
            aria-label={currentCourse.title}
            sx={{
              display: { xs: 'none', md: 'flex' },
              width: 320,
              flexShrink: 0,
              overflow: 'hidden',
              bgcolor: 'background.default',
              borderRadius: '20px',
            }}
          >
            <CourseLessons
              course={currentCourse}
              onClose={() => {
                setIsCoursePanelOpen(false);
              }}
            />
          </Box>
        )}

        {/* Phones: the same list in a sheet that slides up from the bottom. */}
        {currentCourse && (
          <Drawer
            anchor="bottom"
            open={isLessonsSheetOpen && !isDesktop}
            onClose={() => {
              setIsLessonsSheetOpen(false);
            }}
            slotProps={{
              paper: {
                sx: {
                  height: '85dvh',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  bgcolor: 'background.default',
                  display: 'flex',
                },
              },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                mx: 'auto',
                mt: 1,
                flexShrink: 0,
                bgcolor: 'divider',
              }}
            />
            <CourseLessons
              course={currentCourse}
              onNavigate={() => {
                setIsLessonsSheetOpen(false);
              }}
              onClose={() => {
                setIsLessonsSheetOpen(false);
              }}
            />
          </Drawer>
        )}

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

        {/* The app bar and the page, as two panels stacked on desktop. */}
        <Stack
          sx={{ flex: 1, minWidth: 0, minHeight: 0, gap: { xs: 0, md: 1 } }}
        >
          <Stack
            direction="row"
            component="header"
            sx={{
              ...panelSx,
              position: { xs: 'sticky', md: 'relative' },
              top: 0,
              zIndex: 'appBar',
              flexShrink: 0,
              // Keeps the reading progress bar inside the rounded corners.
              overflow: { md: 'clip' },
              alignItems: 'center',
              gap: 1,
              px: { xs: 1, md: 2 },
              py: 1,
              minHeight: 56,
              bgcolor: {
                xs: 'color-mix(in oklch, var(--nb-background) 85%, transparent)',
                md: 'background.default',
              },
              backdropFilter: { xs: 'blur(12px)', md: 'none' },
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
            {/* Opens the lessons sheet on phones, and reopens the course panel
              on desktop after it was closed. */}
            {currentCourse && (!isDesktop || !isCoursePanelOpen) && (
              <Tooltip
                title={t('showLessons', { course: currentCourse.title })}
              >
                <IconButton
                  onClick={() => {
                    if (isDesktop) {
                      setIsCoursePanelOpen(true);
                    } else {
                      setIsLessonsSheetOpen(true);
                    }
                  }}
                  aria-label={t('showLessons', { course: currentCourse.title })}
                  color="inherit"
                >
                  <IconListNumbers />
                </IconButton>
              </Tooltip>
            )}
            <SettingsMenu />
            <AccountMenu />
            {/* On course pages, a bar right under the app bar fills up while
              the reader scrolls to the end of the page. */}
            {currentCourse && <ReadingProgress resetKey={pathname} />}
          </Stack>
          {/* On desktop the page scrolls inside its own panel. */}
          <Box
            component="main"
            id={mainScrollId}
            tabIndex={-1}
            sx={{
              ...panelSx,
              flex: 1,
              minHeight: 0,
              outline: 'none',
              overflowY: { md: 'auto' },
            }}
          >
            <Box sx={{ display: 'flex', minHeight: '100%' }}>{children}</Box>
          </Box>
        </Stack>
      </Box>

      {/* Below the frame, across the whole width. */}
      <AppFooter
        courseCount={courses.length}
        lessonCount={courses.reduce(
          (sum, course) => sum + (course.versions[0]?.lessons.length ?? 0),
          0
        )}
      />
      {/* Fixed to the bottom of the window, across the whole width. */}
      <LessonPlayer courses={courses} />
    </Box>
  );
}
