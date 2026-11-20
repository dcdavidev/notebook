---
title: Class-based exceptions
description: TRY, CATCH, CLEANUP, RAISE EXCEPTION, and the exception hierarchy.
---

_Intermediate level_

When something goes wrong at runtime, such as a division by zero, a table row that isn't there, or text that isn't a number, ABAP raises an **exception**. If nobody handles it, the program stops with a short dump, as you saw in [runtime errors](./0030-runtime-errors.en.md). A **class-based exception** is an object of an exception class: it carries information about the error, travels up the call stack until someone catches it, and lets your code react instead of crashing.

## TRY and CATCH

You put the code that can fail in a `TRY` block and handle each exception in a `CATCH` block:

```abap
REPORT zexceptions.

DATA lv_seatsmax TYPE i VALUE 0.
DATA lv_seatsocc TYPE i VALUE 150.

TRY.
    DATA(lv_load) = lv_seatsocc * 100 / lv_seatsmax.
    WRITE: / 'Load factor:', lv_load.
  CATCH cx_sy_zerodivide INTO DATA(lx_zero).
    WRITE: / 'Error:', lx_zero->get_text( ).
ENDTRY.
WRITE / 'The program goes on'.
```

When the division fails, the rest of the `TRY` block is skipped, the matching `CATCH` runs, and the program continues after `ENDTRY`. If no exception happens, the `CATCH` blocks are skipped.

`INTO` stores a reference to the exception object. Its most useful methods:

| Method                   | Returns                                            |
| ------------------------ | -------------------------------------------------- |
| `get_text( )`            | the short text of the error                        |
| `get_longtext( )`        | the long text, if the class has one                |
| `get_source_position( )` | the program, include, and line where it was raised |

The attribute `previous` holds the exception that caused this one, if any.

> [!TIP]
> Exceptions are like the safety net under a trapeze. The acrobat (your code) tries a jump. If it fails, they don't hit the ground (the dump): they fall into the net, climb down, and the show goes on. Each net is placed under specific jumps, and the closest one catches the fall.

## Several CATCH blocks

A `TRY` can have several `CATCH` blocks, and one `CATCH` can list several classes. The runtime picks the **first** block that matches the exception's class or one of its superclasses, so put the specific classes first:

```abap
DATA lt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
DATA lx_error   TYPE REF TO cx_root.

TRY.
    DATA(ls_flight) = lt_flights[ carrid = 'LH' ].        " empty table: no row
    DATA(lv_ratio) = ls_flight-seatsocc / ls_flight-seatsmax.
  CATCH cx_sy_itab_line_not_found INTO lx_error.
    WRITE: / 'Row not found'.
  CATCH cx_sy_zerodivide cx_sy_arithmetic_overflow INTO lx_error.
    WRITE: / 'Calculation error:', lx_error->get_text( ).
  CATCH cx_root INTO lx_error.                             " anything else
    WRITE: / 'Unexpected:', lx_error->get_text( ).
ENDTRY.
```

Exception classes form an inheritance tree. `cx_sy_zerodivide` is a subclass of `cx_sy_arithmetic_error`, so `CATCH cx_sy_arithmetic_error` also catches a division by zero.

> [!WARNING]
> Dividing zero by zero gives `0` in ABAP and raises nothing. Only a non-zero number divided by zero raises `cx_sy_zerodivide`. Don't rely on the exception to detect empty data: check the divisor first when zero is a normal value.

## The exception hierarchy

All exception classes inherit from `CX_ROOT`, through one of three abstract classes. They differ in how strictly the syntax check makes you declare them:

| Superclass         | Must be declared in `RAISING`?     | Typical use                                                          |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------- |
| `CX_STATIC_CHECK`  | yes, the syntax check warns if not | errors the caller must expect and handle                             |
| `CX_DYNAMIC_CHECK` | no; checked only at runtime        | errors the caller can avoid with a check, such as `cx_sy_zerodivide` |
| `CX_NO_CHECK`      | no, never                          | errors nobody can reasonably handle, such as resource shortages      |

