# 8. Enforce Conventional Commits with Commitlint and czg

Date: 2026-11-19

## Status

Accepted

## Context

Free-form commit messages make the history hard to read and filter, and they cannot be used to generate changelogs or versions automatically.

## Decision

We enforce **Conventional Commits**:

- **Commitlint** with `commitlint-config-spellbookx` validates every message in the `commit-msg` hook and, for pull requests, in CI.
- **czg** with `cz-config-spellbookx` (`cz.config.mjs`) provides a guided prompt through `pnpm commit`, with emoji and AI suggestions enabled.

1. **Readable History**: Uniform messages (`feat`, `fix`, `chore`, ...) that are easy to read and filter.
2. **Changelogs and Versions**: A base for generating changelogs and release versions automatically in the future.
3. **Guided Prompt**: `pnpm commit` helps write a valid message without memorizing the rules.
4. **Consistency Across Projects**: The same convention and configuration as Spellbookx.

## Consequences

### Positive

- A consistent, machine-readable commit history.
- Invalid messages are rejected before the commit is created.

### Negative or Trade-offs

- The rules are strict: the header has a maximum of 72 characters, and the scope must be one of `workspace`, `release`, or `@dcdavidev/notebook`.
- Contributors must learn the convention or use `pnpm commit`.
