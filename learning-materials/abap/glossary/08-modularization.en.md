---
title: Modularization, programs, and files
description: Includes, subroutines, function modules, BAPIs, memory, and files.
---

**ABAP memory, SAP memory**: the areas for passing data between programs: ABAP memory (`EXPORT`/`IMPORT ... MEMORY`) within one session, SAP memory (`SET`/`GET PARAMETER`) for the whole logon. Lesson [72](../course/v2/0072-calling-programs-and-memory.en.md).

**BAPI (Business API)**: a stable, remote-enabled function module that exposes a business operation, such as creating an order. Lesson [71](../course/v2/0071-bapis.en.md).

**Function group**: the program that holds related function modules and their shared global data (transaction SE80 or SE37). Lesson [70](../course/v2/0070-function-modules.en.md).

**Function module**: a global, reusable procedure with an interface and exceptions, called with `CALL FUNCTION`. Lesson [70](../course/v2/0070-function-modules.en.md).

**Include**: a program holding a piece of code inserted into other programs with `INCLUDE`; in the Dictionary, also a structure embedded in another one. Lessons [32](../course/v2/0032-nested-structures.en.md), [69](../course/v2/0069-includes-and-subroutines.en.md).

**Subroutine**: the old way to modularize code with `FORM` and `PERFORM`; methods replace it today. Lesson [69](../course/v2/0069-includes-and-subroutines.en.md).
