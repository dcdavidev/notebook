# Course content

Every course on Notebook is a folder of Markdown files. The app reads these files and renders them, so you can add or fix a lesson without touching the code: clone the repository, edit a `.md` file, and open a pull request.

## Folder structure

```text
learning-materials/
└── <topic>/                         # abap, sap, javascript, typescript, golang, ...
    └── <edition>/                   # 2026.11: the year and month of the edition
        ├── en/                      # English
        │   ├── course/
        │   │   ├── README.md        # course home page
        │   │   ├── 0001-<slug>.md   # lesson 1
        │   │   └── 0002-<slug>.md
        │   └── glossary/            # optional
        │       ├── README.md        # glossary home page, with the index
        │       ├── abap.md          # one entry: a term and the similar ones
        │       └── internal-table.md
        └── it/                      # Italian, with the same file names
            ├── course/
            └── glossary/
```

- The topic folder name is used in the URL. Use lowercase letters, digits, and hyphens.
- An edition folder is named after its year and month, `YYYY.MM`, for example `2026.11`. In the URL it is written `YYYY-MM`. Never create a `latest` folder: `latest` exists only in the URL, as an alias of the newest edition. The sidebar and `/learn/<topic>` open `latest`.
- Each language has its own folder. The translations of a file share **the same file name**, so the language switcher finds them. If a file is missing in a language, the site shows the English one.
- The sidebar lists the courses in alphabetical order by title.

URLs:

| Page               | URL                                                  |
| ------------------ | ---------------------------------------------------- |
| Course home page   | `/<lang>/learn/<topic>/<edition>/course`             |
| Lesson             | `/<lang>/learn/<topic>/<edition>/course/<NNNN-slug>` |
| Glossary home page | `/<lang>/learn/<topic>/<edition>/glossary`           |
| Glossary entry     | `/<lang>/learn/<topic>/<edition>/glossary/<term>`    |

`<edition>` is `latest` or an edition such as `2026-11`. For example, `learning-materials/abap/2026.11/en/course/0033-internal-tables-intro.md` is served at `/en/learn/abap/2026-11/course/0033-internal-tables-intro` and, while `2026.11` is the newest edition, at `/en/learn/abap/latest/course/0033-internal-tables-intro`.

## Course home page (`course/README.md`)

Every language of an edition has one `course/README.md`. It is the course home page on the site. Write in it:

- who the course is for;
- how the course is organized (levels, the structure of a lesson);
- the table of contents, with a link to every lesson;
- what you need to follow it (systems, tools, sample data);
- what is specific to this edition.

The README also holds the course metadata. Start it with a front matter block for the description and the tags, then the topic as a `#` heading: the site uses the heading as the course title, in the sidebar and on the page.

```markdown
---
description: A complete, self-paced ABAP course.
tags:
  - SAP
  - ABAP
---

# ABAP
```

The sidebar uses the README of the newest edition. Tags describe the course and link related courses: reuse the tags that other courses already have when they fit.

Link the lessons with a relative path to the file, so the links work both on GitHub and on the site:

```markdown
1. [Internal tables](./0033-internal-tables-intro.md): lists of data in memory.
```

## Lessons

The sections every lesson must have, in order, are described in [How to write a lesson](../docs/contributing/lesson-structure.md).

### File name

`NNNN-slug.md`, in the `course/` folder of its language, where:

- `NNNN` is the four-digit step: `0001`, `0002`, ... It sets the order of the lessons.
- `slug` is a short name in English, in lowercase with hyphens, for example `internal-tables`.

### Front matter

Every lesson starts with a YAML front matter block:

```markdown
---
title: Internal tables
description: Store and process lists of data in memory.
level: basic
---
```

`level` is one of `beginner`, `basic`, `intermediate`, or `pro`, in English in every language. See [How to write a lesson](../docs/contributing/lesson-structure.md#1-front-matter).

Put the title in quotes if it contains a colon, for example `title: 'Modularization: splitting code into blocks'`.

Don't repeat the title as a `#` heading in the body: the page shows it already. Start the sections at `##`.

### Code blocks

Fenced code blocks are highlighted with [Shiki](https://shiki.style). Always set the language:

````markdown
```abap
WRITE 'Hello, world!'.
```
````

Supported languages: `abap`, `sql`, `json`, `xml`, `javascript`, `typescript`, `shellscript`. Use `text` for anything else. To add a language, edit `langs` in `src/lib/markdown.ts`.

### Callouts

Use GitHub alert syntax. Each type gets a translated title:

| Syntax           | Title (en / it)      | Use it for                    |
| ---------------- | -------------------- | ----------------------------- |
| `> [!NOTE]`      | Summary / Riepilogo  | the end-of-lesson summary     |
| `> [!TIP]`       | Analogy / Analogia   | an everyday analogy           |
| `> [!IMPORTANT]` | Exercise / Esercizio | the exercise list             |
| `> [!WARNING]`   | Warning / Attenzione | a common mistake or a risk    |
| `> [!CAUTION]`   | Caution / Attenzione | something that can break data |

```markdown
> [!WARNING]
> Always check `sy-subrc` after a `SELECT SINGLE`.
```

Tables, task lists, and footnotes from GitHub Flavored Markdown work too.

## Glossary (optional)

An edition can have a glossary next to its course, in `<edition>/<lang>/glossary/`.

- `README.md` starts with a front matter `description` and a `#` title, like the course README. Write a short introduction and the index of the entries in alphabetical order, with relative links (`./internal-table.md`).
- Each entry is a file `<term>.md`, named after its main term in English, in lowercase with hyphens. Its front matter has `title` (the main term) and `description` (the terms it explains).
- An entry explains its main term and the similar ones, for example `sap.md` explains SAP, SAP GUI, SAP HANA, and SAP S/4HANA. Write one `##` heading per term, with the term in English in every language, followed by the definition and the link to the lesson: `Lesson [33](../course/0033-internal-tables-intro.md).`

The glossary can be downloaded as one PDF or Markdown file, or as a ZIP with one file per entry, and the course archives include it.

## Search

The search field of the site searches the newest edition of every course, in the reader's language. The index is built from the files, so there is nothing to register:

- lessons: `title`, `description`, the `##` and `###` headings, and the text; code blocks count less, and the result shows the `level`;
- glossary entries: `title`, `description`, the `##` headings, and the text.

A result opens the page at the heading that matches the search. Headings that name the topic of their section, and glossary headings for every name of a term, help readers find it.

## Before you open a pull request

Run the checks. They also lint, format, and spell-check the Markdown files:

```bash
pnpm check
```

If CSpell flags a correct word, add it in lowercase to the right word list in `.config/cspell/`: `technical.txt` for acronyms, product names, and other technical terms; `english.txt` for English words; `italian.txt` for Italian words (checked only in Italian files).
