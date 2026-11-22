---
title: Writing fast ABAP
description: The rules that make programs fast on the database and in memory.
---

_Intermediate level_

Most slow ABAP programs are slow for the same few reasons: they read too much data, call the database too often, or search large internal tables row by row. A handful of rules avoid almost all of these problems, and they cost nothing when you write new code.

Measure first with the tools from [performance analysis](./0108-performance-analysis.md); then apply the rule that fits the problem you found.

## The database rules

The database is shared by all users, and every trip to it costs time. These five rules are the classic guidelines for ABAP SQL:

| Rule                             | How                                                                   |
| -------------------------------- | --------------------------------------------------------------------- |
| Keep the result set small        | always a `WHERE` clause; `UP TO n ROWS` when you need only a few rows |
| Transfer only the data you need  | list the columns instead of `SELECT *`; aggregate on the database     |
| Reduce the number of round trips | no `SELECT` in loops; use joins, subqueries, or `FOR ALL ENTRIES`     |
| Keep the search effort small     | filter on key or index fields                                         |
| Reduce the database load         | use the table buffer for small, rarely changed tables                 |

```abap
" Slow: all columns, all rows, totals calculated in ABAP
SELECT * FROM sflight INTO TABLE @DATA(lt_all).
LOOP AT lt_all INTO DATA(ls_all) WHERE carrid = 'LH'.
  lv_seats = lv_seats + ls_all-seatsocc.
ENDLOOP.

" Fast: the database filters and sums, one row comes back
SELECT SUM( seatsocc ) FROM sflight
  WHERE carrid = 'LH'
  INTO @DATA(lv_total).
```

## Fewer round trips

A `SELECT` inside a `LOOP` is the most common performance problem in ABAP: 10,000 rows mean 10,000 database calls. Read everything you need in one statement instead:

- a [join](./0055-joins.md) when the data is in related tables;
- [`FOR ALL ENTRIES`](./0057-for-all-entries.md) or a [join with an internal table](./0098-advanced-abap-sql.md) when the keys come from a table in memory;
- then read the details from an internal table with a key.

The same applies to writes: change many rows with one statement.

```abap
" Slow: one INSERT per row
LOOP AT lt_new_bookings INTO DATA(ls_new).
  INSERT zbooking FROM @ls_new.
ENDLOOP.

" Fast: one array INSERT
INSERT zbooking FROM TABLE @lt_new_bookings.
```

> [!WARNING]
> Before `FOR ALL ENTRIES`, always check that the driver table isn't empty. With an empty table the `WHERE` condition is ignored and the `SELECT` reads the whole database table.

> [!TIP]
> Going to the database is like going to the supermarket. Ten trips for ten items take far longer than one trip with a shopping list, even if the cart is heavier.

## Internal tables

In memory, the cost comes from searching. A `READ TABLE` or a `LOOP ... WHERE` on a **standard table** looks at the rows one by one; on a **sorted** or **hashed** table it jumps to the right rows. The difference is small with 100 rows and huge with 100,000.

| Access                          | Standard table | Sorted table             | Hashed table       |
| ------------------------------- | -------------- | ------------------------ | ------------------ |
| Read by full key                | linear         | binary (fast)            | constant (fastest) |
| `LOOP ... WHERE` on leading key | linear         | binary, then the matches | linear             |
| Read by index                   | constant       | constant                 | not possible       |

The classic trap is the nested loop:

```abap
" Slow: for every flight, a full scan of all bookings
LOOP AT lt_flights INTO DATA(ls_flight).
  LOOP AT lt_bookings INTO DATA(ls_booking)
       WHERE carrid = ls_flight-carrid AND connid = ls_flight-connid.
    " ...
  ENDLOOP.
ENDLOOP.

" Fast: bookings in a sorted table, the inner LOOP finds the rows by binary search
DATA lt_bookings_sorted TYPE SORTED TABLE OF sbook
  WITH NON-UNIQUE KEY carrid connid.
lt_bookings_sorted = lt_bookings.

LOOP AT lt_flights INTO ls_flight.
  LOOP AT lt_bookings_sorted INTO ls_booking
       WHERE carrid = ls_flight-carrid AND connid = ls_flight-connid.
    " ...
  ENDLOOP.
ENDLOOP.
```

More rules for internal tables:

- Choose the [table category](./0034-table-categories.md) by the access you need, and add a [secondary key](./0035-table-keys.md) when a table is read by two different keys.
- On a standard table that you must keep, `SORT` once and use `READ TABLE ... BINARY SEARCH`, instead of searching row by row.
- Loop with `ASSIGNING FIELD-SYMBOL(<ls_row>)` or `REFERENCE INTO` for wide rows and when you change them: `INTO` copies every row.
- Don't build large tables row by row with `INSERT ... INDEX 1` or `DELETE` inside a loop on a standard table: each call moves the rows behind it.

## Don't optimize everything

Readable code matters more than micro-optimizations that save a millisecond. Apply the rules above while you write, then measure. Optimize only where the trace shows that the time goes, and measure again to prove the change helped.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that reads `SFLIGHT` for one airline and, for each flight, counts the bookings in `SBOOK` with a `SELECT COUNT(*)` inside the loop.
> 2. Rewrite it with a single `SELECT` that groups the bookings by flight.
> 3. Compare the two versions with `ST05`.

### Solution

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT FROM sflight AS f
    LEFT OUTER JOIN sbook AS b
      ON  b~carrid = f~carrid
      AND b~connid = f~connid
      AND b~fldate = f~fldate
    FIELDS f~carrid, f~connid, f~fldate, COUNT( b~bookid ) AS bookings
    WHERE f~carrid = @p_carrid
    GROUP BY f~carrid, f~connid, f~fldate
    INTO TABLE @DATA(lt_result).

  cl_demo_output=>display( lt_result ).
```

`COUNT( b~bookid )` counts only the matching bookings, so flights without bookings get 0.

> [!NOTE]
>
> - Read few rows and few columns, and let the database filter and aggregate.
> - Avoid `SELECT` in loops: use joins, `FOR ALL ENTRIES` (never with an empty table), or a join with an internal table.
> - Write with array operations such as `INSERT ... FROM TABLE`.
> - Use sorted and hashed tables or secondary keys for key access; avoid nested loops on standard tables.
> - Measure before and after: optimize where the time really goes.
