---
title: Reading single rows
description: READ TABLE, table expressions, line_exists, and line_index.
---

_Basic level_

Often you need one row of a table: the flight with a given number, or the first row. ABAP gives you two ways to read it: the classic **`READ TABLE`** statement, and **table expressions**, which read a row inside any expression. For yes-or-no questions there are the functions `line_exists( )` and `line_index( )`.

The examples use this table:

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         cityto TYPE s_to_city,
       END OF ty_flight.
TYPES tt_flights TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AA' connid = '0017' cityto = 'SAN FRANCISCO' )
  ( carrid = 'AZ' connid = '0555' cityto = 'FRANKFURT' )
  ( carrid = 'LH' connid = '0400' cityto = 'NEW YORK' ) ).
```

## READ TABLE

`READ TABLE` copies one row into a work area. You choose the row by index or by key, and you always check `sy-subrc`:

```abap
" By index (standard and sorted tables only)
READ TABLE lt_flights INTO DATA(ls_flight) INDEX 1.

" By any fields
READ TABLE lt_flights INTO ls_flight WITH KEY cityto = 'NEW YORK'.

" By the full primary key: the fastest access for sorted and hashed tables
READ TABLE lt_flights INTO ls_flight
     WITH TABLE KEY carrid = 'AZ' connid = '0555'.

IF sy-subrc = 0.
  WRITE: / 'Found at row', sy-tabix, ls_flight-cityto.
ELSE.
  WRITE / 'Not found'.          " sy-subrc = 4, ls_flight is unchanged
ENDIF.
```

| Addition                   | Meaning                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `INDEX n`                  | row number `n`                                              |
| `WITH KEY f = v ...`       | first row with these values, in any fields                  |
| `WITH TABLE KEY f = v ...` | row with this primary key; you must give all the key fields |
| `TRANSPORTING NO FIELDS`   | don't copy anything, only set `sy-subrc` and `sy-tabix`     |
| `TRANSPORTING f1 f2`       | copy only these fields                                      |

When a read fails, the work area keeps its old content. Don't use the work area after a read without checking `sy-subrc` first.

> [!WARNING]
> On a standard table, `WITH KEY` reads the rows one by one until it finds a match. On a big table inside a loop, that's very slow. Use a sorted or hashed table, or a [secondary key](./0035-table-keys.en.md). Old code uses `SORT` and then `READ TABLE ... BINARY SEARCH` on standard tables for the same reason.

Instead of copying the row, you can point to it with `ASSIGNING` or `REFERENCE INTO`: see [field symbols](./0041-field-symbols.en.md) and [data references](./0042-data-references.en.md).

## Table expressions

A **table expression** reads a row with square brackets, and you can use it anywhere a value is expected:

```abap
DATA(ls_first) = lt_flights[ 1 ].                            " by index
DATA(lv_city)  = lt_flights[ carrid = 'LH' connid = '0400' ]-cityto. " one field
DATA(lv_conn)  = lt_flights[ cityto = 'FRANKFURT' ]-connid.        " read row by row
```

Inside the brackets you write either a number (the index) or field-value pairs (the key). With field-value pairs, the system uses the primary key if the fields match it, and reads row by row otherwise. To use a secondary key, write `lt_tab[ KEY key_name COMPONENTS f = v ]`.

A table expression doesn't set `sy-subrc`. If the row doesn't exist, it raises the exception `CX_SY_ITAB_LINE_NOT_FOUND`, and the program stops unless you catch it. You can avoid the exception with `OPTIONAL` or `DEFAULT`:

```abap
" Initial row if not found
DATA(ls_any) = VALUE ty_flight( lt_flights[ carrid = 'XX' connid = '0001' ] OPTIONAL ).

" A default value if not found
DATA(lv_dest) = VALUE s_to_city( lt_flights[ carrid = 'XX' connid = '0001' ]-cityto
                                DEFAULT 'unknown' ).
```

Exceptions and `TRY ... CATCH` are explained in [class-based exceptions](./0089-class-based-exceptions.en.md).

## line_exists and line_index

When you only want to know whether a row is there, use the built-in functions. They take a table expression and never raise an exception:

```abap
IF line_exists( lt_flights[ carrid = 'LH' connid = '0400' ] ).
  WRITE / 'LH 0400 is in the table'.
ENDIF.

DATA(lv_row) = line_index( lt_flights[ cityto = 'FRANKFURT' ] ).
WRITE / lv_row.     " 2; 0 if no row matches
```

> [!TIP]
> `READ TABLE` is like asking a clerk for a file and getting a copy plus a note that says "found" or "not found". A table expression is like reaching into the drawer yourself: fast and direct, but if the file isn't there, you're left with nothing in your hand. `line_exists( )` is just looking into the drawer.

## Which one to use

| You want                           | Use                                           |
| ---------------------------------- | --------------------------------------------- |
| to know if a row exists            | `line_exists( )`                              |
| the row number                     | `line_index( )`                               |
| a row that must be there           | a table expression                            |
| a row that may be missing          | `VALUE type( ... OPTIONAL )`, or `READ TABLE` |
| a row and the result in `sy-subrc` | `READ TABLE`                                  |

## Exercise

> [!IMPORTANT]
>
> 1. With the table `lt_flights` from this lesson, print the destination of `AZ 0555` with a table expression.
> 2. Check with `line_exists( )` whether `UA 0941` is in the table, and print a message in both cases.
> 3. Read `UA 0941` with `READ TABLE` and print `sy-subrc`.

### Solution

```abap
DATA(lv_city) = lt_flights[ carrid = 'AZ' connid = '0555' ]-cityto.
WRITE / lv_city.   " FRANKFURT

IF line_exists( lt_flights[ carrid = 'UA' connid = '0941' ] ).
  WRITE / 'UA 0941 exists'.
ELSE.
  WRITE / 'UA 0941 does not exist'.
ENDIF.

READ TABLE lt_flights TRANSPORTING NO FIELDS
     WITH TABLE KEY carrid = 'UA' connid = '0941'.
WRITE: / 'sy-subrc:', sy-subrc.   " 4
```

> [!NOTE]
>
> - `READ TABLE ... INTO` copies one row, chosen by `INDEX`, `WITH KEY`, or `WITH TABLE KEY`; check `sy-subrc` every time.
> - `sy-tabix` holds the number of the row found in an index table.
> - A table expression `itab[ ... ]` reads a row inside any expression; if the row is missing, it raises `CX_SY_ITAB_LINE_NOT_FOUND`.
> - `OPTIONAL` and `DEFAULT` inside `VALUE type( )` avoid the exception.
> - `line_exists( )` and `line_index( )` answer "is it there?" and "where is it?" without exceptions.
