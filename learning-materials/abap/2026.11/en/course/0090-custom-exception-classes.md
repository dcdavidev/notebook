---
title: Custom exception classes
description: Your own exceptions with message texts, attributes, and RETRY and RESUME.
---

_Intermediate level_

The predefined `CX_SY_` exceptions describe technical problems: a division by zero, a missing table row. Your application has its own errors: a flight that doesn't exist, a booking for more seats than are free. A **custom exception class** gives each of these errors a name, a translatable message text, and attributes with the details, so the caller can react precisely. This lesson builds on [class-based exceptions](./0089-class-based-exceptions.md).

## Creating the class

An exception class is a [global class](./0087-global-classes.md) whose name starts with `ZCX_` and that inherits from one of the three exception superclasses. In ADT:

```text
Right-click your package > New > ABAP Class
  Name:        ZCX_FLIGHT_ERROR
  Description: Flight errors
  Superclass:  CX_STATIC_CHECK
  Interfaces:  IF_T100_DYN_MSG
```

Pick the superclass with the table from the previous lesson. For business errors the caller must handle, it's almost always `CX_STATIC_CHECK`. Use `CX_DYNAMIC_CHECK` when the caller can easily prevent the error with a check, and `CX_NO_CHECK` only for errors nobody can handle locally.

> [!TIP]
> A custom exception class is like a printed incident form instead of a scribbled note. The note says "something broke". The form has a title for the kind of incident, boxes for the details (which flight, which date), and a standard sentence that the office can translate into any language.

## Message texts from a message class

The interface `IF_T100_DYN_MSG` (which includes `IF_T100_MESSAGE`) takes the exception's text from a [message class](./0061-messages.md). Create the message class `ZFLIGHT` in `SE91` with message `001`: `Flight &1 &2 not found`. Then complete the class:

```abap
CLASS zcx_flight_error DEFINITION
  PUBLIC
  INHERITING FROM cx_static_check
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_t100_dyn_msg.

    CONSTANTS:
      BEGIN OF flight_not_found,
        msgid TYPE symsgid VALUE 'ZFLIGHT',
        msgno TYPE symsgno VALUE '001',
        attr1 TYPE scx_attrname VALUE 'CARRID',
        attr2 TYPE scx_attrname VALUE 'CONNID',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF flight_not_found.

    DATA carrid TYPE s_carr_id READ-ONLY.
    DATA connid TYPE s_conn_id READ-ONLY.

    METHODS constructor
      IMPORTING textid   LIKE if_t100_message=>t100key OPTIONAL
                previous LIKE previous OPTIONAL
                carrid   TYPE s_carr_id OPTIONAL
                connid   TYPE s_conn_id OPTIONAL.
ENDCLASS.

CLASS zcx_flight_error IMPLEMENTATION.
  METHOD constructor ##ADT_SUPPRESS_GENERATION.
    super->constructor( previous = previous ).
    me->carrid = carrid.
    me->connid = connid.
    CLEAR me->textid.
    IF textid IS INITIAL.
      if_t100_message~t100key = if_t100_message=>default_textid.
    ELSE.
      if_t100_message~t100key = textid.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

- Each **text ID** is a constant structure: message class, number, and the names of up to four attributes whose values replace `&1` to `&4`. Add one constant per message.
- The attributes carry the details. Make them `READ-ONLY`: the caller reads them, only the constructor sets them.
- ADT can generate the constructor for you (quick fix with `Ctrl+1` on the class name). `##ADT_SUPPRESS_GENERATION` tells ADT not to overwrite your changes.

## Raising and catching your exception

```abap
CLASS lcl_flight_repo DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS get_flight
      IMPORTING iv_carrid        TYPE s_carr_id
                iv_connid        TYPE s_conn_id
      RETURNING VALUE(rs_flight) TYPE spfli
      RAISING   zcx_flight_error.
ENDCLASS.

CLASS lcl_flight_repo IMPLEMENTATION.
  METHOD get_flight.
    SELECT SINGLE * FROM spfli
      WHERE carrid = @iv_carrid AND connid = @iv_connid
      INTO @rs_flight.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_flight_error
        EXPORTING textid = zcx_flight_error=>flight_not_found
                  carrid = iv_carrid
                  connid = iv_connid.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  TRY.
      DATA(ls_flight) = lcl_flight_repo=>get_flight( iv_carrid = 'XX' iv_connid = '0001' ).
    CATCH zcx_flight_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).          " Flight XX 0001 not found
      MESSAGE lx_error TYPE 'S' DISPLAY LIKE 'E'.
  ENDTRY.
```

`MESSAGE` accepts an exception object that implements `IF_T100_MESSAGE` and shows its text like any other message.

Because the class implements `IF_T100_DYN_MSG`, since ABAP 7.50 you can also raise it with any message and its `WITH` values, without a text ID constant:

```abap
RAISE EXCEPTION TYPE zcx_flight_error
  MESSAGE e001(zflight) WITH iv_carrid iv_connid.
```

## RETRY

`RETRY` in a `CATCH` block starts the whole `TRY` block again. Use it when the handler can fix the cause, for example by switching to a fallback value:

