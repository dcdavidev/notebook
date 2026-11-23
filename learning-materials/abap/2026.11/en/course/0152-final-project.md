---
title: Final project
description: Build a complete app that uses what you learned in every level.
level: pro
---

The final project is a complete **flight booking app**: travel agents create travels for customers, add flight bookings, see the total price, and accept the travel. You build it end to end, from the database tables to a Fiori elements UI, and every step uses lessons from all four levels. There's no new syntax here: when a step feels unfamiliar, follow the link back to the lesson that covers it.

You need a system with ABAP Development Tools and the `/DMO/` flight reference scenario, which you can install with [abapGit](./0151-abapgit.md). All objects go into one package, for example `ZFB`, with a transport request (see [packages and transport requests](./0007-packages-and-transport-requests.md)).

## What you build

| Part               | Objects                                                                 | Lessons it relies on                                                                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data model         | tables `ZFB_TRAVEL`, `ZFB_BOOKING`; CDS `ZR_FB_Travel`, `ZR_FB_Booking` | [data types](./0017-types-and-like.md), [database tables](./0046-database-tables.md), [CDS view entities](./0132-cds-view-entities.md), [RAP data model](./0140-rap-data-model.md)                                                                                              |
| Business logic     | behavior definition, behavior pool, `ZCL_FB_PRICE_CALCULATOR`           | [classes](./0076-classes-and-objects.md), [FOR and REDUCE](./0093-for-and-reduce.md), [behavior definition](./0141-rap-behavior-definition.md), [validations and actions](./0142-rap-validations-determinations-actions.md), [EML](./0143-eml.md), [draft](./0146-rap-draft.md) |
| Tests and quality  | ABAP Unit test class, ATC run                                           | [ABAP Unit](./0105-abap-unit-basics.md), [code quality](./0107-code-quality.md)                                                                                                                                                                                                 |
| Service and UI     | projections, metadata extensions, service `ZUI_FB_TRAVEL_O4`            | [business services](./0144-rap-business-services.md), [Fiori elements](./0145-rap-fiori-elements.md)                                                                                                                                                                            |
| Back-office report | report `ZFB_TRAVEL_OVERVIEW`                                            | [selection screens](./0063-parameters.md), [SELECT](./0052-select-basics.md), [messages](./0061-messages.md), [ALV](./0099-alv-with-salv.md)                                                                                                                                    |

## The data model

### Database tables

Create two tables in ADT. Each travel has a UUID as technical key, a readable travel number, dates, a price, and the administrative fields that RAP fills by itself:

```abap
@EndUserText.label : 'Flight booking app: travels'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zfb_travel {
  key client            : abap.clnt not null;
  key travel_uuid       : sysuuid_x16 not null;
  travel_id             : /dmo/travel_id;
  customer_id           : /dmo/customer_id;
  begin_date            : /dmo/begin_date;
  end_date              : /dmo/end_date;
  @Semantics.amount.currencyCode : 'zfb_travel.currency_code'
  total_price           : /dmo/total_price;
  currency_code         : /dmo/currency_code;
  description           : /dmo/description;
  overall_status        : /dmo/overall_status;
  local_created_by      : abp_creation_user;
  local_created_at      : abp_creation_tstmpl;
  local_last_changed_by : abp_locinst_lastchange_user;
  local_last_changed_at : abp_locinst_lastchange_tstmpl;
  last_changed_at       : abp_lastchange_tstmpl;
}
```

`ZFB_BOOKING` has the same header annotations and these fields: `client`, `booking_uuid` (key), `parent_uuid` (the UUID of the travel), `booking_id` (`/dmo/booking_id`), `carrier_id`, `connection_id`, `flight_date`, `flight_price` (with its currency annotation), `currency_code`, and `local_last_changed_at`.

### CDS view entities

