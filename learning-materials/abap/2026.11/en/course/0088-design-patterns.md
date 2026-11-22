---
title: Design patterns
description: Singleton, factory, and strategy in ABAP.
---

_Intermediate level_

A **design pattern** is a proven solution to a design problem that comes up again and again. It isn't a library you install: it's a way to arrange classes, interfaces, and references. This lesson shows three patterns you'll meet in almost every ABAP code base, built with the tools from the previous lessons: [static components](./0081-static-components.md), [interfaces](./0084-interfaces.md), and [polymorphism](./0085-polymorphism-and-casting.md).

| Pattern   | Problem it solves                                      | Key tool                                  |
| --------- | ------------------------------------------------------ | ----------------------------------------- |
| Singleton | there must be exactly one instance of a class          | `CREATE PRIVATE` and a static attribute   |
| Factory   | the caller shouldn't decide which class to instantiate | a static method that returns an interface |
| Strategy  | an algorithm must be swappable at runtime              | an interface with several implementations |

## Singleton

A **singleton** is a class with a single instance for the whole program, for example a configuration that is read once from the database. `CREATE PRIVATE` stops anyone outside the class from using `NEW`, so the only way to get an object is a static method that creates it the first time and then always returns the same one.

```abap
REPORT zdesign_patterns.

CLASS lcl_config DEFINITION FINAL CREATE PRIVATE.
  PUBLIC SECTION.
    CLASS-METHODS get_instance
      RETURNING VALUE(ro_instance) TYPE REF TO lcl_config.
    METHODS constructor.
    METHODS get_max_seats
      RETURNING VALUE(rv_max) TYPE i.
  PRIVATE SECTION.
    CLASS-DATA go_instance TYPE REF TO lcl_config.
    DATA mv_max_seats TYPE i.
ENDCLASS.

CLASS lcl_config IMPLEMENTATION.
  METHOD get_instance.
    IF go_instance IS NOT BOUND.
      go_instance = NEW #( ).
    ENDIF.
    ro_instance = go_instance.
  ENDMETHOD.

  METHOD constructor.
    mv_max_seats = 9.            " in real code: read from a customizing table
  ENDMETHOD.

  METHOD get_max_seats.
    rv_max = mv_max_seats.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE / lcl_config=>get_instance( )->get_max_seats( ).
* DATA(lo_config) = NEW lcl_config( ).   " syntax error: CREATE PRIVATE
```

> [!WARNING]
> A singleton is global state with a nice name. It has the same problems as any [static attribute](./0081-static-components.md): it's hard to replace in tests and it hides dependencies. Use it for things that really exist once, such as a buffer or a logger, not as a shortcut to avoid passing parameters.

## Factory

A **factory method** creates objects for the caller. The caller asks for "a fare for this booking class" and gets back an interface reference; it never names the concrete class. When you add a new fare, you change only the factory.

```abap
INTERFACE lif_fare.
  METHODS get_price
    IMPORTING iv_base         TYPE s_price
    RETURNING VALUE(rv_price) TYPE s_price.
ENDINTERFACE.

CLASS lcl_economy_fare DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_fare.
ENDCLASS.

CLASS lcl_economy_fare IMPLEMENTATION.
  METHOD lif_fare~get_price.
    rv_price = iv_base.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_business_fare DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_fare.
ENDCLASS.

CLASS lcl_business_fare IMPLEMENTATION.
  METHOD lif_fare~get_price.
    rv_price = iv_base * 2.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_fare_factory DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS create
      IMPORTING iv_class       TYPE s_class      " Y, C, or F
      RETURNING VALUE(ro_fare) TYPE REF TO lif_fare.
ENDCLASS.

CLASS lcl_fare_factory IMPLEMENTATION.
  METHOD create.
    CASE iv_class.
      WHEN 'C' OR 'F'.
        ro_fare = NEW lcl_business_fare( ).
      WHEN OTHERS.
        ro_fare = NEW lcl_economy_fare( ).
    ENDCASE.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_fare) = lcl_fare_factory=>create( 'C' ).
  WRITE / lo_fare->get_price( 300 ).                 " 600.00
```

In global classes you often combine the factory with `CREATE PRIVATE` on the concrete classes and make the factory their friend (see [visibility and encapsulation](./0080-visibility-and-encapsulation.md)), so the factory is the only way to get an object.

