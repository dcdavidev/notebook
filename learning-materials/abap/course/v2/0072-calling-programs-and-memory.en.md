---
title: Calling programs, SAP memory, and ABAP memory
description: SUBMIT, CALL TRANSACTION, SET/GET PARAMETER, EXPORT/IMPORT.
---

_Basic level_

A program can start other programs: run a report with `SUBMIT`, or open a transaction with `CALL TRANSACTION`. Often the two programs need to share data, for example to open a transaction already filled with the airline the user just selected.

ABAP has two memory areas for this, with confusingly similar names: **SAP memory** and **ABAP memory**. This lesson shows how to call programs and when to use each memory.

## Running a report with SUBMIT

`SUBMIT` runs an executable program. With `AND RETURN`, control comes back to your program when the called report ends; without it, your program ends and is replaced by the called one.

```abap
DATA lt_dates TYPE RANGE OF s_date.
lt_dates = VALUE #( ( sign = 'I' option = 'BT' low = '20260101' high = '20261231' ) ).

SUBMIT zflight_report
  WITH p_carrid = 'LH'          " fill a parameter
  WITH s_fldate IN lt_dates     " fill a SELECT-OPTIONS with a range table
  AND RETURN.
```

| Addition                     | Effect                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `WITH p = value`             | sets a parameter or a single value of a `SELECT-OPTIONS`                              |
| `WITH s IN range_table`      | fills a `SELECT-OPTIONS` with a [range table](./0064-select-options-and-ranges.en.md) |
| `USING SELECTION-SET 'VAR1'` | uses a [variant](./0068-variants-and-background-jobs.en.md)                           |
| `VIA SELECTION-SCREEN`       | shows the selection screen of the called report first                                 |
| `EXPORTING LIST TO MEMORY`   | keeps the list in memory instead of showing it                                        |
| `VIA JOB name NUMBER n`      | runs the report as a step of a background job                                         |

> [!WARNING]
> Without `AND RETURN`, the code after `SUBMIT` never runs. If your program "stops" after a `SUBMIT`, check that you didn't forget it.

## Opening a transaction with CALL TRANSACTION

`CALL TRANSACTION` starts a transaction and returns to your program when the user leaves it. `LEAVE TO TRANSACTION` starts a transaction and doesn't come back.

```abap
CALL TRANSACTION 'SE16' WITH AUTHORITY-CHECK.
```

- `WITH AUTHORITY-CHECK` checks that the user is allowed to start the transaction (the same check as typing it in the command field). Always add it: without it, the extended program check reports a security warning.
- `AND SKIP FIRST SCREEN` skips the first screen of the transaction. It works only if all the required fields of that screen are already filled, usually through SAP memory (see below).
- `USING bdc_table` feeds the transaction with input values: that's [batch input](./0130-batch-input.en.md).

## SAP memory: SET and GET PARAMETER

**SAP memory** belongs to the user's logon. It's shared by all the windows (sessions) the user has open, and it lives until logoff. It holds short values identified by a **parameter ID** (`SPA/GPA` parameter) of up to 20 characters.

```abap
SET PARAMETER ID 'CAR' FIELD p_carrid.     " write

DATA lv_carrid TYPE s_carr_id.
GET PARAMETER ID 'CAR' FIELD lv_carrid.    " read; sy-subrc = 4 if not set
```

Parameter IDs are linked to data elements in the [Dictionary](./0045-data-elements.en.md): `S_CARR_ID` has the parameter ID `CAR`. Screen fields based on such a data element can read and write SAP memory, which is why a value you enter in one transaction often appears as the default in the next one. On a selection screen you turn this on with the addition `MEMORY ID`:

```abap
PARAMETERS p_carrid TYPE s_carr_id MEMORY ID car.   " filled from SAP memory
```

You can see and set your own values in **System > User Profile > Own Data**, tab **Parameters**.

A classic use: fill the first screen of a transaction before you open it.

