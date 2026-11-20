---
title: Welcome to the world of SAP and ABAP
description: What SAP is, where ABAP lives, and how to write your first program.
---

_Week 1 · Beginner level · 4 hours_

## How to use this course

The course lasts **3 weeks**, 5 days a week, 4 hours a day (60 hours in total). Each day is a lesson like this one.

| Week | Level        | Main topics                                                                          |
| ---- | ------------ | ------------------------------------------------------------------------------------ |
| 1    | Beginner     | SAP, syntax, data types, flow control, ABAP Dictionary, internal tables              |
| 2    | Intermediate | SQL, modularization, reports, screens, ALV, object-oriented programming              |
| 3    | Advanced     | Exceptions, modern ABAP, tests, enhancements, interfaces, CDS, HANA, RAP, ABAP Cloud |

Each day is split into 4 blocks of about 50 minutes, with a 10-minute break between blocks. At the end you find exercises, a quiz, and the solutions.

> [!NOTE]
> The golden rule of this course: don't just read. Type every line of code by hand in your system, run it, change it, break it, and see what happens. You learn by programming, not by reading.

### Today's schedule

| Block  | Content                                                                                 |
| ------ | --------------------------------------------------------------------------------------- |
| Hour 1 | What SAP is, what an ERP is, what ABAP is                                               |
| Hour 2 | The architecture of an SAP system: layers, systems, clients, transports                 |
| Hour 3 | The tools: SAP GUI, transactions, SE80, SE38, Eclipse ADT. How to get a practice system |
| Hour 4 | Your first program, the syntax rules, exercises                                         |

## Hour 1 – What SAP is and what ABAP is

### SAP, the company and the software

SAP is a German company founded in 1972. It makes business management software. Its best-known product today is **SAP S/4HANA**; the previous version, still very widely used, is **SAP ECC** (or R/3).

### What an ERP is

ERP stands for _Enterprise Resource Planning_: a single piece of software that runs every activity of a company. Purchasing, sales, warehouse, accounting, production, staff: all in one system and one database.

> [!TIP]
> Picture a company as a large restaurant. Someone orders the ingredients (purchasing), someone stores them in the pantry (warehouse), someone cooks (production), someone serves the tables (sales), and someone does the accounts at the end of the day (accounting). Without an ERP, everyone keeps their own notebook and the numbers never match. With an ERP there is one giant board that everyone reads and updates: when the waiter sells a dish, the pantry immediately knows ingredients are missing and accounting immediately records the payment.

The main SAP modules have abbreviations you will hear often:

| Abbreviation | Name                            | What it handles                     |
| ------------ | ------------------------------- | ----------------------------------- |
| FI           | Financial Accounting            | General ledger, customers, vendors  |
| CO           | Controlling                     | Management accounting, cost centers |
| SD           | Sales and Distribution          | Sales, customer orders, invoices    |
| MM           | Materials Management            | Purchasing, warehouse, materials    |
| PP           | Production Planning             | Production planning                 |
| HR / HCM     | Human Capital Management        | Staff, payroll                      |
| PM           | Plant Maintenance               | Plant maintenance                   |
| QM           | Quality Management              | Quality control                     |
| WM / EWM     | (Extended) Warehouse Management | Detailed warehouse management       |

### What ABAP is

**ABAP** (_Advanced Business Application Programming_) is the programming language most of SAP is written in. With ABAP you can:

- create new reports (programs that read data and display it),
- create new transactions and screens,
- extend SAP's standard behavior (enhancements),
- exchange data with other systems (interfaces),
- create print forms (invoices, delivery notes),
- create services for Fiori web apps.

ABAP features to know from the start:

- It is a language **designed for business**: it works very well with data tables, amounts, currencies, and dates.
- Its **syntax is in English** and very readable: `SELECT`, `LOOP AT`, `IF`, `WRITE`.
- It is **not case-sensitive** for keywords and names (`write` and `WRITE` are the same).
- The code **lives inside the SAP system**, not in files on your computer. You write it, save it, and run it inside SAP.
- The database is **built into the language**: you can write `SELECT` directly in the code.
- It has existed for more than 40 years, so old and modern syntax live side by side. In this course you learn both, but I always point out the modern one to prefer.

