# 15. Self-Host Fonts with Fontsource

Date: 2026-11-19

## Status

Accepted

## Context

The site uses three fonts with separate roles:

- **Satisfy** for the site title.
- **Inter** for the body text.
- **PT Mono** for blockquotes, inline quotes, and code.

Fonts can load from a third-party service such as Google Fonts, or be served by the site itself.

## Decision

We **self-host** the fonts with **Fontsource** packages (`@fontsource/satisfy`, `@fontsource-variable/inter`, `@fontsource/pt-mono`), imported in `src/app/layout.tsx`:

1. **Self-Hosted**: The font files are served with the site. Visitors' browsers send no requests to third-party font services, which is better for privacy and works offline.

The font stacks are defined in `src/theme/theme.ts` and exposed as the CSS variables `--nb-font-title`, `--nb-font-body`, and `--nb-font-mono`.

## Consequences

### Positive

- No third-party requests and no visitor data sent to font providers.
- Font versions are pinned in `pnpm-lock.yaml` and updated like other dependencies.

### Negative or Trade-offs

- Fontsource does not optimize loading as `next/font` does (automatic preloading and fallback size adjustment), so text can shift briefly while the fonts load.
