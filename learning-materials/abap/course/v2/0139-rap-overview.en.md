---
title: The RESTful Application Programming Model
description: The architecture of RAP and the objects that make up a RAP app.
---

_Pro level_

The **ABAP RESTful Application Programming Model** (**RAP**) is SAP's model for building transactional apps and APIs in modern ABAP: Fiori apps that create, change, and delete data, and OData services that other systems call. It's the standard way to develop in S/4HANA and the only one in ABAP Cloud.

RAP brings together what you've seen so far: CDS for the data model, ABAP classes for the business logic, and OData for the service. This lesson gives you the map. The next ones build a complete travel app, piece by piece.

## Why RAP

With [SAP Gateway and SEGW](./0128-odata-with-sap-gateway.en.md) you write the OData plumbing yourself: one method for each entity and operation, your own locking, your own buffering, your own save logic. RAP gives you a framework that does that work:

- the **data model** is defined once, in CDS;
- the **behavior** (what you can do with the data) is declared, not coded;
- in the **managed** scenario, the framework creates, updates, deletes, locks, and saves for you;
- you write only the business logic: checks, derived values, and actions.

> [!TIP]
> RAP is like a well-equipped kitchen in a restaurant chain. The ovens, fridges, and dishwashers are already installed and work the same everywhere (the framework). The chef only decides the recipes (the business logic), and every restaurant serves the dishes the same way (OData).

## The layers of a RAP app

| Layer                       | Objects                                                               | What it does                                                                    |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Data model                  | database tables, CDS view entities (root and child)                   | the structure of the business object and its relationships                      |
| Behavior                    | behavior definition, behavior pool (ABAP class)                       | operations, field controls, locks, validations, determinations, actions         |
| Business service projection | projection views, projection behavior definition, metadata extensions | the part of the business object one app or API uses, and its UI annotations     |
| Business service            | service definition, service binding                                   | which entities are exposed, with which protocol (OData V2 or V4, UI or Web API) |
| Consumption                 | Fiori elements app, Web API client, EML in ABAP                       | the users and programs that call the service                                    |

A **business object** (BO) is the data model plus its behavior: a tree of entities with one **root entity** (for example the travel) and **child entities** (its bookings), handled as one unit for locking and saving.

## The objects you'll create

For the travel app of the next lessons, the list looks like this:

| Object                         | Name                          | Lesson                                                                                          |
| ------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Database tables                | `ZTRAVEL`, `ZBOOKING`         | [the RAP data model](./0140-rap-data-model.en.md)                                               |
| Root and child view entities   | `ZR_Travel`, `ZR_Booking`     | [the RAP data model](./0140-rap-data-model.en.md)                                               |
| Behavior definition            | `ZR_Travel`                   | [the behavior definition](./0141-rap-behavior-definition.en.md)                                 |
| Behavior pool                  | `ZBP_R_TRAVEL`                | [validations, determinations, and actions](./0142-rap-validations-determinations-actions.en.md) |
| Projection views and behavior  | `ZC_Travel`, `ZC_Booking`     | [projections and services](./0144-rap-business-services.en.md)                                  |
| Service definition and binding | `ZUI_TRAVEL`, `ZUI_TRAVEL_O4` | [projections and services](./0144-rap-business-services.en.md)                                  |
| Metadata extensions            | `ZC_Travel`, `ZC_Booking`     | [Fiori elements apps](./0145-rap-fiori-elements.en.md)                                          |

Recent releases have a wizard that generates all of these from a database table (right-click the table in ADT, **Generate ABAP Repository Objects**). Build the objects by hand at least once, so you know what the wizard does.

## Implementation types

| Type                                      | Who does the create, update, delete, and save | Typical use                                            |
| ----------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Managed                                   | the RAP framework, on the tables you name     | new apps on new tables                                 |
| Managed with additional or unmanaged save | the framework, with your own save code        | write change documents or call existing APIs on save   |
| Unmanaged                                 | your code, for every operation                | wrap existing logic, such as BAPIs or function modules |

Both types can add **draft**, so users can save incomplete work (see [draft handling](./0146-rap-draft.en.md)). Unmanaged scenarios are in [unmanaged scenarios and additional save](./0147-rap-unmanaged-and-save.en.md).

## How a request runs

Every change to a business object goes through two phases:

1. **Interaction phase**: the requests (create, update, actions) change the **transactional buffer**, an in-memory copy of the instances. Determinations on modify run here, and nothing reaches the database yet.
2. **Save sequence**: when the request is committed, the framework runs the validations and the determinations on save, and only if everything is fine does it write the buffer to the database, all at once.

If a validation fails, nothing is saved, and the messages go back to the caller. The same phases apply when ABAP code calls the business object with the [Entity Manipulation Language](./0143-eml.en.md).

> [!WARNING]
> Inside RAP, you never write `COMMIT WORK`, `ROLLBACK WORK`, or direct `INSERT`/`UPDATE` statements on the business object's tables during the interaction phase. The framework controls the transaction; breaking that rule causes short dumps or inconsistent data.

## Exercise

> [!IMPORTANT]
>
> 1. If your system has the ABAP flight reference scenario, open the package `/DMO/FLIGHT_MANAGED` in ADT.
> 2. Find one object of each layer: a root view entity, a behavior definition, a behavior pool, a projection view, a service definition, and a service binding.
> 3. Open the service binding and start the preview of the travel entity.

### Solution

In the package, the data definitions are under **Core Data Services > Data Definitions**, the behavior definitions under **Behavior Definitions**, the behavior pools under **Source Code Library > Classes** (names starting with `/DMO/BP_`), and the services under **Business Services**. In the service binding, select the entity and choose **Preview** to open a Fiori elements app in the browser.

> [!NOTE]
>
> - RAP is the model for transactional Fiori apps and APIs in S/4HANA and ABAP Cloud.
> - Layers: data model (CDS), behavior (behavior definition and pool), projection, service definition, service binding.
> - A business object is a tree of entities with one root, locked and saved as one unit.
> - Managed RAP handles the standard operations; you write validations, determinations, and actions.
> - Changes go to the transactional buffer first; the save sequence checks and writes them all at once.