> [!TIP]
> A factory is the counter of a car rental. You ask for "a small car for three days"; the clerk decides which model is free and hands you the keys. You drive it the same way whatever model you get, and the rental company can change its fleet without telling you.

## Strategy

With the **strategy** pattern, a class delegates one part of its work to an object that implements an interface. You pass in a different object, and the behavior changes without touching the class. Here a booking calculates its total with a discount strategy that the caller chooses:

```abap
INTERFACE lif_discount.
  METHODS apply
    IMPORTING iv_amount        TYPE s_price
    RETURNING VALUE(rv_amount) TYPE s_price.
ENDINTERFACE.

CLASS lcl_no_discount DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_discount.
ENDCLASS.

CLASS lcl_no_discount IMPLEMENTATION.
  METHOD lif_discount~apply.
    rv_amount = iv_amount.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_loyalty_discount DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_discount.
ENDCLASS.

CLASS lcl_loyalty_discount IMPLEMENTATION.
  METHOD lif_discount~apply.
    rv_amount = iv_amount * '0.85'.                  " 15% off
  ENDMETHOD.
ENDCLASS.

CLASS lcl_booking DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING io_discount TYPE REF TO lif_discount.
    METHODS get_total
      IMPORTING iv_amount       TYPE s_price
      RETURNING VALUE(rv_total) TYPE s_price.
  PRIVATE SECTION.
    DATA mo_discount TYPE REF TO lif_discount.
ENDCLASS.

CLASS lcl_booking IMPLEMENTATION.
  METHOD constructor.
    mo_discount = io_discount.
  ENDMETHOD.

  METHOD get_total.
    rv_total = mo_discount->apply( iv_amount ).
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_regular) = NEW lcl_booking( NEW lcl_no_discount( ) ).
  DATA(lo_member)  = NEW lcl_booking( NEW lcl_loyalty_discount( ) ).
  WRITE: / lo_regular->get_total( 400 ), lo_member->get_total( 400 ).   " 400.00 340.00
```

Passing the strategy in the constructor is a form of **dependency injection**. It's also what makes classes testable: in a test you inject a fake implementation, as you'll see in [test doubles](./0106-test-doubles.md).

## Exercise

> [!IMPORTANT]
>
> 1. Add a strategy `lcl_child_discount` that halves the amount, and use it with `lcl_booking`.
> 2. Extend `lcl_fare_factory=>create` so that it caches the objects it creates: calling it twice with the same booking class returns the same instance. Use a private static hashed table.

### Solution

```abap
CLASS lcl_child_discount DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_discount.
ENDCLASS.

CLASS lcl_child_discount IMPLEMENTATION.
  METHOD lif_discount~apply.
    rv_amount = iv_amount / 2.
  ENDMETHOD.
ENDCLASS.

" In lcl_fare_factory, private section:
    TYPES: BEGIN OF ty_cache,
             class TYPE s_class,
             fare  TYPE REF TO lif_fare,
           END OF ty_cache.
    CLASS-DATA gt_cache TYPE HASHED TABLE OF ty_cache WITH UNIQUE KEY class.

" New implementation of create:
  METHOD create.
    READ TABLE gt_cache INTO DATA(ls_cache) WITH TABLE KEY class = iv_class.
    IF sy-subrc = 0.
      ro_fare = ls_cache-fare.
      RETURN.
    ENDIF.
    CASE iv_class.
      WHEN 'C' OR 'F'.
        ro_fare = NEW lcl_business_fare( ).
      WHEN OTHERS.
        ro_fare = NEW lcl_economy_fare( ).
    ENDCASE.
    INSERT VALUE #( class = iv_class fare = ro_fare ) INTO TABLE gt_cache.
  ENDMETHOD.
```

> [!NOTE]
>
> - A singleton uses `CREATE PRIVATE`, a private static reference, and a static `get_instance` method. Use it sparingly.
> - A factory method returns an interface reference and hides which concrete class it creates.
> - A strategy is an interface whose implementations you swap to change one part of a class's behavior.
> - Injecting strategies through the constructor decouples classes and makes them testable.
> - Patterns are tools, not goals: use one only when it solves a problem you actually have.
