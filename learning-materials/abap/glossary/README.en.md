---
title: ABAP glossary
description: The terms of the ABAP courses in alphabetical order, with a link to the lesson that explains them.
---

# ABAP glossary

The terms used in the lessons of the ABAP courses, in alphabetical order. Each entry has a short definition and a link to the lesson of the [v2 course](../course/v2/README.en.md) that covers the topic in detail. ABAP keywords are written as `code`.

La versione italiana è in [README.it.md](./README.it.md).

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [J](#j) · [L](#l) · [M](#m) · [N](#n) · [O](#o) · [P](#p) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w) · [X](#x)

## A

**ABAP**: the programming language of SAP systems: it runs on the application server and is used to build reports, interfaces, extensions, and services. Lesson [2](../course/v2/0002-what-is-abap.en.md).

**ABAP channels**: the framework for event-based communication: _ABAP Messaging Channels_ (AMC) between sessions and _ABAP Push Channels_ (APC) to the browser over WebSocket. Lesson [150](../course/v2/0150-abap-channels.en.md).

**ABAP Cloud**: the development model that uses only released APIs and the restricted language version, for upgrade-safe extensions and a _clean core_. Lesson [148](../course/v2/0148-abap-cloud.en.md).

**ABAP Development Tools (ADT)**: the Eclipse-based IDE for ABAP; it is the only tool for CDS, RAP, and ABAP Cloud. Lesson [6](../course/v2/0006-abap-development-tools.en.md).

**ABAP Dictionary (DDIC)**: the central repository of shared data definitions: domains, data elements, tables, structures, views (transaction SE11). Lesson [43](../course/v2/0043-abap-dictionary-intro.en.md).

**ABAP Managed Database Procedure (AMDP)**: an ABAP method whose code is written in SQLScript and runs directly in the SAP HANA database. Lesson [137](../course/v2/0137-amdp.en.md).

**ABAP memory, SAP memory**: the areas for passing data between programs: ABAP memory (`EXPORT`/`IMPORT ... MEMORY`) within one session, SAP memory (`SET`/`GET PARAMETER`) for the whole logon. Lesson [72](../course/v2/0072-calling-programs-and-memory.en.md).

**ABAP SQL**: the SQL dialect built into ABAP (formerly _Open SQL_): it reads and writes database tables independently of the underlying database. Lessons [52](../course/v2/0052-select-basics.en.md), [97](../course/v2/0097-modern-abap-sql.en.md), [98](../course/v2/0098-advanced-abap-sql.en.md).

**ABAP Unit**: the framework for automated unit tests: local test classes marked `FOR TESTING` and assertions from `CL_ABAP_UNIT_ASSERT`. Lesson [105](../course/v2/0105-abap-unit-basics.en.md).

**`abap_bool`, `abap_true`, `abap_false`**: the type and the constants for Boolean values: in ABAP true is `'X'` and false is a blank. Lesson [16](../course/v2/0016-boolean-values.en.md).

**abapGit**: an open-source Git client written in ABAP, for putting development objects under version control. Lesson [151](../course/v2/0151-abapgit.en.md).

**Abstract class**: a class declared `ABSTRACT` that cannot be instantiated: it exists only as a superclass. Lesson [83](../course/v2/0083-abstract-and-final.en.md).

**Action (RAP)**: a non-standard operation of a RAP business object, such as "Approve", implemented in the behavior implementation. Lesson [142](../course/v2/0142-rap-validations-determinations-actions.en.md).

**Aggregate function**: an SQL function that computes one value over a group of rows: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Lesson [56](../course/v2/0056-aggregates-and-group-by.en.md).

**ALE (Application Link Enabling)**: the technology for asynchronous data exchange between SAP systems, usually through IDocs. Lesson [125](../course/v2/0125-idoc-and-ale.en.md).

**ALV (ABAP List Viewer)**: the standard tool for displaying data tables with sorting, filters, totals, and export; used through `CL_SALV_TABLE` or `CL_GUI_ALV_GRID`. Lessons [99](../course/v2/0099-alv-with-salv.en.md), [100](../course/v2/0100-alv-grid-control.en.md).

**Application log**: the standard log of a process's messages, stored in the database and viewed with SLG1. Lesson [112](../course/v2/0112-application-log.en.md).

**Application server**: the layer of the SAP system that runs ABAP programs, between SAP GUI and the database; it also has its own file system. Lessons [3](../course/v2/0003-sap-system-architecture.en.md), [74](../course/v2/0074-files-on-the-application-server.en.md).

**ATC (ABAP Test Cockpit)**: the tool that runs static checks on code: errors, performance, security, and style rules. Lesson [107](../course/v2/0107-code-quality.en.md).

**Attribute**: a data object that belongs to a class or an object, declared with `DATA` or `CLASS-DATA`. Lesson [77](../course/v2/0077-attributes-and-methods.en.md).

**Authorization**: a user's permission on an authorization object; code checks it with `AUTHORITY-CHECK`. Lesson [110](../course/v2/0110-authorization-checks.en.md).

## B

**Background job**: a program that runs without user interaction, scheduled with SM36 and monitored with SM37. Lesson [68](../course/v2/0068-variants-and-background-jobs.en.md).

**BAdI (Business Add-In)**: an object-oriented extension point provided by SAP: you implement an interface to add logic to the standard without modifying it. Lesson [122](../course/v2/0122-badis.en.md).

**BAPI (Business API)**: a stable, remote-enabled function module that exposes a business operation, such as creating an order. Lesson [71](../course/v2/0071-bapis.en.md).

**Batch input**: the technique that loads data by simulating manual input on a transaction's screens (`CALL TRANSACTION`, SM35). Lesson [130](../course/v2/0130-batch-input.en.md).

**Behavior definition**: the RAP object that declares what a business object can do: operations, fields, validations, determinations, actions, drafts. Lesson [141](../course/v2/0141-rap-behavior-definition.en.md).

**Behavior pool**: the global class that holds the behavior implementation of a RAP business object. Lesson [141](../course/v2/0141-rap-behavior-definition.en.md).

**Breakpoint**: a point in the code where the debugger stops execution; it can be a session, external, or user breakpoint. Lesson [29](../course/v2/0029-breakpoints-and-watchpoints.en.md).

**Business object (RAP)**: a business entity (or tree of entities) with data, behavior, and services, built with RAP. Lesson [139](../course/v2/0139-rap-overview.en.md).

## C

**`CASE`**: the statement that picks a branch by comparing one value with a list of `WHEN` alternatives. Lesson [25](../course/v2/0025-case.en.md).

**Casting**: assigning a reference to a variable of another type: _upcast_ towards the superclass, _downcast_ (`CAST`, `?=`) towards the subclass. Lesson [85](../course/v2/0085-polymorphism-and-casting.en.md).

**CDS (Core Data Services)**: the language for defining semantic data models in the database: views, associations, annotations, and access control. Lesson [132](../course/v2/0132-cds-view-entities.en.md).

**CDS access control (DCL)**: rules, written in an _access control_ object, that automatically restrict the rows a user sees in a CDS view. Lesson [136](../course/v2/0136-cds-access-control.en.md).

**CDS annotation**: metadata written with `@` in a CDS view that describes its behavior: labels, Fiori UI, authorizations, search. Lesson [134](../course/v2/0134-cds-annotations.en.md).

**CDS association**: a declared relationship between CDS entities that becomes a join only when it is used (_path expression_). Lesson [133](../course/v2/0133-cds-associations.en.md).

**CDS table function**: a CDS entity whose data is computed by an AMDP method. Lesson [138](../course/v2/0138-cds-table-functions.en.md).

**CDS view entity**: the current form of CDS view (`DEFINE VIEW ENTITY`): a `SELECT` stored in the database with annotations and associations. Lesson [132](../course/v2/0132-cds-view-entities.en.md).

**Change document**: the record of who changed which fields of a business object, when, and with which old and new values. Lesson [118](../course/v2/0118-change-documents.en.md).

**Character types**: the types for text: `c` with fixed length, `n` for numeric text, `string` with variable length. Lesson [13](../course/v2/0013-character-types.en.md).

**`CHECK`**: the statement that leaves the current block, or skips to the next loop pass, if the condition is false. Lesson [27](../course/v2/0027-exit-continue-check.en.md).

**Check table**: the table that holds the allowed values of a field, linked through a foreign key. Lesson [47](../course/v2/0047-foreign-keys-and-check-tables.en.md).

**Class**: the blueprint objects are created from: it defines attributes, methods, and events. It can be local (inside a program) or global (in the repository). Lessons [76](../course/v2/0076-classes-and-objects.en.md), [87](../course/v2/0087-global-classes.en.md).

**Clean ABAP**: SAP's style guide for readable, maintainable ABAP code, based on _Clean Code_. Lesson [107](../course/v2/0107-code-quality.en.md).

**Clean core**: the principle that extensions don't modify SAP standard code and use only released interfaces, so upgrades stay simple. Lesson [148](../course/v2/0148-abap-cloud.en.md).

**Client**: an independent unit within an SAP system, with its own data and users; it is the first field (`MANDT`) of almost every table. Lesson [4](../course/v2/0004-system-landscape-and-clients.en.md).

**Code pushdown**: moving data-intensive calculations from the ABAP server to the database (with ABAP SQL, CDS, and AMDP) to use the speed of SAP HANA. Lesson [131](../course/v2/0131-code-pushdown.en.md).

**`COMMIT WORK`**: the statement that closes the SAP LUW: it makes the database changes permanent and starts the update function modules. Lesson [60](../course/v2/0060-luw-commit-and-rollback.en.md).

**`COND`**: a constructor expression that returns a value chosen among several `WHEN` conditions, like an `IF` in a single expression. Lesson [92](../course/v2/0092-cond-and-switch.en.md).

**Constant**: a data object with a fixed value, declared with `CONSTANTS`, that cannot change at runtime. Lesson [12](../course/v2/0012-variables-and-constants.en.md).

**Constructor**: the method that runs automatically when an object is created (`constructor`) or when the class is first used (`class_constructor`). Lesson [79](../course/v2/0079-constructors.en.md).

**Constructor expression**: an expression that builds a value in place: `VALUE`, `NEW`, `CONV`, `CAST`, `REF`, `EXACT`, `COND`, `SWITCH`, `REDUCE`, `FILTER`, `CORRESPONDING`. Lesson [91](../course/v2/0091-constructor-expressions.en.md).

**`CORRESPONDING`**: the expression that copies components with the same name from one structure or table to another, with optional mappings. Lesson [94](../course/v2/0094-filter-and-corresponding.en.md).

**Customer exit**: an older extension point provided by SAP (`EXIT_*` function modules, managed with CMOD and SMOD). Lesson [121](../course/v2/0121-user-exits-and-customer-exits.en.md).

## D

**Data element**: the Dictionary object that gives a field its meaning: it points to a domain and holds the field labels and documentation. Lesson [45](../course/v2/0045-data-elements.en.md).

**Data reference**: a `REF TO` variable that holds the address of a data object and is dereferenced with `->*`. Lesson [42](../course/v2/0042-data-references.en.md).

**Database table**: a table defined in the Dictionary and created in the database (transparent table), with fields, a key, and technical settings. Lesson [46](../course/v2/0046-database-tables.en.md).

**Date and time types**: the types `d` (date, `YYYYMMDD`), `t` (time, `HHMMSS`), `utclong`, and time stamps, which support calculations. Lesson [15](../course/v2/0015-date-and-time-types.en.md).

**Debugger**: the tool that runs a program step by step and shows the values of its variables. Lesson [28](../course/v2/0028-debugger-basics.en.md).

**Dependency injection**: handing a class the objects it depends on instead of letting it create them, so tests can replace them with _test doubles_. Lesson [106](../course/v2/0106-test-doubles.en.md).

**Design pattern**: a proven solution to a recurring design problem: singleton, factory, strategy, observer, and others. Lesson [88](../course/v2/0088-design-patterns.en.md).

**Determination**: in RAP, logic that automatically computes some field values when the data changes. Lesson [142](../course/v2/0142-rap-validations-determinations-actions.en.md).

**Domain**: the Dictionary object that defines the technical attributes of a field: type, length, allowed values. Lesson [44](../course/v2/0044-domains.en.md).

**Draft**: in RAP, a working copy of the data that the user edits and saves later, without losing it when closing the app. Lesson [146](../course/v2/0146-rap-draft.en.md).

**Dynamic SQL**: a `SELECT` whose table, fields, or conditions are strings decided at runtime. Lesson [117](../course/v2/0117-dynamic-sql-and-calls.en.md).

**Dynpro**: a classic SAP GUI screen, with its layout and flow logic (transaction SE51). Lesson [101](../course/v2/0101-dynpro-basics.en.md).

## E

**EML (Entity Manipulation Language)**: the part of ABAP that reads and changes RAP business objects: `READ ENTITIES`, `MODIFY ENTITIES`, `COMMIT ENTITIES`. Lesson [143](../course/v2/0143-eml.en.md).

**Encapsulation**: hiding a class's internal details in `PRIVATE` and `PROTECTED` sections and exposing only a `PUBLIC` interface. Lesson [80](../course/v2/0080-visibility-and-encapsulation.en.md).

**Enhancement**: an extension of SAP standard code without modifying it: implicit (at the start or end of blocks) or explicit (enhancement points and sections). Lessons [120](../course/v2/0120-extending-standard-sap.en.md), [123](../course/v2/0123-enhancement-points.en.md).

**Event (objects)**: a signal an object raises with `RAISE EVENT` that other objects respond to with handler methods registered with `SET HANDLER`. Lesson [86](../course/v2/0086-events.en.md).

**Exception**: an error situation that interrupts the normal flow and is handled with `TRY ... CATCH ... ENDTRY`. Lesson [89](../course/v2/0089-class-based-exceptions.en.md).

**Exception class**: a class inheriting from `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK`, or `CX_NO_CHECK` that represents an error; raised with `RAISE EXCEPTION`. Lessons [89](../course/v2/0089-class-based-exceptions.en.md), [90](../course/v2/0090-custom-exception-classes.en.md).

**`EXIT`, `CONTINUE`**: the statements that, in a loop, respectively leave the loop and skip to the next pass. Lesson [27](../course/v2/0027-exit-continue-check.en.md).

## F

**Field symbol**: a placeholder (`<fs>`) that points to an existing data object, such as an internal table row, so you can change it without copying. Lesson [41](../course/v2/0041-field-symbols.en.md).

**`FILTER`**: the expression that returns the rows of an internal table that match a condition on a key. Lesson [94](../course/v2/0094-filter-and-corresponding.en.md).

**Final class**: a class declared `FINAL` that cannot be inherited from. Lesson [83](../course/v2/0083-abstract-and-final.en.md).

**Fiori elements**: the SAP Fiori framework that generates apps (list reports, object pages) from an OData service and its annotations. Lesson [145](../course/v2/0145-rap-fiori-elements.en.md).

**Flow logic**: the code of a Dynpro that connects the screen to ABAP modules, split into PBO and PAI. Lesson [102](../course/v2/0102-dynpro-flow-logic.en.md).

**`FOR`**: the iteration expression used inside `VALUE` and `REDUCE` to build a table or a value by looping over another table. Lesson [93](../course/v2/0093-for-and-reduce.en.md).

**`FOR ALL ENTRIES`**: the `SELECT` addition that reads the rows matching each row of an internal table; if the table is empty, it reads everything. Lesson [57](../course/v2/0057-for-all-entries.en.md).

**Foreign key**: the link between a table field and the key of a check table, which the Dictionary uses to validate the values entered. Lesson [47](../course/v2/0047-foreign-keys-and-check-tables.en.md).

**Forms (Smart Forms, Adobe Forms)**: print layouts for documents such as invoices and orders, designed with Smart Forms or Adobe Forms. Lesson [129](../course/v2/0129-forms.en.md).

**Function group**: the program that holds related function modules and their shared global data (transaction SE80 or SE37). Lesson [70](../course/v2/0070-function-modules.en.md).

**Function module**: a global, reusable procedure with an interface and exceptions, called with `CALL FUNCTION`. Lesson [70](../course/v2/0070-function-modules.en.md).

## G

**`GROUP BY`**: in SQL it groups rows to compute aggregates; with `LOOP AT ... GROUP BY` it groups the rows of an internal table. Lessons [56](../course/v2/0056-aggregates-and-group-by.en.md), [95](../course/v2/0095-grouping-internal-tables.en.md).

**GUI status**: the set of menus, buttons, and function keys of a screen, set with `SET PF-STATUS`. Lesson [104](../course/v2/0104-gui-status-and-popups.en.md).

## H

**Hashed table**: an internal table with a unique key and hash-based access: read time does not depend on the number of rows. Lesson [34](../course/v2/0034-table-categories.en.md).

**`HAVING`**: the SQL condition that filters groups after `GROUP BY`, based on aggregate values. Lesson [56](../course/v2/0056-aggregates-and-group-by.en.md).

**HTTP client**: the classes that call external web services over HTTP, such as REST APIs. Lesson [126](../course/v2/0126-http-and-rest.en.md).

## I

**IDoc (Intermediate Document)**: SAP's standard format for exchanging business documents between systems, used with ALE and EDI. Lesson [125](../course/v2/0125-idoc-and-ale.en.md).

**`IF`**: the statement that runs a block of code only if a logical expression is true, with optional `ELSEIF` and `ELSE`. Lesson [24](../course/v2/0024-if-and-logical-expressions.en.md).

**Include**: a program holding a piece of code inserted into other programs with `INCLUDE`; in the Dictionary, also a structure embedded in another one. Lessons [32](../course/v2/0032-nested-structures.en.md), [69](../course/v2/0069-includes-and-subroutines.en.md).

**Inheritance**: the mechanism by which a subclass receives attributes and methods from a superclass (`INHERITING FROM`) and can redefine them (`REDEFINITION`). Lesson [82](../course/v2/0082-inheritance.en.md).

**Inline declaration**: declaring a variable where it is first used, with `DATA(...)` or `FIELD-SYMBOL(...)`, with the type inferred from the context. Lesson [18](../course/v2/0018-inline-declarations.en.md).

**Instance**: a concrete object created from a class with `NEW` or `CREATE OBJECT`. In the architecture, also an application server with its work processes. Lessons [3](../course/v2/0003-sap-system-architecture.en.md), [76](../course/v2/0076-classes-and-objects.en.md).

**Interactive list**: a classic list where the user double-clicks a line to open a detail list (`AT LINE-SELECTION`). Lesson [67](../course/v2/0067-interactive-lists.en.md).

**Interface**: a set of methods without implementation that several classes can implement (`INTERFACES`), guaranteeing the same behavior. Lesson [84](../course/v2/0084-interfaces.en.md).

**Internal table**: an in-memory table holding a list of rows of the same type, for processing data at runtime. Lesson [33](../course/v2/0033-internal-tables-intro.en.md).

## J

**Join**: combining rows from several related tables in a single `SELECT`: `INNER JOIN`, `LEFT OUTER JOIN`, and others. Lesson [55](../course/v2/0055-joins.en.md).

**JSON**: the text format for exchanging data over the web; in ABAP you build and parse it with `/UI2/CL_JSON` or with transformations. Lesson [127](../course/v2/0127-json-and-xml.en.md).

## L

**`LIKE`**: the addition that declares a data object with the same type as another existing data object. Lesson [17](../course/v2/0017-types-and-like.en.md).

**Lock object**: the Dictionary object that generates the `ENQUEUE_*` and `DEQUEUE_*` function modules to stop two users from changing the same data at once. Lesson [51](../course/v2/0051-lock-objects.en.md).

**Loop**: a block of code that repeats: `DO`, `WHILE`, or `LOOP AT` over the rows of an internal table. Lessons [26](../course/v2/0026-do-and-while-loops.en.md), [38](../course/v2/0038-looping-internal-tables.en.md).

**LUW (Logical Unit of Work)**: a group of changes that is saved or undone as a whole. There are the database LUW and the SAP LUW. Lesson [60](../course/v2/0060-luw-commit-and-rollback.en.md).

## M

**Message**: a text shown to the user with `MESSAGE`, of type information, success, warning, error, or abort. Lesson [61](../course/v2/0061-messages.en.md).

**Message class**: the container of message texts, each identified by a three-digit number (transaction SE91). Lesson [61](../course/v2/0061-messages.en.md).

**Method**: a procedure that belongs to a class and works on its attributes; declared with `METHODS` and implemented between `METHOD` and `ENDMETHOD`. Lesson [77](../course/v2/0077-attributes-and-methods.en.md).

**Method parameter**: a value passed to or from a method: `IMPORTING`, `EXPORTING`, `CHANGING`, or `RETURNING`. Lesson [78](../course/v2/0078-method-parameters.en.md).

## N

**Nested structure**: a structure that contains other structures or tables as components. Lesson [32](../course/v2/0032-nested-structures.en.md).

**Number range**: the object that hands out unique sequential numbers, for example for document numbers (transaction SNRO). Lesson [111](../course/v2/0111-number-ranges.en.md).

**Numeric types**: the types for numbers: `i` and `int8` integers, `p` packed with fixed decimals, `decfloat16` and `decfloat34`, `f` binary floating point. Lesson [14](../course/v2/0014-numeric-types.en.md).

## O

**Object**: an instance of a class, with its own attribute values, reached through a reference variable. Lesson [76](../course/v2/0076-classes-and-objects.en.md).

**OData**: the REST protocol that SAP Fiori apps use to read and write data; in ABAP it is exposed with SAP Gateway or with RAP. Lessons [128](../course/v2/0128-odata-with-sap-gateway.en.md), [144](../course/v2/0144-rap-business-services.en.md).

**`ORDER BY`**: the SQL clause that sorts the results of a `SELECT`. Lesson [54](../course/v2/0054-where-and-order-by.en.md).

## P

**Package**: the container that groups development objects and sets their transport and visibility. Lesson [7](../course/v2/0007-packages-and-transport-requests.en.md).

**PAI, PBO**: the two phases of a Dynpro's flow logic: _Process Before Output_, before the screen is shown, and _Process After Input_, after the user acts. Lesson [102](../course/v2/0102-dynpro-flow-logic.en.md).

**Parallel processing**: running parts of a job in several processes at the same time, with asynchronous RFCs or background jobs. Lesson [114](../course/v2/0114-parallel-processing.en.md).

**`PARAMETERS`**: the statement that creates a single input field on a report's selection screen. Lesson [63](../course/v2/0063-parameters.en.md).

**Polymorphism**: the ability to call the same method on objects of different classes and get each class's own behavior. Lesson [85](../course/v2/0085-polymorphism-and-casting.en.md).

**Pretty printer**: the editor feature that reformats code: indentation and upper or lower case for keywords. Lesson [10](../course/v2/0010-comments-and-formatting.en.md).

**Primary key**: the set of fields that uniquely identifies a row, in a database table or an internal table. Lessons [35](../course/v2/0035-table-keys.en.md), [46](../course/v2/0046-database-tables.en.md).

**Projection (RAP)**: the layer of CDS views and behavior on top of the data model that decides what a specific service exposes. Lesson [144](../course/v2/0144-rap-business-services.en.md).

## R

**Range table**: a table with the columns `SIGN`, `OPTION`, `LOW`, and `HIGH` that describes a set of values, like the one behind `SELECT-OPTIONS`. Lesson [64](../course/v2/0064-select-options-and-ranges.en.md).

**RAP (RESTful Application Programming Model)**: SAP's modern programming model for building OData services and Fiori apps with CDS, behavior definitions, and EML. Lesson [139](../course/v2/0139-rap-overview.en.md).

**RAP data model**: the CDS views that describe the entities of a RAP business object and their parent-child relationships (_composition_). Lesson [140](../course/v2/0140-rap-data-model.en.md).

**`REDUCE`**: the expression that computes one value, such as a sum, by looping over a table with `FOR`. Lesson [93](../course/v2/0093-for-and-reduce.en.md).

**Regular expression**: a text pattern used with `FIND`, `REPLACE`, and `matches` to search and replace parts of strings. Lesson [96](../course/v2/0096-regular-expressions.en.md).

**Report**: an executable program (`REPORT`), usually with a selection screen and a list or ALV output. Lessons [8](../course/v2/0008-hello-world.en.md), [66](../course/v2/0066-report-events.en.md).

**Report event**: a block the runtime executes at a precise moment of a report: `INITIALIZATION`, `AT SELECTION-SCREEN`, `START-OF-SELECTION`, and others. Lesson [66](../course/v2/0066-report-events.en.md).

**REST**: the architectural style of web services based on resources and HTTP methods (`GET`, `POST`, `PUT`, `DELETE`). Lesson [126](../course/v2/0126-http-and-rest.en.md).

**RFC (Remote Function Call)**: calling a function module on another system, synchronously or asynchronously, through a destination (SM59). Lesson [124](../course/v2/0124-rfc.en.md).

**`ROLLBACK WORK`**: the statement that undoes all the changes of the SAP LUW not yet committed. Lesson [60](../course/v2/0060-luw-commit-and-rollback.en.md).

**RTTS (Runtime Type Services)**: the classes that describe a type at runtime (RTTI) and create new ones (RTTC), such as `CL_ABAP_TYPEDESCR`. Lesson [115](../course/v2/0115-rtts.en.md).

**Runtime error**: an error that occurs while the program runs, such as a division by zero, and produces a dump if not handled. Lesson [30](../course/v2/0030-runtime-errors.en.md).

## S

**SAP**: the German company that makes ERP business software, such as SAP ECC and SAP S/4HANA, that many companies run on. Lesson [1](../course/v2/0001-what-is-sap.en.md).

**SAP Gateway**: the component that exposes ABAP data and logic as OData services (transaction SEGW). Lesson [128](../course/v2/0128-odata-with-sap-gateway.en.md).

**SAP GUI**: the desktop program the user installs to log on to the SAP system and use transactions. Lesson [5](../course/v2/0005-sap-gui-and-transaction-codes.en.md).

**SAP HANA**: SAP's in-memory, column-store database, on which SAP S/4HANA and code pushdown run. Lesson [131](../course/v2/0131-code-pushdown.en.md).

**Search help**: the Dictionary object that offers the user the possible values of a field (the F4 key). Lesson [50](../course/v2/0050-search-helps.en.md).

**Secondary key**: an extra sorted or hashed key of an internal table, for fast reads by criteria other than the primary key. Lesson [35](../course/v2/0035-table-keys.en.md).

**`SELECT`**: the ABAP SQL statement that reads data from the database, into an internal table, a structure, or row by row. Lesson [52](../course/v2/0052-select-basics.en.md).

**`SELECT SINGLE`**: the variant of `SELECT` that reads at most one row, usually by the full key. Lesson [53](../course/v2/0053-select-single-and-up-to.en.md).

**`SELECT-OPTIONS`**: the statement that creates a selection screen field for intervals and lists of values, backed by a range table. Lesson [64](../course/v2/0064-select-options-and-ranges.en.md).

**Selection screen**: a report's input screen, built with `PARAMETERS`, `SELECT-OPTIONS`, and `SELECTION-SCREEN`. Lessons [63](../course/v2/0063-parameters.en.md), [65](../course/v2/0065-selection-screen-layout.en.md).

**Service binding**: the RAP object that publishes a service definition with a protocol, such as OData V2 or V4, for UI or API use. Lesson [144](../course/v2/0144-rap-business-services.en.md).

**Service definition**: the RAP object that lists the CDS entities a service exposes. Lesson [144](../course/v2/0144-rap-business-services.en.md).

**Shared object**: an object stored in the application server's shared memory and read by several programs and users. Lesson [149](../course/v2/0149-shared-objects.en.md).

**Short dump**: the common name of a runtime error that stops the program; analyzed with transaction ST22. Lesson [30](../course/v2/0030-runtime-errors.en.md).

**Sorted table**: an internal table always kept sorted by its key, with automatic binary search. Lesson [34](../course/v2/0034-table-categories.en.md).

**Standard table**: the most common kind of internal table: rows in insertion order, accessed by index or by linear search. Lesson [34](../course/v2/0034-table-categories.en.md).

**Static component**: a class attribute or method (`CLASS-DATA`, `CLASS-METHODS`) shared by all instances and used without creating an object. Lesson [81](../course/v2/0081-static-components.en.md).

**String template**: a string between vertical bars (`|...|`) with expressions in curly braces `{ }` and formatting options. Lesson [22](../course/v2/0022-string-templates.en.md).

**Structure**: a data object made of several fields (components) of different types, like a table row. Lessons [31](../course/v2/0031-structures.en.md), [48](../course/v2/0048-ddic-structures-and-table-types.en.md).

**Subquery**: a `SELECT` inside another `SELECT`, used for example with `IN` or `EXISTS` in the `WHERE` condition. Lesson [58](../course/v2/0058-subqueries-and-union.en.md).

**Subroutine**: the old way to modularize code with `FORM` and `PERFORM`; methods replace it today. Lesson [69](../course/v2/0069-includes-and-subroutines.en.md).

**`SWITCH`**: the expression that returns a value based on the value of one operand, like a `CASE` in a single expression. Lesson [92](../course/v2/0092-cond-and-switch.en.md).

**`sy-subrc`**: the return code of the last statement: `0` means success. Check it after `SELECT`, `READ TABLE`, and calls. Lesson [23](../course/v2/0023-system-fields.en.md).

**System field**: a field of the `sy` structure that the runtime fills automatically: `sy-subrc`, `sy-tabix`, `sy-datum`, `sy-uname`, and others. Lesson [23](../course/v2/0023-system-fields.en.md).

**System landscape**: a company's set of SAP systems, usually development, quality, and production, connected by transports. Lesson [4](../course/v2/0004-system-landscape-and-clients.en.md).

## T

**Table maintenance**: the generated screen for manually entering and editing a table's data, opened with SM30. Lesson [49](../course/v2/0049-views-and-table-maintenance.en.md).

**Table type**: the Dictionary object, or the `TYPES ... TABLE OF` declaration, that describes an internal table: row type, category, and key. Lesson [48](../course/v2/0048-ddic-structures-and-table-types.en.md).

**Test double**: a fake object that replaces a real dependency (database, API) during a test. Lesson [106](../course/v2/0106-test-doubles.en.md).

**Text symbol**: a program text (`TEXT-001`) stored separately and translatable into other languages. Lesson [62](../course/v2/0062-text-symbols-and-translation.en.md).

**Transaction code**: a code (for example SE38 or VA01) that opens a program or a function of the SAP system directly. Lesson [5](../course/v2/0005-sap-gui-and-transaction-codes.en.md).

**Transport request**: the container that records changes to objects and carries them from the development system to quality and production. Lesson [7](../course/v2/0007-packages-and-transport-requests.en.md).

**Type conversion**: turning a value of one type into another, either automatically by the conversion rules or explicitly with `CONV` and `EXACT`. Lesson [19](../course/v2/0019-type-conversions.en.md).

**`TYPES`**: the statement that defines a local data type, to use later with `TYPE`. Lesson [17](../course/v2/0017-types-and-like.en.md).

## U

**`UNION`**: the SQL operator that merges the rows of two `SELECT` statements into one result. Lesson [58](../course/v2/0058-subqueries-and-union.en.md).

**Unmanaged (RAP)**: the RAP scenario where you write the save logic yourself, usually to reuse existing code; with _additional save_ you add logic to a managed scenario. Lesson [147](../course/v2/0147-rap-unmanaged-and-save.en.md).

**Update function module**: a function module called `IN UPDATE TASK` that writes to the database only at `COMMIT WORK`, in a separate process. Lesson [113](../course/v2/0113-update-task.en.md).

**User exit**: an old extension point: an empty subroutine in standard code (often `USEREXIT_*`) where the customer adds their own code. Lesson [121](../course/v2/0121-user-exits-and-customer-exits.en.md).

## V

**Validation**: in RAP, a check on the data that blocks the save and returns a message if the values are not valid. Lesson [142](../course/v2/0142-rap-validations-determinations-actions.en.md).

**`VALUE`**: the constructor expression that builds structures and internal tables with their values in a single statement. Lesson [91](../course/v2/0091-constructor-expressions.en.md).

**Variable**: a named data object, declared with `DATA`, whose value can change at runtime. Lesson [12](../course/v2/0012-variables-and-constants.en.md).

**Variant**: a saved set of values for a selection screen, to reuse or to use in a background job. Lesson [68](../course/v2/0068-variants-and-background-jobs.en.md).

**View**: in the Dictionary, a view combines fields from several tables (database view) or is used to maintain them (maintenance view); CDS views are used today. Lesson [49](../course/v2/0049-views-and-table-maintenance.en.md).

**Visibility**: the `PUBLIC`, `PROTECTED`, and `PRIVATE` sections of a class, which decide who can use each component. Lesson [80](../course/v2/0080-visibility-and-encapsulation.en.md).

## W

**Watchpoint**: a debugger stop that fires when a variable's value changes or meets a condition. Lesson [29](../course/v2/0029-breakpoints-and-watchpoints.en.md).

**`WHERE`**: the clause that filters rows in a `SELECT`, a `LOOP AT`, or a `DELETE`. Lesson [54](../course/v2/0054-where-and-order-by.en.md).

**Work process**: an application server process that runs user requests: dialog, background, update, enqueue, spool. Lesson [3](../course/v2/0003-sap-system-architecture.en.md).

**`WRITE`**: the statement that prints text and values on a classic list. Lesson [11](../course/v2/0011-output-with-write.en.md).

**Writing to the database**: the `INSERT`, `UPDATE`, `MODIFY`, and `DELETE` statements that change the data of database tables. Lesson [59](../course/v2/0059-writing-to-the-database.en.md).

## X

**XML**: the markup format for data exchange; in ABAP you read and build it with `CALL TRANSFORMATION` and the iXML library. Lesson [127](../course/v2/0127-json-and-xml.en.md).

**`xsdbool`**: the function that turns a logical expression into `abap_true` or `abap_false`. Lesson [16](../course/v2/0016-boolean-values.en.md).
