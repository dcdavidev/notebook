---
title: Boolean values
description: abap_bool, abap_true, abap_false, and xsdbool.
level: beginner
---

Many values in a program are simply yes or no: is the flight full, is the customer blocked, has the user ticked the checkbox? Unlike most languages, ABAP has no real Boolean type. It uses a one-character field with `'X'` for true and a blank for false, and it gives you names for these values so the code stays readable.

## abap_bool, abap_true, and abap_false

The type and the constants come from the type group `ABAP`, which every program can use without declaring it:

| Name             | Definition        | Meaning                        |
| ---------------- | ----------------- | ------------------------------ |
| `abap_bool`      | `TYPE c LENGTH 1` | the type for a truth value     |
| `abap_true`      | `VALUE 'X'`       | true                           |
| `abap_false`     | `VALUE ' '`       | false (the initial value)      |
| `abap_undefined` | `VALUE '-'`       | unknown, for three-state logic |

```abap
REPORT zboolean_demo.

DATA lv_is_full TYPE abap_bool.            " starts as abap_false
DATA lv_is_late TYPE abap_bool VALUE abap_true.

lv_is_full = abap_true.
WRITE: / 'Full:', lv_is_full,              " X
       / 'Late:', lv_is_late.              " X
```

Because `abap_false` is a blank, it's also the initial value: a new `abap_bool` variable is false until you set it.

> [!TIP]
> An `abap_bool` is a checkbox on a paper form. A cross in the box means yes, an empty box means no. Nobody writes "yes" or "Y" in the box: the cross is the agreed sign, and `abap_true` is ABAP's name for it.

Write `abap_true` and `abap_false`, not the literals `'X'` and `' '`. The meaning is the same, but the names say what you mean and survive a search through the code.

## Checking a flag

You test a flag by comparing it with `abap_true` or `abap_false`. The `IF` statement is covered in [IF and logical expressions](./0024-if-and-logical-expressions.md); for now, read it as "if this condition holds, run the lines up to `ENDIF`":

```abap
IF lv_is_full = abap_true.
  WRITE / 'No seats left.'.
ENDIF.

IF lv_is_late = abap_false.
  WRITE / 'On time.'.
ENDIF.
```

You'll also see `IF lv_is_full IS NOT INITIAL` and `IF lv_is_full IS INITIAL` in existing code. They work, because false is the initial value, but the comparison with `abap_true` is clearer.

> [!WARNING]
> A flag is only safe if it holds `'X'` or a blank. If a value such as `'Y'` or `'1'` ends up in an `abap_bool` field, `= abap_true` is false and `IS NOT INITIAL` is true: the two checks disagree. Only assign `abap_true` and `abap_false`, or the result of `xsdbool( )`.

## `xsdbool`: a condition as a value

Often you want to store the result of a condition. Since release 7.40, the built-in function `xsdbool( )` turns a **logical expression** into an `abap_bool` value:

```abap
DATA lv_seats_max TYPE i VALUE 280.
DATA lv_seats_occ TYPE i VALUE 280.
DATA lv_is_full   TYPE abap_bool.

lv_is_full = xsdbool( lv_seats_occ >= lv_seats_max ).   " abap_true
WRITE / lv_is_full.
```

Without `xsdbool( )` you'd need an `IF` with two assignments for the same result.

Old code sometimes uses `boolc( )` for the same purpose. Avoid it: `boolc( )` returns a `string`, not an `abap_bool`, and a `string` with one blank isn't equal to `abap_false`. So `boolc( 1 = 2 ) = abap_false` is false, which is rarely what you want. `xsdbool( )` returns the right type and has none of these surprises.

## Booleans in the Dictionary

Database tables and structures can't use `abap_bool` directly; they use Dictionary data elements with the same values. You'll meet these often:

| Data element   | Where you see it                                   |
| -------------- | -------------------------------------------------- |
| `ABAP_BOOLEAN` | modern tables, CDS views, and RAP business objects |
| `BOOLE_D`      | older tables and function module interfaces        |
| `XFELD`        | checkboxes and flags in classic applications       |

All of them hold `'X'` or a blank, so you can compare them with `abap_true` and `abap_false`. Checkboxes on a selection screen work the same way, as you'll see in [Selection screens: PARAMETERS](./0063-parameters.md).

## Exercise

> [!IMPORTANT]
> A flight has 280 seats and 265 are booked.
>
> 1. Declare a flag `lv_has_seats` and set it with `xsdbool( )`: true when there are free seats.
> 2. Declare a flag `lv_is_full` that is the opposite, also with `xsdbool( )`.
> 3. Print both flags.

### Solution

```abap
REPORT zflight_flags.

DATA: lv_seats     TYPE i VALUE 280,
      lv_booked    TYPE i VALUE 265,
      lv_has_seats TYPE abap_bool,
      lv_is_full   TYPE abap_bool.

lv_has_seats = xsdbool( lv_booked < lv_seats ).      " abap_true
lv_is_full   = xsdbool( lv_has_seats = abap_false ). " abap_false

WRITE: / 'Seats free:', lv_has_seats,                " X
       / 'Full:', lv_is_full.                        " blank
```

> [!NOTE]
>
> - ABAP has no real Boolean type: `abap_bool` is `c LENGTH 1`, with `abap_true` (`'X'`) and `abap_false` (blank).
> - A new `abap_bool` variable is false, because a blank is the initial value.
> - Use the constants, not the literals `'X'` and `' '`, and compare with `= abap_true`.
> - `xsdbool( condition )` turns a condition into an `abap_bool`; avoid `boolc( )`, which returns a string.
> - In the Dictionary, flags use data elements such as `ABAP_BOOLEAN`, `BOOLE_D`, and `XFELD`.
