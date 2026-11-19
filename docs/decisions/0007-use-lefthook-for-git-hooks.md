# 7. Use Lefthook for Git Hooks

Date: 2026-11-19

## Status

Accepted

## Context

The project runs checks locally before code reaches the repository: linting, formatting, spellchecking, type-checking, commit message validation, and the production build. It also needs to reinstall dependencies after a checkout, merge, or rebase changes them.

The author develops on Windows. The common alternative, Husky with lint-staged, relies on shell scripts that often break on Windows, and needs lint-staged to filter staged files.

## Decision

We adopted **Lefthook**, configured in `.config/lefthook.yml`:

1. **Cross-Platform**: A single Go binary behaves the same on Windows, macOS, and Linux.
2. **Simple and Robust**: One YAML file, with no hand-written hook scripts in `.git/hooks`.
3. **Fast**: Jobs run in parallel, for example spellcheck and type-check alongside ESLint and Prettier.
4. **Highly Configurable**: Built-in staged-file filtering (`{staged_files}`, `glob`, `stage_fixed`) without lint-staged.
5. **Beyond Commits**: The same file manages `pre-commit`, `commit-msg`, `pre-push`, `post-checkout`, `post-merge`, and `post-rewrite`.

## Consequences

### Positive

- Identical hook behavior for every contributor, regardless of the operating system.
- Short commit times thanks to parallel jobs on staged files only.
- Dependencies stay in sync automatically after switching branches or pulling.

### Negative or Trade-offs

- Lefthook must be installed. This happens automatically through the `prepare` script, and pnpm must allow its install script (`allowBuilds`).
- Hook arguments are not expanded in every field (for example `files`), so complex logic lives in a small script (`.config/lefthook/install-if-deps-changed.sh`).
