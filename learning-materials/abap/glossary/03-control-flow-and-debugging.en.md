---
title: Control flow and debugging
description: Conditions, loops, the debugger, and runtime errors.
---

**Breakpoint**: a point in the code where the debugger stops execution; it can be a session, external, or user breakpoint. Lesson [29](../course/v2/0029-breakpoints-and-watchpoints.en.md).

**`CASE`**: the statement that picks a branch by comparing one value with a list of `WHEN` alternatives. Lesson [25](../course/v2/0025-case.en.md).

**`CHECK`**: the statement that leaves the current block, or skips to the next loop pass, if the condition is false. Lesson [27](../course/v2/0027-exit-continue-check.en.md).

**Debugger**: the tool that runs a program step by step and shows the values of its variables. Lesson [28](../course/v2/0028-debugger-basics.en.md).

**`EXIT`, `CONTINUE`**: the statements that, in a loop, respectively leave the loop and skip to the next pass. Lesson [27](../course/v2/0027-exit-continue-check.en.md).

**`IF`**: the statement that runs a block of code only if a logical expression is true, with optional `ELSEIF` and `ELSE`. Lesson [24](../course/v2/0024-if-and-logical-expressions.en.md).

**Loop**: a block of code that repeats: `DO`, `WHILE`, or `LOOP AT` over the rows of an internal table. Lessons [26](../course/v2/0026-do-and-while-loops.en.md), [38](../course/v2/0038-looping-internal-tables.en.md).

**Runtime error**: an error that occurs while the program runs, such as a division by zero, and produces a dump if not handled. Lesson [30](../course/v2/0030-runtime-errors.en.md).

**Short dump**: the common name of a runtime error that stops the program; analyzed with transaction ST22. Lesson [30](../course/v2/0030-runtime-errors.en.md).

**Watchpoint**: a debugger stop that fires when a variable's value changes or meets a condition. Lesson [29](../course/v2/0029-breakpoints-and-watchpoints.en.md).
