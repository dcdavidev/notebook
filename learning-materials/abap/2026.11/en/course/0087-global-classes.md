---
title: Global classes
description: Create reusable classes in ADT and SE24, with local test and helper classes.
level: intermediate
---

The classes you've written so far were **local classes**: they live inside one report and nobody else can use them. A **global class** is a repository object of its own, stored in a **class pool**, visible to every program in the system, and transported like any other development object. Global classes are where reusable logic belongs in modern ABAP.

## Local vs. global

| Aspect         | Local class                                   | Global class                                        |
| -------------- | --------------------------------------------- | --------------------------------------------------- |
| Where it lives | inside a program, an include, or a class pool | its own class pool                                  |
| Who can use it | only the program that contains it             | any program, class, or function module              |
| Name           | `lcl_...`, any name                           | `ZCL_...` (customer namespace), up to 30 characters |
| Definition     | `CLASS lcl_x DEFINITION.`                     | `CLASS zcl_x DEFINITION PUBLIC.`                    |
| Tool           | the program editor                            | ADT or the Class Builder (`SE24`)                   |

The syntax inside is the same: sections, attributes, methods, interfaces, events. Everything you learned about local classes applies.

> [!TIP]
> A local class is a recipe written on the back of an envelope for tonight's dinner. A global class is a recipe in the family cookbook: it has a title, a page number, and everyone in the house can find it and cook from it.

## Creating a global class in ADT

In Eclipse with ADT:

```text
Right-click your package > New > ABAP Class
  Name:        ZCL_FLIGHT_SERVICE
  Description: Flight service
  Superclass:  (empty)
  Interfaces:  IF_OO_ADT_CLASSRUN   (optional, to run the class from ADT)
Next > choose or create a transport request > Finish
```

ADT generates the skeleton, and you fill it in:

```abap
CLASS zcl_flight_service DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.

    METHODS get_carrier_name
      IMPORTING iv_carrid      TYPE s_carr_id
      RETURNING VALUE(rv_name) TYPE s_carrname.
  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.

CLASS zcl_flight_service IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    out->write( get_carrier_name( 'LH' ) ).
  ENDMETHOD.

  METHOD get_carrier_name.
    SELECT SINGLE carrname FROM scarr
      WHERE carrid = @iv_carrid
      INTO @rv_name.
  ENDMETHOD.
ENDCLASS.
```

- `PUBLIC` makes it a global class.
- `CREATE PUBLIC` means anyone can instantiate it; `CREATE PROTECTED` and `CREATE PRIVATE` restrict that to the class itself and its subclasses, or to the class only.
- Activate with `Ctrl+F3`. With `IF_OO_ADT_CLASSRUN`, press `F9` to run the class as a console application: `main` runs and `out->write( )` prints to the ADT console. This interface is available from ABAP 7.52 on premise and in every ABAP Cloud system.

From any program, you use the class as you'd use a local one:

```abap
DATA(lo_service) = NEW zcl_flight_service( ).
WRITE / lo_service->get_carrier_name( 'AA' ).
```

## The Class Builder (SE24)

In SAP GUI, transaction `SE24` opens the **Class Builder**. Its default view is **form-based**: the class is spread over tabs such as _Properties_, _Interfaces_, _Attributes_, _Methods_, and _Events_, and you enter each method's parameters in a table. The _Source Code-Based_ button switches to the same text editor view that ADT shows.

Both tools edit the same object, so you can open a class created in ADT in `SE24` and the other way around. Prefer ADT for new development: features like CDS and RAP are available only there, and the source code view is easier to read and compare.

## Local classes inside a global class

A class pool can contain local types and classes that only the global class uses. In ADT you find them in the tabs at the bottom of the class editor:

| ADT tab                    | Contents                                                             |
| -------------------------- | -------------------------------------------------------------------- |
| Global Class               | the global class itself                                              |
| Class-relevant Local Types | local types you need in the declaration sections of the global class |
| Local Types                | local helper classes and types used only in the implementation       |
| Test Classes               | local test classes for ABAP Unit                                     |
| Macros                     | local macros (rarely needed)                                         |

In `SE24` you reach the same parts through the menu _Goto > Class-Local Types_.

A helper class in _Local Types_:

```abap
CLASS lcl_formatter DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS format_route
      IMPORTING is_connection   TYPE spfli
      RETURNING VALUE(rv_route) TYPE string.
ENDCLASS.

CLASS lcl_formatter IMPLEMENTATION.
  METHOD format_route.
    rv_route = |{ is_connection-cityfrom } -> { is_connection-cityto }|.
  ENDMETHOD.
ENDCLASS.
```

The methods of `zcl_flight_service` can call `lcl_formatter=>format_route( )`; no other program can. A test class in _Test Classes_ looks like this, and you'll write real ones in [ABAP Unit](./0105-abap-unit-basics.md):

```abap
CLASS ltc_flight_service DEFINITION FINAL FOR TESTING
  DURATION SHORT RISK LEVEL HARMLESS.
  PRIVATE SECTION.
    METHODS carrier_name_is_found FOR TESTING.
ENDCLASS.

CLASS ltc_flight_service IMPLEMENTATION.
  METHOD carrier_name_is_found.
    DATA(lo_cut) = NEW zcl_flight_service( ).
    cl_abap_unit_assert=>assert_not_initial( lo_cut->get_carrier_name( 'LH' ) ).
  ENDMETHOD.
ENDCLASS.
```

> [!WARNING]
> Once other programs use your global class, its public methods are a promise. Renaming a method or changing a parameter breaks every caller, often in objects that someone else owns. Before you change a public signature, check the callers with the where-used list (`Ctrl+Shift+G` in ADT), and prefer adding an optional parameter or a new method.

## Exercise

> [!IMPORTANT]
>
> 1. Create the global class `ZCL_FLIGHT_SERVICE` in ADT, in your package, with the interface `IF_OO_ADT_CLASSRUN`.
> 2. Add a public method `get_route` that takes a `carrid` and a `connid`, reads the row from `SPFLI`, and returns the route as a string by calling the local helper `lcl_formatter`.
> 3. Call `get_route( iv_carrid = 'LH' iv_connid = '0400' )` in `main`, run the class with `F9`, then open it in `SE24` and look at the form-based view.

### Solution

```abap
" Public section of ZCL_FLIGHT_SERVICE
    METHODS get_route
      IMPORTING iv_carrid       TYPE s_carr_id
                iv_connid       TYPE s_conn_id
      RETURNING VALUE(rv_route) TYPE string.

" Implementation
  METHOD get_route.
    SELECT SINGLE * FROM spfli
      WHERE carrid = @iv_carrid
        AND connid = @iv_connid
      INTO @DATA(ls_connection).
    IF sy-subrc = 0.
      rv_route = lcl_formatter=>format_route( ls_connection ).
    ENDIF.
  ENDMETHOD.

  METHOD if_oo_adt_classrun~main.
    out->write( get_route( iv_carrid = 'LH' iv_connid = '0400' ) ).
  ENDMETHOD.
```

> [!NOTE]
>
> - A global class is a repository object (`CLASS ... DEFINITION PUBLIC`) that every program can use; its name starts with `ZCL_` in the customer namespace.
> - Create and edit it in ADT (`New > ABAP Class`) or in the Class Builder `SE24`; both edit the same object.
> - `IF_OO_ADT_CLASSRUN` lets you run a class with `F9` and print with `out->write( )`.
> - A class pool can hold local helper classes (_Local Types_), types for the declarations (_Class-relevant Local Types_), and test classes (_Test Classes_).
> - Public signatures are a contract: check the where-used list before changing them.
