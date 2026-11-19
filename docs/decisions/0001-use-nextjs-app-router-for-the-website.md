# 1. Use Next.js with the App Router for the Website

Date: 2026-11-19

## Status

Accepted

## Context

Notebook is a digital notebook for free programming courses, downloadable study notes, and personal hobbies. Its pages are mostly content, so they must load fast and be easy for search engines to index. The site is deployed and hosted on Vercel.

We evaluated:

- **React Router (framework mode)**: React-based, but it needs more manual setup, and its support for React Server Components is less mature.
- **Express.js + React Router**: Full control, but we must build and run our own server and wire rendering by hand.
- **Astro**: Excellent for content sites, but it is not React-first. Pages use islands and the `.astro` format instead of plain React components.

## Decision

We chose **Next.js** with the **App Router** (`src/app/`):

1. **Server Components and Static Generation**: Pages render on the server or at build time, which gives fast loads and good SEO for courses and notes.
2. **React Ecosystem**: The whole site is written in React, with access to its libraries and components.
3. **Native Vercel Deployment**: Next.js is built by Vercel and deploys there with zero configuration, including preview deployments for every pull request.

## Consequences

### Positive

- Fast, indexable pages with little client-side JavaScript.
- One framework for routing, rendering, data fetching, and assets.
- Zero-configuration hosting, previews, and domains on Vercel.

### Negative or Trade-offs

- Next.js evolves quickly. Major versions bring breaking changes in APIs and conventions, so upgrades need care.
- The project is coupled to Next.js conventions (file-based routing, `next.config.ts`).
