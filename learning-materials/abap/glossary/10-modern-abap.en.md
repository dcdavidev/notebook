---
title: Modern ABAP
description: Constructor expressions, iterations, grouping, and regular expressions.
---

**`COND`**: a constructor expression that returns a value chosen among several `WHEN` conditions, like an `IF` in a single expression. Lesson [92](../course/v2/0092-cond-and-switch.en.md).

**Constructor expression**: an expression that builds a value in place: `VALUE`, `NEW`, `CONV`, `CAST`, `REF`, `EXACT`, `COND`, `SWITCH`, `REDUCE`, `FILTER`, `CORRESPONDING`. Lesson [91](../course/v2/0091-constructor-expressions.en.md).

**`CORRESPONDING`**: the expression that copies components with the same name from one structure or table to another, with optional mappings. Lesson [94](../course/v2/0094-filter-and-corresponding.en.md).

**`FILTER`**: the expression that returns the rows of an internal table that match a condition on a key. Lesson [94](../course/v2/0094-filter-and-corresponding.en.md).

**`FOR`**: the iteration expression used inside `VALUE` and `REDUCE` to build a table or a value by looping over another table. Lesson [93](../course/v2/0093-for-and-reduce.en.md).

**`REDUCE`**: the expression that computes one value, such as a sum, by looping over a table with `FOR`. Lesson [93](../course/v2/0093-for-and-reduce.en.md).

**Regular expression**: a text pattern used with `FIND`, `REPLACE`, and `matches` to search and replace parts of strings. Lesson [96](../course/v2/0096-regular-expressions.en.md).

**`SWITCH`**: the expression that returns a value based on the value of one operand, like a `CASE` in a single expression. Lesson [92](../course/v2/0092-cond-and-switch.en.md).

**`VALUE`**: the constructor expression that builds structures and internal tables with their values in a single statement. Lesson [91](../course/v2/0091-constructor-expressions.en.md).
