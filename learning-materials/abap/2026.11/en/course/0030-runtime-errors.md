---
title: Runtime errors and ST22
description: Read a short dump and find the cause of a crash.
level: beginner
---

The syntax check catches many mistakes before a program runs, but not all of them. A division by zero, a text that isn't a number, a loop that never ends: these errors appear only while the program runs. When ABAP meets one it can't handle, it stops the program and writes a **runtime error** report, called a **short dump** or simply a dump.

Every ABAP developer reads dumps. Transaction `ST22` collects them, and with a little practice a dump tells you exactly what went wrong and where.

## What happens when a program dumps

```abap
REPORT zdump_demo.

DATA lv_seats  TYPE i VALUE 220.
DATA lv_groups TYPE i VALUE 0.
DATA lv_result TYPE i.

lv_result = lv_seats / lv_groups.      " division by zero
WRITE / lv_result.
```

When you run this report:

1. The program stops at the division; the `WRITE` never runs.
2. Instead of the list, the user sees a screen titled **Runtime Error** with the name of the error, here `COMPUTE_INT_ZERODIVIDE`.
3. The database changes of the current transaction that weren't committed are rolled back.
4. The system stores the full dump, so you can analyze it later.

> [!TIP]
> A dump is the black box of a plane: when something goes wrong, it records where the plane was, what the instruments showed, and the last actions of the crew. You read it afterwards to understand the cause.

## Find the dump in ST22

Open transaction `ST22` (**ABAP Runtime Error**). You see the dumps of **today** and **yesterday**, or you can search by date, user, program, or error name with **Own selection**. Double-click a dump to open it.

In ADT, the **Feed Reader** view can subscribe to the runtime errors of your user, so new dumps appear in Eclipse as soon as they happen.

The system deletes old dumps after a while. If you need one for longer, for example to show it to a colleague, select it and use **Keep/Release**.

## Read a dump

A dump is long, but it's divided into sections. Read these first, in this order:

| Section                             | What it tells you                                                 |
| ----------------------------------- | ----------------------------------------------------------------- |
| **Short Text**                      | the error in one sentence, for example "Division by 0 (type I)"   |
| **What happened?**                  | a plain description and the name of the program                   |
| **Error analysis**                  | details: which exception, which values were involved              |
| **Information on where terminated** | the program, include, and line number                             |
| **Source Code Extract**             | the code around the line that failed, marked with `>>>>>`         |
| **Contents of system fields**       | `sy-subrc`, `sy-index`, `sy-tabix`, and the others at that moment |
| **Chosen variables**                | the values of the variables in the failing statement              |
| **Active Calls/Events**             | the chain of calls that led to the error                          |

The section **How to correct the error** sometimes contains good advice, sometimes only generic text. From the source code extract you can jump to the editor with a double-click.

In the example, the source code extract marks the line `lv_result = lv_seats / lv_groups.`, and the chosen variables show `LV_GROUPS = 0`. That's the whole story: the divisor was zero.

## Common runtime errors

| Runtime error                              | Typical cause                                                  |
| ------------------------------------------ | -------------------------------------------------------------- |
| `COMPUTE_INT_ZERODIVIDE`, `BCD_ZERODIVIDE` | division by zero with integers or packed numbers               |
| `CONVT_NO_NUMBER`                          | a text that isn't a number assigned to a number variable       |
| `CONVT_OVERFLOW`, `BCD_OVERFLOW`           | a value too large for the target type                          |
| `ITAB_LINE_NOT_FOUND`                      | a table expression that reads a row that doesn't exist         |
| `OBJECTS_OBJREF_NOT_ASSIGNED`              | a method called on an object reference that is empty           |
| `TIME_OUT`                                 | a dialog program that runs too long, often an endless loop     |
| `TSV_TNEW_PAGE_ALLOC_FAILED`               | the program used up its memory, often by reading too many rows |
| `MESSAGE_TYPE_X`                           | the program sent a message of type `X` on purpose              |

You met the conversion errors in [Type conversions](./0019-type-conversions.md), division by zero in [Arithmetic operations](./0020-arithmetic-operations.md), and `TIME_OUT` in [DO and WHILE loops](./0026-do-and-while-loops.md).

## From the dump to the fix

1. Read the short text and the error name: they tell you the **kind** of problem.
2. Go to the line marked in the source code extract: that's **where** it happened.
3. Look at the chosen variables and the system fields: they show **which values** caused it.
4. Reproduce the error with a breakpoint just before that line, as in [The debugger: first steps](./0028-debugger-basics.md), and check where the wrong value comes from.
5. Fix the cause, not the symptom: check the divisor, validate the input, or handle the exception.

Many runtime errors come from an **exception** that the program didn't catch. In the dump's error analysis you'll find its class, for example `CX_SY_ZERODIVIDE`. In [Class-based exceptions](./0089-class-based-exceptions.md) you'll learn to catch these exceptions with `TRY ... CATCH`, so that the program reacts instead of dumping.

> [!WARNING]
> Don't ignore dumps in test and production systems, even if "the user just started again". Each dump means some work wasn't done, and the same error can happen again with real data. Check `ST22` regularly for the programs you're responsible for.

## Exercise

> [!IMPORTANT]
>
> 1. Run `zdump_demo` from this lesson and note the error name on the screen.
> 2. Open the dump in `ST22` and find the line number, the value of `LV_GROUPS`, and the exception class.
> 3. Fix the program so that it prints `No groups` instead of dumping when `lv_groups` is 0.

### Solution

The error is `COMPUTE_INT_ZERODIVIDE`, the exception class is `CX_SY_ZERODIVIDE`, and the chosen variables show `LV_GROUPS = 0`.

```abap
REPORT zdump_demo.

DATA lv_seats  TYPE i VALUE 220.
DATA lv_groups TYPE i VALUE 0.
DATA lv_result TYPE i.

IF lv_groups = 0.
  WRITE / 'No groups'.
ELSE.
  lv_result = lv_seats / lv_groups.
  WRITE / lv_result.
ENDIF.
```

> [!NOTE]
>
> - A runtime error stops the program, rolls back uncommitted database changes, and writes a short dump.
> - Transaction `ST22` lists the dumps; in ADT you can follow them in the **Feed Reader**.
> - Read the short text, the error analysis, the source code extract, and the chosen variables first.
> - Learn the common errors: `COMPUTE_INT_ZERODIVIDE`, `CONVT_NO_NUMBER`, `ITAB_LINE_NOT_FOUND`, `TIME_OUT`, and the others.
> - Reproduce the error in the debugger and fix the cause; many dumps are exceptions you can catch.
