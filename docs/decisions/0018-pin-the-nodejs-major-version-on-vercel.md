# 18. Pin the Node.js Major Version on Vercel

Date: 2026-11-22

## Status

Accepted. Amends [ADR-0012](./0012-require-nodejs-24-and-pin-the-version.md).

## Context

[ADR-0012](./0012-require-nodejs-24-and-pin-the-version.md) set `"engines": { "node": ">=24" }` and pinned the exact local and CI version in `.nvmrc` (`v26.13.1`).

Vercel reads only `engines`. With an open range like `>=24`, it deploys with the newest Node.js major it supports, so a new major release would change the production runtime without any change in the repository. Vercel warns about this on every build. It also meant production could run a different major version than local machines and CI.

## Decision

We set `"engines": { "node": "26.x" }`, the same major version as `.nvmrc`.

1. **No Surprise Upgrades**: Vercel deploys the latest 26.x and never moves to a new major by itself.
2. **One Major Everywhere**: Local machines, CI, and production all run Node.js 26.

## Consequences

### Positive

- The Vercel warning about automatic major upgrades is gone.
- Production runs the same major version as local machines and CI.

### Negative or Trade-offs

- Moving to a new major means updating both `.nvmrc` and `engines` together.
- Contributors need Node.js 26. With pnpm's default settings, an older version shows a warning, not an error.
