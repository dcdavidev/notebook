---
title: Internal tables
description: The most used tool in ABAP, lists of data in memory.
---

_Week 1 · Beginner level · 4 hours_

### Today's schedule

| Block  | Content                                                                              |
| ------ | ------------------------------------------------------------------------------------ |
| Hour 1 | What an internal table is, table kinds (standard, sorted, hashed), keys, declaration |
| Hour 2 | Filling and reading: APPEND, INSERT, VALUE, READ TABLE, table expressions            |
| Hour 3 | LOOP AT, MODIFY, DELETE, SORT, COLLECT, field symbols and references                 |
| Hour 4 | Useful operations, performance, review of the week, and a mini project               |

## Hour 1 – What an internal table is

An **internal table** is a list of rows **in memory** that exists only while the program runs. All rows have the same structure. Usually you read data from the database into an internal table, process it, and then display or save it.

> [!TIP]
> The database is the company's big archive in the basement. The internal table is the stack of photocopies you bring to your desk to work on: you write on them, reorder them, throw away the sheets you don't need. When you're done, you can update the archive if you want. If you throw the stack away (end of program), the archive doesn't change.

### The three kinds of table

| Kind       | How it's organized                                   | Access by key                                         | When to use it                                    |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| `STANDARD` | rows in insertion order, with an index               | slow (sequential read) unless you use `BINARY SEARCH` | the most common; small tables, access by index    |
| `SORTED`   | always sorted by key, with an index                  | fast (automatic binary search)                        | frequent access by key, when you need sorted data |
| `HASHED`   | no index, access only by key through a hash function | very fast and constant, even with millions of rows    | large tables read only by a unique key            |

> [!TIP]
> `STANDARD` is a deck of cards in the order you drew them: to find the ace of hearts you look at them one by one. `SORTED` is a dictionary: you find a word by opening it in the middle and narrowing down. `HASHED` is a cloakroom with numbered tickets: you hand over the number and get your coat back immediately, without searching.

### Declare an internal table

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,   " airline
         connid   TYPE s_conn_id,   " flight number
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
         price    TYPE s_price,
       END OF ty_flight.

* Standard table with the default key (all character fields)
DATA lt_flights TYPE STANDARD TABLE OF ty_flight WITH DEFAULT KEY.

* Standard table without a key (often the best choice for standard tables)
DATA lt_flights2 TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

* Sorted table with a unique key
DATA lt_sorted TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.

* Hashed table (the key must be UNIQUE)
DATA lt_hash TYPE HASHED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.

* Short form: TABLE OF = STANDARD TABLE OF ... WITH DEFAULT KEY
DATA lt_short TYPE TABLE OF ty_flight.

* With the row type taken from a DDIC table
DATA lt_spfli TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.

* First define a table TYPE, then the variable
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
DATA lt_flights3 TYPE tt_flights.

* Work area: a variable with the structure of ONE row
DATA ls_flight TYPE ty_flight.
```

- `UNIQUE KEY`: two rows can't have the same key (mandatory for `HASHED`).
- `NON-UNIQUE KEY`: duplicate keys are allowed (possible for `STANDARD` and `SORTED`).
- **Secondary keys** (`WITH NON-UNIQUE SORTED KEY name COMPONENTS ...`): a table can have extra keys for fast access on other fields.

```abap
DATA lt_flights_k TYPE SORTED TABLE OF ty_flight
                  WITH UNIQUE KEY carrid connid
                  WITH NON-UNIQUE SORTED KEY by_city COMPONENTS cityfrom.
```

### Old syntax to recognize

In old code you'll find tables **with a header line**, where the table and its work area have the same name:

```abap
DATA itab TYPE TABLE OF ty_flight WITH HEADER LINE.   " OBSOLETE
DATA: BEGIN OF itab2 OCCURS 0, ... END OF itab2.      " OBSOLETE
TABLES spfli.                                         " OBSOLETE (except for screens)
```

`itab` means the work area and `itab[]` the whole table. These forms are forbidden in classes and in modern code: recognize them, but don't use them.

## Hour 2 – Filling and reading

### APPEND and INSERT

```abap
DATA lt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
DATA ls_flight  TYPE ty_flight.

ls_flight-carrid = 'AZ'. ls_flight-connid = '0555'.
ls_flight-cityfrom = 'ROME'. ls_flight-cityto = 'FRANKFURT'. ls_flight-price = 180.
APPEND ls_flight TO lt_flights.                  " adds at the end

