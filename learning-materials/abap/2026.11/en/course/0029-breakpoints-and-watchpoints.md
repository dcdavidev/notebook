---
title: Breakpoints and watchpoints
description: Stop the program exactly where and when you want.
level: beginner
---

In [The debugger: first steps](./0028-debugger-basics.md) you stopped a program at a line and stepped through it. In real programs, with thousands of lines and loops over thousands of rows, pressing F5 isn't enough. You want the program to stop **exactly** where something interesting happens: at a given statement, in a given pass of a loop, or the moment a variable changes.

That's the job of the different kinds of **breakpoints** and of **watchpoints**.

## Session and external breakpoints

A breakpoint you set in the editor is stored in the system for your user. There are two kinds:

| Kind                                      | Valid for                                                 | Typical use                                 |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| **Session breakpoint**                    | your current SAP GUI logon session; gone when you log off | programs you start yourself in SAP GUI      |
| **External breakpoint** (user breakpoint) | your user, also in sessions started from outside          | Fiori apps, OData and HTTP calls, RFC calls |

In SAP GUI you choose the kind in the ABAP Editor with the two breakpoint buttons. In ADT, breakpoints are external by default, so they also stop requests that come from a browser or another system, as long as they run with your user.

> [!TIP]
> A session breakpoint is a sticky note on your own copy of a book: only you see it, and it's gone when you return the book. An external breakpoint is a note at the library's front desk: "stop me whenever I borrow this book, from any branch".

## Breakpoints in the code: BREAK-POINT

You can also write a breakpoint in the source code:

```abap
REPORT zbreak_demo.

DATA lv_total TYPE i.

DO 5 TIMES.
  lv_total += sy-index.
  BREAK-POINT.                      " stops here for EVERY user
ENDDO.
```

> [!CAUTION]
> `BREAK-POINT` stops the program for **every user** who runs it in dialog, and in background jobs it writes an entry to the system log. Never transport code that contains it: the code inspector and ATC flag it for this reason.

Old code also contains `BREAK username.`, which stops only for the user named. It's less dangerous but still forbidden in production code. When you need a breakpoint that you can switch on and off without changing the code, use `BREAK-POINT ID group`: the **checkpoint group** is activated in transaction `SAAB`, and when it's inactive, the statement does nothing.

## Dynamic breakpoints in the debugger

While you're debugging, you can create breakpoints that don't belong to a line, but to a **kind of statement** or an event. In the SAP GUI debugger, use the menu **Breakpoints > Breakpoint at**; in ADT, use the **Breakpoints** view.

| Breakpoint at...        | Stops...                                      | Example                          |
| ----------------------- | --------------------------------------------- | -------------------------------- |
| statement               | at every statement of that type               | every `SELECT`, every `MESSAGE`  |
| method, function module | when that method or function module is called | `BAPI_FLIGHT_GETLIST`            |
| exception               | when an exception is raised                   | `CX_SY_ZERODIVIDE`               |
| message                 | when a given message is sent                  | message `001` of class `ZFLIGHT` |

A breakpoint at the statement `MESSAGE` is the classic way to find where an error message comes from in a program you don't know.

You can also add a **condition** to a breakpoint, so that it stops only when the condition is true, for example `sy-index = 4` or `lv_carrid = 'LH'`. In the SAP GUI debugger, edit the breakpoint in the **Break./Watchpoints** tab; in ADT, open the breakpoint's properties.

## Watchpoints: stop when a value changes

A **watchpoint** isn't tied to a line: it stops the program **when the value of a variable changes**, wherever that happens. It's the tool for questions like "who overwrites this field?".

1. Start the debugger with a normal breakpoint.
2. Create a watchpoint for the variable: in SAP GUI, the **Watchpoint** button (or the **Break./Watchpoints** tab); in ADT, right-click the variable in the **Variables** view and set the watchpoint from the context menu.
3. Optionally, add a condition, for example `lv_total > 10`.
4. Press F8: the debugger stops right after the statement that changed the value.

```abap
REPORT zwatch_demo.

DATA lv_total TYPE i.
DATA lv_count TYPE i.

DO 10 TIMES.
  lv_count += 1.
  IF sy-index MOD 3 = 0.
    lv_total += sy-index.           " a watchpoint on lv_total stops here
  ENDIF.
ENDDO.
```

> [!WARNING]
> Watchpoints work only while the debugger is running, and they slow the program down, because the debugger must check the variable after every statement. Remove them when you've found what you were looking for.

## Exercise

> [!IMPORTANT]
>
> 1. In `zwatch_demo`, set a breakpoint on the line `lv_count += 1.` with the condition `sy-index = 6`, and check the values of `lv_count` and `lv_total` when it stops.
> 2. Create a watchpoint on `lv_total` and press F8 several times: in which passes does the debugger stop?
> 3. Set a dynamic breakpoint at the statement `WRITE` in any of your reports and run it.

### Solution

1. With the condition `sy-index = 6`, the program stops in pass 6, before the line runs: `lv_count` is 5 and `lv_total` is 3 (only pass 3 has added a value so far).
2. The watchpoint stops in passes 3, 6, and 9, the only ones where `lv_total` changes; the final value is 18.
3. The debugger stops at the first `WRITE` statement, wherever it is in the program.

> [!NOTE]
>
> - Session breakpoints last for your SAP GUI session; external breakpoints work for your user also in Fiori, HTTP, and RFC requests.
> - `BREAK-POINT` in the code stops every user: never transport it. Use checkpoint groups (`SAAB`) for switchable breakpoints.
> - Dynamic breakpoints stop at a statement type, a method, a function module, an exception, or a message.
> - Conditions make a breakpoint stop only when an expression is true.
> - A watchpoint stops the program when a variable changes, wherever that happens.
