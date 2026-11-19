# 10. Run CI in a Single GitHub Actions Job

Date: 2026-11-19

## Status

Accepted

## Context

Every pull request and every push to `main` must pass the same checks as the local Git hooks: commit messages, linting, formatting, spelling, types, and the production build.

These checks can run as one job with sequential steps, or as several parallel jobs.

## Decision

We run CI on **GitHub Actions** in a **single job** with sequential steps (`.github/workflows/code-quality-and-build.yml`):

1. **Simple to Read**: One job, with the steps in the same order as the local checks.

The pnpm version comes from `packageManager` and the Node.js version from `.nvmrc`, so CI matches the local environment.

## Consequences

### Positive

- The whole pipeline is readable in one short file.
- Dependencies are installed once per run.

### Negative or Trade-offs

- Steps run one after another, so a run takes longer than parallel jobs would.
- The first failing step stops the job, so later problems appear only in the next run.
