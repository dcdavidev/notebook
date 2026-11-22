---
description: A complete, self-paced ABAP course in 152 short lessons, from your first program to RAP and ABAP Cloud.
tags:
  - SAP
  - ABAP
  - SAP HANA
  - SAP S/4HANA
  - CDS
  - RAP
  - ABAP Cloud
---

# ABAP

A complete ABAP course, from your first program to Fiori apps with RAP and ABAP Cloud. Each lesson covers **one topic**: read it, try the code, do the exercise, and move on to the next one.

## Who it's for

- People who don't know SAP and want to learn ABAP from scratch.
- ABAP developers who know classic ABAP and want to move to modern ABAP, CDS, and RAP.
- Functional consultants who want to read and understand custom code.
- Anyone who already knows ABAP and needs a quick reference on a specific topic.

You don't need to know SAP. Some programming experience helps, but it isn't required.

## How it works

The course is **self-paced**: there are no days, hours, or deadlines. Each lesson is short and takes one sitting. You can follow them all in order, or jump straight to the topic you need.

The lessons are split into **4 levels**:

| Level        | Lessons | What you learn                                                                                                  |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| Beginner     | 1–30    | the SAP system, the tools, the syntax, data types, strings, control flow, and the debugger                      |
| Basic        | 31–74   | structures and internal tables, the ABAP Dictionary, ABAP SQL, reports, function modules, and files             |
| Intermediate | 75–119  | object-oriented programming, exceptions, modern ABAP, ALV and Dynpro, tests, performance, and system techniques |
| Pro          | 120–152 | enhancements, integration, SAP HANA and CDS, RAP, ABAP Cloud, and the final project                             |

Every lesson has the same structure:

1. **Introduction**: what you learn and why it matters.
2. **Explanation**: the topic step by step, with code examples.
3. **Exercise**: a small task to do on a real system.
4. **Summary**: the points to remember.

Along the way you'll find these boxes:

> [!TIP]
> An **analogy** that links a new idea to something you already know.

> [!WARNING]
> A **warning** about a common mistake or a risk.

> [!IMPORTANT]
> The lesson's **exercise**.

> [!NOTE]
> The **summary** at the end of each lesson.

## Table of contents

### Beginner

1. [What is SAP](./0001-what-is-sap.md): the company, its ERP products, and why businesses run on them.
2. [What is ABAP](./0002-what-is-abap.md): the language of SAP systems: where it runs and what you build with it.
3. [The architecture of an SAP system](./0003-sap-system-architecture.md): presentation, application, and database layers, work processes, and instances.
4. [System landscape and clients](./0004-system-landscape-and-clients.md): development, quality, and production systems, and what a client is.
5. [SAP GUI and transaction codes](./0005-sap-gui-and-transaction-codes.md): log on, move around, and open the transactions a developer uses every day.
6. [ABAP Development Tools in Eclipse](./0006-abap-development-tools.md): install ADT, connect to a system, and find your way around the IDE.
7. [Packages and transport requests](./0007-packages-and-transport-requests.md): where your objects live and how they travel from development to production.
8. [Your first program](./0008-hello-world.md): create, check, activate, and run a report that says hello.
9. [ABAP syntax rules](./0009-syntax-rules.md): statements, periods, keywords, chained statements, and naming.
10. [Comments and formatting](./0010-comments-and-formatting.md): line and end-of-line comments, the pretty printer, and readable code.
11. [Output with WRITE](./0011-output-with-write.md): print text and values on a classic list, with positions and formats.
12. [Variables and constants](./0012-variables-and-constants.md): declare data objects with DATA and CONSTANTS, and use literals.
13. [Character types: c, n, string](./0013-character-types.md): fixed-length text, numeric text, and strings of any length.
14. [Numeric types](./0014-numeric-types.md): integers, packed numbers, decimal floating point, and binary floating point.
15. [Date and time types](./0015-date-and-time-types.md): dates, times, time stamps, and calculations with them.
16. [Boolean values](./0016-boolean-values.md): abap_bool, abap_true, abap_false, and xsdbool.
17. [Defining types with TYPES and LIKE](./0017-types-and-like.md): your own types, references to Dictionary types, and LIKE.
18. [Inline declarations](./0018-inline-declarations.md): DATA(...) and FINAL(...): declare a variable where you first fill it.
19. [Type conversions](./0019-type-conversions.md): what happens when you assign a value to a variable of another type.
20. [Arithmetic operations](./0020-arithmetic-operations.md): operators, DIV and MOD, rounding, and numeric functions.
21. [Working with strings](./0021-working-with-strings.md): concatenate, split, measure, shift, and convert the case of text.
22. [String templates](./0022-string-templates.md): build text with embedded expressions and formatting options.
23. [System fields](./0023-system-fields.md): sy-subrc, sy-datum, sy-uname, and the other fields the runtime fills.
24. [IF and logical expressions](./0024-if-and-logical-expressions.md): comparisons, AND, OR, NOT, and predicates such as IS INITIAL.
25. [CASE](./0025-case.md): choose one branch out of many by comparing a single value.
26. [DO and WHILE loops](./0026-do-and-while-loops.md): repeat code a fixed number of times or while a condition holds.
27. [EXIT, CONTINUE, and CHECK](./0027-exit-continue-check.md): leave a loop or skip to the next pass.
28. [The debugger: first steps](./0028-debugger-basics.md): start the debugger, step through code, and inspect variables.
29. [Breakpoints and watchpoints](./0029-breakpoints-and-watchpoints.md): stop the program exactly where and when you want.
30. [Runtime errors and ST22](./0030-runtime-errors.md): read a short dump and find the cause of a crash.

