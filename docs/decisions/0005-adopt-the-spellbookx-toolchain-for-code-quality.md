# 5. Adopt the Spellbookx Toolchain for Code Quality

Date: 2026-11-19

## Status

Accepted

## Context

The project needs linting, formatting, and spellchecking. Configuring ESLint, Prettier, and CSpell by hand means selecting and maintaining dozens of plugins and rules, and repeating that work in every repository.

Spellbookx is the author's own suite of shareable configurations for these tools.

## Decision

We adopted the **Spellbookx** toolchain:

- `eslint-plugin-spellbookx` with the `recommended-spellcheck` preset (`eslint.config.mjs`).
- `prettier-config-spellbookx` with the `tailwind` preset (`prettier.config.mjs`).
- `cspell-config-spellbookx`, imported in `.config/cspell.yml`.
- `commitlint-config-spellbookx` and `cz-config-spellbookx` (see [ADR-0008](./0008-enforce-conventional-commits.md)).

1. **Our Own Suite**: Using Spellbookx on a real application validates it in practice (dogfooding).
2. **Same Rules Everywhere**: Linting, formatting, and spelling rules are identical across all the author's repositories.
3. **Less Configuration**: One preset per tool replaces a long list of plugins and rules.

## Consequences

### Positive

- Small configuration files that only select a preset.
- Consistent code style across projects.
- Problems found here improve Spellbookx itself.

### Negative or Trade-offs

- The project depends on the Spellbookx release cycle for fixes and new rules.
- Some presets need extra direct dependencies under pnpm (for example, the Prettier plugins and the Commitlint parser preset).
