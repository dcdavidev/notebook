---
title: Constructor expression
description: Constructor expression, VALUE, NEW, CONV, CORRESPONDING, FILTER, FOR, REDUCE.
---

## Constructor expression

An expression that builds a value in place: `VALUE`, `NEW`, `CONV`, `CAST`, `REF`, `EXACT`, `COND`, `SWITCH`, `REDUCE`, `FILTER`, `CORRESPONDING`. Lesson [91](../course/0091-constructor-expressions.md).

## `VALUE`

The constructor expression that builds structures and internal tables with their values in a single statement. Lesson [91](../course/0091-constructor-expressions.md).

## `NEW`

The constructor expression that creates an object or an anonymous data object and returns its reference: `NEW zcl_flight( )`. Lesson [91](../course/0091-constructor-expressions.md).

## `CONV`

The constructor expression that converts a value to another type in place, for example to pass it to a parameter. Lesson [91](../course/0091-constructor-expressions.md).

## `CORRESPONDING`

The expression that copies components with the same name from one structure or table to another, with optional mappings. Lesson [94](../course/0094-filter-and-corresponding.md).

## `FILTER`

The expression that returns the rows of an internal table that match a condition on a key. Lesson [94](../course/0094-filter-and-corresponding.md).

## `FOR`

The iteration expression used inside `VALUE` and `REDUCE` to build a table or a value by looping over another table. Lesson [93](../course/0093-for-and-reduce.md).

## `REDUCE`

The expression that computes one value, such as a sum, by looping over a table with `FOR`. Lesson [93](../course/0093-for-and-reduce.md).
