---
title: Object-oriented programming and exceptions
description: Classes, objects, inheritance, interfaces, events, and exceptions.
---

**Abstract class**: a class declared `ABSTRACT` that cannot be instantiated: it exists only as a superclass. Lesson [83](../course/v2/0083-abstract-and-final.en.md).

**Attribute**: a data object that belongs to a class or an object, declared with `DATA` or `CLASS-DATA`. Lesson [77](../course/v2/0077-attributes-and-methods.en.md).

**Casting**: assigning a reference to a variable of another type: _upcast_ towards the superclass, _downcast_ (`CAST`, `?=`) towards the subclass. Lesson [85](../course/v2/0085-polymorphism-and-casting.en.md).

**Class**: the blueprint objects are created from: it defines attributes, methods, and events. It can be local (inside a program) or global (in the repository). Lessons [76](../course/v2/0076-classes-and-objects.en.md), [87](../course/v2/0087-global-classes.en.md).

**Constructor**: the method that runs automatically when an object is created (`constructor`) or when the class is first used (`class_constructor`). Lesson [79](../course/v2/0079-constructors.en.md).

**Design pattern**: a proven solution to a recurring design problem: singleton, factory, strategy, observer, and others. Lesson [88](../course/v2/0088-design-patterns.en.md).

**Encapsulation**: hiding a class's internal details in `PRIVATE` and `PROTECTED` sections and exposing only a `PUBLIC` interface. Lesson [80](../course/v2/0080-visibility-and-encapsulation.en.md).

**Event (objects)**: a signal an object raises with `RAISE EVENT` that other objects respond to with handler methods registered with `SET HANDLER`. Lesson [86](../course/v2/0086-events.en.md).

**Exception**: an error situation that interrupts the normal flow and is handled with `TRY ... CATCH ... ENDTRY`. Lesson [89](../course/v2/0089-class-based-exceptions.en.md).

**Exception class**: a class inheriting from `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK`, or `CX_NO_CHECK` that represents an error; raised with `RAISE EXCEPTION`. Lessons [89](../course/v2/0089-class-based-exceptions.en.md), [90](../course/v2/0090-custom-exception-classes.en.md).

**Final class**: a class declared `FINAL` that cannot be inherited from. Lesson [83](../course/v2/0083-abstract-and-final.en.md).

**Inheritance**: the mechanism by which a subclass receives attributes and methods from a superclass (`INHERITING FROM`) and can redefine them (`REDEFINITION`). Lesson [82](../course/v2/0082-inheritance.en.md).

**Instance**: a concrete object created from a class with `NEW` or `CREATE OBJECT`. In the architecture, also an application server with its work processes. Lessons [3](../course/v2/0003-sap-system-architecture.en.md), [76](../course/v2/0076-classes-and-objects.en.md).

**Interface**: a set of methods without implementation that several classes can implement (`INTERFACES`), guaranteeing the same behavior. Lesson [84](../course/v2/0084-interfaces.en.md).

**Method**: a procedure that belongs to a class and works on its attributes; declared with `METHODS` and implemented between `METHOD` and `ENDMETHOD`. Lesson [77](../course/v2/0077-attributes-and-methods.en.md).

**Method parameter**: a value passed to or from a method: `IMPORTING`, `EXPORTING`, `CHANGING`, or `RETURNING`. Lesson [78](../course/v2/0078-method-parameters.en.md).

**Object**: an instance of a class, with its own attribute values, reached through a reference variable. Lesson [76](../course/v2/0076-classes-and-objects.en.md).

**Polymorphism**: the ability to call the same method on objects of different classes and get each class's own behavior. Lesson [85](../course/v2/0085-polymorphism-and-casting.en.md).

**Static component**: a class attribute or method (`CLASS-DATA`, `CLASS-METHODS`) shared by all instances and used without creating an object. Lesson [81](../course/v2/0081-static-components.en.md).

**Visibility**: the `PUBLIC`, `PROTECTED`, and `PRIVATE` sections of a class, which decide who can use each component. Lesson [80](../course/v2/0080-visibility-and-encapsulation.en.md).
