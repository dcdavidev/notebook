---
title: Arithmetic operations
description: Operators, DIV and MOD, rounding, and numeric functions.
level: beginner
---

Prices, seat counts, totals, averages, percentages: almost every program calculates something. ABAP has the usual arithmetic operators, two operators for integer division, and a set of built-in functions for rounding and other common operations.

There's one ABAP peculiarity you must know: the type of the **result variable** takes part in the calculation. The same expression can give different results depending on where you store it.

## The operators

| Operator | Meaning                   | Example   | Result |
| -------- | ------------------------- | --------- | ------ |
| `+`      | addition                  | `7 + 2`   | 9      |
| `-`      | subtraction               | `7 - 2`   | 5      |
| `*`      | multiplication            | `7 * 2`   | 14     |
| `/`      | division                  | `7 / 2`   | 3.5    |
| `DIV`    | integer division          | `7 DIV 2` | 3      |
| `MOD`    | remainder of the division | `7 MOD 2` | 1      |
| `**`     | power                     | `2 ** 3`  | 8      |

```abap
REPORT zarith_demo.

DATA lv_seats_max TYPE i VALUE 220.
DATA lv_seats_occ TYPE i VALUE 185.
DATA lv_free      TYPE i.

lv_free = lv_seats_max - lv_seats_occ.
WRITE: / 'Free seats:', lv_free.

lv_free = ( lv_seats_max - lv_seats_occ ) * 2.   " parentheses first
```

Operators and parentheses must be separated by **blanks**: `lv_a+lv_b` and `(lv_a + lv_b)` are syntax errors; write `lv_a + lv_b` and `( lv_a + lv_b )`. As in math, `*` and `/` come before `+` and `-`.

To change a variable based on its own value, use the short forms `+=`, `-=`, `*=`, and `/=` (release 7.54 and later):

```abap
lv_seats_occ += 2.      " same as lv_seats_occ = lv_seats_occ + 2.
lv_seats_max *= 2.
```

> [!WARNING]
> Old code uses the statements `ADD`, `SUBTRACT`, `MULTIPLY`, `DIVIDE`, and `COMPUTE` (for example `ADD 2 TO lv_seats_occ.`). They're obsolete: recognize them, but write operators instead.

## The result type matters

ABAP chooses a **calculation type** by looking at all the variables in the statement, **including the one on the left**. If any of them is a packed number (`p`), the calculation runs with packed numbers; if all are integers, it runs with integers and the result is rounded.

```abap
DATA lv_int TYPE i.
DATA lv_avg TYPE p LENGTH 8 DECIMALS 2.

lv_int = 10 / 4.        " 3: 2.5 rounded to an integer
lv_avg = 10 / 4.        " 2.50: the target is p, so the calculation is in p
lv_avg = 10 / 3.        " 3.33
```

> [!TIP]
> The target variable is like the container you pour your calculation into. A cup marked "whole numbers only" (`i`) forces you to round; a measuring jug with two decimal marks (`p DECIMALS 2`) keeps the cents.

Use `p` with `DECIMALS` for money and other values with a fixed number of decimals. Don't use `f` for amounts: binary floating point can't store values like 0.1 exactly. The program attribute **fixed point arithmetic** must be on (it is by default); without it, decimals in `p` fields are ignored in calculations.

## DIV and MOD

`DIV` gives the integer part of a division, and `MOD` gives the remainder. They're useful for splitting quantities and for checks like "every 10th row":

```abap
DATA lv_passengers TYPE i VALUE 17.
DATA lv_per_row    TYPE i VALUE 6.

DATA(lv_full_rows) = lv_passengers DIV lv_per_row.   " 2
DATA(lv_remaining) = lv_passengers MOD lv_per_row.   " 5

IF lv_passengers MOD 2 = 0.
  WRITE / 'Even number of passengers'.
ENDIF.
```

With negative numbers, `MOD` is never negative: `-17 MOD 6` is 1, and `-17 DIV 6` is -3.

