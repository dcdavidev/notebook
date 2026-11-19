---
title: 'Reading and writing the database: ABAP SQL'
description: SELECT, JOIN, aggregations, INSERT, UPDATE, DELETE, COMMIT, and the LUW.
---

_Week 2 · Intermediate level · 4 hours_

### Today's schedule

| Block  | Content                                                           |
| ------ | ----------------------------------------------------------------- |
| Hour 1 | Basic SELECT: single row, multiple rows, WHERE, ORDER BY, UP TO   |
| Hour 2 | JOIN, aggregations, GROUP BY, HAVING, subqueries, FOR ALL ENTRIES |
| Hour 3 | Modern SQL expressions: CASE, functions, CTEs, UNION; performance |
| Hour 4 | Writing: INSERT, UPDATE, MODIFY, DELETE; COMMIT, ROLLBACK, LUW    |

## Hour 1 – Basic SELECT

### What ABAP SQL (Open SQL) is

**ABAP SQL** (formerly called Open SQL) is the version of SQL built into ABAP. You write queries directly in the code, and SAP translates them into the dialect of the underlying database (HANA, Oracle...). Advantages:

- it works the same on every database;
- it handles the client automatically (it adds `WHERE mandt = sy-mandt` by itself);
- it checks the syntax as soon as you activate the program;
- it uses the table buffer when possible.

> [!TIP]
> ABAP SQL is like an interpreter who speaks every language: you always talk to it in "ABAP", and it translates for whatever database is in front of it.

There is also **Native SQL** (`EXEC SQL` or the ADBC class `cl_sql_statement`) for database-specific commands, to be used only in exceptional cases.

### Modern and old syntax

Since release 7.40 SP05 there is the "strict" syntax: ABAP variables prefixed with `@` and fields separated by commas. That's the one we use. You'll find the old one (without `@` and without commas) in existing code: don't mix the two in the same statement.

```abap
* Modern
SELECT carrid, connid, cityfrom
  FROM spfli
  WHERE carrid = @lv_carrid
  INTO TABLE @DATA(lt_flights).

* Old
SELECT carrid connid cityfrom FROM spfli INTO TABLE lt_flights
  WHERE carrid = lv_carrid.
```

### Read a single row: SELECT SINGLE

```abap
DATA(lv_carrid) = 'LH'.

SELECT SINGLE carrname, currcode
  FROM scarr
  WHERE carrid = @lv_carrid
  INTO @DATA(ls_airline).

IF sy-subrc = 0.
  WRITE: / ls_airline-carrname, ls_airline-currcode.
ELSE.
  WRITE / 'Airline not found'.
ENDIF.
```

Use `SELECT SINGLE` when the `WHERE` specifies **the whole primary key** (a unique result). Otherwise the database returns "a random row" among those that match.

```abap
* Only check that it exists
SELECT SINGLE @abap_true FROM scarr WHERE carrid = @lv_carrid INTO @DATA(lv_exists).
```

### Read multiple rows: INTO TABLE

```abap
SELECT carrid, connid, cityfrom, cityto, deptime
  FROM spfli
  WHERE cityfrom = 'FRANKFURT'
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_flights).

DATA(lv_count) = sy-dbcnt.   " number of rows read
```

- `ORDER BY` sorts (also `DESCENDING`, or `ORDER BY PRIMARY KEY`).
- `UP TO n ROWS` limits the number of rows (for example the first 10).
- `OFFSET n` skips the first `n` rows (pagination).
- `APPENDING TABLE` adds rows without emptying the table.
- `INTO CORRESPONDING FIELDS OF TABLE @lt_x` copies the fields by name, useful when the target table has a different structure.

### SELECT ... ENDSELECT (a loop on the database)

```abap
SELECT carrid, connid FROM spfli INTO @DATA(ls_flight).
  WRITE: / ls_flight-carrid, ls_flight-connid.
ENDSELECT.
```

> [!WARNING]
> `SELECT ... ENDSELECT` reads one row at a time and makes many round trips between server and database. In almost every case, `INTO TABLE` followed by `LOOP AT` is better. **Never put a `SELECT` inside a `LOOP`**: it's the number-one cause of slow programs.

### The WHERE clause in detail