The root entity reads the travels, adds a criticality for the status, and defines the composition to the bookings:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Travel'
define root view entity ZR_FB_Travel
  as select from zfb_travel
  composition [0..*] of ZR_FB_Booking as _Booking
  association [0..1] to /DMO/I_Customer as _Customer on $projection.CustomerID = _Customer.CustomerID
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
        when 'A' then 3      -- accepted: green
        when 'X' then 1      -- cancelled: red
        else 2               -- open: yellow
      end                   as StatusCriticality,
      @Semantics.user.createdBy: true
      local_created_by      as LocalCreatedBy,
      @Semantics.systemDateTime.createdAt: true
      local_created_at      as LocalCreatedAt,
      @Semantics.user.localInstanceLastChangedBy: true
      local_last_changed_by as LocalLastChangedBy,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at       as LastChangedAt,
      _Booking,
      _Customer
}
```

`ZR_FB_Booking` is a `define view entity` on `zfb_booking` with `association to parent ZR_FB_Travel as _Travel on $projection.ParentUUID = _Travel.TravelUUID`, the fields renamed in camel case (`BookingUUID`, `ParentUUID`, `BookingID`, `CarrierID`, `ConnectionID`, `FlightDate`, `FlightPrice`, `CurrencyCode`, `LocalLastChangedAt`), and `_Travel` exposed.

## The business object

### Behavior definition

A managed business object with draft, two determinations, a validation, and an action:

```abap
managed implementation in class zbp_r_fb_travel unique;
strict ( 2 );
with draft;

define behavior for ZR_FB_Travel alias Travel
persistent table zfb_travel
draft table zfb_travel_d
lock master total etag LastChangedAt
authorization master ( instance )
etag master LocalLastChangedAt
{
  create;
  update;
  delete;
  association _Booking { create; with draft; }

  field ( numbering : managed, readonly ) TravelUUID;
  field ( readonly ) TravelID, TotalPrice, OverallStatus, StatusCriticality, LocalCreatedBy,
                     LocalCreatedAt, LocalLastChangedBy, LocalLastChangedAt, LastChangedAt;
  field ( mandatory ) CustomerID, BeginDate, EndDate, CurrencyCode;

  action acceptTravel result [1] $self;
  determination setInitialValues on modify { create; }
  validation validateDates on save { create; field BeginDate, EndDate; }

  draft action Edit;
  draft action Activate optimized;
  draft action Discard;
  draft action Resume;
  draft determine action Prepare { validation validateDates; }

  mapping for zfb_travel corresponding
  {
    TravelUUID = travel_uuid; TravelID = travel_id; CustomerID = customer_id;
    BeginDate = begin_date; EndDate = end_date; TotalPrice = total_price;
    CurrencyCode = currency_code; Description = description; OverallStatus = overall_status;
    LocalCreatedBy = local_created_by; LocalCreatedAt = local_created_at;
    LocalLastChangedBy = local_last_changed_by; LocalLastChangedAt = local_last_changed_at;
    LastChangedAt = last_changed_at;
  }
}

define behavior for ZR_FB_Booking alias Booking
persistent table zfb_booking
draft table zfb_booking_d
lock dependent by _Travel
authorization dependent by _Travel
etag master LocalLastChangedAt
{
  update;
  delete;
  association _Travel { with draft; }

  field ( numbering : managed, readonly ) BookingUUID;
  field ( readonly ) ParentUUID;
  field ( mandatory ) BookingID, CarrierID, ConnectionID, FlightDate;

  determination recalcTotalPrice on modify { create; field FlightPrice; }

  mapping for zfb_booking corresponding
  {
    BookingUUID = booking_uuid; ParentUUID = parent_uuid; BookingID = booking_id;
    CarrierID = carrier_id; ConnectionID = connection_id; FlightDate = flight_date;
    FlightPrice = flight_price; CurrencyCode = currency_code;
    LocalLastChangedAt = local_last_changed_at;
  }
}
```

Generate the draft tables and the behavior pool with the quick fixes.

### The price calculator and its test

Keep the business rule out of the behavior pool, in a plain class that you can test without a database: the total is the sum of the flight prices plus a flat service fee.

```abap
CLASS zcl_fb_price_calculator DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    TYPES tt_prices TYPE STANDARD TABLE OF /dmo/flight_price WITH EMPTY KEY.
    CONSTANTS c_service_fee TYPE /dmo/total_price VALUE '25.00'.
    CLASS-METHODS total IMPORTING it_prices       TYPE tt_prices
                        RETURNING VALUE(rv_total) TYPE /dmo/total_price.
ENDCLASS.

CLASS zcl_fb_price_calculator IMPLEMENTATION.
  METHOD total.
    rv_total = REDUCE #( INIT lv_sum TYPE /dmo/total_price
                         FOR lv_price IN it_prices
                         NEXT lv_sum = lv_sum + lv_price ).
    IF rv_total > 0.
      rv_total = rv_total + c_service_fee.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

In the **Test Classes** tab of the same class:

