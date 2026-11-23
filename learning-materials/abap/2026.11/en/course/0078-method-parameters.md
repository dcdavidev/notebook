---
title: Method parameters
description: IMPORTING, EXPORTING, CHANGING, RETURNING, and functional calls.
level: intermediate
---

Methods exchange data with their callers through **parameters**. The kind of a parameter says in which direction the data flows, and how it's passed decides whether the method works on the original or on a copy.

This lesson covers the four kinds of parameters, optional parameters, and the different ways to call a method, including **functional calls** inside expressions.

## The four kinds of parameters

| Kind        | Direction       | Inside the method                                         | How many    |
| ----------- | --------------- | --------------------------------------------------------- | ----------- |
| `IMPORTING` | caller → method | read-only (when passed by reference)                      | any         |
| `EXPORTING` | method → caller | write the result                                          | any         |
| `CHANGING`  | both ways       | read and change the caller's value                        | any         |
| `RETURNING` | method → caller | the single result of a functional method; always by value | at most one |

```abap
CLASS lcl_flight_calc DEFINITION.
  PUBLIC SECTION.
    METHODS get_free_seats
      IMPORTING iv_seatsmax    TYPE s_seatsmax
                iv_seatsocc    TYPE s_seatsocc
      RETURNING VALUE(rv_free) TYPE i.

    METHODS split_name
      IMPORTING iv_fullname TYPE string
      EXPORTING ev_first    TYPE string
                ev_last     TYPE string.

    METHODS add_tax
      IMPORTING iv_rate  TYPE i
      CHANGING  cv_price TYPE s_price.
ENDCLASS.

CLASS lcl_flight_calc IMPLEMENTATION.
  METHOD get_free_seats.
    rv_free = iv_seatsmax - iv_seatsocc.
  ENDMETHOD.

  METHOD split_name.
    SPLIT iv_fullname AT space INTO ev_first ev_last.
  ENDMETHOD.

  METHOD add_tax.
    cv_price = cv_price * ( 1 + iv_rate / 100 ).
  ENDMETHOD.
ENDCLASS.
```

- Parameters can also have a **generic type**, such as `any`, `data`, `clike`, `csequence`, `numeric`, or `any table`: then they accept any actual parameter of that family. Use them only when a method really has to accept several types.
- Writing to an `IMPORTING` parameter passed by reference is a syntax error. That's the point: the caller's value is safe.

## By reference or by value

By default, `IMPORTING`, `EXPORTING`, and `CHANGING` parameters are passed **by reference**: the method works directly on the caller's variable. With `VALUE( )` the method gets a **copy**.

| Declaration                    | Behavior                                                              |
| ------------------------------ | --------------------------------------------------------------------- |
| `IMPORTING iv_x TYPE i`        | reference; read-only                                                  |
| `IMPORTING VALUE(iv_x) TYPE i` | copy; the method can change it without affecting the caller           |
| `EXPORTING ev_x TYPE i`        | reference; it starts with the caller's current value                  |
| `EXPORTING VALUE(ev_x) TYPE i` | copy; starts initial and is copied back when the method ends normally |
| `CHANGING VALUE(cv_x) TYPE i`  | copy; copied back when the method ends normally                       |
| `RETURNING VALUE(rv_x) TYPE i` | always a copy; starts initial                                         |

> [!WARNING]
> An `EXPORTING` parameter passed by reference isn't cleared when the method starts: it still holds whatever the caller had in the variable. If the method fills it only in some cases, the caller may get an old value. `CLEAR` exporting parameters at the start of the method, or use `RETURNING`.

## Optional parameters and defaults

`IMPORTING` and `CHANGING` parameters are mandatory unless you mark them `OPTIONAL` or give them a `DEFAULT`. `EXPORTING` parameters are always optional for the caller. Inside the method, `IS SUPPLIED` tells you whether the caller passed a parameter:

```abap
METHODS get_flights
  IMPORTING iv_carrid    TYPE s_carr_id
            iv_max_rows  TYPE i DEFAULT 100
            iv_from_date TYPE s_date OPTIONAL
  EXPORTING et_flights   TYPE ty_flights      " a table type declared in the class
            ev_count     TYPE i.

" in the implementation
IF ev_count IS SUPPLIED.
  ev_count = lines( et_flights ).
ENDIF.
```

## Calling methods

```abap
DATA(lo_calc) = NEW lcl_flight_calc( ).
DATA lv_price TYPE s_price VALUE '100.00'.

" Several IMPORTING parameters: name = value
DATA(lv_free) = lo_calc->get_free_seats( iv_seatsmax = 200 iv_seatsocc = 150 ).

" EXPORTING and CHANGING: name the parameter kinds, seen from the caller
lo_calc->split_name(
  EXPORTING iv_fullname = `Mario Rossi`
  IMPORTING ev_first    = DATA(lv_first)       " inline declaration in the call
            ev_last     = DATA(lv_last) ).

lo_calc->add_tax( EXPORTING iv_rate = 22 CHANGING cv_price = lv_price ).
```

