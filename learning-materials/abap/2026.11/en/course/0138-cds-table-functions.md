---
title: CDS table functions
description: Use an AMDP as the data source of a CDS entity.
level: pro
---

An [AMDP](./0137-amdp.md) procedure is called from ABAP, like a method. But sometimes you need SQLScript logic **inside a data model**: as the source of a CDS view, in a join, in a Fiori app. A **CDS table function** gives SQLScript a CDS face. You define its signature in CDS, implement it with an AMDP function, and then read it like any CDS entity, from ABAP SQL or from other views.

## The two parts of a table function

A table function always comes in two objects:

1. A **data definition** with `define table function`: the parameters, the returned columns, and the name of the implementing method.
2. An **AMDP class** with a static method `FOR TABLE FUNCTION`, implemented `BY DATABASE FUNCTION` in SQLScript.

> [!TIP]
> A table function is like a vending machine. The front panel (the CDS definition) shows the buttons and what comes out; the machinery behind it (the AMDP) can be as complicated as it likes. Customers only see the panel.

## The CDS definition

```abap
@EndUserText.label: 'Occupied seats per airline'
@ClientHandling.type: #CLIENT_DEPENDENT
@ClientHandling.algorithm: #SESSION_VARIABLE
define table function ZTF_CarrierLoad
  with parameters
    p_from : s_date
  returns
  {
    client   : abap.clnt;
    carrid   : s_carr_id;
    flights  : abap.int8;
    occupied : abap.int8;
  }
  implemented by method zcl_tf_carrier_load=>get_load;
```

- `returns` lists the result columns with their types, like the fields of a structure. There's no `key`, no `select`, and no `from`: the AMDP provides the rows.
- The function is **client-dependent**: its first column has type `abap.clnt`, and ABAP SQL filters it by the current client. `@ClientHandling.algorithm: #SESSION_VARIABLE` tells the AMDP which client is current through the database session.
- `implemented by method` names the class and the method. The CDS definition and the method refer to each other, so activate them together.

## The AMDP implementation

```abap
CLASS zcl_tf_carrier_load DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_amdp_marker_hdb.
    CLASS-METHODS get_load FOR TABLE FUNCTION ztf_carrierload.
ENDCLASS.

CLASS zcl_tf_carrier_load IMPLEMENTATION.
  METHOD get_load BY DATABASE FUNCTION FOR HDB LANGUAGE SQLSCRIPT
                  OPTIONS READ-ONLY
                  USING sflight.
    RETURN SELECT mandt         AS client,
                  carrid,
                  COUNT(*)      AS flights,
                  SUM(seatsocc) AS occupied
             FROM sflight
            WHERE mandt  = SESSION_CONTEXT('CLIENT')
              AND fldate >= :p_from
            GROUP BY mandt, carrid;
  ENDMETHOD.
ENDCLASS.
```

- The method is static (`CLASS-METHODS`) and has no parameter list of its own: `FOR TABLE FUNCTION` takes the parameters and the result from the CDS definition.
- `BY DATABASE FUNCTION`, not `BY DATABASE PROCEDURE`: a function returns one table with `RETURN`.
- The returned columns must match the `returns` list in name, order, and type.
- The client filter is your job, as in every AMDP.

## Reading a table function

ABAP SQL reads it like a CDS view with parameters:

```abap
SELECT FROM ztf_carrierload( p_from = '20250101' )
  FIELDS carrid, flights, occupied
  ORDER BY occupied DESCENDING
  INTO TABLE @DATA(lt_load).
```

And a CDS view entity can use it as a data source, add associations, and expose it to the rest of the model:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Airline load with name'
define view entity ZI_CarrierLoadFromTf
  with parameters
    p_from : s_date
  as select from ZTF_CarrierLoad( p_from: $parameters.p_from )
  association [1..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
  key carrid               as CarrierId,
      flights              as FlightCount,
      occupied             as SeatsOccupied,
      _Carrier.CarrierName as CarrierName,
      _Carrier
}
```

> [!WARNING]
> The database can't push filters from the outer query into the SQLScript of a table function as well as it does for a view. A `WHERE carrid = 'LH'` on top of the function may still let the function compute every airline first. Pass important filters as **parameters**, so the AMDP can use them early.

## When to use a table function

Use a table function when a CDS model needs a step that CDS itself can't express, for example a HANA-specific function or multi-step logic with intermediate tables. If a plain CDS view entity with expressions and aggregates can do it, as here, prefer the view: it's portable, simpler, and supports [access control](./0136-cds-access-control.md) without extra work.

## Exercise

> [!IMPORTANT]
>
> 1. Create `ZCL_TF_CARRIER_LOAD` and `ZTF_CarrierLoad` and activate them.
> 2. Read the function from ABAP for the flights of the current year.
> 3. Add a column `seatsmax` with the total capacity, in the CDS definition and in the AMDP.

### Solution

In the CDS definition, add `seatsmax : abap.int8;` after `occupied`. In the AMDP, add `SUM(seatsmax) AS seatsmax` after `SUM(seatsocc) AS occupied`, in the same position. For the year, compute the date first, `DATA(lv_from) = CONV s_date( |{ sy-datum(4) }0101| ).`, and pass it as `p_from = @lv_from`.

> [!NOTE]
>
> - A CDS table function is a CDS entity whose rows come from an AMDP function.
> - The CDS part (`define table function`) declares parameters, `returns` columns, and `implemented by method`.
> - The ABAP part is a static method `FOR TABLE FUNCTION`, implemented `BY DATABASE FUNCTION` with `RETURN SELECT ...`.
> - Returned columns must match the definition; the client filter is up to you.
> - Pass filters as parameters, and prefer a plain view entity when CDS can express the logic.
