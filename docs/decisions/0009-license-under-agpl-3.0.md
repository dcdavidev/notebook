# 9. License the Project under AGPL-3.0

Date: 2026-11-19

## Status

Accepted

## Context

Notebook is a public website that offers free programming courses and study notes. The source code must have a license that defines how others can use it.

Permissive licenses such as MIT allow closed-source forks. The GPL requires sharing modifications only when the software is distributed, not when it runs as an online service.

## Decision

We license the project under the **GNU Affero General Public License v3.0** (`AGPL-3.0-only`, see `LICENSE`):

1. **Network Use Coverage**: Anyone who runs a modified version as an online service must publish their changes.
2. **No Closed Forks**: Nobody can take the site, close its source code, and resell it.
3. **Consistent with Free Content**: The courses and notes are free, and so is the code that publishes them.
4. **Contributions Stay Open**: Every improvement goes back to the community.

## Consequences

### Positive

- The code and all its derivatives stay open, including when they run as services.
- Contributions are licensed under the same terms (see `CONTRIBUTING.md`).

### Negative or Trade-offs

- Some companies avoid AGPL code, which may limit reuse and contributions.
