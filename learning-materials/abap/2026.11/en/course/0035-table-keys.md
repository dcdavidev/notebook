---
title: Primary and secondary table keys
description: Unique and non-unique keys, empty keys, and secondary keys.
---

_Basic level_

A **table key** is a set of fields that the system uses to find rows in an internal table. Every table has one **primary key**, and it can have up to 15 **secondary keys** for other ways of reading it.

The key decides whether duplicates are allowed, how sorted and hashed tables are organized, and how fast a read by key is. Picking the key is part of declaring the table, just like picking the [table category](./0034-table-categories.md).

## Unique and non-unique keys

You list the key fields after `KEY`, and you say whether two rows may share the same key values:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         price    TYPE s_price,
       END OF ty_flight.

" Unique: only one row per carrid + connid + fldate
DATA lt_flights TYPE SORTED TABLE OF ty_flight
                WITH UNIQUE KEY carrid connid fldate.

" Non-unique: many rows can have the same carrid + connid
DATA lt_by_conn TYPE SORTED TABLE OF ty_flight
                WITH NON-UNIQUE KEY carrid connid.
```

| Category | Allowed primary keys                        |
| -------- | ------------------------------------------- |
| standard | `NON-UNIQUE` key, default key, or empty key |
| sorted   | `UNIQUE` or `NON-UNIQUE` key                |
| hashed   | `UNIQUE` key only                           |

With a unique key, inserting a duplicate with `INSERT ... INTO TABLE` doesn't add the row and sets `sy-subrc` to 4. For a standard table, `WITH KEY` alone means `WITH NON-UNIQUE KEY`.

If the row type isn't a structure, for example a table of strings, the whole row is the key. You write it with the pseudo-component `table_line`:

```abap
DATA lt_cities TYPE SORTED TABLE OF string WITH UNIQUE KEY table_line.
```

## Default key and empty key

Two special forms are only for the primary key:

- `WITH DEFAULT KEY`: the key is made of all the character-like and byte-like fields of the row (for example `c`, `n`, `d`, `t`, `x`, `string`). Numeric fields aren't part of it.
- `WITH EMPTY KEY`: the table has no key at all. Only standard tables can have an empty key.

```abap
DATA lt_default TYPE STANDARD TABLE OF ty_flight WITH DEFAULT KEY.
" key = carrid connid fldate (price is numeric, so it's left out)

DATA lt_empty TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
" no key: you always say which fields to use when you search
```

> [!WARNING]
> The default key depends on the field types, so it's easy to get it wrong: add a text field to the structure and it silently becomes part of the key. Statements that use the primary key, such as `SORT itab` without `BY` or `DELETE ADJACENT DUPLICATES` without `COMPARING`, then behave differently. For standard tables, prefer `WITH EMPTY KEY` or an explicit key.

> [!TIP]
> A key is like the way a library shelves its books. By author (unique key: one shelf position per book) is the primary key. A second catalog by subject is a secondary key: the books don't move, but you get another fast way to find them.

## Secondary keys

A **secondary key** gives a second fast access path to the same rows. You add it after the primary key with a name, a kind (`SORTED` or `HASHED`), and its fields after `COMPONENTS`:

```abap
TYPES: BEGIN OF ty_connection,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_connection.

DATA lt_connections TYPE HASHED TABLE OF ty_connection
  WITH UNIQUE KEY carrid connid                          " primary key
  WITH NON-UNIQUE SORTED KEY by_from COMPONENTS cityfrom. " secondary key
```

You choose the key with `WITH KEY key_name COMPONENTS` when you read and with `USING KEY` when you loop:

```abap
" Read one row through the secondary key
READ TABLE lt_connections INTO DATA(ls_conn)
     WITH KEY by_from COMPONENTS cityfrom = 'FRANKFURT'.

" Loop only over the rows that match, through the secondary key
LOOP AT lt_connections INTO ls_conn USING KEY by_from
     WHERE cityfrom = 'FRANKFURT'.
  WRITE: / ls_conn-carrid, ls_conn-connid, ls_conn-cityto.
ENDLOOP.
```

`READ TABLE` and `LOOP AT` are explained in [reading single rows](./0037-reading-internal-tables.md) and [looping over internal tables](./0038-looping-internal-tables.md).

Rules to remember:

- A hashed secondary key must be `UNIQUE`. A sorted secondary key can be `UNIQUE` or `NON-UNIQUE`.
- The primary key always has the name `primary_key`; you can write `USING KEY primary_key` to be explicit.
- Each secondary key costs memory and time when rows change. Add one only when you really read the table by those fields, and the table is big.
- A non-unique secondary key is built the first time you use it, not at every insert.

## Exercise

> [!IMPORTANT]
>
> 1. Declare a standard table of flights with `carrid`, `connid`, `fldate`, and `seatsocc` (`s_seatsocc`), with an empty primary key and a non-unique sorted secondary key `by_date` on `fldate`.
> 2. Add three flights, two of them on the same date, and loop only over the flights of that date using the secondary key.

### Solution

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         seatsocc TYPE s_seatsocc,
       END OF ty_flight.

DATA lt_flights TYPE STANDARD TABLE OF ty_flight
  WITH EMPTY KEY
  WITH NON-UNIQUE SORTED KEY by_date COMPONENTS fldate.
DATA ls_flight TYPE ty_flight.

ls_flight-carrid = 'LH'. ls_flight-connid = '0400'.
ls_flight-fldate = '20260301'. ls_flight-seatsocc = 120.
APPEND ls_flight TO lt_flights.
ls_flight-carrid = 'AZ'. ls_flight-connid = '0555'.
ls_flight-fldate = '20260301'. ls_flight-seatsocc = 80.
APPEND ls_flight TO lt_flights.
ls_flight-carrid = 'AA'. ls_flight-connid = '0017'.
ls_flight-fldate = '20260302'. ls_flight-seatsocc = 200.
APPEND ls_flight TO lt_flights.

LOOP AT lt_flights INTO ls_flight USING KEY by_date WHERE fldate = '20260301'.
  WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
ENDLOOP.
```

> [!NOTE]
>
> - Every internal table has a primary key; it can be unique, non-unique, default, or empty.
> - Hashed tables need a unique key; only standard tables can have an empty key.
> - The default key takes all character-like and byte-like fields: prefer an explicit key or `WITH EMPTY KEY`.
> - Secondary keys (`SORTED` or `HASHED`) add fast access paths on other fields; use them with `WITH KEY ... COMPONENTS` and `USING KEY`.
> - `table_line` stands for the whole row when the row type isn't a structure.
