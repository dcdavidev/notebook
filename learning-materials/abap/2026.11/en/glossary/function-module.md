---
title: Function module
description: Function module, Function group, Update function module.
---

## Function module

A global, reusable procedure with an interface and exceptions, called with `CALL FUNCTION`. Lesson [70](../course/0070-function-modules.md).

## Function group

The program that holds related function modules and their shared global data (transaction SE80 or SE37). Lesson [70](../course/0070-function-modules.md).

## Update function module

A function module called `IN UPDATE TASK` that writes to the database only at `COMMIT WORK`, in a separate process. Lesson [113](../course/0113-update-task.md).
