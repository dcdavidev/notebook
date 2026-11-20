---
title: Lock objects
description: The SAP lock concept, ENQUEUE and DEQUEUE.
---

_Basic level_

When two users change the same record at the same time, the second save can silently overwrite the first. The database locks rows only for the very short time of one database transaction, and an SAP business transaction spans many of them, across several screens. So SAP has its own lock mechanism: the **SAP lock concept**.

You define a **lock object** in the Dictionary, and the system generates two function modules: one to set a lock (**enqueue**) and one to release it (**dequeue**). Every program that changes the data asks for the lock first.

## How SAP locks work

The locks live in a **lock table** in the main memory of the **enqueue server**, a central part of the system. A program asks the enqueue server for a lock on a key, such as airline `LH`. If nobody else holds a conflicting lock, the server records it; otherwise it refuses.

The key point: SAP locks are **logical**. They don't stop anyone from writing to the table. They work only because all programs that change the data follow the rule "lock first, then change". A program that skips the enqueue ignores every lock.

> [!TIP]
> SAP locks are like the "occupied" sign on a meeting room door. The sign doesn't lock the door: it works because everyone agrees to check it before going in. Someone who ignores the sign can still walk in.

## Creating a lock object

In `SE11`, create a lock object. Its name must start with `E`, so a custom one starts with `EZ` or `EY`. For the table `ZSCARR` (a copy of `SCARR`), call it `EZSCARR`:

```text
SE11 > Lock object EZSCARR > Create
  Tables tab:
    Primary table:  ZSCARR
    Lock mode:      Write lock
  Lock parameter tab (proposed from the key):
    MANDT
    CARRID
```

You can add secondary tables linked by foreign keys, for example a header table and its items. When you activate it, the system generates:

- `ENQUEUE_EZSCARR`: sets the lock;
- `DEQUEUE_EZSCARR`: releases it.

The lock parameters become importing parameters of these function modules.

### Lock modes

| Mode | Name                      | Meaning                                                                        |
| ---- | ------------------------- | ------------------------------------------------------------------------------ |
| `E`  | exclusive, cumulative     | write lock; the same program can request it again; others get no lock          |
| `S`  | shared                    | read lock; many users can hold it; nobody can get an `E` or `X` lock meanwhile |
| `X`  | exclusive, non-cumulative | like `E`, but even the same program can't request it a second time             |

Use `E` to change data, and `S` when you read data that must not change while you work on it.

## Setting and releasing a lock

You call the generated function modules with `CALL FUNCTION`. You'll see function modules in detail in [Function modules](./0070-function-modules.en.md); here you only need the call.

```abap
REPORT zlock_demo.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  CALL FUNCTION 'ENQUEUE_EZSCARR'
    EXPORTING
      mode_zscarr    = 'E'           " write lock
      carrid         = p_carr
    EXCEPTIONS
      foreign_lock   = 1             " someone else holds the lock
      system_failure = 2
      OTHERS         = 3.

  IF sy-subrc <> 0.
    WRITE: / 'Airline', p_carr, 'is locked by user', sy-msgv1.
    RETURN.
  ENDIF.

  WRITE: / 'Lock set. Change the data here.'.

  CALL FUNCTION 'DEQUEUE_EZSCARR'
    EXPORTING
      mode_zscarr = 'E'
      carrid      = p_carr.

  WRITE: / 'Lock released.'.
```

- `MANDT` is filled with the current client automatically.
- If you leave a key parameter empty, the lock covers **all** values of that field: an empty `CARRID` locks every airline.
- After `FOREIGN_LOCK`, `sy-msgv1` holds the user who has the lock.
- The `_WAIT` parameter makes the enqueue retry for a few seconds before it gives up.
- The `_SCOPE` parameter controls when the lock ends. With the default value `2`, it's released at `COMMIT WORK` or `ROLLBACK WORK` (see [The LUW](./0060-luw-commit-and-rollback.en.md)) or when the program ends.

> [!WARNING]
> Always check `sy-subrc` after the enqueue, and change the data only if it's `0`. A program that ignores a failed enqueue overwrites someone else's work, and the lock was useless.

## Monitoring locks with SM12

Transaction `SM12` lists the current locks: user, table, lock argument, and mode. Run your report, stop it in the debugger after the enqueue, and you'll see your lock in `SM12`. Try to run the report in a second session at the same time: it gets `FOREIGN_LOCK`.

> [!CAUTION]
> `SM12` lets an administrator delete a lock. Do it only if the owner's session is really gone: if the program is still running, deleting its lock lets another user change the same data at the same time.

## Exercise

> [!IMPORTANT]
>
> 1. Create the lock object `EZSCARR` on your table `ZSCARR`.
> 2. Run `ZLOCK_DEMO` with a breakpoint after the enqueue, and look at the lock in `SM12`.
> 3. While the first session is stopped, run the report in a second session with the same airline, and read the message.

### Solution

The lock object and the report are the ones in this lesson. The second session can't get the lock, so `ENQUEUE_EZSCARR` returns `sy-subrc = 1` and the report writes "Airline LH is locked by user" followed by your user name, because you hold the lock in the first session.

> [!NOTE]
>
> - SAP locks protect data across a whole business transaction, not just one database transaction.
> - A lock object (name starting with `EZ`) generates `ENQUEUE_...` and `DEQUEUE_...` function modules.
> - Locks are logical: they work only if every program asks for them before changing data.
> - Use mode `E` to write and `S` to read; check `sy-subrc` after every enqueue.
> - `SM12` shows the current locks.
