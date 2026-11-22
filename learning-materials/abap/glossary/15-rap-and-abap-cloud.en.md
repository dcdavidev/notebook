---
title: RAP, ABAP Cloud, and beyond
description: The RESTful Application Programming Model, ABAP Cloud, and advanced techniques.
---

**ABAP channels**: the framework for event-based communication: _ABAP Messaging Channels_ (AMC) between sessions and _ABAP Push Channels_ (APC) to the browser over WebSocket. Lesson [150](../course/v2/0150-abap-channels.en.md).

**ABAP Cloud**: the development model that uses only released APIs and the restricted language version, for upgrade-safe extensions and a _clean core_. Lesson [148](../course/v2/0148-abap-cloud.en.md).

**abapGit**: an open-source Git client written in ABAP, for putting development objects under version control. Lesson [151](../course/v2/0151-abapgit.en.md).

**Action (RAP)**: a non-standard operation of a RAP business object, such as "Approve", implemented in the behavior implementation. Lesson [142](../course/v2/0142-rap-validations-determinations-actions.en.md).

**Behavior definition**: the RAP object that declares what a business object can do: operations, fields, validations, determinations, actions, drafts. Lesson [141](../course/v2/0141-rap-behavior-definition.en.md).

**Behavior pool**: the global class that holds the behavior implementation of a RAP business object. Lesson [141](../course/v2/0141-rap-behavior-definition.en.md).

**Business object (RAP)**: a business entity (or tree of entities) with data, behavior, and services, built with RAP. Lesson [139](../course/v2/0139-rap-overview.en.md).

**Clean core**: the principle that extensions don't modify SAP standard code and use only released interfaces, so upgrades stay simple. Lesson [148](../course/v2/0148-abap-cloud.en.md).

**Determination**: in RAP, logic that automatically computes some field values when the data changes. Lesson [142](../course/v2/0142-rap-validations-determinations-actions.en.md).

**Draft**: in RAP, a working copy of the data that the user edits and saves later, without losing it when closing the app. Lesson [146](../course/v2/0146-rap-draft.en.md).

**EML (Entity Manipulation Language)**: the part of ABAP that reads and changes RAP business objects: `READ ENTITIES`, `MODIFY ENTITIES`, `COMMIT ENTITIES`. Lesson [143](../course/v2/0143-eml.en.md).

**Fiori elements**: the SAP Fiori framework that generates apps (list reports, object pages) from an OData service and its annotations. Lesson [145](../course/v2/0145-rap-fiori-elements.en.md).

**Projection (RAP)**: the layer of CDS views and behavior on top of the data model that decides what a specific service exposes. Lesson [144](../course/v2/0144-rap-business-services.en.md).

**RAP (RESTful Application Programming Model)**: SAP's modern programming model for building OData services and Fiori apps with CDS, behavior definitions, and EML. Lesson [139](../course/v2/0139-rap-overview.en.md).

**RAP data model**: the CDS views that describe the entities of a RAP business object and their parent-child relationships (_composition_). Lesson [140](../course/v2/0140-rap-data-model.en.md).

**Service binding**: the RAP object that publishes a service definition with a protocol, such as OData V2 or V4, for UI or API use. Lesson [144](../course/v2/0144-rap-business-services.en.md).

**Service definition**: the RAP object that lists the CDS entities a service exposes. Lesson [144](../course/v2/0144-rap-business-services.en.md).

**Shared object**: an object stored in the application server's shared memory and read by several programs and users. Lesson [149](../course/v2/0149-shared-objects.en.md).

**Unmanaged (RAP)**: the RAP scenario where you write the save logic yourself, usually to reuse existing code; with _additional save_ you add logic to a managed scenario. Lesson [147](../course/v2/0147-rap-unmanaged-and-save.en.md).

**Validation**: in RAP, a check on the data that blocks the save and returns a message if the values are not valid. Lesson [142](../course/v2/0142-rap-validations-determinations-actions.en.md).
