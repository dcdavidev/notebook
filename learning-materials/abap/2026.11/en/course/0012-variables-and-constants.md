---
title: Variables and constants
description: Declare data objects with DATA and CONSTANTS, and use literals.
level: beginner
---

Programs work with values: a number of seats, an airline code, a price. In ABAP, every value lives in a **data object**: a named piece of memory with a fixed type. A **variable** is a data object whose value can change while the program runs; a **constant** is one whose value is fixed. A **literal** is a value written directly in the code, such as `'LH'` or `42`.

This lesson shows how to declare variables with `DATA`, constants with `CONSTANTS`, and how to write literals.

## Declaring variables with DATA

`DATA` declares a variable. You give it a name and a type:

```abap
REPORT zvariables_demo.

DATA lv_seats   TYPE i.                     " integer, starts at 0
DATA lv_carrier TYPE c LENGTH 3.            " text of 3 characters, starts blank
DATA lv_city    TYPE string VALUE `Rome`.   " text of any length, with a start value

lv_seats = 150.
lv_carrier = 'LH'.

WRITE: / lv_carrier, lv_seats, lv_city.
```

- `TYPE` sets the type: what kind of values the variable holds and how much memory it uses. The types `i`, `c`, and `string` are covered in [Character types](./0013-character-types.md) and [Numeric types](./0014-numeric-types.md).
- `VALUE` sets the **start value**. Without it, the variable starts with the **initial value** of its type: `0` for numbers, blanks for `c`, an empty string for `string`.
- `=` assigns a new value. The value on the right is copied into the variable on the left.

Several declarations are usually written as one chained statement, with the names and types aligned:

```abap
DATA: lv_carrier TYPE c LENGTH 3,
      lv_connid  TYPE n LENGTH 4,
      lv_seats   TYPE i.
```

A variable declared with `DATA` exists until the end of its context: for a report, the whole program run. You can't use a variable before the line that declares it.

> [!TIP]
> A variable is a labeled box. The label is the name, the size and shape of the box are the type, and what you put inside is the value. You can take the contents out and put new ones in, but you can't change the shape of the box once it's made.

## Resetting with CLEAR

`CLEAR` sets a variable back to the initial value of its type, not to its `VALUE`:

```abap
DATA lv_seats TYPE i VALUE 150.

CLEAR lv_seats.
WRITE lv_seats.       " 0, not 150
```

To check whether a variable holds its initial value, ABAP has the predicate `IS INITIAL`, shown in [IF and logical expressions](./0024-if-and-logical-expressions.md).

## Constants

`CONSTANTS` declares a data object whose value can never change. The `VALUE` addition is mandatory:

```abap
CONSTANTS: lc_max_seats TYPE i VALUE 300,
           lc_home_hub  TYPE c LENGTH 3 VALUE 'FRA',
           lc_vat_rate  TYPE p LENGTH 3 DECIMALS 2 VALUE '0.22'.

WRITE: / 'Hub:', lc_home_hub, 'max seats:', lc_max_seats.
```

If you try to assign a value to a constant, the syntax check reports an error.

Use constants instead of **magic numbers**: values that appear in the code with no explanation. `IF lv_seats > lc_max_seats` says what it means; `IF lv_seats > 300` doesn't, and when the limit changes you have to find every `300` in the program.

> [!WARNING]
> Constants aren't settings. If a value changes from company to company or over time (a tax rate, a limit set by the business), it belongs in a customizing table, not in the code. Constants are for values that are fixed by the logic, such as a status code or a technical limit.

## Literals

A **literal** is a value written directly in the source code. It has no name, and the system derives its type from how you write it:

| Literal             | Example      | Type                                  |
| ------------------- | ------------ | ------------------------------------- |
| numeric literal     | `42`, `-7`   | `i` (or `p` if the number is too big) |
| text field literal  | `'LH'`       | `c`, as long as the text              |
| text string literal | `` `Rome` `` | `string`                              |

Rules to remember:

- **Numeric literals are whole numbers only.** There's no `3.14` in ABAP code. For a number with decimals, write a text field literal: `VALUE '19.99'`. The system converts it to the target type.
- To put a quote inside a literal, double it: `'It''s late'` prints `It's late`. In a string literal, double the backquote in the same way.
- **Trailing blanks**: a text field literal ignores trailing blanks in most operations; a string literal keeps them. The difference is shown in [Character types](./0013-character-types.md).

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '19.99'.   " decimals: use quotes
DATA lv_text  TYPE string.

lv_text = 'It''s late'.
WRITE: / lv_price, / lv_text.
```

Since release 7.40 you can also declare a variable right where you fill it, with `DATA(...)`. That's the topic of [Inline declarations](./0018-inline-declarations.md). Your own named types with `TYPES` are in [Defining types with TYPES and LIKE](./0017-types-and-like.md).

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that declares a variable for an airline code, a flight number, and the number of free seats, with start values `'AZ'`, `'0555'`, and `12`.
> 2. Declare a constant for the plane capacity, `280`, and print the airline, the flight, the free seats, and the capacity on one line.
> 3. Clear the free seats and print them again.

### Solution

```abap
REPORT zflight_seats.

CONSTANTS lc_capacity TYPE i VALUE 280.

DATA: lv_carrier    TYPE c LENGTH 3 VALUE 'AZ',
      lv_connid     TYPE n LENGTH 4 VALUE '0555',
      lv_free_seats TYPE i VALUE 12.

WRITE: / lv_carrier, lv_connid, lv_free_seats, lc_capacity.

CLEAR lv_free_seats.
WRITE: / 'Free seats after CLEAR:', lv_free_seats.    " 0
```

> [!NOTE]
>
> - A data object is a named piece of memory with a fixed type; variables change, constants don't.
> - `DATA name TYPE type [VALUE start].` declares a variable; without `VALUE` it starts with the initial value of its type.
> - `CONSTANTS` needs `VALUE`; use constants instead of magic numbers.
> - `CLEAR` resets a variable to the initial value of its type.
> - Numeric literals are whole numbers; write decimals as `'19.99'`, text as `'...'` (type `c`) or `` `...` `` (type `string`).
