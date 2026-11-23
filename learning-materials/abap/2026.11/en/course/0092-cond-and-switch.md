---
title: COND and SWITCH
description: Conditional expressions that return a value.
level: intermediate
---

[`IF`](./0024-if-and-logical-expressions.md) and [`CASE`](./0025-case.md) are statements: they choose which code runs. Very often that code does only one thing, assigning a value to a variable. `COND` and `SWITCH` are **conditional expressions**: they choose a value and return it, so you can write the choice right where the value is needed, in an assignment, a method argument, or a string template.

## COND

`COND` checks logical expressions in order and returns the value after the first `THEN` whose condition is true:

```abap
REPORT zcond_switch.

DATA lv_free TYPE i VALUE 3.

DATA(lv_status) = COND string(
  WHEN lv_free = 0  THEN `Full`
  WHEN lv_free <= 5 THEN `Almost full`
  ELSE                   `Available` ).

WRITE / lv_status.                              " Almost full
```

It's the same as this `IF` block, but in one expression and without repeating the target:

```abap
IF lv_free = 0.
  lv_status = `Full`.
ELSEIF lv_free <= 5.
  lv_status = `Almost full`.
ELSE.
  lv_status = `Available`.
ENDIF.
```

After `WHEN` you can write any logical expression: `AND`, `OR`, `NOT`, `IS INITIAL`, `line_exists( )`, and so on. If no condition is true and there's no `ELSE`, `COND` returns the initial value of the type.

> [!TIP]
> `COND` is like the sorting machine in a post office. Each letter goes through a series of checks: too heavy? to abroad? registered? It drops into the bin of the first check it matches, and anything that matches nothing goes into the general bin, the `ELSE`.

## SWITCH

`SWITCH` compares **one** operand with a list of values, like `CASE`, and returns the value of the matching `WHEN`:

```abap
DATA lv_class TYPE s_class VALUE 'C'.

DATA(lv_class_text) = SWITCH string( lv_class
  WHEN 'Y' THEN `Economy`
  WHEN 'C' THEN `Business`
  WHEN 'F' THEN `First`
  ELSE          `Unknown` ).
```

Use `SWITCH` when every branch compares the same variable with `=`; use `COND` for anything else, such as ranges, several variables, or predicates. A `WHEN` in `SWITCH` takes a single value: there's no `OR` as in `CASE`, so repeat the `THEN` value on two `WHEN` lines if you need it.

## The result type

The type before the parentheses is the type of the result. With `#`, ABAP takes it from the operand position:

```abap
DATA lv_label TYPE string.
lv_label = COND #( WHEN lv_free = 0 THEN `Full` ELSE `Open` ).   " string, from lv_label
```

When there's nothing to infer from, as with an inline declaration, ABAP uses the type of the operand after the **first** `THEN`.

> [!WARNING]
> With `#` or an inline declaration, the first `THEN` decides the type, and text literals in single quotes have type `c` with their exact length. In `DATA(lv_text) = COND #( WHEN lv_free = 0 THEN 'Full' ELSE 'Available' )` the result has type `c LENGTH 4`, so `Available` is cut to `Avai`. Name the type explicitly (`COND string( ... )`) or use string literals with backquotes.

## Using them inside other expressions

The real benefit of `COND` and `SWITCH` is that you can use them in any operand position:

```abap
SELECT * FROM sflight INTO TABLE @DATA(lt_flights) UP TO 10 ROWS.

LOOP AT lt_flights INTO DATA(ls_flight).
  DATA(lv_seats) = COND string(
    WHEN ls_flight-seatsocc >= ls_flight-seatsmax THEN `full`
    ELSE |{ ls_flight-seatsmax - ls_flight-seatsocc } free| ).
  WRITE / |{ ls_flight-connid }: { lv_seats }, { COND string( WHEN ls_flight-seatsocc = 0 THEN `empty` ELSE `booked` ) }|.
ENDLOOP.
```

Like the other [constructor expressions](./0091-constructor-expressions.md), both accept `LET` before the first `WHEN`, to compute a helper value once:

```abap
DATA(lv_load) = COND string(
  LET lv_pct = ls_flight-seatsocc * 100 / nmax( val1 = ls_flight-seatsmax val2 = 1 ) IN
  WHEN lv_pct >= 90 THEN `High`
  WHEN lv_pct >= 50 THEN `Medium`
  ELSE                   `Low` ).
```

## THROW: raising an exception from a branch

Instead of a value, a branch can raise an [exception](./0089-class-based-exceptions.md) with `THROW`:

```abap
DATA(lv_name) = SWITCH string( lv_class
  WHEN 'Y' THEN `Economy`
  WHEN 'C' THEN `Business`
  WHEN 'F' THEN `First`
  ELSE THROW cx_sy_itab_line_not_found( ) ).
```

`THROW` works like `RAISE EXCEPTION NEW`; you can pass constructor parameters inside the parentheses, for example the text ID and the attributes of your own [exception class](./0090-custom-exception-classes.md).

## Exercise

> [!IMPORTANT]
>
> 1. Read up to 20 rows from `SFLIGHT`. For each, print the carrier, the connection, and a price band computed with `COND`: `Cheap` below 300, `Normal` up to 800, `Expensive` above.
> 2. Print also the weekday of `fldate` with `SWITCH`. Compute `lv_weekday = ls_flight-fldate MOD 7` into a variable of type `i` first: `0` is a Saturday, `1` a Sunday, `2` a Monday, and so on.

### Solution

```abap
SELECT * FROM sflight INTO TABLE @DATA(lt_flights) UP TO 20 ROWS.

DATA lv_weekday TYPE i.

LOOP AT lt_flights INTO DATA(ls_flight).
  lv_weekday = ls_flight-fldate MOD 7.
  DATA(lv_band) = COND string(
    WHEN ls_flight-price < 300  THEN `Cheap`
    WHEN ls_flight-price <= 800 THEN `Normal`
    ELSE                             `Expensive` ).

  DATA(lv_day) = SWITCH string( lv_weekday
    WHEN 0 THEN `Sat` WHEN 1 THEN `Sun` WHEN 2 THEN `Mon`
    WHEN 3 THEN `Tue` WHEN 4 THEN `Wed` WHEN 5 THEN `Thu`
    ELSE `Fri` ).

  WRITE: / ls_flight-carrid, ls_flight-connid, lv_band, lv_day.
ENDLOOP.
```

In production code, prefer the function module `DATE_COMPUTE_DAY` to the `MOD 7` trick.

> [!NOTE]
>
> - `COND type( WHEN condition THEN value ... ELSE value )` returns the value of the first true condition.
> - `SWITCH type( operand WHEN value THEN result ... ELSE result )` compares one operand with fixed values.
> - Without `ELSE` and with no match, the result is the initial value.
> - With `#` or inline declarations, the first `THEN` sets the type: name the type or use backquote literals to avoid truncation.
> - Both accept `LET`, and a branch can raise an exception with `THROW`.
