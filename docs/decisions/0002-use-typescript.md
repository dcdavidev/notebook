# 2. Use TypeScript

Date: 2026-11-19

## Status

Accepted

## Context

The project needs a language for the application code, the configuration files, and future tooling scripts. All other projects by the same author, such as Spellbookx and dcdavidev.me, are written in TypeScript.

## Decision

We write the project in **TypeScript** (`tsconfig.json`, `.ts` and `.tsx` files):

1. **Consistency Across Projects**: TypeScript is the standard language of all the author's projects, so code, conventions, and tooling stay the same everywhere.

The `typecheck` script (`next typegen && tsc --noEmit`) runs in the `pre-commit` Git hook and in CI.

## Consequences

### Positive

- One language and one set of conventions across all the author's repositories.
- Type errors are caught before runtime, locally and in CI.
- Next.js generates route types (`next typegen`), such as `LayoutProps` and `PageProps`.

### Negative or Trade-offs

- An extra type-check step adds time to commits, pushes, and CI runs.