| Condition                  | Example                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| Comparisons                | `WHERE price >= 500`                                               |
| `AND` / `OR` / `NOT`       | `WHERE carrid = 'LH' AND ( cityto = 'ROME' OR cityto = 'BERLIN' )` |
| `BETWEEN`                  | `WHERE fldate BETWEEN @lv_from AND @lv_to`                         |
| `IN` list                  | `WHERE carrid IN ('LH', 'AZ', 'AA')`                               |
| `IN` range / select-option | `WHERE carrid IN @s_carrid`                                        |
| `LIKE`                     | `WHERE cityto LIKE 'NEW%'` (`%` = any text, `_` = one character)   |
| `IS NULL` / `IS INITIAL`   | `WHERE email IS INITIAL`                                           |
| `EXISTS`                   | `WHERE EXISTS ( SELECT ... )`                                      |

### SELECT \* and the fields you need

`SELECT *` reads every column. It's convenient, but if the table has 200 columns and you need 3, you transfer far more data than necessary. **Always list the fields you need.**

## Hour 2 – JOIN, aggregations, and FOR ALL ENTRIES

### INNER JOIN and LEFT OUTER JOIN

A **JOIN** combines rows from several tables that share a field.

```abap
SELECT s~carrid, c~carrname, s~connid, s~cityfrom, s~cityto
  FROM spfli AS s
  INNER JOIN scarr AS c ON c~carrid = s~carrid
  WHERE s~cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_flights_airlines).
```

- `AS s` gives the table an alias; the tilde `~` separates alias and field.
- `INNER JOIN`: only the rows that have a match in **both** tables.
- `LEFT OUTER JOIN`: **all** the rows of the left table, even without a match on the right (the right-hand fields stay empty).
- There are also `RIGHT OUTER JOIN` and `CROSS JOIN`.

> [!TIP]
> `INNER JOIN` is like the list of guests who replied to the invitation: only those who appear on both lists. `LEFT OUTER JOIN` is the list of all the guests, with their reply next to them if there is one, or a blank if they didn't reply.

```abap
* All airlines, even those without flights
SELECT c~carrid, c~carrname, s~connid
  FROM scarr AS c
  LEFT OUTER JOIN spfli AS s ON s~carrid = c~carrid
  INTO TABLE @DATA(lt_all).
```

### Aggregate functions and GROUP BY

| Function                        | Meaning                   |
| ------------------------------- | ------------------------- |
| `COUNT(*)`                      | number of rows            |
| `COUNT( DISTINCT field )`       | number of distinct values |
| `SUM( field )`                  | sum                       |
| `AVG( field )`                  | average                   |
| `MIN( field )` / `MAX( field )` | minimum / maximum         |

```abap
SELECT carrid,
       COUNT(*)        AS num_flights,
       SUM( seatsocc ) AS seats_occupied,
       AVG( price )    AS avg_price,
       MAX( price )    AS max_price
  FROM sflight
  GROUP BY carrid
  HAVING COUNT(*) > 5
  ORDER BY num_flights DESCENDING
  INTO TABLE @DATA(lt_statistics).
```

- `GROUP BY`: one result for each value of the grouping field.
- `HAVING`: like `WHERE`, but filters **after** grouping.
- `AS`: names the calculated column.

```abap
SELECT COUNT(*) FROM sbook WHERE carrid = 'LH' INTO @DATA(lv_bookings).
```

### Subqueries

```abap
* Flights whose price is above average
SELECT carrid, connid, fldate, price FROM sflight
  WHERE price > ( SELECT AVG( price ) FROM sflight )
  INTO TABLE @DATA(lt_expensive).

* Airlines that have at least one flight
SELECT carrid, carrname FROM scarr AS c
  WHERE EXISTS ( SELECT carrid FROM spfli WHERE carrid = c~carrid )
  INTO TABLE @DATA(lt_active).
```

### FOR ALL ENTRIES

Before powerful JOINs existed, the classic way to read data related to an internal table was `FOR ALL ENTRIES IN`: the `SELECT` runs for all the rows of the internal table.

