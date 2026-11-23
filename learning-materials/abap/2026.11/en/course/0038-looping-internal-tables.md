---
title: Looping over internal tables
description: LOOP AT with WHERE, FROM, TO, and the control level statements.
level: basic
---

`LOOP AT` processes the rows of an internal table one after the other. It's the statement you'll write most often with internal tables. You can limit the loop to the rows that match a condition or to a range of row numbers, and you can react when a group of rows begins or ends with the **control level statements**.

The examples use flights from `SFLIGHT`:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         seatsocc TYPE s_seatsocc,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AZ' connid = '0555' fldate = '20260301' seatsocc = 80 )
  ( carrid = 'AZ' connid = '0555' fldate = '20260308' seatsocc = 95 )
  ( carrid = 'LH' connid = '0400' fldate = '20260301' seatsocc = 120 )
  ( carrid = 'LH' connid = '0402' fldate = '20260302' seatsocc = 60 ) ).
```

## LOOP AT ... INTO

At each pass, `LOOP AT ... INTO` copies the current row into the work area, and `sy-tabix` holds its row number:

```abap
LOOP AT lt_flights INTO DATA(ls_flight).
  WRITE: / sy-tabix, ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
ENDLOOP.

IF sy-subrc <> 0.
  WRITE / 'The table is empty'.   " sy-subrc = 4 if no pass was made
ENDIF.
```

- After `ENDLOOP`, `sy-subrc` is 0 if the loop ran at least once, 4 otherwise.
- `EXIT`, `CONTINUE`, and `CHECK` work inside `LOOP` as they do in other loops: see [EXIT, CONTINUE, and CHECK](./0027-exit-continue-check.md).
- Changing the work area doesn't change the table. To change the rows, use `ASSIGNING` (see [field symbols](./0041-field-symbols.md)) or `MODIFY` (see [changing and deleting rows](./0039-changing-and-deleting-rows.md)).

## WHERE, FROM, and TO

`WHERE` processes only the rows that match a condition. `FROM` and `TO` limit the loop to a range of row numbers (index tables only).

```abap
" Only Lufthansa flights with more than 100 seats occupied
LOOP AT lt_flights INTO ls_flight WHERE carrid = 'LH' AND seatsocc > 100.
  WRITE: / ls_flight-connid, ls_flight-fldate.
ENDLOOP.

" Only rows 2 to 3
LOOP AT lt_flights INTO ls_flight FROM 2 TO 3.
  WRITE: / sy-tabix, ls_flight-carrid.
ENDLOOP.
```

`WHERE` is faster than an `IF` inside the loop, and on a sorted table, or with a [secondary key](./0035-table-keys.md) and `USING KEY`, the system jumps straight to the matching rows instead of reading them all.

> [!WARNING]
> A loop inside a loop over two large standard tables (for example all bookings for each flight) reads `n × m` rows and gets very slow. Make the inner table sorted or hashed, or give it a secondary key, so that the inner `LOOP ... WHERE` or `READ TABLE` doesn't scan the whole table.

## Control level statements

Inside a loop, you can run code when a group of rows starts or ends. The groups are formed by the leftmost fields of the row, so the table **must be sorted** by those fields first.

| Statement         | Runs                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `AT FIRST`        | once, at the first row                                                                     |
| `AT NEW field`    | at the first row of each group of `field`                                                  |
| `AT END OF field` | at the last row of each group of `field`                                                   |
| `AT LAST`         | once, at the last row                                                                      |
| `SUM`             | inside `AT END OF` or `AT LAST`: totals the numeric fields of the group into the work area |

A group "of `field`" means all consecutive rows with the same value in `field` **and in every field to its left**. `SORT` is explained in [sorting, summing, and removing duplicates](./0040-sorting-and-duplicates.md).

```abap
SORT lt_flights BY carrid connid.

LOOP AT lt_flights INTO ls_flight.
  AT FIRST.
    WRITE / 'Seats occupied by airline'.
    ULINE.
  ENDAT.

  AT NEW carrid.
    WRITE / ls_flight-carrid.            " the first row of a new airline
  ENDAT.

  WRITE: /5 ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc.

  AT END OF carrid.
    SUM.                                 " seatsocc now holds the group total
    WRITE: /5 'Total', ls_flight-seatsocc.
  ENDAT.

  AT LAST.
    SUM.
    WRITE: / 'Grand total', ls_flight-seatsocc.
  ENDAT.
ENDLOOP.
```

Rules for control levels:

- Inside `AT ... ENDAT`, the fields to the right of the group field don't hold the values of the current row: they're replaced by initial values or asterisks. Use them outside the `AT` block.
- Don't combine control levels with `WHERE`, `FROM`, or `TO`: the groups would be computed on the full table, not on the rows you process.
- The work area must be declared with the table's row type (here `INTO DATA(ls_flight)` does that).

> [!TIP]
> Control levels are like the subtotals on a supermarket receipt sorted by department: the cashier prints a header when a new department starts, the items, and a subtotal when it ends. If the items aren't sorted by department, you'd get a header and a subtotal for every item.

For more flexible grouping, without sorting and without the asterisk rules, modern ABAP has `LOOP AT ... GROUP BY`: see [grouping internal tables](./0095-grouping-internal-tables.md).

## Exercise

> [!IMPORTANT]
>
> 1. With the table `lt_flights` from this lesson, print only the flights on `20260301`.
> 2. Sort the table by `carrid connid` and print, for each connection, the total of `seatsocc` with `AT END OF connid` and `SUM`.

### Solution

```abap
LOOP AT lt_flights INTO DATA(ls_flight) WHERE fldate = '20260301'.
  WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
ENDLOOP.

SORT lt_flights BY carrid connid.
LOOP AT lt_flights INTO ls_flight.
  AT END OF connid.
    SUM.
    WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
  ENDAT.
ENDLOOP.
```

`AT END OF connid` closes a group whenever `carrid` or `connid` changes, because `carrid` is to the left of `connid`.

> [!NOTE]
>
> - `LOOP AT ... INTO` copies each row into a work area; `sy-tabix` is the current row number.
> - `WHERE` filters the rows; `FROM` and `TO` limit the row numbers (index tables only).
> - Nested loops over big standard tables are slow: use sorted or hashed tables, or secondary keys, for the inner table.
> - `AT FIRST`, `AT NEW`, `AT END OF`, and `AT LAST` need a table sorted by the group fields; `SUM` totals the numeric fields.
> - Inside an `AT` block, the fields to the right of the group field aren't reliable.