* Modern: without a work area
APPEND VALUE #( carrid = 'LH' connid = '0400' cityfrom = 'FRANKFURT'
                cityto = 'NEW YORK' price = 650 ) TO lt_flights.

* INSERT at a specific position (standard) ...
INSERT VALUE #( carrid = 'AA' connid = '0017' ) INTO lt_flights INDEX 1.

* ... or by key (sorted/hashed: the key decides the position)
INSERT VALUE #( carrid = 'AZ' connid = '0555' ) INTO TABLE lt_sorted.
IF sy-subrc <> 0.
  WRITE 'Key already exists!'.                   " sy-subrc = 4 with a duplicate key
ENDIF.
```

> [!WARNING]
> With `SORTED` tables, don't use `APPEND` if the row doesn't belong "at the end" in the sort order: it causes a dump. Always use `INSERT ... INTO TABLE` for `SORTED` and `HASHED` tables.

### Fill everything at once with VALUE

```abap
DATA(lt_cities) = VALUE string_table( ( `Rome` ) ( `Milan` ) ( `Naples` ) ).

lt_flights = VALUE #(
  ( carrid = 'AZ' connid = '0555' cityfrom = 'ROME'      cityto = 'FRANKFURT' price = 180 )
  ( carrid = 'AZ' connid = '0789' cityfrom = 'ROME'      cityto = 'TOKYO'     price = 900 )
  ( carrid = 'LH' connid = '0400' cityfrom = 'FRANKFURT' cityto = 'NEW YORK'  price = 650 ) ).

* Add rows without deleting the existing content: BASE
lt_flights = VALUE #( BASE lt_flights ( carrid = 'UA' connid = '0941' ) ).
```

### How many rows are there?

```abap
DATA(lv_rows) = lines( lt_flights ).
IF lt_flights IS INITIAL.
  WRITE 'Empty table'.
ENDIF.
```

### Read a row: READ TABLE (classic)

```abap
* By index
READ TABLE lt_flights INTO ls_flight INDEX 2.

* By key (or by any fields)
READ TABLE lt_flights INTO ls_flight WITH KEY carrid = 'LH' connid = '0400'.
IF sy-subrc = 0.
  WRITE: / 'Found at position', sy-tabix, ls_flight-cityto.
ELSE.
  WRITE / 'Not found'.
ENDIF.

* Only check that it exists, without copying the row
READ TABLE lt_flights TRANSPORTING NO FIELDS WITH KEY carrid = 'LH'.

* Binary search on a STANDARD table (it must be SORTED first with SORT!)
SORT lt_flights BY carrid connid.
READ TABLE lt_flights INTO ls_flight WITH KEY carrid = 'LH' connid = '0400' BINARY SEARCH.
```

### Read a row: table expressions (modern)

```abap
DATA(ls_f1)   = lt_flights[ 1 ].                              " by index
DATA(ls_f2)   = lt_flights[ carrid = 'LH' connid = '0400' ].  " by fields
DATA(lv_dest) = lt_flights[ carrid = 'LH' ]-cityto.           " a single field directly
DATA(ls_f3)   = lt_sorted[ KEY primary_key carrid = 'AZ' connid = '0555' ].
```

> [!WARNING]
> If the row doesn't exist, the table expression raises the exception `CX_SY_ITAB_LINE_NOT_FOUND` (a dump if not handled). You have three solutions, shown below.

```abap
* 1. Check first
IF line_exists( lt_flights[ carrid = 'XX' ] ).
  DATA(ls_x) = lt_flights[ carrid = 'XX' ].
ENDIF.

* 2. Default value
DATA(ls_y) = VALUE #( lt_flights[ carrid = 'XX' ] OPTIONAL ).           " empty row
DATA(ls_z) = VALUE #( lt_flights[ carrid = 'XX' ] DEFAULT ls_flight ).  " alternative row

* 3. Handle the exception (day 11)
TRY.
    DATA(ls_w) = lt_flights[ carrid = 'XX' ].
  CATCH cx_sy_itab_line_not_found.
    WRITE 'Row not found'.
ENDTRY.

