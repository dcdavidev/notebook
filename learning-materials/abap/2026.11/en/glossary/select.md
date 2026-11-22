---
title: SELECT
description: SELECT, SELECT SINGLE, UP TO n ROWS, WHERE, ORDER BY, FOR ALL ENTRIES.
---

## `SELECT`

The ABAP SQL statement that reads data from the database, into an internal table, a structure, or row by row. Lesson [52](../course/0052-select-basics.md).

## `SELECT SINGLE`

The variant of `SELECT` that reads at most one row, usually by the full key. Lesson [53](../course/0053-select-single-and-up-to.md).

## `UP TO n ROWS`

The `SELECT` addition that limits the number of rows read, usually together with `ORDER BY`. Lesson [53](../course/0053-select-single-and-up-to.md).

## `WHERE`

The clause that filters rows in a `SELECT`, a `LOOP AT`, or a `DELETE`. Lesson [54](../course/0054-where-and-order-by.md).

## `ORDER BY`

The SQL clause that sorts the results of a `SELECT`. Lesson [54](../course/0054-where-and-order-by.md).

## `FOR ALL ENTRIES`

The `SELECT` addition that reads the rows matching each row of an internal table; if the table is empty, it reads everything. Lesson [57](../course/0057-for-all-entries.md).
