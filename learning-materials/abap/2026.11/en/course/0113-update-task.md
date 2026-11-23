---
title: Update function modules
description: CALL FUNCTION IN UPDATE TASK, PERFORM ON COMMIT, and SM13.
level: intermediate
---

An SAP LUW often spans several screens, and each screen step can run in a different work process with its own database commit. To keep all the changes together, you don't write to the database right away: you **register** the changes and let SAP execute them all at once when the program calls `COMMIT WORK`. The tool for this is the **update function module**.

This lesson builds on [the LUW: COMMIT and ROLLBACK](./0060-luw-commit-and-rollback.md) and [function modules](./0070-function-modules.md).

## How the update task works

When you call a function module `IN UPDATE TASK`, it doesn't run. The runtime stores its name and the values of its parameters in the update tables (`VBHDR`, `VBMOD`, `VBDATA`). Only at `COMMIT WORK` does an **update work process** read those records and run all the registered modules in a single database LUW.

- If every module ends without errors, the update work process commits.
- If one module fails, everything in that update is rolled back, and the record stays in the update tables with an error status.
- `ROLLBACK WORK` before the commit throws away all the registered calls.

> [!TIP]
> It's like a shopping cart. You put items in the cart while you browse (the `CALL FUNCTION ... IN UPDATE TASK` calls), but nothing is charged. At checkout (`COMMIT WORK`) everything is paid in one transaction, or nothing is.

## Create an update function module

In `SE37`, create the function module and on the **Attributes** tab set the **processing type** to **Update module**. You then pick one of these options:

| Option                      | Meaning                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| Start immediately (V1)      | critical update: runs first, can be restarted from `SM13` after an error     |
| Immediate start, no restart | V1 update that can't be restarted                                            |
| Start delayed (V2)          | non-critical update (statistics, logs): runs after all V1 modules have ended |
| Collective run              | V2 update that waits for a collective run report to process it               |

Rules for the interface:

- only `IMPORTING` and `TABLES` parameters, all passed by value; no `EXPORTING` parameters, because nobody is waiting for a result;
- no `COMMIT WORK` and no `ROLLBACK WORK` inside the module;
- to abort the update, send a message of type `A` (or `X`), or raise an exception.

```abap
FUNCTION z_flight_booking_insert.
*"----------------------------------------------------------------------
*"  IMPORTING
*"     VALUE(IS_BOOKING) TYPE SBOOK
*"----------------------------------------------------------------------
  INSERT sbook FROM is_booking.
  IF sy-subrc <> 0.
    " Type A message: the whole update is rolled back and logged in SM13
    MESSAGE 'Booking could not be inserted' TYPE 'A'.
  ENDIF.
ENDFUNCTION.
```

## Register and commit

```abap
DATA(ls_booking) = VALUE sbook( carrid   = 'LH'
                                connid   = '0400'
                                fldate   = '20261215'
                                bookid   = '00012345'
                                customid = '00000001'
                                class    = 'Y' ).

CALL FUNCTION 'Z_FLIGHT_BOOKING_INSERT' IN UPDATE TASK
  EXPORTING
    is_booking = ls_booking.

ls_booking-bookid = '00012346'.          " the first call keeps its own copy

CALL FUNCTION 'Z_FLIGHT_BOOKING_INSERT' IN UPDATE TASK
  EXPORTING
    is_booking = ls_booking.

COMMIT WORK AND WAIT.                    " both inserts run now, together
IF sy-subrc <> 0.
  WRITE / 'The update failed: check SM13'.
ENDIF.
```

The parameter values are copied when you **register** the call, not when the module runs. That's why changing `ls_booking` after the first call doesn't affect it.

- `COMMIT WORK` is **asynchronous**: your program goes on while the update runs.
- `COMMIT WORK AND WAIT` is **synchronous**: your program waits for the end of the update, and `sy-subrc` tells you if it worked. Use it when the next step reads the data you just wrote.
- `SET UPDATE TASK LOCAL` before the first registration runs the update in the same work process at commit time. It's common in background jobs and batch programs.

> [!WARNING]
> Never use `COMMIT WORK` inside a program that runs within someone else's LUW, such as an exit, a BAdI, or a function module called by a standard transaction. You would commit the caller's half-finished data.

## PERFORM ON COMMIT

