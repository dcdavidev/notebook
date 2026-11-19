'use client';

import { type ReactNode, useState } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

const sidebarWidth = 248;

/**
 * Application frame that fills the whole viewport: a sticky sidebar on the
 * left, and the top bar above the page content on the right.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        background: [
          'radial-gradient(circle at 15% 0%, color-mix(in oklch, var(--nb-secondary) 22%, transparent), transparent 40%)',
          'radial-gradient(circle at 100% 100%, color-mix(in oklch, var(--nb-primary) 25%, transparent), transparent 45%)',
          'var(--nb-background)',
        ].join(', '),
        backgroundAttachment: 'fixed',
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: 0,
          width: sidebarWidth,
          height: '100dvh',
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'color-mix(in oklch, var(--nb-background) 60%, transparent)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Sidebar />
      </Box>
      <Drawer
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
        }}
        sx={{ display: { md: 'none' } }}
        slotProps={{ paper: { sx: { width: sidebarWidth } } }}
      >
        <Sidebar
          onNavigate={() => {
            setMenuOpen(false);
          }}
        />
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <TopBar
          onOpenMenu={() => {
            setMenuOpen(true);
          }}
        />
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
