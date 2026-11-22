---
title: Data references
description: REF TO, GET REFERENCE, the dereference operator, and REFERENCE INTO.
---

_Basic level_

A **data reference** is a variable that holds the address of a data object. Like a [field symbol](./0041-field-symbols.md), it lets you work on the original data without copying it. Unlike a field symbol, a reference is a normal variable: you can store it in a structure or a table, pass it to a method, and check whether it's set.

Data references are also the basis for creating data objects while the program runs, and they're used everywhere in object-oriented ABAP.

## Declare and point to data

A reference variable is declared with `TYPE REF TO`. You make it point to a data object with `GET REFERENCE OF` or, in modern code, with the `REF` operator:

```abap
DATA lv_seats TYPE s_seatsocc VALUE 120.

DATA lr_seats TYPE REF TO s_seatsocc.     " can point to an s_seatsocc

GET REFERENCE OF lv_seats INTO lr_seats.  " classic form
lr_seats = REF #( lv_seats ).             " modern form, same result

DATA(lr_inline) = REF #( lv_seats ).      " inline: type REF TO s_seatsocc
```

`REF #( )` is one of the constructor expressions; the others are in [constructor expressions](./0091-constructor-expressions.md).

A reference that points to nothing is **initial**. `IS BOUND` tells you whether it points to a valid data object:

```abap
DATA lr_empty TYPE REF TO s_seatsocc.
IF lr_empty IS NOT BOUND.
  WRITE / 'No data behind this reference'.
ENDIF.
```

## The dereference operator

To reach the data behind a reference, use the **dereference operator** `->*`. For structures, `->` reaches a single component:

```abap
lr_seats->* = 150.               " changes lv_seats
WRITE / lv_seats.                " 150

DATA ls_flight TYPE sflight.
DATA(lr_flight) = REF #( ls_flight ).
lr_flight->carrid = 'LH'.        " component of the structure ls_flight
lr_flight->connid = '0400'.
```

> [!WARNING]
> Dereferencing a reference that isn't bound stops the program with a runtime error. Check `IS BOUND` when you're not sure the reference has been set.

> [!TIP]
> A data reference is a house address written on a card. The card isn't the house, but with it you can go to the house and change things there. You can copy the card, put it in a folder, or give it to a friend, and everyone with a copy reaches the same house.

## REFERENCE INTO with internal tables

`LOOP AT`, `READ TABLE`, and `APPEND` can give you a reference to the row instead of a copy:

```abap
TYPES tt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
DATA lt_flights TYPE tt_flights.

APPEND VALUE #( carrid = 'LH' connid = '0400' seatsocc = 120 ) TO lt_flights.
APPEND VALUE #( carrid = 'AZ' connid = '0555' seatsocc = 80 ) TO lt_flights.

LOOP AT lt_flights REFERENCE INTO DATA(lr_row).
  lr_row->seatsocc = lr_row->seatsocc + 1.   " changes the row in the table
ENDLOOP.

READ TABLE lt_flights REFERENCE INTO lr_row WITH KEY carrid = 'AZ'.
IF sy-subrc = 0.
  WRITE / lr_row->seatsocc.                  " 81
ENDIF.
```

Because a reference is a value, you can collect references to rows in another table, for example to build a short list of the rows you want to process later:

```abap
DATA lt_full TYPE STANDARD TABLE OF REF TO sflight WITH EMPTY KEY.

LOOP AT lt_flights REFERENCE INTO lr_row WHERE seatsocc > 100.
  APPEND lr_row TO lt_full.                  " a reference, not a copy
ENDLOOP.
```

## Anonymous data and generic references

A reference can also point to a data object that has no name, created while the program runs. You create it with `NEW` or with `CREATE DATA`:

```abap
DATA(lr_count) = NEW i( 10 ).               " a new integer with value 10
lr_count->* = lr_count->* + 1.

DATA lr_any TYPE REF TO data.               " generic: can point to any type
CREATE DATA lr_any TYPE s_carr_id.
ASSIGN lr_any->* TO FIELD-SYMBOL(<lv_any>). " use a field symbol to work on it
<lv_any> = 'LH'.
```

`TYPE REF TO data` is a **generic** reference. The type of the data behind it isn't known when the program is checked, so the usual way to work with it is to assign it to a field symbol first. Creating types and data at runtime is covered in [dynamic data objects](./0116-dynamic-data.md).

| Field symbol               | Data reference                         |
| -------------------------- | -------------------------------------- |
| a name, `<ls_row>`         | a variable, `lr_row`                   |
| can't be stored in a table | can be stored in tables and structures |
| `IS ASSIGNED`              | `IS BOUND`                             |
| used as the data directly  | needs `->*` or `->comp`                |

## Exercise

> [!IMPORTANT]
>
> 1. Declare a variable `lv_price TYPE s_price` with value 100 and a reference `lr_price` to it with `REF #( )`.
> 2. Increase the price by 20 through the reference and print `lv_price`.
> 3. Declare a second reference without assigning it, and print a message if it isn't bound.

### Solution

```abap
DATA lv_price TYPE s_price VALUE 100.
DATA(lr_price) = REF #( lv_price ).

lr_price->* = lr_price->* + 20.
WRITE / lv_price.                 " 120

DATA lr_other TYPE REF TO s_price.
IF lr_other IS NOT BOUND.
  WRITE / 'lr_other points to nothing'.
ENDIF.
```

> [!NOTE]
>
> - A data reference (`TYPE REF TO`) holds the address of a data object; it's a normal variable.
> - Point it to data with `REF #( )` or `GET REFERENCE OF`; create new data with `NEW` or `CREATE DATA`.
> - `->*` reaches the whole data object, `->comp` a component of a structure.
> - `LOOP AT`, `READ TABLE`, and `APPEND` support `REFERENCE INTO` to work on rows without copying them.
> - Check `IS BOUND` before dereferencing; a generic `REF TO data` needs a field symbol to be used.
