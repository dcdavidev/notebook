---
title: IF and logical expressions
description: Comparisons, AND, OR, NOT, and predicates such as IS INITIAL.
---

_Beginner level_

A program that always does the same thing isn't very useful. With `IF`, your code takes decisions: print a warning when a flight is full, apply a discount above a certain amount, stop when a value is missing.

The condition after `IF` is a **logical expression**: something that is either true or false. This lesson shows how to build one, from a simple comparison to combinations with `AND`, `OR`, and `NOT`.

## IF, ELSEIF, ELSE

```abap
REPORT zif_demo.

DATA lv_seats_free TYPE i VALUE 3.

IF lv_seats_free = 0.
  WRITE / 'Flight full'.
ELSEIF lv_seats_free < 10.
  WRITE / 'Only a few seats left'.
ELSE.
  WRITE / 'Seats available'.
ENDIF.
```

- ABAP checks the conditions from top to bottom and runs **only the first branch** whose condition is true.
- `ELSEIF` and `ELSE` are optional; you can have as many `ELSEIF` branches as you need.
- Every `IF` ends with `ENDIF`, and every line ends with a period.

> [!TIP]
> An `IF` with `ELSEIF` is like a bouncer with a list of rules: "if you're on the guest list, come in; otherwise, if you have a ticket, come in; otherwise, go home." He stops at the first rule that fits you.

## Comparison operators

| Operator | Alternative | Meaning               |
| -------- | ----------- | --------------------- |
| `=`      | `EQ`        | equal                 |
| `<>`     | `NE`        | not equal             |
| `<`      | `LT`        | less than             |
| `>`      | `GT`        | greater than          |
| `<=`     | `LE`        | less than or equal    |
| `>=`     | `GE`        | greater than or equal |

Prefer the symbols; the letter forms are common in old code. Two more forms are handy:

```abap
IF lv_price BETWEEN 100 AND 500.            " 100 <= lv_price <= 500
  WRITE / 'Mid-range fare'.
ENDIF.

IF lv_carrid IS INITIAL.                    " empty: '', 0, 00000000, ...
  WRITE / 'Airline missing'.
ENDIF.
```

`IS INITIAL` is true when a variable contains the **initial value** of its type: blanks for `c`, an empty string, `0` for numbers, `00000000` for dates. Its opposite is `IS NOT INITIAL`.

> [!WARNING]
> ABAP has no shortcut like `IF lv_flag.` for booleans. Always compare explicitly: `IF lv_flag = abap_true.` See [Boolean values](./0016-boolean-values.en.md).

## AND, OR, NOT

Combine conditions with `AND` (both must be true), `OR` (at least one), and `NOT` (the opposite):

```abap
DATA lv_carrid TYPE s_carr_id VALUE 'LH'.
DATA lv_price  TYPE p LENGTH 8 DECIMALS 2 VALUE '650'.

IF lv_carrid = 'LH' AND lv_price > 500.
  WRITE / 'Expensive Lufthansa flight'.
ENDIF.

IF lv_carrid = 'LH' OR lv_carrid = 'AZ'.
  WRITE / 'European airline'.
ENDIF.

IF NOT lv_price > 1000.                     " same as lv_price <= 1000
  WRITE / 'Within budget'.
ENDIF.
```

`NOT` is evaluated first, then `AND`, then `OR`. So `a OR b AND c` means `a OR ( b AND c )`. When you mix `AND` and `OR`, always add parentheses, with blanks around them:

```abap
IF ( lv_carrid = 'LH' OR lv_carrid = 'AZ' ) AND lv_price < 300.
  WRITE / 'Cheap European flight'.
ENDIF.
```

## Comparing text

Text comparisons follow some rules you should know:

- Comparing two `c` fields of different lengths, ABAP pads the shorter one with blanks: `'LH'` equals `'LH   '`.
- `=` is **case-sensitive**: `'lh'` isn't equal to `'LH'`. Convert with `to_upper( )` if needed.

For patterns and character sets, ABAP has special operators:

| Operator | True when                                                              | Example                    |
| -------- | ---------------------------------------------------------------------- | -------------------------- |
| `CO`     | the text contains **only** characters of a set                         | `lv_input CO '0123456789'` |
| `CA`     | the text contains **any** character of a set                           | `lv_name CA '0123456789'`  |
| `CS`     | the text contains a substring (any case)                               | `lv_city CS 'york'`        |
| `CP`     | the text matches a pattern (`*` any text, `+` one character; any case) | `lv_city CP 'NEW*'`        |

Their negations are `CN`, `NA`, `NS`, and `NP`. `CO` is the classic check before converting text to a number, as you saw in [Type conversions](./0019-type-conversions.en.md):

```abap
DATA lv_input TYPE c LENGTH 4 VALUE '0400'.

IF lv_input CO '0123456789'.
  WRITE / 'Only digits: safe to convert'.
ENDIF.
```

> [!WARNING]
> `CO` checks the full length of a `c` field, **trailing blanks included**. With `lv_input` of length 6 and value `'0400'`, `CO '0123456789'` is false because of the two blanks. Compare a value without trailing blanks instead, for example `condense( lv_input ) CO '0123456789'`.

For complex patterns, use the regular expressions in [FIND, REPLACE, and regular expressions](./0096-regular-expressions.en.md).

## Exercise

> [!IMPORTANT]
>
> Write a report with `lv_carrid`, `lv_price`, and `lv_seats_free`, and print:
>
> 1. `Sold out` if there are no free seats, `Last seats` if there are fewer than 5, otherwise `Available`.
> 2. `Special offer` if the airline is `AZ` or `LH` and the price is below 200.
> 3. `Invalid airline` if `lv_carrid` is empty or contains a digit.

### Solution

```abap
REPORT zif_exercise.

DATA lv_carrid     TYPE s_carr_id VALUE 'AZ'.
DATA lv_price      TYPE p LENGTH 8 DECIMALS 2 VALUE '180'.
DATA lv_seats_free TYPE i VALUE 4.

IF lv_seats_free = 0.
  WRITE / 'Sold out'.
ELSEIF lv_seats_free < 5.
  WRITE / 'Last seats'.
ELSE.
  WRITE / 'Available'.
ENDIF.

IF ( lv_carrid = 'AZ' OR lv_carrid = 'LH' ) AND lv_price < 200.
  WRITE / 'Special offer'.
ENDIF.

IF lv_carrid IS INITIAL OR lv_carrid CA '0123456789'.
  WRITE / 'Invalid airline'.
ENDIF.
```

> [!NOTE]
>
> - `IF ... ELSEIF ... ELSE ... ENDIF` runs only the first branch whose condition is true.
> - Compare with `=`, `<>`, `<`, `>`, `<=`, `>=`, `BETWEEN`, and check empty values with `IS INITIAL`.
> - `NOT` comes before `AND`, and `AND` before `OR`: use parentheses when you mix them.
> - `=` on text is case-sensitive; `CS` and `CP` aren't.
> - `CO`, `CA`, `CS`, `CP` and their negations check character sets and patterns; `CO` counts trailing blanks.
