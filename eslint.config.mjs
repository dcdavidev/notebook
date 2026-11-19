import { defineConfig, globalIgnores } from 'eslint/config';
import spellbookx from 'eslint-plugin-spellbookx';
import nextPlugin from '@next/eslint-plugin-next';

export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Agent skills installed from external sources
    '.agents/**',
    '.claude/**',
    '.openhands/**',
  ]),
  spellbookx.configs['recommended-spellcheck'],
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
]);
