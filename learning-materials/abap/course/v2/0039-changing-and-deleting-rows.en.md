---
title: Changing and deleting rows
description: MODIFY, DELETE, and CLEAR, FREE, REFRESH on whole tables.
---

_Basic level_

Once a table is filled, you often need to change some rows or remove them. `MODIFY` overwrites rows with the content of a work area, and `DELETE` removes rows by index, by key, or by condition. To empty a whole table, you use `CLEAR` or `FREE`.

The examples use this table:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         price    TYPE s_price,
         currency TYPE s_currcode,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AZ' connid = '0555' price = 180 currency = 'EUR' )
  ( carrid = 'LH' connid = '0400' price = 650 currency = 'EUR' )
  ( carrid = 'LH' connid = '0402' price = 700 currency = 'EUR' )
  ( carrid = 'AA' connid = '0017' price = 420 currency = 'USD' ) ).
```

## MODIFY

`MODIFY` copies a work area into one or more rows. You choose the rows by index, by key, or with a condition:

```abap
DATA ls_flight TYPE ty_flight.

" By index: overwrite row 1
ls_flight = VALUE #( carrid = 'AZ' connid = '0555' price = 199 currency = 'EUR' ).
MODIFY lt_flights FROM ls_flight INDEX 1.

" Only some fields: the other fields of row 2 stay as they are
ls_flight-price = 600.
MODIFY lt_flights FROM ls_flight INDEX 2 TRANSPORTING price.

" All rows that match a condition
ls_flight-currency = 'USD'.
MODIFY lt_flights FROM ls_flight TRANSPORTING currency WHERE carrid = 'LH'.
```

For tables with a primary key (sorted, hashed, or standard with a key), `MODIFY TABLE` finds the row by the key values in the work area:

```abap
DATA lt_sorted TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.
lt_sorted = lt_flights.

ls_flight = VALUE #( carrid = 'AA' connid = '0017' price = 399 currency = 'USD' ).
MODIFY TABLE lt_sorted FROM ls_flight.      " changes the row AA 0017
IF sy-subrc <> 0.
  WRITE / 'No row with this key'.
ENDIF.
```

`MODIFY` sets `sy-subrc` to 0 if at least one row changed, 4 otherwise. Inside a `LOOP AT ... INTO`, `MODIFY lt_flights FROM ls_flight` without `INDEX` changes the current row.

You can also assign a value to a table expression, which changes the row in place:

```abap
lt_flights[ carrid = 'LH' connid = '0402' ]-price = 720.
```

> [!WARNING]
> The key fields of a sorted or hashed table can't be changed with `MODIFY`: only the non-key fields are copied, or you get an error. To change a key, delete the row and insert a new one.

The most common way to change rows in a loop is a field symbol, which changes the row directly without `MODIFY`: see [field symbols](./0041-field-symbols.en.md).

## DELETE

`DELETE` removes rows. Like `MODIFY`, it works by index, by key, or by condition:

```abap
DELETE lt_flights INDEX 1.                            " row 1
DELETE lt_flights WHERE currency = 'USD'.             " all USD rows
DELETE TABLE lt_sorted WITH TABLE KEY carrid = 'AZ' connid = '0555'. " by key
DELETE TABLE lt_sorted FROM ls_flight.                " by the key in ls_flight
DELETE lt_flights FROM 2 TO 3.                        " rows 2 to 3
```

After a `DELETE`, the rows below move up, so the row numbers change. `sy-subrc` is 0 if at least one row was deleted.

> [!WARNING]
> Deleting rows inside a `LOOP` over the same table is allowed for the current row, but it's easy to get wrong and slow on big tables. Prefer a single `DELETE ... WHERE` after the loop, or before it.

## Emptying a whole table

| Statement           | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `CLEAR itab`        | deletes all rows; keeps the initial memory for new rows         |
| `FREE itab`         | deletes all rows and releases all the memory                    |
| `REFRESH itab`      | obsolete: same as `CLEAR itab` for tables without a header line |
| `itab = VALUE #( )` | same as `CLEAR itab`                                            |

```abap
CLEAR lt_flights.
IF lt_flights IS INITIAL.
  WRITE / 'The table is empty'.
ENDIF.
```

Use `CLEAR` when you'll fill the table again, and `FREE` when you're done with a big table and want the memory back. `REFRESH` is obsolete: you'll see it in old code, often next to tables with a header line, where `CLEAR itab` would clear only the header line.

> [!CAUTION]
> `DELETE itab WHERE ...` with a wrong condition, or `CLEAR` on the wrong table, removes the rows for good: an internal table has no undo. If you still need the original rows, copy the table first (`DATA(lt_backup) = lt_flights.`).

> [!TIP]
> `CLEAR` is like wiping a whiteboard: the board stays on the wall, ready to use. `FREE` is like taking the board down and giving it back.

## Exercise

> [!IMPORTANT]
>
> 1. With the table `lt_flights` from this lesson, raise the price of `LH 0400` to 680 with `MODIFY ... TRANSPORTING`.
> 2. Delete all the American Airlines (`AA`) rows with one statement, then print the number of rows left.

### Solution

```abap
DATA(ls_change) = VALUE ty_flight( price = 680 ).
MODIFY lt_flights FROM ls_change TRANSPORTING price
       WHERE carrid = 'LH' AND connid = '0400'.

DELETE lt_flights WHERE carrid = 'AA'.

DATA(lv_lines) = lines( lt_flights ).
WRITE: / 'Rows left:', lv_lines.   " 3
```

> [!NOTE]
>
> - `MODIFY itab FROM wa INDEX n` changes a row by index; `MODIFY TABLE itab FROM wa` changes it by key.
> - `TRANSPORTING` limits the change to some fields; `WHERE` changes all the matching rows.
> - Key fields of sorted and hashed tables can't be changed.
> - `DELETE` removes rows by `INDEX`, by key (`DELETE TABLE`), by range, or with `WHERE`.
> - `CLEAR` empties a table, `FREE` also releases its memory, and `REFRESH` is obsolete.
