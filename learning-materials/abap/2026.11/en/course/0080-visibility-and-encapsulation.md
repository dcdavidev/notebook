---
title: Visibility and encapsulation
description: PUBLIC, PROTECTED, PRIVATE, READ-ONLY, and friends.
---

_Intermediate level_

**Encapsulation** means that an object hides its data and lets the outside world change it only through its methods. The methods can check every change, so the object can't end up in an invalid state, and you can change how the class works inside without breaking the programs that use it.

ABAP implements encapsulation with **visibility sections**. This lesson shows the three sections, read-only attributes, getters and setters, who can create objects, and how to grant access to specific classes with **friends**.

## The three visibility sections

Every component of a class belongs to one section. The sections must appear in this order in the definition:

| Section             | Who can access its components                                              |
| ------------------- | -------------------------------------------------------------------------- |
| `PUBLIC SECTION`    | everyone                                                                   |
| `PROTECTED SECTION` | the class itself, its [subclasses](./0082-inheritance.md), and its friends |
| `PRIVATE SECTION`   | the class itself and its friends                                           |

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_seatsmax TYPE s_seatsmax.
    METHODS book_seat
      RETURNING VALUE(rv_ok) TYPE abap_bool.
    METHODS get_free_seats
      RETURNING VALUE(rv_free) TYPE i.
  PROTECTED SECTION.
    METHODS log_change.                       " for subclasses that want to log
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    mv_seatsmax = iv_seatsmax.
  ENDMETHOD.

  METHOD book_seat.
    IF mv_seatsocc < mv_seatsmax.
      mv_seatsocc = mv_seatsocc + 1.
      log_change( ).
      rv_ok = abap_true.
    ENDIF.
  ENDMETHOD.

  METHOD get_free_seats.
    rv_free = mv_seatsmax - mv_seatsocc.
  ENDMETHOD.

  METHOD log_change.
    WRITE / |Seat booked, { get_free_seats( ) } left|.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_flight) = NEW lcl_flight( iv_seatsmax = 2 ).
  lo_flight->book_seat( ).
  " lo_flight->mv_seatsocc = 99.   " syntax error: mv_seatsocc is private
```

- Make attributes private by default. Put in the public section only what other programs really need: this is the **public interface** of the class.
- Visibility is checked by the **class**, not by the object: a method of `lcl_flight` may read the private attributes of another `lcl_flight` object, for example to compare two flights.

> [!TIP]
> A bank account works the same way. The balance is private: you can't open the bank's database and type a new number. You use the public counter (deposit, withdraw, show balance), and the bank checks every operation.

## READ-ONLY attributes

Sometimes callers need to read an attribute often, and a method just to return it feels heavy. Declare the attribute in the public section with `READ-ONLY`: everyone can read it, but only the class can change it.

```abap
CLASS lcl_booking DEFINITION.
  PUBLIC SECTION.
    DATA mv_bookid TYPE s_book_id READ-ONLY.
    METHODS constructor IMPORTING iv_bookid TYPE s_book_id.
ENDCLASS.

CLASS lcl_booking IMPLEMENTATION.
  METHOD constructor.
    mv_bookid = iv_bookid.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_booking) = NEW lcl_booking( iv_bookid = '00000042' ).
  WRITE / lo_booking->mv_bookid.          " allowed: reading
  " lo_booking->mv_bookid = '1'.          " syntax error: read-only
```

## Getters and setters

The usual alternative is a private attribute with a **getter** (a method that returns it) and, if changes are allowed, a **setter** (a method that checks and sets it). The setter is the place for the rules:

```abap
CLASS lcl_customer DEFINITION.
  PUBLIC SECTION.
    METHODS get_discount RETURNING VALUE(rv_discount) TYPE s_discount.
    METHODS set_discount
      IMPORTING iv_discount  TYPE s_discount
      RETURNING VALUE(rv_ok) TYPE abap_bool.
  PRIVATE SECTION.
    DATA mv_discount TYPE s_discount.
ENDCLASS.

CLASS lcl_customer IMPLEMENTATION.
  METHOD get_discount.
    rv_discount = mv_discount.
  ENDMETHOD.

  METHOD set_discount.
    IF iv_discount BETWEEN 0 AND 50.       " business rule: at most 50 %
      mv_discount = iv_discount.
      rv_ok = abap_true.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

