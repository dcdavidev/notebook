---
title: JSON and XML
description: Serialize and parse data with CALL TRANSFORMATION and XCO.
level: pro
---

When ABAP talks to other systems over [HTTP](./0126-http-and-rest.md), files, or queues, data must become text: XML or JSON. Turning ABAP data into text is **serialization**; reading text back into ABAP data is **deserialization** (or parsing). The kernel does both with `CALL TRANSFORMATION`, and in ABAP Cloud the XCO library adds a convenient JSON API.

## CALL TRANSFORMATION and asXML

`CALL TRANSFORMATION` runs a transformation program on its source and writes the result. The predefined **identity transformation** `id` converts any ABAP data to and from **asXML**, the canonical XML format for ABAP data.

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
       END OF ty_flight,
       tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights( ( carrid = 'LH' connid = '0400' price = '666.00' )
                                     ( carrid = 'AZ' connid = '0555' price = '185.50' ) ).

" ABAP -> XML
CALL TRANSFORMATION id
  SOURCE flights = lt_flights
  RESULT XML DATA(lv_xml).            " lv_xml is an XSTRING (UTF-8)
```

The result looks like this (shortened). Each row of a table becomes an `item` element:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
  <asx:values>
    <FLIGHTS>
      <item><CARRID>LH</CARRID><CONNID>0400</CONNID><PRICE>666.00</PRICE></item>
      <item><CARRID>AZ</CARRID><CONNID>0555</CONNID><PRICE>185.50</PRICE></item>
    </FLIGHTS>
  </asx:values>
</asx:abap>
```

Parsing is the same statement in the other direction:

```abap
DATA lt_back TYPE tt_flights.

TRY.
    CALL TRANSFORMATION id
      SOURCE XML lv_xml
      RESULT flights = lt_back.
  CATCH cx_transformation_error INTO DATA(lx_error).
    WRITE / lx_error->get_text( ).
ENDTRY.
```

The name after `SOURCE` or `RESULT` (`flights`) becomes the uppercase element name, and must match on both sides.

> [!TIP]
> The identity transformation is like a moving company with its own standard boxes. It packs anything and unpacks it perfectly at the other end, but only if the other end uses the same boxes. For someone else's boxes (an external format), you need a transformation written for them.

## JSON with the identity transformation

The same statement writes **asJSON**, the JSON form of asXML, if you give it a JSON writer from the sXML library:

```abap
DATA(lo_writer) = cl_sxml_string_writer=>create( type = if_sxml=>co_xt_json ).

CALL TRANSFORMATION id
  SOURCE flights = lt_flights
  RESULT XML lo_writer.

DATA(lv_json) = cl_abap_conv_codepage=>create_in( )->convert( lo_writer->get_output( ) ).
" {"FLIGHTS":[{"CARRID":"LH","CONNID":"0400","PRICE":666.00},{"CARRID":"AZ",...}]}
```

Parsing JSON works the same way as XML: `CALL TRANSFORMATION id SOURCE XML lv_json_xstring RESULT flights = lt_back`. The kernel detects JSON automatically.

asJSON has a fixed shape: a root object with uppercase names. External APIs use their own names (usually `camelCase`), so asJSON fits only when both sides are ABAP. On older releases, convert the `XSTRING` with `cl_abap_codepage=>convert_from( )` instead of `CL_ABAP_CONV_CODEPAGE`.

## Your own formats: simple transformations

For a fixed external format, write a **simple transformation** (ST) in `STRANS` or ADT. It's a small XML template that maps elements to ABAP fields, and works in both directions:

```xml
<?sap.transform simple?>
<tt:transform xmlns:tt="http://www.sap.com/transformation-templates">
  <tt:root name="FLIGHTS" />
  <tt:template>
    <flights>
      <tt:loop ref=".FLIGHTS">
        <flight carrier="{tt:value ref('CARRID')}">
          <number><tt:value ref="CONNID" /></number>
          <price><tt:value ref="PRICE" /></price>
        </flight>
      </tt:loop>
    </flights>
  </tt:template>
</tt:transform>
```

