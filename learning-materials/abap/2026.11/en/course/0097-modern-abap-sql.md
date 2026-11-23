---
title: Modern ABAP SQL
description: Host variables, inline declarations, SQL expressions, and CASE.
level: intermediate
---

Since ABAP 7.40 SP05, ABAP SQL has a new, stricter syntax. It marks every ABAP variable with `@`, separates fields with commas, declares the target table inline, and lets the database calculate values with **SQL expressions** instead of loops in ABAP.

You already know `SELECT`, `WHERE`, joins, and aggregates from the [basic level](./0052-select-basics.md). This lesson shows how the same queries look in modern code, and what you can now push to the database.

## The new syntax at a glance

```abap
DATA lv_carrid TYPE s_carr_id VALUE 'LH'.

* Old style: no commas, no @, target declared in advance
DATA lt_old TYPE STANDARD TABLE OF spfli.
SELECT carrid connid cityfrom cityto
  FROM spfli
  INTO CORRESPONDING FIELDS OF TABLE lt_old
  WHERE carrid = lv_carrid.

* Modern style
SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  WHERE carrid = @lv_carrid
  ORDER BY connid
  INTO TABLE @DATA(lt_connections).
```

The rules of the new syntax:

- A **host variable** is an ABAP data object used inside SQL. It gets the escape character `@`: `@lv_carrid`, `@abap_true`, `@DATA(...)`. Everything without `@` is a column or an SQL keyword.
- The fields in the list are separated by commas.
- The `INTO` clause comes last, after `WHERE`, `GROUP BY`, and `ORDER BY`.
- `INTO TABLE @DATA(lt_x)` declares the target inline. Its row type has exactly the fields of the list, with the names you give them.

As soon as you use one of these features, the compiler switches to **strict mode** and requires all the others in the same statement. Mixing old and new style in one `SELECT` is a syntax error.

> [!TIP]
> The `@` is like the label "from my desk" on a sheet you hand to a colleague in the archive: anything with the label comes from you, everything else they look up in their own files.

## FIELDS: FROM first

You can also write the `FROM` clause first and list the columns after the keyword `FIELDS`. ADT can then suggest the column names, because it already knows the table.

```abap
SELECT FROM sflight
  FIELDS carrid, connid, fldate, price, currency
  WHERE carrid = @lv_carrid
    AND fldate >= @sy-datum
  INTO TABLE @DATA(lt_flights)
  UP TO 50 ROWS.
```

`SELECT SINGLE` works the same way, with `INTO @DATA(ls_x)` for a structure or `INTO @DATA(lv_x)` for a single column:

```abap
SELECT SINGLE FROM scarr
  FIELDS carrname
  WHERE carrid = @lv_carrid
  INTO @DATA(lv_carrname).
```

## SQL expressions

In the field list, the `WHERE` clause, and other places, you can write expressions that the database evaluates row by row. Give every calculated column an alias with `AS`, so the inline target gets a readable name.

```abap
SELECT FROM sflight
  FIELDS carrid,
         connid,
         fldate,
         seatsmax - seatsocc                     AS seats_free,
         price * @lv_factor                      AS price_new,
         carrid && '-' && connid                 AS flight_key,
         CAST( seatsocc AS FLTP ) / CAST( seatsmax AS FLTP ) * 100
                                                 AS occupancy,
         @sy-uname                               AS read_by
  WHERE carrid = @lv_carrid
  INTO TABLE @DATA(lt_stats).
```

Declare `lv_factor` before the query, for example `DATA lv_factor TYPE p LENGTH 3 DECIMALS 2 VALUE '1.10'`.

| Kind              | Examples                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Arithmetic        | `+`, `-`, `*`, `/` (floating point only), `div( a, b )`, `mod( a, b )`                                |
| String            | `&&`, `concat( a, b )`, `upper( )`, `lower( )`, `substring( s, pos, len )`, `length( )`, `replace( )` |
| Numeric functions | `abs( )`, `ceil( )`, `floor( )`, `round( x, n )`                                                      |
| Type conversion   | `CAST( x AS type )`                                                                                   |
| Null handling     | `coalesce( a, b )`: the first value that isn't null                                                   |
| Host values       | `@lv_value`, `@( expression )` for an ABAP expression                                                 |

> [!WARNING]
> The operator `/` works only with floating-point operands. For integers use `div( )`; for decimals, cast to `FLTP` or `DEC` first. Otherwise the syntax check rejects the statement.

## CASE in SQL

`CASE` returns a value that depends on conditions, like [`COND` and `SWITCH`](./0092-cond-and-switch.md) in ABAP. The **simple case** compares one operand with values; the **searched case** checks full conditions.

```abap
SELECT FROM sflight
  FIELDS carrid,
         connid,
         fldate,
         CASE carrid
           WHEN 'LH' THEN 'Lufthansa'
           WHEN 'AZ' THEN 'Alitalia'
           ELSE 'Other'
         END AS carrier_text,
         CASE
           WHEN seatsocc >= seatsmax          THEN 'FULL'
           WHEN seatsocc * 10 >= seatsmax * 8 THEN 'ALMOST FULL'
           ELSE 'AVAILABLE'
         END AS status
  WHERE fldate >= @sy-datum
  INTO TABLE @DATA(lt_status).
```

Every branch must return a compatible type. Without `ELSE`, rows that match no branch get the null value, which becomes the initial value in the ABAP target.

## Exercise

> [!IMPORTANT]
>
> 1. Read all flights of one airline from `SFLIGHT` with the modern syntax and an inline target table.
> 2. Add a column `revenue` calculated as `price * seatsocc` and a column `load_class` that is `'HIGH'` if more than 80% of the seats are taken, `'LOW'` otherwise.
> 3. Show the result with `cl_demo_output=>display( )`.

### Solution

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT FROM sflight
    FIELDS carrid, connid, fldate,
           price * seatsocc AS revenue,
           CASE WHEN seatsocc * 10 > seatsmax * 8 THEN 'HIGH'
                ELSE 'LOW'
           END AS load_class
    WHERE carrid = @p_carrid
    ORDER BY fldate
    INTO TABLE @DATA(lt_result).

  cl_demo_output=>display( lt_result ).
```

> [!NOTE]
>
> - Host variables start with `@`; fields are separated by commas; `INTO` goes last.
> - `INTO TABLE @DATA(...)` declares the target inline with the fields of the list.
> - `SELECT FROM ... FIELDS ...` puts the source first and helps code completion.
> - SQL expressions (arithmetic, strings, `CAST`, `coalesce`) let the database calculate values.
> - `CASE` returns a value per row; give every calculated column an alias with `AS`.
