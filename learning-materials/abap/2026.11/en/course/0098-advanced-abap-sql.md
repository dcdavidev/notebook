---
title: Advanced ABAP SQL
description: Common table expressions, window functions, and SELECT from internal tables.
level: intermediate
---

With the [modern syntax](./0097-modern-abap-sql.md) in place, ABAP SQL offers features that used to require several queries and a lot of ABAP code: **common table expressions** to build a query in steps, **window functions** to compute rankings and running totals, and `SELECT` on **internal tables** to join data in memory with data in the database.

All of them run in one statement on the database, so they move less data and need fewer round trips. They need a recent release: common table expressions exist since ABAP 7.51, `SELECT` from internal tables since 7.52, and window functions since 7.54.

## Common table expressions

A **common table expression** (CTE) is a named subquery that you define with `WITH` and then use like a table in the main query. Its name starts with `+`.

```abap
WITH
  +bookings AS (
    SELECT FROM sbook
      FIELDS carrid, connid, COUNT(*) AS cnt
      WHERE cancelled = @abap_false
      GROUP BY carrid, connid ),
  +busy AS (
    SELECT FROM +bookings
      FIELDS carrid, connid, cnt
      WHERE cnt > 100 )
SELECT FROM +busy AS b
  INNER JOIN spfli AS p
    ON p~carrid = b~carrid AND p~connid = b~connid
  FIELDS b~carrid, b~connid, p~cityfrom, p~cityto, b~cnt
  ORDER BY b~cnt DESCENDING
  INTO TABLE @DATA(lt_busy).
```

- Each CTE can read the CTEs defined before it.
- Every CTE you define must be used in a later CTE or in the main query.
- Only the main query has an `INTO` clause.

Use a CTE when a query needs an intermediate result: an aggregate you then filter, join, or aggregate again.

> [!TIP]
> A CTE is like the scratch paper next to a long calculation: you write down a partial result, give it a name, and use it in the next line. Only the final line goes into the report.

## Window functions

An aggregate with `GROUP BY` returns one row per group. A **window function** returns a value for **every row**, calculated over a set of related rows called the window. You define the window with `OVER( )`:

- `PARTITION BY` splits the rows into groups (like `GROUP BY`, but the rows stay).
- `ORDER BY` sets the order inside each partition, needed for rankings and running totals.

```abap
SELECT FROM sflight
  FIELDS carrid,
         connid,
         fldate,
         seatsocc,
         ROW_NUMBER( ) OVER( PARTITION BY carrid
                             ORDER BY seatsocc DESCENDING ) AS row_no,
         RANK( )       OVER( PARTITION BY carrid
                             ORDER BY seatsocc DESCENDING ) AS rank_no,
         SUM( seatsocc ) OVER( PARTITION BY carrid )         AS carrier_total,
         SUM( seatsocc ) OVER( PARTITION BY carrid, connid
                               ORDER BY fldate )             AS running_total
  INTO TABLE @DATA(lt_ranking).
```

| Function                            | Returns                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `ROW_NUMBER( )`                     | 1, 2, 3, ... in the order of the window                         |
| `RANK( )`                           | the rank; rows with equal values get the same rank, then a gap  |
| `DENSE_RANK( )`                     | like `RANK( )`, but without gaps                                |
| `SUM`, `AVG`, `MIN`, `MAX`, `COUNT` | the aggregate over the window; with `ORDER BY`, a running value |
| `LEAD( )`, `LAG( )`                 | a value from the next or previous row (from ABAP 7.55)          |

You can't filter on a window function in the `WHERE` clause of the same query, because `WHERE` runs first. Put the query in a CTE and filter in the main query. This one returns the three busiest flights of every airline:

```abap
WITH +ranked AS (
  SELECT FROM sflight
    FIELDS carrid, connid, fldate, seatsocc,
           ROW_NUMBER( ) OVER( PARTITION BY carrid
                               ORDER BY seatsocc DESCENDING ) AS row_no )
SELECT FROM +ranked
  FIELDS carrid, connid, fldate, seatsocc
  WHERE row_no <= 3
  INTO TABLE @DATA(lt_top3).
```

## SELECT from internal tables

An internal table can be the data source of a `SELECT`, with `FROM @itab AS alias`. The alias is mandatory.

```abap
TYPES: BEGIN OF ty_request,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
       END OF ty_request,
       tt_request TYPE STANDARD TABLE OF ty_request WITH EMPTY KEY.

DATA(lt_requests) = VALUE tt_request(
  ( carrid = 'LH' connid = '0400' )
  ( carrid = 'AZ' connid = '0555' ) ).

SELECT FROM sflight AS f
  INNER JOIN @lt_requests AS r
    ON f~carrid = r~carrid AND f~connid = r~connid
  FIELDS f~carrid, f~connid, f~fldate, f~price
  INTO TABLE @DATA(lt_selected).
```

The join with an internal table is a modern alternative to [FOR ALL ENTRIES](./0057-for-all-entries.md): it doesn't break with an empty table (the join simply returns no rows), it removes no duplicates behind your back, and you can combine it with aggregates and `ORDER BY`.

You can also aggregate or sort an internal table alone with SQL:

```abap
SELECT FROM @lt_selected AS s
  FIELDS carrid, COUNT(*) AS flights, MAX( price ) AS max_price
  GROUP BY carrid
  INTO TABLE @DATA(lt_summary).
```

> [!WARNING]
> When a `SELECT` reads an internal table together with database tables, the internal table is sent to the database. That is fast on SAP HANA, but don't send tables with hundreds of thousands of rows. On databases that don't support the feature, the syntax check shows a warning; read it before you hide it with the pragma `##itab_db_select`.

## Exercise

> [!IMPORTANT]
>
> 1. With a window function, read every flight of `SFLIGHT` with its price and the average price of its airline (`AVG( price ) OVER( PARTITION BY carrid )`).
> 2. Wrap the query in a CTE and keep only the flights that cost more than the airline average.

### Solution

```abap
WITH +prices AS (
  SELECT FROM sflight
    FIELDS carrid, connid, fldate, price,
           AVG( price AS DEC( 15, 2 ) ) OVER( PARTITION BY carrid ) AS avg_price )
SELECT FROM +prices
  FIELDS carrid, connid, fldate, price, avg_price
  WHERE price > avg_price
  ORDER BY carrid, price DESCENDING
  INTO TABLE @DATA(lt_expensive).

cl_demo_output=>display( lt_expensive ).
```

`AVG( ... AS DEC( 15, 2 ) )` sets the result type; without it, `AVG` returns a floating-point number.

> [!NOTE]
>
> - A CTE (`WITH +name AS ( ... )`) is a named intermediate result that later queries use like a table.
> - Window functions with `OVER( PARTITION BY ... ORDER BY ... )` return a value for every row: rankings, totals, running sums.
> - To filter on a window function, compute it in a CTE and filter in the main query.
> - `FROM @itab AS alias` reads an internal table with SQL, alone or joined with database tables.
> - Check the release: CTEs need 7.51, internal tables as a source 7.52, window functions 7.54.
