---
title: SELECT-OPTIONS and ranges
description: Let the user enter intervals and lists of values.
---

_Basic level_

A parameter takes one value. Users often want more: airlines `AA` to `LH`, every flight date in March except the 15th, all cities that start with "NEW". `SELECT-OPTIONS` gives them a field with a "from" and a "to" value, and a button for multiple selection where they can enter lists, intervals, patterns, and exclusions.

Behind each select-option there's a **range table**, an internal table with a fixed structure. You pass it straight to a `WHERE` with `IN`, and the database applies whatever the user entered.

## Declaring a select-option

`SELECT-OPTIONS` needs a reference to a data object, and takes its type from it:

```abap
REPORT zselect_options_demo.

DATA gv_carrid TYPE s_carr_id.
DATA gv_fldate TYPE s_date.

SELECT-OPTIONS:
  s_carr FOR gv_carrid,
  s_date FOR gv_fldate.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, price
    FROM sflight
    WHERE carrid IN @s_carr
      AND fldate IN @s_date
    ORDER BY carrid, connid, fldate
    INTO TABLE @DATA(lt_flights).

  WRITE: / lines( lt_flights ), 'flights'.
```

- The name has at most 8 characters; `s_` is the usual prefix.
- The field gets the F4 help and labels of `gv_carrid`'s type.
- `IN @s_carr` applies the whole selection. If the user leaves the field empty, the condition is always true: **all** airlines are read.

> [!TIP]
> A select-option is like a filter in an online shop. You can tick a few brands, set a price range, and exclude one color. If you set no filter at all, the shop shows you every product.

## The range table

A select-option is an internal table with four columns:

| Column   | Meaning                                | Values                                                     |
| -------- | -------------------------------------- | ---------------------------------------------------------- |
| `SIGN`   | include or exclude the matching values | `I` include, `E` exclude                                   |
| `OPTION` | the comparison operator                | `EQ`, `NE`, `GT`, `GE`, `LT`, `LE`, `BT`, `NB`, `CP`, `NP` |
| `LOW`    | the value, or the lower limit          | same type as the referenced field                          |
| `HIGH`   | the upper limit, for `BT` and `NB`     | same type as the referenced field                          |

`BT` means "between" and `NB` "not between". `CP` and `NP` mean "matches a pattern" and "doesn't match it", with `*` for any characters and `+` for one character. The system sets `CP` automatically when the user types a `*`.

For example, "airlines `AA` to `LH`, but not `DL`" is stored as:

```text
SIGN  OPTION  LOW  HIGH
I     BT      AA   LH
E     EQ      DL
```

A value matches if it matches at least one `I` row and no `E` row.

> [!WARNING]
> For historical reasons, a select-option is a table **with a header line**: `s_carr` alone can mean the header line, and `s_carr[]` means the table body. In modern code, write `s_carr[]` when you mean the table, for example `IF s_carr[] IS INITIAL` or `LOOP AT s_carr[] INTO ...`. In `WHERE ... IN @s_carr` both forms work.

## Useful additions

```abap
DATA gv_connid TYPE s_conn_id.

SELECT-OPTIONS:
  s_carr FOR gv_carrid DEFAULT 'AA' TO 'LH',           " interval as default
  s_date FOR gv_fldate NO-EXTENSION,                    " no multiple selection button
  s_conn FOR gv_connid NO INTERVALS,                    " only single values, no "to" field
  s_req  FOR gv_carrid OBLIGATORY.                      " at least the first field required
```

| Addition                                      | Effect                                                           |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `DEFAULT a TO b`                              | proposes an interval (`DEFAULT a` alone proposes a single value) |
| `NO INTERVALS`                                | hides the "to" field                                             |
| `NO-EXTENSION`                                | hides the multiple selection button: only one row                |
| `OBLIGATORY`                                  | the user must enter a value in the first field                   |
| `NO INTERVALS NO-EXTENSION`                   | together, a single value field that's still a range              |
| `LOWER CASE`, `MEMORY ID`, `MATCHCODE OBJECT` | as for [PARAMETERS](./0063-parameters.md)                        |

## Ranges in your own code

You can build range tables yourself, without a selection screen. Declare the type with `TYPE RANGE OF` and fill it with `VALUE`:

```abap
TYPES ty_carrid_range TYPE RANGE OF s_carr_id.

DATA(lt_carriers) = VALUE ty_carrid_range(
  ( sign = 'I' option = 'EQ' low = 'LH' )
  ( sign = 'I' option = 'EQ' low = 'AA' )
  ( sign = 'I' option = 'BT' low = 'SQ' high = 'UA' ) ).

SELECT carrid, carrname
  FROM scarr
  WHERE carrid IN @lt_carriers
  INTO TABLE @DATA(lt_selected).
```

The `IN` operator also works in ABAP logical expressions, outside SQL:

```abap
IF 'LH' IN lt_carriers.
  WRITE: / 'LH is selected'.
ENDIF.
```

In older code you'll see `RANGES r_carr FOR scarr-carrid.`: it declares a range table with a header line and is obsolete. Use `TYPE RANGE OF` instead.

> [!CAUTION]
> A range table with many thousands of rows becomes a huge `WHERE` clause and can end in a database error. Don't use ranges to pass long lists of keys from another table: use a [join](./0055-joins.md) or [FOR ALL ENTRIES](./0057-for-all-entries.md).

## Exercise

> [!IMPORTANT]
>
> 1. Write a report with select-options for airline and departure city on `SPFLI`, where the city has no interval.
> 2. Print the connections that match, and print "all airlines" if the user left the airline field empty.
> 3. Build a range in the code that excludes `LH`, and add it to the `WHERE`.

### Solution

```abap
REPORT zselect_options_exercise.

DATA gv_carrid TYPE s_carr_id.
DATA gv_city   TYPE s_from_cit.

SELECT-OPTIONS:
  s_carr FOR gv_carrid,
  s_city FOR gv_city NO INTERVALS.

START-OF-SELECTION.
  IF s_carr[] IS INITIAL.
    WRITE: / 'All airlines'.
  ENDIF.

  TYPES ty_carrid_range TYPE RANGE OF s_carr_id.
  DATA(lt_no_lh) = VALUE ty_carrid_range( ( sign = 'E' option = 'EQ' low = 'LH' ) ).

  SELECT carrid, connid, cityfrom, cityto
    FROM spfli
    WHERE carrid   IN @s_carr
      AND carrid   IN @lt_no_lh
      AND cityfrom IN @s_city
    ORDER BY carrid, connid
    INTO TABLE @DATA(lt_connections).

  LOOP AT lt_connections INTO DATA(ls_conn).
    WRITE: / ls_conn-carrid, ls_conn-connid, ls_conn-cityfrom, ls_conn-cityto.
  ENDLOOP.
```

A range with only `E` rows matches every value except the excluded ones.

> [!NOTE]
>
> - `SELECT-OPTIONS s_x FOR dobj` lets the user enter single values, intervals, patterns, and exclusions.
> - Each select-option is a range table with `SIGN`, `OPTION`, `LOW`, and `HIGH`.
> - `WHERE col IN @s_x` applies the selection; an empty range selects everything.
> - Use `s_x[]` for the table body, because select-options have a header line.
> - Build your own ranges with `TYPE RANGE OF` and `VALUE`; `RANGES` is obsolete.