> [!TIP]
> ABAP is to SAP what Italian is to an office in Rome: everything that happens in there is written in that language. If you want to work in that office, you need to speak it.

### The role of the ABAP developer

Usually a functional consultant (who knows the processes, for example sales) writes a **functional specification**: "I want a report that shows the open orders per customer". You, the developer, write a **technical specification** (how you will do it) and then the code. Finally, the functional consultant and the user test it.

## Hour 2 – The architecture of an SAP system

### The three layers

A classic SAP system has three layers (a 3-tier architecture):

| Layer        | What it does             | Example                           |
| ------------ | ------------------------ | --------------------------------- |
| Presentation | What the user sees       | SAP GUI, browser with Fiori       |
| Application  | Where the ABAP code runs | Application Server ABAP (AS ABAP) |
| Database     | Where the data is stored | SAP HANA, Oracle, SQL Server...   |

> [!TIP]
> Back to the restaurant. The dining room is the presentation layer (the only part the customer sees). The kitchen is the application layer (where the real work happens: the cooks are the ABAP programs). The pantry and the fridge are the database (where the ingredients, that is, the data, are kept).

Your ABAP code runs on the application server. When the user presses a button, the request reaches the server, a **work process** runs your program, which reads and writes data in the database, and then the result goes back to the screen.

### The system landscape

A company doesn't have just one SAP system, but usually three:

| System         | Typical name | What it is for                             |
| -------------- | ------------ | ------------------------------------------ |
| Development    | DEV          | Where you write the code                   |
| Quality / Test | QAS          | Where users test your code                 |
| Production     | PRD          | Where the real business runs, on real data |

Code is written **only** in development and moves to the other systems through **transport requests**.

> [!TIP]
> Think of a pastry chef: they try the new recipe in their home kitchen (DEV), let friends taste it (QAS), and only when everyone is happy do they put it in the shop window (PRD). The transport request is the box they carry the cake in from one place to the other.

### The client

Inside an SAP system there are several **clients**, identified by three digits (for example 100, 200, 800). Each client has its own separate business data, as if they were different companies inside the same system.

- The **data** (customers, orders...) depends on the client.
- The **ABAP code**, instead, is client-independent: if you write a program in client 100, you also see it in client 200.

> [!TIP]
> The SAP system is an apartment building, and the clients are the apartments. Each family has its own furniture (data), but the wiring and the plumbing (the code) are the same for everyone.

That's why almost every database table has `MANDT` (the client) as its first field. Open SQL handles it automatically for you: you will see it on day 6.

### Repository and packages

All development objects (programs, tables, classes...) live in the SAP **Repository**. Objects are organized in **packages**, like folders.

- The `$TMP` package is special: it is "local", and its objects are **not** transported. Use it for practice.
- Your objects must start with **Z** or **Y**: that's the "customer namespace". Anything that doesn't start with Z or Y belongs to SAP and must not be touched.

> [!WARNING]
> Never name one of your programs without the leading Z or Y. The system doesn't allow it (or asks for a special key), because you could overwrite SAP standard objects.

## Hour 3 – The working tools

### SAP GUI and transactions

The **SAP GUI** is the program installed on your PC that connects to the SAP system. At the top left there is the **command field**, where you type a **transaction code** (_t-code_) to open a function.

| Transaction  | What it is for                                     |
| ------------ | -------------------------------------------------- |
| SE80         | Object Navigator: the full development environment |
| SE38         | Program editor (reports)                           |
| SE11         | ABAP Dictionary (tables, structures, types)        |
| SE37         | Function Builder (function modules)                |
| SE24         | Class Builder (classes)                            |
| SE91         | Message classes                                    |
| SE93         | Create a transaction                               |
| SE09 / SE10  | Transport request management                       |
| SE16 / SE16N | Display the contents of a table                    |
| ST22         | Runtime errors (dumps)                             |
| SM37         | Background jobs                                    |
| SAT / ST05   | Performance analysis / SQL trace                   |

