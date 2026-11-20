---
title: 'Writing data: INSERT, UPDATE, MODIFY, DELETE'
description: Change the contents of database tables.
---

_Basic level_

Reading is only half the job. ABAP SQL has four statements that change the contents of a database table: `INSERT` adds rows, `UPDATE` changes them, `MODIFY` adds or changes, and `DELETE` removes them.

The examples use `ZSCARR`, a copy of `SCARR` with the fields `MANDT`, `CARRID`, `CARRNAME`, `CURRCODE`, and `URL` (create it as in [Database tables](./0046-database-tables.en.md)). Practice on your own Z tables only.

> [!CAUTION]
> Never write directly to standard SAP tables such as `MARA`, `VBAK`, or `BKPF`. You bypass every check and every dependent table, and the data becomes inconsistent. Change standard data only through BAPIs, function modules, or released APIs (see [BAPIs](./0071-bapis.en.md)).

## INSERT

`INSERT` adds a new row. If a row with the same primary key already exists, nothing is written and `sy-subrc` is `4`.

```abap
REPORT zinsert_demo.

DATA ls_carrier TYPE zscarr.

ls_carrier-carrid   = 'ZZ'.
ls_carrier-carrname = 'Notebook Air'.
ls_carrier-currcode = 'EUR'.

INSERT zscarr FROM @ls_carrier.

IF sy-subrc = 0.
  WRITE: / 'Airline added'.
ELSE.
  WRITE: / 'Airline', ls_carrier-carrid, 'already exists'.
ENDIF.
```

You don't fill `MANDT`: ABAP SQL always writes into the current client, whatever the work area contains.

To insert many rows at once, use `FROM TABLE`. It's much faster than an `INSERT` per row in a loop:

```abap
DATA lt_carriers TYPE STANDARD TABLE OF zscarr WITH EMPTY KEY.

lt_carriers = VALUE #( ( carrid = 'Z1' carrname = 'First Air'  currcode = 'EUR' )
                       ( carrid = 'Z2' carrname = 'Second Air' currcode = 'USD' ) ).

INSERT zscarr FROM TABLE @lt_carriers ACCEPTING DUPLICATE KEYS.
WRITE: / sy-dbcnt, 'rows inserted'.
```

> [!WARNING]
> Without `ACCEPTING DUPLICATE KEYS`, a duplicate key in `FROM TABLE` ends the program with a runtime error. With it, the duplicates are skipped, the other rows are inserted, and `sy-subrc` is `4`.

## UPDATE

`UPDATE ... FROM` overwrites an existing row, found by its primary key. If the row doesn't exist, nothing happens and `sy-subrc` is `4`.

```abap
ls_carrier-carrid   = 'ZZ'.
ls_carrier-carrname = 'Notebook Airlines'.
ls_carrier-currcode = 'EUR'.

UPDATE zscarr FROM @ls_carrier.        " all non-key fields are overwritten
```

Every field of the work area is written, so a field you left empty becomes empty in the database. To change only some columns, use `SET` with a `WHERE`:

```abap
UPDATE zscarr
  SET currcode = 'USD'
  WHERE carrid = 'Z1'.

UPDATE zscarr
  SET url = 'https://example.com'
  WHERE currcode = 'EUR'.              " can change many rows

WRITE: / sy-dbcnt, 'rows changed'.
```

`UPDATE ... FROM TABLE @itab` updates many rows at once by key.

## MODIFY

`MODIFY` inserts the row if its key doesn't exist and updates it if it does. It's handy when you don't know or don't care which case applies, for example when you load data from a file.

```abap
MODIFY zscarr FROM @ls_carrier.               " one row
MODIFY zscarr FROM TABLE @lt_carriers.        " many rows
```

`sy-subrc` is `0` when all rows were written.

> [!TIP]
> `INSERT` is adding a new contact to your phone: if the name is already there, the phone refuses. `UPDATE` is editing a contact that must already exist. `MODIFY` is "save": the phone creates the contact or overwrites it, whichever is needed.

## DELETE

`DELETE` removes rows, either by key from a work area or table, or by a condition:

```abap
DELETE zscarr FROM @ls_carrier.               " by the key of the work area
DELETE zscarr FROM TABLE @lt_carriers.        " by the keys of the table rows

DELETE FROM zscarr WHERE carrid LIKE 'Z%'.    " by a condition
WRITE: / sy-dbcnt, 'rows deleted'.
```

> [!CAUTION]
> `DELETE FROM zscarr` without a `WHERE` deletes **every** row of the table in the current client. Double-check the `WHERE` of every `DELETE` and `UPDATE ... SET` before you run it, and test on a development system.

## `sy-subrc`, `sy-dbcnt`, and what comes next

| Statement | `sy-subrc = 0`               | `sy-subrc = 4`                                                   |
| --------- | ---------------------------- | ---------------------------------------------------------------- |
| `INSERT`  | all rows inserted            | a key already exists (that row is skipped)                       |
| `UPDATE`  | the rows were changed        | no row found, or with `FROM TABLE` at least one row not found    |
| `MODIFY`  | all rows inserted or changed | a row couldn't be written (for example a unique secondary index) |
| `DELETE`  | the rows were deleted        | no row found, or with `FROM TABLE` at least one row not found    |

`sy-dbcnt` always holds the number of rows processed.

Two more things matter before you write real programs. First, lock the data before you change it, so that two users don't overwrite each other: see [Lock objects](./0051-lock-objects.en.md). Second, changes aren't final until they're committed: see [The LUW: COMMIT and ROLLBACK](./0060-luw-commit-and-rollback.en.md).

## Exercise

> [!IMPORTANT]
>
> 1. Insert three airlines into `ZSCARR` with one `INSERT ... FROM TABLE`.
> 2. Change the currency of one of them with `UPDATE ... SET`.
> 3. Delete all three with a single `DELETE ... WHERE`, and print `sy-dbcnt` after each step.

### Solution

```abap
REPORT zwrite_exercise.

DATA lt_carriers TYPE STANDARD TABLE OF zscarr WITH EMPTY KEY.

lt_carriers = VALUE #( ( carrid = 'Z1' carrname = 'Alpha Air' currcode = 'EUR' )
                       ( carrid = 'Z2' carrname = 'Beta Air'  currcode = 'EUR' )
                       ( carrid = 'Z3' carrname = 'Gamma Air' currcode = 'EUR' ) ).

INSERT zscarr FROM TABLE @lt_carriers ACCEPTING DUPLICATE KEYS.
WRITE: / 'Inserted:', sy-dbcnt.

UPDATE zscarr SET currcode = 'JPY' WHERE carrid = 'Z3'.
WRITE: / 'Updated:', sy-dbcnt.

DELETE FROM zscarr WHERE carrid IN ( 'Z1', 'Z2', 'Z3' ).
WRITE: / 'Deleted:', sy-dbcnt.
```

> [!NOTE]
>
> - `INSERT` adds rows, `UPDATE` changes them, `MODIFY` does either, `DELETE` removes them.
> - Use `FROM TABLE` to process many rows in one statement.
> - `UPDATE ... FROM` overwrites every field; `UPDATE ... SET` changes only the listed columns.
> - Check `sy-subrc` and `sy-dbcnt`; a `DELETE` or `UPDATE ... SET` without `WHERE` hits every row.
> - Write only to your own tables; change standard data through BAPIs or released APIs.
