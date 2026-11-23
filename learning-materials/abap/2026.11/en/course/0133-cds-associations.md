---
title: CDS associations
description: Relationships between entities, path expressions, and exposure.
level: pro
---

An **association** declares a relationship between two CDS entities: a flight belongs to an airline, an airline has many connections. Unlike a join, an association is only a definition. The database joins the two sources **only when someone uses the association**, and only with the fields they ask for.

Associations are how CDS models are built: SAP's virtual data model is a network of views linked by associations, and RAP, Fiori elements, and analytics all navigate them.

> [!TIP]
> A join is like booking a taxi for every trip you might take during the day. An association is like having the taxi app on your phone: you call a car only when you actually need to go somewhere.

## Defining an association

The examples use `ZI_Connection` from [CDS view entities](./0132-cds-view-entities.md) and a small airline view:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Airlines'
define view entity ZI_Carrier
  as select from scarr
  association [0..*] to ZI_Connection as _Connection
    on $projection.CarrierId = _Connection.CarrierId
{
  key carrid   as CarrierId,
      carrname as CarrierName,
      currcode as CurrencyCode,
      url      as Url,
      _Connection                       // exposed association
}
```

Now the flight view, with two associations to one:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flights'
define view entity ZI_Flight
  as select from sflight
  association [1..1] to ZI_Carrier    as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
  association [1..1] to ZI_Connection as _Connection
    on  $projection.CarrierId    = _Connection.CarrierId
    and $projection.ConnectionId = _Connection.ConnectionId
{
  key carrid               as CarrierId,
  key connid               as ConnectionId,
  key fldate               as FlightDate,
      seatsmax             as SeatsMax,
      seatsocc             as SeatsOccupied,
      _Carrier.CarrierName as CarrierName,   // path expression: becomes a join
      _Carrier,                              // exposed
      _Connection                            // exposed
}
```

- The association goes between the data source and the element list: `association [cardinality] to target as _Alias on condition`.
- By convention, association names start with an underscore.
- `$projection.CarrierId` refers to an element of this view by its alias. You can also use the source field directly (`sflight.carrid`).
- The **cardinality** says how many target rows match one source row.

| Cardinality | Meaning              |
| ----------- | -------------------- |
| `[0..1]`    | zero or one (to one) |
| `[1..1]`    | exactly one          |
| `[0..*]`    | any number (to many) |
| `[1..*]`    | at least one         |

`[1]` alone is short for `[0..1]`, and no cardinality means `[0..1]`. Recent releases also accept a more readable form such as `association of many to one ZI_Carrier as _Carrier`.

> [!WARNING]
> The cardinality is a promise, not a check. If you declare `[0..1]` and the data has several matching rows, every path through the association multiplies your result rows without any error. Declare the cardinality the data really has.

## Path expressions

A **path expression** follows an association to read a field of the target: `_Carrier.CarrierName`. When the view uses it in the element list, the system adds a `LEFT OUTER JOIN` to the generated SQL. Associations you don't use cost nothing.

You can follow several associations in a row, add a filter, and change the join type:

```abap
  _Connection._Carrier.CarrierName                 // two steps (see the exercise)
  _Carrier[ CurrencyCode = 'EUR' ].CarrierName     // filter on the target
  _Carrier[ inner ].CarrierName                    // INNER instead of LEFT OUTER JOIN
```

A path through a to-many association, such as `_Connection.CityTo` in `ZI_Carrier`, returns one row per connection, not one per airline. Use it on purpose, or add a filter that leaves a single row: `_Connection[1: CityFrom = 'FRANKFURT'].CityTo`, where `1:` declares the filtered result as to one.

## Exposing associations

Listing the association name in the element list, like `_Carrier` above, **exposes** it: anyone who reads the view can navigate it further. Exposure doesn't add a join by itself. To expose an association, every field of the source that its `on` condition uses must also be in the element list.

In ABAP SQL, you navigate an exposed association with a backslash and a hyphen:

```abap
SELECT FROM zi_flight
  FIELDS CarrierId,
         ConnectionId,
         FlightDate,
         \_Carrier-CarrierName AS CarrierName,
         \_Connection-CityFrom AS CityFrom,
         \_Connection-CityTo   AS CityTo
  WHERE CarrierId = 'LH'
  INTO TABLE @DATA(lt_flights).
```

Other CDS views on top of `ZI_Flight` can use `_Carrier` and `_Connection` in the same way. Fiori elements apps follow exposed associations for navigation and value helps, and RAP uses special associations, compositions and `to parent`, to build business objects (see [the RAP data model](./0140-rap-data-model.md)).

## Exercise

> [!IMPORTANT]
>
> 1. Add to `ZI_Connection` an association `_Carrier` to `ZI_Carrier`, expose it, and add the element `CarrierName` with a path expression.
> 2. In a report, read the connections from `FRANKFURT` with the airline's URL through `\_Carrier-Url`.
> 3. In `ZI_Carrier`, add `_Connection.CityTo` to the element list and compare the number of rows in the data preview before and after.

### Solution

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flight connections'
define view entity ZI_Connection
  as select from spfli
  association [1..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
  key carrid               as CarrierId,
  key connid               as ConnectionId,
      cityfrom             as CityFrom,
      cityto               as CityTo,
      // ... the other elements from the previous lesson
      _Carrier.CarrierName as CarrierName,
      _Carrier
}
```

```abap
SELECT FROM zi_connection
  FIELDS CarrierId, ConnectionId, CityTo, \_Carrier-Url AS Url
  WHERE CityFrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_connections).
```

In step 3 the number of rows grows from one per airline to one per connection: the to-many path multiplies the rows. Remove the element again afterwards. `ZI_Carrier` and `ZI_Connection` can point at each other; CDS allows cyclic associations as long as you don't follow them in a loop.

> [!NOTE]
>
> - An association declares a relationship; the join happens only when a path expression uses it.
> - Syntax: `association [cardinality] to target as _Alias on $projection.field = _Alias.field`.
> - Cardinality is a promise: wrong values multiply rows silently.
> - Path expressions can chain associations, filter the target, and choose the join type.
> - Exposed associations can be navigated by other CDS views and by ABAP SQL with `\_Alias-field`.
