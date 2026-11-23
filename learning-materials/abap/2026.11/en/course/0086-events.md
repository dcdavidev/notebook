---
title: Events
description: EVENTS, RAISE EVENT, and SET HANDLER.
level: intermediate
---

Usually an object that wants something done calls a method of another object, so it has to know that object. With **events** it works the other way around: an object announces that something happened, and any number of other objects can react, without the first one knowing who they are. That keeps classes independent: a flight doesn't need to know about the sales office, the log, or the email service that care when it fills up.

Events involve three steps: the class **declares** the event, an object **raises** it, and handler methods that have been **registered** for it run.

## Declaring and raising an event

You declare an instance event with `EVENTS` (or a static one with `CLASS-EVENTS`) in the definition of the class. An event can have only `EXPORTING` parameters, and they must be passed by value:

```abap
REPORT zevents.

CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    EVENTS seats_low
      EXPORTING VALUE(ev_free) TYPE i.
    EVENTS flight_full.

    METHODS constructor
      IMPORTING iv_connid TYPE s_conn_id
                iv_seats  TYPE i.
    METHODS book_seat.
    DATA mv_connid TYPE s_conn_id READ-ONLY.
  PRIVATE SECTION.
    DATA mv_free TYPE i.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    mv_connid = iv_connid.
    mv_free   = iv_seats.
  ENDMETHOD.

  METHOD book_seat.
    IF mv_free = 0.
      RETURN.
    ENDIF.
    mv_free = mv_free - 1.
    IF mv_free = 0.
      RAISE EVENT flight_full.
    ELSEIF mv_free <= 2.
      RAISE EVENT seats_low EXPORTING ev_free = mv_free.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

`RAISE EVENT` can only be used inside the methods of the class that declares the event (or of its subclasses). Raising an event that nobody listens to is fine: nothing happens.

## Handler methods

A **handler method** is a normal method declared with `FOR EVENT ... OF`. It can import the event's parameters, and every handler can also import `sender`, an implicit parameter with the reference to the object that raised the event:

```abap
CLASS lcl_sales_office DEFINITION.
  PUBLIC SECTION.
    METHODS on_seats_low FOR EVENT seats_low OF lcl_flight
      IMPORTING ev_free sender.
    METHODS on_flight_full FOR EVENT flight_full OF lcl_flight
      IMPORTING sender.
ENDCLASS.

CLASS lcl_sales_office IMPLEMENTATION.
  METHOD on_seats_low.
    WRITE: / 'Flight', sender->mv_connid, 'only', ev_free, 'seats left'.
  ENDMETHOD.

  METHOD on_flight_full.
    WRITE: / 'Flight', sender->mv_connid, 'is full'.
  ENDMETHOD.
ENDCLASS.
```

The handler doesn't have to import every parameter; list only the ones you need. The static type of `sender` is the class named after `OF`.

> [!TIP]
> Events work like a fire alarm. The person who sees the smoke pulls the alarm; they don't phone the firefighters, the building manager, and every office one by one. Whoever is supposed to react has already been told to listen for the bell. Add a new office to the building, and it just starts listening.

## Registering handlers with SET HANDLER

Declaring a handler isn't enough: it runs only after you register it with `SET HANDLER`, at runtime.

```abap
START-OF-SELECTION.
  DATA(lo_flight) = NEW lcl_flight( iv_connid = '0400' iv_seats = 4 ).
  DATA(lo_office) = NEW lcl_sales_office( ).

  SET HANDLER lo_office->on_seats_low
              lo_office->on_flight_full FOR lo_flight.

  DO 5 TIMES.
    lo_flight->book_seat( ).
  ENDDO.
```

The output shows two "seats left" lines and one "is full" line. When an event is raised, the registered handlers run one after the other, **synchronously**: `RAISE EVENT` returns only after all of them have finished.

The variants of `SET HANDLER`:

| Statement                                            | Effect                                               |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `SET HANDLER h FOR lo_flight.`                       | react to events of that one object                   |
| `SET HANDLER h FOR ALL INSTANCES.`                   | react to every object of the class, even future ones |
| `SET HANDLER h.`                                     | for static events (`CLASS-EVENTS`): no `FOR`         |
| `SET HANDLER h FOR lo_flight ACTIVATION abap_false.` | unregister the handler                               |

A handler can be a static method too: `SET HANDLER lcl_log=>on_flight_full FOR ALL INSTANCES.`

> [!WARNING]
> A registration keeps the handler object alive: while it's registered, the garbage collector can't free it. If you create and register many short-lived handler objects, unregister them with `ACTIVATION abap_false` when you're done with them. Also, don't rely on the order in which handlers run: if one must run before another, events are the wrong tool.

## Events in interfaces

An interface can declare events too. The class that implements it raises them as `RAISE EVENT lif_name~event`, and handlers are declared `FOR EVENT event OF lif_name`. That's how you let unrelated classes announce the same kind of event.

You'll meet events again in the [ALV grid control](./0100-alv-grid-control.md), where the grid raises events such as `double_click` and your handler reacts to them.

## Exercise

> [!IMPORTANT]
>
> 1. Add a class `lcl_logger` with a **static** handler method `on_flight_full` for the event `flight_full` of `lcl_flight` that writes `Log: flight full`.
> 2. Register it `FOR ALL INSTANCES`, create two flights with 1 seat each, and book one seat on each.
> 3. Check that the log line appears twice, even though you registered the handler only once.

### Solution

```abap
CLASS lcl_logger DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS on_flight_full FOR EVENT flight_full OF lcl_flight
      IMPORTING sender.
ENDCLASS.

CLASS lcl_logger IMPLEMENTATION.
  METHOD on_flight_full.
    WRITE: / 'Log: flight full', sender->mv_connid.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SET HANDLER lcl_logger=>on_flight_full FOR ALL INSTANCES.

  DATA(lo_first)  = NEW lcl_flight( iv_connid = '0400' iv_seats = 1 ).
  DATA(lo_second) = NEW lcl_flight( iv_connid = '0402' iv_seats = 1 ).
  lo_first->book_seat( ).
  lo_second->book_seat( ).
```

> [!NOTE]
>
> - `EVENTS` (or `CLASS-EVENTS`) declares an event; its parameters are `EXPORTING` and passed by `VALUE`.
> - `RAISE EVENT ... EXPORTING ...` triggers it from a method of the class.
> - A handler is a method declared `FOR EVENT event OF class`, which can import the parameters and `sender`.
> - Handlers run only after `SET HANDLER`, for one object, `FOR ALL INSTANCES`, or without `FOR` for static events.
> - Handlers run synchronously; unregister them with `ACTIVATION abap_false`.
