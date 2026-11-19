# 4. Use pnpm as Package Manager

Date: 2026-11-19

## Status

Accepted

## Context

The project needs a package manager to install dependencies locally and in CI. The options are npm, Yarn, Bun, and pnpm. The author's other projects, such as Spellbookx, already use pnpm.

## Decision

We chose **pnpm**, with the exact version pinned in the `packageManager` field of `package.json`:

1. **Fast and Space-Efficient**: A content-addressable store with hard links makes installs fast and keeps disk usage low.
2. **No Phantom Dependencies**: The non-flat `node_modules` layout allows the code to import only the dependencies that it declares.
3. **Supply-Chain Safety**: Dependency install scripts run only for approved packages, listed in `allowBuilds` in `pnpm-workspace.yaml` (currently only `lefthook`).
4. **Consistency Across Projects**: The same package manager and workflow as the author's other repositories.

## Consequences

### Positive

- Fast, reproducible installs from `pnpm-lock.yaml`, locally and in CI.
- Undeclared dependencies fail immediately instead of working by accident.
- Install scripts from new dependencies cannot run without explicit approval.

### Negative or Trade-offs

- Contributors and CI must use pnpm rather than npm or Yarn.
- Some tools that expect a flat `node_modules` fail to resolve their plugins. For example, Prettier plugins must be installed as direct dependencies.