> [!CAUTION]
> Dividing by zero stops the program with a runtime error (`COMPUTE_INT_ZERODIVIDE` for integers, `BCD_ZERODIVIDE` for packed numbers). Check the divisor before you divide. The only exception: `0 / 0` gives 0.

## Numeric functions

ABAP has built-in functions for the most common operations. Functions with one argument take it directly; functions with several take named arguments.

| Function                    | Result                       | Example (`lv_x` is -2.6) |
| --------------------------- | ---------------------------- | ------------------------ |
| `abs( x )`                  | absolute value               | `abs( lv_x )` = 2.6      |
| `sign( x )`                 | -1, 0, or 1                  | `sign( lv_x )` = -1      |
| `ceil( x )`                 | smallest integer not below x | `ceil( lv_x )` = -2      |
| `floor( x )`                | largest integer not above x  | `floor( lv_x )` = -3     |
| `trunc( x )`                | integer part                 | `trunc( lv_x )` = -2     |
| `frac( x )`                 | decimal part                 | `frac( lv_x )` = -0.6    |
| `round( val = x dec = n )`  | x rounded to n decimals      | see below                |
| `ipow( base = b exp = e )`  | b to the power of e          | see below                |
| `nmax( val1 = a val2 = b )` | the larger value             | see below                |
| `nmin( val1 = a val2 = b )` | the smaller value            | see below                |
| `sqrt( x )`                 | square root                  | `sqrt( 16 )` = 4         |

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 3 VALUE '199.955'.
DATA lv_round TYPE p LENGTH 8 DECIMALS 2.

lv_round = round( val = lv_price dec = 2 ).              " 199.96
lv_int   = ipow( base = 2 exp = 10 ).                    " 1024
lv_int   = nmax( val1 = lv_seats_occ val2 = 200 ).       " the larger one
```

`round` rounds halves away from zero by default. For other rules, pass `mode`, for example `round( val = lv_price dec = 2 mode = cl_abap_math=>round_half_even )`.

## Exercise

> [!IMPORTANT]
>
> A flight has 220 seats and 190 bookings; a ticket costs 249.90.
>
> 1. Calculate the free seats and the revenue (bookings times price) in a `p` field with 2 decimals.
> 2. Calculate the occupancy percentage, rounded to 1 decimal.
> 3. The passengers board in groups of 30: calculate how many full groups there are and how many passengers are left.

### Solution

```abap
REPORT zflight_calc.

DATA lv_seats    TYPE i VALUE 220.
DATA lv_booked   TYPE i VALUE 190.
DATA lv_price    TYPE p LENGTH 8 DECIMALS 2 VALUE '249.90'.
DATA lv_revenue  TYPE p LENGTH 10 DECIMALS 2.
DATA lv_exact    TYPE p LENGTH 8 DECIMALS 4.
DATA lv_percent  TYPE p LENGTH 5 DECIMALS 1.

DATA(lv_free) = lv_seats - lv_booked.                  " 30
lv_revenue = lv_booked * lv_price.                     " 47481.00
lv_exact   = lv_booked * 100 / lv_seats.               " 86.3636
lv_percent = round( val = lv_exact dec = 1 ).          " 86.4
DATA(lv_groups) = lv_booked DIV 30.                    " 6
DATA(lv_left)   = lv_booked MOD 30.                    " 10

WRITE: / lv_free, / lv_revenue, / lv_percent, / lv_groups, / lv_left.
```

> [!NOTE]
>
> - The operators are `+`, `-`, `*`, `/`, `**`, `DIV`, and `MOD`; separate them with blanks. Use `+=` and the other short forms instead of the obsolete `ADD` and friends.
> - The result variable takes part in the calculation: with an `i` target the result is rounded to an integer.
> - Use `p` with `DECIMALS` for money, never `f`.
> - Dividing by zero causes a runtime error, except `0 / 0`.
> - `round`, `ceil`, `floor`, `trunc`, `abs`, `ipow`, `nmax`, and `nmin` cover the common numeric needs.
