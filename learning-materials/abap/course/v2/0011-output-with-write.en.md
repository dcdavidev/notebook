---
title: Output with WRITE
description: Print text and values on a classic list, with positions and formats.
---

_Beginner level_

`WRITE` prints text and values on a **classic list**: the simple, page-like output screen you saw when you ran [your first program](./0008-hello-world.en.md). Modern applications show data in grids and Fiori apps, but `WRITE` is still the quickest way to see what a small program does, and you'll find it in thousands of existing reports.

This lesson covers lines, positions, and the most useful format options.

## Lines and chains

Every `WRITE` continues on the current line, with one blank between the outputs. A slash (`/`) starts a new line:

```abap
REPORT zwrite_demo.

WRITE 'Flights'.
WRITE 'for today'.            " same line: "Flights for today"
WRITE / 'Second line'.        " new line
WRITE: / 'Third line', 'still third'.
```

The last statement is a chained statement, as in [ABAP syntax rules](./0009-syntax-rules.en.md): `WRITE` is written once and the parts are separated by commas. Most lists are written this way.

Three more statements shape the page:

| Statement  | What it does                                 |
| ---------- | -------------------------------------------- |
| `SKIP`     | leaves an empty line (`SKIP 3` leaves three) |
| `ULINE`    | draws a horizontal line across the list      |
| `NEW-LINE` | starts a new line, like `/`                  |

When the line is full, the output continues on the next one. The default list width is set by the program or by the window size; you can set it with `REPORT zwrite_demo LINE-SIZE 120.`

## Positions and lengths

You can choose the column where an output starts and how many characters it takes. The full form is `WRITE AT /pos(len) value`, and every part is optional:

```abap
WRITE: / 'Airline', 15 'From',      30 'To'.
WRITE: / 'LH',      15 'Frankfurt', 30 'New York'.
WRITE: / 'AZ',      15 'Rome',      30 'Tokyo'.
WRITE AT /15(4) 'Frankfurt'.        " only 4 characters: "Fran"
ULINE AT /1(40).                    " a line 40 characters long
```

- `/` starts a new line;
- `15` is the column where the output starts;
- `(4)` is the **output length**: longer values are cut.

The values in this example are literals, so `AT` is optional. You need `AT` when the position or the length is a variable.

Each type has a default output length. Text is left-aligned, numbers are right-aligned in their field:

```abap
WRITE / 42.         " the number appears right-aligned, after blanks
WRITE / '42'.       " the text appears at the start of the line
```

## Formats and colors

Format options follow the value:

| Option                                                                | What it does                                      |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| `COLOR COL_HEADING`, `COL_TOTAL`, `COL_POSITIVE`, `COL_NEGATIVE`, ... | background color of the output                    |
| `INTENSIFIED OFF`                                                     | lighter color                                     |
| `INVERSE`                                                             | colored text instead of a colored background      |
| `LEFT-JUSTIFIED`, `CENTERED`, `RIGHT-JUSTIFIED`                       | alignment inside the output length                |
| `NO-GAP`                                                              | no blank after this output                        |
| `NO-ZERO`                                                             | leading zeros become blanks                       |
| `USING EDIT MASK`                                                     | applies a pattern, such as `'__:__:__'` for times |

```abap
WRITE / 'Fully booked' COLOR COL_NEGATIVE.
WRITE / 'Seats free'   COLOR COL_POSITIVE INTENSIFIED OFF.
WRITE AT /1(20) 'Total' CENTERED COLOR COL_TOTAL.
WRITE: / 'ABC', 'DEF' NO-GAP, 'GHI'.         " "ABC DEFGHI"
WRITE / '000123' NO-ZERO.                    " "   123"
```

To color several outputs, use `FORMAT` instead of repeating the option. It stays active until you change it or write `FORMAT RESET`:

```abap
FORMAT COLOR COL_HEADING.
WRITE: / 'Airline', 15 'From', 30 'To'.
FORMAT RESET.
```

## Dates, times, and the user

Dates and times are formatted for the user who runs the program, with the date format and separators from the user settings (transaction `SU3`):

```abap
WRITE: / 'Printed by', sy-uname,
       / 'Date:', sy-datum,                        " for example 19.11.2026 or 11/19/2026
       / 'Time:', sy-uzeit USING EDIT MASK '__:__:__'.
```

`sy-uname`, `sy-datum`, and `sy-uzeit` are **system fields**: values the runtime fills for you, here the user name, the date, and the time. They're covered in [System fields](./0023-system-fields.en.md).

> [!WARNING]
> Don't type texts that users read directly into `WRITE` in real programs: they can't be translated. Use text symbols such as `TEXT-001`, explained in [Text symbols and translation](./0062-text-symbols-and-translation.en.md). The examples in this course use literals to stay short.

> [!TIP]
> A classic list is like a typewriter page. You can move the carriage to a column, go to a new line, and switch to a red ribbon, but once a character is on the page you don't move it around.

Classic lists don't exist in ABAP Cloud, and modern reports show tables with ALV, as you'll see in [ALV with CL_SALV_TABLE](./0099-alv-with-salv.en.md). For learning and quick checks, `WRITE` is perfect.

## Exercise

> [!IMPORTANT]
> Write a report `ZFLIGHT_BOARD` that prints this departure board: a colored header, a line under it, three flights in columns starting at 1, 10, and 25, and a footer with your user name and the date.
>
> ```text
> Departures
> ----------------------------------------
> LH 400   Frankfurt      New York
> AZ 788   Rome           Tokyo
> UA 941   Frankfurt      San Francisco
> ```

### Solution

```abap
REPORT zflight_board.

WRITE AT /1(40) 'Departures' COLOR COL_HEADING.
ULINE AT /1(40).
WRITE: / 'LH 400', 10 'Frankfurt', 25 'New York',
       / 'AZ 788', 10 'Rome',      25 'Tokyo',
       / 'UA 941', 10 'Frankfurt', 25 'San Francisco'.
SKIP.
WRITE: / 'Printed by', sy-uname, 'on', sy-datum.
```

> [!NOTE]
>
> - `WRITE` continues the current line; `/` starts a new one; `SKIP` and `ULINE` add space and lines.
> - `WRITE AT /pos(len)` sets the column and the output length; longer values are cut.
> - Text is left-aligned, numbers right-aligned in their output length.
> - `COLOR`, `NO-GAP`, `NO-ZERO`, and `USING EDIT MASK` change the format; `FORMAT` applies a format to several outputs.
> - Dates follow the user settings; classic lists aren't available in ABAP Cloud.
