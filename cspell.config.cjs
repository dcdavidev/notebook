const { defineConfig } = require('@cspell/cspell-types');

module.exports = defineConfig({
  version: '0.2',
  import: ['cspell-config-spellbookx'],
  dictionaryDefinitions: [
    {
      name: 'custom-dict',
      path: './.config/cspell/custom.txt',
      addWords: true,
    },
  ],
  dictionaries: ['custom-dict'],
  ignorePaths: [
    '.agents/**',
    '.claude/**',
    '.openhands/**',
    'skills-lock.json',
    'LICENSE',
  ],
});
