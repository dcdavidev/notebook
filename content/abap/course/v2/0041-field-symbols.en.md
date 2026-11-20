---
title: Field symbols
description: Work directly on a row or a variable without copying it.
---

_Basic level_

A **field symbol** is a placeholder name for a data object that already exists. It doesn't hold its own value: it points to another variable or to a row of a table, and everything you do with the field symbol happens directly on that data object.

With internal tables, field symbols let you read and change rows without copying them into a work area and back. That's shorter to write and faster on big tables.

## Declare and assign

A field symbol's name is always in angle brackets. You declare it with `FIELD-SYMBOLS` and connect it to a data object with `ASSIGN`:

```abap
DATA lv_price TYPE s_price VALUE 100.

FIELD-SYMBOLS <lv_price> TYPE s_price.

ASSIGN lv_price TO <lv_price>.
<lv_price> = 150.                 " changes lv_price

WRITE / lv_price.                 " 150
```

- `IS ASSIGNED` tells you whether the field symbol points to something: `IF <lv_price> IS ASSIGNED`.
- `UNASSIGN <lv_price>` removes the link; the variable itself doesn't change.
- `TYPE any` makes a **generic** field symbol that can point to data of any type. You'll use it in [dynamic data objects](./0116-dynamic-data.en.md).

> [!TIP]
> A work area is a photocopy of a page: you can write on it, but the book doesn't change until you glue the copy back in. A field symbol is your finger on the page of the book itself: whatever you write goes straight onto the page.

> [!WARNING]
> Using a field symbol that isn't assigned stops the program with the runtime error `GETWA_NOT_ASSIGNED`. After an `ASSIGN` or a `READ TABLE ... ASSIGNING` that may fail, check `sy-subrc` or `IS ASSIGNED` first.

## Field symbols in loops

`LOOP AT ... ASSIGNING` points the field symbol at each row in turn. A change to the field symbol is a change to the row, with no `MODIFY`:

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AZ' connid = '0555' price = 180 )
  ( carrid = 'LH' connid = '0400' price = 650 ) ).

" Raise every price by 10%
LOOP AT lt_flights ASSIGNING FIELD-SYMBOL(<ls_flight>).
  <ls_flight>-price = <ls_flight>-price * '1.1'.
ENDLOOP.
```

`FIELD-SYMBOL(<ls_flight>)` is an inline declaration, like `DATA(...)`: the field symbol gets the row type of the table. You can also declare it first with `FIELD-SYMBOLS <ls_flight> TYPE ty_flight` and write `ASSIGNING <ls_flight>`.

Compare it with the work-area version:

```abap
LOOP AT lt_flights INTO DATA(ls_flight).
  ls_flight-price = ls_flight-price * '1.1'.
  MODIFY lt_flights FROM ls_flight.        " needed to write the copy back
ENDLOOP.
```

## Single rows and new rows

`READ TABLE` and `APPEND` also work with field symbols:

```abap
READ TABLE lt_flights ASSIGNING FIELD-SYMBOL(<ls_lh>)
     WITH KEY carrid = 'LH' connid = '0400'.
IF sy-subrc = 0.
  <ls_lh>-price = 599.                     " changes the row in the table
ENDIF.

APPEND INITIAL LINE TO lt_flights ASSIGNING FIELD-SYMBOL(<ls_new>).
<ls_new>-carrid = 'AA'.                    " fills the new row in place
<ls_new>-connid = '0017'.
<ls_new>-price  = 420.
```

`ASSIGN` also works with a table expression. If the row doesn't exist, `ASSIGN` doesn't raise an exception: it sets `sy-subrc` to 4 and leaves the field symbol unchanged.

```abap
ASSIGN lt_flights[ carrid = 'UA' connid = '0941' ] TO FIELD-SYMBOL(<ls_ua>).
IF sy-subrc <> 0.
  WRITE / 'UA 0941 not found'.
ENDIF.
```

## Rules to remember

- On a sorted or hashed table, you can't change the key fields through a field symbol: the program stops with a runtime error.
- After `ENDLOOP`, the field symbol still points to the last row. Don't use it by mistake after the loop.
- If you delete the row a field symbol points to, the field symbol is no longer assigned.
- A field symbol is faster than `INTO` for wide rows and big tables, because nothing is copied. For a few small rows, both are fine.

The same "point instead of copy" idea, with a variable you can store and pass around, is a data reference: see [data references](./0042-data-references.en.md).

## Exercise

> [!IMPORTANT]
>
> 1. Fill a table of flights with three rows, two of them Lufthansa (`LH`).
> 2. With `LOOP AT ... ASSIGNING` and `WHERE`, give the Lufthansa flights a 50 discount on the price, without using `MODIFY`.
> 3. Print the table.

### Solution

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'LH' connid = '0400' price = 650 )
  ( carrid = 'LH' connid = '0402' price = 700 )
  ( carrid = 'AZ' connid = '0555' price = 180 ) ).

LOOP AT lt_flights ASSIGNING FIELD-SYMBOL(<ls_flight>) WHERE carrid = 'LH'.
  <ls_flight>-price = <ls_flight>-price - 50.
ENDLOOP.

LOOP AT lt_flights ASSIGNING <ls_flight>.
  WRITE: / <ls_flight>-carrid, <ls_flight>-connid, <ls_flight>-price.
ENDLOOP.
```

> [!NOTE]
>
> - A field symbol points to an existing data object; changes through it change the original.
> - Declare it with `FIELD-SYMBOLS <name> TYPE ...` or inline with `FIELD-SYMBOL(<name>)`, and connect it with `ASSIGN`.
> - `LOOP AT ... ASSIGNING` and `READ TABLE ... ASSIGNING` change rows in place, without `MODIFY`.
> - Using an unassigned field symbol causes `GETWA_NOT_ASSIGNED`: check `sy-subrc` or `IS ASSIGNED`.
> - Key fields of sorted and hashed tables can't be changed through a field symbol.