Command field tricks:

- `/n` + transaction: opens the transaction in the same window (for example `/nSE38`).
- `/o` + transaction: opens a new window (for example `/oSE11`).
- `/nex` logs off without confirmation (careful!).

### Eclipse with ABAP Development Tools (ADT)

Today the tool SAP recommends is **Eclipse** with the **ADT** plugin. For the new ABAP Cloud and for CDS (days 14 and 15) it is **mandatory**. SE80 is still useful for older objects (classic screens, SmartForms).

ADT shortcuts to learn right away:

| Keys             | Action                                   |
| ---------------- | ---------------------------------------- |
| Ctrl + S         | Save                                     |
| Ctrl + F2        | Check syntax                             |
| Ctrl + F3        | Activate                                 |
| F8               | Run (as a console application or report) |
| Ctrl + Space     | Code completion                          |
| Shift + F1       | Format the code (Pretty Printer)         |
| F3               | Go to the object definition              |
| Ctrl + Shift + A | Open any object                          |

### Save, check, activate

In SAP every object has two versions: **inactive** (draft) and **active** (the one the system actually uses). The cycle is always:

1. Write the code.
2. **Save** (inactive version).
3. **Check** the syntax.
4. **Activate**: only now do other users and programs "see" the new version.
5. **Run** (F8).

> [!TIP]
> It's like writing an email: only you see the draft (inactive); when you press "Send" (activate) it becomes official for everyone.

### How to get a system to practice on

You have three options (always check the current availability on the SAP website):

- **SAP BTP, ABAP Environment – free trial**: used with Eclipse ADT. It is ABAP Cloud (modern syntax, no SAP GUI and no `WRITE`). Great for days 12–15.
- **ABAP Platform Developer Edition** (a full system to install, for example with Docker, with a trial license): includes SAP GUI and all of classic ABAP.
- **Your company's or your customer's development system**, if you have access to it.

> [!WARNING]
> In ABAP Cloud systems some classic statements (`WRITE`, selection screens, SE38) don't exist. For console examples we use the class with the `if_oo_adt_classrun` interface that you see below.

## Hour 4 – Your first program

### Create a report with SE38

1. Go to SE38.
2. Program name: `ZHELLO_WORLD`. Click "Create".
3. Title: "My first program". Type: **Executable program**.
4. Package: `$TMP` (the "Local Object" button).
5. Type the code below, save, activate (Ctrl+F3), and run (F8).

```abap
REPORT zhello_world.

* This is a comment: it starts with an asterisk in the first column
WRITE 'Hello world!'.            " This is a comment too
NEW-LINE.
WRITE 'I am learning ABAP'.
```

Result: a list with two lines of text.

### The same in ABAP Cloud (Eclipse)

In ADT you create a **class** (File > New > ABAP Class), for example `ZCL_HELLO_WORLD`:

```abap
CLASS zcl_hello_world DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_hello_world IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    out->write( 'Hello world!' ).
    out->write( 'I am learning ABAP' ).
  ENDMETHOD.
ENDCLASS.
```

Press F9 (or F8 and "ABAP Application (Console)"): the text appears in the Console view. Don't worry if you don't understand `CLASS` and `METHOD` yet: we explain them calmly on day 10. For now, think of them as the "frame" you write your statements in.

### The basic syntax rules

- Every **statement** ends with a **period** `.` Forgetting the period is beginners' mistake number 1.
- A statement can span several lines; several statements can share one line.
- **Full-line comment**: `*` in the **first column**.
- **End-of-line comment**: `"` (double quote) anywhere.
- **Texts** (literals) go between single quotes `'text'`, or between backticks for strings.
- Upper and lower case don't matter in the code, but they do **inside the quotes**: `'Hello'` is different from `'HELLO'`.
- Words are separated by at least one **space**. ABAP is strict about spaces: `a = b + c.` works, `a=b+c.` doesn't.

