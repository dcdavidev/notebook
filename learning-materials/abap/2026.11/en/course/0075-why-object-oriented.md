---
title: Why object-oriented programming
description: 'From procedures to objects: what changes and why it helps.'
level: intermediate
---

Up to now you've split programs into [subroutines](./0069-includes-and-subroutines.md) and [function modules](./0070-function-modules.md): blocks of code that work on data passed to them or kept in global variables. That's **procedural programming**. It works, but as programs grow, the link between the data and the code that changes it gets lost.

**Object-oriented programming** (OOP) keeps data and code together in **objects**. ABAP's object-oriented part is called **ABAP Objects**, and almost everything modern in SAP is built on it: ALV, RAP, BAdIs, ABAP Unit, and ABAP Cloud. This lesson explains the ideas; the next lessons show the syntax.

## The problem with procedures and global data

Imagine a program that manages the seats of flights. Procedurally, you keep the data in global variables and write subroutines that change them:

```abap
DATA gv_seatsmax TYPE s_seatsmax.
DATA gv_seatsocc TYPE s_seatsocc.

FORM book_seat.
  IF gv_seatsocc < gv_seatsmax.
    gv_seatsocc = gv_seatsocc + 1.
  ENDIF.
ENDFORM.
```

This raises some problems:

- **Anyone can change the data.** Any line of the program can write `gv_seatsocc = 500`, skipping the check in `book_seat`. When the value is wrong, you have to search the whole program to find who changed it.
- **Only one copy.** The variables hold the seats of one flight. For two flights you need two sets of variables, or a table and an index passed around everywhere.
- **Reuse means copying.** A function group shares its global data between all callers in the same session, so it behaves like a single object you can't duplicate.

## Objects: data and behavior together

A **class** describes a kind of thing: which data it holds (**attributes**) and what it can do (**methods**). An **object** is one concrete instance of a class, with its own values. Here is a preview of the same example with a class; the syntax comes in [classes and objects](./0076-classes-and-objects.md):

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    METHODS book_seat.
  PRIVATE SECTION.
    DATA mv_seatsmax TYPE s_seatsmax VALUE 200.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD book_seat.
    IF mv_seatsocc < mv_seatsmax.
      mv_seatsocc = mv_seatsocc + 1.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_flight_rome)  = NEW lcl_flight( ).   " one object
  DATA(lo_flight_tokyo) = NEW lcl_flight( ).   " another object, with its own seats
  lo_flight_rome->book_seat( ).
```

- The seat counters are **private**: only the methods of the class can change them, so the check in `book_seat` can't be skipped.
- Each object has its own counters. You can create as many flights as you need.

> [!TIP]
> A class is the blueprint of a house; objects are the houses built from it. Every house has the same rooms, but each one has its own furniture, and you can't move furniture in someone else's house without going through the front door, the methods.

## The four big ideas

| Idea              | What it means                                               | Lesson                                                                 |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Encapsulation** | an object hides its data and exposes only methods           | [Visibility and encapsulation](./0080-visibility-and-encapsulation.md) |
| **Inheritance**   | a class can extend another and reuse its code               | [Inheritance](./0082-inheritance.md)                                   |
| **Interfaces**    | unrelated classes promise to offer the same methods         | [Interfaces](./0084-interfaces.md)                                     |
| **Polymorphism**  | the same call does different things depending on the object | [Polymorphism and casting](./0085-polymorphism-and-casting.md)         |

Together they let you change one part of a program without breaking the others, test classes in isolation with [ABAP Unit](./0105-abap-unit-basics.md), and extend standard SAP through [BAdIs](./0122-badis.md), which are interfaces you implement.

## What changes in practice

| Procedural ABAP                     | ABAP Objects                                               |
| ----------------------------------- | ---------------------------------------------------------- |
| `FORM`, `PERFORM`, function modules | methods of classes                                         |
| global variables shared by everyone | attributes owned by an object                              |
| one copy of the data per program    | as many objects as you create                              |
| `sy-subrc` and classic exceptions   | [class-based exceptions](./0089-class-based-exceptions.md) |
| obsolete syntax still allowed       | stricter syntax: no header lines, no `TABLES`, no `FORM`   |

> [!WARNING]
> Classes alone don't make good code. A class with one huge method and lots of public attributes has all the problems of procedural code, just with different keywords. Keep classes small, with a clear job, and keep their data private.

You don't have to rewrite old programs. Procedural and object-oriented code work together: a report can create objects in `START-OF-SELECTION`, and a method can call a function module or a BAPI.

## Exercise

> [!IMPORTANT]
>
> 1. Take a report of yours that uses global variables and subroutines (or the one from [includes and subroutines](./0069-includes-and-subroutines.md)).
> 2. List its global variables, and for each one write down which subroutines read or change it.
> 3. Group variables and subroutines that belong together: each group is a candidate class. Give each group a name and say which data should be private.

### Solution

For the subroutines example, the analysis could look like this:

| Global data       | Used by                            | Candidate class      |
| ----------------- | ---------------------------------- | -------------------- |
| `gt_flights`      | `read_flights`, `count_free_seats` | `lcl_flight_list`    |
| `lv_free` (local) | the caller                         | returned by a method |

`lcl_flight_list` would have a private attribute with the flights, a method to read them for an airline, and a method that returns the number of free seats. No other code could change the table directly.

> [!NOTE]
>
> - Procedural code keeps data and logic apart; with global data, anyone can change anything.
> - A class defines attributes (data) and methods (behavior); an object is one instance with its own values.
> - Encapsulation, inheritance, interfaces, and polymorphism are the main ideas of OOP.
> - Modern SAP technologies (ALV, RAP, BAdIs, ABAP Unit, ABAP Cloud) are all built on ABAP Objects.
> - Procedural and object-oriented code can be mixed, so you can adopt classes step by step.
