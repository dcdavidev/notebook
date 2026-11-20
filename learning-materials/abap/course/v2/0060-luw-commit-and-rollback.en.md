---
title: 'The LUW: COMMIT and ROLLBACK'
description: Database LUW, SAP LUW, and keeping data consistent.
---

_Basic level_

A business operation often changes several tables: a booking adds a row to `SBOOK` and increases the occupied seats in `SFLIGHT`. Either both changes happen, or neither does. A half-done booking, with a row in `SBOOK` but the old seat count, is worse than no booking at all.

A **LUW** (logical unit of work) is a group of changes that the system treats as one: they're all saved together with a **commit**, or all undone together with a **rollback**. SAP has two kinds of LUW, and you need to know both.

## The database LUW

A **database LUW** is a transaction on the database. Every change you make with `INSERT`, `UPDATE`, `MODIFY`, or `DELETE` (see [Writing data](./0059-writing-to-the-database.en.md)) stays provisional until a database commit. Until then, other users don't see it, and a rollback can undo it.

```abap
REPORT zluw_demo.

DATA ls_carrier TYPE zscarr.

ls_carrier = VALUE #( carrid = 'Z1' carrname = 'Alpha Air' currcode = 'EUR' ).
INSERT zscarr FROM @ls_carrier.
DATA(lv_ok) = xsdbool( sy-subrc = 0 ).

ls_carrier = VALUE #( carrid = 'Z2' carrname = 'Beta Air' currcode = 'EUR' ).
INSERT zscarr FROM @ls_carrier.
IF sy-subrc <> 0.
  lv_ok = abap_false.
ENDIF.

IF lv_ok = abap_true.
  COMMIT WORK.                         " both rows become permanent
  WRITE: / 'Both airlines saved'.
ELSE.
  ROLLBACK WORK.                       " neither row is saved
  WRITE: / 'Nothing saved'.
ENDIF.
```

- `COMMIT WORK` makes all changes since the last commit permanent.
- `ROLLBACK WORK` undoes all changes since the last commit.

> [!TIP]
> A LUW is like a shopping cart in an online store. You add and remove items as you like, but nothing is bought until you press "Pay". If you close the browser instead, the cart is emptied and your bank account doesn't change.

## Implicit database commits

The work process that runs your program is shared with other users. Whenever your program gives it back, the system ends the database LUW with an **implicit commit**. This happens, for example:

- when a screen is displayed (a selection screen, a dialog screen, a list);
- when an `I`, `W`, or `E` message is shown in a dialog (see [Messages](./0061-messages.en.md));
- at a synchronous or asynchronous RFC call (see [Remote function calls](./0124-rfc.en.md));
- at a `WAIT` statement.

The system also rolls back automatically on a runtime error and on an `A` or `X` message.

> [!WARNING]
> Implicit commits split your changes into several database LUWs without you writing `COMMIT WORK`. If you change table A, show a popup to the user, and then change table B, the change to A is already permanent when B fails. Do all the changes of one business operation together, after the user interaction.

## The SAP LUW

A business transaction such as "create a sales order" spans several screens, so it spans several database LUWs. The **SAP LUW** is the bracket around them: it collects the changes during the dialog and writes them all in **one** database LUW at the end, when the program calls `COMMIT WORK`.

The changes are collected with special techniques that run only at `COMMIT WORK`:

- **Update function modules**, called with `CALL FUNCTION ... IN UPDATE TASK`;
- **subroutines and methods registered for the commit**, with `PERFORM ... ON COMMIT`.

You'll learn them in [Update function modules](./0113-update-task.en.md). At this level, remember what `COMMIT WORK` does in an SAP system, beyond the database commit:

1. it runs all the registered update modules and subroutines;
2. it releases the SAP locks set with the default scope (see [Lock objects](./0051-lock-objects.en.md));
3. it ends the current SAP LUW and starts a new one.

`ROLLBACK WORK` discards the registered updates, rolls back the database, and releases the locks too.

`COMMIT WORK AND WAIT` waits until the update modules have finished and sets `sy-subrc`. Use it when the next step needs to read the data just saved.

## COMMIT after BAPIs

BAPIs never commit by themselves. After a BAPI that changes data, you call `BAPI_TRANSACTION_COMMIT` if the call succeeded, or `BAPI_TRANSACTION_ROLLBACK` if it returned errors:

```abap
CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
  EXPORTING
    wait = abap_true.                  " like COMMIT WORK AND WAIT
```

[BAPIs](./0071-bapis.en.md) shows the whole pattern with the return table.

> [!CAUTION]
> Don't put `COMMIT WORK` inside a method or function module that others reuse. The caller loses control over its LUW: its half-done changes are committed in the middle of its own work. Leave the commit to the program that owns the whole business operation.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that inserts two airlines into `ZSCARR`, where the second one has the same key as the first.
> 2. Roll back when any insert fails, and check in `SE16` that the table didn't change.
> 3. Change the keys so both inserts succeed, commit, and check again.

### Solution

The report in "The database LUW" does exactly this. With `carrid = 'Z1'` in both work areas, the second `INSERT` returns `sy-subrc = 4`, the program runs `ROLLBACK WORK`, and the first row disappears too. With `Z1` and `Z2`, both rows are committed and visible in `SE16`.

> [!NOTE]
>
> - A LUW is a group of changes saved or undone together.
> - `COMMIT WORK` makes the changes permanent; `ROLLBACK WORK` undoes them.
> - Screens, dialog messages, RFC calls, and `WAIT` cause implicit database commits.
> - The SAP LUW bundles changes from several screens and writes them at `COMMIT WORK`, which also releases the locks.
> - Commit in the program that owns the operation, not in reusable code; after BAPIs use `BAPI_TRANSACTION_COMMIT`.
