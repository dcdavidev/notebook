---
title: SELECT SINGLE and UP TO n ROWS
description: Read one row, or only the first rows.
---

_Basic level_

Often you don't need a whole table. You want the one airline whose code the user entered, or the five most expensive flights. Reading everything and throwing most of it away wastes time on the database and on the network.

`SELECT SINGLE` reads exactly one row into a structure. `UP TO n ROWS` limits a result to its first `n` rows. Both tell the database to stop early.

## SELECT SINGLE

`SELECT SINGLE` reads one row and puts it into a structure or a single variable. You always combine it with a `WHERE` clause that identifies the row; [WHERE and ORDER BY](./0054-where-and-order-by.en.md) covers the conditions in detail.

```abap
REPORT zselect_single_demo.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT SINGLE carrid, carrname, currcode
    FROM scarr
    WHERE carrid = @p_carr
    INTO @DATA(ls_carrier).

  IF sy-subrc = 0.
    WRITE: / ls_carrier-carrid, ls_carrier-carrname, ls_carrier-currcode.
  ELSE.
    WRITE: / 'Airline', p_carr, 'not found'.
  ENDIF.
```

- The target has no `TABLE`: it's a structure, here declared inline.
- `p_carr` is an ABAP variable, so it gets the `@`.
- `sy-subrc` is `0` if the row exists and `4` if it doesn't. In that case the target keeps its old contents, so never use it without checking.

With one column, the target can be a simple variable:

```abap
SELECT SINGLE carrname
  FROM scarr
  WHERE carrid = @p_carr
  INTO @DATA(lv_name).
```

> [!WARNING]
> Use `SELECT SINGLE` with the **full primary key** in the `WHERE` (except the client). If the condition matches several rows, the database returns one of them, and which one isn't defined. The extended program check and ATC warn you about it.

## Checking that a row exists

To know only whether a row exists, you don't need any of its columns. Select a constant instead:

```abap
SELECT SINGLE @abap_true
  FROM spfli
  WHERE carrid = @p_carr
  INTO @DATA(lv_exists).

IF lv_exists = abap_true.
  WRITE: / p_carr, 'has at least one connection'.
ENDIF.
```

Here the `WHERE` isn't the full key, and that's fine: you don't care which row the database finds, only that there's one.

> [!TIP]
> `SELECT SINGLE @abap_true` is like calling a restaurant to ask "do you have a free table tonight?" You don't ask which table: a yes is all you need.

## UP TO n ROWS

`UP TO n ROWS` reads at most `n` rows into an internal table. To make "the first rows" mean something, sort the result with `ORDER BY`:

```abap
SELECT carrid, connid, fldate, price
  FROM sflight
  ORDER BY price DESCENDING
  INTO TABLE @DATA(lt_expensive)
  UP TO 5 ROWS.

LOOP AT lt_expensive INTO DATA(ls_flight).
  WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-fldate, ls_flight-price.
ENDLOOP.
```

The database sorts all flights by price, highest first, and returns only the first five. `sy-dbcnt` tells you how many rows you actually got: fewer than five if the table is small.

Without `ORDER BY`, you get any five rows, in no guaranteed order. That's acceptable only for quick tests, such as "show me some data".

If `n` is `0`, there's no limit: you get all rows. `n` can be a variable, for example a parameter on the selection screen:

```abap
PARAMETERS p_max TYPE i DEFAULT 10.
...
SELECT carrid, connid, fldate
  FROM sflight
  ORDER BY carrid, connid, fldate
  INTO TABLE @DATA(lt_first)
  UP TO @p_max ROWS.
```

From ABAP 7.51, `OFFSET o` skips the first `o` rows, which is useful to read a result page by page. It requires `ORDER BY`:

```abap
SELECT carrid, connid, fldate
  FROM sflight
  ORDER BY carrid, connid, fldate
  INTO TABLE @DATA(lt_page)
  UP TO 10 ROWS OFFSET 20.        " rows 21 to 30
```

## SINGLE or UP TO 1 ROWS

| You want                                        | Use                                      |
| ----------------------------------------------- | ---------------------------------------- |
| the row with this exact key                     | `SELECT SINGLE` with the full key        |
| to know whether any row matches                 | `SELECT SINGLE @abap_true`               |
| the first row in a given order (cheapest, last) | `ORDER BY` + `UP TO 1 ROWS` into a table |
| the first `n` rows                              | `ORDER BY` + `UP TO n ROWS`              |

`SELECT SINGLE` doesn't allow `ORDER BY`. In older code, you'll see `SELECT ... UP TO 1 ROWS ... ENDSELECT` used to read "one row in an order": it works, but reading into a table and taking the first row is clearer.

## Exercise

> [!IMPORTANT]
>
> 1. Read the name of the airline entered on the selection screen with `SELECT SINGLE`, and print a message if it doesn't exist.
> 2. For the same airline, print the three flights in `SFLIGHT` with the most occupied seats in economy (`SEATSOCC`).

### Solution

```abap
REPORT zselect_up_to.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT SINGLE carrname
    FROM scarr
    WHERE carrid = @p_carr
    INTO @DATA(lv_name).
  IF sy-subrc <> 0.
    WRITE: / 'Airline', p_carr, 'not found'.
    RETURN.
  ENDIF.
  WRITE: / lv_name.

  SELECT connid, fldate, seatsocc, seatsmax
    FROM sflight
    WHERE carrid = @p_carr
    ORDER BY seatsocc DESCENDING
    INTO TABLE @DATA(lt_full)
    UP TO 3 ROWS.

  LOOP AT lt_full INTO DATA(ls_flight).
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc, '/', ls_flight-seatsmax.
  ENDLOOP.
```

> [!NOTE]
>
> - `SELECT SINGLE` reads one row into a structure; use it with the full primary key.
> - Always check `sy-subrc` before you use the result of `SELECT SINGLE`.
> - `SELECT SINGLE @abap_true` is the cheapest way to check that a row exists.
> - `UP TO n ROWS` limits the result; combine it with `ORDER BY` to get meaningful first rows.
> - `OFFSET` (from 7.51) skips rows for paging.
