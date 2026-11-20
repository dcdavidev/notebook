---
description: A 15-day intensive course on SAP and ABAP, from the basics to ABAP Cloud and RAP.
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

An intensive course that takes you from zero to building a complete Fiori app on SAP S/4HANA. Every lesson explains one topic step by step, with everyday analogies, real code, exercises, a quiz, and the solutions.

## Who it is for

- Developers who are new to SAP and want to learn ABAP from the basics.
- ABAP developers who know classic ABAP and want to move to modern ABAP, CDS, and RAP.
- Functional consultants who want to read and understand custom code.

You don't need to know SAP. Some general programming experience helps, but it isn't required.

## How the course is organized

The course lasts **15 days**, split into **3 weeks**. Each day is a lesson of about **4 hours**, divided into 4 one-hour blocks.

| Week   | Level        | Lessons | What you learn                                                                         |
| ------ | ------------ | ------- | -------------------------------------------------------------------------------------- |
| Week 1 | Beginner     | 1–5     | the SAP system, ABAP syntax, data types, control flow, the Dictionary, internal tables |
| Week 2 | Intermediate | 6–10    | ABAP SQL, modularization, reports, ALV and Dynpro, object-oriented programming         |
| Week 3 | Advanced     | 11–15   | exceptions, modern ABAP and tests, enhancements and interfaces, HANA and CDS, RAP      |

Every lesson has the same structure:

1. **Today's schedule**: the four blocks of the day.
2. **Hour 1–4**: the explanation, with code examples.
3. **Exercises**: practice to do on a real system.
4. **Quiz**: questions to check what you remember.
5. **Solutions**: the code of the main exercises and the answers to the quiz.
6. **Summary**: what you learned and what comes next.

Along the way you'll find these boxes:

> [!TIP]
> An **analogy** that links a new idea to something you already know.

> [!WARNING]
> A **warning** about a common mistake or a risk.

> [!IMPORTANT]
> The **exercises** of the day.

> [!NOTE]
> The **summary** at the end of each lesson.

## Table of contents

### Week 1 – Beginner

1. [Welcome to the world of SAP and ABAP](./0001-welcome-to-sap-and-abap.en.md): what SAP is, where ABAP lives, and how to write your first program.
2. [Variables, data types, and operations](./0002-variables-data-types-and-operations.en.md): how ABAP stores numbers, texts, and dates, and how it transforms them.
3. [Decisions, loops, and the debugger](./0003-decisions-loops-and-the-debugger.en.md): how a program chooses what to do and how it repeats operations.
4. [The ABAP Dictionary (SE11)](./0004-the-abap-dictionary-se11.en.md): domains, data elements, tables, structures, views, and search helps.
5. [Internal tables](./0005-internal-tables.en.md): the most used tool in ABAP, lists of data in memory.

### Week 2 – Intermediate

6. [Reading and writing the database: ABAP SQL](./0006-reading-and-writing-the-database-with-abap-sql.en.md): `SELECT`, `JOIN`, aggregations, `INSERT`, `UPDATE`, `DELETE`, `COMMIT`, and the LUW.
7. [Modularization: splitting code into blocks](./0007-modularization.en.md): includes, subroutines, function modules, BAPIs, SAP memory, and ABAP memory.
8. [Complete reports: selection, events, messages, files](./0008-complete-reports.en.md): everything you need to build a real SAP report.
9. [ALV and classic screens (Dynpro)](./0009-alv-and-classic-dynpro-screens.en.md): show data in professional grids and build dialog transactions.
10. [Object-oriented programming (ABAP Objects)](./0010-object-oriented-programming-abap-objects.en.md): classes, objects, methods, inheritance, interfaces, and polymorphism.

### Week 3 – Advanced

11. [Exceptions, design patterns, and dynamic programming](./0011-exceptions-design-patterns-and-dynamic-programming.en.md): handle errors professionally and write code that adapts at runtime.
12. [Modern ABAP and automated tests](./0012-modern-abap-and-automated-tests.en.md): 7.4/7.5x expressions, grouping, ABAP Unit, test doubles, and code quality.
13. [Enhancements, interfaces, forms, and system techniques](./0013-enhancements-interfaces-forms-and-system-techniques.en.md): extend the SAP standard, exchange data with other systems, and produce documents.
14. [ABAP on SAP HANA and CDS views](./0014-abap-on-sap-hana-and-cds-views.en.md): code pushdown, Core Data Services, access control, AMDP, and performance analysis.
15. [RAP, ABAP Cloud, and your future as a developer](./0015-rap-abap-cloud-and-your-future.en.md): build a complete Fiori app with the RESTful Application Programming Model.

## What you need

- **An SAP system to practice on.** Any of these works:
  - a company sandbox or development system, with a developer key;
  - an SAP BTP trial account with ABAP Environment (free; ABAP Cloud only, so some classic topics such as Dynpro and `WRITE` lists aren't available there);
  - the ABAP Platform developer edition, if you can run it.
- **The tools**: SAP GUI for classic transactions, and Eclipse with ABAP Development Tools (ADT) for modern development, CDS, and RAP.
- **Sample data**: the examples use the SAP flight model (tables `SCARR`, `SPFLI`, `SFLIGHT`, `SBOOK`). If your system has no data, generate it with the report `SAPBC_DATA_GENERATOR`.

## How to study

- Follow the lessons in order: each one builds on the previous ones.
- Type the code yourself instead of copying it, and run it in the debugger.
- Do the exercises before you look at the solutions.
- At the end, build the final project described in lesson 15.

## About this version

This is **v1** of the course. The examples are based on SAP S/4HANA and ABAP releases 7.5x, with the ABAP Cloud model for the last lessons. Organizational codes, numbers, and names in the examples (company codes, sales organizations, material numbers) are samples: they depend on your system's customizing.

Found an error or want to improve a lesson? Every page has an "Edit this page on GitHub" link. See the [content guide](https://github.com/dcdavidev/notebook/blob/main/learning-materials/README.md) for how lessons are written.
