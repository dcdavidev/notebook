# 3. Keep Tailwind CSS from the Next.js Template

Date: 2026-11-19

## Status

Deprecated

Tailwind CSS was removed on 2026-11-19. Styling now uses Material UI (see [ADR-0013](./0013-use-material-ui-for-components-and-theming.md)).

## Context

The project was created with `create-next-app`, whose default template includes **Tailwind CSS v4**. It is integrated through the `@tailwindcss/turbopack` loader in `next.config.ts` and imported in `src/app/globals.css`.

No styling solution was evaluated against Tailwind before the project started. The choice comes from the template, not from a comparison.

## Decision

We **keep Tailwind CSS** as the default styling solution for now:

1. **Template Default**: It is already configured and working, so there is no reason to replace it before the site has real styles.
2. **Toolchain Support**: The `prettier-config-spellbookx/tailwind` preset sorts Tailwind classes automatically.

We will revisit this decision when the site's design takes shape.

## Consequences

### Positive

- Styling works out of the box with no extra setup.
- Tailwind classes are formatted and sorted consistently by Prettier.

### Negative or Trade-offs

- The choice is not the result of an evaluation and may change, which would mean rewriting the existing styles.