```abap
SELECT carrid, connid FROM spfli WHERE cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_spfli).

IF lt_spfli IS NOT INITIAL.          " ESSENTIAL!
  SELECT carrid, connid, fldate, price
    FROM sflight
    FOR ALL ENTRIES IN @lt_spfli
    WHERE carrid = @lt_spfli-carrid
      AND connid = @lt_spfli-connid
    INTO TABLE @DATA(lt_sflight).
ENDIF.
```

> [!WARNING]
> Three rules of `FOR ALL ENTRIES`:
>
> 1. If the internal table is **empty**, the `WHERE` is ignored and the `SELECT` reads the **whole** database table! Always check `IS NOT INITIAL`.
> 2. **Duplicates** in the result are removed: select all the key fields so you don't lose rows.
> 3. You can't use `ORDER BY` or most aggregations.
>
> Today, whenever possible, prefer a JOIN or a CDS view.

### Use an internal table as a source (7.52+)

```abap
SELECT carrid, connid FROM @lt_spfli AS itab
  WHERE carrid = 'LH'
  INTO TABLE @DATA(lt_filtered).
```

Useful to join an internal table with a database table (on HANA this is handled efficiently).

## Hour 3 – Modern SQL and performance

### Expressions in the SELECT

```abap
SELECT carrid, connid, fldate, price, currency,
       price * 2 AS double_price,
       CAST( seatsocc AS FLTP ) / CAST( seatsmax AS FLTP ) * 100 AS percentage,
       CASE
         WHEN seatsocc >= seatsmax THEN 'FULL'
         WHEN seatsocc = 0         THEN 'EMPTY'
         ELSE 'AVAILABLE'
       END AS status,
       concat( carrid, connid )     AS flight_code,
       coalesce( planetype, '???' ) AS aircraft,
       @sy-uname                    AS username
  FROM sflight
  INTO TABLE @DATA(lt_result).
```

Available functions (a selection): `concat`, `concat_with_space`, `substring`, `length`, `upper`, `lower`, `lpad`, `rpad`, `replace`, `abs`, `round`, `ceil`, `floor`, `div`, `mod`, `division`, `coalesce`, `cast`, `dats_days_between`, `dats_add_days`, `dats_add_months`, `tstmp_current_utctimestamp`, `currency_conversion`, `unit_conversion`.

### Common Table Expressions (WITH)

A **CTE** is a named subquery that you can reuse in the main query (7.51+):

```abap
WITH +lh_flights AS (
  SELECT carrid, connid, cityfrom, cityto FROM spfli WHERE carrid = 'LH' )
SELECT f~connid, f~cityto, s~fldate, s~price
  FROM +lh_flights AS f
  INNER JOIN sflight AS s ON s~carrid = f~carrid AND s~connid = f~connid
  INTO TABLE @DATA(lt_cte).
```

### UNION

```abap
SELECT cityfrom AS city FROM spfli
UNION
SELECT cityto AS city FROM spfli
  INTO TABLE @DATA(lt_cities).   " all the cities, without duplicates (UNION ALL keeps them)
```

### Reference data: currencies and languages

When you read texts, filter by language: `WHERE spras = @sy-langu`. When you add up amounts, also group by currency: adding euros and dollars together makes no sense.

### The 5 golden rules of SQL performance

1. **Read fewer rows**: make the `WHERE` as precise as possible and use indexed fields (the primary key first of all).
2. **Read fewer columns**: no `SELECT *` unless needed.
3. **Fewer trips to the database**: no `SELECT` inside `LOOP`s; use JOINs, `FOR ALL ENTRIES`, or internal tables as a source.
4. **Let the database do the work**: aggregations, sums, and filters in SQL, not in ABAP (on HANA even more so: "code pushdown", day 14).
5. **Use the buffer**: buffered tables are read from memory; some clauses (JOIN, aggregations, `BYPASSING BUFFER`) skip it.

> [!TIP]
> Going to the database is like going to the supermarket. A `SELECT` inside a `LOOP` is like going to the supermarket 100 times to buy 100 items, one at a time. A `SELECT` with a JOIN is like going once with the full shopping list.

### Blocks of rows: PACKAGE SIZE and cursors

With millions of rows, reading everything into memory can exhaust it. You read in packages:

