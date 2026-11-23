---
title: Projections, service definitions, and bindings
description: Expose a RAP business object as an OData service.
level: pro
---

The travel business object now has a [data model](./0140-rap-data-model.md), a [behavior](./0141-rap-behavior-definition.md), and [business logic](./0142-rap-validations-determinations-actions.md), but nobody outside ABAP can reach it. Three more layers turn it into an OData service: the **projection**, which picks what one app may see and do; the **service definition**, which lists the exposed entities; and the **service binding**, which chooses the protocol and publishes the service.

## Projection views

A **projection view** is a CDS view entity on top of the business object, written with `as projection on`. It can only pick, rename, and annotate elements of the base view; it can't join new sources. That keeps the business object the single source of truth, while every app gets its own tailored view.

```abap
@EndUserText.label: 'Travel projection'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
define root view entity ZC_Travel
  provider contract transactional_query
  as projection on ZR_Travel
{
  key TravelUUID,
      TravelID,
      CustomerID,
      _Customer.LastName as CustomerName,
      BeginDate,
      EndDate,
      TotalPrice,
      CurrencyCode,
      Description,
      OverallStatus,
      StatusCriticality,
      LocalLastChangedAt,
      _Booking : redirected to composition child ZC_Booking,
      _Customer
}
```

```abap
@EndUserText.label: 'Booking projection'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
define view entity ZC_Booking
  as projection on ZR_Booking
{
  key BookingUUID,
      ParentUUID,
      BookingID,
      CarrierID,
      ConnectionID,
      FlightDate,
      FlightPrice,
      CurrencyCode,
      LocalLastChangedAt,
      _Travel : redirected to parent ZC_Travel
}
```

- `provider contract transactional_query` says this projection serves a transactional OData service. It's required for the root projection in strict mode.
- `redirected to composition child` and `redirected to parent` point the compositions to the projections instead of the base views, so the whole tree is exposed at the projection level.
- `@Metadata.allowExtensions: true` lets you put the UI annotations in a metadata extension, as in [Fiori elements apps](./0145-rap-fiori-elements.md).

> [!TIP]
> The business object is a full restaurant menu. A projection is the lunch menu printed for the terrace: the same kitchen and the same dishes, but only some of them, with names chosen for those customers.

## The projection behavior definition

The projection also needs a behavior definition, which states which operations of the base behavior this app may use. Right-click `ZC_Travel` and choose **New Behavior Definition**: ADT proposes the type `projection`.

```abap
projection;
strict ( 2 );

define behavior for ZC_Travel alias Travel
use etag
{
  use create;
  use update;
  use delete;

  use action acceptTravel;

  use association _Booking { create; }
}

define behavior for ZC_Booking alias Booking
use etag
{
  use update;
  use delete;

  use association _Travel;
}
```

`use` can only reuse what the base behavior offers; it can't add new logic. To build a read-only app on the same business object, write another projection without `use create`, `use update`, and `use delete`.

## The service definition

A **service definition** lists the entities that a service exposes, under the names consumers will see:

```abap
@EndUserText.label: 'Travel service'
define service ZUI_TRAVEL {
  expose ZC_Travel       as Travel;
  expose ZC_Booking      as Booking;
  expose /DMO/I_Customer as Customer;
}
```

Expose every entity the app needs, including the targets of value helps and associations such as `/DMO/I_Customer`. Entities that aren't exposed simply don't exist for the consumer.

## The service binding

The **service binding** connects the service definition to a protocol. In ADT, right-click `ZUI_TRAVEL` and choose **New Service Binding**:

| Binding type       | Use it for                                     |
| ------------------ | ---------------------------------------------- |
| OData V4 - UI      | Fiori elements apps (the current choice)       |
| OData V2 - UI      | Fiori apps that still need OData V2            |
| OData V4 - Web API | APIs for other systems, without UI annotations |
| OData V2 - Web API | APIs for systems that only speak OData V2      |

Name the binding `ZUI_TRAVEL_O4`, choose **OData V4 - UI**, activate it, and press **Publish**. ADT then shows the service URL and the exposed entities. Select `Travel` and press **Preview** to open a Fiori elements app in the browser, where you can create, change, delete, and accept travels.

> [!WARNING]
> On an on-premise system, **Publish** registers the service in SAP Gateway, and that's a change that needs authorization and, in some landscapes, a transport of its own. If the button is greyed out or fails, ask your Basis team; for OData V4 the registration is in transaction `/IWFND/V4_ADMIN`.

## Exercise

> [!IMPORTANT]
>
> 1. Create `ZC_Travel`, `ZC_Booking`, the projection behavior definition, the service definition `ZUI_TRAVEL`, and the binding `ZUI_TRAVEL_O4`.
> 2. Publish the binding and open the preview. Create a travel with an end date before the begin date and check the error message.
> 3. Create a second binding of type **OData V4 - Web API** on the same service definition and open its `$metadata` document.

### Solution

The preview shows an empty list at first: press **Go** to load the data. When you save the wrong travel, the message from `validateDates` appears and the end date field is highlighted, because the validation sets `%element-EndDate`. The Web API binding exposes the same entities and operations, but its `$metadata` contains no UI annotations.

> [!NOTE]
>
> - Projection views (`as projection on`) select and rename elements of the business object for one app; the root needs `provider contract transactional_query`.
> - Compositions are redirected with `redirected to composition child` and `redirected to parent`.
> - The projection behavior definition reuses operations and actions with `use`.
> - The service definition exposes entities with `expose ... as ...`, including value help targets.
> - The service binding chooses OData V2 or V4, UI or Web API; publish it and use **Preview** to test.
