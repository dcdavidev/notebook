---
title: DO and WHILE loops
description: Repeat code a fixed number of times or while a condition holds.
---

_Beginner level_

A **loop** runs the same block of code several times. ABAP has two loops that don't depend on a table: `DO` repeats the code a number of times, and `WHILE` repeats it as long as a condition is true. (To go through the rows of a table, you'll use `LOOP AT`, in [Looping over internal tables](./0038-looping-internal-tables.en.md).)

Each run of the block is called a **pass** or iteration.

## DO n TIMES

```abap
REPORT zdo_demo.

DO 5 TIMES.
  WRITE / sy-index.     " 1, 2, 3, 4, 5
ENDDO.
```

- The number after `DO` can be a literal or a variable. If it's 0 or negative, the block doesn't run at all.
- The system field `sy-index` contains the number of the current pass, starting from 1. You met it in [System fields](./0023-system-fields.en.md).

A classic use is a calculation that repeats a fixed number of times, for example compound interest:

```abap
DATA lv_amount TYPE p LENGTH 10 DECIMALS 2 VALUE '1000.00'.
DATA lv_years  TYPE i VALUE 3.

DO lv_years TIMES.
  lv_amount = lv_amount * 105 / 100.        " 5% per year
  WRITE: / 'Year', sy-index, lv_amount.
ENDDO.
```

## DO without TIMES

Without `TIMES`, `DO` repeats **forever**, until a statement inside the block leaves the loop. The usual one is `EXIT`, which you'll see in detail in [EXIT, CONTINUE, and CHECK](./0027-exit-continue-check.en.md):

```abap
DATA lv_seats TYPE i VALUE 0.

DO.
  lv_seats += 30.
  IF lv_seats >= 100.
    EXIT.               " leaves the loop
  ENDIF.
ENDDO.

WRITE / lv_seats.       " 120
```

> [!CAUTION]
> A `DO` without `TIMES` and without a working `EXIT` never ends. In a dialog program, the system cancels it after a while with the runtime error `TIME_OUT`; in a background job it can run much longer and keep a work process busy. Always make sure the exit condition is reached.

## WHILE

`WHILE` checks a condition **before** every pass: if it's true, the block runs; if it's false, the loop ends.

```abap
DATA lv_booked TYPE i VALUE 0.
DATA lv_max    TYPE i VALUE 5.

WHILE lv_booked < lv_max.
  lv_booked += 1.
  WRITE: / 'Booking', lv_booked, 'pass', sy-index.
ENDWHILE.
```

If the condition is false from the start, the block never runs. The condition is a logical expression, as in [IF](./0024-if-and-logical-expressions.en.md), so `AND`, `OR`, and `NOT` work here too. `sy-index` counts the passes in `WHILE` as well.

> [!TIP]
> `DO 5 TIMES` is "do five push-ups". `WHILE` is "keep running while you still have energy": you check how you feel before each lap, and you might not run at all.

## Which one to choose

| You know...                                     | Use           |
| ----------------------------------------------- | ------------- |
| how many times the code must run                | `DO n TIMES`  |
| a condition that must be true to keep going     | `WHILE`       |
| the condition only after doing part of the work | `DO` + `EXIT` |

## Nested loops and sy-index

You can put a loop inside another. `sy-index` always refers to the loop **you're in**, and gets back the outer value when the inner loop ends:

```abap
DO 3 TIMES.
  DATA(lv_row) = sy-index.         " save the outer counter
  DO 2 TIMES.
    WRITE: / 'Row', lv_row, 'seat', sy-index.
  ENDDO.
ENDDO.
```

> [!WARNING]
> Never assign a value to `sy-index`: it doesn't change the number of passes, it just makes the code wrong. If you need a counter of your own, declare a variable. And if you need the outer `sy-index` inside an inner loop, copy it first, as in the example.

Old code sometimes uses `DO ... VARYING` to walk through a series of fields. It's obsolete: recognize it, but don't use it.

## Exercise

> [!IMPORTANT]
>
> 1. With `DO`, print the multiples of 7 from 7 to 70.
> 2. With `WHILE`, find how many years it takes for 1000.00 to become at least 2000.00 with 6% interest per year. Print the number of years and the final amount.

### Solution

```abap
REPORT zloops_exercise.

DO 10 TIMES.
  DATA(lv_multiple) = sy-index * 7.
  WRITE / lv_multiple.
ENDDO.

DATA lv_amount TYPE p LENGTH 10 DECIMALS 2 VALUE '1000.00'.
DATA lv_years  TYPE i.

WHILE lv_amount < 2000.
  lv_amount = lv_amount * 106 / 100.
  lv_years += 1.
ENDWHILE.

WRITE: / 'Years:', lv_years,             " 12
       / 'Amount:', lv_amount.
```

> [!NOTE]
>
> - `DO n TIMES ... ENDDO` repeats a block a fixed number of times; with 0 or less it doesn't run.
> - `DO ... ENDDO` without `TIMES` repeats until `EXIT`: make sure the exit is reached.
> - `WHILE condition ... ENDWHILE` checks the condition before each pass.
> - `sy-index` contains the current pass, starting from 1, and refers to the innermost loop.
> - Don't change `sy-index`; use your own counter variable when you need one.
