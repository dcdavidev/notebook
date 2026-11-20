---
title: Joins
description: INNER JOIN and LEFT OUTER JOIN across several tables.
---

_Basic level_

Business data is spread over several tables. The airline's name is in `SCARR`, its connections in `SPFLI`, and the single flights in `SFLIGHT`. A **join** combines rows of two or more tables in one `SELECT`, by matching the columns they share.

One join is almost always better than several `SELECT` statements and loops in ABAP: the database does the matching, and only the combined result travels to your program.

## INNER JOIN

An **inner join** returns only the rows that have a match on both sides. This query lists every connection with the name of its airline:

```abap
REPORT zjoin_demo.

SELECT scarr~carrid, scarr~carrname, spfli~connid, spfli~cityfrom, spfli~cityto
  FROM scarr
  INNER JOIN spfli ON spfli~carrid = scarr~carrid
  INTO TABLE @DATA(lt_connections).

LOOP AT lt_connections INTO DATA(ls_conn).
  WRITE: / ls_conn-carrname, ls_conn-connid, ls_conn-cityfrom, ls_conn-cityto.
ENDLOOP.
```

- `ON` gives the **join condition**: which columns must match.
- The **column selector** `~` says which table a column comes from: `scarr~carrid`. You need it when the same column name exists in more than one table, and it makes every query easier to read.
- The inline table gets one component per column, named after the column: `carrid`, `carrname`, `connid`, and so on.

An airline with no connections doesn't appear in the result: an inner join drops rows without a partner.

> [!TIP]
> An inner join is like matching guests to a seating plan. Only the people who have both an invitation and an assigned seat end up on the final list. A guest with no seat, or a seat with no guest, isn't on it.

## Table aliases

Long table names make joins hard to read. Give each table a short **alias** with `AS` and use it everywhere in the query:

```abap
SELECT c~carrname, p~connid, f~fldate, f~price, f~currency
  FROM scarr AS c
  INNER JOIN spfli   AS p ON p~carrid = c~carrid
  INNER JOIN sflight AS f ON f~carrid = p~carrid
                         AND f~connid = p~connid
  WHERE c~carrid = 'LH'
  ORDER BY p~connid, f~fldate
  INTO TABLE @DATA(lt_flights).
```

This joins three tables. `SFLIGHT` needs two columns in the condition, because a flight belongs to a connection through both `CARRID` and `CONNID`. If you forget one, every flight is matched with the wrong connections too.

> [!WARNING]
> Always join on the **full** key that links the tables. A missing column in the `ON` condition doesn't cause an error: it silently multiplies the rows, and the totals in your report are wrong.

You can also rename a column in the result with `AS`, for example `p~cityfrom AS departure`. The component of the internal table is then called `departure`.

## LEFT OUTER JOIN

A **left outer join** returns every row of the left table, with or without a match. When there's no match, the columns of the right table are empty.

```abap
SELECT c~carrid, c~carrname, p~connid
  FROM scarr AS c
  LEFT OUTER JOIN spfli AS p ON p~carrid = c~carrid
  ORDER BY c~carrid, p~connid
  INTO TABLE @DATA(lt_all_airlines).

LOOP AT lt_all_airlines INTO DATA(ls_airline).
  IF ls_airline-connid IS INITIAL.
    WRITE: / ls_airline-carrid, ls_airline-carrname, 'has no connections'.
  ELSE.
    WRITE: / ls_airline-carrid, ls_airline-carrname, ls_airline-connid.
  ENDIF.
ENDLOOP.
```

On the database, the missing columns are **null**. ABAP has no null value, so they arrive in your program as initial values: `connid` is `'0000'`, a text is blank, a number is `0`.

To find only the airlines without connections, filter on the null value in the `WHERE`:

```abap
SELECT c~carrid, c~carrname
  FROM scarr AS c
  LEFT OUTER JOIN spfli AS p ON p~carrid = c~carrid
  WHERE p~connid IS NULL
  INTO TABLE @DATA(lt_no_connections).
```

There's also `RIGHT OUTER JOIN`, which keeps every row of the right table. Swapping the tables in a left join gives the same result and is easier to read.

## Inner or outer

| Question                                         | Join                          |
| ------------------------------------------------ | ----------------------------- |
| Show only rows that have data on both sides      | `INNER JOIN`                  |
| Show every row of the main table, even unmatched | `LEFT OUTER JOIN`             |
| Find rows that have no partner                   | `LEFT OUTER JOIN` + `IS NULL` |

A `WHERE` condition on the right table of an outer join removes the rows where that table is null. If you want to restrict the right side but keep all left rows, put the condition in the `ON` clause instead.

Joins on more than a handful of tables get hard to maintain. When you reuse the same join in many programs, define it once as a [CDS view entity](./0132-cds-view-entities.en.md).

## Exercise

> [!IMPORTANT]
>
> 1. List all bookings of customer `1` in `SBOOK` with the customer's name from `SCUSTOM` and the airline's name from `SCARR`.
> 2. List the customers whose name starts with "A" together with their bookings, including the customers who never booked.

### Solution

```abap
REPORT zjoin_exercise.

SELECT b~bookid, b~carrid, b~connid, b~fldate, s~name, c~carrname
  FROM sbook AS b
  INNER JOIN scustom AS s ON s~id = b~customid
  INNER JOIN scarr   AS c ON c~carrid = b~carrid
  WHERE b~customid = '00000001'
  INTO TABLE @DATA(lt_bookings).

SELECT s~id, s~name, b~carrid, b~connid, b~fldate, b~bookid
  FROM scustom AS s
  LEFT OUTER JOIN sbook AS b ON b~customid = s~id
  WHERE s~name LIKE 'A%'
  ORDER BY s~id
  INTO TABLE @DATA(lt_customers).
```

The customer number `CUSTOMID` is a numeric text of 8 digits, so the literal is `'00000001'`.

> [!NOTE]
>
> - A join combines rows of several tables in one `SELECT`, with the matching columns in `ON`.
> - `INNER JOIN` keeps only rows with a match; `LEFT OUTER JOIN` keeps every row of the left table.
> - Use `~` to say which table a column belongs to, and `AS` for short aliases.
> - Join on the full linking key, or the rows multiply.
> - Columns without a match are null on the database and arrive in ABAP as initial values.
