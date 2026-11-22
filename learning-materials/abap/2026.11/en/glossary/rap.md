---
title: RAP
description: RAP (RESTful Application Programming Model), Business object, RAP data model, Projection, Managed scenario, Unmanaged scenario, Late numbering.
---

## RAP (RESTful Application Programming Model)

SAP's modern programming model for building OData services and Fiori apps with CDS, behavior definitions, and EML. Lesson [139](../course/0139-rap-overview.md).

## Business object

A business entity (or tree of entities) with data, behavior, and services, built with RAP. Lesson [139](../course/0139-rap-overview.md).

## RAP data model

The CDS views that describe the entities of a RAP business object and their parent-child relationships (_composition_). Lesson [140](../course/0140-rap-data-model.md).

## Projection

The layer of CDS views and behavior on top of the data model that decides what a specific service exposes. Lesson [144](../course/0144-rap-business-services.md).

## Managed scenario

The RAP scenario in which the framework reads and saves the data itself; you write only the business logic. Lessons [139](../course/0139-rap-overview.md), [140](../course/0140-rap-data-model.md).

## Unmanaged scenario

The RAP scenario where you write the save logic yourself, usually to reuse existing code; with _additional save_ you add logic to a managed scenario. Lesson [147](../course/0147-rap-unmanaged-and-save.md).

## Late numbering

In RAP, assigning the final key of a new instance only at save time, for example from a number range. Lesson [147](../course/0147-rap-unmanaged-and-save.md).
