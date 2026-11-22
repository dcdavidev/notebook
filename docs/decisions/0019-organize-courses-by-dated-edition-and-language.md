# 19. Organize Courses by Dated Edition and Language

Date: 2026-11-22

## Status

Accepted.

## Context

Courses lived in `learning-materials/<topic>/course/v<N>/`, with one file per language next to each other (`0001-slug.en.md`, `0001-slug.it.md`). The glossary sat beside the course versions, in `learning-materials/<topic>/glossary/`, and linked to the lessons of one version only.

Version numbers say nothing about when a course was written, and the glossary of one version does not describe the lessons of another. Two languages in one folder also double every listing, and the locale suffix repeats in every link.

## Decision

A course is a set of **editions**, named after their year and month:

```text
learning-materials/<topic>/<YYYY.MM>/<lang>/course/NNNN-slug.md
learning-materials/<topic>/<YYYY.MM>/<lang>/glossary/<term>.md
```

- An edition folder is `YYYY.MM` (`2026.11`); the URL writes it `YYYY-MM`, with `latest` as an alias of the newest one: `/<lang>/learn/<topic>/<edition>/course/<lesson>` and `/<lang>/learn/<topic>/<edition>/glossary/<term>`.
- Each language has its own folder with the same file names, and links between files have no locale (`./0005-slug.md`, `../course/0005-slug.md`).
- Each edition has its own glossary, with one file per main term and its similar terms, and term names in English in every language.
- Bookmarks and reading progress store the edition name (`2026-11`) in the existing `version` column. The ABAP course `v2` became the edition `2026.11`; `v1` was removed.
- The old URLs (`/learn/<topic>/course/v<N>/...`) are not redirected.

## Consequences

### Positive

- An edition tells readers how recent a course is, and its glossary matches its lessons.
- Each language folder can be read, linked, and translated on its own.
- Links between files are shorter and work on GitHub and on the site.

### Negative or Trade-offs

- Links to the old URLs, including shared ones, now return 404.
- Bookmarks and progress of the removed `v1` were deleted by the migration.
- The database column keeps the name `version` although it now holds an edition.
