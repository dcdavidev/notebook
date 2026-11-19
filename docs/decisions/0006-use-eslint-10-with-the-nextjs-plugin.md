# 6. Use ESLint 10 with the Next.js Plugin

Date: 2026-11-19

## Status

Accepted

## Context

`create-next-app` sets up linting with `eslint-config-next`. That config depends on `eslint-plugin-react`, `eslint-plugin-import`, and `eslint-plugin-jsx-a11y`, whose peer dependencies do not support ESLint 10.

`eslint-plugin-spellbookx` (see [ADR-0005](./0005-adopt-the-spellbookx-toolchain-for-code-quality.md)) requires ESLint 10, because its dependencies (`@eslint/js`, `eslint-plugin-unicorn`, `eslint-plugin-astro`) need it.

## Decision

We use **ESLint 10** and replace `eslint-config-next` with **`@next/eslint-plugin-next`**:

1. **Spellbookx for General Rules**: The `recommended-spellcheck` preset already covers JavaScript, TypeScript, React (through `@eslint-react`), JSON, Markdown, and spelling.
2. **Next.js Plugin for Framework Rules**: Only the `recommended` and `core-web-vitals` rules of `@next/eslint-plugin-next` are added in `eslint.config.mjs`.

We will revisit this decision and go back to `eslint-config-next` when it supports ESLint 10.

## Consequences

### Positive

- One ESLint version that satisfies the Spellbookx preset.
- The Next.js-specific rules (images, links, scripts, Core Web Vitals) are still enforced.

### Negative or Trade-offs

- The Next.js rules are wired by hand and must be kept in sync with the plugin's configs.
- Some transitive plugins still report peer dependency warnings for ESLint 10.
