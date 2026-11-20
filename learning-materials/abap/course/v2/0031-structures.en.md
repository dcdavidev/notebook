---
title: Structures
description: Group related fields into one data object.
---

_Basic level_

A flight isn't one value: it has an airline, a flight number, a date, a price, a number of seats. With the variables you know so far, you'd need five separate ones, and you'd have to pass all five around together. A **structure** groups related fields into a single data object, so you can handle "the flight" as one thing.

Structures are everywhere in ABAP: a row of a database table is a structure, a row of an internal table is a structure, and most method parameters are structures.

## Define a structure type

Use `TYPES` with `BEGIN OF` and `END OF`. Each field inside is a **component**:

```abap
REPORT zstructures_demo.

TYPES: BEGIN OF ty_flight,
         carrid    TYPE s_carr_id,       " airline
         connid    TYPE s_conn_id,       " flight number
         fldate    TYPE s_date,          " flight date
         price     TYPE s_price,         " ticket price
         seatsfree TYPE i,               " free seats
       END OF ty_flight.

DATA ls_flight TYPE ty_flight.
```

The colon and commas chain the statements, as you saw in [ABAP syntax rules](./0009-syntax-rules.en.md): `END OF ty_flight` closes the list. By convention, structure variables start with `ls_` (local structure).

You can also declare a structure variable directly with `DATA BEGIN OF`, without a type, but a named type is reusable and usually better.

> [!TIP]
> A structure is a paper form: one sheet with several labeled boxes (airline, flight, date, price). You fill in each box separately, but you file, copy, and hand over the whole sheet at once.

## Structures from the Dictionary

Every database table in the ABAP Dictionary is also a structure type. To get a structure with all the fields of a table, write its name after `TYPE`:

```abap
DATA ls_carrier TYPE scarr.     " MANDT, CARRID, CARRNAME, CURRCODE, URL
DATA ls_conn    TYPE spfli.     " all the fields of a connection
```

That's the most common way to get a structure: it always matches the table, as you saw for single fields in [Defining types with TYPES and LIKE](./0017-types-and-like.en.md). The Dictionary also has structures that aren't tables; you'll see them in [Structures and table types in the Dictionary](./0048-ddic-structures-and-table-types.en.md).

## Read and write components

Reach a component with the **component selector** `-`: structure name, hyphen, component name, without blanks.

```abap
ls_flight-carrid    = 'LH'.
ls_flight-connid    = '0400'.
ls_flight-fldate    = '20261215'.
ls_flight-price     = '650.00'.
ls_flight-seatsfree = 12.

WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-fldate,
         ls_flight-price, ls_flight-seatsfree.

IF ls_flight-seatsfree < 20.
  WRITE / 'Almost full'.
ENDIF.
```

Each component is an ordinary variable of its own type: you use it in calculations, conditions, and string templates like any other.

With the constructor expression `VALUE`, you fill the whole structure in one statement. Components you don't list get their initial value:

```abap
ls_flight = VALUE #( carrid = 'AZ' connid = '0555' fldate = '20261220'
                     price = '180.00' seatsfree = 40 ).
```

You'll learn `VALUE` and the other constructor expressions in [Constructor expressions](./0091-constructor-expressions.en.md).

## Work with the whole structure

Many statements work on the whole structure at once:

```abap
DATA ls_copy TYPE ty_flight.

ls_copy = ls_flight.                 " copies all components

IF ls_copy = ls_flight.              " compares all components
  WRITE / 'Same flight'.
ENDIF.

CLEAR ls_copy.                       " every component back to its initial value
IF ls_copy IS INITIAL.
  WRITE / 'Empty structure'.
ENDIF.
```

To copy between two **different** structures, use `MOVE-CORRESPONDING`: it copies only the components that have the **same name** in both, and leaves the others alone.

```abap
TYPES: BEGIN OF ty_offer,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
         note   TYPE string,
       END OF ty_offer.

DATA ls_offer TYPE ty_offer.

MOVE-CORRESPONDING ls_flight TO ls_offer.   " carrid, connid, price
ls_offer-note = `Winter sale`.
```

> [!WARNING]
> Don't assign different structure types with `=`. ABAP doesn't check the names: for flat structures it copies the bytes from left to right, so values can end up in the wrong components, often without any error. Use `MOVE-CORRESPONDING` or the `CORRESPONDING` expression, which you'll see in [FILTER and CORRESPONDING](./0094-filter-and-corresponding.en.md).

## Exercise

> [!IMPORTANT]
>
> 1. Declare a structure `ls_conn` of type `spfli` and fill `carrid`, `connid`, `cityfrom`, `cityto`, and `fltime` (flight time in minutes) for the connection LH 0400 from FRANKFURT to NEW YORK, 444 minutes.
> 2. Print the route with a string template, and the flight time in hours and minutes.
> 3. Define a type `ty_route` with only `carrid`, `connid`, `cityfrom`, and `cityto`, and copy the matching fields from `ls_conn` into a structure of that type.

### Solution

```abap
REPORT zstructures_exercise.

TYPES: BEGIN OF ty_route,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_route.

DATA ls_conn  TYPE spfli.
DATA ls_route TYPE ty_route.

ls_conn-carrid   = 'LH'.
ls_conn-connid   = '0400'.
ls_conn-cityfrom = 'FRANKFURT'.
ls_conn-cityto   = 'NEW YORK'.
ls_conn-fltime   = 444.

DATA(lv_hours)   = ls_conn-fltime DIV 60.     " 7
DATA(lv_minutes) = ls_conn-fltime MOD 60.     " 24

WRITE: / |{ ls_conn-carrid } { ls_conn-connid }: { ls_conn-cityfrom } -> { ls_conn-cityto }|,
       / |Flight time: { lv_hours } h { lv_minutes } min|.

MOVE-CORRESPONDING ls_conn TO ls_route.
```

> [!NOTE]
>
> - A structure groups related components into one data object; define it with `TYPES BEGIN OF ... END OF`.
> - `TYPE scarr` gives you a structure with all the fields of a Dictionary table.
> - Access a component with the selector `-`, for example `ls_flight-price`.
> - `=`, comparison, `CLEAR`, and `IS INITIAL` work on the whole structure.
> - Use `MOVE-CORRESPONDING` to copy between different structures by component name.
