import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';
import { hasLocale } from 'next-intl';

import { NotebookLogo } from '@/components/notebook-logo';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/lib/locale';
import { defaultPaletteId, palettes } from '@/theme/palettes';

/**
Size of every Open Graph image: the 1.91:1 ratio that social networks expect.
*/
export const size = { width: 1200, height: 630 };

export const contentType = 'image/png';

/**
 * Colors of the default palette (Fiery Ocean, light), so the shared image
 * matches what a first-time visitor sees.
 */
const colors = (
  palettes.find((item) => item.id === defaultPaletteId) ?? palettes[0]
).light;

/**
 * The script font of the landing title. Satori reads WOFF but not WOFF2,
 * so it loads the WOFF file that Fontsource ships.
 */
const satisfy = readFile(
  path.join(
    process.cwd(),
    'node_modules/@fontsource/satisfy/files/satisfy-latin-400-normal.woff'
  )
);

/**
 * The text font. Passing any font replaces the default of `next/og`, so it
 * loads that default (Geist) again and lists it first.
 */
const geist = readFile(
  path.join(
    process.cwd(),
    'node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf'
  )
);

/**
Shortens a text to the given length, ending with an ellipsis.
*/
function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export interface OgImageContent {
  /**
  Small line above the title, for example the course name.
  */
  eyebrow?: string;
  title: string;
  description?: string;
  /**
  Text in the bottom-right corner, for example "Lesson 2 of 10".
  */
  meta?: string;
}

/**
 * Draws the shared card: the Notebook brand, the page title and its
 * description on the palette background.
 */
export async function renderOgImage({
  eyebrow,
  title,
  description,
  meta,
}: OgImageContent): Promise<ImageResponse> {
  const titleSize = title.length > 60 ? 60 : title.length > 32 ? 72 : 88;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: colors.background,
        fontFamily: 'Geist',
        color: colors.text,
        borderBottom: `16px solid ${colors.secondary}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <NotebookLogo size={64} />
        <div style={{ fontFamily: 'Satisfy', fontSize: 52, lineHeight: 1 }}>
          Notebook
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {eyebrow && (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: colors.secondary,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {truncate(eyebrow, 60)}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            fontSize: titleSize,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          {truncate(title, 90)}
        </div>
        {description && (
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              lineHeight: 1.35,
              opacity: 0.75,
            }}
          >
            {truncate(description, 150)}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 26,
          opacity: 0.7,
        }}
      >
        <div style={{ display: 'flex' }}>notebook.dcdavidev.me</div>
        {meta && <div style={{ display: 'flex' }}>{meta}</div>}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Geist', data: await geist, style: 'normal', weight: 400 },
        { name: 'Satisfy', data: await satisfy, style: 'normal', weight: 400 },
      ],
    }
  );
}

/**
 * Language of an image route, falling back to the default one for an
 * unknown segment.
 */
export function ogLocale(lang: string): Locale {
  return hasLocale(routing.locales, lang) ? lang : routing.defaultLocale;
}

/**
One `{ lang }` per language, to prerender the images of the localized pages.
*/
export function localeParams() {
  return routing.locales.map((lang) => ({ lang }));
}