* Position of a row
DATA(lv_idx) = line_index( lt_flights[ carrid = 'LH' ] ).   " 0 if not found
```

## Hour 3 – Looping and changing

### LOOP AT

```abap
LOOP AT lt_flights INTO ls_flight.
  WRITE: / sy-tabix, ls_flight-carrid, ls_flight-connid, ls_flight-cityto.
ENDLOOP.

* With a condition
LOOP AT lt_flights INTO ls_flight WHERE carrid = 'AZ' AND price > 200.
  WRITE / ls_flight-cityto.
ENDLOOP.

* With an inline declaration
LOOP AT lt_flights INTO DATA(ls_f).
  ...
ENDLOOP.

* Only a range of rows
LOOP AT lt_flights INTO ls_flight FROM 2 TO 5.
ENDLOOP.
```

Inside the loop, `sy-tabix` holds the index of the current row. After the loop, `sy-subrc` is 0 if at least one row was processed, 4 otherwise.

### Changing rows

With `INTO` you work on a **copy** of the row: changing `ls_flight` doesn't change the table. To change it, you have three options:

```abap
* 1. MODIFY with a work area (classic)
LOOP AT lt_flights INTO ls_flight.
  ls_flight-price = ls_flight-price * '1.1'.
  MODIFY lt_flights FROM ls_flight.                 " changes the current row
ENDLOOP.

* 2. FIELD-SYMBOL: a direct "pointer" to the row (faster)
LOOP AT lt_flights ASSIGNING FIELD-SYMBOL(<ls_flight>).
  <ls_flight>-price = <ls_flight>-price * '1.1'.    " changes the table directly
ENDLOOP.

* 3. REFERENCE INTO: a reference to the row
LOOP AT lt_flights REFERENCE INTO DATA(lr_flight).
  lr_flight->price = lr_flight->price * '1.1'.
ENDLOOP.

* MODIFY without a loop: all rows that match the condition
ls_flight-price = 0.
MODIFY lt_flights FROM ls_flight TRANSPORTING price WHERE carrid = 'UA'.

* With a table expression
lt_flights[ carrid = 'LH' connid = '0400' ]-price = 700.
```

### Field symbols, explained properly

A **field symbol** (name between `< >`) holds no data: it's an **alias** for data that already exists somewhere else.

> [!TIP]
> A field symbol is like the TV remote: it isn't the TV, but when you press a button the TV really changes. A work area (`INTO`), instead, is like a photo of the TV: you can scribble on it as much as you like, and the TV doesn't change.

```abap
DATA lv_number TYPE i VALUE 5.
FIELD-SYMBOLS <fs> TYPE i.

ASSIGN lv_number TO <fs>.
<fs> = 10.
WRITE lv_number.           " 10: we changed lv_number through <fs>

READ TABLE lt_flights ASSIGNING FIELD-SYMBOL(<row>) WITH KEY carrid = 'AZ'.
IF sy-subrc = 0.           " or: IF <row> IS ASSIGNED.
  <row>-price = 99.
ENDIF.
```

> [!WARNING]
> Using an unassigned field symbol causes a `GETWA_NOT_ASSIGNED` dump. Always check `sy-subrc` or `IS ASSIGNED` after `READ`/`ASSIGN`.

### DELETE

```abap
DELETE lt_flights INDEX 1.                                          " by index
DELETE lt_flights WHERE price < 100.                                " by condition
DELETE TABLE lt_hash WITH TABLE KEY carrid = 'AZ' connid = '0555'.  " by key

LOOP AT lt_flights INTO ls_flight.
  IF ls_flight-cityto IS INITIAL.
    DELETE lt_flights.      " the current row (not recommended, prefer WHERE)
  ENDIF.
ENDLOOP.

* Remove duplicates (the table must be sorted first!)
SORT lt_flights BY carrid connid.
DELETE ADJACENT DUPLICATES FROM lt_flights COMPARING carrid connid.

CLEAR lt_flights.   " empties the table
FREE lt_flights.    " empties it and frees the memory
```

### SORT

```abap
SORT lt_flights BY carrid ASCENDING price DESCENDING.
SORT lt_flights BY cityto AS TEXT.   " alphabetical order for the language (accents)
SORT lt_flights STABLE BY carrid.    " keeps the relative order of equal rows
```

`SORTED` tables can't be re-sorted with `SORT` (they're already sorted by key); `HASHED` tables can, but only as a convenience for printing.

### COLLECT: summing by key

`COLLECT` inserts a row, but if a row with the same non-numeric fields (the key) already exists, it **adds up** the numeric fields.

```abap
TYPES: BEGIN OF ty_total,
         carrid TYPE s_carr_id,
         total  TYPE s_price,
       END OF ty_total.
