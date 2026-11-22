---
title: LUW
description: LUW (Logical Unit of Work), COMMIT WORK, ROLLBACK WORK.
---

## LUW (Logical Unit of Work)

A group of changes that is saved or undone as a whole. There are the database LUW and the SAP LUW. Lesson [60](../course/0060-luw-commit-and-rollback.md).

## `COMMIT WORK`

The statement that closes the SAP LUW: it makes the database changes permanent and starts the update function modules. Lesson [60](../course/0060-luw-commit-and-rollback.md).

## `ROLLBACK WORK`

The statement that undoes all the changes of the SAP LUW not yet committed. Lesson [60](../course/0060-luw-commit-and-rollback.md).
