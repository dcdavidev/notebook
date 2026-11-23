---
title: Classes and objects
description: Local classes, DEFINITION and IMPLEMENTATION, NEW, and references.
level: intermediate
---

A **class** is a type that bundles data and code. Before you can use it, you declare it and implement it. Then you create **objects** from it and work with them through **object references**.

This lesson covers **local classes**: classes defined inside a program, visible only there. They're perfect to learn with and to structure a report. Reusable classes for the whole system are [global classes](./0087-global-classes.md), built the same way.

## Definition and implementation

A class has two parts:

- the **definition** (`CLASS ... DEFINITION`) declares the components: attributes, methods, and more. It says _what_ the class offers.
- the **implementation** (`CLASS ... IMPLEMENTATION`) contains the code of every method declared in the definition. It says _how_.

```abap
REPORT zflight_classes.

CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid TYPE s_carr_id.
    DATA mv_connid TYPE s_conn_id.
    METHODS display.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD display.
    WRITE: / 'Flight', mv_carrid, mv_connid.
  ENDMETHOD.
ENDCLASS.
```

- `PUBLIC SECTION` makes the components visible outside the class. The other sections, `PROTECTED` and `PRIVATE`, come in [visibility and encapsulation](./0080-visibility-and-encapsulation.md).
- Every method declared with `METHODS` must have a `METHOD ... ENDMETHOD` block in the implementation, otherwise the syntax check fails. A class without methods doesn't need an implementation part.
- Put the definition before the code that uses the class. In a report, a common layout is: definitions, implementations, then `START-OF-SELECTION`.

## Creating objects with NEW

A class is only a description. To use it, you create an object, also called an **instance**, with the operator `NEW`. It returns a reference to the new object, which you store in a **reference variable** declared with `TYPE REF TO`:

```abap
START-OF-SELECTION.
  DATA lo_flight TYPE REF TO lcl_flight.   " a reference variable, still empty
  lo_flight = NEW #( ).                     " create an object; # = the type of lo_flight

  lo_flight->mv_carrid = 'LH'.               " -> accesses a component of the object
  lo_flight->mv_connid = '0400'.
  lo_flight->display( ).                     " call a method

  DATA(lo_other) = NEW lcl_flight( ).        " inline: the type is given after NEW
  lo_other->mv_carrid = 'AZ'.
  lo_other->display( ).
```

- The **object component selector** `->` reaches an attribute or a method through a reference.
- Each `NEW` creates a separate object with its own attributes: changing `lo_other` doesn't touch `lo_flight`.
- In old code you'll find `CREATE OBJECT lo_flight.`, which does the same as `lo_flight = NEW #( ).`, and `CALL METHOD lo_flight->display.` for a method call. Both still work, but use the modern forms.

> [!TIP]
> The object is a car parked in a garage; the reference variable is the parking ticket. The ticket isn't the car, but with it you can find the car and drive it. Two tickets can point to the same car.

## References, not copies

Assigning one reference variable to another copies the **reference**, not the object. Both variables then point to the same object:

```abap
DATA(lo_a) = NEW lcl_flight( ).
lo_a->mv_carrid = 'LH'.

DATA(lo_b) = lo_a.            " same object, two references
lo_b->mv_carrid = 'UA'.

WRITE: / lo_a->mv_carrid.     " UA: the change is visible through both
```

An object lives as long as at least one reference points to it. When no reference is left (for example after `CLEAR lo_a` and `CLEAR lo_b`), the **garbage collector** removes it from memory. You never delete objects yourself.

## Initial references

A reference variable that doesn't point to any object is **initial**. Accessing a component through it is a runtime error (`CX_SY_REF_IS_INITIAL`, shown in `ST22` as `OBJECTS_OBJREF_NOT_ASSIGNED`). Check it with `IS BOUND`:

```abap
DATA lo_flight TYPE REF TO lcl_flight.

IF lo_flight IS NOT BOUND.
  lo_flight = NEW #( ).
ENDIF.
lo_flight->display( ).
```

> [!WARNING]
> Declaring `DATA lo_flight TYPE REF TO lcl_flight` doesn't create an object: it creates an empty ticket. Forgetting `NEW` is the most common cause of `OBJECTS_OBJREF_NOT_ASSIGNED` dumps.

If two local classes refer to each other, the first one needs to know that the second exists before its definition. Declare it in advance with `CLASS lcl_booking DEFINITION DEFERRED.`

## Exercise

> [!IMPORTANT]
>
> 1. Write a local class `lcl_connection` with public attributes for airline, connection number, departure city, and arrival city, and a method `display` that writes them on one line.
> 2. In `START-OF-SELECTION`, read the connections of `LH` from `SPFLI`, create one object per row, and store the references in an internal table of type `TABLE OF REF TO lcl_connection`.
> 3. Loop over the table and call `display` for each object.

### Solution

```abap
REPORT zflight_objects.

CLASS lcl_connection DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_cityfrom TYPE s_from_cit.
    DATA mv_cityto   TYPE s_to_city.
    METHODS display.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD display.
    WRITE: / mv_carrid, mv_connid, mv_cityfrom, mv_cityto.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_objects TYPE STANDARD TABLE OF REF TO lcl_connection WITH EMPTY KEY.

  SELECT carrid, connid, cityfrom, cityto FROM spfli
    WHERE carrid = 'LH'
    INTO TABLE @DATA(lt_connections).

  LOOP AT lt_connections INTO DATA(ls_connection).
    DATA(lo_connection) = NEW lcl_connection( ).
    lo_connection->mv_carrid   = ls_connection-carrid.
    lo_connection->mv_connid   = ls_connection-connid.
    lo_connection->mv_cityfrom = ls_connection-cityfrom.
    lo_connection->mv_cityto   = ls_connection-cityto.
    APPEND lo_connection TO lt_objects.
  ENDLOOP.

  LOOP AT lt_objects INTO DATA(lo_object).
    lo_object->display( ).
  ENDLOOP.
```

Filling the attributes one by one is clumsy: [constructors](./0079-constructors.md) let you pass the values directly to `NEW`.

> [!NOTE]
>
> - A class has a definition (what it offers) and an implementation (the code of its methods).
> - `NEW` creates an object and returns a reference; store it in a variable `TYPE REF TO` the class.
> - Use `->` to access attributes and call methods through a reference.
> - Assigning a reference copies the reference, not the object; objects without references are removed by the garbage collector.
> - Check `IS BOUND` before using a reference that might be initial.
