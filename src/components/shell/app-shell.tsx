'use client';

import { type ReactNode, useState } from 'react';

import { useTranslations } from 'next-intl';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { IconBrandGithub, IconMenu2 } from '@tabler/icons-react';

import { AppFooter } from './app-footer';
import { AppSidebar } from './app-sidebar';
import { ReadingProgress } from './reading-progress';
import { VersionMenu } from './version-menu';

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
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: 0,
          height: '100dvh',
          width,
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          bgcolor:
            'color-mix(in oklch, var(--nb-background), var(--nb-text) 4%)',
          borderRight: 1,
          borderColor: 'divider',
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
              bgcolor:
                'color-mix(in oklch, var(--nb-background), var(--nb-text) 4%)',
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

      <Stack sx={{ flex: 1, minWidth: 0 }}>
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
            borderBottom: 1,
            borderColor: 'divider',
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
          <Tooltip title={t('sourceCode')}>
            <IconButton
              href="https://github.com/dcdavidev/notebook"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('sourceCode')}
              color="inherit"
            >
              <IconBrandGithub />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('authorWebsite')}>
            <IconButton
              href="https://dcdavidev.me"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('authorWebsite')}
              sx={{ p: 0.5 }}
            >
              <Avatar
                src="/images/davide-di-criscito.jpg"
                alt=""
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          </Tooltip>
          <SettingsMenu />
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
        <AppFooter />
      </Stack>
    </Box>
  );
}