You call it by name: `CALL TRANSFORMATION zflights_st SOURCE flights = lt_flights RESULT XML lv_xml`. XSLT transformations also exist, but simple transformations are faster and easier to read. A simple transformation can write JSON too, through the sXML JSON writer.

## JSON in ABAP Cloud with XCO

The XCO library (see [ABAP Cloud and clean core](./0148-abap-cloud.md)) has a JSON module that maps names for you:

```abap
" ABAP -> JSON, with camelCase names
DATA(lv_json) = xco_cp_json=>data->from_abap( lt_flights )->apply( VALUE #(
                  ( xco_cp_json=>transformation->underscore_to_camel_case )
                ) )->to_string( ).
" [{"carrid":"LH","connid":"0400","price":666.00},...]

" JSON -> ABAP
DATA lt_parsed TYPE tt_flights.
xco_cp_json=>data->from_string( lv_json )->apply( VALUE #(
  ( xco_cp_json=>transformation->camel_case_to_underscore )
) )->write_to( REF #( lt_parsed ) ).
```

With `underscore_to_camel_case`, a component `FLIGHT_DATE` becomes `flightDate`, and back. On on-premise systems, the class `/UI2/CL_JSON` offers similar features (`serialize` and `deserialize` with `pretty_name`), but it isn't released for ABAP Cloud.

> [!WARNING]
> Watch the types. JSON has no dates, so dates arrive as strings (`"2026-12-15"` or `"20261215"`) and must fit the ABAP field type. JSON `true` and `false` need a mapping to `abap_bool` (XCO has `boolean_to_abap_bool`). Numbers with many digits may lose precision in some clients if you send them as JSON numbers: send amounts as strings when in doubt.

> [!CAUTION]
> Never parse an XML file from an untrusted source with a transformation or parser that resolves external entities or very deep nesting without limits. Use the standard sXML and transformation APIs, which don't load external entities, and limit the size of what you accept.

## Exercise

> [!IMPORTANT]
>
> 1. Read 3 rows of `SCARR` into an internal table and serialize them to asXML and to asJSON. Print both.
> 2. Deserialize the asJSON back into a second table and check that the two tables are equal.
> 3. If you have an ABAP Cloud system, produce the same JSON with XCO and `underscore_to_camel_case`.

### Solution

```abap
SELECT carrid, carrname, currcode FROM scarr
  ORDER BY carrid
  INTO TABLE @DATA(lt_carriers)
  UP TO 3 ROWS.

DATA(lo_writer) = cl_sxml_string_writer=>create( type = if_sxml=>co_xt_json ).
CALL TRANSFORMATION id SOURCE carriers = lt_carriers RESULT XML lo_writer.
DATA(lv_json) = lo_writer->get_output( ).          " XSTRING

DATA lt_back LIKE lt_carriers.
CALL TRANSFORMATION id SOURCE XML lv_json RESULT carriers = lt_back.

WRITE / cl_abap_conv_codepage=>create_in( )->convert( lv_json ).
WRITE / COND string( WHEN lt_back = lt_carriers THEN 'Equal' ELSE 'Different' ).
```

The output is `{"CARRIERS":[{"CARRID":"AA","CARRNAME":"American Airlines","CURRCODE":"USD"},...]}` and `Equal`.

> [!NOTE]
>
> - `CALL TRANSFORMATION id` serializes any ABAP data to asXML and parses it back.
> - With a `CL_SXML_STRING_WRITER` of type JSON, the same statement writes asJSON (uppercase names).
> - For external formats, write a simple transformation in `STRANS`; it works in both directions.
> - In ABAP Cloud, `XCO_CP_JSON` serializes and parses JSON, with name mappings such as `underscore_to_camel_case`.
> - Check dates, booleans, and amounts, and catch `CX_TRANSFORMATION_ERROR`.
