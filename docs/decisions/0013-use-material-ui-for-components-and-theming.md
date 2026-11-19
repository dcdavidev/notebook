# 13. Use Material UI for Components and Theming

Date: 2026-11-19

## Status

Accepted

## Context

The site needs a set of user interface components (navigation, menus, buttons, cards, dialogs, forms) and a central theme for colors, typography, and light and dark modes.

The project started with Tailwind CSS from the Next.js template (see [ADR-0003](./0003-keep-tailwind-css-from-the-nextjs-template.md)), which provides utility classes but no components.

## Decision

We adopted **Material UI** (`@mui/material`), with Emotion and `@mui/material-nextjs` for the App Router, and removed Tailwind CSS:

1. **Ready-Made Components**: Complete, accessible components that we do not have to build from scratch.
2. **Powerful Theming**: One theme with CSS variables, light and dark color schemes, and custom palettes (see [ADR-0014](./0014-offer-multiple-color-palettes-from-coolors.md)).
3. **Material Design**: Consistent, proven design guidelines.
4. **Familiar API**: The author already knows Material UI and its APIs.

The theme lives in `src/theme/theme.ts`, and `src/components/providers.tsx` wraps the app with `AppRouterCacheProvider`, `ThemeProvider`, and `CssBaseline`.

## Consequences

### Positive

- New pages are built quickly from existing components.
- Colors, fonts, spacing, and component styles are defined in one place.
- Light, dark, and system modes work without a flash of the wrong mode, thanks to `InitColorSchemeScript`.

### Negative or Trade-offs

- Emotion runs on the client, so the theme and the providers are Client Components (`'use client'`).
- Material UI adds more JavaScript to the bundle than a utility-only CSS framework.
