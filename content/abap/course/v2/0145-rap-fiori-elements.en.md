---
title: Fiori elements apps from annotations
description: Build the UI with metadata extensions and preview it.
---

_Pro level_

**SAP Fiori elements** builds a complete web UI from the metadata of an OData service: you don't write any JavaScript or HTML. The service tells the UI which fields to show, in which order, with which labels and filters, through **UI annotations**. With RAP you write these annotations in CDS, so the UI of your business object lives next to its data model and its behavior.

This lesson starts from the travel business object and its OData V4 service from [projections, service definitions, and bindings](./0144-rap-business-services.en.md): the root entity `ZR_Travel`, its child `ZR_Booking`, and the projections `ZC_Travel` and `ZC_Booking`.

## List report and object page

Fiori elements offers a few **floorplans**, ready-made page layouts. A transactional RAP app almost always uses two of them together:

| Floorplan     | What it shows                                                      | Main annotations                       |
| ------------- | ------------------------------------------------------------------ | -------------------------------------- |
| List report   | a filter bar and a table of instances, for example all travels     | `@UI.selectionField`, `@UI.lineItem`   |
| Object page   | one instance with a header and sections, for example one travel    | `@UI.headerInfo`, `@UI.facet`          |
| (inside both) | form fields and tables of child entities, for example its bookings | `@UI.identification`, `@UI.fieldGroup` |

The UI reads the annotations from the `$metadata` document of the service. If you change an annotation and activate it, the app picks it up the next time it loads: no build, no deployment.

## Metadata extensions

