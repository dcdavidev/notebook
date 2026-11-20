---
title: The behavior definition
description: Managed implementation, operations, field controls, and locking.
---

_Pro level_

The [data model](./0140-rap-data-model.en.md) says what a travel looks like. The **behavior definition** (BDEF) says what you can do with it: create, update, delete, which fields are read-only, how instances are locked, and where the business logic lives. It's a declarative source, written in the **behavior definition language**, with the same name as the root entity.

To create it in ADT, right-click `ZR_Travel` and choose **New Behavior Definition**. The wizard proposes the managed implementation type.

## A managed behavior definition

```abap
managed implementation in class zbp_r_travel unique;
strict ( 2 );

define behavior for ZR_Travel alias Travel
persistent table ztravel
lock master
authorization master ( instance )
etag master LocalLastChangedAt
{
  create;
  update;
  delete;
  association _Booking { create; }

  field ( numbering : managed, readonly ) TravelUUID;
  field ( readonly ) OverallStatus, LastChangedAt, LocalLastChangedAt;
  field ( mandatory ) CustomerID, BeginDate, EndDate;

  mapping for ztravel corresponding
  {
    TravelUUID         = travel_uuid;
    TravelID           = travel_id;
    CustomerID         = customer_id;
    BeginDate          = begin_date;
    EndDate            = end_date;
    TotalPrice         = total_price;
    CurrencyCode       = currency_code;
    Description        = description;
    OverallStatus      = overall_status;
    LastChangedAt      = last_changed_at;
    LocalLastChangedAt = local_last_changed_at;
  }
}

define behavior for ZR_Booking alias Booking
persistent table zbooking
lock dependent by _Travel
authorization dependent by _Travel
etag master LocalLastChangedAt
{
  update;
  delete;
  association _Travel;

  field ( numbering : managed, readonly ) BookingUUID;
  field ( readonly ) ParentUUID;
  field ( mandatory ) CarrierID, ConnectionID, FlightDate;

  mapping for zbooking corresponding
  {
    BookingUUID        = booking_uuid;
    ParentUUID         = parent_uuid;
    BookingID          = booking_id;
    CarrierID          = carrier_id;
    ConnectionID       = connection_id;
    FlightDate         = flight_date;
    FlightPrice        = flight_price;
    CurrencyCode       = currency_code;
    LocalLastChangedAt = local_last_changed_at;
  }
}
```

The header says that the framework implements the standard operations (`managed`), that your own code goes into the **behavior pool** `ZBP_R_TRAVEL` (`unique` means one class for the whole business object), and that the strict checks of version 2 apply. Use `strict ( 2 )` for every new BDEF: it rejects outdated syntax and patterns.

There's one `define behavior for` block per entity. `alias` gives a short name that you use in code: `Travel` instead of `ZR_Travel`.

## Persistence and operations

- `persistent table` names the table the managed framework writes to.
- `mapping for` connects the CDS element names to the table columns. With `corresponding`, fields with the same name map automatically, and you list only those that differ.
- `create`, `update`, and `delete` enable the standard operations. Leave one out, and nobody can do it, through any channel.
- `association _Booking { create; }` allows **create by association**: bookings are created only through their travel. That's why the booking entity has no `create` of its own.

> [!TIP]
> A behavior definition is like the house rules posted at a gym. It doesn't describe how the machines work inside; it says who may use which machine, which ones are off-limits, and that you must check in at the desk before you start.

## Field controls

| Control                         | Effect                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `field ( readonly )`            | consumers can't change it; only your own code in the behavior pool can                                           |
| `field ( mandatory )`           | must have a value; Fiori marks it as required. Check it in a validation too, unless your release does it for you |
| `field ( readonly : update )`   | can be set on create, not changed afterwards                                                                     |
| `field ( numbering : managed )` | the framework fills the UUID key on create                                                                       |
| `field ( features : instance )` | read-only or mandatory depending on the instance, decided in the behavior pool                                   |

Dynamic control works for operations too: `update ( features : instance );` lets the behavior pool decide, for example, that accepted travels can't be changed. You implement it in a `get_instance_features` method.

## Locking, ETags, and authorization

- `lock master` on the root: when someone changes a travel or one of its bookings, the framework sets an exclusive lock on the whole travel. `lock dependent by _Travel` on the child says which root to lock. In the managed scenario, the framework creates and uses the lock object for you.
- `etag master LocalLastChangedAt` enables **optimistic locking**: the client sends back the value it read, and RAP rejects the change if the field has changed in the meantime, because another user saved first.
- `authorization master ( instance )` means the behavior pool checks the authorization for each instance, in a method `get_instance_authorizations`. The child inherits it with `authorization dependent by _Travel`. With `( global )` instead, the check is per user, independent of the instance.

> [!WARNING]
> The lock is held only until the end of the request. RAP is stateless: a Fiori user who opens a travel and leaves the screen open doesn't block anybody, and the ETag protects them from overwriting newer data. If users need to keep unsaved changes for a long time, use [draft](./0146-rap-draft.en.md).

## Exercise

> [!IMPORTANT]
>
> 1. Create the behavior definition above for `ZR_Travel`.
> 2. Use the quick fix (`Ctrl+1`) on the `implementation in class` line to create the behavior pool `ZBP_R_TRAVEL`, and activate both.
> 3. Make `TravelID` read-only on update and `CurrencyCode` mandatory. What changes in the source?

### Solution

```abap
  field ( readonly : update ) TravelID;
  field ( mandatory ) CustomerID, BeginDate, EndDate, CurrencyCode;
```

The quick fix creates a global class `ZBP_R_TRAVEL` with `FOR BEHAVIOR OF zr_travel` in its definition, and a local handler class with an empty `get_instance_authorizations` method. Until you fill that method, every operation is allowed. [Validations, determinations, and actions](./0142-rap-validations-determinations-actions.en.md) fills the behavior pool.

> [!NOTE]
>
> - The behavior definition declares what consumers can do with a business object; it has the name of the root entity.
> - `managed implementation in class ... unique; strict ( 2 );` is the header of a new managed BDEF.
> - Each entity has `persistent table`, `mapping for`, its operations, and its field controls.
> - Children are created through `association _Child { create; }` and locked through `lock dependent by`.
> - `lock master`, `etag master`, and `authorization master` set exclusive locks, optimistic locking, and authorization checks.
