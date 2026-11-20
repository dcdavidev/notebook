import '@fontsource/satisfy';
import '@fontsource-variable/inter';
import '@fontsource/pt-mono';

import type { Metadata } from 'next';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

import './globals.css';

import { ConsentedAnalytics } from '@/components/consented-analytics';
import { InlineScript } from '@/components/inline-script';
import { CookieBanner } from '@/components/island/cookie-banner';
import { Providers } from '@/components/providers';
import {
  createPaletteInitScript,
  createPalettesCss,
  defaultPaletteId,
} from '@/theme/palettes';

export const metadata: Metadata = {
  title: 'Notebook',
  description:
    'Digital notebook for free programming courses, downloadable study notes, and personal hobbies.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-palette={defaultPaletteId} suppressHydrationWarning>
      <head>
        <style>{createPalettesCss()}</style>
        {/* Applies the stored palette before the first paint. */}
        <InlineScript html={createPaletteInitScript()} />
      </head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <Providers>
          {children}
          <CookieBanner />
          <ConsentedAnalytics />
        </Providers>
      </body>
    </html>
  );
}
