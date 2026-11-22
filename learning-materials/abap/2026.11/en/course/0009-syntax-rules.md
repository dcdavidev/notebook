---
title: ABAP syntax rules
description: Statements, periods, keywords, chained statements, and naming.
---

_Beginner level_

ABAP has few syntax rules, and you met most of them in [Your first program](./0008-hello-world.md) without noticing. Knowing them precisely saves you a lot of time with the syntax check: most beginner errors are a missing period, a missing space, or a comma where a period should be.

## Statements and periods

An ABAP program is a sequence of **statements**. Every statement:

- starts with a **keyword**, such as `REPORT`, `DATA`, or `WRITE`;
- continues with **operands** and **additions**, separated by at least one space;
- ends with a **period** (`.`).

```abap
REPORT zsyntax_demo.

DATA lv_count TYPE i VALUE 3.
WRITE lv_count.
```

The line layout doesn't matter: a statement can span several lines, and one line can hold several statements. These two versions are the same program:

```abap
DATA lv_city TYPE string VALUE `Rome`. WRITE lv_city.

DATA lv_city2 TYPE string
  VALUE `Rome`.
WRITE
  lv_city2.
```

Keep one statement per line anyway: it's easier to read and to debug. A line can be up to 255 characters long.

## Keywords and case

ABAP is **not case-sensitive**: `WRITE`, `write`, and `Write` are the same keyword, and `lv_count` and `LV_COUNT` are the same variable. The only exception is text inside **literals**: `'Hello'` and `'HELLO'` are different values.

The common convention is keywords in uppercase and names in lowercase, as in this course. The pretty printer can do it for you, as you'll see in [Comments and formatting](./0010-comments-and-formatting.md).

## Spaces matter

Because ABAP splits statements into words at the spaces, many symbols need a space on both sides:

```abap
DATA lv_result TYPE i.

lv_result = ( 2 + 3 ) * 4.     " correct: spaces around operators and parentheses
lv_result = (2 + 3) * 4.       " syntax error: no space after "(" and before ")"
lv_result=2.                   " syntax error: no spaces around "="
```

The same rule applies to the parentheses of method calls: `out->write( 'Hi' )` needs the spaces inside the parentheses.

> [!WARNING]
> The error message for a missing space is often confusing, for example "Field "(2" is unknown". When the syntax check complains about a strange name that contains a parenthesis or an operator, look for a missing space first.

## Chained statements

When several statements start with the same words, you can write those words once, followed by a **colon** (`:`), and separate the rest with **commas**. This is a **chained statement**:

```abap
DATA: lv_first  TYPE i,
      lv_second TYPE i,
      lv_name   TYPE string.

WRITE: 'First line', 'same line'.
```

The system expands the chain into separate statements: `DATA lv_first TYPE i.`, `DATA lv_second TYPE i.`, and so on. Only the last part ends with a period.

> [!TIP]
> A chained statement works like a shopping list headed "Buy:". You write the verb once at the top, then list the items separated by commas, and you put the full stop only after the last one.

A classic mistake is a period in the middle of a chain:

```abap
DATA: lv_first  TYPE i.
      lv_second TYPE i.   " syntax error: this line is no longer part of DATA
```

The period ends the chain, so the second line starts a new statement with the "keyword" `lv_second`, which doesn't exist.

## Names

The names you choose for variables, types, and other objects in a program follow a few rules:

- up to 30 characters;
- letters `A` to `Z`, digits, and the underscore `_`;
- they can't start with a digit;
- they shouldn't be the same as a keyword, even where the syntax allows it.

Names of repository objects (programs, classes, tables) must also use the customer namespace, `Z` or `Y`, as you saw in [Packages and transport requests](./0007-packages-and-transport-requests.md). Their maximum length depends on the type: for example 40 characters for programs, 30 for classes, and 16 for database tables.

Most teams also use **prefixes** that tell what a name is. This course uses these:

| Prefix            | Meaning                           | Example       |
| ----------------- | --------------------------------- | ------------- |
| `lv_`             | local variable                    | `lv_total`    |
| `ls_`             | local structure                   | `ls_flight`   |
| `lt_`             | local internal table              | `lt_flights`  |
| `gv_` `gs_` `gt_` | global variable, structure, table | `gv_counter`  |
| `ty_` / `tt_`     | type / table type                 | `ty_flight`   |
| `lc_`             | local constant                    | `lc_max_rows` |

You'll meet the others (for parameters, objects, and field symbols) in the lessons that introduce them.

## Exercise

> [!IMPORTANT]
> Find and fix the four syntax errors in this program, then activate and run it.
>
> ```abap
> REPORT zsyntax_errors.
>
> DATA: lv_a TYPE i VALUE 5.
>       lv_b TYPE i VALUE 7,
>       lv_sum TYPE i.
>
> lv_sum = (lv_a + lv_b) * 2
> WRITE lv_sum.
> ```

### Solution

```abap
REPORT zsyntax_errors.

DATA: lv_a   TYPE i VALUE 5,    " 1: comma instead of period inside the chain
      lv_b   TYPE i VALUE 7,
      lv_sum TYPE i.

lv_sum = ( lv_a + lv_b ) * 2.   " 2 and 3: spaces inside the parentheses; 4: period at the end
WRITE lv_sum.                   " prints 24
```

> [!NOTE]
>
> - A statement starts with a keyword and ends with a period; line breaks don't matter.
> - ABAP isn't case-sensitive, except inside literals.
> - Operators, `=`, and parentheses need spaces on both sides.
> - A chained statement writes the common part once, then a colon, commas between the parts, and one period at the end.
> - Names have up to 30 characters (letters, digits, `_`); repository objects start with `Z` or `Y`.
