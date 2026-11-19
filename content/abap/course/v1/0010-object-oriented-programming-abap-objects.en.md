---
title: Object-oriented programming (ABAP Objects)
description: Classes, objects, methods, inheritance, interfaces, and polymorphism.
---

_Week 2 · Intermediate level · 4 hours_

### Today's schedule

| Block  | Content                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------ |
| Hour 1 | Why objects; class and object; attributes and methods; visibility                                      |
| Hour 2 | Constructors, static methods and attributes, parameters, functional methods, global classes (SE24/ADT) |
| Hour 3 | Inheritance, redefinition, abstract and final classes, casting                                         |
| Hour 4 | Interfaces, polymorphism, events, friendship; week recap                                               |

## Hour 1 – Classes and objects

### Why program with objects

So far you've written "procedural" code: data on one side, procedures (`FORM`s, FMs) on the other. In **object-oriented programming** (OOP), data and behavior live together in units called **objects**. All modern ABAP (RAP, ABAP Cloud, BAdIs, the SALV ALV) is object-oriented: it's an essential skill.

> [!TIP]
> A **class** is the blueprint of a car: it says every car has a color, a tank, and a speed (**attributes**) and that it can accelerate, brake, and refuel (**methods**). An **object** is a real car built from that blueprint: your red hatchback with half a tank. From the same blueprint you can build a thousand cars, each with its own color and tank.

The four principles of OOP:

