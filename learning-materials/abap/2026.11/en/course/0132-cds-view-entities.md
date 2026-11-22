---
title: CDS view entities
description: Define data models in the database with Core Data Services.
---

_Pro level_

**Core Data Services (CDS)** let you define data models in a dedicated language, close to SQL, and store them in the ABAP repository. When you activate a CDS view, the system creates the matching view in the database, so the logic runs there: CDS is the main tool for [code pushdown](./0131-code-pushdown.md) and the foundation of Fiori apps, analytics, and RAP.

A **CDS view entity** is the current kind of CDS view. This lesson shows how to create one, what it can contain, and how to read it from ABAP.

## View entities and the older DDIC-based views

You'll meet two kinds of CDS views:

| Kind                | Statement            | Status                                                                                                         |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| CDS DDIC-based view | `define view`        | obsolete since ABAP 7.56; also creates an SQL view in the ABAP Dictionary, named in `@AbapCatalog.sqlViewName` |
| CDS view entity     | `define view entity` | the one to use: no extra Dictionary view, faster activation, stricter checks                                   |

Old code is full of `define view` with an `@AbapCatalog.sqlViewName` annotation. Read it, but create view entities for everything new. Recent releases also have a migration tool that converts DDIC-based views to view entities.

> [!TIP]
> A CDS view is like a saved search in your email program: it doesn't store messages, it stores the rule that finds them. Every time you open it, you see the current result.

## Your first view entity

CDS views are created only in ADT: right-click your package, **New > Other ABAP Repository Object > Core Data Services > Data Definition**, enter the name `ZI_FLIGHT`, and choose the template **Define View Entity**.

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flights'
define view entity ZI_Flight
  as select from sflight
{
  key carrid    as CarrierId,
  key connid    as ConnectionId,
  key fldate    as FlightDate,
      @Semantics.amount.currencyCode: 'Currency'
      price     as Price,
      currency  as Currency,
      planetype as PlaneType,
      seatsmax  as SeatsMax,
      seatsocc  as SeatsOccupied
}
where
  seatsmax > 0
```

- `define view entity` gives the name; by convention it's in CamelCase, and the repository stores it in uppercase.
- `as select from` names the **data source**: a database table, another CDS entity, or a join of several.
- The **element list** in braces is the projection list. `key` marks the key elements; `as` gives each element an alias, usually in CamelCase.
- Lines that start with `@` are **annotations**, metadata for the compiler and the frameworks: see [CDS annotations](./0134-cds-annotations.md).
- Comments use `//` for one line and `/* ... */` for several.

Press `Ctrl+F3` to activate and `F8` to open the **data preview**, where you can filter, sort, and count the rows without writing a program.

The client is handled automatically: when you read a client-dependent table, the view returns only the rows of the current client. You never select or filter `mandt`.

## Joins and the data source

The data source can be a join, written in SQL style:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flights with airline name'
define view entity ZI_FlightWithCarrier
  as select from sflight
    inner join   scarr on scarr.carrid = sflight.carrid
{
  key sflight.carrid   as CarrierId,
  key sflight.connid   as ConnectionId,
  key sflight.fldate   as FlightDate,
      scarr.carrname   as CarrierName,
      sflight.seatsocc as SeatsOccupied
}
```

Joins work, but most CDS models use **associations** instead: relationships that turn into joins only when someone needs them. They're the topic of [CDS associations](./0133-cds-associations.md). Calculated elements, `CASE`, and aggregates are in [CDS expressions, functions, and parameters](./0135-cds-expressions-and-parameters.md).

## Reading a view entity in ABAP

For ABAP SQL, a CDS view entity is just another data source. You use the entity name and the aliases:

```abap
SELECT FROM zi_flight
  FIELDS CarrierId, ConnectionId, FlightDate, SeatsMax, SeatsOccupied
  WHERE CarrierId = 'LH'
  ORDER BY FlightDate
  INTO TABLE @DATA(lt_flights).

cl_demo_output=>display( lt_flights ).
```

You can also type variables with it: `DATA ls_flight TYPE zi_flight.` declares a structure with the elements of the view.

## Naming in the virtual data model

SAP's standard CDS models follow the **virtual data model** (VDM), and custom projects often copy its prefixes:

| Prefix | Layer                                                     | Example         |
| ------ | --------------------------------------------------------- | --------------- |
| `I_`   | basic and composite (interface) views, reusable           | `ZI_Flight`     |
| `C_`   | consumption views for one app or report                   | `ZC_FlightList` |
| `R_`   | restricted reuse views, the base of a RAP business object | `ZR_Travel`     |

> [!WARNING]
> Each data definition holds exactly one entity, and the file name must match the entity name. If you rename the entity in the source, activation fails: create a new data definition instead.

## Exercise

> [!IMPORTANT]
>
> 1. Create the view entity `ZI_Connection` on `SPFLI` with the key `CarrierId` and `ConnectionId`, and the elements `CityFrom`, `CityTo`, `DepartureTime`, and `Distance` with its unit `DistanceUnit`.
> 2. Open the data preview and filter the connections from `FRANKFURT`.
> 3. Read the view in a report with ABAP SQL and show the result with `cl_demo_output`.

### Solution

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flight connections'
define view entity ZI_Connection
  as select from spfli
{
  key carrid   as CarrierId,
  key connid   as ConnectionId,
      cityfrom as CityFrom,
      cityto   as CityTo,
      deptime  as DepartureTime,
      @Semantics.quantity.unitOfMeasure: 'DistanceUnit'
      distance as Distance,
      distid   as DistanceUnit
}
```

```abap
SELECT FROM zi_connection
  FIELDS *
  WHERE CityFrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_connections).
cl_demo_output=>display( lt_connections ).
```

> [!NOTE]
>
> - A CDS view entity (`define view entity`) defines a data model that runs in the database.
> - DDIC-based views (`define view` with `@AbapCatalog.sqlViewName`) are obsolete: create view entities.
> - Create CDS views in ADT; activate with `Ctrl+F3` and check the data with the data preview (`F8`).
> - The client is handled automatically; ABAP SQL reads the view by its entity name and element aliases.
> - Follow the VDM prefixes: `I_` for reusable views, `C_` for consumption, `R_` for RAP base views.
