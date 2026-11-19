/**
 * Color palettes of the site, picked from the Coolors trending palettes.
 * @see https://coolors.co/palettes/trending
 *
 * Each palette defines four tokens for the light and the dark color scheme.
 * The tokens become CSS variables (`--nb-*`), and the MUI theme reads them,
 * so switching palette changes only an attribute on the `html` element.
 */

export interface PaletteTokens {
  /**
  Main brand color: buttons, links, active states.
  */
  primary: string;
  /**
  Accent color.
  */
  secondary: string;
  /**
  Page background.
  */
  background: string;
  /**
  Main text color.
  */
  text: string;
}

export interface SitePalette {
  /**
  Value of the `data-palette` attribute.
  */
  id: string;
  /**
  Name of the palette on Coolors.
  */
  name: string;
  /**
  Link to the palette on Coolors.
  */
  url: string;
  /**
  Original Coolors colors, used for the preview swatches.
  */
  swatches: string[];
  light: PaletteTokens;
  dark: PaletteTokens;
}

export const palettes = [
  {
    id: 'fiery-ocean',
    name: 'Fiery Ocean',
    url: 'https://coolors.co/780000-c1121f-fdf0d5-003049-669bbc',
    swatches: ['#780000', '#C1121F', '#FDF0D5', '#003049', '#669BBC'],
    light: {
      primary: '#003049',
      secondary: '#C1121F',
      background: '#FDF0D5',
      text: '#003049',
    },
    dark: {
      primary: '#669BBC',
      secondary: '#C1121F',
      background: '#001E2E',
      text: '#FDF0D5',
    },
  },
  {
    id: 'olive-garden',
    name: 'Olive Garden Feast',
    url: 'https://coolors.co/606c38-283618-fefae0-dda15e-bc6c25',
    swatches: ['#606C38', '#283618', '#FEFAE0', '#DDA15E', '#BC6C25'],
    light: {
      primary: '#606C38',
      secondary: '#BC6C25',
      background: '#FEFAE0',
      text: '#283618',
    },
    dark: {
      primary: '#DDA15E',
      secondary: '#BC6C25',
      background: '#1C2611',
      text: '#FEFAE0',
    },
  },
  {
    id: 'soft-lavender',
    name: 'Soft Lavender',
    url: 'https://coolors.co/22223b-4a4e69-9a8c98-c9ada7-f2e9e4',
    swatches: ['#22223B', '#4A4E69', '#9A8C98', '#C9ADA7', '#F2E9E4'],
    light: {
      primary: '#4A4E69',
      secondary: '#9A8C98',
      background: '#F2E9E4',
      text: '#22223B',
    },
    dark: {
      primary: '#C9ADA7',
      secondary: '#9A8C98',
      background: '#22223B',
      text: '#F2E9E4',
    },
  },
  {
    id: 'summer-fun',
    name: 'Refreshing Summer Fun',
    url: 'https://coolors.co/8ecae6-219ebc-023047-ffb703-fb8500',
    swatches: ['#8ECAE6', '#219EBC', '#023047', '#FFB703', '#FB8500'],
    light: {
      primary: '#219EBC',
      secondary: '#FB8500',
      background: '#EEF7FB',
      text: '#023047',
    },
    dark: {
      primary: '#8ECAE6',
      secondary: '#FFB703',
      background: '#023047',
      text: '#E6F3F9',
    },
  },
  {
    id: 'black-gold',
    name: 'Black & Gold Elegance',
    url: 'https://coolors.co/000000-14213d-fca311-e5e5e5-ffffff',
    swatches: ['#000000', '#14213D', '#FCA311', '#E5E5E5', '#FFFFFF'],
    light: {
      primary: '#14213D',
      secondary: '#FCA311',
      background: '#E5E5E5',
      text: '#000000',
    },
    dark: {
      primary: '#FCA311',
      secondary: '#E5E5E5',
      background: '#000000',
      text: '#E5E5E5',
    },
  },
] as const satisfies readonly SitePalette[];

export type PaletteId = (typeof palettes)[number]['id'];

export const defaultPaletteId: PaletteId = 'fiery-ocean';

/**
localStorage key that stores the selected palette.
*/
export const paletteStorageKey = 'nb-palette';

export const paletteIds: PaletteId[] = palettes.map((palette) => palette.id);

/**
 * Checks that a value is the id of a known palette.
 */
export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && paletteIds.includes(value as PaletteId);
}

/**
 * Converts the palette tokens to CSS variable declarations.
 */
function tokensToCss(tokens: PaletteTokens): string {
  return [
    `--nb-primary: ${tokens.primary};`,
    `--nb-secondary: ${tokens.secondary};`,
    `--nb-background: ${tokens.background};`,
    `--nb-text: ${tokens.text};`,
  ].join(' ');
}

/**
 * CSS for all the palettes. The light scheme applies by default, and the
 * `.dark` class (set by MUI on the `html` element) selects the dark scheme.
 */
export function createPalettesCss(): string {
  const rules = palettes.flatMap((palette) => {
    const selector = `:root[data-palette='${palette.id}']`;
    const isDefault = palette.id === defaultPaletteId;

    return [
      `${isDefault ? ':root, ' : ''}${selector} { ${tokensToCss(palette.light)} }`,
      `${isDefault ? ':root.dark, ' : ''}${selector}.dark { ${tokensToCss(palette.dark)} }`,
    ];
  });

  return rules.join('\n');
}

/**
 * Inline script that applies the stored palette before the first paint,
 * so the page never flashes the default palette.
 */
export function createPaletteInitScript(): string {
  return `(function(){try{var p=localStorage.getItem(${JSON.stringify(
    paletteStorageKey
  )});if(${JSON.stringify(paletteIds)}.indexOf(p)!==-1){document.documentElement.setAttribute('data-palette',p);}}catch(e){}})();`;
}
