---
title: Polymorphism and casting
description: One call, many behaviors; up casts, down casts, and IS INSTANCE OF.
---

_Intermediate level_

**Polymorphism** means that the same method call does different things depending on the object behind the reference. You've already seen it at work with [inheritance](./0082-inheritance.md) and [interfaces](./0084-interfaces.md): a loop over a table of references called `get_price( )`, and each object answered in its own way. This lesson explains the rules behind it, and how to move a reference between general and specific types with **casts**.

## Static type and dynamic type

Every reference variable has two types:

- The **static type** is the type in the declaration, for example `REF TO lcl_ticket`. It's fixed, and it decides which components you can write after `->`: the syntax check uses it.
- The **dynamic type** is the class of the object the reference points to at runtime, for example `lcl_business_ticket`. It can change with each assignment, and it decides which implementation of a method runs.

The dynamic type is always the static type itself or one of its subclasses (or, for an interface, a class that implements it).

```abap
REPORT zpolymorphism.

CLASS lcl_ticket DEFINITION.
  PUBLIC SECTION.
    METHODS get_price RETURNING VALUE(rv_price) TYPE s_price.
ENDCLASS.

CLASS lcl_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = 500.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_business_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS get_price REDEFINITION.
    METHODS get_lounge RETURNING VALUE(rv_lounge) TYPE string.
ENDCLASS.

CLASS lcl_business_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = 1000.
  ENDMETHOD.

  METHOD get_lounge.
    rv_lounge = `Lounge B, gate 12`.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lo_ticket TYPE REF TO lcl_ticket.          " static type: lcl_ticket

  lo_ticket = NEW lcl_business_ticket( ).          " dynamic type: lcl_business_ticket
  WRITE / lo_ticket->get_price( ).                 " 1000.00: the redefinition runs
* WRITE / lo_ticket->get_lounge( ).                " syntax error: not in lcl_ticket
```

> [!TIP]
> Static and dynamic type are like a job title and the person who holds it. A memo addressed to "the duty manager" can ask only for what any duty manager can do. Who reads the memo, and how they handle it, depends on who's on shift tonight.

## Up cast

An **up cast** (or widening cast) assigns a reference of a more specific type to a variable of a more general type: subclass to superclass, or class to interface. It's always safe, so ABAP does it implicitly with a normal assignment:

```abap
DATA(lo_business) = NEW lcl_business_ticket( ).
DATA lo_general TYPE REF TO lcl_ticket.
DATA lo_any     TYPE REF TO object.

lo_general = lo_business.     " up cast: subclass to superclass
lo_any     = lo_business.     " up cast to the root class OBJECT
```

Up casts are what make polymorphic code possible: a method with an importing parameter `TYPE REF TO lcl_ticket` accepts any ticket, and a table of `REF TO lif_priceable` holds flights and hotel rooms together.

## Down cast

A **down cast** (or narrowing cast) goes the other way: from a general static type back to a specific one, so you can use the components only the subclass has. The compiler can't know whether it will work, so you must ask for it explicitly with the **casting operator** `?=`:

```abap
DATA lo_specific TYPE REF TO lcl_business_ticket.

lo_general = NEW lcl_business_ticket( ).
lo_specific ?= lo_general.                 " down cast, checked at runtime
WRITE / lo_specific->get_lounge( ).
```

The runtime checks the dynamic type. If the object isn't a `lcl_business_ticket` (or a subclass of it), the down cast raises the exception `CX_SY_MOVE_CAST_ERROR`, and the program dumps unless you catch it. You'll learn to catch exceptions in [class-based exceptions](./0089-class-based-exceptions.md). In modern code you can also write the down cast as an expression, `CAST lcl_business_ticket( lo_general )`, which you'll see in [constructor expressions](./0091-constructor-expressions.md).

> [!WARNING]
> Never down cast blindly. If you're not sure of the dynamic type, check it first with `IS INSTANCE OF`. And if you find yourself writing many down casts, the design is usually missing a method in the superclass or interface.

## IS INSTANCE OF and CASE TYPE OF

Since ABAP 7.50 the predicate `IS INSTANCE OF` tells you whether a down cast would succeed:

```abap
DATA lt_tickets TYPE STANDARD TABLE OF REF TO lcl_ticket WITH EMPTY KEY.

lt_tickets = VALUE #( ( NEW lcl_ticket( ) ) ( NEW lcl_business_ticket( ) ) ).

LOOP AT lt_tickets INTO DATA(lo_item).
  WRITE / lo_item->get_price( ).
  IF lo_item IS INSTANCE OF lcl_business_ticket.
    lo_specific ?= lo_item.                 " safe now
    WRITE lo_specific->get_lounge( ).
  ENDIF.
ENDLOOP.
```

When there are several possible classes, `CASE TYPE OF` checks them in order and can do the down cast for you with `INTO`:

```abap
LOOP AT lt_tickets INTO lo_item.
  CASE TYPE OF lo_item.
    WHEN TYPE lcl_business_ticket INTO DATA(lo_biz).
      WRITE: / 'Business:', lo_biz->get_lounge( ).
    WHEN TYPE lcl_ticket.
      WRITE: / 'Economy'.
    WHEN OTHERS.
      WRITE: / 'Unknown'.
  ENDCASE.
ENDLOOP.
```

Put the most specific classes first: a business ticket is also a `lcl_ticket`, so the order matters, as with `IF`... `ELSEIF`.

## Exercise

> [!IMPORTANT]
>
> 1. Write a method `print_ticket` in a local class `lcl_printer`, with an importing parameter `io_ticket TYPE REF TO lcl_ticket`. It prints the price and, only for business tickets, the lounge.
> 2. Call it once with a `lcl_ticket` and once with a `lcl_business_ticket`.
> 3. Remove the `IS INSTANCE OF` check and call it with a `lcl_ticket` again. Look at the short dump in `ST22`.

### Solution

```abap
CLASS lcl_printer DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS print_ticket
      IMPORTING io_ticket TYPE REF TO lcl_ticket.
ENDCLASS.

CLASS lcl_printer IMPLEMENTATION.
  METHOD print_ticket.
    DATA lo_business TYPE REF TO lcl_business_ticket.
    WRITE / io_ticket->get_price( ).
    IF io_ticket IS INSTANCE OF lcl_business_ticket.
      lo_business ?= io_ticket.
      WRITE lo_business->get_lounge( ).
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  lcl_printer=>print_ticket( NEW lcl_ticket( ) ).
  lcl_printer=>print_ticket( NEW lcl_business_ticket( ) ).
```

Without the check, the first call dumps with `MOVE_CAST_ERROR` (exception `CX_SY_MOVE_CAST_ERROR`).

> [!NOTE]
>
> - The static type of a reference decides what you can call; the dynamic type decides which implementation runs.
> - An up cast (specific to general) is implicit and always safe.
> - A down cast (general to specific) needs `?=` or `CAST`, and fails at runtime with `CX_SY_MOVE_CAST_ERROR` if the object has the wrong class.
> - `IS INSTANCE OF` and `CASE TYPE OF` check the dynamic type before you down cast.
> - Many down casts are a design smell: prefer a method that every subclass redefines.
