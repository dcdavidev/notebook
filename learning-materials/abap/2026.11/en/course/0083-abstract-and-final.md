---
title: Abstract and final classes
description: Classes you can't instantiate and classes you can't extend.
---

_Intermediate level_

With [inheritance](./0082-inheritance.md) any class can be instantiated and any class can be extended. Two keywords change that. `ABSTRACT` marks a class that exists only to be inherited from: you can't create objects of it. `FINAL` marks a class that nobody can inherit from, or a method that nobody can redefine. Together they let you say exactly how your classes are meant to be used.

## Abstract classes and methods

An **abstract class** is a partial blueprint. It can have attributes, a constructor, and normal methods, but it can also declare **abstract methods**: methods with a signature and no implementation. Each concrete subclass must implement them with `REDEFINITION`.

```abap
REPORT zabstract_final.

CLASS lcl_fare DEFINITION ABSTRACT.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_base TYPE s_price.
    METHODS get_price FINAL
      RETURNING VALUE(rv_price) TYPE s_price.
  PROTECTED SECTION.
    DATA mv_base TYPE s_price.
    METHODS get_factor ABSTRACT
      RETURNING VALUE(rv_factor) TYPE f.
ENDCLASS.

CLASS lcl_fare IMPLEMENTATION.
  METHOD constructor.
    mv_base = iv_base.
  ENDMETHOD.

  METHOD get_price.                      " same steps for every fare
    rv_price = mv_base * get_factor( ).
  ENDMETHOD.
  " no METHOD get_factor here: it's abstract
ENDCLASS.

CLASS lcl_economy_fare DEFINITION INHERITING FROM lcl_fare FINAL.
  PROTECTED SECTION.
    METHODS get_factor REDEFINITION.
ENDCLASS.

CLASS lcl_economy_fare IMPLEMENTATION.
  METHOD get_factor.
    rv_factor = 1.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_first_fare DEFINITION INHERITING FROM lcl_fare FINAL.
  PROTECTED SECTION.
    METHODS get_factor REDEFINITION.
ENDCLASS.

CLASS lcl_first_fare IMPLEMENTATION.
  METHOD get_factor.
    rv_factor = '3.5'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lo_fare TYPE REF TO lcl_fare.     " a reference to an abstract class is fine

  lo_fare = NEW lcl_first_fare( 400 ).
  WRITE / lo_fare->get_price( ).          " 1400.00

* lo_fare = NEW lcl_fare( 400 ).         " syntax error: lcl_fare is abstract
```

The rules:

- A class with at least one abstract method must be declared `ABSTRACT`.
- An abstract class can't be instantiated with `NEW` or `CREATE OBJECT`, but you can declare references with its type and point them to objects of its subclasses.
- A concrete subclass must redefine every abstract method it inherits. If it doesn't, it must be abstract too.
- An abstract method can't be private, because a subclass couldn't see it to redefine it.
- Static methods can't be abstract.

> [!TIP]
> An abstract class is a form with blank fields. The office prints the layout, the headings, and the instructions once, but the form isn't valid until someone fills in the blanks. Each subclass is a filled-in copy.

## The template method pattern

The example above follows a common pattern: the abstract superclass has a public method that defines the fixed sequence of steps (`get_price`) and leaves one or more steps abstract (`get_factor`). Subclasses fill in only the steps that differ. This is called the **template method** pattern, and it's the main reason to write abstract classes. The [design patterns](./0088-design-patterns.md) lesson shows more patterns.

## Final classes and methods

`FINAL` closes a class or a method to change:

| Where                           | Effect                            |
| ------------------------------- | --------------------------------- |
| `CLASS lcl_x DEFINITION FINAL.` | no class can inherit from `lcl_x` |
| `METHODS m FINAL.`              | no subclass can redefine `m`      |
| `METHODS m FINAL REDEFINITION.` | this redefinition is the last one |

In the example, `get_price` is final: subclasses decide the factor, but they can't change how the price is computed. The two concrete fares are final classes, so nobody can build a subclass of them and change their behavior unnoticed.

In a final class all methods are implicitly final, so you don't mark them one by one. `ABSTRACT` and `FINAL` together on the same class are allowed but useless, since the class could never be used: the only exception is a class with static components only.

> [!WARNING]
> Making a class final is a design decision, not a formality. Final classes are safer to change, because no hidden subclass depends on their internals. But a final class can't be replaced by a test subclass, so for classes you'll want to replace in [ABAP Unit](./0105-abap-unit-basics.md) tests, give them an [interface](./0084-interfaces.md) first.

## Exercise

> [!IMPORTANT]
>
> 1. Add a final subclass `lcl_business_fare` to the example, with a factor of `2`.
> 2. In `START-OF-SELECTION`, put one object of each fare in an internal table of type `STANDARD TABLE OF REF TO lcl_fare WITH EMPTY KEY` and print the price of each in a `LOOP AT`.
> 3. Try to redefine `get_price` in `lcl_business_fare`. Read the syntax error, then remove the redefinition.

### Solution

```abap
CLASS lcl_business_fare DEFINITION INHERITING FROM lcl_fare FINAL.
  PROTECTED SECTION.
    METHODS get_factor REDEFINITION.
ENDCLASS.

CLASS lcl_business_fare IMPLEMENTATION.
  METHOD get_factor.
    rv_factor = 2.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_fares TYPE STANDARD TABLE OF REF TO lcl_fare WITH EMPTY KEY.

  lt_fares = VALUE #( ( NEW lcl_economy_fare( 400 ) )
                      ( NEW lcl_business_fare( 400 ) )
                      ( NEW lcl_first_fare( 400 ) ) ).

  LOOP AT lt_fares INTO DATA(lo_fare).
    WRITE / lo_fare->get_price( ).       " 400.00, 800.00, 1400.00
  ENDLOOP.
```

The redefinition of `get_price` fails because the method is final in `lcl_fare`.

> [!NOTE]
>
> - `ABSTRACT` on a class forbids instances; `ABSTRACT` on a method declares it without an implementation.
> - A class with an abstract method must be abstract, and concrete subclasses must redefine every abstract method.
> - You can still declare references of an abstract type and point them to subclass objects.
> - `FINAL` on a class forbids subclasses; on a method it forbids redefinition.
> - Abstract classes are the basis of the template method pattern: fixed steps in the superclass, variable steps in the subclasses.