The predefined runtime exceptions start with `CX_SY_`. For your own errors you'll write your own classes, usually inheriting from `CX_STATIC_CHECK`, in [custom exception classes](./0090-custom-exception-classes.en.md).

## RAISING and RAISE EXCEPTION

A method that lets an exception leave it declares it with `RAISING`. The exception then **propagates** to the caller, and up the call stack, until a `CATCH` handles it:

```abap
CLASS lcl_flight_reader DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS get_load
      IMPORTING is_flight      TYPE sflight
      RETURNING VALUE(rv_load) TYPE i
      RAISING   cx_sy_zerodivide.
ENDCLASS.

CLASS lcl_flight_reader IMPLEMENTATION.
  METHOD get_load.
    IF is_flight-seatsmax = 0.
      RAISE EXCEPTION TYPE cx_sy_zerodivide.      " raise it yourself
    ENDIF.
    rv_load = is_flight-seatsocc * 100 / is_flight-seatsmax.
  ENDMETHOD.
ENDCLASS.
```

`RAISE EXCEPTION` has three forms:

```abap
RAISE EXCEPTION TYPE cx_sy_zerodivide.            " create and raise an object of the class
RAISE EXCEPTION NEW cx_sy_zerodivide( ).          " same, with NEW (ABAP 7.52 and later)
RAISE EXCEPTION lx_error.                         " raise an object you already have
```

The third form is useful after a `CATCH` to pass the exception on. To wrap it in another exception instead, pass it as `previous` so the original cause isn't lost.

## CLEANUP

A `CLEANUP` block runs when an exception leaves the `TRY` block **without** being caught there, just before the exception continues upward. Use it to restore a consistent state:

```abap
METHOD process_bookings.
  TRY.
      mv_in_progress = abap_true.
      update_seats( ).                            " may raise an exception
      mv_in_progress = abap_false.
    CLEANUP.
      mv_in_progress = abap_false.                " reset the flag, then let it propagate
  ENDTRY.
ENDMETHOD.
```

`CLEANUP` doesn't handle the exception: someone higher up must still catch it. It doesn't run if a local `CATCH` handles the exception.

## Exercise

> [!IMPORTANT]
>
> 1. Read up to 20 rows from `SFLIGHT` into an internal table and add one row with `seatsmax = 0`.
> 2. Loop over the table and call `lcl_flight_reader=>get_load( )` for each row inside a `TRY`. Print the load, or `No seats` when `cx_sy_zerodivide` is raised.
> 3. After the loop, read the row for carrier `XX` with a table expression and catch `cx_sy_itab_line_not_found`.

### Solution

```abap
START-OF-SELECTION.
  SELECT * FROM sflight INTO TABLE @DATA(lt_flights) UP TO 20 ROWS.
  APPEND VALUE #( carrid = 'ZZ' connid = '0001' seatsmax = 0 ) TO lt_flights.

  LOOP AT lt_flights INTO DATA(ls_flight).
    TRY.
        WRITE: / ls_flight-carrid, ls_flight-connid,
                 lcl_flight_reader=>get_load( ls_flight ).
      CATCH cx_sy_zerodivide.
        WRITE: / ls_flight-carrid, ls_flight-connid, 'No seats'.
    ENDTRY.
  ENDLOOP.

  TRY.
      DATA(ls_missing) = lt_flights[ carrid = 'XX' ].
    CATCH cx_sy_itab_line_not_found.
      WRITE / 'No flight for XX'.
  ENDTRY.
```

> [!NOTE]
>
> - `TRY ... CATCH ... ENDTRY` handles exceptions; the first `CATCH` that matches the class or a superclass runs.
> - `CATCH ... INTO` gives you the exception object, with `get_text( )` and `previous`.
> - All exceptions inherit from `CX_ROOT` through `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK`, or `CX_NO_CHECK`.
> - `RAISING` declares the exceptions a method lets propagate; `RAISE EXCEPTION` raises one.
> - `CLEANUP` runs when an uncaught exception leaves the `TRY` block, to restore a consistent state.