You could put the `@UI` annotations directly in the projection view, but they quickly become longer than the view itself. A **metadata extension** (`DDLX`) is a separate CDS object that holds only annotations for one entity. To allow it, the projection needs `@Metadata.allowExtensions: true`:

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
      @ObjectModel.text.element: [ 'CustomerName' ]
      @Consumption.valueHelpDefinition: [ { entity: { name: '/DMO/I_Customer', element: 'CustomerID' } } ]
      CustomerID,
      _Customer.LastName as CustomerName,
      BeginDate,
      EndDate,
      TotalPrice,
      CurrencyCode,
      Description,
      OverallStatus,
      StatusCriticality,          " 1 red, 2 yellow, 3 green: a CASE in ZR_Travel
      LocalLastChangedAt,
      _Booking : redirected to composition child ZC_Booking,
      _Customer
}
```

Keep semantic annotations such as the value help and the text element in the projection: they describe the data. Put the layout annotations in the metadata extension. In ADT, right-click the projection and choose **New Metadata Extension**:

```abap
@Metadata.layer: #CUSTOMER
@UI.headerInfo: { typeName: 'Travel',
                  typeNamePlural: 'Travels',
                  title: { type: #STANDARD, value: 'TravelID' },
                  description: { type: #STANDARD, value: 'Description' } }
annotate entity ZC_Travel with
{
  @UI.facet: [ { id: 'TravelDetails',
                 purpose: #STANDARD,
                 type: #IDENTIFICATION_REFERENCE,
                 label: 'Travel',
                 position: 10 },
               { id: 'Bookings',
                 purpose: #STANDARD,
                 type: #LINEITEM_REFERENCE,
                 label: 'Bookings',
                 position: 20,
                 targetElement: '_Booking' } ]
  @UI.hidden: true
  TravelUUID;

  @UI: { lineItem:       [ { position: 10, importance: #HIGH } ],
         identification: [ { position: 10 } ],
         selectionField: [ { position: 10 } ] }
  TravelID;

  @UI: { lineItem:       [ { position: 20, importance: #HIGH } ],
         identification: [ { position: 20 } ],
         selectionField: [ { position: 20 } ] }
  CustomerID;

  @UI: { lineItem:       [ { position: 30 } ],
         identification: [ { position: 30 } ] }
  BeginDate;

  @UI: { lineItem:       [ { position: 40 } ],
         identification: [ { position: 40 } ] }
  EndDate;

  @UI: { lineItem:       [ { position: 50 } ],
         identification: [ { position: 50 } ] }
  TotalPrice;

  @UI: { lineItem:       [ { position: 60, criticality: 'StatusCriticality' },
                           { type: #FOR_ACTION, dataAction: 'acceptTravel', label: 'Accept' } ],
         identification: [ { position: 60, criticality: 'StatusCriticality' },
                           { type: #FOR_ACTION, dataAction: 'acceptTravel', label: 'Accept' } ],
         selectionField: [ { position: 30 } ] }
  OverallStatus;

  @UI.identification: [ { position: 70 } ]
  Description;

  @UI.hidden: true
  StatusCriticality;
}
```

- `@UI.headerInfo` sets the title of the object page and the name of the table.
- `@UI.facet` builds the sections of the object page: `#IDENTIFICATION_REFERENCE` shows the fields with `@UI.identification`, and `#LINEITEM_REFERENCE` with `targetElement` shows the `@UI.lineItem` table of the child entity.
- `#FOR_ACTION` adds a button for the action `acceptTravel` from the [behavior definition](./0141-rap-behavior-definition.en.md). The action must also be in the projection behavior definition with `use action acceptTravel;`.
- `criticality` colors the field with the value of another element.

Write a second metadata extension for `ZC_Booking` with at least `@UI.lineItem` and `@UI.identification`, or the bookings table on the object page stays empty.

> [!WARNING]
> Element annotations in a metadata extension end with a semicolon after the element name, and you can only annotate elements that exist in the projection. If the app shows no columns, check that the metadata extension is active and that `@Metadata.allowExtensions: true` is in the projection.

### Layers

`@Metadata.layer` decides which metadata extension wins when several annotate the same element. From the lowest to the highest priority: `#CORE`, `#LOCALIZATION`, `#INDUSTRY`, `#PARTNER`, `#CUSTOMER`. Your own extensions use `#CUSTOMER`.

## Preview the app

1. Open the service binding of the service, for example `ZUI_TRAVEL_O4`, and make sure it's published.
2. In the **Entity Set and Association** list, select `Travel`.
3. Choose **Preview**. ADT opens the list report in the browser, with the filter bar, the table, and the **Create** button.
4. Choose **Go** to load the data, then click a row to open the object page.

The preview is for development only. To give the app to users, you generate a real Fiori elements project with SAP Fiori tools in SAP Business Application Studio or Visual Studio Code, and deploy it to the ABAP system or to SAP BTP. The project contains almost no code: it points to the service, and the annotations do the rest.

> [!TIP]
> Fiori elements is like a form printer that reads a template. You don't draw the form line by line: you fill in the template (the annotations) with what goes where, and the printer lays out every page the same way.

## Exercise

> [!IMPORTANT]
>
> 1. Create a metadata extension for `ZC_Travel` that shows travel ID, customer, dates, price, and status in the list report, with filters on travel ID and customer.
> 2. Add an object page with a **Travel** section for the fields and a **Bookings** section for the child table.
> 3. Open the preview and check that the status is colored and that the **Accept** button appears.

### Solution

Use the metadata extension above. For the bookings table, annotate `ZC_Booking`:

```abap
@Metadata.layer: #CUSTOMER
@UI.headerInfo: { typeName: 'Booking', typeNamePlural: 'Bookings',
                  title: { type: #STANDARD, value: 'BookingID' } }
annotate entity ZC_Booking with
{
  @UI.facet: [ { id: 'BookingDetails', purpose: #STANDARD,
                 type: #IDENTIFICATION_REFERENCE, label: 'Booking', position: 10 } ]
  @UI.hidden: true
  BookingUUID;

  @UI: { lineItem: [ { position: 10 } ], identification: [ { position: 10 } ] }
  BookingID;

  @UI: { lineItem: [ { position: 20 } ], identification: [ { position: 20 } ] }
  CarrierID;

  @UI: { lineItem: [ { position: 30 } ], identification: [ { position: 30 } ] }
  ConnectionID;

  @UI: { lineItem: [ { position: 40 } ], identification: [ { position: 40 } ] }
  FlightDate;

  @UI: { lineItem: [ { position: 50 } ], identification: [ { position: 50 } ] }
  FlightPrice;
}
```

> [!NOTE]
>
> - Fiori elements generates the UI from the OData metadata and its `@UI` annotations: no UI code.
> - A transactional app uses a list report (`@UI.lineItem`, `@UI.selectionField`) and an object page (`@UI.headerInfo`, `@UI.facet`, `@UI.identification`).
> - Put layout annotations in a metadata extension; the projection needs `@Metadata.allowExtensions: true`.
> - `#FOR_ACTION` adds action buttons, and `criticality` colors a field.
> - Preview the app from the service binding; for production, generate a project with SAP Fiori tools.