### Basic

31. [Structures](./0031-structures.md): group related fields into one data object.
32. [Nested structures and includes](./0032-nested-structures.md): structures inside structures, and INCLUDE TYPE.
33. [What is an internal table](./0033-internal-tables-intro.md): lists of rows in memory: the most used tool in ABAP.
34. [Standard, sorted, and hashed tables](./0034-table-categories.md): the three table categories and when to use each one.
35. [Primary and secondary table keys](./0035-table-keys.md): unique and non-unique keys, empty keys, and secondary keys.
36. [Filling internal tables](./0036-filling-internal-tables.md): APPEND, INSERT, VALUE, and BASE.
37. [Reading single rows](./0037-reading-internal-tables.md): READ TABLE, table expressions, line_exists, and line_index.
38. [Looping over internal tables](./0038-looping-internal-tables.md): LOOP AT with WHERE, FROM, TO, and the control level statements.
39. [Changing and deleting rows](./0039-changing-and-deleting-rows.md): MODIFY, DELETE, and CLEAR, FREE, REFRESH on whole tables.
40. [Sorting, summing, and removing duplicates](./0040-sorting-and-duplicates.md): SORT, DELETE ADJACENT DUPLICATES, and COLLECT.
41. [Field symbols](./0041-field-symbols.md): work directly on a row or a variable without copying it.
42. [Data references](./0042-data-references.md): REF TO, GET REFERENCE, the dereference operator, and REFERENCE INTO.
43. [The ABAP Dictionary](./0043-abap-dictionary-intro.md): the central catalog of types and database objects.
44. [Domains](./0044-domains.md): technical type, length, value ranges, and conversion routines.
45. [Data elements](./0045-data-elements.md): business meaning, field labels, and documentation of a field.
46. [Database tables](./0046-database-tables.md): create a transparent table with fields, keys, and technical settings.
47. [Foreign keys and check tables](./0047-foreign-keys-and-check-tables.md): link tables and check input values against them.
48. [Structures and table types in the Dictionary](./0048-ddic-structures-and-table-types.md): global types that every program can reuse.
49. [Views and table maintenance](./0049-views-and-table-maintenance.md): database views, maintenance views, and SM30.
50. [Search helps](./0050-search-helps.md): the F4 help: elementary and collective search helps.
51. [Lock objects](./0051-lock-objects.md): the SAP lock concept, ENQUEUE and DEQUEUE.
52. [Reading data with SELECT](./0052-select-basics.md): your first ABAP SQL queries: fields, INTO, and sy-subrc.
53. [SELECT SINGLE and UP TO n ROWS](./0053-select-single-and-up-to.md): read one row, or only the first rows.
54. [WHERE and ORDER BY](./0054-where-and-order-by.md): filter and sort the rows the database returns.
55. [Joins](./0055-joins.md): INNER JOIN and LEFT OUTER JOIN across several tables.
56. [Aggregates, GROUP BY, and HAVING](./0056-aggregates-and-group-by.md): COUNT, SUM, AVG, MIN, MAX, and grouped results.
57. [FOR ALL ENTRIES](./0057-for-all-entries.md): read rows that match the contents of an internal table.
58. [Subqueries and UNION](./0058-subqueries-and-union.md): EXISTS, IN with a subquery, and combining result sets.
59. [Writing data: INSERT, UPDATE, MODIFY, DELETE](./0059-writing-to-the-database.md): change the contents of database tables.
60. [The LUW: COMMIT and ROLLBACK](./0060-luw-commit-and-rollback.md): database LUW, SAP LUW, and keeping data consistent.
61. [Messages](./0061-messages.md): message classes, message types, and the MESSAGE statement.
62. [Text symbols and translation](./0062-text-symbols-and-translation.md): keep texts out of the code and translate them.
63. [Selection screens: PARAMETERS](./0063-parameters.md): input fields, checkboxes, radio buttons, and list boxes.
64. [SELECT-OPTIONS and ranges](./0064-select-options-and-ranges.md): let the user enter intervals and lists of values.
65. [Selection screen layout](./0065-selection-screen-layout.md): blocks, frames, comments, and dynamic screen changes.
66. [Report events](./0066-report-events.md): INITIALIZATION, AT SELECTION-SCREEN, START-OF-SELECTION, and more.
67. [Interactive lists](./0067-interactive-lists.md): TOP-OF-PAGE, AT LINE-SELECTION, HIDE, and detail lists.
68. [Variants and background jobs](./0068-variants-and-background-jobs.md): save input values and schedule programs with SM36 and SM37.
69. [Includes and subroutines](./0069-includes-and-subroutines.md): split a program into files, and read FORM and PERFORM in legacy code.
70. [Function modules](./0070-function-modules.md): function groups, interfaces, exceptions, and SE37.
71. [BAPIs](./0071-bapis.md): call standard business APIs and handle BAPIRET2.
72. [Calling programs, SAP memory, and ABAP memory](./0072-calling-programs-and-memory.md): SUBMIT, CALL TRANSACTION, SET/GET PARAMETER, EXPORT/IMPORT.
73. [Files on the user's PC](./0073-files-on-the-presentation-server.md): upload and download files through SAP GUI.
74. [Files on the application server](./0074-files-on-the-application-server.md): OPEN DATASET, TRANSFER, READ DATASET, and AL11.

### Intermediate

75. [Why object-oriented programming](./0075-why-object-oriented.md): from procedures to objects: what changes and why it helps.
76. [Classes and objects](./0076-classes-and-objects.md): local classes, DEFINITION and IMPLEMENTATION, NEW, and references.
77. [Attributes and methods](./0077-attributes-and-methods.md): data and behavior of an object, and the self-reference me.
78. [Method parameters](./0078-method-parameters.md): IMPORTING, EXPORTING, CHANGING, RETURNING, and functional calls.
79. [Constructors](./0079-constructors.md): instance and static constructors.
80. [Visibility and encapsulation](./0080-visibility-and-encapsulation.md): PUBLIC, PROTECTED, PRIVATE, READ-ONLY, and friends.
81. [Static components](./0081-static-components.md): CLASS-DATA, CLASS-METHODS, and the => operator.
82. [Inheritance](./0082-inheritance.md): subclasses, REDEFINITION, and super.
83. [Abstract and final classes](./0083-abstract-and-final.md): classes you can't instantiate and classes you can't extend.
84. [Interfaces](./0084-interfaces.md): contracts that unrelated classes can implement.
85. [Polymorphism and casting](./0085-polymorphism-and-casting.md): one call, many behaviors; up casts, down casts, and IS INSTANCE OF.
86. [Events](./0086-events.md): EVENTS, RAISE EVENT, and SET HANDLER.
87. [Global classes](./0087-global-classes.md): create reusable classes in ADT and SE24, with local test and helper classes.
88. [Design patterns](./0088-design-patterns.md): singleton, factory, and strategy in ABAP.
89. [Class-based exceptions](./0089-class-based-exceptions.md): TRY, CATCH, CLEANUP, RAISE EXCEPTION, and the exception hierarchy.
90. [Custom exception classes](./0090-custom-exception-classes.md): your own exceptions with message texts, attributes, and RETRY and RESUME.
91. [Constructor expressions](./0091-constructor-expressions.md): VALUE, NEW, CONV, CAST, REF, EXACT, and LET.
92. [COND and SWITCH](./0092-cond-and-switch.md): conditional expressions that return a value.
93. [FOR and REDUCE](./0093-for-and-reduce.md): build and summarize tables in a single expression.
94. [FILTER and CORRESPONDING](./0094-filter-and-corresponding.md): filter tables by key and map fields between structures.
95. [Grouping internal tables](./0095-grouping-internal-tables.md): LOOP AT ... GROUP BY and LOOP AT GROUP.
96. [FIND, REPLACE, and regular expressions](./0096-regular-expressions.md): search and change text with patterns.
97. [Modern ABAP SQL](./0097-modern-abap-sql.md): host variables, inline declarations, SQL expressions, and CASE.
98. [Advanced ABAP SQL](./0098-advanced-abap-sql.md): common table expressions, window functions, and SELECT from internal tables.
99. [ALV with CL_SALV_TABLE](./0099-alv-with-salv.md): show any internal table as a professional grid in a few lines.
100.  [The ALV grid control](./0100-alv-grid-control.md): CL_GUI_ALV_GRID, field catalog, layout, events, and editable cells.
101.  [Classic screens (Dynpro)](./0101-dynpro-basics.md): screen Painter, dialog programs, and transaction codes.
102.  [Flow logic: PBO and PAI](./0102-dynpro-flow-logic.md): modules, OK codes, and the round trip between screen and program.
103.  [Input checks on screens](./0103-dynpro-input-checks.md): FIELD, CHAIN, error messages, and exit commands.
104.  [GUI status, titles, and popups](./0104-gui-status-and-popups.md): menus, toolbars, function keys, and confirmation dialogs.
105.  [ABAP Unit](./0105-abap-unit-basics.md): write and run automated tests for your classes.
106.  [Test doubles and dependency injection](./0106-test-doubles.md): isolate the code under test from the database and other classes.
107.  [Code quality: ATC and Clean ABAP](./0107-code-quality.md): static checks, the ABAP Test Cockpit, and the Clean ABAP style guide.
108.  [Performance analysis](./0108-performance-analysis.md): SQL trace (ST05) and runtime analysis (SAT).
109.  [Writing fast ABAP](./0109-performance-best-practices.md): the rules that make programs fast on the database and in memory.
110.  [Authorization checks](./0110-authorization-checks.md): authorization objects, AUTHORITY-CHECK, and roles.
111.  [Number ranges](./0111-number-ranges.md): generate unique document numbers with SNRO.
112.  [The application log](./0112-application-log.md): collect and show messages with the BAL function modules and SLG1.
113.  [Update function modules](./0113-update-task.md): CALL FUNCTION IN UPDATE TASK, PERFORM ON COMMIT, and SM13.
114.  [Parallel and background processing](./0114-parallel-processing.md): asynchronous RFC, bgRFC, and the background processing framework.
115.  [Runtime type services (RTTS)](./0115-rtts.md): describe and create types while the program runs.
116.  [Dynamic data objects](./0116-dynamic-data.md): CREATE DATA, ASSIGN COMPONENT, and generic types.
117.  [Dynamic SQL and dynamic calls](./0117-dynamic-sql-and-calls.md): build queries and call methods whose names you know only at runtime.
118.  [Change documents](./0118-change-documents.md): record who changed what and when, with SCDO.
119.  [Sending email](./0119-sending-email.md): send messages and attachments with CL_BCS and SOST.

### Pro

120. [Extending standard SAP](./0120-extending-standard-sap.md): modifications, exits, BAdIs, and the enhancement framework at a glance.
121. [User exits and customer exits](./0121-user-exits-and-customer-exits.md): the oldest extension techniques, still found in every system.
122. [BAdIs](./0122-badis.md): find, implement, and filter Business Add-Ins.
123. [Implicit and explicit enhancements](./0123-enhancement-points.md): add code at enhancement points and sections of standard programs.
124. [Remote function calls (RFC)](./0124-rfc.md): call function modules in other systems: synchronous, asynchronous, and destinations.
125. [IDocs and ALE](./0125-idoc-and-ale.md): exchange business documents between systems.
126. [HTTP clients and REST services](./0126-http-and-rest.md): call external APIs and expose your own HTTP endpoints.
127. [JSON and XML](./0127-json-and-xml.md): serialize and parse data with CALL TRANSFORMATION and XCO.
128. [OData with SAP Gateway](./0128-odata-with-sap-gateway.md): build an OData V2 service with SEGW.
129. [Smart Forms and Adobe forms](./0129-forms.md): print invoices, labels, and other documents.
130. [Batch input](./0130-batch-input.md): fill transactions automatically with BDC and SHDB.
131. [ABAP on SAP HANA and code pushdown](./0131-code-pushdown.md): move data-intensive logic from the application server to the database.
132. [CDS view entities](./0132-cds-view-entities.md): define data models in the database with Core Data Services.
133. [CDS associations](./0133-cds-associations.md): relationships between entities, path expressions, and exposure.
134. [CDS annotations](./0134-cds-annotations.md): metadata for semantics, UI, analytics, and search.
135. [CDS expressions, functions, and parameters](./0135-cds-expressions-and-parameters.md): CASE, casts, built-in functions, aggregates, and input parameters.
136. [CDS access control](./0136-cds-access-control.md): restrict rows with DCL roles and authorization objects.
137. [ABAP Managed Database Procedures](./0137-amdp.md): write SQLScript inside ABAP classes.
138. [CDS table functions](./0138-cds-table-functions.md): use an AMDP as the data source of a CDS entity.
139. [The RESTful Application Programming Model](./0139-rap-overview.md): the architecture of RAP and the objects that make up a RAP app.
140. [The RAP data model](./0140-rap-data-model.md): database tables, root and child entities, and compositions.
141. [The behavior definition](./0141-rap-behavior-definition.md): managed implementation, operations, field controls, and locking.
142. [Validations, determinations, and actions](./0142-rap-validations-determinations-actions.md): business logic in the behavior pool.
143. [The Entity Manipulation Language](./0143-eml.md): READ ENTITIES, MODIFY ENTITIES, and COMMIT ENTITIES.
144. [Projections, service definitions, and bindings](./0144-rap-business-services.md): expose a RAP business object as an OData service.
145. [Fiori elements apps from annotations](./0145-rap-fiori-elements.md): build the UI with metadata extensions and preview it.
146. [Draft handling](./0146-rap-draft.md): let users save their work before it's complete.
147. [Unmanaged scenarios and additional save](./0147-rap-unmanaged-and-save.md): reuse existing code and BAPIs inside RAP.
148. [ABAP Cloud and clean core](./0148-abap-cloud.md): released APIs, language versions, the tier model, and the XCO library.
149. [Shared objects](./0149-shared-objects.md): share data between programs through shared memory.
150. [ABAP channels](./0150-abap-channels.md): push messages with ABAP Messaging Channels and ABAP Push Channels.
151. [abapGit and version control](./0151-abapgit.md): keep ABAP code in Git repositories.
152. [Final project](./0152-final-project.md): build a complete app that uses what you learned in every level.

## What you need

- **An SAP system to practice on.** Any of these works:
  - a company sandbox or development system, with a developer key;
  - an SAP BTP trial account with the ABAP Environment (free; ABAP Cloud only, so some classic topics such as Dynpro screens and `WRITE` lists aren't available there);
  - the ABAP Platform developer edition, if you can install it.
- **The tools**: SAP GUI for classic transactions, and Eclipse with the ABAP Development Tools (ADT) for modern development, CDS, and RAP.
- **Sample data**: the examples use SAP's flight model (tables `SCARR`, `SPFLI`, `SFLIGHT`, `SBOOK`). If your system has no data, generate it with the report `SAPBC_DATA_GENERATOR`.

## How to study

- If you're starting from zero, follow the lessons in order: each one builds on the previous ones.
- If you already know a level, skip to the next one and come back only when you need to.
- Type the code by hand instead of copying it, and run it in the debugger.
- Do the exercise before you move on to the next lesson.
- At the end, build the [final project](./0152-final-project.md).

## This edition

This is the **2026.11** edition of the course: 152 lessons, one per topic, at your own pace, in 4 levels, from the basics of the SAP system to ABAP channels and abapGit. The [glossary](../glossary/README.md) explains the terms of the course, with a link to the lesson of each one.

The examples are based on SAP S/4HANA and ABAP 7.5x, with the ABAP Cloud model in the pro level. Organizational codes, numbers, and names in the examples (company codes, sales organizations, material numbers) are samples: they depend on your system's customizing.

Found a mistake or want to improve a lesson? Every page has an "Edit this page on GitHub" link. Read the [content guide](https://github.com/dcdavidev/notebook/blob/main/learning-materials/README.md) to learn how lessons are written.
