---
title: ABAP on SAP HANA and code pushdown
description: Move data-intensive logic from the application server to the database.
---

_Pro level_

Classic ABAP was written for databases that were slow at anything beyond simple reads, so programs copied rows to the application server and did the work there. SAP HANA turns this around: it's an in-memory, column-oriented database that can aggregate and calculate over millions of rows faster than any loop in ABAP.

**Code pushdown** means moving data-intensive logic down to the database, so that only the result travels to the application server. This lesson explains why it pays off and which tools you use for it; the following lessons go deep on each tool.

## What makes SAP HANA different

| Feature            | What it means for your code                                    |
| ------------------ | -------------------------------------------------------------- |
| In-memory          | data is read from RAM, not from disk                           |
| Column store       | aggregating one column (`SUM( price )`) reads only that column |
| Compression        | columns with few distinct values take little memory            |
| Parallel execution | one query runs on many CPU cores at once                       |
| Calculation engine | joins, expressions, and aggregates run where the data is       |

The slow part of a typical program is no longer the database read but the **transfer** of many rows to the application server and the ABAP loops over them.

> [!TIP]
> Think of a library. The old way is to carry every book on the shelf to your desk to count how many are about history. Code pushdown is asking the librarian, who's standing next to the shelf, and getting back a single number.

## From data-to-code to code-to-data

Here is a classic report that computes the occupied seats per airline. It reads every flight and sums in ABAP:

```abap
TYPES: BEGIN OF ty_load,
         carrid   TYPE s_carr_id,
         seatsocc TYPE s_seatsocc,
       END OF ty_load.
DATA lt_load TYPE SORTED TABLE OF ty_load WITH UNIQUE KEY carrid.

SELECT carrid, seatsocc FROM sflight INTO TABLE @DATA(lt_flights).  " every row travels

DATA ls_load TYPE ty_load.
LOOP AT lt_flights INTO DATA(ls_flight).
  ls_load = CORRESPONDING #( ls_flight ).
  COLLECT ls_load INTO lt_load.                                     " sum in ABAP
ENDLOOP.
```

The same result with the work pushed down to the database, where only one row per airline comes back:

```abap
SELECT FROM sflight
  FIELDS carrid,
         SUM( seatsocc ) AS seatsocc,
         COUNT( * )      AS flights
  GROUP BY carrid
  ORDER BY carrid
  INTO TABLE @DATA(lt_load_db).
```

On a table with millions of flights, the second version moves a few dozen rows instead of millions. The code is also shorter. The [modern ABAP SQL](./0097-modern-abap-sql.en.md) and [advanced ABAP SQL](./0098-advanced-abap-sql.en.md) lessons show the expressions, `CASE`, window functions, and common table expressions you can use in the query.

## The pushdown toolbox

Choose the simplest tool that does the job, in this order:

| Level | Tool                                                                                  | Use it when                                                                           |
| ----- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1     | ABAP SQL with expressions, joins, aggregates                                          | the logic belongs to one program                                                      |
| 2     | [CDS view entities](./0132-cds-view-entities.en.md)                                   | many programs, Fiori apps, or analytics need the same data model                      |
| 3     | [AMDP](./0137-amdp.en.md) and [CDS table functions](./0138-cds-table-functions.en.md) | the logic needs SQLScript or HANA-specific functions that ABAP SQL and CDS don't have |

ABAP SQL and CDS run on every database SAP supports, so they're portable. AMDP is written in SQLScript and runs only on SAP HANA: keep it for the cases the first two levels can't cover.

> [!WARNING]
> Pushdown is not "move all the logic to SQL". Business rules that check user input, call BAPIs, or depend on many configuration tables are often clearer in ABAP. Push down what processes **many rows**; keep in ABAP what decides **what to do** with them.

## Habits that change on SAP HANA

Some old performance rules still hold, others change:

- **Still true**: read only the columns you need (no `SELECT *` on wide tables), filter with `WHERE` in the database, and avoid `SELECT` inside loops.
- **Prefer joins** to nested `SELECT` statements and, in most cases, to [`FOR ALL ENTRIES`](./0057-for-all-entries.en.md): a join is one round trip, and the optimizer can see the whole query.
- **Fewer secondary indexes**: the column store is already fast for most filters. Don't add an index before you measure.
- **Measure** with the SQL trace (`ST05`) and `SAT`, as in [performance analysis](./0108-performance-analysis.en.md). For a whole system, the SQL Monitor (`SQLM`) shows which statements cost the most in production.

Custom code from an older system may also need fixing for HANA: code that relies on the implicit sort order of `SELECT` without `ORDER BY` is the classic example. The ABAP Test Cockpit has a check variant for this (see [code quality](./0107-code-quality.en.md)).

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that reads all bookings from `SBOOK` and computes, in ABAP, the number of bookings and the total `LOCCURAM` per airline.
> 2. Rewrite it with a single `SELECT` that does the aggregation in the database.
> 3. Compare the two versions in `ST05`: how many rows does each one transfer?

### Solution

```abap
SELECT FROM sbook
  FIELDS carrid,
         loccurkey,
         COUNT( * )       AS bookings,
         SUM( loccuram )  AS total
  WHERE cancelled = @abap_false
  GROUP BY carrid, loccurkey
  ORDER BY carrid
  INTO TABLE @DATA(lt_totals).
```

The ABAP version transfers one row per booking; this one transfers one row per airline and currency.

> [!NOTE]
>
> - SAP HANA is in-memory and column-oriented: aggregates and calculations are fast in the database.
> - Code pushdown moves data-intensive work to the database, so only the result reaches the application server.
> - Use ABAP SQL first, then CDS view entities for reusable models, then AMDP only when you need SQLScript.
> - Push down work on many rows; keep business decisions in ABAP.
> - Measure before and after with `ST05`, `SAT`, and `SQLM`.
