---
title: What is an internal table
description: 'Lists of rows in memory: the most used tool in ABAP.'
level: basic
---

An **internal table** is a list of rows that lives in the memory of your program. Every row has the same type, usually a [structure](./0031-structures.md), and the table can grow or shrink while the program runs. When the program ends, the table is gone.

Almost every ABAP program uses internal tables: you read data from the database into a table, work on it in memory, and then show it, save it, or pass it to another program. Here you see what an internal table is, how to declare one, and how to put rows in and get them out.

## Rows in memory

A **work area** is a variable that holds one row. The internal table holds many rows of the same type. You fill the work area, copy it into the table, and later copy rows back out of the table into a work area to read them.

> [!TIP]
> The database is the big archive in the basement. An internal table is the stack of photocopies you take to your desk: you can write on them, reorder them, and throw some away. The archive doesn't change unless you go back down and update it.

| Database table                   | Internal table                        |
| -------------------------------- | ------------------------------------- |
| lives in the database, on disk   | lives in the memory of the program    |
| exists until someone deletes it  | exists only while the program runs    |
| shared by all users and programs | private to your program               |
| read and written with ABAP SQL   | read and written with ABAP statements |

## Declare an internal table

You declare an internal table with `TYPE ... TABLE OF` followed by the row type:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,   " airline code
         connid   TYPE s_conn_id,   " connection number
         cityfrom TYPE s_from_cit,  " departure city
         cityto   TYPE s_to_city,   " arrival city
       END OF ty_flight.

DATA lt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.  " the table
DATA ls_flight  TYPE ty_flight.                                   " one row
```

- `STANDARD` is the **table category**. There are three of them, explained in [standard, sorted, and hashed tables](./0034-table-categories.md).
- `WITH EMPTY KEY` says the table has no key. Keys are explained in [primary and secondary table keys](./0035-table-keys.md).

You can also define a **table type** with `TYPES` and use it for many tables:

```abap
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA lt_rome_flights  TYPE tt_flights.
DATA lt_paris_flights TYPE tt_flights.
```

The row type can also come from the ABAP Dictionary: `TYPE STANDARD TABLE OF spfli WITH EMPTY KEY` gives you a table with all the fields of the database table `SPFLI`.

## Add rows and read them back

The simplest way to add a row is to fill the work area and `APPEND` it at the end of the table. To read all rows, use `LOOP AT ... INTO`: the loop copies one row at a time into the work area.

```abap
REPORT zflight_table_intro.

TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_flight.

DATA lt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
DATA ls_flight  TYPE ty_flight.

ls_flight-carrid   = 'LH'.
ls_flight-connid   = '0400'.
ls_flight-cityfrom = 'FRANKFURT'.
ls_flight-cityto   = 'NEW YORK'.
APPEND ls_flight TO lt_flights.          " row 1

ls_flight-carrid   = 'AZ'.
ls_flight-connid   = '0555'.
ls_flight-cityfrom = 'ROME'.
ls_flight-cityto   = 'FRANKFURT'.
APPEND ls_flight TO lt_flights.          " row 2

DATA(lv_lines) = lines( lt_flights ).   " number of rows
WRITE: / 'Rows:', lv_lines.

LOOP AT lt_flights INTO ls_flight.
  WRITE: / sy-tabix, ls_flight-carrid, ls_flight-connid,
           ls_flight-cityfrom, ls_flight-cityto.
ENDLOOP.
```

- `lines( lt_flights )` returns the number of rows.
- Inside the loop, `sy-tabix` holds the number of the current row.
- `IF lt_flights IS INITIAL` is true when the table has no rows.

There are many more ways to fill a table, for example `VALUE` and `INSERT`: see [filling internal tables](./0036-filling-internal-tables.md). In real programs, the rows usually come from the database with a `SELECT ... INTO TABLE`, which you'll meet in [reading data with SELECT](./0052-select-basics.md).

## Tables with a header line (obsolete)

In old code you'll find tables declared like this:

```abap
DATA itab TYPE TABLE OF ty_flight WITH HEADER LINE.   " obsolete
DATA: BEGIN OF itab2 OCCURS 0,                        " obsolete
        carrid TYPE s_carr_id,
      END OF itab2.
```

A **header line** is a work area with the same name as the table: `itab` means the work area, and `itab[]` means the table body. This is confusing, and it's not allowed in classes. Recognize it in old programs, but always declare a separate work area in your code.

> [!WARNING]
> With a header line, `CLEAR itab` clears only the work area, not the rows. You need `CLEAR itab[]` to empty the table. This mistake is common in old code.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report with a table of airlines: each row has the airline code (`s_carr_id`) and the name (`s_carrname`).
> 2. Append three airlines of your choice, then print the number of rows and every row with its row number.

### Solution

```abap
REPORT zairline_table.

TYPES: BEGIN OF ty_airline,
         carrid   TYPE s_carr_id,
         carrname TYPE s_carrname,
       END OF ty_airline.

DATA lt_airlines TYPE STANDARD TABLE OF ty_airline WITH EMPTY KEY.
DATA ls_airline  TYPE ty_airline.

ls_airline-carrid = 'LH'. ls_airline-carrname = 'Lufthansa'.
APPEND ls_airline TO lt_airlines.
ls_airline-carrid = 'AZ'. ls_airline-carrname = 'Alitalia'.
APPEND ls_airline TO lt_airlines.
ls_airline-carrid = 'AF'. ls_airline-carrname = 'Air France'.
APPEND ls_airline TO lt_airlines.

DATA(lv_lines) = lines( lt_airlines ).
WRITE: / 'Airlines:', lv_lines.
LOOP AT lt_airlines INTO ls_airline.
  WRITE: / sy-tabix, ls_airline-carrid, ls_airline-carrname.
ENDLOOP.
```

> [!NOTE]
>
> - An internal table is a list of rows of the same type, in the memory of the program.
> - A work area holds one row; you copy rows between the work area and the table.
> - Declare it with `TYPE STANDARD TABLE OF row_type WITH EMPTY KEY`, or define a table type with `TYPES`.
> - `APPEND` adds a row at the end, `LOOP AT ... INTO` reads every row, `lines( )` counts them.
> - Tables with a header line are obsolete: always use a separate work area.
