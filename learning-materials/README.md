# Course content

Every course on Notebook is a folder of Markdown files. The app reads these files and renders them, so you can add or fix a lesson without touching the code: clone the repository, edit a `.md` file, and open a pull request.

## Folder structure

```text
learning-materials/
└── <topic>/                       # abap, sap, javascript, typescript, golang, ...
    └── course/
        ├── v1/                    # first version of the course
        │   ├── README.en.md       # course home page, in English
        │   ├── README.it.md       # course home page, in Italian
        │   ├── 0001-<slug>.en.md  # lesson 1, English
        │   ├── 0001-<slug>.it.md  # lesson 1, Italian
        │   └── 0002-<slug>.en.md
        └── v2/                    # a new edition of the course
            └── ...
```

- The topic folder name is used in the URL. Use lowercase letters, digits, and hyphens.
- Version folders are always named `v1`, `v2`, `v3`, ... Never create a `latest` folder: `latest` exists only in the URL, as an alias of the highest version. The sidebar and `/learn/<topic>` open `latest`.
- Each lesson has one file per language, with the locale before `.md`. The translations share **the same base name**, so the language switcher finds them.
- The sidebar lists the courses in alphabetical order by title.

URLs:

| Page             | URL                                                  |
| ---------------- | ---------------------------------------------------- |
| Course home page | `/<lang>/learn/<topic>/course/<version>`             |
| Lesson           | `/<lang>/learn/<topic>/course/<version>/<NNNN-slug>` |

`<version>` is `latest` or a folder name such as `v1`. For example, `learning-materials/abap/course/v1/0005-internal-tables.en.md` is served at `/en/learn/abap/course/v1/0005-internal-tables` and, while `v1` is the highest version, at `/en/learn/abap/course/latest/0005-internal-tables`.

## Course home page (`README.<locale>.md`)

Every version folder has one `README.<locale>.md` per language: `README.en.md` and `README.it.md`. It is the course home page on the site; if a language is missing, the site shows the English one. Write in it:

- who the course is for;
- how the course is organized (weeks, levels, the structure of a lesson);
- the table of contents, with a link to every lesson;
- what you need to follow it (systems, tools, sample data);
- what is specific to this version.

The README also holds the course metadata. Start it with a front matter block for the description and the tags, then the topic as a `#` heading: the site uses the heading as the course title, in the sidebar and on the page.

```markdown
---
description: A 15-day intensive course on SAP and ABAP.
tags:
  - SAP
  - ABAP
---

# ABAP
```

The sidebar uses the README of the highest version. Tags describe the course and link related courses: reuse the tags that other courses already have when they fit.

Link the lessons with a relative path to the file, so the links work both on GitHub and on the site:

```markdown
1. [Internal tables](./0005-internal-tables.en.md): lists of data in memory.
```

## Lessons

### File name

`NNNN-slug.<locale>.md`, where:

- `NNNN` is the four-digit step: `0001`, `0002`, ... It sets the order of the lessons.
- `slug` is a short name in English, in lowercase with hyphens, for example `internal-tables`.
- `locale` is the language: `en` or `it`.

### Front matter

Every lesson starts with a YAML front matter block:

```markdown
---
title: Internal tables
description: Store and process lists of data in memory.
---
```

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

## Before you open a pull request

Run the checks. They also lint, format, and spell-check the Markdown files:

```bash
pnpm check
```

If CSpell flags a correct word, add it in lowercase to the right word list in `.config/cspell/`: `technical.txt` for acronyms, product names, and other technical terms; `english.txt` for English words; `italian.txt` for Italian words (checked only in Italian files).
