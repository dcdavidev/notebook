---
title: Inheritance
description: Subclasses, REDEFINITION, and super.
level: intermediate
---

**Inheritance** lets you build a new class on top of an existing one. The new class, the **subclass**, gets all the components of the **superclass** and can add new ones or change how inherited methods behave. You write the common code once and put only the differences in the subclass.

## INHERITING FROM

You declare the superclass with `INHERITING FROM` in the definition of the subclass:

```abap
REPORT zinheritance.

CLASS lcl_ticket DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_connid TYPE s_conn_id
                iv_price  TYPE s_price.
    METHODS get_price
      RETURNING VALUE(rv_price) TYPE s_price.
    METHODS describe.
  PROTECTED SECTION.
    DATA mv_connid TYPE s_conn_id.
    DATA mv_price  TYPE s_price.
ENDCLASS.

CLASS lcl_ticket IMPLEMENTATION.
  METHOD constructor.
    mv_connid = iv_connid.
    mv_price  = iv_price.
  ENDMETHOD.

  METHOD get_price.
    rv_price = mv_price.
  ENDMETHOD.

  METHOD describe.
    WRITE: / 'Flight', mv_connid, 'price', get_price( ).
  ENDMETHOD.
ENDCLASS.

CLASS lcl_business_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS get_price REDEFINITION.
    METHODS has_lounge
      RETURNING VALUE(rv_lounge) TYPE abap_bool.
ENDCLASS.

CLASS lcl_business_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = super->get_price( ) * 2.   " reuse the superclass logic
  ENDMETHOD.

  METHOD has_lounge.
    rv_lounge = abap_true.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_economy)  = NEW lcl_ticket( iv_connid = '0400' iv_price = 500 ).
  DATA(lo_business) = NEW lcl_business_ticket( iv_connid = '0400' iv_price = 500 ).

  lo_economy->describe( ).     " price 500.00
  lo_business->describe( ).    " price 1000.00
```

`lcl_business_ticket` has no constructor and no `describe` of its own: it inherits both. It adds `has_lounge` and changes `get_price`. Notice that the inherited `describe` calls `get_price( )`, and in a business ticket that's the redefined version. The method that runs always depends on the object, not on the class where the call is written.

> [!TIP]
> A subclass is like a new car model built on an existing platform. The engine, the chassis, and the wiring come from the platform; the engineers change only the seats and the dashboard. When they improve the platform's brakes, every model built on it gets better brakes.

## What a subclass inherits

| Superclass section  | Visible in the subclass  | Visible outside |
| ------------------- | ------------------------ | --------------- |
| `PUBLIC SECTION`    | yes                      | yes             |
| `PROTECTED SECTION` | yes                      | no              |
| `PRIVATE SECTION`   | no (but it still exists) | no              |

That's why `mv_price` is in the protected section: the subclass may need it, but the outside world may not. You saw the three sections in [visibility and encapsulation](./0080-visibility-and-encapsulation.md).

Other rules:

- ABAP has **single inheritance**: a class has at most one direct superclass. A superclass can have any number of subclasses, and a subclass can have subclasses of its own.
- Every class inherits, directly or indirectly, from the predefined root class `OBJECT`.
- A subclass can add new components, but it can't remove inherited ones or change their visibility.
- Component names must be unique along the whole path: a subclass can't declare a new attribute with the same name as an inherited public or protected one.

## Redefining methods

`METHODS name REDEFINITION` in the subclass replaces the implementation of an inherited instance method. The rules:

- The signature stays exactly the same: same parameters, same types. You don't repeat them.
- You redefine the method in the same section where the superclass declared it.
- Static methods and constructors can't be redefined. Each class has its own constructor (see below).
- A method declared `FINAL` can't be redefined; more in [abstract and final classes](./0083-abstract-and-final.md).

Inside the redefinition, `super->method( )` calls the superclass implementation. Use it when you want to extend the inherited behavior, not replace it completely. `super->` works only in the redefinition of that same method.

## Constructors in subclasses

If a subclass doesn't declare a constructor, it uses the superclass constructor, with its parameters. If it does declare one, the subclass constructor **must call** `super->constructor( )` before it uses any instance component:

```abap
CLASS lcl_group_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_connid     TYPE s_conn_id
                iv_price      TYPE s_price
                iv_passengers TYPE i.
    METHODS get_price REDEFINITION.
  PRIVATE SECTION.
    DATA mv_passengers TYPE i.
ENDCLASS.

CLASS lcl_group_ticket IMPLEMENTATION.
  METHOD constructor.
    super->constructor( iv_connid = iv_connid iv_price = iv_price ).
    mv_passengers = iv_passengers.
  ENDMETHOD.

  METHOD get_price.
    rv_price = super->get_price( ) * mv_passengers * '0.9'.   " 10% group discount
  ENDMETHOD.
ENDCLASS.
```

The subclass constructor can have a different signature from the superclass one. Its job is to receive what the subclass needs and pass the rest up.

> [!WARNING]
> Inheritance couples the subclass tightly to the superclass: a change in the superclass can break every subclass. Use it when the subclass really **is a** kind of the superclass (a business ticket is a ticket). When a class only **uses** another one, give it an attribute with a reference instead, or share a contract with an [interface](./0084-interfaces.md).

## Exercise

> [!IMPORTANT]
>
> 1. Copy `lcl_ticket` and add a subclass `lcl_child_ticket` that redefines `get_price` to return half of the superclass price.
> 2. Redefine `describe` in `lcl_child_ticket` so that it calls `super->describe( )` and then writes `Child fare` on the same line.
> 3. Create one ticket of each class and call `describe( )` on each.

### Solution

```abap
CLASS lcl_child_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS get_price REDEFINITION.
    METHODS describe REDEFINITION.
ENDCLASS.

CLASS lcl_child_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = super->get_price( ) / 2.
  ENDMETHOD.

  METHOD describe.
    super->describe( ).
    WRITE 'Child fare'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  NEW lcl_ticket( iv_connid = '0400' iv_price = 500 )->describe( ).
  NEW lcl_child_ticket( iv_connid = '0400' iv_price = 500 )->describe( ).   " 250.00 Child fare
```

> [!NOTE]
>
> - `INHERITING FROM` makes a class a subclass: it gets all public and protected components of the superclass.
> - ABAP has single inheritance, and every class descends from `OBJECT`.
> - `METHODS name REDEFINITION` replaces an inherited instance method without changing its signature; `super->name( )` calls the original.
> - A subclass constructor must call `super->constructor( )` before using instance components.
> - Use inheritance only for real "is a" relationships; prefer composition or interfaces otherwise.
