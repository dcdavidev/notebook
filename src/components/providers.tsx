'use client';

import type { ReactNode } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { PaletteProvider } from '@/theme/palette-context';
import { theme } from '@/theme/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme} disableTransitionOnChange>
        <CssBaseline enableColorScheme />
        <PaletteProvider>{children}</PaletteProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
