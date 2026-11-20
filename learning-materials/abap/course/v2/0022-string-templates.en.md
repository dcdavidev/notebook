---
title: String templates
description: Build text with embedded expressions and formatting options.
---

_Beginner level_

Building a message such as "Flight LH 0400 has 35 free seats" with `&&` or `CONCATENATE` means many small pieces and many quotes. A **string template** lets you write the whole text in one go, with the variables placed right where they belong.

String templates are the standard way to build text in modern ABAP: for messages, file lines, log entries, and output. They also format dates, numbers, and codes for you.

## The syntax

A string template starts and ends with a vertical bar `|`. Inside, everything is literal text, except what you put between curly braces `{ }`: that's an **embedded expression**, and its value is inserted into the text.

```abap
REPORT ztemplates_demo.

DATA lv_carrid TYPE s_carr_id VALUE 'LH'.
DATA lv_connid TYPE s_conn_id VALUE '0400'.
DATA lv_free   TYPE i VALUE 35.

DATA(lv_text) = |Flight { lv_carrid } { lv_connid } has { lv_free } free seats|.
WRITE / lv_text.        " Flight LH 0400 has 35 free seats
```

- The result is always of type `string`.
- Inside the braces you need a blank after `{` and before `}`.
- An embedded expression can be a variable, a calculation, or a function call: `{ lv_max - lv_booked }`, `{ to_upper( lv_city ) }`.
- Numbers are written without leading blanks, and the minus sign comes first: `{ lv_delta }` gives `-5`, not `5-`.

> [!TIP]
> A string template is a form letter: the text is printed in advance, and the braces are the blank spaces where you write the name and the date for each copy.

## Special characters

Some characters have a meaning inside a template. To write them as text, put a backslash before them:

- `\|` for a vertical bar, `\{` and `\}` for braces, `\\` for a backslash;
- `\n` for a line feed and `\t` for a tab.

```abap
DATA(lv_csv)  = |LH\t0400\tFRANKFURT|.     " separated by tabs
DATA(lv_note) = |Use \{ and \} in templates|.
```

You can join templates with `&&` to split a long text over several lines of code:

```abap
DATA(lv_long) = |Flight { lv_carrid } { lv_connid }: | &&
                |{ lv_free } seats left|.
```

## Formatting options

After the expression, inside the braces, you can add **formatting options** in the form `OPTION = value`.

| Option                          | What it does                                 | Example result       |
| ------------------------------- | -------------------------------------------- | -------------------- |
| `WIDTH = n`                     | minimum length of the inserted value         |                      |
| `ALIGN = LEFT / RIGHT / CENTER` | alignment inside the width                   |                      |
| `PAD = 'c'`                     | fill character instead of blanks             | `0035`               |
| `CASE = UPPER / LOWER`          | upper or lower case                          | `FRANKFURT`          |
| `DECIMALS = n`                  | number of decimals                           | `249.90`             |
| `NUMBER = USER`                 | decimal and thousands separators of the user | `1.234,50`           |
| `DATE = USER / ISO`             | date in the user's format, or `YYYY-MM-DD`   | `31.12.2026`         |
| `TIME = USER / ISO`             | time in the user's format, or `hh:mm:ss`     | `14:30:00`           |
| `ALPHA = IN / OUT`              | add or remove leading zeros                  | `0000000400` / `400` |

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '1234.5'.
DATA lv_cust  TYPE c LENGTH 10 VALUE '0000004711'.

WRITE: / |Seats: { lv_free WIDTH = 6 ALIGN = RIGHT PAD = '0' }|,   " Seats: 000035
       / |Price: { lv_price NUMBER = USER }|,                       " e.g. 1.234,50
       / |Date: { sy-datum DATE = ISO }|,                           " e.g. 2026-11-19
       / |Date: { sy-datum DATE = USER }|,                          " e.g. 19.11.2026
       / |Time: { sy-uzeit TIME = ISO }|,                           " e.g. 14:30:00
       / |Customer: { lv_cust ALPHA = OUT }|,                       " Customer: 4711
       / |City: { `Frankfurt` CASE = UPPER }|.                      " City: FRANKFURT
```

Without options, a date is written as it's stored: `{ sy-datum }` gives `20261119`. That's rarely what a user wants to read, so add `DATE = USER` for output.

> [!WARNING]
> `USER` formats depend on the user's settings (transaction `SU3`), so the same program prints `1.234,50` for one user and `1,234.50` for another. Use `ISO` or no option when the text goes into a file or to another system, and `USER` only for text that a person reads.

`ALPHA = IN` and `ALPHA = OUT` are handy for codes such as customer or material numbers, which the database stores with leading zeros: `OUT` removes them for display, `IN` adds them back to the full length of the field.

## Exercise

> [!IMPORTANT]
>
> 1. With `lv_carrid = 'AZ'`, `lv_connid = '0555'`, a flight date of 31 December 2026, and a price of 1299.9, build the text `AZ 0555 on 2026-12-31: 1299.90 EUR` with a single string template.
> 2. Print the same date in your user format.
> 3. Print the flight number without leading zeros, right-aligned in a width of 8.

### Solution

```abap
REPORT ztemplates_exercise.

DATA lv_carrid TYPE s_carr_id VALUE 'AZ'.
DATA lv_connid TYPE s_conn_id VALUE '0555'.
DATA lv_date   TYPE d VALUE '20261231'.
DATA lv_price  TYPE p LENGTH 8 DECIMALS 2 VALUE '1299.9'.

WRITE: / |{ lv_carrid } { lv_connid } on { lv_date DATE = ISO }: { lv_price } EUR|,
       / |{ lv_date DATE = USER }|,
       / |{ lv_connid ALPHA = OUT WIDTH = 8 ALIGN = RIGHT }|.
```

A `p` field with 2 decimals is always written with 2 decimals, so `{ lv_price }` gives `1299.90`.

> [!NOTE]
>
> - A string template is text between `|` bars; `{ expression }` inserts a value, and the result is a `string`.
> - Leave a blank after `{` and before `}`; escape `|`, `{`, `}`, and `\` with a backslash, and use `\n` and `\t` for line feeds and tabs.
> - Formatting options include `WIDTH`, `ALIGN`, `PAD`, `CASE`, `DECIMALS`, `NUMBER`, `DATE`, `TIME`, and `ALPHA`.
> - `USER` formats follow the user's settings: use them for people, and `ISO` for files and interfaces.
> - Prefer string templates to `&&` and `CONCATENATE` when the text contains variables.