```abap
SELECT carrid, connid, fldate FROM sflight
  INTO TABLE @DATA(lt_package) PACKAGE SIZE 10000.
  " process 10,000 rows at a time
ENDSELECT.

* Or with a cursor
OPEN CURSOR @DATA(lv_cursor) FOR SELECT * FROM sbook.
DO.
  FETCH NEXT CURSOR @lv_cursor INTO TABLE @DATA(lt_block) PACKAGE SIZE 5000.
  IF sy-subrc <> 0. EXIT. ENDIF.
  " process lt_block
ENDDO.
CLOSE CURSOR @lv_cursor.
```

## Hour 4 – Writing to the database

> [!WARNING]
> The fundamental rule: **never write directly into SAP standard tables** (`VBAK`, `BKPF`, `MARA`...). You would skip every check and corrupt the data. For standard data you use BAPIs and official APIs (days 7 and 13). `INSERT`/`UPDATE`/`DELETE` are only for your own Z tables.

### INSERT

```abap
DATA ls_order TYPE zorders_course.

ls_order = VALUE #( order_no   = '0000000001' customer = '0000001000'
                    order_date = sy-datum     amount   = '150.00' currency = 'EUR'
                    status     = 'N' ).

INSERT zorders_course FROM @ls_order.
IF sy-subrc <> 0.
  WRITE 'Order already exists'.        " sy-subrc = 4: duplicate key
ENDIF.

* Several rows at once
INSERT zorders_course FROM TABLE @lt_orders.                          " dump if there's a duplicate
INSERT zorders_course FROM TABLE @lt_orders ACCEPTING DUPLICATE KEYS. " skips duplicates, sy-subrc = 4
```

### UPDATE

```abap
* Whole row (identified by the key in the structure)
ls_order-status = 'P'.
UPDATE zorders_course FROM @ls_order.

* Only some fields, with a condition
UPDATE zorders_course SET status = 'C'
  WHERE order_date < @lv_limit AND status = 'P'.
WRITE |Orders closed: { sy-dbcnt }|.
```

> [!WARNING]
> An `UPDATE ... SET` without a `WHERE` changes **every** row of the table. Always double-check before running it.

### MODIFY (inserts or updates)

```abap
MODIFY zorders_course FROM @ls_order.        " updates if the key exists, otherwise inserts
MODIFY zorders_course FROM TABLE @lt_orders.
```

### DELETE

```abap
DELETE zorders_course FROM @ls_order.              " by key
DELETE FROM zorders_course WHERE status = 'C'.     " by condition
```

### The LUW (Logical Unit of Work)

A **LUW** is a set of changes that must happen **all together or not at all**.

> [!TIP]
> Think of a bank transfer: taking 100 euros out of account A and adding them to account B are two operations. If the second one fails, the first one must be undone, or the money disappears. LUW = "all or nothing".

- `COMMIT WORK.` permanently confirms all the changes made since the last commit.
- `ROLLBACK WORK.` undoes all the changes not yet confirmed.
- `COMMIT WORK AND WAIT.` also waits for the asynchronous updates (update tasks) to finish.

```abap
INSERT zorders_course FROM @ls_order1.
DATA(lv_ok) = xsdbool( sy-subrc = 0 ).
INSERT zorders_course FROM @ls_order2.

IF lv_ok = abap_true AND sy-subrc = 0.
  COMMIT WORK.
ELSE.
  ROLLBACK WORK.
ENDIF.
```

### Database LUW and SAP LUW

There are two levels of LUW:

- **Database LUW**: the database makes an implicit commit at every screen change, every RFC call, every dialog message. So an SAP transaction with several screens can't keep everything in a single database LUW.
- **SAP LUW**: SAP collects the changes across all the screens and writes them only at the end, at `COMMIT WORK`, using:
  - update function modules (`CALL FUNCTION ... IN UPDATE TASK`): they are registered and then run all together at the `COMMIT` (day 13);
  - `PERFORM ... ON COMMIT` subroutines.

Errors in update tasks are shown in **SM13**. In the RAP model (day 15), the framework handles all of this.

> [!WARNING]
> In ABAP Cloud and in RAP methods, `COMMIT`/`ROLLBACK` statements are often forbidden: the framework decides when to commit. In classic reports, instead, it's your responsibility.