DATA lt_totals TYPE STANDARD TABLE OF ty_total WITH DEFAULT KEY.

LOOP AT lt_flights INTO ls_flight.
  COLLECT VALUE ty_total( carrid = ls_flight-carrid total = ls_flight-price ) INTO lt_totals.
ENDLOOP.
" One row per airline with the sum of the prices
```

On day 12 you'll see modern alternatives (`REDUCE` and `LOOP AT ... GROUP BY`).

### Control-level events in the loop (AT NEW, AT END OF)

The classic syntax for grouping, still very widespread (the table must be sorted by the grouping fields, which must be the first fields of the structure):

```abap
SORT lt_flights BY carrid.
LOOP AT lt_flights INTO ls_flight.
  AT NEW carrid.
    WRITE / |Airline { ls_flight-carrid }|.
  ENDAT.

  WRITE /5 ls_flight-connid.

  AT END OF carrid.
    SUM.                          " adds up the numeric fields of the group
    WRITE /5 |Total: { ls_flight-price }|.
  ENDAT.

  AT LAST.
    SUM.
    WRITE / |Grand total: { ls_flight-price }|.
  ENDAT.
ENDLOOP.
```

> [!WARNING]
> Inside `AT NEW` / `AT END OF`, the fields to the right of the grouping field show up as `*` or initial values. This behavior always surprises beginners.

## Hour 4 – Useful operations and performance

### Copy and compare tables

```abap
DATA(lt_copy) = lt_flights.                              " full copy
APPEND LINES OF lt_flights TO lt_copy.                   " appends all rows
INSERT LINES OF lt_flights FROM 1 TO 2 INTO TABLE lt_copy.
IF lt_flights = lt_copy.                                 " row-by-row comparison
ENDIF.
```

### Tables of tables (deep tables)

A row can contain another table:

```abap
TYPES: BEGIN OF ty_customer,
         name   TYPE string,
         orders TYPE STANDARD TABLE OF i WITH EMPTY KEY,
       END OF ty_customer.
DATA lt_customers TYPE STANDARD TABLE OF ty_customer WITH EMPTY KEY.

lt_customers = VALUE #( ( name = `Rossi` orders = VALUE #( ( 1 ) ( 2 ) ) ) ).
```

### Golden rules of performance

| Situation                               | What to do                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Reading by key in a large table         | use `SORTED` or `HASHED`, or a secondary key                                                                  |
| `STANDARD` table read many times by key | `SORT` once + `BINARY SEARCH`                                                                                 |
| Changing rows in a loop                 | `ASSIGNING FIELD-SYMBOL` instead of `INTO` + `MODIFY`                                                         |
| Nested loops (table inside table)       | the inner loop with `WHERE` on a table `SORTED` by the key: avoid the "loop inside a loop" on standard tables |
| Huge tables no longer used              | `FREE`                                                                                                        |

> [!TIP]
> A nested loop over two standard tables of 10,000 rows each makes 100 million comparisons: it's like looking up a name in an unsorted phone book, once for every inhabitant of the city. Sort the phone book (`SORTED`) and each lookup becomes instant.

### Review of the week: mini project

Write the report `ZMINI_PROJECT_W1` that:

1. Defines a type for a student (student ID, name, course, grade).
2. Fills a table with at least 8 students from 3 different courses using `VALUE`.
3. Prints the list sorted by course and then by grade, descending.
4. For each course, prints the number of students and the average grade (`AT NEW`/`AT END OF` or `COLLECT`).
5. Raises by 1 the grade of everyone below 18 (`ASSIGNING`), without going over 30.
6. Removes the students whose grade is still below 18 and prints how many are left.
7. Looks up a student by ID with a table expression, handling the "not found" case.

## Exercises

> [!IMPORTANT]
>
> 1. Create a standard table of strings with 5 names, sort it alphabetically, and print it.
> 2. Create a `HASHED` table of products (code, description, price) with the code as unique key. Try to insert the same code twice and check `sy-subrc`.
> 3. Given a sales table (region, amount) with repeated rows per region, calculate the total per region with `COLLECT`.
> 4. With a `LOOP` and a field symbol, raise by 5% all prices above 100.
> 5. Read the table `SPFLI` into an internal table with `SELECT * FROM spfli INTO TABLE @DATA(lt_spfli).` (a preview of tomorrow) and print the flights that depart from FRANKFURT.
> 6. Complete the mini project of the week.

## Quiz

1. What is the difference between an internal table and a database table?
2. Which kind of table do you choose to read a table with one million rows by a unique key?
3. What happens if you use `lt_tab[ ... ]` to read a row that doesn't exist?
4. What is the difference between `LOOP AT ... INTO` and `LOOP AT ... ASSIGNING`?
5. What does `COLLECT` do?
6. What must you do before `DELETE ADJACENT DUPLICATES` and `BINARY SEARCH`?
7. What does `sy-tabix` contain in a loop?

## Solutions

```abap
REPORT zes05_solutions.

