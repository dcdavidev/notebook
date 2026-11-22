---
title: Subqueries and UNION
description: EXISTS, IN with a subquery, and combining result sets.
---

_Basic level_

A **subquery** is a `SELECT` inside the `WHERE` or `HAVING` clause of another `SELECT`. It lets you filter on a question about another table: "airlines that have at least one connection", "flights more expensive than the average". The database answers the whole thing in one statement.

`UNION` goes the other way: it puts the results of two queries one after the other in a single result, for example departures and arrivals of the same city.

## EXISTS

`EXISTS ( subquery )` is true if the subquery returns at least one row. It's the clearest way to ask "is there a related row?":

```abap
REPORT zsubquery_demo.

" Airlines that have at least one connection
SELECT carrid, carrname
  FROM scarr
  WHERE EXISTS ( SELECT * FROM spfli WHERE carrid = scarr~carrid )
  INTO TABLE @DATA(lt_active).

" Airlines with no connections at all
SELECT carrid, carrname
  FROM scarr
  WHERE NOT EXISTS ( SELECT * FROM spfli WHERE carrid = scarr~carrid )
  INTO TABLE @DATA(lt_inactive).
```

The subquery refers to the outer table with `scarr~carrid`. A subquery that uses columns of the outer query is called **correlated**: the database evaluates it for each row of `SCARR`. With `EXISTS`, the select list of the subquery doesn't matter, because only the existence of a row counts; `SELECT *` is the usual choice.

Compare `NOT EXISTS` with the `LEFT OUTER JOIN ... IS NULL` in [Joins](./0055-joins.md): both find airlines without connections, but `NOT EXISTS` says it more directly and never produces duplicates.

> [!TIP]
> `EXISTS` is like asking at a hotel reception "is anyone from my company staying here?" The receptionist checks the register and answers yes or no. You don't get the list of names, just the answer.

## IN with a subquery

`col IN ( subquery )` is true if the value of the column is among the values the subquery returns. The subquery must return exactly one column:

```abap
" Connections that have at least one fully booked flight
SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  WHERE connid IN ( SELECT connid FROM sflight
                      WHERE carrid   = spfli~carrid
                        AND seatsocc >= seatsmax )
  INTO TABLE @DATA(lt_full_connections).
```

`NOT IN ( subquery )` gives the opposite.

## Comparing with a single value

A subquery that returns a single value can stand on the right side of a comparison. This is called a **scalar subquery**:

```abap
" The most expensive flights
SELECT carrid, connid, fldate, price
  FROM sflight
  WHERE price = ( SELECT MAX( price ) FROM sflight )
  INTO TABLE @DATA(lt_top).

" Flights more expensive than the average of their own airline
SELECT carrid, connid, fldate, price
  FROM sflight AS f
  WHERE price > ( SELECT AVG( price ) FROM sflight WHERE carrid = f~carrid )
  INTO TABLE @DATA(lt_above_average).
```

> [!WARNING]
> A scalar subquery must return at most one row. If it returns more, the statement ends with a runtime error. Use an aggregate such as `MAX` or `AVG`, or a condition on the full key, to be sure. For "any of" or "all of" comparisons, use `ANY` or `ALL`: `WHERE price > ALL ( SELECT price FROM ... )`.

## UNION

`UNION` combines the rows of two or more `SELECT` statements into one result. It's available from ABAP 7.56 (SAP S/4HANA 2021); in older releases, run two `SELECT` statements and use `APPENDING TABLE` for the second.

```abap
" Every connection that touches Frankfurt, as departure or as arrival
SELECT carrid, connid, cityto AS other_city, 'D' AS direction
  FROM spfli
  WHERE cityfrom = 'FRANKFURT'
UNION ALL
SELECT carrid, connid, cityfrom AS other_city, 'A' AS direction
  FROM spfli
  WHERE cityto = 'FRANKFURT'
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_frankfurt).
```

The rules:

- Every `SELECT` must have the same number of columns, with compatible types. The column names of the result come from the first `SELECT`.
- `UNION ALL` keeps every row, including duplicates. `UNION` (or `UNION DISTINCT`) removes duplicate rows, which costs extra work on the database.
- `ORDER BY` and `INTO` come once, at the very end, and apply to the whole result.

Use `UNION ALL` when you know the parts can't overlap, as here: a connection can't depart from and arrive in Frankfurt at the same time.

Newer releases also support `INTERSECT` (rows in both results) and `EXCEPT` (rows in the first but not in the second), with the same rules.

## Exercise

> [!IMPORTANT]
>
> 1. List the customers in `SCUSTOM` who have at least one booking that isn't cancelled (`SBOOK-CANCELLED` is blank).
> 2. List the flights in `SFLIGHT` whose price is the lowest of their connection.

### Solution

```abap
REPORT zsubquery_exercise.

SELECT id, name, city
  FROM scustom
  WHERE EXISTS ( SELECT * FROM sbook
                   WHERE customid  = scustom~id
                     AND cancelled = @abap_false )
  INTO TABLE @DATA(lt_customers).

SELECT carrid, connid, fldate, price
  FROM sflight AS f
  WHERE price = ( SELECT MIN( price ) FROM sflight
                    WHERE carrid = f~carrid
                      AND connid = f~connid )
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_cheapest).
```

If two flights of the same connection share the lowest price, both appear in the second result.

> [!NOTE]
>
> - A subquery is a `SELECT` inside the `WHERE` or `HAVING` of another `SELECT`.
> - `EXISTS` and `NOT EXISTS` check whether related rows exist; refer to the outer table with `~`.
> - `IN ( subquery )` compares with a one-column list; a scalar subquery must return a single value.
> - `UNION ALL` appends results; `UNION` also removes duplicates. Both need matching columns.
> - `UNION` needs ABAP 7.56 or later.
