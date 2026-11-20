---
title: WHERE and ORDER BY
description: Filter and sort the rows the database returns.
---

_Basic level_

The `WHERE` clause tells the database which rows you want; the `ORDER BY` clause tells it in which order to return them. Both run on the database, before any data reaches your program.

Filtering on the database is the most important rule for fast ABAP: read only the rows you need, instead of reading everything and deleting rows in ABAP.

## Comparisons in WHERE

A `WHERE` clause is a logical expression on the columns of the data source. You compare a column with a literal, with an ABAP variable (with `@`), or with another column.

```abap
REPORT zwhere_demo.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, price, seatsmax, seatsocc
    FROM sflight
    WHERE carrid = @p_carr
      AND price < 1000
      AND seatsocc < seatsmax             " column compared with a column
    INTO TABLE @DATA(lt_flights).

  WRITE: / sy-dbcnt, 'flights with free seats under 1000'.
```

The comparison operators are the same as in ABAP:

| Operator | Alternative | Meaning               |
| -------- | ----------- | --------------------- |
| `=`      | `EQ`        | equal                 |
| `<>`     | `NE`        | not equal             |
| `<`      | `LT`        | less than             |
| `>`      | `GT`        | greater than          |
| `<=`     | `LE`        | less than or equal    |
| `>=`     | `GE`        | greater than or equal |

Combine conditions with `AND`, `OR`, and `NOT`, and use parentheses to make the grouping explicit. `AND` binds more strongly than `OR`, just like in [IF](./0024-if-and-logical-expressions.en.md).

```abap
SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  WHERE ( cityfrom = 'FRANKFURT' OR cityfrom = 'ROME' )
    AND carrid = 'LH'
  INTO TABLE @DATA(lt_conn).
```

> [!WARNING]
> Without the parentheses, the condition above means "from Frankfurt, or from Rome with Lufthansa": you'd also get flights from Frankfurt of every other airline. When you mix `AND` and `OR`, always add parentheses.

## BETWEEN, IN, LIKE, and IS NULL

ABAP SQL has more predicates for common filters:

```abap
DATA lv_from TYPE d VALUE '20250101'.
DATA lv_to   TYPE d VALUE '20251231'.

SELECT carrid, connid, fldate
  FROM sflight
  WHERE fldate BETWEEN @lv_from AND @lv_to        " limits included
    AND carrid IN ( 'AA', 'LH', 'UA' )            " one of a list
  INTO TABLE @DATA(lt_year).

SELECT carrid, carrname
  FROM scarr
  WHERE carrname LIKE 'A%'                        " starts with A
  INTO TABLE @DATA(lt_a_airlines).
```

- `BETWEEN a AND b` includes both limits.
- `IN ( ... )` checks a list of values. With a **range table** instead of a list, `IN @range` lets the user decide the filter: see [SELECT-OPTIONS and ranges](./0064-select-options-and-ranges.en.md).
- `LIKE` compares with a pattern: `%` matches any sequence of characters, `_` matches exactly one character. The comparison is case-sensitive.
- `IS NULL` and `IS NOT NULL` check for the database null value. Columns of a normal table are rarely null, but you'll meet nulls with [outer joins](./0055-joins.en.md).

To negate a predicate, put `NOT` in front of the keyword: `NOT BETWEEN`, `NOT IN`, `NOT LIKE`, `IS NOT NULL`.

> [!TIP]
> `LIKE 'A%'` works like a wildcard search in a file manager: `A*` finds every file that starts with A. In SQL the joker is `%` instead of `*`, and `_` stands for a single letter, like `?`.

## Sorting with ORDER BY

Without `ORDER BY`, the database returns rows in whatever order is quickest for it. That order can change between runs, systems, and releases, so never rely on it.

```abap
SELECT carrid, connid, fldate, price
  FROM sflight
  WHERE carrid = 'LH'
  ORDER BY fldate DESCENDING, connid ASCENDING
  INTO TABLE @DATA(lt_sorted).
```

- List one or more columns, separated by commas.
- `ASCENDING` is the default; `DESCENDING` reverses the order. Each column has its own direction.
- `ORDER BY PRIMARY KEY` sorts by the key fields of the table.

You can also sort the internal table in ABAP with `SORT` (see [Sorting, summing, and removing duplicates](./0040-sorting-and-duplicates.en.md)). Sort on the database when you also need `UP TO n ROWS`, because the limit applies after the sort.

## Where to put each clause

In modern syntax the clauses follow this order. The `INTO` clause can also come right after the select list, but putting it at the end is the modern style.

```abap
SELECT carrid, connid, fldate          " 1. select list
  FROM sflight                         " 2. data source
  WHERE carrid = @p_carr               " 3. filter
  ORDER BY fldate DESCENDING           " 4. sort
  INTO TABLE @DATA(lt_result)          " 5. target
  UP TO 10 ROWS.                       " 6. limit
```

## Exercise

> [!IMPORTANT]
>
> 1. Read all connections in `SPFLI` that depart from Frankfurt or New York and last more than 6 hours (`FLTIME` is in minutes), sorted by departure city and then by duration, longest first.
> 2. Read the airlines in `SCARR` whose name contains "Air" anywhere.

### Solution

```abap
REPORT zwhere_exercise.

SELECT carrid, connid, cityfrom, cityto, fltime
  FROM spfli
  WHERE ( cityfrom = 'FRANKFURT' OR cityfrom = 'NEW YORK' )
    AND fltime > 360
  ORDER BY cityfrom, fltime DESCENDING
  INTO TABLE @DATA(lt_long).

LOOP AT lt_long INTO DATA(ls_long).
  WRITE: / ls_long-cityfrom, ls_long-cityto, ls_long-carrid, ls_long-connid, ls_long-fltime.
ENDLOOP.

SELECT carrid, carrname
  FROM scarr
  WHERE carrname LIKE '%Air%'
  INTO TABLE @DATA(lt_air).

LOOP AT lt_air INTO DATA(ls_air).
  WRITE: / ls_air-carrid, ls_air-carrname.
ENDLOOP.
```

City names in `SPFLI` are stored in uppercase, so compare them in uppercase.

> [!NOTE]
>
> - `WHERE` filters rows on the database: read only what you need.
> - Use `@` for ABAP variables; compare columns with literals, variables, or other columns.
> - Add parentheses whenever you mix `AND` and `OR`.
> - `BETWEEN`, `IN`, `LIKE`, and `IS NULL` cover the most common filters; `LIKE` is case-sensitive.
> - Without `ORDER BY` the order of the rows isn't defined.
