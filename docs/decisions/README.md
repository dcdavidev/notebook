# Architecture Decision Records (ADRs)

This directory documents the key architectural decisions made in the Notebook project.

## What is an Architecture Decision Record?

An Architecture Decision Record (ADR) captures a significant architectural decision along with its context, considered alternatives, and consequences.

## Decision Record Format

Each ADR is written in Markdown and named following the pattern:
`NNNN-title-in-kebab-case.md` (e.g., `0001-use-nextjs-app-router-for-the-website.md`).

### ADR Template

```markdown
# [Number]. [Short title of solved problem and decision]

Date: YYYY-MM-DD

## Status

[Proposed | Accepted | Superseded | Deprecated]

## Context

What is the problem or architectural requirement being addressed? What constraints or limitations exist?

## Decision

What is the change or architecture being adopted? What options were considered and why was this chosen?

## Consequences

### Positive

- Positive outcome or benefit 1
- Positive outcome or benefit 2

### Negative or Trade-offs

- Downside, limitation, or operational overhead
```

## Index of Decisions

| ADR                                                                       | Title                                                | Status     | Date       |
| :------------------------------------------------------------------------ | :--------------------------------------------------- | :--------- | :--------- |
| [**ADR-0001**](./0001-use-nextjs-app-router-for-the-website.md)           | Use Next.js with the App Router for the Website      | Accepted   | 2026-11-19 |
| [**ADR-0002**](./0002-use-typescript.md)                                  | Use TypeScript                                       | Accepted   | 2026-11-19 |
| [**ADR-0003**](./0003-keep-tailwind-css-from-the-nextjs-template.md)      | Keep Tailwind CSS from the Next.js Template          | Deprecated | 2026-11-19 |
| [**ADR-0004**](./0004-use-pnpm-as-package-manager.md)                     | Use pnpm as Package Manager                          | Accepted   | 2026-11-19 |
| [**ADR-0005**](./0005-adopt-the-spellbookx-toolchain-for-code-quality.md) | Adopt the Spellbookx Toolchain for Code Quality      | Accepted   | 2026-11-19 |
| [**ADR-0006**](./0006-use-eslint-10-with-the-nextjs-plugin.md)            | Use ESLint 10 with the Next.js Plugin                | Accepted   | 2026-11-19 |
| [**ADR-0007**](./0007-use-lefthook-for-git-hooks.md)                      | Use Lefthook for Git Hooks                           | Accepted   | 2026-11-19 |
| [**ADR-0008**](./0008-enforce-conventional-commits.md)                    | Enforce Conventional Commits with Commitlint and czg | Accepted   | 2026-11-19 |
| [**ADR-0009**](./0009-license-under-agpl-3.0.md)                          | License the Project under AGPL-3.0                   | Accepted   | 2026-11-19 |
| [**ADR-0010**](./0010-run-ci-in-a-single-github-actions-job.md)           | Run CI in a Single GitHub Actions Job                | Accepted   | 2026-11-19 |
| [**ADR-0011**](./0011-store-tool-configurations-in-config-directory.md)   | Store Tool Configurations in the .config Directory   | Accepted   | 2026-11-19 |
| [**ADR-0012**](./0012-require-nodejs-24-and-pin-the-version.md)           | Require Node.js 24 and Pin the Exact Version         | Accepted   | 2026-11-19 |
