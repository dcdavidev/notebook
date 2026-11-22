---
title: Filling internal tables
description: APPEND, INSERT, VALUE, and BASE.
---

_Basic level_

There are several ways to put rows into an internal table. `APPEND` and `INSERT` add rows one at a time or copy them from another table. The `VALUE` operator builds a whole table in one expression, and `BASE` keeps the rows that are already there.

Which one you use depends on the [table category](./0034-table-categories.md) and on where the rows come from. All the examples use this row type:

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
```

## APPEND: add at the end

`APPEND` adds a row at the end of a standard table. The new row's number is in `sy-tabix`.

```abap
DATA lt_flights TYPE tt_flights.
DATA ls_flight  TYPE ty_flight.

ls_flight-carrid = 'LH'.
ls_flight-connid = '0400'.
ls_flight-price  = 650.
APPEND ls_flight TO lt_flights.

APPEND INITIAL LINE TO lt_flights.            " adds an empty row

DATA lt_more TYPE tt_flights.
APPEND LINES OF lt_more TO lt_flights.        " copies all rows of lt_more
APPEND LINES OF lt_more FROM 2 TO 3 TO lt_flights. " only rows 2 to 3
```

`APPEND INITIAL LINE ... ASSIGNING` adds an empty row and lets you fill it in place, without a work area. You'll see it in [field symbols](./0041-field-symbols.md).

## INSERT: add by key or at a position

`INSERT ... INTO TABLE` adds a row according to the table's primary key. It works with every category, so it's the safe choice for sorted and hashed tables:

```abap
DATA lt_sorted TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.

ls_flight-carrid = 'AZ'.
ls_flight-connid = '0555'.
ls_flight-price  = 180.
INSERT ls_flight INTO TABLE lt_sorted.        " goes to its sorted position
IF sy-subrc = 4.
  WRITE / 'This connection is already in the table'.
ENDIF.
```

| Table category  | What `INSERT ... INTO TABLE` does                                |
| --------------- | ---------------------------------------------------------------- |
| standard        | appends the row at the end, like `APPEND`                        |
| sorted          | puts the row at its place in the key order                       |
| hashed          | stores the row by its key                                        |
| any, unique key | if the key already exists, adds nothing and sets `sy-subrc` to 4 |

`INSERT ... INTO itab INDEX n` puts the row at a given position of a standard table; the rows after it move down by one. `INSERT LINES OF` copies the rows of another table.

```abap
INSERT ls_flight INTO lt_flights INDEX 1.     " becomes the first row
INSERT LINES OF lt_more INTO TABLE lt_sorted. " each row by key
```

> [!WARNING]
> `APPEND` on a sorted table must keep the sort order, and `APPEND` of a duplicate key on a sorted table with a unique key causes a runtime error. `INSERT ... INTO TABLE` never breaks the order: use it for sorted and hashed tables.

## VALUE: build a table in one expression

The **`VALUE` operator** builds a table from a list of rows. Each row goes in its own parentheses:

```abap
DATA(lt_new) = VALUE tt_flights(
  ( carrid = 'LH' connid = '0400' price = 650 )
  ( carrid = 'AZ' connid = '0555' price = 180 )
  ( carrid = 'AA' connid = '0017' price = 420 ) ).

lt_flights = VALUE #( ( carrid = 'UA' connid = '0941' price = 900 ) ).
```

- `VALUE tt_flights( ... )` names the type. With `VALUE #( ... )` the type comes from the target variable.
- Fields you don't name stay initial.
- `VALUE` **replaces** the whole content of the target: after the last statement, `lt_flights` has only one row.
- `( LINES OF lt_more )` inside `VALUE` copies the rows of another table.

When many rows share a value, write it once before the rows:

```abap
lt_flights = VALUE #( carrid = 'LH'
                      ( connid = '0400' price = 650 )
                      ( connid = '0402' price = 700 ) ).
```

`VALUE` is one of the constructor expressions; you'll see the others in [constructor expressions](./0091-constructor-expressions.md), and how to build rows from another table with `FOR` in [FOR and REDUCE](./0093-for-and-reduce.md).

## BASE: keep the existing rows

To add rows with `VALUE` without losing the ones you have, start with `BASE`:

```abap
lt_flights = VALUE #( BASE lt_flights
                      ( carrid = 'AF' connid = '0820' price = 300 )
                      ( LINES OF lt_more ) ).
```

`BASE lt_flights` first copies the current rows, then the new ones are added at the end (for a standard table) or by key (for sorted and hashed tables).

> [!TIP]
> `VALUE` without `BASE` is like writing a shopping list on a new sheet. `VALUE` with `BASE` is like adding items at the bottom of the list you already have.

## Exercise

> [!IMPORTANT]
>
> 1. Use `VALUE` to fill a table with two Lufthansa connections, `0400` and `0402`, writing `carrid` only once.
> 2. Add a third connection `AZ 0555` with `BASE`, then print the number of rows.

### Solution

```abap
TYPES: BEGIN OF ty_conn,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
       END OF ty_conn.
TYPES tt_conns TYPE STANDARD TABLE OF ty_conn WITH EMPTY KEY.

DATA(lt_conns) = VALUE tt_conns( carrid = 'LH'
                                 ( connid = '0400' )
                                 ( connid = '0402' ) ).

lt_conns = VALUE #( BASE lt_conns ( carrid = 'AZ' connid = '0555' ) ).

DATA(lv_lines) = lines( lt_conns ).
WRITE: / 'Rows:', lv_lines.   " 3
```

> [!NOTE]
>
> - `APPEND` adds a row at the end of a standard table; `APPEND LINES OF` copies rows from another table.
> - `INSERT ... INTO TABLE` adds by key and works for every category; use it for sorted and hashed tables.
> - With a unique key, a duplicate isn't inserted and `sy-subrc` is 4.
> - `VALUE #( ( ... ) ( ... ) )` builds a whole table and replaces the old content.
> - `BASE` keeps the existing rows and adds the new ones.
