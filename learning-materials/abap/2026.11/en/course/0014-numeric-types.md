---
title: Numeric types
description: Integers, packed numbers, decimal floating point, and binary floating point.
level: beginner
---

Seat counts, prices, weights, and exchange rates are all numbers, but they don't all need the same type. ABAP has whole-number types for counters, **packed numbers** for money and quantities, and two kinds of floating-point numbers for values with many digits. Picking the right one decides whether your totals are exact.

## Overview

| Type         | What it holds                            | Range or precision                 | Typical use                    |
| ------------ | ---------------------------------------- | ---------------------------------- | ------------------------------ |
| `i`          | whole numbers, 4 bytes                   | −2,147,483,648 to 2,147,483,647    | counters, indexes, seats       |
| `int8`       | whole numbers, 8 bytes                   | about ±9.2 × 10¹⁸                  | very large counts              |
| `p`          | packed decimal, fixed number of decimals | up to 31 digits, up to 14 decimals | amounts, quantities, prices    |
| `decfloat16` | decimal floating point                   | 16 significant digits              | decimal values of any scale    |
| `decfloat34` | decimal floating point                   | 34 significant digits              | high-precision decimal values  |
| `f`          | binary floating point                    | about 17 significant digits        | scientific or technical values |

All numeric types start with the initial value `0`.

## Integers: i and int8

Type `i` is the everyday integer: use it for counters, loop indexes, and anything you count. `int8` (available since release 7.50) does the same with a much larger range.

```abap
REPORT znumeric_demo.

DATA lv_seats  TYPE i VALUE 280.
DATA lv_booked TYPE i VALUE 265.
DATA lv_free   TYPE i.

lv_free = lv_seats - lv_booked.
WRITE / lv_free.                  " 15
```

When you assign a value with decimals to an integer, it's **rounded**, not cut: `'7.5'` becomes `8`, `'7.4'` becomes `7`.

> [!WARNING]
> A result outside the range of `i` doesn't wrap around: the program stops with a runtime error (an arithmetic overflow). If a number can grow beyond two billion, for example a sum of amounts in cents, use `int8` or `p`.

You'll also meet the Dictionary types `INT1` and `INT2` (1 and 2 bytes) in table fields. They map to the internal types `b` and `s`, which you can't declare directly in a program.

## Packed numbers: p

Type `p` stores decimal numbers exactly, with a fixed number of decimals. You choose:

- `LENGTH`: the size in bytes, from 1 to 16. A packed number of length `n` holds `2n − 1` digits. Default: 8 (15 digits).
- `DECIMALS`: how many of those digits are after the decimal point, from 0 to 14. Default: 0.

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '459.90'.
DATA lv_tax   TYPE p LENGTH 8 DECIMALS 2.

lv_tax = lv_price * '0.22'.
WRITE / lv_tax.                   " 101.18 (101.178 rounded to 2 decimals)
```

Results are rounded commercially to the decimals of the target: `.5` and above rounds up. In the code, literals always use a period as the decimal separator (`'459.90'`); the output follows the user settings. Packed numbers are the standard for money: amount fields in SAP tables, such as `PRICE` in `SFLIGHT`, are of Dictionary type `CURR`, which is a packed number.

> [!CAUTION]
> Every program has the attribute **Fixed point arithmetic**, switched on by default. If someone switches it off, packed numbers are calculated as if they had no decimals, and amounts come out wrong by a factor of 100 or more. Never switch it off.

> [!TIP]
> A packed number is like a cash register: it always shows two decimals, it counts cents exactly, and it rounds to the nearest cent when it has to. A binary float is like a pocket calculator from the 1980s: fast and good with huge numbers, but `0.1 + 0.2` doesn't always show exactly `0.3`.

## Floating point: decfloat and f

**Decimal floating-point** types (`decfloat16`, `decfloat34`) store a fixed number of significant digits, with the decimal point wherever it's needed. They calculate exactly in base 10, like `p`, but you don't have to choose the number of decimals in advance.

**Binary floating point** (`f`) stores numbers in base 2. Many decimal fractions, such as 0.1, can't be represented exactly in base 2, so tiny errors appear:

```abap
DATA lv_float   TYPE f.
DATA lv_decimal TYPE decfloat34.

lv_float = '0.1'.
lv_float = lv_float + '0.2'.
WRITE / lv_float.                 " 3.0000000000000004E-01: not exactly 0.3

lv_decimal = '0.1'.
lv_decimal = lv_decimal + '0.2'.
WRITE / lv_decimal.               " 0.3
```

Use `f` only for technical or scientific values where tiny differences don't matter, and never for money.

## Which one to use

- **Counting** (rows, seats, loops): `i`, or `int8` for huge numbers.
- **Money and quantities**: `p` with the right decimals, or better the Dictionary type of the field, for example `TYPE s_price`.
- **Decimal values with an unknown scale** (rates, results of divisions you want to keep exact): `decfloat34`.
- **Technical calculations**: `f`, knowing its rounding errors.

The arithmetic operators and the rounding functions are in [Arithmetic operations](./0020-arithmetic-operations.md); what happens when you mix types is in [Type conversions](./0019-type-conversions.md).

## Exercise

> [!IMPORTANT]
> A flight has 280 seats, 265 are booked, and a ticket costs 459.90.
>
> 1. Calculate the free seats and the revenue of the booked seats.
> 2. Choose a suitable type for each variable and print the results.

### Solution

```abap
REPORT zflight_revenue.

DATA: lv_seats   TYPE i VALUE 280,
      lv_booked  TYPE i VALUE 265,
      lv_free    TYPE i,
      lv_price   TYPE p LENGTH 8 DECIMALS 2 VALUE '459.90',
      lv_revenue TYPE p LENGTH 10 DECIMALS 2.

lv_free    = lv_seats - lv_booked.
lv_revenue = lv_booked * lv_price.

WRITE: / 'Free seats:', lv_free,         " 15
       / 'Revenue:', lv_revenue.         " 121,873.50
```

Seats are counted, so they're integers; the price and the revenue are money, so they're packed numbers with two decimals. The revenue gets a larger length to leave room for big totals.

> [!NOTE]
>
> - `i` (and `int8`) are whole numbers; decimals are rounded away; an overflow is a runtime error.
> - `p` stores exact decimals with `LENGTH` (bytes, `2n − 1` digits) and `DECIMALS`; it's the type for money.
> - `decfloat16` and `decfloat34` calculate exactly in base 10 with a flexible decimal point.
> - `f` is binary floating point: fast, but with rounding errors; never use it for money.
> - Keep the program attribute **Fixed point arithmetic** switched on.
