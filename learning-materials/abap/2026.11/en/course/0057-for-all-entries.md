---
title: FOR ALL ENTRIES
description: Read rows that match the contents of an internal table.
level: basic
---

Sometimes the values you filter on aren't on the selection screen but in an internal table: the connections you read a moment ago, the materials a user uploaded from a file, the result of a function module. `FOR ALL ENTRIES IN` reads the database rows that match **any** row of an internal table, in one statement.

It's one of the most used constructs in classic ABAP, and one of the easiest to get wrong. This lesson shows how it works and the rules that keep it safe.

## How it works

You name the internal table after `FOR ALL ENTRIES IN`, and in the `WHERE` you compare columns with its components:

```abap
REPORT zfae_demo.

" 1. The driver table: connections that depart from Frankfurt
SELECT carrid, connid, cityto
  FROM spfli
  WHERE cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_connections).

" 2. The flights of those connections
IF lt_connections IS NOT INITIAL.
  SELECT carrid, connid, fldate, price, currency
    FROM sflight
    FOR ALL ENTRIES IN @lt_connections
    WHERE carrid = @lt_connections-carrid
      AND connid = @lt_connections-connid
    INTO TABLE @DATA(lt_flights).
ENDIF.

WRITE: / lines( lt_flights ), 'flights from Frankfurt'.
```

The internal table is called the **driver table**. Conceptually, the database runs the `SELECT` once for each row of the driver table and joins the results. In practice, the database interface groups the rows into a few large statements, but the result is the same.

> [!TIP]
> `FOR ALL ENTRIES` is like giving a librarian your shopping list of book titles instead of asking for one title at a time. The librarian brings all the books on the list in one trip. But if you hand over an empty list, a careless librarian brings the whole library.

## Rule 1: never use an empty driver table

If the driver table is empty, the database ignores the `WHERE` condition and returns **every row** of the table.

```abap
CLEAR lt_connections.

SELECT carrid, connid, fldate
  FROM sflight
  FOR ALL ENTRIES IN @lt_connections
  WHERE carrid = @lt_connections-carrid
    AND connid = @lt_connections-connid
  INTO TABLE @DATA(lt_everything).          " all flights of all airlines!
```

> [!CAUTION]
> On a large table, such as accounting documents, an empty driver table reads millions of rows, fills the memory, and ends in a dump or a very long runtime. Always put `IF lt_driver IS NOT INITIAL.` around a `FOR ALL ENTRIES`.

## Rule 2: duplicates disappear

`FOR ALL ENTRIES` removes duplicate rows from the result, as if you wrote `DISTINCT`. If your select list doesn't contain the full primary key, two different database rows with the same values in the selected columns become one row, and you lose data.

```abap
" Wrong: two bookings with the same price on the same flight merge into one row
SELECT carrid, connid, fldate, loccuram
  FROM sbook
  FOR ALL ENTRIES IN @lt_flights
  WHERE carrid = @lt_flights-carrid
    AND connid = @lt_flights-connid
    AND fldate = @lt_flights-fldate
  INTO TABLE @DATA(lt_amounts).

" Right: include the full key (BOOKID) so every booking stays
SELECT carrid, connid, fldate, bookid, loccuram
  FROM sbook
  FOR ALL ENTRIES IN @lt_flights
  WHERE carrid = @lt_flights-carrid
    AND connid = @lt_flights-connid
    AND fldate = @lt_flights-fldate
  INTO TABLE @DATA(lt_bookings).
```

> [!WARNING]
> If you sum the amounts of `lt_amounts` from the first query, the total is too low and nobody notices. Always select the full primary key of the table you read with `FOR ALL ENTRIES`.

## More rules and good habits

- **Remove duplicates from the driver table** first. The same key twice only makes the statement bigger. Sort the table and use `DELETE ADJACENT DUPLICATES` (see [Sorting, summing, and removing duplicates](./0040-sorting-and-duplicates.md)).
- **Don't rely on the order** of the result. Sort it in ABAP with `SORT` if you need an order.
- **Avoid aggregates** (`SUM`, `COUNT`, ...) and `GROUP BY`: they're restricted with `FOR ALL ENTRIES`, and the results aren't what you expect. Read the rows and add them up in ABAP, or use a join.
- **Match the types**: the component of the driver table should have the same type as the column it's compared with.

```abap
SORT lt_connections BY carrid connid.
DELETE ADJACENT DUPLICATES FROM lt_connections COMPARING carrid connid.
```

## FOR ALL ENTRIES or a join

If both tables are in the database, a [join](./0055-joins.md) is usually simpler and faster: one statement, no empty-table risk, no lost duplicates. The two-step example at the start of this lesson is better written as:

```abap
SELECT f~carrid, f~connid, f~fldate, f~price, f~currency
  FROM spfli AS p
  INNER JOIN sflight AS f ON f~carrid = p~carrid
                         AND f~connid = p~connid
  WHERE p~cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_flights_join).
```

Use `FOR ALL ENTRIES` when the driver table doesn't come from the database: a file, user input, an API call. From ABAP 7.52 you can also use an internal table directly as a data source in a `SELECT`, which removes most of these limits: see [Advanced ABAP SQL](./0098-advanced-abap-sql.md).

## Exercise

> [!IMPORTANT]
>
> 1. Build an internal table by hand with three customer numbers (for example `1`, `2`, and `3`).
> 2. With `FOR ALL ENTRIES`, read all bookings of those customers from `SBOOK`, keeping every booking.
> 3. Make sure the program does nothing if the table is empty.

### Solution

```abap
REPORT zfae_exercise.

TYPES tt_customers TYPE STANDARD TABLE OF s_customer WITH EMPTY KEY.

DATA(lt_customers) = VALUE tt_customers( ( '00000001' ) ( '00000002' ) ( '00000003' ) ).

SORT lt_customers.
DELETE ADJACENT DUPLICATES FROM lt_customers.

IF lt_customers IS INITIAL.
  RETURN.
ENDIF.

SELECT carrid, connid, fldate, bookid, customid, loccuram, loccurkey
  FROM sbook
  FOR ALL ENTRIES IN @lt_customers
  WHERE customid = @lt_customers-table_line
  INTO TABLE @DATA(lt_bookings).

WRITE: / lines( lt_bookings ), 'bookings'.
```

The driver table has no structure, so its single column is called `table_line`.

> [!NOTE]
>
> - `FOR ALL ENTRIES IN @itab` reads the rows that match any row of an internal table.
> - With an empty driver table, every row is read: always check `IS NOT INITIAL` first.
> - Duplicate result rows are removed: select the full primary key.
> - Remove duplicates from the driver table, and sort the result in ABAP.
> - Prefer a join when both tables are in the database.
