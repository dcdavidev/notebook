# 14. Offer Multiple Color Palettes from Coolors

Date: 2026-11-19

## Status

Accepted

## Context

A single light and dark theme gives every visitor the same look. We want visitors to choose the style they prefer, and we want the site to have a recognizable identity.

Material UI supports the `light` and `dark` color schemes out of the box, but it does not document custom schemes for several brand palettes. Swapping the whole theme object at runtime would also show the default palette for a moment after every page load.

## Decision

We offer **five palettes** picked from the [Coolors trending palettes](https://coolors.co/palettes/trending), each with a light and a dark version: Fiery Ocean (default), Olive Garden Feast, Soft Lavender, Refreshing Summer Fun, and Black & Gold Elegance.

1. **Personalization**: Each visitor chooses the palette and the mode (light, dark, or system) from the theme menu.
2. **Site Identity**: The palettes give the site a distinctive character.
3. **Proven Palettes**: The Coolors trending palettes are popular color combinations, so we do not have to design them.

How it works:

- `src/theme/palettes.ts` defines four tokens per palette and mode (primary, secondary, background, text). They become CSS variables (`--nb-*`) under `:root[data-palette='…']` and `.dark`.
- The MUI theme uses these variables as palette values. The `nativeColor` option makes MUI derive the light, dark, and contrast shades with CSS relative colors.
- Switching palette only changes the `data-palette` attribute on the `html` element. An inline script applies the stored palette before the first paint.

## Consequences

### Positive

- Switching palette is instant and needs no new theme or re-render of the styles.
- No flash of the default palette after a reload, and the pages stay static.
- Adding a palette means adding one object to `palettes.ts`.

### Negative or Trade-offs

- `nativeColor` relies on modern CSS (`color-mix()` and relative colors), which older browsers do not support.
- Each new palette must be checked for text and button contrast in both modes.