TYPES: BEGIN OF ty_prod,
         code  TYPE c LENGTH 5,
         descr TYPE string,
         price TYPE p LENGTH 8 DECIMALS 2,
       END OF ty_prod.
TYPES: BEGIN OF ty_sale,
         region TYPE c LENGTH 20,
         amount TYPE p LENGTH 10 DECIMALS 2,
       END OF ty_sale.
TYPES tt_sales TYPE STANDARD TABLE OF ty_sale WITH EMPTY KEY.

START-OF-SELECTION.
* Ex. 1
  DATA(lt_names) = VALUE string_table( ( `Paolo` ) ( `Anna` ) ( `Zeno` ) ( `Carla` ) ( `Bruno` ) ).
  SORT lt_names.
  LOOP AT lt_names INTO DATA(lv_name).
    WRITE / lv_name.
  ENDLOOP.

* Ex. 2
  DATA lt_prod TYPE HASHED TABLE OF ty_prod WITH UNIQUE KEY code.
  INSERT VALUE #( code = 'P001' descr = `Pen`    price = '1.50' ) INTO TABLE lt_prod.
  INSERT VALUE #( code = 'P001' descr = `Pencil` price = '0.80' ) INTO TABLE lt_prod.
  WRITE / |Second insert sy-subrc = { sy-subrc }|.   " 4

* Ex. 3
  DATA(lt_sales) = VALUE tt_sales(
    ( region = 'NORTH' amount = 100 ) ( region = 'SOUTH'  amount = 50 )
    ( region = 'NORTH' amount = 200 ) ( region = 'CENTER' amount = 70 ) ).
  DATA lt_totals TYPE STANDARD TABLE OF ty_sale WITH DEFAULT KEY.
  LOOP AT lt_sales INTO DATA(ls_s).
    COLLECT ls_s INTO lt_totals.
  ENDLOOP.
  LOOP AT lt_totals INTO DATA(ls_t).
    WRITE / |{ ls_t-region }: { ls_t-amount }|.
  ENDLOOP.

* Ex. 4
  INSERT VALUE #( code = 'P002' descr = `Backpack` price = 120 ) INTO TABLE lt_prod.
  LOOP AT lt_prod ASSIGNING FIELD-SYMBOL(<p>) WHERE price > 100.
    <p>-price = <p>-price * '1.05'.
  ENDLOOP.

* Ex. 5
  SELECT * FROM spfli INTO TABLE @DATA(lt_spfli).
  LOOP AT lt_spfli INTO DATA(ls_spfli) WHERE cityfrom = 'FRANKFURT'.
    WRITE: / ls_spfli-carrid, ls_spfli-connid, ls_spfli-cityto.
  ENDLOOP.
```

Quiz:

1. The internal table lives in memory only while the program runs; the database table is permanent.
2. `HASHED` with a unique key.
3. The exception `CX_SY_ITAB_LINE_NOT_FOUND` (a dump if not handled).
4. `INTO` copies the row (changes don't touch the table); `ASSIGNING` points directly at the row (changes modify the table, and it's faster).
5. It inserts a row or, if the key already exists, adds up its numeric fields.
6. Sort the table with `SORT` by the fields used.
7. The index of the current row.

> [!NOTE]
> Week 1 completed! You now know the basics: the SAP system, syntax, types, decisions, loops, the debugger, the ABAP Dictionary, and internal tables. Next week you move on to the intermediate level, starting with reading and writing the database with Open SQL.