- With a single `IMPORTING` parameter (or a single mandatory one, or one marked `PREFERRED PARAMETER`) you can omit its name: `lo->method( value )`.
- When a method has only importing parameters, you can omit `EXPORTING`. As soon as there are other kinds, write `EXPORTING`, `IMPORTING`, and `CHANGING` explicitly. As with function modules, the directions are seen from the caller's side.
- The obsolete form `CALL METHOD lo_calc->split_name EXPORTING ...` still works; don't use it in new code.

## Functional calls

A method with a `RETURNING` parameter is a **functional method**: you can call it wherever a value is expected, in assignments, conditions, and other expressions.

```abap
IF lo_calc->get_free_seats( iv_seatsmax = 200 iv_seatsocc = 200 ) = 0.
  WRITE / 'Flight full'.
ENDIF.

WRITE / |Free seats: { lo_calc->get_free_seats( iv_seatsmax = 200 iv_seatsocc = 120 ) }|.
```

A functional method that returns `abap_bool` can also be used as a **predicative method call**, without a comparison: `IF lo_flight->is_full( ).` is true when the result isn't initial.

> [!TIP]
> `RETURNING` is a question with one answer: "how many seats are free?". `EXPORTING` is a form the method fills in with several boxes. `CHANGING` is a document you hand over for corrections and get back with changes.

## Exercise

> [!IMPORTANT]
>
> 1. Write a class with a functional method `get_occupancy` that receives the maximum and occupied seats and returns the occupancy in percent (type `p LENGTH 5 DECIMALS 2`). Return `0` if the maximum is `0`.
> 2. Add a method `is_full` that returns `abap_bool`.
> 3. Read the flights of `LH` from `SFLIGHT` and, in a loop, write the occupancy of each flight and "FULL" for the full ones, using both methods inside expressions.

### Solution

```abap
REPORT zflight_occupancy.

CLASS lcl_occupancy DEFINITION.
  PUBLIC SECTION.
    TYPES ty_percent TYPE p LENGTH 5 DECIMALS 2.
    METHODS get_occupancy
      IMPORTING iv_seatsmax       TYPE s_seatsmax
                iv_seatsocc       TYPE s_seatsocc
      RETURNING VALUE(rv_percent) TYPE ty_percent.
    METHODS is_full
      IMPORTING iv_seatsmax    TYPE s_seatsmax
                iv_seatsocc    TYPE s_seatsocc
      RETURNING VALUE(rv_full) TYPE abap_bool.
ENDCLASS.

CLASS lcl_occupancy IMPLEMENTATION.
  METHOD get_occupancy.
    IF iv_seatsmax = 0.
      RETURN.                                   " rv_percent stays 0
    ENDIF.
    rv_percent = iv_seatsocc * 100 / iv_seatsmax.
  ENDMETHOD.

  METHOD is_full.
    rv_full = xsdbool( iv_seatsocc >= iv_seatsmax ).
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_occupancy) = NEW lcl_occupancy( ).

  SELECT connid, fldate, seatsmax, seatsocc FROM sflight
    WHERE carrid = 'LH'
    INTO TABLE @DATA(lt_flights).

  LOOP AT lt_flights INTO DATA(ls_flight).
    DATA(lv_percent) = lo_occupancy->get_occupancy( iv_seatsmax = ls_flight-seatsmax
                                                    iv_seatsocc = ls_flight-seatsocc ).
    WRITE: / ls_flight-connid, ls_flight-fldate, lv_percent.
    IF lo_occupancy->is_full( iv_seatsmax = ls_flight-seatsmax
                              iv_seatsocc = ls_flight-seatsocc ).
      WRITE 'FULL'.
    ENDIF.
  ENDLOOP.
```

> [!NOTE]
>
> - `IMPORTING` brings data in, `EXPORTING` sends results out, `CHANGING` does both, and `RETURNING` returns one value by value.
> - Parameters are passed by reference unless you write `VALUE( )`; importing references are read-only, and exporting references aren't cleared on entry.
> - `OPTIONAL` and `DEFAULT` make parameters optional; `IS SUPPLIED` checks whether one was passed.
> - At the call, name the kinds from the caller's side: `EXPORTING`, `IMPORTING`, `CHANGING`; inline declarations work for output parameters.
> - Functional methods can be used in any expression; methods returning `abap_bool` work as predicates in `IF`.
