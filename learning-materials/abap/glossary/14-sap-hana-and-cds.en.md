---
title: SAP HANA and CDS
description: Code pushdown, CDS views, and AMDP.
---

**ABAP Managed Database Procedure (AMDP)**: an ABAP method whose code is written in SQLScript and runs directly in the SAP HANA database. Lesson [137](../course/v2/0137-amdp.en.md).

**CDS (Core Data Services)**: the language for defining semantic data models in the database: views, associations, annotations, and access control. Lesson [132](../course/v2/0132-cds-view-entities.en.md).

**CDS access control (DCL)**: rules, written in an _access control_ object, that automatically restrict the rows a user sees in a CDS view. Lesson [136](../course/v2/0136-cds-access-control.en.md).

**CDS annotation**: metadata written with `@` in a CDS view that describes its behavior: labels, Fiori UI, authorizations, search. Lesson [134](../course/v2/0134-cds-annotations.en.md).

**CDS association**: a declared relationship between CDS entities that becomes a join only when it is used (_path expression_). Lesson [133](../course/v2/0133-cds-associations.en.md).

**CDS table function**: a CDS entity whose data is computed by an AMDP method. Lesson [138](../course/v2/0138-cds-table-functions.en.md).

**CDS view entity**: the current form of CDS view (`DEFINE VIEW ENTITY`): a `SELECT` stored in the database with annotations and associations. Lesson [132](../course/v2/0132-cds-view-entities.en.md).

**Code pushdown**: moving data-intensive calculations from the ABAP server to the database (with ABAP SQL, CDS, and AMDP) to use the speed of SAP HANA. Lesson [131](../course/v2/0131-code-pushdown.en.md).

**SAP HANA**: SAP's in-memory, column-store database, on which SAP S/4HANA and code pushdown run. Lesson [131](../course/v2/0131-code-pushdown.en.md).
