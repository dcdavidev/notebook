# 12. Require Node.js 24 and Pin the Exact Version

Date: 2026-11-19

## Status

Accepted

## Context

The project must declare which Node.js versions it supports, and every environment (local machines, version managers, and CI) should run the same version.

## Decision

We set the minimum version and pin the exact one:

- `"engines": { "node": ">=24" }` in `package.json`.
- `.nvmrc` with the exact version (`v26.13.1`), read by nvm, fnm, and `actions/setup-node` in CI.

1. **Node.js 24 is the Current LTS**: The minimum supported version is the current long-term support release, which is also the default on Vercel.
2. **One Pinned Version**: `.nvmrc` fixes the exact version for everyone, locally and in CI.

## Consequences

### Positive

- Local, CI, and contributor environments run the same Node.js version.
- Older, unsupported Node.js versions are rejected clearly.

### Negative or Trade-offs

- `.nvmrc` must be updated by hand to move to a new Node.js version.
- The pinned local and CI version (26) is newer than the Vercel default (24), so production can run on a different major version.
