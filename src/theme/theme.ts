'use client';

import { createTheme } from '@mui/material/styles';

/**
Font stacks, loaded with Fontsource in the root layout.
*/
export const fonts = {
  title: "'Satisfy', cursive",
  body: "'Inter Variable', system-ui, sans-serif",
  mono: "'PT Mono', ui-monospace, monospace",
} as const;

/**
 * The palette values are CSS variables defined per palette in
 * `src/theme/palettes.ts`. `nativeColor` lets MUI derive the light, dark,
 * and contrast shades with CSS relative colors instead of JavaScript.
 */
const palette = {
  primary: { main: 'var(--nb-primary)' },
  secondary: { main: 'var(--nb-secondary)' },
  // Informational messages use the brand color of the active palette.
  info: { main: 'var(--nb-primary)' },
  background: {
    default: 'var(--nb-background)',
    paper: 'var(--nb-paper)',
  },
  text: {
    primary: 'var(--nb-text)',
    secondary: 'var(--nb-text-secondary)',
  },
  divider: 'var(--nb-divider)',
};

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
    nativeColor: true,
  },
  colorSchemes: {
    light: { palette },
    dark: { palette },
  },
  typography: {
    fontFamily: fonts.body,
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--nb-font-title': fonts.title,
          '--nb-font-body': fonts.body,
          '--nb-font-mono': fonts.mono,
          '--nb-paper': 'color-mix(in oklch, var(--nb-background), #fff 55%)',
          '--nb-text-secondary':
            'color-mix(in oklch, var(--nb-text) 72%, transparent)',
          '--nb-divider':
            'color-mix(in oklch, var(--nb-text) 16%, transparent)',
          // The surface around the rounded panels of the app shell.
          '--nb-canvas':
            'color-mix(in oklch, var(--nb-background), var(--nb-text) 7%)',
        },
        ':root.dark': {
          '--nb-paper': 'color-mix(in oklch, var(--nb-background), #fff 7%)',
          '--nb-canvas': 'color-mix(in oklch, var(--nb-background), #000 45%)',
        },
        'blockquote, q, code, kbd, samp, pre': {
          fontFamily: fonts.mono,
        },
        blockquote: {
          margin: 0,
          paddingInlineStart: '1rem',
          borderInlineStart: '4px solid var(--nb-secondary)',
          color: 'var(--nb-text-secondary)',
        },
        ':not(pre) > code': {
          padding: '0.1em 0.35em',
          borderRadius: 6,
          backgroundColor:
            'color-mix(in oklch, var(--nb-text) 8%, transparent)',
          fontSize: '0.9em',
        },
        pre: {
          margin: 0,
          padding: '1rem',
          overflowX: 'auto',
          borderRadius: 14,
          backgroundColor:
            'color-mix(in oklch, var(--nb-text) 8%, transparent)',
        },
      },
    },
    // Soft, rounded controls instead of square ones.
    MuiButton: {
      styleOverrides: { root: { borderRadius: 999 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 24 } },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 14 } },
    },
  },
});