`PERFORM ... ON COMMIT` registers a subroutine that runs at `COMMIT WORK`, in the current work process, **before** the update modules. A subroutine registered many times runs only once, with the values the global variables have at commit time. Standard code uses it to collect data during the dialog and register the update calls in one place.

```abap
DATA gt_bookings TYPE STANDARD TABLE OF sbook WITH EMPTY KEY.

START-OF-SELECTION.
  gt_bookings = VALUE #( ( carrid = 'LH' connid = '0400' fldate = '20261215'
                           bookid = '00012347' customid = '00000001' ) ).
  PERFORM save_bookings ON COMMIT.
  COMMIT WORK.

FORM save_bookings.
  LOOP AT gt_bookings INTO DATA(ls_booking).
    CALL FUNCTION 'Z_FLIGHT_BOOKING_INSERT' IN UPDATE TASK
      EXPORTING
        is_booking = ls_booking.
  ENDLOOP.
ENDFORM.
```

`PERFORM ... ON ROLLBACK` is the opposite: the subroutine runs at `ROLLBACK WORK`. `FORM` is obsolete in new code (see [includes and subroutines](./0069-includes-and-subroutines.md)), but you'll meet `ON COMMIT` in many standard programs.

## Monitor failed updates in SM13

Transaction `SM13` lists the update records. Select by user and date, and look at the status:

| Status         | Meaning                                                  |
| -------------- | -------------------------------------------------------- |
| `Init`         | waiting to be processed                                  |
| `Run`          | running now                                              |
| `Err`          | the update failed: the record keeps all parameter values |
| `V1 processed` | V1 done, V2 still pending                                |

Double-click an `Err` record to see the modules and the error message, and jump to the short dump in `ST22`. After you fix the cause, you can repeat a V1 update that allows restart (**Update Requests > Repeat Update**). By default, the user also gets an express message in SAP when their update fails.

> [!CAUTION]
> A failed update means the user saw a "saved" message but the data isn't in the database. Check `SM13` regularly in production, and never delete an `Err` record before you know whether the data must be posted again.

## Exercise

> [!IMPORTANT]
>
> 1. Create a table `ZFLIGHT_NOTE` (key: `CARRID`, `CONNID`; field `NOTE` of type `CHAR80`) and an update function module `Z_FLIGHT_NOTE_INSERT` that inserts one row.
> 2. Write a report that registers two inserts and runs `COMMIT WORK AND WAIT`. Check the table content.
> 3. Run the report again with the same keys, so the `INSERT` fails, and find the error in `SM13`.

### Solution

```abap
FUNCTION z_flight_note_insert.
*"  IMPORTING
*"     VALUE(IS_NOTE) TYPE ZFLIGHT_NOTE
  INSERT zflight_note FROM is_note.
  IF sy-subrc <> 0.
    MESSAGE 'Duplicate flight note' TYPE 'A'.
  ENDIF.
ENDFUNCTION.
```

```abap
REPORT zflight_note_update.

CALL FUNCTION 'Z_FLIGHT_NOTE_INSERT' IN UPDATE TASK
  EXPORTING is_note = VALUE zflight_note( carrid = 'LH' connid = '0400' note = 'Night flight' ).
CALL FUNCTION 'Z_FLIGHT_NOTE_INSERT' IN UPDATE TASK
  EXPORTING is_note = VALUE zflight_note( carrid = 'AZ' connid = '0555' note = 'New aircraft' ).

COMMIT WORK AND WAIT.
WRITE / COND string( WHEN sy-subrc = 0 THEN 'Saved' ELSE 'Update failed: see SM13' ).
```

On the second run, the first `INSERT` fails, the whole update is rolled back (neither row is written), and `SM13` shows a record with status `Err`.

> [!NOTE]
>
> - `CALL FUNCTION ... IN UPDATE TASK` only registers the call; the module runs at `COMMIT WORK`.
> - All registered modules run in one database LUW: they all succeed or they're all rolled back.
> - Update modules have only `IMPORTING` and `TABLES` parameters, passed by value, and never commit.
> - `COMMIT WORK AND WAIT` waits for the update and sets `sy-subrc`; `SET UPDATE TASK LOCAL` runs it in the same work process.
> - `PERFORM ... ON COMMIT` runs a subroutine once at commit time, before the update modules.
> - `SM13` shows failed updates: check it and repeat or repost the data.