```abap
DATA lv_connid TYPE s_conn_id VALUE '9999'.

TRY.
    DATA(ls_connection) = lcl_flight_repo=>get_flight( iv_carrid = 'LH' iv_connid = lv_connid ).
    WRITE: / ls_connection-cityfrom, ls_connection-cityto.
  CATCH zcx_flight_error.
    IF lv_connid <> '0400'.
      lv_connid = '0400'.                       " fall back to a known connection
      RETRY.
    ENDIF.
ENDTRY.
```

> [!WARNING]
> `RETRY` loops forever if the cause isn't really fixed. Always change something before retrying and make sure the condition can't come back, or count the attempts.

## RESUME

A **resumable exception** lets the raiser continue after the handler has looked at the problem: useful for warnings that shouldn't stop a whole run. Three pieces work together:

1. The raiser uses `RAISE RESUMABLE EXCEPTION`.
2. Every method it passes through declares it with `RAISING RESUMABLE( ... )`.
3. The handler uses `CATCH BEFORE UNWIND`, so the context of the raiser is still there, and calls `RESUME`.

```abap
CLASS lcl_checker DEFINITION.
  PUBLIC SECTION.
    TYPES tt_spfli TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.
    CLASS-METHODS check_flights
      IMPORTING it_flights TYPE tt_spfli
      RAISING   RESUMABLE(zcx_flight_error).
ENDCLASS.

CLASS lcl_checker IMPLEMENTATION.
  METHOD check_flights.
    LOOP AT it_flights INTO DATA(ls_flight) WHERE distance = 0.
      RAISE RESUMABLE EXCEPTION TYPE zcx_flight_error
        EXPORTING textid = zcx_flight_error=>flight_not_found
                  carrid = ls_flight-carrid
                  connid = ls_flight-connid.
      WRITE: / 'Checked after warning:', ls_flight-connid.   " runs after RESUME
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_flights TYPE lcl_checker=>tt_spfli.
  SELECT * FROM spfli INTO TABLE @lt_flights.
  TRY.
      lcl_checker=>check_flights( lt_flights ).
    CATCH BEFORE UNWIND zcx_flight_error INTO DATA(lx_warning).
      WRITE / lx_warning->get_text( ).
      IF lx_warning->is_resumable = abap_true.
        RESUME.                                  " continue right after the RAISE
      ENDIF.
  ENDTRY.
```

If the handler doesn't call `RESUME`, the exception is handled normally: the stack unwinds and the program continues after `ENDTRY`.

## Exercise

> [!IMPORTANT]
>
> 1. Add the message `002` `Only &1 seats free on flight &2` to `ZFLIGHT`, and a text ID `not_enough_seats` with an attribute `free_seats` (type `i`) to `ZCX_FLIGHT_ERROR`.
> 2. Write a method `book` that reads a row of `SFLIGHT` and raises `not_enough_seats` when `seatsmax - seatsocc` is less than the requested seats.
> 3. Call it, catch the exception, and print `get_text( )` and the attribute `free_seats`.

### Solution

```abap
" In ZCX_FLIGHT_ERROR
    CONSTANTS:
      BEGIN OF not_enough_seats,
        msgid TYPE symsgid VALUE 'ZFLIGHT',
        msgno TYPE symsgno VALUE '002',
        attr1 TYPE scx_attrname VALUE 'FREE_SEATS',
        attr2 TYPE scx_attrname VALUE 'CONNID',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF not_enough_seats.
    DATA free_seats TYPE i READ-ONLY.
    " add free_seats TYPE i OPTIONAL to the constructor and set me->free_seats

" The method
  METHOD book.
    SELECT SINGLE * FROM sflight
      WHERE carrid = @iv_carrid AND connid = @iv_connid AND fldate = @iv_fldate
      INTO @DATA(ls_flight).
    DATA(lv_free) = ls_flight-seatsmax - ls_flight-seatsocc.
    IF lv_free < iv_seats.
      RAISE EXCEPTION TYPE zcx_flight_error
        EXPORTING textid     = zcx_flight_error=>not_enough_seats
                  connid     = iv_connid
                  free_seats = lv_free.
    ENDIF.
  ENDMETHOD.

" The caller
  TRY.
      lcl_booking=>book( iv_carrid = 'LH' iv_connid = '0400'
                         iv_fldate = '20261215' iv_seats = 500 ).
    CATCH zcx_flight_error INTO DATA(lx_error).
      WRITE: / lx_error->get_text( ), lx_error->free_seats.
  ENDTRY.
```

> [!NOTE]
>
> - A custom exception class is a global `ZCX_` class that inherits from `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK`, or `CX_NO_CHECK`.
> - With `IF_T100_DYN_MSG`, texts come from a message class; each text ID constant maps attributes to `&1`...`&4`.
> - Raise it with `RAISE EXCEPTION TYPE ... EXPORTING textid = ...`, or with `MESSAGE ... WITH ...`.
> - `RETRY` restarts the `TRY` block; make sure the cause is fixed first.
> - `RESUME` continues after a `RAISE RESUMABLE EXCEPTION`; it needs `RAISING RESUMABLE( ... )` and `CATCH BEFORE UNWIND`.
