'use client';

import type { ReactNode } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { AuthProvider } from '@/components/auth/auth-context';
import { PreferencesSync } from '@/components/auth/preferences-sync';
import { BookmarksProvider } from '@/components/bookmarks/bookmarks-context';
import { FavoritesProvider } from '@/components/favorites/favorites-context';
import { PaletteProvider } from '@/theme/palette-context';
import { theme } from '@/theme/theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme} disableTransitionOnChange>
        <CssBaseline enableColorScheme />
        <PaletteProvider>
          <AuthProvider>
            <FavoritesProvider>
              <BookmarksProvider>
                {children}
                <PreferencesSync />
              </BookmarksProvider>
            </FavoritesProvider>
          </AuthProvider>
        </PaletteProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
