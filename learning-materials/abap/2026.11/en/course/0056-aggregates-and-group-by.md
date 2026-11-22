---
title: Aggregates, GROUP BY, and HAVING
description: COUNT, SUM, AVG, MIN, MAX, and grouped results.
---

_Basic level_

How many flights does Lufthansa have? How many seats are occupied on each connection? You could read every flight and add up the numbers in a loop, but the database can do it for you and send back only the totals.

**Aggregate functions** compute one value from many rows. With `GROUP BY` you get one result row per group, for example per airline, and with `HAVING` you keep only the groups that meet a condition.

## Aggregate functions

ABAP SQL has five aggregate functions:

| Function                   | Result                                     |
| -------------------------- | ------------------------------------------ |
| `COUNT(*)`                 | the number of rows                         |
| `COUNT( DISTINCT col )`    | the number of different values in a column |
| `SUM( col )`               | the sum of a numeric column                |
| `AVG( col )`               | the average of a numeric column            |
| `MIN( col )`, `MAX( col )` | the smallest and the largest value         |

When the select list contains only aggregates, the result is a single row, so you can read it into a structure or a variable without `SINGLE`:

```abap
REPORT zaggregate_demo.

SELECT COUNT(*) AS flights,
       SUM( seatsocc ) AS occupied,
       MAX( price ) AS max_price
  FROM sflight
  WHERE carrid = 'LH'
  INTO @DATA(ls_totals).

WRITE: / 'Flights:', ls_totals-flights,
       / 'Occupied seats:', ls_totals-occupied,
       / 'Highest price:', ls_totals-max_price.
```

Give every aggregate an alias with `AS`: it becomes the component name of the inline structure.

`AVG` returns a floating point number (type `f`). Assign it to a packed number before you print it, or the list shows it in scientific notation.

> [!WARNING]
> `SUM( price )` over flights of different airlines adds euros, dollars, and yen together. Group by the currency, or filter on one currency, before you sum amounts.

## GROUP BY

`GROUP BY` splits the rows into groups with the same values in the listed columns, and computes the aggregates for each group:

```abap
SELECT carrid, connid,
       COUNT(*) AS flights,
       SUM( seatsocc ) AS occupied
  FROM sflight
  GROUP BY carrid, connid
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_per_connection).

LOOP AT lt_per_connection INTO DATA(ls_conn).
  WRITE: / ls_conn-carrid, ls_conn-connid, ls_conn-flights, ls_conn-occupied.
ENDLOOP.
```

The rule: every column in the select list that isn't inside an aggregate must appear in `GROUP BY`. Here `carrid` and `connid` are in both. If you added `fldate` to the select list without grouping by it, the syntax check would reject the query, because a group has many dates.

> [!TIP]
> `GROUP BY` is like sorting a pile of receipts into envelopes, one envelope per shop. Then you write on each envelope how many receipts it holds and their total. The envelopes are the groups; the numbers on them are the aggregates.

## HAVING

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** grouping, so it can use aggregates:

```abap
SELECT carrid,
       COUNT(*) AS flights,
       SUM( seatsocc ) AS occupied
  FROM sflight
  WHERE fldate >= '20250101'                  " rows: only flights from 2025
  GROUP BY carrid
  HAVING SUM( seatsocc ) > 1000               " groups: only busy airlines
  ORDER BY occupied DESCENDING
  INTO TABLE @DATA(lt_busy).
```

Read it in this order: the database takes the rows that pass the `WHERE`, groups them by airline, computes the totals, drops the groups that fail the `HAVING`, and sorts what's left. `ORDER BY` can use the alias `occupied`.

| Clause   | Filters | Can use aggregates |
| -------- | ------- | ------------------ |
| `WHERE`  | rows    | no                 |
| `HAVING` | groups  | yes                |

## Aggregates with joins

Aggregates work on joins too. This query counts the bookings per customer, with the customer's name:

```abap
SELECT s~id, s~name, COUNT(*) AS bookings
  FROM scustom AS s
  INNER JOIN sbook AS b ON b~customid = s~id
  WHERE b~cancelled = @abap_false
  GROUP BY s~id, s~name
  ORDER BY bookings DESCENDING
  INTO TABLE @DATA(lt_top_customers)
  UP TO 10 ROWS.
```

`s~name` is in the select list, so it must be in `GROUP BY` too, even though each customer ID has only one name.

When an aggregate has no rows to work on, the database returns null, and ABAP turns it into an initial value: `SUM` gives `0`. `COUNT(*)` always gives a number, `0` if nothing matches.

If you need the totals together with the single rows, or a second level of grouping in memory, see [Grouping internal tables](./0095-grouping-internal-tables.md).

## Exercise

> [!IMPORTANT]
>
> 1. For each airline, print the number of connections in `SPFLI` and the longest flight time.
> 2. Print the connections in `SFLIGHT` whose average occupied seats per flight is more than 100, with that average.

### Solution

```abap
REPORT zaggregate_exercise.

SELECT carrid, COUNT(*) AS connections, MAX( fltime ) AS longest
  FROM spfli
  GROUP BY carrid
  ORDER BY carrid
  INTO TABLE @DATA(lt_per_airline).

LOOP AT lt_per_airline INTO DATA(ls_airline).
  WRITE: / ls_airline-carrid, ls_airline-connections, ls_airline-longest.
ENDLOOP.

SELECT carrid, connid, AVG( seatsocc ) AS avg_occupied
  FROM sflight
  GROUP BY carrid, connid
  HAVING AVG( seatsocc ) > 100
  INTO TABLE @DATA(lt_full).

DATA lv_avg TYPE p LENGTH 8 DECIMALS 1.
LOOP AT lt_full INTO DATA(ls_full).
  lv_avg = ls_full-avg_occupied.            " from type f to a packed number
  WRITE: / ls_full-carrid, ls_full-connid, lv_avg.
ENDLOOP.
```

> [!NOTE]
>
> - `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` compute one value from many rows on the database.
> - Give each aggregate an alias with `AS`.
> - With `GROUP BY`, every non-aggregated column in the select list must be in the `GROUP BY` list.
> - `WHERE` filters rows before grouping; `HAVING` filters groups after it.
> - Don't sum amounts in different currencies.