## Exercises

> [!IMPORTANT]
>
> 1. With `SELECT SINGLE`, read the name of the airline `'AZ'` from `SCARR`.
> 2. Read all the flights (`SPFLI`) from `'ROME'` or `'FRANKFURT'` sorted by departure time, only the fields `carrid`, `connid`, `cityfrom`, `cityto`, `deptime`.
> 3. With a JOIN between `SPFLI` and `SCARR`, print the airline name, flight number, departure city, and arrival city.
> 4. With `GROUP BY`, calculate for each airline the number of flights in `SFLIGHT`, the average price, and the total occupied seats. Show only the airlines with more than 10 flights.
> 5. Redo exercise 3 with `FOR ALL ENTRIES` (first `SPFLI`, then `SCARR`) and compare the timings with transaction SAT.
> 6. Insert 3 orders into your table `ZORDERS_COURSE`, update one, delete another, `COMMIT`, and check with SE16N. Then redo everything with `ROLLBACK` and check that nothing changed.
> 7. With a `CASE` in the `SELECT`, classify the flights of `SFLIGHT` as "Cheap" (< 500), "Medium" (< 1000), "Expensive".

## Quiz

1. Why don't you need to write the client condition in ABAP SQL?
2. When is it correct to use `SELECT SINGLE`?
3. What happens with `FOR ALL ENTRIES` if the internal table is empty?
4. What is the difference between `INNER JOIN` and `LEFT OUTER JOIN`?
5. What is the difference between `WHERE` and `HAVING`?
6. What does `MODIFY` do on a database table?
7. Why don't you write with `INSERT`/`UPDATE` into SAP standard tables?
8. What is a LUW?

## Solutions

```abap
REPORT zes06_solutions.

START-OF-SELECTION.
* Ex. 1
  SELECT SINGLE carrname FROM scarr WHERE carrid = 'AZ' INTO @DATA(lv_name).
  WRITE / lv_name.

* Ex. 2
  SELECT carrid, connid, cityfrom, cityto, deptime FROM spfli
    WHERE cityfrom IN ('ROME', 'FRANKFURT')
    ORDER BY deptime
    INTO TABLE @DATA(lt_spfli).

* Ex. 3
  SELECT c~carrname, s~connid, s~cityfrom, s~cityto
    FROM spfli AS s INNER JOIN scarr AS c ON c~carrid = s~carrid
    INTO TABLE @DATA(lt_join).
  LOOP AT lt_join INTO DATA(ls_j).
    WRITE: / ls_j-carrname, ls_j-connid, ls_j-cityfrom, ls_j-cityto.
  ENDLOOP.

* Ex. 4
  SELECT carrid, COUNT(*) AS flights, AVG( price ) AS average, SUM( seatsocc ) AS seats
    FROM sflight GROUP BY carrid HAVING COUNT(*) > 10
    INTO TABLE @DATA(lt_stats).

* Ex. 7
  SELECT carrid, connid, fldate, price,
         CASE WHEN price < 500  THEN 'Cheap'
              WHEN price < 1000 THEN 'Medium'
              ELSE 'Expensive' END AS price_band
    FROM sflight INTO TABLE @DATA(lt_bands).
```

Quiz:

1. Because ABAP SQL automatically adds the filter on the current client.
2. When the `WHERE` contains the whole primary key (or you only want to know whether at least one row exists).
3. The `WHERE` is ignored and the whole table is read.
4. `INNER`: only rows with a match in both; `LEFT OUTER`: all the rows on the left, even without a match.
5. `WHERE` filters rows before grouping, `HAVING` filters groups after.
6. It updates if the key exists, otherwise it inserts.
7. You'd skip checks, dependencies, and logs: the data would become inconsistent; you use BAPIs/APIs instead.
8. A set of changes that must be confirmed all together or undone all together.

> [!NOTE]
> Today you learned: ABAP SQL for reading (`SELECT`, JOINs, aggregations, subqueries, `FOR ALL ENTRIES`, CTEs, expressions) and for writing (`INSERT`, `UPDATE`, `MODIFY`, `DELETE`), the performance rules, `COMMIT`, `ROLLBACK`, and the LUW. Tomorrow: splitting code into reusable blocks.
