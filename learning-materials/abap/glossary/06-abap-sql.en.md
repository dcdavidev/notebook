---
title: ABAP SQL and the LUW
description: Reading and writing the database, and saving data consistently.
---

**ABAP SQL**: the SQL dialect built into ABAP (formerly _Open SQL_): it reads and writes database tables independently of the underlying database. Lessons [52](../course/v2/0052-select-basics.en.md), [97](../course/v2/0097-modern-abap-sql.en.md), [98](../course/v2/0098-advanced-abap-sql.en.md).

**Aggregate function**: an SQL function that computes one value over a group of rows: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Lesson [56](../course/v2/0056-aggregates-and-group-by.en.md).

**`COMMIT WORK`**: the statement that closes the SAP LUW: it makes the database changes permanent and starts the update function modules. Lesson [60](../course/v2/0060-luw-commit-and-rollback.en.md).

**`FOR ALL ENTRIES`**: the `SELECT` addition that reads the rows matching each row of an internal table; if the table is empty, it reads everything. Lesson [57](../course/v2/0057-for-all-entries.en.md).

**`GROUP BY`**: in SQL it groups rows to compute aggregates; with `LOOP AT ... GROUP BY` it groups the rows of an internal table. Lessons [56](../course/v2/0056-aggregates-and-group-by.en.md), [95](../course/v2/0095-grouping-internal-tables.en.md).

**`HAVING`**: the SQL condition that filters groups after `GROUP BY`, based on aggregate values. Lesson [56](../course/v2/0056-aggregates-and-group-by.en.md).

**Join**: combining rows from several related tables in a single `SELECT`: `INNER JOIN`, `LEFT OUTER JOIN`, and others. Lesson [55](../course/v2/0055-joins.en.md).

**LUW (Logical Unit of Work)**: a group of changes that is saved or undone as a whole. There are the database LUW and the SAP LUW. Lesson [60](../course/v2/0060-luw-commit-and-rollback.en.md).

**`ORDER BY`**: the SQL clause that sorts the results of a `SELECT`. Lesson [54](../course/v2/0054-where-and-order-by.en.md).

**`ROLLBACK WORK`**: the statement that undoes all the changes of the SAP LUW not yet committed. Lesson [60](../course/v2/0060-luw-commit-and-rollback.en.md).

**`SELECT`**: the ABAP SQL statement that reads data from the database, into an internal table, a structure, or row by row. Lesson [52](../course/v2/0052-select-basics.en.md).

**`SELECT SINGLE`**: the variant of `SELECT` that reads at most one row, usually by the full key. Lesson [53](../course/v2/0053-select-single-and-up-to.en.md).

**Subquery**: a `SELECT` inside another `SELECT`, used for example with `IN` or `EXISTS` in the `WHERE` condition. Lesson [58](../course/v2/0058-subqueries-and-union.en.md).

**`UNION`**: the SQL operator that merges the rows of two `SELECT` statements into one result. Lesson [58](../course/v2/0058-subqueries-and-union.en.md).

**`WHERE`**: the clause that filters rows in a `SELECT`, a `LOOP AT`, or a `DELETE`. Lesson [54](../course/v2/0054-where-and-order-by.en.md).

**Writing to the database**: the `INSERT`, `UPDATE`, `MODIFY`, and `DELETE` statements that change the data of database tables. Lesson [59](../course/v2/0059-writing-to-the-database.en.md).
