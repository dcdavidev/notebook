---
title: Comments and formatting
description: Line and end-of-line comments, the pretty printer, and readable code.
---

_Beginner level_

Code is read far more often than it's written: by your colleagues, by the person who fixes a bug in five years' time, and by you after you've forgotten why you wrote it that way. **Comments** explain what the code can't say by itself, and consistent **formatting** makes the structure visible at a glance.

ABAP gives you two kinds of comments and a tool, the pretty printer, that formats the code for you.

## Two kinds of comments

| Syntax | Where               | What it comments                            |
| ------ | ------------------- | ------------------------------------------- |
| `*`    | in the first column | the whole line                              |
| `"`    | anywhere in a line  | everything after it, to the end of the line |

```abap
REPORT zcomments_demo.

* Print a greeting for the user.
* This is a full-line comment: the asterisk is in column 1.
WRITE 'Hello!'.      " end-of-line comment after a statement

"WRITE 'Goodbye!'.   commented-out statement: it doesn't run
```

A quote inside a literal isn't a comment: in `WRITE 'Say "cheese"'.` the whole text is printed.

> [!WARNING]
> The asterisk works only in the very first column. If you indent it, `*` is no longer a comment and the syntax check reports an error. Use `"` for comments that you want to indent together with the code.

ABAP has no block comments like `/* ... */` in other languages. To comment out several lines, select them and use the editor shortcut:

| Editor           | Comment  | Uncomment      |
| ---------------- | -------- | -------------- |
| ADT              | `Ctrl+<` | `Ctrl+Shift+<` |
| SAP GUI (`SE38`) | `Ctrl+<` | `Ctrl+>`       |

Both put a `*` in front of each selected line, or remove it.

## Comments that help

A good comment says **why**, not **what**. The code already says what it does:

```abap
DATA lv_days TYPE i VALUE 30.

* Bad: repeats the code
lv_days = lv_days + 1.   " add 1 to lv_days

* Good: explains the reason
lv_days = lv_days + 1.   " the contract counts both the first and the last day
```

A few habits keep comments useful:

- Write a short header comment at the top of a program: what it does and who uses it.
- Prefer a clear name to a comment: `lv_max_passengers` needs no explanation, `lv_x` does.
- Don't keep old code commented out "just in case". The system keeps every activated version: in `SE38` open **Utilities > Versions > Version Management**, in ADT use **Compare With > Revision History**.
- Update or delete a comment when you change the code it describes. A wrong comment is worse than none.

You'll also meet two special comment forms later: **ABAP Doc** comments, which start with `"!` and document classes and methods, and **pseudo-comments** such as `"#EC ...`, which silence a specific check. The checks come in [Code quality: ATC and Clean ABAP](./0107-code-quality.en.md).

## The pretty printer

The **pretty printer** reformats the source code: it indents the blocks consistently and converts the case of keywords and names. Press `Shift+F1` in either editor.

```abap
* Before
report zcomments_demo.
data lv_count type i value 3.
if lv_count > 2.
write 'More than two'.
endif.

* After the pretty printer (keywords in uppercase, blocks indented)
REPORT zcomments_demo.
DATA lv_count TYPE i VALUE 3.
IF lv_count > 2.
  WRITE 'More than two'.
ENDIF.
```

The `IF` statement in the example is explained in [IF and logical expressions](./0024-if-and-logical-expressions.en.md); here it only shows how the pretty printer indents a block.

You choose the settings once:

- **SAP GUI**: **Utilities > Settings > ABAP Editor > Pretty Printer**: check **Indent** and choose **Keyword uppercase**.
- **ADT**: right-click the ABAP project, **Properties > ABAP Development > Editors > Source Code Editors > Formatter**. The settings belong to the project, so the whole team can share them.

> [!TIP]
> The pretty printer is like a spell checker that fixes the layout instead of the spelling. You keep writing quickly; one key press makes the page tidy before anyone else reads it.

## Readable layout

Beyond what the pretty printer does, a few layout choices make code easier to read:

- One statement per line.
- Blank lines between logical blocks, like paragraphs in a text.
- Aligned declarations in chained statements, so names and types form columns.
- Short lines: if a statement gets long, break it after a keyword or an operand and indent the rest.

## Exercise

> [!IMPORTANT]
>
> 1. Type this program exactly as it is, all in lowercase, then run the pretty printer with keywords in uppercase.
> 2. Add a header comment with `*` and an end-of-line comment with `"`.
> 3. Comment out the second `write` with the editor shortcut and run the program.
>
> ```abap
> report zformat_test.
> write 'First'.
> write 'Second'.
> ```

### Solution

```abap
* Exercise: comments and formatting
* Prints one line of text.
REPORT zformat_test.
WRITE 'First'.       " this one is printed
*WRITE 'Second'.
```

Only `First` is printed. The shortcut put the `*` in column 1, so the second statement is a comment.

> [!NOTE]
>
> - `*` in the first column comments the whole line; `"` comments the rest of a line.
> - There are no block comments: select lines and use the editor shortcut instead.
> - Comment why, not what; prefer clear names to comments.
> - `Shift+F1` runs the pretty printer: consistent indentation and keyword case.
> - Don't keep dead code commented out: the version history keeps the old versions.