### The chained statement

When several statements start with the same word, you can write it only once using a **colon** `:` and separating the parts with **commas**:

```abap
WRITE 'One'.
WRITE 'Two'.
WRITE 'Three'.

* is the same as:
WRITE: 'One', 'Two', 'Three'.
```

> [!TIP]
> The colon is like saying "repeat for each": "Buy: bread, milk, eggs" means "buy bread, buy milk, buy eggs".

### Working with WRITE

`WRITE` prints to the classic list. Some variants:

```abap
WRITE 'Text'.                  " writes on the same line
WRITE / 'New line'.            " the slash starts a new line
WRITE /10 'Indented'.          " new line, starting at column 10
ULINE.                         " horizontal line
SKIP 2.                        " two empty lines
WRITE 'Red' COLOR COL_NEGATIVE.
WRITE sy-datum.                " today's date (system field)
WRITE sy-uname.                " logged-on user
```

### Pretty Printer and conventions

Always use the **Pretty Printer** (Shift+F1 in SE38/ADT) to indent the code. A common convention: keywords in UPPERCASE, names in lowercase (in ADT you set it in the preferences). Tidy code = fewer errors.

### Errors: the dump (ST22)

If the program fails while running (for example a division by zero), SAP shows a **dump**: a screen with the error type, the place in the code, and the variables. All dumps can be viewed in **ST22**. Don't be scared: reading dumps is one of the most useful skills a developer has.

```abap
REPORT zdump_test.
DATA lv_x TYPE i VALUE 10.
DATA lv_y TYPE i VALUE 0.
lv_x = lv_x / lv_y.   " dump COMPUTE_INT_ZERODIVIDE
```

Run the program, then open ST22 to see the dump.

### Transport requests (in practice)

When an object is not in `$TMP`, SAP asks you for a **transport request**. The request (for example `DEVK900123`) contains one or more **tasks**, one per developer. At the end of development you **release** first the tasks and then the request (in SE09/SE10). The Basis team then imports the request into QAS and PRD.

## Exercises

> [!IMPORTANT]
>
> 1. Create the program `ZES01_PRESENTATION` that prints your name, your city, and today's date (use `sy-datum`), each on a separate line.
> 2. Rewrite exercise 1 with a single chained `WRITE` statement.
> 3. Add a separator line with `ULINE` and a colored line.
> 4. Cause a syntax error on purpose (remove a period). Read the syntax check message. Then cause a dump with a division by zero and analyze it in ST22.
> 5. Open SE16N, enter the table `T001` (company codes), and run it. Look at the fields. Then try `SCARR` (the airlines of the "flight" training model).

## Quiz

1. What does ERP stand for?
2. In which of the three layers does ABAP code run?
3. Why must your objects start with Z or Y?
4. What is the difference between a client and a system?
5. What happens if you save a program but don't activate it?
6. How do you write an end-of-line comment?
7. What is the colon for in the statement `WRITE: 'a', 'b'.`?
8. In which transaction do you find the dumps?

## Solutions

```abap
REPORT zes01_presentation.

WRITE: / 'Name: Mario Rossi',
       / 'City: Rome',
       / 'Date:', sy-datum.
ULINE.
WRITE / 'End of presentation' COLOR COL_POSITIVE.
```

Quiz:

1. Enterprise Resource Planning: a single management system for the whole company.
2. In the application layer (application server).
3. Because Z and Y are the customer namespace: this way you don't clash with SAP objects.
4. The system is the whole installation (DEV, QAS, PRD); the client is a "sub-company" with separate data inside a system.
5. The system keeps using the old active version; your change stays a draft.
6. With a double quote `"`.
7. They create a chained statement: they repeat `WRITE` for each element separated by a comma.
8. ST22.

> [!NOTE]
> Today you learned: what SAP and ABAP are, the three-layer architecture, DEV/QAS/PRD, clients, packages, the save-check-activate cycle, the basic syntax rules, and your first program. Tomorrow: variables and data types.