| Principle     | Plain meaning                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Encapsulation | internal data is hidden: you access it only through methods (you don't touch the engine, you use the pedal) |
| Abstraction   | you show only what the user of the object needs                                                             |
| Inheritance   | a class can inherit from another and specialize it (a sports car is a car)                                  |
| Polymorphism  | different objects respond to the same command, each in its own way                                          |

### Your first (local) class

A class has two parts: the **DEFINITION** (what's there: the list) and the **IMPLEMENTATION** (how it works: the code of the methods).

```abap
REPORT zoo_account.

CLASS lcl_account DEFINITION.
  PUBLIC SECTION.
    METHODS deposit IMPORTING iv_amount TYPE p.
    METHODS withdraw IMPORTING iv_amount TYPE p.
    METHODS get_balance RETURNING VALUE(rv_balance) TYPE p.
  PRIVATE SECTION.
    DATA mv_balance TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_account IMPLEMENTATION.
  METHOD deposit.
    mv_balance = mv_balance + iv_amount.
  ENDMETHOD.

  METHOD withdraw.
    IF iv_amount > mv_balance.
      MESSAGE 'Insufficient balance' TYPE 'I'.
      RETURN.
    ENDIF.
    mv_balance = mv_balance - iv_amount.
  ENDMETHOD.

  METHOD get_balance.
    rv_balance = mv_balance.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lo_account TYPE REF TO lcl_account.   " a reference variable (empty)
  lo_account = NEW #( ).                     " create the object
  lo_account->deposit( 100 ).
  lo_account->withdraw( 30 ).
  WRITE lo_account->get_balance( ).          " 70

  DATA(lo_account2) = NEW lcl_account( ).    " second object, independent balance
  lo_account2->deposit( 500 ).
```

Things to notice:

- `TYPE REF TO`: the variable doesn't hold the object, but a **reference** (an address) to the object.
- `NEW #( )` creates the object (old form: `CREATE OBJECT lo_account.`).
- `->` calls a method or accesses an attribute of an object (instance).
- `=>` accesses static elements of the class (see hour 2).
- Conventions: `lcl_` local class, `zcl_` global class, `lif_`/`zif_` interfaces, `mv_` attribute (_member variable_), `lo_` object reference.

> [!TIP]
> A reference variable is like a person's phone number: it isn't the person, but it lets you talk to them. Two variables can have the same number (point to the same object). If you delete every copy of the number, nobody can call that person anymore, and the "garbage collector" takes them away.

### Visibility sections

| Section             | Who can access                               |
| ------------------- | -------------------------------------------- |
| `PUBLIC SECTION`    | everyone                                     |
| `PROTECTED SECTION` | the class itself and its subclasses (heirs)  |
| `PRIVATE SECTION`   | only the class itself (and "friend" classes) |

Rule of thumb: **private attributes**, and public methods only if they're needed outside. That way nobody can set a negative balance "from outside": they have to go through `withdraw`, which checks.

A public attribute can be declared `READ-ONLY`: readable from outside, changeable only inside.

```abap
PUBLIC SECTION.
  DATA mv_holder TYPE string READ-ONLY.
```

## Hour 2 – Constructors, statics, parameters, global classes

### The constructor

The **constructor** is a special method called `constructor`, run automatically when the object is created. It initializes the object.

```abap
CLASS lcl_account DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_holder          TYPE string
                                  iv_initial_balance TYPE p DEFAULT 0.
    DATA mv_holder TYPE string READ-ONLY.
  PRIVATE SECTION.
    DATA mv_balance TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_account IMPLEMENTATION.
  METHOD constructor.
    mv_holder  = iv_holder.
    mv_balance = iv_initial_balance.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_a) = NEW lcl_account( iv_holder = `Mario Rossi` iv_initial_balance = 1000 ).
  WRITE lo_a->mv_holder.
```

The constructor can only have `IMPORTING` parameters, and it can raise exceptions.

### Static (class) elements

Elements declared with `CLASS-DATA` and `CLASS-METHODS` belong to the **class**, not to single objects: they exist only once, shared by everyone. You use them with `=>` without creating objects.

```abap
CLASS lcl_account DEFINITION.
  PUBLIC SECTION.
    CLASS-DATA gv_account_count TYPE i READ-ONLY.
    CLASS-METHODS class_constructor.   " runs once, the first time the class is used
    METHODS constructor.
    CONSTANTS c_currency TYPE waers VALUE 'EUR'.
ENDCLASS.

CLASS lcl_account IMPLEMENTATION.
  METHOD class_constructor.
    gv_account_count = 0.
  ENDMETHOD.

  METHOD constructor.
    gv_account_count += 1.             " counts every account created
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_1) = NEW lcl_account( ).
  DATA(lo_2) = NEW lcl_account( ).
  WRITE lcl_account=>gv_account_count. " 2
  WRITE lcl_account=>c_currency.
```

> [!TIP]
> Instance attributes are the balance of each single account. The static attribute is the counter at the bank entrance that counts how many accounts have been opened in total: there's only one, for everyone.

### Method parameters

| Kind                 | Meaning                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `IMPORTING`          | input, read-only (by reference) or `VALUE( )`                                |
| `EXPORTING`          | output                                                                       |
| `CHANGING`           | input and output                                                             |
| `RETURNING VALUE( )` | a single return value: makes the method "functional" (usable in expressions) |
| `RAISING`            | class-based exceptions (day 11)                                              |

Options: `OPTIONAL`, `DEFAULT value`, `PREFERRED PARAMETER`. Inside the method, `IS SUPPLIED` tells you whether an optional parameter was passed.

```abap
METHODS calculate_interest
  IMPORTING iv_rate       TYPE p
            iv_years      TYPE i DEFAULT 1
  RETURNING VALUE(rv_int) TYPE p.

" Equivalent calls
DATA(lv_i) = lo_a->calculate_interest( iv_rate = '0.02' iv_years = 3 ).
lv_i = lo_a->calculate_interest( '0.02' ).   " only one mandatory parameter: name omitted

CALL METHOD lo_a->calculate_interest         " old form
  EXPORTING iv_rate = '0.02'
  RECEIVING rv_int  = lv_i.

" Functional methods in expressions and chains
IF lo_a->get_balance( ) > 1000.
ENDIF.
WRITE lo_a->get_customer( )->get_name( ).    " chained calls
```

### The self-reference: me

Inside a method, `me` means the current object: `me->mv_balance`. It's useful mainly when a parameter has the same name as an attribute, or to pass the object itself to others.

### Global classes

A local class lives inside a program. A **global class** (`ZCL_...`) lives in the Repository and can be used anywhere. You create it in **SE24** (Class Builder) or in **ADT** (File → New → ABAP Class, recommended).

```abap
CLASS zcl_account DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_holder TYPE string.
    METHODS deposit IMPORTING iv_amount TYPE wrbtr.
    METHODS get_balance RETURNING VALUE(rv_balance) TYPE wrbtr.
  PROTECTED SECTION.
  PRIVATE SECTION.
    DATA mv_holder  TYPE string.
    DATA mv_balance TYPE wrbtr.
ENDCLASS.

CLASS zcl_account IMPLEMENTATION.
  METHOD constructor.
    mv_holder = iv_holder.
  ENDMETHOD.

  METHOD deposit.
    mv_balance += iv_amount.
  ENDMETHOD.

  METHOD get_balance.
    rv_balance = mv_balance.
  ENDMETHOD.
ENDCLASS.
```

A global class also has: local types, test classes (day 12), local helper classes, macros. `CREATE PUBLIC`/`PROTECTED`/`PRIVATE` decides who can create objects: with `CREATE PRIVATE`, only the class itself (useful for the singleton/factory pattern, day 11).

## Hour 3 – Inheritance

With **inheritance**, a class (**subclass**) receives everything from another one (**superclass**) and can add new things or redefine how methods behave.

> [!TIP]
> The "Vehicle" blueprint has wheels and a "move" method. The "Bicycle" blueprint inherits from Vehicle and adds "pedal"; the "Car" blueprint inherits from Vehicle and redefines "move" to use the engine. You don't rewrite from scratch what they have in common.

```abap
CLASS lcl_employee DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_name TYPE string iv_salary TYPE p.
    METHODS calculate_bonus RETURNING VALUE(rv_bonus) TYPE decfloat34.
    METHODS describe RETURNING VALUE(rv_txt) TYPE string.
  PROTECTED SECTION.
    DATA mv_name   TYPE string.
    DATA mv_salary TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_employee IMPLEMENTATION.
  METHOD constructor.
    mv_name   = iv_name.
    mv_salary = iv_salary.
  ENDMETHOD.

  METHOD calculate_bonus.
    rv_bonus = mv_salary * '0.05'.
  ENDMETHOD.

  METHOD describe.
    rv_txt = |{ mv_name }: bonus { calculate_bonus( ) }|.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_manager DEFINITION INHERITING FROM lcl_employee.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_name   TYPE string
                                  iv_salary TYPE p
                                  iv_team   TYPE i.
    METHODS calculate_bonus REDEFINITION.
  PRIVATE SECTION.
    DATA mv_team TYPE i.
ENDCLASS.

CLASS lcl_manager IMPLEMENTATION.
  METHOD constructor.
    super->constructor( iv_name = iv_name iv_salary = iv_salary ).   " mandatory
    mv_team = iv_team.
  ENDMETHOD.

  METHOD calculate_bonus.
    rv_bonus = super->calculate_bonus( ) + mv_team * 100.   " uses the superclass calculation and adds to it
  ENDMETHOD.
ENDCLASS.
```

Rules:

- `INHERITING FROM` names the superclass. In ABAP you inherit from **one** class only.
- `REDEFINITION` redefines a method (same signature, new code). You don't redefine the constructor: you rewrite it, and it **must** call `super->constructor( )`.
- `super->method( )` calls the superclass version.
- The subclass sees the `PUBLIC` and `PROTECTED` parts of the superclass, not the `PRIVATE` ones.
- Every class implicitly inherits from `OBJECT`.

### Abstract and final classes and methods

- `ABSTRACT` (class): you can't create objects from it; it only serves as a base. An abstract method has no implementation: subclasses must implement it.
- `FINAL` (class): nobody can inherit from it. A `FINAL` method can't be redefined.

```abap
CLASS lcl_shape DEFINITION ABSTRACT.
  PUBLIC SECTION.
    METHODS area ABSTRACT RETURNING VALUE(rv_area) TYPE decfloat34.
ENDCLASS.

CLASS lcl_circle DEFINITION INHERITING FROM lcl_shape FINAL.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_radius TYPE decfloat34.
    METHODS area REDEFINITION.
  PRIVATE SECTION.
    DATA mv_r TYPE decfloat34.
ENDCLASS.

CLASS lcl_circle IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    mv_r = iv_radius.
  ENDMETHOD.

  METHOD area.
    rv_area = '3.14159' * mv_r * mv_r.
  ENDMETHOD.
ENDCLASS.
```

### Casting: up-cast and down-cast

A variable of a superclass type can hold an object of a subclass (**up-cast**, always safe and automatic). The opposite (**down-cast**) requires `CAST` and can fail.

```abap
DATA lo_emp TYPE REF TO lcl_employee.
lo_emp = NEW lcl_manager( iv_name = `Sara` iv_salary = 5000 iv_team = 8 ).   " up-cast

DATA(lv_bonus) = lo_emp->calculate_bonus( ).   " calls the MANAGER version (polymorphism!)

* Down-cast
IF lo_emp IS INSTANCE OF lcl_manager.
  DATA(lo_man) = CAST lcl_manager( lo_emp ).
ENDIF.
" If the object isn't a manager, CAST raises CX_SY_MOVE_CAST_ERROR
" Old form: lo_man ?= lo_emp.
```

> [!TIP]
> Up-cast: every manager is an employee, so you can put them on the employee list. Down-cast: not every employee is a manager, so you must check before treating one as such.

## Hour 4 – Interfaces and polymorphism

### Interfaces

An **interface** is a contract: it lists methods (without code) that a class promises to implement. A class can implement **several** interfaces.

> [!TIP]
> An interface is like a standard power socket. It doesn't matter whether you plug in a lamp, a fridge, or a computer: if they have the right plug (they implement the interface), they work. The socket doesn't know or care what's on the other side.

```abap
INTERFACE lif_printable.
  METHODS print RETURNING VALUE(rv_txt) TYPE string.
ENDINTERFACE.

CLASS lcl_invoice DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_printable.
    METHODS constructor IMPORTING iv_number TYPE string.
  PRIVATE SECTION.
    DATA mv_number TYPE string.
ENDCLASS.

CLASS lcl_invoice IMPLEMENTATION.
  METHOD constructor.
    mv_number = iv_number.
  ENDMETHOD.

  METHOD lif_printable~print.              " interface name ~ method
    rv_txt = |Invoice no. { mv_number }|.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_delivery_note DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_printable.
ENDCLASS.

CLASS lcl_delivery_note IMPLEMENTATION.
  METHOD lif_printable~print.
    rv_txt = `Delivery note`.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_documents TYPE STANDARD TABLE OF REF TO lif_printable WITH EMPTY KEY.
  lt_documents = VALUE #( ( NEW lcl_invoice( `2026/001` ) )
                          ( NEW lcl_delivery_note( ) )
                          ( NEW lcl_invoice( `2026/002` ) ) ).

  LOOP AT lt_documents INTO DATA(lo_doc).
    WRITE / lo_doc->print( ).              " each one answers in its own way: polymorphism
  ENDLOOP.
```

- `ALIASES print FOR lif_printable~print.` creates a short name.
- Interfaces can contain constants, types, attributes, and events, and include other interfaces.
- Since 7.40, interface methods can be `DEFAULT IGNORE` or `DEFAULT FAIL` (optional implementation).

### Polymorphism: why it's so useful

The `LOOP` code doesn't know which classes exist: it only knows the interface. If tomorrow you create `lcl_order` that implements `lif_printable`, the `LOOP` works with no changes. That's exactly how **BAdIs** work (day 13): SAP defines an interface and you provide an implementation.

Good design rule: **program against interfaces, not concrete classes**.

### Object events

An object can raise an event; other objects register and react.

```abap
CLASS lcl_account DEFINITION.
  PUBLIC SECTION.
    EVENTS low_balance EXPORTING VALUE(ev_balance) TYPE p.
    METHODS withdraw IMPORTING iv_amt TYPE p.
  PRIVATE SECTION.
    DATA mv_balance TYPE p LENGTH 10 DECIMALS 2 VALUE 100.
ENDCLASS.

CLASS lcl_account IMPLEMENTATION.
  METHOD withdraw.
    mv_balance -= iv_amt.
    IF mv_balance < 50.
      RAISE EVENT low_balance EXPORTING ev_balance = mv_balance.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_alarm DEFINITION.
  PUBLIC SECTION.
    METHODS on_low_balance FOR EVENT low_balance OF lcl_account
      IMPORTING ev_balance sender.
ENDCLASS.

CLASS lcl_alarm IMPLEMENTATION.
  METHOD on_low_balance.
    WRITE / |Warning: balance dropped to { ev_balance }|.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_account) = NEW lcl_account( ).
  DATA(lo_alarm)   = NEW lcl_alarm( ).
  SET HANDLER lo_alarm->on_low_balance FOR lo_account.   " (or FOR ALL INSTANCES)
  lo_account->withdraw( 70 ).
```

> [!TIP]
> Events are like a doorbell: the account rings (`RAISE EVENT`) without knowing who's listening; whoever registered (`SET HANDLER`) comes running. You already used this yesterday with the ALV double-click.

### Friendship (FRIENDS)

`CLASS lcl_a DEFINITION FRIENDS lcl_b.` lets `lcl_b` access the private parts of `lcl_a`. It's rarely used, mostly for test classes (day 12).

### Local classes in global classes and deferred definitions

- `CLASS lcl_x DEFINITION DEFERRED.` announces a class defined later on (when two classes refer to each other).
- In a global class, helper classes go in the "Local Types" / "Class-relevant local types" tab.

## Exercises

> [!IMPORTANT]
>
> 1. Create the local class `lcl_rectangle` with private width and height, a constructor, and functional methods `area` and `perimeter` (`RETURNING`). Create 3 rectangles and print their areas and perimeters.
> 2. Add a static attribute that counts the rectangles created.
> 3. Create the abstract class `lcl_shape` with the abstract method `area`, and the subclasses `lcl_circle`, `lcl_square`, `lcl_triangle`. Put 5 shapes in a table of references to `lcl_shape` and print their areas with a single `LOOP`.
> 4. Create the interface `lif_vehicle` with the methods `accelerate` and `describe`; implement it in `lcl_car` and `lcl_bike`. Show the polymorphism.
> 5. Turn the bank account class into the global class `ZCL_ACCOUNT` in ADT. Add a `negative_balance` event and a handler.
> 6. Rewrite yesterday's ALV report as a local class `lcl_report` with the methods `get_data`, `prepare`, and `display`, called from `START-OF-SELECTION`.

## Quiz

1. What is the difference between a class and an object?
2. What is the difference between `->` and `=>`?
3. What are `PUBLIC`, `PROTECTED`, `PRIVATE`?
4. When does the constructor run? And the class constructor?
5. What does `super->` do?
6. Can you create objects of an abstract class?
7. What is the difference between inheritance and an interface?
8. What is polymorphism, in one sentence?

## Solutions

```abap
REPORT zes10_shapes.

CLASS lcl_shape DEFINITION ABSTRACT.
  PUBLIC SECTION.
    METHODS area ABSTRACT RETURNING VALUE(rv) TYPE decfloat34.
    METHODS name ABSTRACT RETURNING VALUE(rv) TYPE string.
ENDCLASS.

CLASS lcl_square DEFINITION INHERITING FROM lcl_shape.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_side TYPE decfloat34.
    METHODS area REDEFINITION.
    METHODS name REDEFINITION.
  PRIVATE SECTION.
    DATA mv_side TYPE decfloat34.
ENDCLASS.

CLASS lcl_square IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    mv_side = iv_side.
  ENDMETHOD.

  METHOD area.
    rv = mv_side * mv_side.
  ENDMETHOD.

  METHOD name.
    rv = `Square`.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_circle DEFINITION INHERITING FROM lcl_shape.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_r TYPE decfloat34.
    METHODS area REDEFINITION.
    METHODS name REDEFINITION.
  PRIVATE SECTION.
    DATA mv_r TYPE decfloat34.
ENDCLASS.

CLASS lcl_circle IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    mv_r = iv_r.
  ENDMETHOD.

  METHOD area.
    rv = '3.14159' * mv_r * mv_r.
  ENDMETHOD.

  METHOD name.
    rv = `Circle`.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_shapes TYPE STANDARD TABLE OF REF TO lcl_shape WITH EMPTY KEY.
  lt_shapes = VALUE #( ( NEW lcl_square( 2 ) ) ( NEW lcl_circle( 1 ) )
                       ( NEW lcl_square( 5 ) ) ).

  LOOP AT lt_shapes INTO DATA(lo_s).
    WRITE / |{ lo_s->name( ) }: area { lo_s->area( ) DECIMALS = 2 }|.
  ENDLOOP.
```

Quiz:

1. The class is the blueprint; the object is a concrete instance built from that blueprint.
2. `->` for instance elements (of an object), `=>` for static elements (of the class).
3. Visibility levels: everyone / the class and its subclasses / only the class.
4. The constructor on every `NEW`; the class constructor only once, the first time the class is used.
5. It calls the superclass method (or constructor).
6. No.
7. With inheritance, the subclass receives code and data (a single superclass); an interface is only a contract with no code, and a class can implement many.
8. The same command, sent to different objects, produces different behavior depending on the object.

> [!NOTE]
> Week 2 complete! You can read and write the database, modularize, build complete reports with ALV and screens, and program with objects. Next week: advanced level, with exceptions, modern ABAP, tests, enhancements, interfaces, CDS, HANA, and RAP.
