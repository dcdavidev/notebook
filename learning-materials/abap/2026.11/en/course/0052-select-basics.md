---
title: Reading data with SELECT
description: 'Your first ABAP SQL queries: fields, INTO, and sy-subrc.'
---

_Basic level_

**ABAP SQL** is the part of the ABAP language that reads and writes database tables. It looks like standard SQL, but it's checked by the ABAP compiler and works the same way on every database SAP supports. The most important statement is `SELECT`: it reads rows from the database into variables and internal tables.

Almost every program you'll write starts with a `SELECT`. This lesson shows the basic form: which columns to read, where to put the result, and how to know whether you found anything.

## Your first SELECT

This report reads all airlines from `SCARR` into an internal table and prints them:

```abap
REPORT zselect_demo.

SELECT carrid, carrname, currcode
  FROM scarr
  INTO TABLE @DATA(lt_carriers).

LOOP AT lt_carriers INTO DATA(ls_carrier).
  WRITE: / ls_carrier-carrid, ls_carrier-carrname, ls_carrier-currcode.
ENDLOOP.
```

The parts of the statement:

| Part                      | Meaning                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `SELECT carrid, carrname` | the **select list**: the columns to read, separated by commas  |
| `FROM scarr`              | the **data source**: a database table, a view, or a CDS entity |
| `INTO TABLE @DATA(...)`   | the **target**: here a new internal table declared inline      |

The `@` in front of `DATA(...)` marks an ABAP variable, called a **host variable**, so the compiler can tell it apart from a database column. Use it for every ABAP variable in a `SELECT`. [Modern ABAP SQL](./0097-modern-abap-sql.md) covers host variables and SQL expressions in depth.

You don't write the client: ABAP SQL reads only the rows of your current client and fills the `MANDT` condition automatically.

> [!TIP]
> A `SELECT` is like an order at a deli counter. You say which items you want (the select list), from which counter (`FROM`), and hold out your tray (`INTO`). The clerk fills the tray: you don't walk behind the counter and pick things yourself.

## Choosing the columns

`SELECT *` reads every column. It's handy, but it moves more data than you need, especially on wide tables. Name the columns you use.

```abap
* All columns: the row type is SCARR
SELECT * FROM scarr INTO TABLE @DATA(lt_all).

* Only two columns: the row type has just CARRID and CARRNAME
SELECT carrid, carrname FROM scarr INTO TABLE @DATA(lt_names).
```

If you already have a target table with a different structure, `INTO CORRESPONDING FIELDS OF TABLE` copies each column into the component with the same name and ignores the others:

```abap
TYPES: BEGIN OF ty_carrier,
         carrid   TYPE s_carr_id,
         carrname TYPE s_carrname,
         url      TYPE s_carrurl,
       END OF ty_carrier.

DATA lt_carriers TYPE STANDARD TABLE OF ty_carrier WITH EMPTY KEY.

SELECT carrid, carrname
  FROM scarr
  INTO CORRESPONDING FIELDS OF TABLE @lt_carriers.   " URL stays empty
```

`INTO TABLE` replaces the contents of the target. To add the rows to what's already there, use `APPENDING TABLE` instead.

Since ABAP 7.50 you can also write the `FROM` clause first and the columns after `FIELDS`. The result is the same, but ADT can then propose the column names as you type:

```abap
SELECT FROM scarr
  FIELDS carrid, carrname
  INTO TABLE @DATA(lt_carriers2).
```

## `sy-subrc` and `sy-dbcnt`

After every `SELECT`, the runtime sets two [system fields](./0023-system-fields.md):

- `sy-subrc` is `0` if at least one row was read, and `4` if none was.
- `sy-dbcnt` holds the number of rows read.

```abap
SELECT carrid, carrname
  FROM scarr
  INTO TABLE @DATA(lt_found).

IF sy-subrc = 0.
  WRITE: / sy-dbcnt, 'airlines found'.
ELSE.
  WRITE: / 'No airlines found. Generate the data with SAPBC_DATA_GENERATOR.'.
ENDIF.
```

With `INTO TABLE`, you can also check `lt_found IS INITIAL`: an empty result leaves an empty table.

## SELECT loops and older syntax

Without `TABLE`, a `SELECT` is a loop: it reads one row at a time into a structure and runs the code up to `ENDSELECT` for each row.

```abap
SELECT carrid, carrname
  FROM scarr
  INTO @DATA(ls_carrier).
  WRITE: / ls_carrier-carrid, ls_carrier-carrname.
ENDSELECT.
```

> [!WARNING]
> Avoid `SELECT ... ENDSELECT` loops. They keep the database cursor open while your code runs, and they tempt you to put more `SELECT` statements inside the loop. Read everything into an internal table with `INTO TABLE`, then `LOOP AT` it.

In older programs you'll find the same statements without commas and without `@`:

```abap
DATA lt_old TYPE STANDARD TABLE OF scarr.
SELECT carrid carrname FROM scarr INTO CORRESPONDING FIELDS OF TABLE lt_old.  " old style
```

This syntax still works, but you can't mix it with inline declarations or other modern features. Write new code with commas and `@`.

## Exercise

> [!IMPORTANT]
>
> 1. Read the columns `CARRID`, `CONNID`, `CITYFROM`, and `CITYTO` of all connections in `SPFLI` into an inline internal table.
> 2. Print the number of rows read, then one line per connection. If nothing was found, print a message instead.

### Solution

```abap
REPORT zselect_spfli.

SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  INTO TABLE @DATA(lt_connections).

IF sy-subrc <> 0.
  WRITE: / 'No connections found.'.
  RETURN.
ENDIF.

WRITE: / sy-dbcnt, 'connections'.
LOOP AT lt_connections INTO DATA(ls_connection).
  WRITE: / ls_connection-carrid, ls_connection-connid,
           ls_connection-cityfrom, ls_connection-cityto.
ENDLOOP.
```

> [!NOTE]
>
> - `SELECT columns FROM source INTO target` reads data; ABAP SQL handles the client for you.
> - Separate the columns with commas and put `@` in front of every ABAP variable.
> - Name the columns you need instead of `SELECT *`.
> - `sy-subrc = 0` means rows were found; `sy-dbcnt` holds how many.
> - Prefer `INTO TABLE` and a `LOOP AT` to a `SELECT ... ENDSELECT` loop.
