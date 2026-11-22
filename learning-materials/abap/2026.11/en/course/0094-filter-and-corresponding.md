---
title: FILTER and CORRESPONDING
description: Filter tables by key and map fields between structures.
---

_Intermediate level_

Two jobs come up in almost every program: taking the rows of a table that match a condition, and copying data between structures or tables whose fields have the same names. `FILTER` does the first, `CORRESPONDING` the second. Both are [constructor expressions](./0091-constructor-expressions.md) and replace loops you'd otherwise write by hand.

## FILTER with a WHERE condition

`FILTER` returns a new table with the rows of the source table that match a `WHERE` condition. The result has the same type as the source.

```abap
REPORT zfilter_corresponding.

DATA lt_flights TYPE SORTED TABLE OF sflight
                WITH NON-UNIQUE KEY carrid connid.

SELECT * FROM sflight INTO TABLE @lt_flights.

DATA(lt_lufthansa) = FILTER #( lt_flights WHERE carrid = 'LH' ).
DATA(lt_others)    = FILTER #( lt_flights EXCEPT WHERE carrid = 'LH' ).
```

`EXCEPT` inverts the condition: it keeps the rows that do **not** match.

`FILTER` is fast because it works through a table key, and that's also its main rule: the condition can use only the components of a **sorted or hashed key** of the source table, compared with `=` and joined with `AND`. For a hashed key you must give all its components. If the primary key doesn't fit, add a [secondary key](./0035-table-keys.md) and name it with `USING KEY`:

```abap
DATA lt_by_date TYPE STANDARD TABLE OF sflight WITH EMPTY KEY
                WITH NON-UNIQUE SORTED KEY by_date COMPONENTS fldate.

SELECT * FROM sflight INTO TABLE @lt_by_date.

DATA(lt_today) = FILTER #( lt_by_date USING KEY by_date WHERE fldate = sy-datum ).
```

> [!WARNING]
> A standard table without a sorted or hashed key can't be used with `FILTER ... WHERE`: you get a syntax error. For free conditions on any field, use `VALUE #( FOR ... WHERE ( ... ) ( ... ) )` from [FOR and REDUCE](./0093-for-and-reduce.md), or `LOOP AT ... WHERE`.

## FILTER with a filter table

The second form keeps the rows whose values appear in another table, the **filter table**. Here the filter table needs the sorted or hashed key, and the source table can be of any kind:

```abap
TYPES tt_carrids TYPE SORTED TABLE OF s_carr_id WITH UNIQUE KEY table_line.

DATA(lt_wanted) = VALUE tt_carrids( ( 'AA' ) ( 'LH' ) ).
SELECT * FROM spfli INTO TABLE @DATA(lt_connections).

DATA(lt_selected) = FILTER #( lt_connections IN lt_wanted
                              WHERE carrid = table_line ).
```

On the left of `=` is a component of the source table, on the right a component of the filter table (`table_line` for a table without structure). `EXCEPT IN` keeps the rows that are not in the filter table.

> [!TIP]
> `FILTER` is a bouncer with a guest list. With `WHERE` they check each guest against one rule ("only Lufthansa"); with a filter table they check each guest against the names on the list. The list is sorted alphabetically, which is why they're quick.

## CORRESPONDING for structures

`CORRESPONDING` copies the components with the **same name** from one structure to another and leaves out the rest:

```abap
TYPES: BEGIN OF ty_flight_info,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
         note     TYPE string,
       END OF ty_flight_info.

SELECT SINGLE * FROM spfli WHERE carrid = 'LH' INTO @DATA(ls_spfli).

DATA(ls_info) = CORRESPONDING ty_flight_info( ls_spfli ).          " note stays initial
ls_info = CORRESPONDING #( BASE ( ls_info ) ls_spfli ).            " keep note's value
```

Without `BASE`, the components of the target that have no match in the source are initial. With `BASE ( ... )`, they keep the value of the base.

Two additions adapt the mapping:

```abap
TYPES: BEGIN OF ty_route,
         airline  TYPE s_carr_id,
         flight   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_route.

DATA(ls_route) = CORRESPONDING ty_route( ls_spfli
                   MAPPING airline = carrid flight = connid    " target = source
                   EXCEPT cityto ).                            " don't copy this one
```

The old statement `MOVE-CORRESPONDING ls_spfli TO ls_info.` does the same as `CORRESPONDING` with `BASE`: it changes only the matching components of the target. You'll find it everywhere in existing code, and it's still valid.

## CORRESPONDING for tables

With internal tables, `CORRESPONDING` maps every row:

```abap
TYPES tt_routes TYPE STANDARD TABLE OF ty_route WITH EMPTY KEY.

SELECT * FROM spfli INTO TABLE @DATA(lt_spfli).

DATA(lt_routes) = CORRESPONDING tt_routes( lt_spfli
                    MAPPING airline = carrid flight = connid ).
```

If the target table has a unique key and two source rows produce the same key, `CORRESPONDING` raises `CX_SY_ITAB_DUPLICATE_KEY`. Since ABAP 7.52, the addition `DISCARDING DUPLICATES` skips those rows instead. For nested structures and tables inside rows, `DEEP` maps the inner components too.

## Exercise

> [!IMPORTANT]
>
> 1. Read `SFLIGHT` into a table with a sorted secondary key on `planetype`. With `FILTER`, get the flights of plane type `A380-800` (or one that exists in your data).
> 2. Define a structure type with `airline`, `flight`, `date`, and `free_seats`. With `CORRESPONDING` and `MAPPING`, map the filtered flights into a table of that type.
> 3. Fill `free_seats` in a `LOOP AT ... ASSIGNING`, since it's computed and can't be mapped.

### Solution

```abap
TYPES: BEGIN OF ty_free,
         airline    TYPE s_carr_id,
         flight     TYPE s_conn_id,
         date       TYPE s_date,
         free_seats TYPE i,
       END OF ty_free,
       tt_free TYPE STANDARD TABLE OF ty_free WITH EMPTY KEY.

DATA lt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY
                WITH NON-UNIQUE SORTED KEY by_plane COMPONENTS planetype.

SELECT * FROM sflight INTO TABLE @lt_flights.

DATA(lt_a380) = FILTER #( lt_flights USING KEY by_plane WHERE planetype = 'A380-800' ).

DATA(lt_free) = CORRESPONDING tt_free( lt_a380
                  MAPPING airline = carrid flight = connid date = fldate ).

LOOP AT lt_free ASSIGNING FIELD-SYMBOL(<ls_free>).
  DATA(ls_flight) = lt_a380[ sy-tabix ].
  <ls_free>-free_seats = ls_flight-seatsmax - ls_flight-seatsocc.
ENDLOOP.
```

The two tables have the same row order, so `sy-tabix` links them.

> [!NOTE]
>
> - `FILTER #( itab [EXCEPT] [USING KEY k] WHERE ... )` keeps the rows that match a condition on a sorted or hashed key.
> - `FILTER #( itab [EXCEPT] IN ftab WHERE ... )` keeps the rows whose values appear in a filter table with a suitable key.
> - `CORRESPONDING` copies components with the same name; `BASE` keeps the other values of the target.
> - `MAPPING target = source` maps different names, and `EXCEPT` leaves components out.
> - With tables, watch out for duplicate keys in the target; `DISCARDING DUPLICATES` skips them.
