---
title: FOR and REDUCE
description: Build and summarize tables in a single expression.
level: intermediate
---

A lot of ABAP code loops over a table only to build another table, or to compute one number from all the rows. A **table comprehension** does the first job in one expression: `VALUE` or `NEW` with a `FOR` loop inside. A **table reduction** does the second: `REDUCE` runs a `FOR` loop and returns a single value. Both are [constructor expressions](./0091-constructor-expressions.md), so they can go anywhere a value is expected.

## FOR inside VALUE

`FOR row IN itab` walks through a table and produces one new row for each source row:

```abap
REPORT zfor_reduce.

TYPES: BEGIN OF ty_route,
         connid TYPE s_conn_id,
         route  TYPE string,
       END OF ty_route,
       tt_routes TYPE STANDARD TABLE OF ty_route WITH EMPTY KEY.

SELECT * FROM spfli INTO TABLE @DATA(lt_connections).

DATA(lt_routes) = VALUE tt_routes(
  FOR ls_conn IN lt_connections
  ( connid = ls_conn-connid
    route  = |{ ls_conn-cityfrom } -> { ls_conn-cityto }| ) ).
```

It's the expression form of this loop:

```abap
LOOP AT lt_connections INTO DATA(ls_conn).
  APPEND VALUE #( connid = ls_conn-connid
                  route  = |{ ls_conn-cityfrom } -> { ls_conn-cityto }| ) TO lt_routes.
ENDLOOP.
```

The variable after `FOR` (`ls_conn`) is local to the expression. Write `FOR <ls_conn> IN ...` to use a field symbol instead of a copy.

> [!TIP]
> `FOR` is an assembly line. Raw parts (the source rows) come in one by one, each station shapes them the same way, and finished pieces (the new rows) come out at the end, already boxed in a new table.

## Filtering, index, and nested FOR

`FOR` accepts the same additions you know from `LOOP AT`:

```abap
DATA(lt_from_frankfurt) = VALUE tt_routes(
  FOR ls_conn IN lt_connections INDEX INTO lv_idx
      WHERE ( cityfrom = 'FRANKFURT' )
  ( connid = ls_conn-connid
    route  = |{ lv_idx }: { ls_conn-cityto }| ) ).
```

- `WHERE ( ... )` filters the rows; the parentheses are mandatory.
- `INDEX INTO` gives the row number in the source table.
- `FROM` and `TO` limit the index range; `USING KEY` picks a table key.

Several `FOR` in a row are nested loops, for example to combine every carrier with every booking class:

```abap
DATA(lt_classes) = VALUE string_table( ( `Y` ) ( `C` ) ( `F` ) ).
SELECT carrid FROM scarr INTO TABLE @DATA(lt_carriers).

DATA(lt_fares) = VALUE string_table(
  FOR ls_carrier IN lt_carriers
  FOR lv_class IN lt_classes
  ( |{ ls_carrier-carrid }-{ lv_class }| ) ).          " AA-Y, AA-C, AA-F, AC-Y, ...
```

## Conditional FOR loops

Without `IN`, `FOR` is a counting loop, like `DO` or `WHILE`:

```abap
DATA(lt_rows) = VALUE string_table(
  FOR i = 1 UNTIL i > 5
  ( |Row { i }| ) ).                                   " Row 1 ... Row 5

DATA(lt_powers) = VALUE string_table(
  FOR j = 1 THEN j * 2 WHILE j <= 64
  ( |{ j }| ) ).                                       " 1, 2, 4, ... 64
```

`THEN` sets the next value; without it the variable increases by 1. `UNTIL` stops when the condition becomes true, `WHILE` when it becomes false.

## REDUCE

`REDUCE` starts from an initial value, updates it once for each pass of the `FOR` loop, and returns the final value:

```abap
SELECT * FROM sflight INTO TABLE @DATA(lt_flights).

DATA(lv_occupied) = REDUCE i(
  INIT lv_sum = 0
  FOR ls_flight IN lt_flights
  NEXT lv_sum = lv_sum + ls_flight-seatsocc ).
```

- `INIT` declares one or more helper variables and their start values. The **first** one is the result.
- `FOR` is any of the loops above.
- `NEXT` assigns new values to the `INIT` variables at each pass.

With several `INIT` variables you can compute more than one thing, and you can return any type, for example a string:

```abap
DATA(lv_max_price) = REDUCE s_price(
  INIT lv_max = CONV s_price( 0 )
  FOR ls_flight IN lt_flights
  NEXT lv_max = nmax( val1 = lv_max val2 = ls_flight-price ) ).

DATA(lv_list) = REDUCE string(
  INIT lv_text = `` lv_sep = ``
  FOR ls_carrier IN lt_carriers
  NEXT lv_text = lv_text && lv_sep && ls_carrier-carrid
       lv_sep  = `, ` ).                                " AA, AC, AF, ...
```

> [!WARNING]
> An `INIT` variable gets its type from the value you assign, like an inline declaration. `INIT lv_sum = 0` makes `lv_sum` an `i`, even inside `REDUCE s_price( ... )`: each step rounds to a whole number, and only the final result is converted to `s_price`. When you add up amounts with decimals, give the variable the right type with `CONV`, as in `INIT lv_sum = CONV s_price( 0 )`.

## Exercise

> [!IMPORTANT]
>
> 1. Read all rows of `SFLIGHT` for carrier `LH`. With `VALUE` and `FOR`, build a `string_table` with one line per flight: date and free seats.
> 2. With `REDUCE`, compute the total revenue of those flights as the sum of `price * seatsocc`, typed as `s_price`.
> 3. With `REDUCE` and a `WHERE`, count the flights that are completely full.

### Solution

```abap
SELECT * FROM sflight WHERE carrid = 'LH' INTO TABLE @DATA(lt_flights).

DATA(lt_lines) = VALUE string_table(
  FOR ls_flight IN lt_flights
  ( |{ ls_flight-fldate DATE = USER }: { ls_flight-seatsmax - ls_flight-seatsocc } free| ) ).

DATA(lv_revenue) = REDUCE s_price(
  INIT lv_sum = CONV s_price( 0 )
  FOR ls_flight IN lt_flights
  NEXT lv_sum = lv_sum + ls_flight-price * ls_flight-seatsocc ).

DATA(lv_full) = REDUCE i(
  INIT lv_count = 0
  FOR ls_flight IN lt_flights WHERE ( seatsocc >= seatsmax )
  NEXT lv_count = lv_count + 1 ).
```

> [!NOTE]
>
> - `VALUE type( FOR row IN itab ( ... ) )` builds a new table from an existing one in a single expression.
> - `FOR` accepts `WHERE ( ... )`, `INDEX INTO`, `FROM`, `TO`, and `USING KEY`; several `FOR` are nested loops.
> - `FOR i = start [THEN next] UNTIL|WHILE condition` is a counting loop.
> - `REDUCE type( INIT ... FOR ... NEXT ... )` folds all passes into one value; the first `INIT` variable is the result.
> - Give `INIT` variables the right type with `CONV` to avoid rounding. For groups of rows, see [grouping internal tables](./0095-grouping-internal-tables.md).
