---
title: Grouping internal tables
description: LOOP AT ... GROUP BY and LOOP AT GROUP.
level: intermediate
---

Reports often need data per group: bookings per customer, flights per carrier, seats per month. The control level statements `AT NEW` and `AT END OF` from [looping over internal tables](./0038-looping-internal-tables.md) can do it, but only if the table is sorted the right way and the group fields are at the start of the row. **Grouping** with `LOOP AT ... GROUP BY` has neither limit: you name the group key, ABAP builds the groups, and you process each group and its rows.

## LOOP AT ... GROUP BY

The outer loop runs **once per group**. `GROUP BY` names the key, and `INTO` gives you a variable that represents the group:

```abap
REPORT zgrouping.

SELECT * FROM sflight INTO TABLE @DATA(lt_flights).

LOOP AT lt_flights INTO DATA(ls_flight)
     GROUP BY ls_flight-carrid
     INTO DATA(lv_carrid).

  WRITE / lv_carrid.

  LOOP AT GROUP lv_carrid INTO DATA(ls_member).
    WRITE: / '  ', ls_member-connid, ls_member-fldate.
  ENDLOOP.

ENDLOOP.
```

- `GROUP BY ls_flight-carrid` is the group key: one group for each distinct carrier.
- `INTO DATA(lv_carrid)` declares the **group key binding**. With a simple key it has the type of the key.
- `LOOP AT GROUP lv_carrid` is the inner loop over the **members** of the current group, the original rows.

The table doesn't need to be sorted. By default the groups come in the order in which their first row appears in the table.

> [!TIP]
> Grouping is like sorting a pile of mail into pigeonholes. You go through the pile once and drop each letter into the hole with the recipient's name. Then you go from hole to hole: the label is the group key, and the letters inside are the members.

## Keys with several fields

For a key with several components, write a structure in parentheses. You can add `GROUP SIZE` and `GROUP INDEX` to get the number of rows in the group and the position of the group:

```abap
LOOP AT lt_flights INTO ls_flight
     GROUP BY ( carrid = ls_flight-carrid
                connid = ls_flight-connid
                size   = GROUP SIZE
                index  = GROUP INDEX )
     ASCENDING
     INTO DATA(ls_group).

  WRITE: / ls_group-index, ls_group-carrid, ls_group-connid,
           ls_group-size, 'flights'.

ENDLOOP.
```

The names in the parentheses (`carrid`, `connid`, `size`, `index`) become the components of `ls_group`. The key components can be any expression, not just fields: `month = ls_flight-fldate(6)` groups by year and month.

`ASCENDING` or `DESCENDING` sorts the groups by their key. The rows inside each group keep their original order.

## Computing per group

Inside the group loop you can do whatever you need with the members. Often you just want a sum or a count:

```abap
LOOP AT lt_flights INTO ls_flight
     GROUP BY ls_flight-carrid
     INTO DATA(lv_carrier).

  DATA(lv_seats) = 0.
  LOOP AT GROUP lv_carrier INTO DATA(ls_row).
    lv_seats = lv_seats + ls_row-seatsocc.
  ENDLOOP.

  WRITE: / lv_carrier, lv_seats.
ENDLOOP.
```

The same sum can be written with [`REDUCE`](./0093-for-and-reduce.md) and `FOR ... IN GROUP`:

```abap
  DATA(lv_seats2) = REDUCE i( INIT lv_sum = 0
                              FOR ls_row2 IN GROUP lv_carrier
                              NEXT lv_sum = lv_sum + ls_row2-seatsocc ).
```

If you don't need the members at all, add `WITHOUT MEMBERS`: ABAP then only builds the keys, which is faster, but `LOOP AT GROUP` is no longer allowed.

## Groups in a single expression

`FOR GROUPS` brings grouping into a [constructor expression](./0091-constructor-expressions.md). This builds a table with one row per carrier and the number of its flights:

```abap
TYPES: BEGIN OF ty_count,
         carrid  TYPE s_carr_id,
         flights TYPE i,
       END OF ty_count,
       tt_counts TYPE STANDARD TABLE OF ty_count WITH EMPTY KEY.

DATA(lt_counts) = VALUE tt_counts(
  FOR GROUPS ls_grp OF ls_fl IN lt_flights
      GROUP BY ( carrid = ls_fl-carrid size = GROUP SIZE )
  ( carrid = ls_grp-carrid flights = ls_grp-size ) ).
```

> [!WARNING]
> Without `INTO`, the work area of the outer loop becomes the group representative: it holds the **first row** of each group, not the key, and you write `LOOP AT GROUP ls_flight`. This **representative binding** is easy to misread, because fields that aren't in the key just show the values of that first row. Prefer an explicit `INTO` group binding.

## Exercise

> [!IMPORTANT]
>
> 1. Read `SBOOK` for carrier `LH` (use `UP TO 1000 ROWS`).
> 2. Group the bookings by customer (`customid`), sorted by customer, with the group size.
> 3. For each customer print the number of bookings and the total `forcuram`, and list the bookings that are cancelled (`cancelled = 'X'`).

### Solution

```abap
SELECT * FROM sbook WHERE carrid = 'LH' INTO TABLE @DATA(lt_bookings) UP TO 1000 ROWS.

LOOP AT lt_bookings INTO DATA(ls_booking)
     GROUP BY ( customid = ls_booking-customid size = GROUP SIZE )
     ASCENDING
     INTO DATA(ls_customer).

  DATA(lv_total) = REDUCE s_f_cur_pr( INIT lv_sum = CONV s_f_cur_pr( 0 )
                                      FOR ls_b IN GROUP ls_customer
                                      NEXT lv_sum = lv_sum + ls_b-forcuram ).
  WRITE: / ls_customer-customid, ls_customer-size, lv_total.

  LOOP AT GROUP ls_customer INTO DATA(ls_member) WHERE cancelled = abap_true.
    WRITE: / '  cancelled:', ls_member-bookid.
  ENDLOOP.
ENDLOOP.
```

> [!NOTE]
>
> - `LOOP AT itab ... GROUP BY key INTO group` runs once per group; the table doesn't need to be sorted.
> - `LOOP AT GROUP group` loops over the members of the current group; it accepts `WHERE`.
> - A key with several fields is a structure in parentheses; `GROUP SIZE` and `GROUP INDEX` add the size and position.
> - `ASCENDING` or `DESCENDING` sorts the groups; `WITHOUT MEMBERS` skips the members.
> - `FOR GROUPS ... OF ... IN` and `FOR ... IN GROUP` bring grouping into `VALUE` and `REDUCE`.
