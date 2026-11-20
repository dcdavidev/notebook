---
title: The RAP data model
description: Database tables, root and child entities, and compositions.
---

_Pro level_

Every RAP business object starts from its **data model**: the database tables that store the data, and the CDS view entities that describe the business object as a tree. This lesson builds the data model of the travel app: a travel with its bookings.

The [RAP overview](./0139-rap-overview.en.md) gives the big picture; here you write the first objects.

## The database tables

A managed business object needs its own tables. You create them in ADT as a **database table** (**New > Other ABAP Repository Object > Dictionary > Database Table**), written in DDL source code:

```abap
@EndUserText.label : 'Travel'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table ztravel {
  key client            : abap.clnt not null;
  key travel_uuid       : sysuuid_x16 not null;
  travel_id             : /dmo/travel_id;
  customer_id           : /dmo/customer_id;
  begin_date            : /dmo/begin_date;
  end_date              : /dmo/end_date;
  @Semantics.amount.currencyCode : 'ztravel.currency_code'
  total_price           : /dmo/total_price;
  currency_code         : /dmo/currency_code;
  description           : /dmo/description;
  overall_status        : /dmo/overall_status;
  last_changed_at       : abp_lastchange_tstmpl;
  local_last_changed_at : abp_locinst_lastchange_tstmpl;
}
```

```abap
@EndUserText.label : 'Booking'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zbooking {
  key client            : abap.clnt not null;
  key booking_uuid      : sysuuid_x16 not null;
  parent_uuid           : sysuuid_x16;
  booking_id            : /dmo/booking_id;
  carrier_id            : /dmo/carrier_id;
  connection_id         : /dmo/connection_id;
  flight_date           : /dmo/flight_date;
  @Semantics.amount.currencyCode : 'zbooking.currency_code'
  flight_price          : /dmo/flight_price;
  currency_code         : /dmo/currency_code;
  local_last_changed_at : abp_locinst_lastchange_tstmpl;
}
```

- The key is a **UUID** (`sysuuid_x16`), a technical 16-byte ID that RAP can generate on create. The readable number, `travel_id`, is a normal field.
- `parent_uuid` links each booking to its travel.
- The two **timestamps** are for RAP: `last_changed_at` for the whole business object, `local_last_changed_at` for each instance. RAP uses them for optimistic locking with ETags.
- The data elements come from the `/DMO/` flight model. Without it, use your own data elements or built-in types.

> [!TIP]
> The UUID and the travel number are like a passport's chip and its printed number. The chip identifies it uniquely for the machines; the printed number is what people read and type.

## The root entity

The business object is described by CDS view entities on top of the tables. The **root entity** is marked with `define root view entity`, and it declares its children with a **composition**:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Travel'
define root view entity ZR_Travel
  as select from ztravel
  composition [0..*] of ZR_Booking      as _Booking
  association [0..1] to /DMO/I_Customer as _Customer
    on $projection.CustomerID = _Customer.CustomerID
{
  key travel_uuid           as TravelUUID,
      travel_id             as TravelID,
      customer_id           as CustomerID,
      begin_date            as BeginDate,
      end_date              as EndDate,
      @Semantics.amount.currencyCode: 'CurrencyCode'
      total_price           as TotalPrice,
      currency_code         as CurrencyCode,
      description           as Description,
      overall_status        as OverallStatus,
      case overall_status
        when 'O' then 2      // open: yellow
        when 'A' then 3      // accepted: green
        when 'X' then 1      // rejected: red
        else 0
      end                   as StatusCriticality,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at       as LastChangedAt,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      _Booking,
      _Customer
}
```

A **composition** is a special association: the bookings exist only as part of a travel. Deleting the travel deletes its bookings, and locking the travel locks them too. Unlike a normal association, a composition has no `on` condition: the child defines it.

The `@Semantics.systemDateTime` annotations tell RAP to fill the timestamps automatically on every change.

## The child entity

The child is a normal view entity with an association **to parent**:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Booking'
define view entity ZR_Booking
  as select from zbooking
  association to parent ZR_Travel as _Travel
    on $projection.ParentUUID = _Travel.TravelUUID
{
  key booking_uuid          as BookingUUID,
      parent_uuid           as ParentUUID,
      booking_id            as BookingID,
      carrier_id            as CarrierID,
      connection_id         as ConnectionID,
      flight_date           as FlightDate,
      @Semantics.amount.currencyCode: 'CurrencyCode'
      flight_price          as FlightPrice,
      currency_code         as CurrencyCode,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      _Travel
}
```

The pair `composition of` in the parent and `association to parent` in the child builds the tree. Both must be exposed in the element lists. A child can itself have children, with more compositions, but every business object has exactly one root.

> [!WARNING]
> Activate the two views together (`Ctrl+Shift+F3`, activate all): the root refers to the child and the child refers to the root, so activating one alone fails.

## Exercise

> [!IMPORTANT]
>
> 1. Create the tables `ZTRAVEL` and `ZBOOKING` and the view entities `ZR_Travel` and `ZR_Booking` in your package.
> 2. Fill a few rows with a class that implements `if_oo_adt_classrun`, generating the UUIDs with `cl_system_uuid=>create_uuid_x16_static( )`.
> 3. Open `ZR_Travel` in the data preview and follow the association `_Booking` to the bookings of one travel.

### Solution

```abap
METHOD if_oo_adt_classrun~main.
  DELETE FROM ztravel.
  DELETE FROM zbooking.

  TRY.
      DATA(lv_travel_uuid) = cl_system_uuid=>create_uuid_x16_static( ).

      INSERT ztravel FROM @( VALUE ztravel( travel_uuid    = lv_travel_uuid
                                            travel_id      = '00000001'
                                            customer_id    = '000001'
                                            begin_date     = '20250601'
                                            end_date       = '20250610'
                                            total_price    = '1200.00'
                                            currency_code  = 'EUR'
                                            description    = 'Business trip'
                                            overall_status = 'O' ) ).

      INSERT zbooking FROM @( VALUE zbooking( booking_uuid  = cl_system_uuid=>create_uuid_x16_static( )
                                              parent_uuid   = lv_travel_uuid
                                              booking_id    = '0001'
                                              carrier_id    = 'LH'
                                              connection_id = '0400'
                                              flight_date   = '20250601'
                                              flight_price  = '600.00'
                                              currency_code = 'EUR' ) ).
      out->write( |{ sy-dbcnt } booking inserted| ).
    CATCH cx_uuid_error INTO DATA(lx_uuid).
      out->write( lx_uuid->get_text( ) ).
  ENDTRY.
ENDMETHOD.
```

In the data preview, right-click a travel row and choose **Follow Association > \_Booking**.

> [!NOTE]
>
> - A managed business object has its own tables, usually with UUID keys and timestamps for RAP.
> - The root entity uses `define root view entity` and declares its children with `composition [0..*] of`.
> - Each child has `association to parent` with the `on` condition to the root's key.
> - Compositions mean ownership: children are created, locked, and deleted with their parent.
> - `@Semantics.systemDateTime` annotations let RAP fill the change timestamps automatically.
