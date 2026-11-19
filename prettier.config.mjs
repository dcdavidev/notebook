import tailwind from 'prettier-config-spellbookx/tailwind';

/**
@type {import('prettier').Config}
*/
export default {
  ...tailwind,
  tailwindStylesheet: './src/app/globals.css',
};
