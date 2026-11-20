---
title: Interfaces
description: Contracts that unrelated classes can implement.
---

_Intermediate level_

[Inheritance](./0082-inheritance.en.md) works when classes are related: a business ticket is a ticket. But a flight and a hotel room have nothing in common except that both have a price. An **interface** describes what a class can do, without saying how. Any class can implement it, whatever its superclass, and a class can implement as many interfaces as it needs.

## Declaring an interface

An interface has only declarations: methods, constants, types, attributes, and events. It has no implementation and no visibility sections, because all its components are public.

```abap
REPORT zinterfaces.

INTERFACE lif_priceable.
  CONSTANTS c_currency TYPE s_currcode VALUE 'EUR'.
  METHODS get_price
    RETURNING VALUE(rv_price) TYPE s_price.
  METHODS get_label
    RETURNING VALUE(rv_label) TYPE string.
ENDINTERFACE.
```

> [!TIP]
> An interface is like the standard size of a power socket. The socket doesn't care whether you plug in a lamp, a laptop charger, or a kettle: they're completely different devices, but they all fit the same plug. The interface is the plug shape; each class is a device built to fit it.

## Implementing an interface

A class lists the interfaces it implements with `INTERFACES` in its public section. Then it must implement every method of the interface. Inside the class, an interface component has the name `interface~component`; `~` is the **interface component selector**.

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_priceable.
    METHODS constructor
      IMPORTING is_flight TYPE sflight.
  PRIVATE SECTION.
    DATA ms_flight TYPE sflight.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    ms_flight = is_flight.
  ENDMETHOD.

  METHOD lif_priceable~get_price.
    rv_price = ms_flight-price.
  ENDMETHOD.

  METHOD lif_priceable~get_label.
    rv_label = |Flight { ms_flight-carrid } { ms_flight-connid }|.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_hotel_room DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_priceable.
ENDCLASS.

CLASS lcl_hotel_room IMPLEMENTATION.
  METHOD lif_priceable~get_price.
    rv_price = 120.
  ENDMETHOD.

  METHOD lif_priceable~get_label.
    rv_label = `Hotel room`.
  ENDMETHOD.
ENDCLASS.
```

The two classes have no common superclass, but both fulfill the same contract.

## Interface references

The real power comes from **interface references**: a variable of type `REF TO lif_priceable` can point to an object of any class that implements the interface. Through it you can reach only the interface components.

```abap
START-OF-SELECTION.
  DATA lt_items TYPE STANDARD TABLE OF REF TO lif_priceable WITH EMPTY KEY.
  DATA lv_total TYPE s_price.

  SELECT SINGLE * FROM sflight INTO @DATA(ls_flight).

  lt_items = VALUE #( ( NEW lcl_flight( ls_flight ) )
                      ( NEW lcl_hotel_room( ) ) ).

  LOOP AT lt_items INTO DATA(lo_item).
    WRITE: / lo_item->get_label( ), lo_item->get_price( ).
    lv_total = lv_total + lo_item->get_price( ).
  ENDLOOP.

  WRITE: / 'Total:', lv_total, lif_priceable=>c_currency.
```

From outside the class you can also call an interface method through a class reference, with the full name: `lo_flight->lif_priceable~get_price( )`. Interface constants are read with `=>`, like any static component.

You can't create an object of an interface: `NEW lif_priceable( )` is a syntax error. Code that works with `REF TO lif_priceable` doesn't need to know which class is behind it, which is what you'll use in [polymorphism](./0085-polymorphism-and-casting.en.md) and in [test doubles](./0106-test-doubles.en.md).

## Aliases and composite interfaces

The `~` names are long. `ALIASES` gives an interface component a short name in the class:

```abap
CLASS lcl_seat DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_priceable.
    ALIASES get_price FOR lif_priceable~get_price.
ENDCLASS.
```

Now callers can write `lo_seat->get_price( )`. The implementation is still `METHOD lif_priceable~get_price`.

An interface can include other interfaces. The result is a **composite interface**, and a class that implements it implements all the included ones too:

```abap
INTERFACE lif_bookable.
  INTERFACES lif_priceable.
  METHODS book
    IMPORTING iv_customer TYPE s_customer.
ENDINTERFACE.
```

A class with `INTERFACES lif_bookable` must implement `lif_bookable~book`, `lif_priceable~get_price`, and `lif_priceable~get_label`.

> [!WARNING]
> Adding a method to an interface breaks every class that implements it: they no longer compile until they implement the new method. Keep interfaces small and focused. Since ABAP 7.51 you can declare an interface method with `DEFAULT IGNORE` or `DEFAULT FAIL`: classes may then skip it, and a call does nothing or raises an exception. Use this for optional methods, not as a habit.

## Interfaces or abstract classes

| Question                                     | Interface | Abstract class |
| -------------------------------------------- | --------- | -------------- |
| Can unrelated classes share it?              | yes       | no             |
| How many can one class use?                  | many      | one            |
| Can it contain implemented code?             | no        | yes            |
| Can it have protected or private components? | no        | yes            |

A common design combines both: an interface defines the contract, and an optional abstract class implements it with shared code that subclasses can reuse.

## Exercise

> [!IMPORTANT]
>
> 1. Write an interface `lif_printable` with one method `print`.
> 2. Implement it in two unrelated classes: `lcl_carrier`, which holds a row of `SCARR` and prints its name, and `lcl_connection`, which holds a row of `SPFLI` and prints the route from `cityfrom` to `cityto`.
> 3. Read one row of each table, put both objects in a table of `REF TO lif_printable`, and call `print( )` in a loop.

### Solution

```abap
INTERFACE lif_printable.
  METHODS print.
ENDINTERFACE.

CLASS lcl_carrier DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_printable.
    DATA ms_carrier TYPE scarr.
ENDCLASS.

CLASS lcl_carrier IMPLEMENTATION.
  METHOD lif_printable~print.
    WRITE / ms_carrier-carrname.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_connection DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_printable.
    DATA ms_connection TYPE spfli.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD lif_printable~print.
    WRITE: / ms_connection-cityfrom, '->', ms_connection-cityto.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_printables TYPE STANDARD TABLE OF REF TO lif_printable WITH EMPTY KEY.

  DATA(lo_carrier) = NEW lcl_carrier( ).
  SELECT SINGLE * FROM scarr INTO @lo_carrier->ms_carrier.
  DATA(lo_connection) = NEW lcl_connection( ).
  SELECT SINGLE * FROM spfli INTO @lo_connection->ms_connection.

  lt_printables = VALUE #( ( lo_carrier ) ( lo_connection ) ).
  LOOP AT lt_printables INTO DATA(lo_printable).
    lo_printable->print( ).
  ENDLOOP.
```

> [!NOTE]
>
> - An interface declares methods, constants, and other components without implementing them. All its components are public.
> - A class implements it with `INTERFACES` in the public section and `METHOD interface~method` in the implementation.
> - A `REF TO interface` variable can point to an object of any class that implements the interface.
> - `ALIASES` gives interface components short names; interfaces can include other interfaces.
> - A class can implement many interfaces but inherit from only one superclass.
