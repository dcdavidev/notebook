---
title: CDS
description: CDS (Core Data Services), CDS view entity, CDS association, Path expression, CDS annotation, CDS access control (DCL), CDS table function.
---

## CDS (Core Data Services)

The language for defining semantic data models in the database: views, associations, annotations, and access control. Lesson [132](../course/0132-cds-view-entities.md).

## CDS view entity

The current form of CDS view (`DEFINE VIEW ENTITY`): a `SELECT` stored in the database with annotations and associations. Lesson [132](../course/0132-cds-view-entities.md).

## CDS association

A declared relationship between CDS entities that becomes a join only when it is used (_path expression_). Lesson [133](../course/0133-cds-associations.md).

## Path expression

The way to follow a CDS association with dot or slash notation, for example `_Carrier.Name`: the join is created only then. Lesson [133](../course/0133-cds-associations.md).

## CDS annotation

Metadata written with `@` in a CDS view that describes its behavior: labels, Fiori UI, authorizations, search. Lesson [134](../course/0134-cds-annotations.md).

## CDS access control (DCL)

Rules, written in an _access control_ object, that automatically restrict the rows a user sees in a CDS view. Lesson [136](../course/0136-cds-access-control.md).

## CDS table function

A CDS entity whose data is computed by an AMDP method. Lesson [138](../course/0138-cds-table-functions.md).
