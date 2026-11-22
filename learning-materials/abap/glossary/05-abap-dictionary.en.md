---
title: The ABAP Dictionary
description: Domains, data elements, tables, views, search helps, and locks.
---

**ABAP Dictionary (DDIC)**: the central repository of shared data definitions: domains, data elements, tables, structures, views (transaction SE11). Lesson [43](../course/v2/0043-abap-dictionary-intro.en.md).

**Check table**: the table that holds the allowed values of a field, linked through a foreign key. Lesson [47](../course/v2/0047-foreign-keys-and-check-tables.en.md).

**Data element**: the Dictionary object that gives a field its meaning: it points to a domain and holds the field labels and documentation. Lesson [45](../course/v2/0045-data-elements.en.md).

**Database table**: a table defined in the Dictionary and created in the database (transparent table), with fields, a key, and technical settings. Lesson [46](../course/v2/0046-database-tables.en.md).

**Domain**: the Dictionary object that defines the technical attributes of a field: type, length, allowed values. Lesson [44](../course/v2/0044-domains.en.md).

**Foreign key**: the link between a table field and the key of a check table, which the Dictionary uses to validate the values entered. Lesson [47](../course/v2/0047-foreign-keys-and-check-tables.en.md).

**Lock object**: the Dictionary object that generates the `ENQUEUE_*` and `DEQUEUE_*` function modules to stop two users from changing the same data at once. Lesson [51](../course/v2/0051-lock-objects.en.md).

**Search help**: the Dictionary object that offers the user the possible values of a field (the F4 key). Lesson [50](../course/v2/0050-search-helps.en.md).

**Table maintenance**: the generated screen for manually entering and editing a table's data, opened with SM30. Lesson [49](../course/v2/0049-views-and-table-maintenance.en.md).

**Table type**: the Dictionary object, or the `TYPES ... TABLE OF` declaration, that describes an internal table: row type, category, and key. Lesson [48](../course/v2/0048-ddic-structures-and-table-types.en.md).

**View**: in the Dictionary, a view combines fields from several tables (database view) or is used to maintain them (maintenance view); CDS views are used today. Lesson [49](../course/v2/0049-views-and-table-maintenance.en.md).
