---
title: Draft handling
description: Let users save their work before it's complete.
level: pro
---

Without drafts, a RAP app saves an instance only when everything is valid: if the user closes the browser halfway through a travel with five bookings, the work is gone. With **draft handling**, every change goes first into a **draft**, a copy of the instance stored in its own table. The user can leave and come back, and the data goes into the real tables only when they choose **Save**. Fiori elements supports drafts out of the box.

## Active and draft instances

A draft-enabled business object has two kinds of instances:

| Instance | Stored in                        | Who sees it               | Must it be valid? |
| -------- | -------------------------------- | ------------------------- | ----------------- |
| Active   | the persistent table (`ztravel`) | everybody                 | yes               |
| Draft    | the draft table (`ztravel_d`)    | only the user who owns it | no                |

The life of a draft follows a few **draft actions**:

- **Edit** copies an active instance into a new draft and sets an exclusive lock on the active one.
- Every change in the UI updates the draft immediately. Determinations on modify run; failing validations don't block it.
- **Activate** runs **Prepare** (the validations and determinations you list), then copies the draft into the active instance and deletes the draft.
- **Discard** deletes the draft and releases the lock.
- **Resume** reopens an existing draft after the lock has expired, and locks the active instance again.

Creating a new travel in the UI also creates a draft first: the active instance appears only at **Activate**.

## Enable draft in the behavior definition

Start from the managed behavior definition of `ZR_Travel` from [the behavior definition](./0141-rap-behavior-definition.md) and add the draft keywords:

```abap
managed implementation in class zbp_r_travel unique;
strict ( 2 );
with draft;

define behavior for ZR_Travel alias Travel
persistent table ztravel
draft table ztravel_d
lock master total etag LastChangedAt
authorization master ( instance )
etag master LocalLastChangedAt
{
  create;
  update;
  delete;
  association _Booking { create; with draft; }

  field ( numbering : managed, readonly ) TravelUUID;
  field ( readonly ) TravelID, OverallStatus, LastChangedAt, LocalLastChangedAt;

  action acceptTravel result [1] $self;
  determination setTravelID on save { create; }
  validation validateDates on save { create; field BeginDate, EndDate; }

  draft action Edit;
  draft action Activate optimized;
  draft action Discard;
  draft action Resume;
  draft determine action Prepare
  {
    validation validateDates;
    validation Booking~validateFlightDate;
  }

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
draft table zbooking_d
lock dependent by _Travel
authorization dependent by _Travel
etag master LocalLastChangedAt
{
  update;
  delete;
  association _Travel { with draft; }

  field ( numbering : managed, readonly ) BookingUUID;
  field ( readonly ) ParentUUID;

  validation validateFlightDate on save { create; field FlightDate; }

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

What's new:

- `with draft;` in the header turns draft on for the whole business object.
- `draft table` names the draft table of each entity.
- `total etag` on the lock master is required: it's the field the framework compares at **Activate** to make sure nobody changed the active instance in the meantime. It must be updated on every change, so it's usually the `LastChangedAt` field with `@Semantics.systemDateTime.lastChangedAt: true`.
- Every association inside the business object needs `with draft;`, so that it connects drafts to drafts and active instances to active instances.
- `draft determine action Prepare` lists the validations and determinations that run before activation. A validation that isn't listed doesn't run for drafts.

## The draft table

You don't write the draft table by hand. Put the cursor on the name `ztravel_d` in the behavior definition and use the quick fix (Ctrl+1) **Create draft table**. ADT generates something like this:

```abap
@EndUserText.label : 'Draft table for ZR_TRAVEL'
@AbapCatalog.enhancement.category : #EXTENSIBLE_ANY
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table ztravel_d {
  key mandt              : mandt not null;
  key traveluuid         : sysuuid_x16 not null;
  travelid               : /dmo/travel_id;
  customerid             : /dmo/customer_id;
  begindate              : /dmo/begin_date;
  enddate                : /dmo/end_date;
  @Semantics.amount.currencyCode : 'ztravel_d.currencycode'
  totalprice             : /dmo/total_price;
  currencycode           : /dmo/currency_code;
  description            : /dmo/description;
  overallstatus          : /dmo/overall_status;
  lastchangedat          : abp_lastchange_tstmpl;
  locallastchangedat     : abp_locinst_lastchange_tstmpl;
  "%admin"               : include sych_bdl_draft_admin_inc;
}
```

The field names follow the **CDS element names**, not the columns of the persistent table, and the include `sych_bdl_draft_admin_inc` adds the administrative data (draft UUID, owner, creation and change time). When you add a field to the CDS view, regenerate the draft table with the same quick fix.

> [!WARNING]
> Never read or write draft tables with ABAP SQL. Their structure belongs to the framework and can change. Use EML: it reads and changes drafts for you.

## Drafts in the projection and in EML

The projection behavior definition must expose draft too:

```abap
projection;
strict ( 2 );
use draft;

