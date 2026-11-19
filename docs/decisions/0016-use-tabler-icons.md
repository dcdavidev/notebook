# 16. Use Tabler Icons

Date: 2026-11-19

## Status

Accepted

## Context

The interface needs icons for navigation, actions, and links. Material UI offers its own icon set, `@mui/icons-material`, but any React icon library works with its components.

## Decision

We use **Tabler Icons** (`@tabler/icons-react`):

1. **More Icons**: More than 5,000 icons, including brand icons such as GitHub.

Each icon is a React component, so only the icons that the site imports end up in the bundle.

## Consequences

### Positive

- A large set of icons in one consistent outline style.
- Brand icons are available without a second library.

### Negative or Trade-offs

- The icons follow the Tabler style, not Material Design, so they can look different from Material UI's own icons inside some components.
