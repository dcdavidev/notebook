---
title: Structures and internal tables
description: Structures, internal tables, keys, field symbols, and references.
---

**Data reference**: a `REF TO` variable that holds the address of a data object and is dereferenced with `->*`. Lesson [42](../course/v2/0042-data-references.en.md).

**Field symbol**: a placeholder (`<fs>`) that points to an existing data object, such as an internal table row, so you can change it without copying. Lesson [41](../course/v2/0041-field-symbols.en.md).

**Hashed table**: an internal table with a unique key and hash-based access: read time does not depend on the number of rows. Lesson [34](../course/v2/0034-table-categories.en.md).

**Internal table**: an in-memory table holding a list of rows of the same type, for processing data at runtime. Lesson [33](../course/v2/0033-internal-tables-intro.en.md).

**Nested structure**: a structure that contains other structures or tables as components. Lesson [32](../course/v2/0032-nested-structures.en.md).

**Primary key**: the set of fields that uniquely identifies a row, in a database table or an internal table. Lessons [35](../course/v2/0035-table-keys.en.md), [46](../course/v2/0046-database-tables.en.md).

**Secondary key**: an extra sorted or hashed key of an internal table, for fast reads by criteria other than the primary key. Lesson [35](../course/v2/0035-table-keys.en.md).

**Sorted table**: an internal table always kept sorted by its key, with automatic binary search. Lesson [34](../course/v2/0034-table-categories.en.md).

**Standard table**: the most common kind of internal table: rows in insertion order, accessed by index or by linear search. Lesson [34](../course/v2/0034-table-categories.en.md).

**Structure**: a data object made of several fields (components) of different types, like a table row. Lessons [31](../course/v2/0031-structures.en.md), [48](../course/v2/0048-ddic-structures-and-table-types.en.md).