define behavior for ZC_Travel alias Travel
{
  use create;
  use update;
  use delete;
  use action acceptTravel;

  use action Edit;
  use action Activate;
  use action Discard;
  use action Resume;
  use action Prepare;

  use association _Booking { create; with draft; }
}

define behavior for ZC_Booking alias Booking
{
  use update;
  use delete;
  use association _Travel { with draft; }
}
```

In [EML](./0143-eml.md), the key of a draft-enabled entity is `%tky`, which contains the key plus `%is_draft`. Use `%tky` instead of `%key` everywhere in the behavior pool, and the code works for both kinds of instances:

```abap
READ ENTITIES OF zr_travel IN LOCAL MODE
  ENTITY Travel
    FIELDS ( BeginDate EndDate ) WITH CORRESPONDING #( keys )
  RESULT DATA(lt_travels).

LOOP AT lt_travels INTO DATA(ls_travel) WHERE EndDate < BeginDate.
  APPEND VALUE #( %tky = ls_travel-%tky ) TO failed-travel.
ENDLOOP.
```

Outside the business object, set `%is_draft` explicitly: `if_abap_behv=>mk-on` for a draft, `if_abap_behv=>mk-off` for an active instance. To activate a draft from code, call the action: `MODIFY ENTITIES OF zr_travel ENTITY Travel EXECUTE Activate FROM VALUE #( ( %key-TravelUUID = lv_uuid ) )` and then `COMMIT ENTITIES`.

> [!TIP]
> A draft is like an email in your drafts folder. You can write it over several sessions, leave fields empty, and nobody else sees it. Only when you press **Send** does it have to be complete, and then it leaves the drafts folder for good.

## Exercise

> [!IMPORTANT]
>
> 1. Enable draft for your travel business object, generate the two draft tables, and add `use draft` to the projection.
> 2. In the Fiori preview, create a travel with an end date before the begin date, leave the page, and come back: the draft is still there.
> 3. Choose **Save** and check that the validation now stops activation with an error message.

### Solution

Use the behavior definitions above, then generate `ztravel_d` and `zbooking_d` with the quick fix and activate everything. In the preview, a new travel shows **Draft** in its status. On **Save**, `Activate` runs `Prepare`, `validateDates` fills `failed` and `reported`, and the draft stays until you fix the dates.

> [!NOTE]
>
> - With draft, changes go first into a draft table and reach the active tables only at **Activate**.
> - Add `with draft;`, a `draft table` per entity, `total etag` on the lock master, and `with draft` on every association.
> - The draft actions are `Edit`, `Activate`, `Discard`, `Resume`, and `Prepare`; list in `Prepare` the validations that must run before saving.
> - Generate draft tables with the quick fix, and never access them with ABAP SQL.
> - In EML use `%tky` and `%is_draft`, so the same code handles drafts and active instances.
