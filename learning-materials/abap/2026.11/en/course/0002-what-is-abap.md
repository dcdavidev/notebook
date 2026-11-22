---
title: What is ABAP
description: 'The language of SAP systems: where it runs and what you build with it.'
---

_Beginner level_

**ABAP** is SAP's own programming language. Most of the ERP you met in [What is SAP](./0001-what-is-sap.md) is written in it, and so is almost every custom extension that companies add to their systems. If you want to read, fix, or extend SAP code, ABAP is the language you need.

This lesson explains where ABAP comes from, where your code actually runs, and what kinds of things you'll build with it.

## A short history

ABAP was born in the early 1980s as a report language. The name first meant _Allgemeiner Berichts-Aufbereitungs-Prozessor_ ("generic report preparation processor"); later it became **Advanced Business Application Programming**.

Over the years the language grew in steps:

| Stage        | What it added                                                             |
| ------------ | ------------------------------------------------------------------------- |
| Classic ABAP | reports, screens (Dynpro), function modules, Open SQL                     |
| ABAP Objects | classes, interfaces, and events (late 1990s, releases 4.5 and 4.6)        |
| Modern ABAP  | expressions, inline declarations, CDS views (7.40 and 7.50, from 2013)    |
| ABAP Cloud   | a restricted, cloud-ready language version with released APIs (from 2019) |

SAP never throws old syntax away. A program written in 1998 usually still runs today, so you'll read old and new styles side by side in the same system.

## Where ABAP runs

ABAP code doesn't run on your PC. It runs on the **ABAP application server** (AS ABAP), inside the SAP system. Your PC only shows the screens and sends your input.

- **The code lives in the database.** Programs, classes, and tables are stored in the system's own database, in a part called the **repository**. There are no source files on disk.
- **The system compiles it for you.** When you activate a program, the system generates a compiled version (the **load**) and runs that.
- **The database is hidden behind ABAP SQL.** You write queries in **ABAP SQL**, and the system translates them for the database underneath, whether it's SAP HANA, Oracle, or another one.
- **The development tools are in the system too.** You edit code in the ABAP Workbench in SAP GUI or in Eclipse with ADT, always connected to a running system.

You'll see how these pieces fit together in [The architecture of an SAP system](./0003-sap-system-architecture.md).

> [!TIP]
> Most languages are like cooking at home: you buy the ingredients, cook on your own stove, and serve the dish yourself. ABAP is like cooking in a restaurant's kitchen: the stove, the pantry, and the recipes all belong to the restaurant, and you come in to cook there. You never take the kitchen home.

## What ABAP looks like

ABAP reads almost like English. Statements start with a keyword and end with a period:

```abap
REPORT zdemo_first_look.

DATA lv_carrier TYPE s_carr_id VALUE 'LH'.

SELECT SINGLE carrname
  FROM scarr
  WHERE carrid = @lv_carrier
  INTO @DATA(lv_name).

WRITE lv_name.   " prints the name of the airline, for example Lufthansa
```

In a few lines this program declares a variable, reads a row from the database table `SCARR` (the airlines of SAP's flight model), and prints a value. Notice how close the database is: there's no driver to load and no connection to open. You'll learn every piece of this code in the lessons to come.

## What you build with ABAP

As an ABAP developer you'll build, fix, and extend things like:

- **Reports**: programs that read data and show it as a list or a grid.
- **Classes and function modules**: reusable business logic.
- **Dictionary objects**: database tables, data types, and views.
- **Interfaces**: data exchange with other systems through files, RFC, IDocs, or HTTP and OData services.
- **Forms**: invoices, delivery notes, and labels to print or send.
- **Enhancements**: your own code plugged into SAP standard processes without changing them.
- **CDS views and RAP business objects**: the data models and services behind modern Fiori apps.

> [!WARNING]
> ABAP is not the same as "SAP programming" in general. SAP systems also use SQLScript on SAP HANA, JavaScript for Fiori front ends (SAPUI5), and Java or Node.js on SAP BTP. ABAP is the language of the application server, and that's where most custom business logic lives.

## Exercise

> [!IMPORTANT]
>
> 1. Read the example program above and write in your own words what each statement does.
> 2. Look at the list of things you build with ABAP and pick the two you think a company asks for most often. Why?

### Solution

1. `REPORT` names the program. `DATA` declares a variable that holds an airline code, with the starting value `LH`. `SELECT SINGLE` reads the name of that airline from table `SCARR` into a new variable. `WRITE` prints the name on the screen.
2. There's no single right answer. In most companies, reports and interfaces are the most common requests: every department needs its own lists, and every SAP system talks to other systems.

> [!NOTE]
>
> - ABAP is SAP's programming language; most of the ERP is written in it.
> - It runs on the ABAP application server, not on your PC; the code is stored in the system's database.
> - ABAP SQL hides the differences between databases.
> - Old and new syntax live side by side, because SAP keeps old code running.
> - With ABAP you build reports, classes, Dictionary objects, interfaces, forms, enhancements, CDS views, and RAP apps.
