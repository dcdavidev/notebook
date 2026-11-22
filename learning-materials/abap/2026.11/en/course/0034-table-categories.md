---
title: Standard, sorted, and hashed tables
description: The three table categories and when to use each one.
---

_Basic level_

Every internal table belongs to a **table category**: standard, sorted, or hashed. The category decides how the rows are stored and how fast the system finds a row. The content can be the same; what changes is the speed of reading and the rules for adding rows.

Choosing the right category is one of the simplest ways to make a program fast. A wrong choice works fine with ten rows and becomes very slow with a million.

## The three categories

| Category   | How the rows are kept                 | Access by index | Access by key                        | Key                      |
| ---------- | ------------------------------------- | --------------- | ------------------------------------ | ------------------------ |
| `STANDARD` | in the order you add them             | yes             | linear search: reads row after row   | `NON-UNIQUE` or empty    |
| `SORTED`   | always sorted by the key              | yes             | binary search: fast, grows slowly    | `UNIQUE` or `NON-UNIQUE` |
| `HASHED`   | in a hash structure, no visible order | no              | hash access: same speed for any size | `UNIQUE` only            |

Standard and sorted tables are **index tables**: each row has a number (1, 2, 3...), and you can read row 5 directly. A hashed table has no index: you reach a row only through its key.

> [!TIP]
> A standard table is a deck of cards in the order you drew them: to find the ace of hearts you look at them one by one. A sorted table is a dictionary: you open it in the middle and narrow down. A hashed table is a cloakroom with numbered tickets: you give your number and get your coat at once, however many coats there are.

## Declaring each category

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_flight.

" Standard: no key needed
DATA lt_standard TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

" Sorted: the key defines the order
DATA lt_sorted TYPE SORTED TABLE OF ty_flight
               WITH UNIQUE KEY carrid connid.

" Hashed: the key must be unique
DATA lt_hashed TYPE HASHED TABLE OF ty_flight
               WITH UNIQUE KEY carrid connid.
```

`DATA lt_tab TYPE TABLE OF ty_flight` without a category is a short form of `STANDARD TABLE OF ty_flight WITH DEFAULT KEY`. The default key often isn't what you want: see [primary and secondary table keys](./0035-table-keys.md).

## How the category changes the behavior

Add the same rows, in the same order, to a standard and a sorted table:

```abap
REPORT zflight_categories.

TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
       END OF ty_flight.

DATA lt_standard TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
DATA lt_sorted   TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.
DATA ls_flight   TYPE ty_flight.

ls_flight-carrid = 'LH'. ls_flight-connid = '0400'.
INSERT ls_flight INTO TABLE lt_standard.
INSERT ls_flight INTO TABLE lt_sorted.

ls_flight-carrid = 'AA'. ls_flight-connid = '0017'.
INSERT ls_flight INTO TABLE lt_standard.
INSERT ls_flight INTO TABLE lt_sorted.

WRITE / 'Standard:'.
LOOP AT lt_standard INTO ls_flight.
  WRITE: / ls_flight-carrid, ls_flight-connid.   " LH first, then AA
ENDLOOP.

WRITE / 'Sorted:'.
LOOP AT lt_sorted INTO ls_flight.
  WRITE: / ls_flight-carrid, ls_flight-connid.   " AA first, then LH
ENDLOOP.
```

`INSERT ... INTO TABLE` works with every category: a standard table appends the row at the end, a sorted table puts it in the right place, a hashed table stores it by its key. The details are in [filling internal tables](./0036-filling-internal-tables.md).

Some statements only make sense for some categories:

- `APPEND` works on standard tables. On a sorted table it works only if the new row belongs at the end; otherwise the program stops with a runtime error.
- Access by index (`INDEX 3`, `FROM 2 TO 5`) isn't possible on hashed tables.
- `SORT` isn't allowed on sorted tables: they're always sorted by their key.
- You can't change the key fields of a row in a sorted or hashed table: that would break the order or the hash.

> [!WARNING]
> Never use `APPEND` on a sorted table unless you're sure the rows arrive already in key order. Use `INSERT ... INTO TABLE` instead: it always puts the row in the right place.

## Which one to choose

| Situation                                                   | Category |
| ----------------------------------------------------------- | -------- |
| a small table, or you mostly read it from start to end      | standard |
| you read rows by index, or you need to keep the input order | standard |
| you read by key often, and you also need the rows in order  | sorted   |
| you read by a part of the key (for example only `carrid`)   | sorted   |
| a large table that you read only by its full, unique key    | hashed   |

A sorted table can use a partial key from the left (for example only `carrid` out of `carrid connid`) to find rows fast. A hashed table needs the full key every time.

For a table that you read in several ways, you can add **secondary keys** to any category: see [primary and secondary table keys](./0035-table-keys.md).

## Exercise

> [!IMPORTANT]
>
> 1. Declare a hashed table of airlines with the fields `carrid` and `carrname`, with a unique key on `carrid`.
> 2. Insert `LH Lufthansa`, `AA American Airlines`, and `AZ Alitalia`. Then insert `LH` again with another name and print `sy-subrc`.

### Solution

```abap
TYPES: BEGIN OF ty_airline,
         carrid   TYPE s_carr_id,
         carrname TYPE s_carrname,
       END OF ty_airline.

DATA lt_airlines TYPE HASHED TABLE OF ty_airline WITH UNIQUE KEY carrid.
DATA ls_airline  TYPE ty_airline.

ls_airline-carrid = 'LH'. ls_airline-carrname = 'Lufthansa'.
INSERT ls_airline INTO TABLE lt_airlines.
ls_airline-carrid = 'AA'. ls_airline-carrname = 'American Airlines'.
INSERT ls_airline INTO TABLE lt_airlines.
ls_airline-carrid = 'AZ'. ls_airline-carrname = 'Alitalia'.
INSERT ls_airline INTO TABLE lt_airlines.

ls_airline-carrid = 'LH'. ls_airline-carrname = 'Other name'.
INSERT ls_airline INTO TABLE lt_airlines.
WRITE: / 'sy-subrc:', sy-subrc.   " 4: the key LH already exists
```

> [!NOTE]
>
> - Standard tables keep the input order and search by key row after row.
> - Sorted tables are always ordered by their key and use a binary search.
> - Hashed tables have no index and find a row by its full unique key in constant time.
> - Standard and sorted tables are index tables; hashed tables aren't.
> - Use `INSERT ... INTO TABLE` for sorted and hashed tables, not `APPEND`.
