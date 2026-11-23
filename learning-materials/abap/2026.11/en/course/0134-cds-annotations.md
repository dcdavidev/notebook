---
title: CDS annotations
description: Metadata for semantics, UI, analytics, and search.
level: pro
---

An **annotation** adds metadata to a CDS entity or to one of its elements. It doesn't change the SQL that runs in the database. It tells the compiler and the frameworks what the data means: this field is an amount in that currency, this one is the text of that key, this view is an analytical cube, show this column first in the list.

The same view can serve a report, a Fiori app, a search, and an analytics query, and annotations are what each consumer reads to know how to use it.

> [!TIP]
> Annotations are like the labels on the jars in a kitchen. The jar holds the same flour with or without a label, but the label tells everybody what's inside, when it expires, and which shelf it goes on.

## Syntax and position

An annotation starts with `@`, has a dotted name, and usually a value:

```abap
@EndUserText.label: 'Flights'                        // text value
@Search.searchable: true                             // boolean
@AccessControl.authorizationCheck: #NOT_REQUIRED     // enumeration value, with #
@UI.lineItem: [ { position: 10, importance: #HIGH } ] // array of structures
@ObjectModel: { representativeKey: 'CarrierId',      // same prefix, grouped in braces
                usageType: { serviceQuality: #A } }
```

- **Entity annotations** go before `define view entity` and apply to the whole view.
- **Element annotations** go right before the element (or after it, with `@<`) and apply to that element only.
- Element annotations are **propagated**: if `ZC_FlightList` selects from `ZI_Flight`, it inherits the element annotations of `ZI_Flight`. `@Metadata.ignorePropagatedAnnotations: true` switches that off.

There are two groups. **ABAP annotations** are evaluated by the ABAP compiler and runtime: `@AccessControl`, `@EndUserText`, `@Semantics.amount`, `@Environment`, `@AbapCatalog`. **Framework-specific annotations** are only metadata stored with the view, read by a consumer such as Fiori elements (`@UI`), the analytics engine (`@Analytics`), or the search (`@Search`). A typo in a framework annotation doesn't break activation, so check it with code completion (`Ctrl+Space`).

## Semantics and texts

These annotations describe what the data means, and nearly every view needs some of them:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Airlines'
@ObjectModel.representativeKey: 'CarrierId'
@Search.searchable: true
define view entity ZI_Carrier
  as select from scarr
{
      @ObjectModel.text.element: [ 'CarrierName' ]
      @Search.defaultSearchElement: true
  key carrid   as CarrierId,
      @Semantics.text: true
      @Search.defaultSearchElement: true
      @Search.fuzzinessThreshold: 0.8
      carrname as CarrierName,
      currcode as CurrencyCode,
      url      as Url
}
```

| Annotation                                                             | Meaning                                                         |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `@EndUserText.label`                                                   | the label of the view or element, translatable                  |
| `@Semantics.amount.currencyCode: 'Currency'`                           | this element is an amount in the currency of element `Currency` |
| `@Semantics.quantity.unitOfMeasure: 'Unit'`                            | this element is a quantity in the unit of element `Unit`        |
| `@Semantics.text: true`                                                | this element is a text (a name or description)                  |
| `@ObjectModel.text.element: [ 'CarrierName' ]`                         | the text for this key is element `CarrierName`                  |
| `@Semantics.user.createdBy`, `@Semantics.systemDateTime.lastChangedAt` | administrative fields, filled by RAP                            |

## Search, value helps, and analytics

`@Search` annotations make a view usable in a free-text search. `@Search.searchable: true` on the view, `@Search.defaultSearchElement: true` on the elements to search in, and `@Search.fuzzinessThreshold` (from 0 to 1) to accept typos. Fiori elements uses them for the search field above a list.

`@Consumption` annotations describe how a consumer should offer an element, for example the value help:

```abap
      @Consumption.valueHelpDefinition: [ { entity: { name: 'ZI_Carrier', element: 'CarrierId' } } ]
  key carrid as CarrierId,
```

`@Analytics` annotations turn views into an analytical model. A **cube** holds the measures and points to **dimensions** through foreign key associations:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flight occupancy'
@Analytics.dataCategory: #CUBE
define view entity ZI_FlightCube
  as select from sflight
  association [1..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
      @ObjectModel.foreignKey.association: '_Carrier'
  key carrid   as CarrierId,
  key connid   as ConnectionId,
  key fldate   as FlightDate,
      @Aggregation.default: #SUM
      seatsmax as SeatsMax,
      @Aggregation.default: #SUM
      seatsocc as SeatsOccupied,
      _Carrier
}
```

For a full analytical model, `ZI_Carrier` gets `@Analytics.dataCategory: #DIMENSION`, and a query view on top of the cube defines rows, columns, and filters for tools such as SAP Analytics Cloud.

## UI annotations and metadata extensions

`@UI` annotations describe a Fiori elements screen: which columns the list shows (`@UI.lineItem`), which fields are filters (`@UI.selectionField`), and what the object page contains (`@UI.identification`, `@UI.facet`, `@UI.headerInfo`).

UI annotations quickly get long, so they usually live in a separate object, a **metadata extension**, instead of the view itself. The view allows it with `@Metadata.allowExtensions: true`. You'll write both in [Fiori elements apps from annotations](./0145-rap-fiori-elements.md).

> [!WARNING]
> Don't put everything in one view. Keep semantic annotations (`@Semantics`, `@ObjectModel`) in the reusable interface views, and UI and consumption annotations in the consumption layer or its metadata extensions, where only one app depends on them.

## Exercise

> [!IMPORTANT]
>
> 1. Add the annotations above to `ZI_Carrier`, activate, and open the **Active Annotations** view (right-click the source, **Open With > Active Annotations**).
> 2. In `ZI_Flight`, add `@EndUserText.label: 'Occupied seats'` to `SeatsOccupied` and check in the same view which label wins.
> 3. Create `ZI_FlightCube` and open it in the data preview.

### Solution

The **Active Annotations** view lists every annotation that applies to each element, including the propagated ones and the labels that come from the data elements. Your `@EndUserText.label` on `SeatsOccupied` replaces the label of the data element `S_SEATSOCC`: an annotation written in the view always wins over a propagated one.

> [!NOTE]
>
> - Annotations add metadata to entities and elements; they don't change the SQL.
> - Entity annotations go before `define view entity`, element annotations before the element; element annotations are propagated.
> - ABAP annotations are evaluated by the compiler; framework annotations (`@UI`, `@Analytics`, `@Search`) are read by consumers.
> - `@Semantics` and `@ObjectModel` describe amounts, quantities, texts, and keys; `@Search` and `@Consumption` serve search and value helps; `@Analytics` builds cubes and dimensions.
> - Put UI annotations in metadata extensions, not in reusable views.
