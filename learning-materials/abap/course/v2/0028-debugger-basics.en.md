---
title: 'The debugger: first steps'
description: Start the debugger, step through code, and inspect variables.
---

_Beginner level_

When a program gives the wrong result, reading the code again isn't always enough. The **debugger** lets you stop the program while it runs, execute it one statement at a time, and look at the value of every variable at that moment. You see what the program really does, not what you think it does.

The ABAP debugger exists in two forms with the same ideas: in SAP GUI and in Eclipse with ADT. This lesson shows both.

> [!TIP]
> Running a program normally is watching a film at full speed. The debugger is the remote control: you pause, go forward frame by frame, and freeze the image to look at every detail.

## Start the debugger

To use the debugger you need a point where the program stops: a **breakpoint**. The simplest ways to get one:

| Where   | How                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------- |
| SAP GUI | type `/h` in the command field and press Enter, then start the program: it stops at the first statement |
| SAP GUI | in the ABAP Editor (`SE38`), put the cursor on a line and click **Set/Delete Breakpoint**               |
| ADT     | double-click the ruler to the left of a line number in the editor (or press Ctrl+Shift+B)               |

Then run the program as usual, for example with F8. When it reaches the breakpoint, the debugger opens: in SAP GUI in a new window, in ADT in the **Debug** perspective. The line that is **about to run** is highlighted.

You'll learn the different kinds of breakpoints, and how to stop only when a value changes, in [Breakpoints and watchpoints](./0029-breakpoints-and-watchpoints.en.md).

## Step through the code

The same function keys work in SAP GUI and in ADT:

| Key | Name        | What it does                                                              |
| --- | ----------- | ------------------------------------------------------------------------- |
| F5  | Single step | runs the current statement; if it calls a method or routine, goes into it |
| F6  | Execute     | runs the current statement; a call runs as a whole, without going in      |
| F7  | Return      | runs the rest of the current method or routine and stops after the call   |
| F8  | Continue    | runs until the next breakpoint, or to the end of the program              |

For a simple report without calls, F5 and F6 do the same thing. Once you work with methods and function modules, F6 lets you skip the code you trust, and F5 lets you go into the code you want to check.

## Look at variables

While the program is stopped, you can see the current value of any variable:

- **SAP GUI**: double-click a variable in the source code, or type its name in the **Variables** list on the right. The **Desktop** and **Standard** tabs show source and variables together.
- **ADT**: the **Variables** view lists the local variables; hover over a variable in the editor to see its value in a tooltip.

You can also look at system fields such as `sy-subrc` or `sy-index`: type them like any other variable.

Try it with this report: set a breakpoint on the `DO` line, run it, and press F5 a few times while you watch `lv_total` and `sy-index`.

```abap
REPORT zdebug_demo.

DATA lv_total TYPE i.
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '120.50'.

DO 3 TIMES.
  lv_total += sy-index.
ENDDO.

lv_price = lv_price * lv_total.
WRITE: / lv_total, lv_price.
```

## Change values while debugging

In both debuggers you can **change** a variable's value: in SAP GUI, click the pencil icon next to the value; in ADT, right-click the variable in the **Variables** view and choose **Change Value**. Then continue: the program goes on with the new value.

This is useful for testing a branch without changing the data, for example setting `sy-subrc` to 4 to see what the error path does.

> [!CAUTION]
> Changing values in the debugger is logged, and in production it's usually forbidden by authorizations, with good reason: you can write inconsistent data to the database. Debug with changes only in development and test systems.

> [!WARNING]
> The debugger stops the program for real. If you debug a program that has locked data or opened a database transaction, those stay blocked for other users until you continue. Don't leave a debugger session open for long.

## Exercise

> [!IMPORTANT]
>
> 1. Create the report `zdebug_demo` from this lesson and start it with a breakpoint on the `DO` line.
> 2. Step through the loop with F5 and write down the value of `lv_total` after each pass.
> 3. Before the last `WRITE`, change `lv_total` to 10 in the debugger, continue with F8, and check the output.

### Solution

After the three passes `lv_total` is 1, then 3, then 6. Without changes the output is `6` and `723.00`. If you set `lv_total` to 10 before the multiplication line, the output becomes `10` and `1205.00`; if you change it after the multiplication, only the first value changes.

> [!NOTE]
>
> - The debugger stops a running program so you can execute it step by step and inspect variables.
> - Start it with `/h` in SAP GUI, or set a breakpoint in the editor and run the program.
> - F5 steps into calls, F6 steps over them, F7 returns from the current routine, F8 continues.
> - Double-click or hover over a variable to see its value; system fields work the same way.
> - You can change values while debugging, but only in development and test systems.
