import '@fontsource/satisfy';
import '@fontsource-variable/inter';
import '@fontsource/pt-mono';

import type { Metadata } from 'next';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

import './globals.css';

import { AppShell } from '@/components/layout/app-shell';
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
        <script
          // Applies the stored palette before the first paint.
          // eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml -- static script built from our own constants
          dangerouslySetInnerHTML={{ __html: createPaletteInitScript() }}
        />
      </head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
