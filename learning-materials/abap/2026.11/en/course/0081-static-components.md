---
title: Static components
description: CLASS-DATA, CLASS-METHODS, and the => operator.
---

_Intermediate level_

So far every attribute and method you wrote belonged to an object: each instance had its own copy of the data, and you needed a reference to call a method. **Static components** belong to the class itself. There's exactly one copy of a static attribute, shared by all instances, and you can call a static method without creating any object.

You'll use them for counters, caches, constants, utility methods, and the factory methods you'll meet in [design patterns](./0088-design-patterns.md).

## Instance vs. static

| Component | Instance               | Static                  |
| --------- | ---------------------- | ----------------------- |
| Attribute | `DATA`                 | `CLASS-DATA`            |
| Method    | `METHODS`              | `CLASS-METHODS`         |
| Event     | `EVENTS`               | `CLASS-EVENTS`          |
| Access    | `lo_object->component` | `class_name=>component` |
| Lifetime  | as long as the object  | as long as the program  |
| Copies    | one per object         | one per class           |

`CONSTANTS` are always static: you read them with `=>`, for example `lcl_flight=>c_max_seats`.

> [!TIP]
> Think of a block of flats. Each flat has its own kitchen (instance attributes): what you cook in yours doesn't change your neighbor's. The noticeboard in the lobby is shared (static attribute): anyone who pins a note there changes it for everybody, and it's there even when no flat is occupied.

## Declaring and using static components

The **class component selector** `=>` reads a static attribute or calls a static method through the class name. The **object component selector** `->` works only through a reference.

```abap
REPORT zstatic_components.

CLASS lcl_booking DEFINITION.
  PUBLIC SECTION.
    CONSTANTS c_max_per_customer TYPE i VALUE 5.

    CLASS-DATA gv_count TYPE i READ-ONLY.     " shared by all bookings

    CLASS-METHODS get_count
      RETURNING VALUE(rv_count) TYPE i.

    METHODS constructor
      IMPORTING iv_customer TYPE s_customer.

  PRIVATE SECTION.
    DATA mv_customer TYPE s_customer.          " one per booking
ENDCLASS.

CLASS lcl_booking IMPLEMENTATION.
  METHOD constructor.
    mv_customer = iv_customer.
    gv_count = gv_count + 1.                  " inside the class, no prefix needed
  ENDMETHOD.

  METHOD get_count.
    rv_count = gv_count.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE: / 'Before:', lcl_booking=>get_count( ).   " works without any object

  DATA(lo_first)  = NEW lcl_booking( '00000001' ).
  DATA(lo_second) = NEW lcl_booking( '00000002' ).

  WRITE: / 'After:', lcl_booking=>gv_count.        " 2
  WRITE: / 'Limit:', lcl_booking=>c_max_per_customer.
```

Inside the class's own methods you can write `gv_count` directly, or `lcl_booking=>gv_count` if you want to make it clear it's static. Outside, you always need the class name.

The static attribute is initialized once, the first time the class is used in the program. If you need code to set it up, put it in the static constructor `class_constructor`, which you saw in [constructors](./0079-constructors.md).

## What a static method can't do

A static method runs without an object, so there's no `me` inside it. It can't read instance attributes or call instance methods of its own class directly:

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid TYPE s_carr_id.
    CLASS-METHODS describe.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD describe.
    WRITE mv_carrid.     " syntax error: no instance here
  ENDMETHOD.
ENDCLASS.
```

The opposite works: an instance method can use static attributes and call static methods freely. If a static method needs instance data, it has to receive an object reference as a parameter or create one.

## Utility classes

A class with only static methods is a **utility class**: a named group of functions that don't need state. You can call them in a functional position like any other method.

```abap
CLASS lcl_price_utils DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS add_vat
      IMPORTING iv_net          TYPE s_price
                iv_rate         TYPE p
      RETURNING VALUE(rv_gross) TYPE s_price.
ENDCLASS.

CLASS lcl_price_utils IMPLEMENTATION.
  METHOD add_vat.
    rv_gross = iv_net * ( 1 + iv_rate / 100 ).
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lv_gross) = lcl_price_utils=>add_vat( iv_net = 100 iv_rate = 22 ).
  WRITE / lv_gross.                                 " 122.00
```

`FINAL` means nobody can inherit from the class; you'll see why in [abstract and final classes](./0083-abstract-and-final.md).

> [!WARNING]
> Static attributes are global state. Every part of the program can see and change them (unless they're `READ-ONLY` or private), and they keep their value for the whole run. That makes bugs hard to trace and unit tests hard to isolate, because one test can leave data behind for the next. Use static attributes for constants, counters, and caches, not as a hidden place to pass data between methods.

## Exercise

> [!IMPORTANT]
>
> 1. Write a local class `lcl_flight_cache` with a private static table `gt_carriers` of type `STANDARD TABLE OF scarr WITH EMPTY KEY`.
> 2. Add a public static method `get_name` that takes a `carrid` and returns the `carrname`. The first time it's called, it fills `gt_carriers` with a `SELECT` on `SCARR`; after that it only reads from the table.
> 3. Call it twice from `START-OF-SELECTION` and check in the [debugger](./0028-debugger-basics.md) that the `SELECT` runs only once.

### Solution

```abap
CLASS lcl_flight_cache DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS get_name
      IMPORTING iv_carrid      TYPE s_carr_id
      RETURNING VALUE(rv_name) TYPE s_carrname.
  PRIVATE SECTION.
    CLASS-DATA gt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.
ENDCLASS.

CLASS lcl_flight_cache IMPLEMENTATION.
  METHOD get_name.
    IF gt_carriers IS INITIAL.
      SELECT * FROM scarr INTO TABLE @gt_carriers.
    ENDIF.
    READ TABLE gt_carriers INTO DATA(ls_carrier) WITH KEY carrid = iv_carrid.
    IF sy-subrc = 0.
      rv_name = ls_carrier-carrname.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE / lcl_flight_cache=>get_name( 'LH' ).
  WRITE / lcl_flight_cache=>get_name( 'AA' ).
```

> [!NOTE]
>
> - `CLASS-DATA`, `CLASS-METHODS`, and `CLASS-EVENTS` declare components that belong to the class, not to an object.
> - Use `class_name=>component` for static components and `reference->component` for instance components. Constants are always static.
> - A static attribute has one copy shared by all instances and lives for the whole program.
> - A static method has no `me`: it can't use instance attributes or methods of its class directly.
> - Use static attributes sparingly: they're global state and make testing harder.