```abap
DATA lv_program TYPE programm VALUE 'ZFLIGHT_REPORT'.
SET PARAMETER ID 'RID' FIELD lv_program.         " RID = program name in SE38
CALL TRANSACTION 'SE38' WITH AUTHORITY-CHECK.    " the program name is already filled in
```

## ABAP memory: EXPORT and IMPORT

**ABAP memory** belongs to a **call sequence**: the chain of programs started with `SUBMIT ... AND RETURN` and `CALL TRANSACTION` from the same main session. It can hold any data object, including internal tables, under an ID you choose.

```abap
" In the calling program
DATA lt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.
SELECT * FROM scarr INTO TABLE @lt_carriers.

EXPORT carriers = lt_carriers TO MEMORY ID 'ZFLIGHT_CARRIERS'.
SUBMIT zflight_receiver AND RETURN.
FREE MEMORY ID 'ZFLIGHT_CARRIERS'.

" In ZFLIGHT_RECEIVER
DATA lt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.
IMPORT carriers = lt_carriers FROM MEMORY ID 'ZFLIGHT_CARRIERS'.
IF sy-subrc <> 0.
  WRITE / 'Nothing in ABAP memory'.
ENDIF.
```

- The name before `=` (`carriers`) is the name of the data in the memory cluster. Use the same name and a compatible type in `EXPORT` and `IMPORT`.
- `FREE MEMORY ID` deletes the data when you no longer need it.

| Memory      | Statements                                       | Scope                                  | Content                |
| ----------- | ------------------------------------------------ | -------------------------------------- | ---------------------- |
| SAP memory  | `SET PARAMETER`, `GET PARAMETER`                 | all sessions of the user, until logoff | short character values |
| ABAP memory | `EXPORT ... TO MEMORY`, `IMPORT ... FROM MEMORY` | one call sequence in one session       | any data, also tables  |

> [!TIP]
> SAP memory is the sticky note on your monitor: every window you open can read it, and it stays until you go home. ABAP memory is a folder passed from hand to hand inside one office: only the people in that chain see it.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report `ZFLIGHT_SENDER` that reads the connections of an airline from `SPFLI`, puts them in ABAP memory, and calls `ZFLIGHT_RECEIVER` with `SUBMIT ... AND RETURN`.
> 2. Write `ZFLIGHT_RECEIVER`, which imports the table and writes it.
> 3. In `ZFLIGHT_SENDER`, also set the parameter ID `CAR`. Give `ZFLIGHT_RECEIVER` a parameter `p_carrid` with `MEMORY ID car`, call it with `VIA SELECTION-SCREEN`, and check that the field is already filled.

### Solution

```abap
REPORT zflight_sender.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT * FROM spfli
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_connections).

  EXPORT connections = lt_connections TO MEMORY ID 'ZFLIGHT_CONN'.
  SET PARAMETER ID 'CAR' FIELD p_carrid.
  SUBMIT zflight_receiver VIA SELECTION-SCREEN AND RETURN.
  FREE MEMORY ID 'ZFLIGHT_CONN'.
```

```abap
REPORT zflight_receiver.

PARAMETERS p_carrid TYPE s_carr_id MEMORY ID car.   " shows the value from SAP memory

START-OF-SELECTION.
  DATA lt_connections TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.
  IMPORT connections = lt_connections FROM MEMORY ID 'ZFLIGHT_CONN'.

  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
```

> [!NOTE]
>
> - `SUBMIT ... AND RETURN` runs a report and comes back; `WITH`, `USING SELECTION-SET`, and `VIA SELECTION-SCREEN` control its input.
> - `CALL TRANSACTION ... WITH AUTHORITY-CHECK` opens a transaction and comes back; `AND SKIP FIRST SCREEN` skips a pre-filled first screen.
> - SAP memory (`SET`/`GET PARAMETER`) is shared by all sessions of a user and holds short values by parameter ID.
> - ABAP memory (`EXPORT`/`IMPORT ... MEMORY ID`) is shared by the programs of one call sequence and holds any data, including tables.
> - Clean up ABAP memory with `FREE MEMORY ID` when you're done.
