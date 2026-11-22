---
title: Internal table
description: Internal table, Standard table, Sorted table, Hashed table, Table type, Work area.
---

## Internal table

An in-memory table holding a list of rows of the same type, for processing data at runtime. Lesson [33](../course/0033-internal-tables-intro.md).

## Standard table

The most common kind of internal table: rows in insertion order, accessed by index or by linear search. Lesson [34](../course/0034-table-categories.md).

## Sorted table

An internal table always kept sorted by its key, with automatic binary search. Lesson [34](../course/0034-table-categories.md).

## Hashed table

An internal table with a unique key and hash-based access: read time does not depend on the number of rows. Lesson [34](../course/0034-table-categories.md).

## Table type

The Dictionary object, or the `TYPES ... TABLE OF` declaration, that describes an internal table: row type, category, and key. Lesson [48](../course/0048-ddic-structures-and-table-types.md).

## Work area

A structure with the same type as the rows of an internal table, used to read, insert, or change one row at a time. Lessons [33](../course/0033-internal-tables-intro.md), [36](../course/0036-filling-internal-tables.md).
