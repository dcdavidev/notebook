---
title: Attributes and methods
description: Data and behavior of an object, and the self-reference me.
---

_Intermediate level_

An object has two kinds of components: **attributes**, which hold its data, and **methods**, which contain its behavior. Methods work on the attributes of the object they're called on, so every object behaves according to its own data.

This lesson shows how to declare both, how methods reach the attributes, and what the self-reference `me` is for.

## Attributes

An **instance attribute** is declared with `DATA` in the class definition. Every object gets its own copy. You can give it a start value with `VALUE`, and you can declare types and constants inside the class, too:

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    TYPES ty_status TYPE c LENGTH 1.                  " a type that belongs to the class
    CONSTANTS gc_open   TYPE ty_status VALUE 'O'.
    CONSTANTS gc_closed TYPE ty_status VALUE 'C'.

    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_seatsmax TYPE s_seatsmax VALUE 10.        " start value of every new object
    DATA mv_seatsocc TYPE s_seatsocc.
    DATA mv_status   TYPE ty_status VALUE gc_open.

    METHODS book_seat.
    METHODS display.
ENDCLASS.
```

- Constants exist once for the class, not per object. Outside the class you address them with the class name and `=>`: `lcl_flight=>gc_open`. Static components in general are covered in [static components](./0081-static-components.en.md).
- Types declared in the class can be used outside too, as `lcl_flight=>ty_status`, if they're in the public section.
- The prefix `mv_` (member variable) marks instance attributes, so you can tell them apart from local variables (`lv_`).

## Methods

A method is declared with `METHODS` in the definition and implemented between `METHOD` and `ENDMETHOD`. Inside a method you can use the attributes of the object directly by name, declare local variables with `DATA`, and call the other methods of the same class:

```abap
CLASS lcl_flight IMPLEMENTATION.
  METHOD book_seat.
    IF mv_status = gc_closed.
      RETURN.                                          " leave the method
    ENDIF.
    mv_seatsocc = mv_seatsocc + 1.
    IF mv_seatsocc >= mv_seatsmax.
      mv_status = gc_closed.
    ENDIF.
    display( ).                                        " call another method of this object
  ENDMETHOD.

  METHOD display.
    DATA lv_free TYPE i.                               " local: exists only during the call
    lv_free = mv_seatsmax - mv_seatsocc.
    WRITE: / mv_carrid, mv_connid, 'free seats:', lv_free, 'status:', mv_status.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_flight) = NEW lcl_flight( ).
  lo_flight->mv_carrid = 'LH'.
  lo_flight->mv_connid = '0400'.
  DO 11 TIMES.
    lo_flight->book_seat( ).                           " the eleventh call changes nothing
  ENDDO.
```

- Local data of a method is created at each call and is gone when the method ends. Attributes keep their value for the whole life of the object.
- `RETURN` leaves the method immediately.
- Which object's attributes does `book_seat` change? Those of the object it was called on: `lo_flight->book_seat( )` works on `lo_flight`.

> [!TIP]
> Attributes are what a person knows (name, age, address); methods are what a person can do (walk, talk, sign a form). When you ask Anna to sign, she signs with her own name, not with someone else's: a method always works on the data of its own object.

## The self-reference me

Inside a method, `me` is a reference to the object the method is running on. Usually you don't need it, because `mv_seatsocc` already means "the attribute of this object". You need `me` in two cases:

1. **A local name hides an attribute.** If a parameter or a local variable has the same name as an attribute, the plain name refers to the local one. `me->` reaches the attribute.
2. **You pass the object itself** to another method or store it somewhere, for example `lo_list->add( me )`.

```abap
CLASS lcl_customer DEFINITION.
  PUBLIC SECTION.
    DATA name TYPE s_custname.
    METHODS set_name IMPORTING name TYPE s_custname.
ENDCLASS.

CLASS lcl_customer IMPLEMENTATION.
  METHOD set_name.
    me->name = name.     " attribute = parameter
  ENDMETHOD.
ENDCLASS.
```

`IMPORTING` declares an input parameter: method parameters are the topic of [method parameters](./0078-method-parameters.en.md).

> [!WARNING]
> Without `me->`, the line `name = name.` assigns the parameter to itself and the attribute stays empty. There's no syntax error, only a silent bug. The naming conventions (`mv_` for attributes, `iv_` for parameters) avoid the clash completely.

## Exercise

> [!IMPORTANT]
>
> 1. Write a class `lcl_booking_counter` with attributes for an airline, a counter of bookings, and a maximum (start value 3).
> 2. Add a method `add_booking` that increases the counter only if the maximum isn't reached, and a method `display` that writes the airline and the counter. `add_booking` should call `display`.
> 3. Create two objects for two airlines, call `add_booking` a different number of times on each, and check that each keeps its own counter.

### Solution

```abap
REPORT zflight_counter.

CLASS lcl_booking_counter DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid TYPE s_carr_id.
    DATA mv_count  TYPE i.
    DATA mv_max    TYPE i VALUE 3.
    METHODS add_booking.
    METHODS display.
ENDCLASS.

CLASS lcl_booking_counter IMPLEMENTATION.
  METHOD add_booking.
    IF mv_count < mv_max.
      mv_count = mv_count + 1.
    ENDIF.
    display( ).
  ENDMETHOD.

  METHOD display.
    WRITE: / mv_carrid, mv_count, '/', mv_max.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_lh) = NEW lcl_booking_counter( ).
  lo_lh->mv_carrid = 'LH'.
  DATA(lo_az) = NEW lcl_booking_counter( ).
  lo_az->mv_carrid = 'AZ'.

  DO 4 TIMES.
    lo_lh->add_booking( ).          " stops at 3
  ENDDO.
  lo_az->add_booking( ).            " AZ has 1
```

> [!NOTE]
>
> - Attributes (`DATA`) hold the data of each object; `VALUE` sets their start value. Classes can also declare `TYPES` and `CONSTANTS`.
> - Methods are declared with `METHODS` and implemented in `METHOD ... ENDMETHOD`; they can have local data.
> - Inside a method, attribute names refer to the attributes of the object the method was called on.
> - `me` is the reference to the current object: use it when a local name hides an attribute, or to pass the object along.
> - Clear prefixes (`mv_`, `lv_`, `iv_`) prevent name clashes between attributes and local data.