```abap
CLASS ltc_price_calculator DEFINITION FINAL FOR TESTING DURATION SHORT RISK LEVEL HARMLESS.
  PRIVATE SECTION.
    METHODS sums_prices_and_adds_fee FOR TESTING.
    METHODS empty_travel_costs_nothing FOR TESTING.
ENDCLASS.

CLASS ltc_price_calculator IMPLEMENTATION.
  METHOD sums_prices_and_adds_fee.
    cl_abap_unit_assert=>assert_equals(
      act = zcl_fb_price_calculator=>total( VALUE #( ( '100.00' ) ( '250.50' ) ) )
      exp = CONV /dmo/total_price( '375.50' ) ).
  ENDMETHOD.

  METHOD empty_travel_costs_nothing.
    cl_abap_unit_assert=>assert_equals(
      act = zcl_fb_price_calculator=>total( VALUE #( ) )
      exp = CONV /dmo/total_price( 0 ) ).
  ENDMETHOD.
ENDCLASS.
```

### The behavior pool

The handler for travels gives each new travel a number and the status `O` (open), checks the dates, and implements the action. Declare the methods with the quick fix, then fill them:

```abap
METHOD setInitialValues.
  READ ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel FIELDS ( TravelID ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_travels).
  DELETE lt_travels WHERE TravelID IS NOT INITIAL.
  CHECK lt_travels IS NOT INITIAL.

  " simple numbering; a real app uses a number range (lesson 111)
  SELECT SINGLE FROM zfb_travel FIELDS MAX( travel_id ) INTO @DATA(lv_max_id).

  MODIFY ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel UPDATE FIELDS ( TravelID OverallStatus )
    WITH VALUE #( FOR ls_travel IN lt_travels INDEX INTO lv_index
                  ( %tky = ls_travel-%tky TravelID = lv_max_id + lv_index OverallStatus = 'O' ) ).
ENDMETHOD.

METHOD validateDates.
  READ ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel FIELDS ( BeginDate EndDate ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_travels).

  LOOP AT lt_travels INTO DATA(ls_travel).
    APPEND VALUE #( %tky = ls_travel-%tky %state_area = 'VALIDATE_DATES' ) TO reported-travel.
    IF ls_travel-EndDate < ls_travel-BeginDate.
      APPEND VALUE #( %tky = ls_travel-%tky ) TO failed-travel.
      APPEND VALUE #( %tky             = ls_travel-%tky
                      %state_area      = 'VALIDATE_DATES'
                      %msg             = new_message_with_text(
                                           severity = if_abap_behv_message=>severity-error
                                           text     = 'The end date is before the begin date' )
                      %element-EndDate = if_abap_behv=>mk-on ) TO reported-travel.
    ENDIF.
  ENDLOOP.
ENDMETHOD.

METHOD acceptTravel.
  MODIFY ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel UPDATE FIELDS ( OverallStatus )
    WITH VALUE #( FOR ls_key IN keys ( %tky = ls_key-%tky OverallStatus = 'A' ) ).

  READ ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel ALL FIELDS WITH CORRESPONDING #( keys )
    RESULT DATA(lt_travels).
  result = VALUE #( FOR ls_travel IN lt_travels ( %tky = ls_travel-%tky %param = ls_travel ) ).
ENDMETHOD.
```

The handler for bookings recalculates the total of the parent travel with the calculator class. For simplicity, it assumes that all bookings of a travel use the travel's currency:

```abap
METHOD recalcTotalPrice.
  READ ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Booking BY \_Travel FIELDS ( TravelUUID ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_travels).

  READ ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel BY \_Booking FIELDS ( ParentUUID FlightPrice ) WITH CORRESPONDING #( lt_travels )
    RESULT DATA(lt_bookings).

  MODIFY ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel UPDATE FIELDS ( TotalPrice )
    WITH VALUE #( FOR ls_travel IN lt_travels
                  ( %tky       = ls_travel-%tky
                    TotalPrice = zcl_fb_price_calculator=>total(
                                   VALUE #( FOR ls_booking IN lt_bookings
                                            WHERE ( ParentUUID = ls_travel-TravelUUID
                                                    AND %is_draft = ls_travel-%is_draft )
                                            ( ls_booking-FlightPrice ) ) ) ) ).
ENDMETHOD.
```

Leave `get_instance_authorizations` empty for now: every user may do everything. Adding real checks is part of the exercise.

## The service and the app

