---
title: Includes and subroutines
description: Split a program into files, and read FORM and PERFORM in legacy code.
---

_Basic level_

A report that grows to thousands of lines is hard to navigate. Classic ABAP has two tools to split it: **includes** split the source code into several files, and **subroutines** split the logic into named blocks that you call with `PERFORM`.

Includes are still used, especially in function groups and screen programs. Subroutines are **obsolete**: SAP recommends methods instead. But you'll find `FORM` and `PERFORM` in almost every old program, so you need to read them.

## Includes

An **include program** (program type `I`) is a piece of source code that can't run on its own. The statement `INCLUDE` copies its content into the main program at that point, as if you had typed it there.

```abap
REPORT zflight_report.

INCLUDE zflight_report_top.   " global data and selection screen
INCLUDE zflight_report_f01.   " subroutines

START-OF-SELECTION.
  PERFORM read_flights.
  PERFORM show_flights.
```

To create an include, double-click its name in the `INCLUDE` statement and confirm: the editor creates it and links it to the main program. Common naming conventions:

| Suffix | Content                                                 |
| ------ | ------------------------------------------------------- |
| `TOP`  | global declarations (`DATA`, `TYPES`, selection screen) |
| `SEL`  | selection screen                                        |
| `F01`  | subroutines                                             |
| `O01`  | PBO modules of screens                                  |
| `I01`  | PAI modules of screens                                  |
| `C01`  | local classes                                           |

- An include isn't a separate module: it has no own data and no interface. Everything in it belongs to the program that includes it.
- The syntax check of an include runs in the context of its main program. If the include is used by several programs, it must be correct in all of them.

> [!TIP]
> Includes are the chapters of a book bound into one volume. Splitting the text into chapters makes it easier to find a page, but it's still one book: a sentence in chapter 3 can refer to a character from chapter 1.

## Subroutines: FORM and PERFORM

A **subroutine** is a block of code between `FORM` and `ENDFORM`, called with `PERFORM`. It can have parameters and its own local data.

```abap
DATA gt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.

START-OF-SELECTION.
  DATA lv_carrid TYPE s_carr_id VALUE 'LH'.
  DATA lv_free   TYPE i.
  PERFORM read_flights USING lv_carrid.
  PERFORM count_free_seats CHANGING lv_free.
  WRITE: / 'Free seats:', lv_free.

FORM read_flights USING iv_carrid TYPE s_carr_id.
  SELECT * FROM sflight
    WHERE carrid = @iv_carrid
    INTO TABLE @gt_flights.
ENDFORM.

FORM count_free_seats CHANGING cv_free TYPE i.
  DATA ls_flight TYPE sflight.        " local to the subroutine
  CLEAR cv_free.
  LOOP AT gt_flights INTO ls_flight.
    cv_free = cv_free + ls_flight-seatsmax - ls_flight-seatsocc.
  ENDLOOP.
ENDFORM.
```

- `FORM` blocks go at the end of the program (or in an `F01` include), after all the event blocks.
- `DATA` inside a `FORM` is local; the subroutine can also read and change all the global data of the program, as `count_free_seats` does with `gt_flights`.
- The parameters are positional: the first actual parameter after `USING` goes to the first formal parameter, and so on.

## How parameters are passed

| Definition          | Passing             | Meaning                                                      |
| ------------------- | ------------------- | ------------------------------------------------------------ |
| `USING p`           | by reference        | input; technically it can still be changed (don't do it)     |
| `USING VALUE(p)`    | by value            | input; the subroutine works on a copy                        |
| `CHANGING p`        | by reference        | input and output; changes are visible at once                |
| `CHANGING VALUE(p)` | by value and result | input and output; the value is copied back only at `ENDFORM` |
| `TABLES t`          | by reference        | an internal table with a header line (obsolete)              |

> [!WARNING]
> Untyped parameters, such as `FORM calc USING p1 p2`, are allowed and very common in old code. They accept any data type and hide errors until runtime. When you have to change such a subroutine, add `TYPE` to its parameters.

You may also meet `PERFORM read_flights IN PROGRAM zother_program` or `PERFORM read_flights(zother_program)`, which call a subroutine of another program. This couples the two programs tightly and is a frequent source of errors. `PERFORM ... ON COMMIT` delays the call until the next `COMMIT WORK`: see [update function modules](./0113-update-task.md).

## What to use instead

In new code, put reusable logic in [function modules](./0070-function-modules.md) when you need them (RFC, update task) and otherwise in [classes and methods](./0076-classes-and-objects.md). Methods have typed parameters, can be tested with ABAP Unit, and don't share hidden global data. Inside classes, `FORM`, `PERFORM`, and `TABLES` parameters are a syntax error.

## Exercise

> [!IMPORTANT]
>
> 1. Create a report `ZFLIGHT_INCL` with a `TOP` include for the global data and an `F01` include for the subroutines.
> 2. Write a subroutine `read_connections` with a typed `USING` parameter for the airline that fills a global table from `SPFLI`.
> 3. Write a subroutine `show_connections` that writes the table, and call both from `START-OF-SELECTION`.

### Solution

```abap
REPORT zflight_incl.

INCLUDE zflight_incl_top.
INCLUDE zflight_incl_f01.

START-OF-SELECTION.
  PERFORM read_connections USING p_carrid.
  PERFORM show_connections.
```

Include `ZFLIGHT_INCL_TOP`:

```abap
DATA gt_connections TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.
```

Include `ZFLIGHT_INCL_F01`:

```abap
FORM read_connections USING iv_carrid TYPE s_carr_id.
  SELECT * FROM spfli
    WHERE carrid = @iv_carrid
    INTO TABLE @gt_connections.
ENDFORM.

FORM show_connections.
  DATA ls_connection TYPE spfli.
  LOOP AT gt_connections INTO ls_connection.
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
ENDFORM.
```

> [!NOTE]
>
> - An include (type `I`) is source code copied into the main program by `INCLUDE`; it can't run alone and has no data of its own.
> - Common include suffixes: `TOP` for declarations, `F01` for subroutines, `O01`/`I01` for screen modules.
> - `FORM ... ENDFORM` defines a subroutine and `PERFORM` calls it; parameters are `USING`, `CHANGING`, and the obsolete `TABLES`.
> - `VALUE(...)` passes by value; without it, parameters are passed by reference.
> - Subroutines are obsolete: read them in old code, but write methods in new code.
