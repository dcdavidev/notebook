---
title: Sorting, summing, and removing duplicates
description: SORT, DELETE ADJACENT DUPLICATES, and COLLECT.
level: basic
---

Three statements cover jobs you'll do on internal tables again and again. `SORT` puts the rows in order, `DELETE ADJACENT DUPLICATES` removes repeated rows, and `COLLECT` sums numeric fields of rows that share the same key.

The examples use bookings, with one row per booked seat:

```abap
TYPES: BEGIN OF ty_booking,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         customid TYPE s_customer,
         luggweight TYPE s_lugweigh,
       END OF ty_booking.
TYPES tt_bookings TYPE STANDARD TABLE OF ty_booking WITH EMPTY KEY.

DATA(lt_bookings) = VALUE tt_bookings(
  ( carrid = 'LH' connid = '0400' customid = '00000002' luggweight = '20.0' )
  ( carrid = 'AZ' connid = '0555' customid = '00000001' luggweight = '15.5' )
  ( carrid = 'LH' connid = '0400' customid = '00000001' luggweight = '23.0' )
  ( carrid = 'AZ' connid = '0555' customid = '00000001' luggweight = '8.0' ) ).
```

## SORT

`SORT` orders the rows of a standard or hashed table. Always say which fields to sort by:

```abap
SORT lt_bookings BY carrid connid.                    " ascending (default)
SORT lt_bookings BY luggweight DESCENDING.            " heaviest first
SORT lt_bookings BY carrid ASCENDING luggweight DESCENDING.
```

| Addition                   | Meaning                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `BY f1 f2 ...`             | sort by these fields, in this order                                      |
| `ASCENDING` / `DESCENDING` | direction; after `BY` it applies to the field just before it             |
| `STABLE`                   | rows with the same sort values keep their relative order                 |
| `AS TEXT`                  | sort text fields alphabetically for the logon language, not by byte code |

Without `BY`, `SORT` uses the primary key of the table. For a table with an empty key, that means nothing is sorted. Sorted tables can't be sorted with `SORT`: their order is fixed by their key.

> [!WARNING]
> Without `STABLE`, rows with equal sort values can end up in any order, and the order can change from one run to the next. If the order of those rows matters, add `STABLE` or more fields after `BY`.

## DELETE ADJACENT DUPLICATES

`DELETE ADJACENT DUPLICATES` removes a row when it has the same values as the row just before it. Duplicates are only found when they're next to each other, so you sort first:

```abap
" One row per customer and connection
SORT lt_bookings BY carrid connid customid.
DELETE ADJACENT DUPLICATES FROM lt_bookings COMPARING carrid connid customid.

" Rows that are identical in every field
DELETE ADJACENT DUPLICATES FROM lt_bookings COMPARING ALL FIELDS.
```

The first row of each group stays, the others go. Without `COMPARING`, the statement compares the primary key, which for a table with an empty key doesn't make sense: always write `COMPARING`.

A common pattern is building a list of distinct values from a bigger table:

```abap
DATA(lt_customers) = lt_bookings.
SORT lt_customers BY customid.
DELETE ADJACENT DUPLICATES FROM lt_customers COMPARING customid.
" one row per customer (the other fields come from the first row of each group)
```

> [!TIP]
> `DELETE ADJACENT DUPLICATES` is like a teacher checking a queue of students: it only notices that someone is in line twice if the two are standing next to each other. Sorting the queue by name first is what makes the check work.

## COLLECT

`COLLECT` adds a row to a table, but if a row with the same key already exists, it **adds the numeric fields** to that row instead of inserting a new one. The key is the table's primary key, and all the other fields must be numeric (`i`, `p`, `f`, `decfloat16`, `decfloat34`, ...).

```abap
TYPES: BEGIN OF ty_total,
         carrid     TYPE s_carr_id,
         connid     TYPE s_conn_id,
         luggweight TYPE s_lugweigh,   " numeric: summed by COLLECT
       END OF ty_total.

DATA lt_totals TYPE SORTED TABLE OF ty_total WITH UNIQUE KEY carrid connid.

LOOP AT lt_bookings INTO DATA(ls_booking).
  DATA(ls_total) = CORRESPONDING ty_total( ls_booking ).
  COLLECT ls_total INTO lt_totals.
ENDLOOP.

LOOP AT lt_totals INTO ls_total.
  WRITE: / ls_total-carrid, ls_total-connid, ls_total-luggweight.
ENDLOOP.
" AZ 0555 23.5
" LH 0400 43.0
```

`CORRESPONDING ty_total( ls_booking )` copies the fields with the same name from the booking to the total row. It's explained in [FILTER and CORRESPONDING](./0094-filter-and-corresponding.md).

> [!WARNING]
> With a standard table and the default key, the key is made of all the character-like fields: if one of them isn't meant to be part of the grouping, `COLLECT` creates separate rows. Declare the table with an explicit unique key, as in the example, so it's clear what `COLLECT` groups by.

Modern ABAP has other ways to total rows, such as `REDUCE` and `LOOP AT ... GROUP BY`: see [FOR and REDUCE](./0093-for-and-reduce.md) and [grouping internal tables](./0095-grouping-internal-tables.md). For totals of database data, an aggregate `SELECT` is usually better: see [aggregates, GROUP BY, and HAVING](./0056-aggregates-and-group-by.md).

## Exercise

> [!IMPORTANT]
>
> 1. With `lt_bookings` from this lesson, build the list of distinct `carrid` values and print it.
> 2. With `COLLECT`, compute the total luggage weight per customer and print it, heaviest first.

### Solution

```abap
DATA(lt_airlines) = lt_bookings.
SORT lt_airlines BY carrid.
DELETE ADJACENT DUPLICATES FROM lt_airlines COMPARING carrid.
LOOP AT lt_airlines INTO DATA(ls_airline).
  WRITE / ls_airline-carrid.
ENDLOOP.

TYPES: BEGIN OF ty_cust_total,
         customid   TYPE s_customer,
         luggweight TYPE s_lugweigh,
       END OF ty_cust_total.
DATA lt_cust TYPE STANDARD TABLE OF ty_cust_total WITH KEY customid.

LOOP AT lt_bookings INTO DATA(ls_booking).
  DATA(ls_cust) = CORRESPONDING ty_cust_total( ls_booking ).
  COLLECT ls_cust INTO lt_cust.
ENDLOOP.

SORT lt_cust BY luggweight DESCENDING.
LOOP AT lt_cust INTO ls_cust.
  WRITE: / ls_cust-customid, ls_cust-luggweight.
ENDLOOP.
```

> [!NOTE]
>
> - `SORT itab BY f1 f2` orders a standard or hashed table; add `DESCENDING`, `STABLE`, or `AS TEXT` as needed.
> - Sorted tables can't be sorted with `SORT`, and `SORT` without `BY` uses the primary key.
> - `DELETE ADJACENT DUPLICATES ... COMPARING` removes repeated neighbors: sort first by the same fields.
> - `COLLECT` sums the numeric fields of rows with the same primary key; give the table an explicit key.
> - For totals, consider `REDUCE`, `GROUP BY` in a loop, or an aggregate `SELECT`.
