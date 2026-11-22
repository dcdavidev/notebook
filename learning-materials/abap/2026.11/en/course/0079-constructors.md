---
title: Constructors
description: Instance and static constructors.
---

_Intermediate level_

Creating an object and then filling its attributes one by one, as in [classes and objects](./0076-classes-and-objects.md), is clumsy and risky: someone can forget an attribute and use a half-built object. A **constructor** is a special method that runs automatically when an object is created, so every object starts in a valid state.

ABAP has two constructors: the **instance constructor**, which runs once for every new object, and the **static constructor**, which runs once for the class.

## The instance constructor

The instance constructor is a method called `constructor`. You declare it with `METHODS` like any other method, but you never call it yourself: `NEW` calls it and passes it the parameters you give.

```abap
REPORT zflight_constructor.

CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_carrid TYPE s_carr_id
                iv_connid TYPE s_conn_id
                iv_fldate TYPE s_date.
    METHODS display.
  PRIVATE SECTION.
    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_fldate   TYPE s_date.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    mv_carrid = iv_carrid.
    mv_connid = iv_connid.
    mv_fldate = iv_fldate.
    SELECT SINGLE seatsmax, seatsocc FROM sflight
      WHERE carrid = @iv_carrid
        AND connid = @iv_connid
        AND fldate = @iv_fldate
      INTO (@mv_seatsmax, @mv_seatsocc).
  ENDMETHOD.

  METHOD display.
    WRITE: / mv_carrid, mv_connid, mv_fldate, mv_seatsocc, '/', mv_seatsmax.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SELECT SINGLE carrid, connid, fldate FROM sflight WHERE carrid = 'LH' INTO @DATA(ls_key).

  DATA(lo_flight) = NEW lcl_flight( iv_carrid = ls_key-carrid
                                    iv_connid = ls_key-connid
                                    iv_fldate = ls_key-fldate ).
  lo_flight->display( ).
```

Rules of the instance constructor:

- It can have only `IMPORTING` parameters (mandatory or optional) and exceptions. No `EXPORTING`, `CHANGING`, or `RETURNING`: the result of `NEW` is the object itself.
- If it has mandatory parameters, every `NEW` must pass them. That's how you make sure no object is created without its key.
- It runs after the attributes have received their `VALUE` start values, so you can rely on them inside the constructor.
- A class can have only one instance constructor. To offer several ways of creating objects, use optional parameters, or static factory methods (see [design patterns](./0088-design-patterns.md)).

Thanks to the constructor, the attributes can now be **private**: nobody outside can put the object in an inconsistent state. More on this in [visibility and encapsulation](./0080-visibility-and-encapsulation.md).

> [!TIP]
> A constructor is the check-in desk at a hotel. You can't get a room key without showing your ID and booking number, and you get the room already cleaned and set up. Nobody receives a key to a room that isn't ready.

## When the constructor fails

If the flight doesn't exist, the constructor above creates an object with zero seats. A constructor should refuse to build an invalid object. It does so by raising an exception: then `NEW` doesn't create the object, and the reference variable keeps its old value.

```abap
METHODS constructor
  IMPORTING iv_carrid TYPE s_carr_id
            iv_connid TYPE s_conn_id
            iv_fldate TYPE s_date
  RAISING   zcx_flight_not_found.          " your own exception class

METHOD constructor.
  " ... SELECT SINGLE as before
  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE zcx_flight_not_found.
  ENDIF.
ENDMETHOD.
```

The caller catches the exception with `TRY ... CATCH`. You'll learn both sides in [class-based exceptions](./0089-class-based-exceptions.md), and how to create a class like `ZCX_FLIGHT_NOT_FOUND` in [custom exception classes](./0090-custom-exception-classes.md).

> [!WARNING]
> Keep constructors short. Reading one row to validate the key is fine; reading thousands of rows or calling remote systems in a constructor makes every `NEW` slow and hard to test. Load heavy data on demand, in a method.