> [!WARNING]
> Don't write a getter and a setter for every attribute out of habit. A class whose setters accept anything isn't encapsulated: it's a structure with extra steps. Offer methods that express what the object does, such as `book_seat` or `cancel`, and add setters only where a value may really change.

## Who can create objects: CREATE

The addition `CREATE` on the class definition decides where `NEW` is allowed:

| Addition           | Who can create objects                  |
| ------------------ | --------------------------------------- |
| `CREATE PUBLIC`    | everyone (the default)                  |
| `CREATE PROTECTED` | the class itself and its subclasses     |
| `CREATE PRIVATE`   | only the class itself (and its friends) |

`CREATE PRIVATE` is the basis of the singleton and factory patterns: the class offers a static method that creates or returns the object. See [design patterns](./0088-design-patterns.md).

## Friends

A class can grant another class access to its protected and private components with `FRIENDS`. The friend must be known before, so declare it with `DEFINITION DEFERRED` if needed:

```abap
CLASS lcl_flight_test DEFINITION DEFERRED.

CLASS lcl_flight DEFINITION FRIENDS lcl_flight_test.
  PUBLIC SECTION.
    METHODS get_free_seats RETURNING VALUE(rv_free) TYPE i.
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.
```

Now methods of `lcl_flight_test` can read and set `mv_seatsocc` directly. Friendship goes one way only: `lcl_flight` gets no access to the private components of `lcl_flight_test`. The most common use is test classes that need to prepare an object's internal state: in global classes you'll write `CLASS zcl_flight DEFINITION LOCAL FRIENDS ltc_flight.` in the test include (see [ABAP Unit](./0105-abap-unit-basics.md)).

Use friends sparingly: every friend is a class that can break your encapsulation.

## Exercise

> [!IMPORTANT]
>
> 1. Write a class `lcl_seat_plan` with private attributes for the maximum and occupied seats, a constructor that sets the maximum, and a public read-only attribute `mv_status` (`'O'` open, `'F'` full).
> 2. Add a public method `book( iv_seats )` that returns `abap_false` if there aren't enough free seats, and otherwise books them and updates `mv_status`.
> 3. In `START-OF-SELECTION`, try to change `mv_status` and a private attribute directly, read the syntax errors, then remove those lines.

### Solution

```abap
REPORT zflight_seat_plan.

CLASS lcl_seat_plan DEFINITION.
  PUBLIC SECTION.
    DATA mv_status TYPE c LENGTH 1 VALUE 'O' READ-ONLY.
    METHODS constructor IMPORTING iv_seatsmax TYPE s_seatsmax.
    METHODS book
      IMPORTING iv_seats     TYPE i
      RETURNING VALUE(rv_ok) TYPE abap_bool.
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_seat_plan IMPLEMENTATION.
  METHOD constructor.
    mv_seatsmax = iv_seatsmax.
  ENDMETHOD.

  METHOD book.
    IF iv_seats <= 0 OR mv_seatsocc + iv_seats > mv_seatsmax.
      RETURN.                                " rv_ok stays abap_false
    ENDIF.
    mv_seatsocc = mv_seatsocc + iv_seats.
    IF mv_seatsocc = mv_seatsmax.
      mv_status = 'F'.
    ENDIF.
    rv_ok = abap_true.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_plan) = NEW lcl_seat_plan( iv_seatsmax = 5 ).
  IF lo_plan->book( 3 ) = abap_true.
    WRITE / 'Booked 3'.
  ENDIF.
  IF lo_plan->book( 3 ) = abap_false.
    WRITE / 'Not enough seats'.
  ENDIF.
  lo_plan->book( 2 ).
  WRITE / |Status: { lo_plan->mv_status }|.   " F
  " lo_plan->mv_status = 'O'.                " error: the attribute is read-only
  " lo_plan->mv_seatsocc = 0.                " error: the attribute is private
```

> [!NOTE]
>
> - `PUBLIC` components are visible to everyone, `PROTECTED` to the class and its subclasses, `PRIVATE` only to the class; friends see everything.
> - Keep attributes private and expose methods that check every change: that's encapsulation.
> - `READ-ONLY` lets everyone read a public attribute that only the class can change.
> - `CREATE PUBLIC`, `PROTECTED`, or `PRIVATE` decides who can instantiate the class.
> - `FRIENDS` grants one-way access to protected and private components; use it mainly for test classes.