1. Create the projections `ZC_FB_Travel` (with `provider contract transactional_query` and `@Metadata.allowExtensions: true`) and `ZC_FB_Booking`, and the projection behavior definition with `use draft`, the `use` statements for the operations, `use action acceptTravel`, and the draft actions, as in [draft handling](./0146-rap-draft.md).
2. Write the metadata extensions for both projections, with the list report, the object page, the status criticality, and the **Accept** button, as in [Fiori elements apps](./0145-rap-fiori-elements.md).
3. Create the service definition and an OData V4 UI binding:

```abap
@EndUserText.label: 'Flight booking app'
define service ZUI_FB_TRAVEL {
  expose ZC_FB_Travel  as Travel;
  expose ZC_FB_Booking as Booking;
  expose /DMO/I_Customer as Customer;
}
```

4. Publish the binding `ZUI_FB_TRAVEL_O4` and open the preview. Create a travel, add two bookings, watch the total price change, save, and accept the travel.

On a system with Standard ABAP, the back office can read the same data with a classic report. The CDS view is the single source of truth for both:

```abap
REPORT zfb_travel_overview.

PARAMETERS p_status TYPE /dmo/overall_status DEFAULT 'O'.

START-OF-SELECTION.
  SELECT TravelID, CustomerID, BeginDate, EndDate, TotalPrice, CurrencyCode
    FROM zr_fb_travel
    WHERE OverallStatus = @p_status
    ORDER BY BeginDate
    INTO TABLE @DATA(lt_travels).
  IF sy-subrc <> 0.
    MESSAGE 'No travels found' TYPE 'S' DISPLAY LIKE 'W'.
    RETURN.
  ENDIF.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = lt_travels ).
      lo_alv->display( ).
    CATCH cx_salv_msg INTO DATA(lx_error).
      MESSAGE lx_error TYPE 'E'.
  ENDTRY.
```

## Check and share

Before you call the app done:

- Run the unit tests with Ctrl+Shift+F10 and fix any failure.
- Run the ATC on the package and remove the findings (see [code quality](./0107-code-quality.md)).
- Step through the determination `recalcTotalPrice` in the debugger once, to see the EML calls at work (see [the debugger](./0028-debugger-basics.md)).
- Push the package to a Git repository with [abapGit](./0151-abapgit.md), so you keep the project and can show it.

> [!TIP]
> The final project is like building a small house after learning each trade on its own. The foundations are the tables, the walls are the CDS views, the wiring is the behavior, and the front door is the Fiori app. Each part was a lesson; now they hold each other up.

## Exercise

> [!IMPORTANT]
>
> 1. Build the app as described, and check that a travel with an end date before the begin date can't be saved.
> 2. Add an action `cancelTravel` that sets the status to `X`, with a button in the list report.
> 3. Replace the empty `get_instance_authorizations` with a real check, or add a CDS access control for `ZR_FB_Travel` (see [CDS access control](./0136-cds-access-control.md)).

### Solution

1. When you choose **Save**, `Prepare` runs `validateDates`, which fills `failed` and `reported`: the draft stays open, and the end date is marked with the error.
2. In the behavior definition add `action cancelTravel result [1] $self;`, in the projection `use action cancelTravel;`, and in the metadata extension a second `#FOR_ACTION` entry with `dataAction: 'cancelTravel'`. The implementation is the same as `acceptTravel` with `OverallStatus = 'X'`.
3. A simple instance check denies changes to cancelled travels:

```abap
METHOD get_instance_authorizations.
  READ ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel FIELDS ( OverallStatus ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_travels).

  result = VALUE #( FOR ls_travel IN lt_travels
                    LET lv_auth = COND #( WHEN ls_travel-OverallStatus = 'X'
                                          THEN if_abap_behv=>auth-unauthorized
                                          ELSE if_abap_behv=>auth-allowed ) IN
                    ( %tky = ls_travel-%tky %update = lv_auth %delete = lv_auth ) ).
ENDMETHOD.
```

> [!NOTE]
>
> - The app combines every level: types and SQL, classes and tests, CDS, RAP, and Fiori elements.
> - The data model is two tables, a root and a child view entity, and a composition.
> - A managed behavior definition with draft holds the business logic; put pure rules in a separate, tested class.
> - The projections, metadata extensions, service definition, and binding turn the business object into a Fiori app.
> - Finish with tests, ATC, and abapGit, and keep extending the app with what you learn next.
