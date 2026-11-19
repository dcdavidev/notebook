# 11. Store Tool Configurations in the .config Directory

Date: 2026-11-19

## Status

Accepted

## Context

Every development tool adds its own configuration file, and most of them default to the repository root. The root fills up with files that are rarely edited.

## Decision

We store tool configurations in **`.config/`** when the tool supports it:

- `.config/lefthook.yml` (Lefthook)
- `.config/cspell.yml` and `.config/cspell/custom.txt` (CSpell)
- `.config/lefthook/install-if-deps-changed.sh` (hook script)

1. **Cleaner Root**: Fewer configuration files in the repository root.
2. **The .config Convention**: Follows the `.config/` directory convention, which Lefthook and CSpell detect automatically.
3. **Everything in One Place**: Tool configurations are grouped and easy to find.

## Consequences

### Positive

- A shorter, more readable repository root.
- No extra flags: the tools find their configuration without `--config`.

### Negative or Trade-offs

- Not every tool supports `.config/`. ESLint, Prettier, Commitlint, czg, and EditorConfig keep their files in the root.
- Paths inside these files are relative to `.config/`, not to the root.
