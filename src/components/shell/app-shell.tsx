'use client';

import { type ReactNode, useState } from 'react';

import { useTranslations } from 'next-intl';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { IconBrandGithub, IconMenu2 } from '@tabler/icons-react';

import { AppSidebar } from './app-sidebar';

import { SettingsMenu } from '@/components/settings-menu';

const expandedWidth = 272;
const collapsedWidth = 64;

/**
 * App frame with a sidebar that collapses into a
 * rail of icons on the left, and a wide, quiet content area on the right.
 * On small screens, the sidebar opens as a drawer.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('Shell');
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          sx={{ alignItems: 'center', gap: 1, px: { xs: 1, md: 2 }, py: 1 }}
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
          <Box sx={{ flex: 1 }} />
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
        </Stack>
        <Box component="main" sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