## The static constructor

The **static constructor** is a method called `class_constructor`, declared with `CLASS-METHODS`. It has no parameters, and the runtime calls it **once per program run**, just before the class is used for the first time: before the first object is created, or before the first access to a static component.

```abap
CLASS lcl_carrier_names DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS class_constructor.
    METHODS get_name
      IMPORTING iv_carrid      TYPE s_carr_id
      RETURNING VALUE(rv_name) TYPE s_carrname.
  PRIVATE SECTION.
    CLASS-DATA gt_carriers TYPE HASHED TABLE OF scarr WITH UNIQUE KEY carrid.
ENDCLASS.

CLASS lcl_carrier_names IMPLEMENTATION.
  METHOD class_constructor.
    SELECT * FROM scarr INTO TABLE @gt_carriers.   " runs once, shared by all objects
  ENDMETHOD.

  METHOD get_name.
    IF line_exists( gt_carriers[ carrid = iv_carrid ] ).
      rv_name = gt_carriers[ carrid = iv_carrid ]-carrname.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

`CLASS-DATA` declares a static attribute, shared by all objects of the class. Static attributes and methods are explained in [static components](./0081-static-components.md).

|               | Instance constructor           | Static constructor                      |
| ------------- | ------------------------------ | --------------------------------------- |
| Name          | `constructor`                  | `class_constructor`                     |
| Declared with | `METHODS`                      | `CLASS-METHODS`                         |
| Runs          | at every `NEW`                 | once, before the first use of the class |
| Parameters    | `IMPORTING` only               | none                                    |
| Can access    | instance and static attributes | static attributes only                  |

When classes inherit from each other, the constructor of a subclass must call the one of its superclass with `super->constructor( )`: see [inheritance](./0082-inheritance.md).

## Exercise

> [!IMPORTANT]
>
> 1. Write a class `lcl_connection` whose constructor receives the airline and the connection number, reads the row from `SPFLI`, and stores departure and arrival cities in private attributes.
> 2. Add a method `display`.
> 3. Add a static constructor that writes "class loaded" with `WRITE`, create three objects, and check that the text appears only once.

### Solution

```abap
REPORT zflight_connection_ctor.

CLASS lcl_connection DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS class_constructor.
    METHODS constructor
      IMPORTING iv_carrid TYPE s_carr_id
                iv_connid TYPE s_conn_id.
    METHODS display.
  PRIVATE SECTION.
    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_cityfrom TYPE s_from_cit.
    DATA mv_cityto   TYPE s_to_city.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD class_constructor.
    WRITE / 'class loaded'.
  ENDMETHOD.

  METHOD constructor.
    mv_carrid = iv_carrid.
    mv_connid = iv_connid.
    SELECT SINGLE cityfrom, cityto FROM spfli
      WHERE carrid = @iv_carrid AND connid = @iv_connid
      INTO (@mv_cityfrom, @mv_cityto).
  ENDMETHOD.

  METHOD display.
    WRITE: / mv_carrid, mv_connid, mv_cityfrom, mv_cityto.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SELECT carrid, connid FROM spfli INTO TABLE @DATA(lt_keys) UP TO 3 ROWS.

  LOOP AT lt_keys INTO DATA(ls_key).
    NEW lcl_connection( iv_carrid = ls_key-carrid iv_connid = ls_key-connid )->display( ).
  ENDLOOP.
```

`NEW lcl_connection( ... )->display( )` creates an object and calls a method on it in one statement, without a reference variable.

> [!NOTE]
>
> - The instance constructor (`METHODS constructor`) runs at every `NEW` and receives only `IMPORTING` parameters.
> - Mandatory constructor parameters guarantee that no object is created without its essential data.
> - A constructor that raises an exception prevents the object from being created.
> - The static constructor (`CLASS-METHODS class_constructor`) has no parameters and runs once, before the first use of the class.
> - Keep constructors fast; move heavy work into methods called when needed.
