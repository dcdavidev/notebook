---
title: OData with SAP Gateway
description: Build an OData V2 service with SEGW.
level: pro
---

**OData** is a REST protocol for business data: entities, keys, relationships, and standard query options such as `$filter`, `$top`, and `$orderby`, all described in a `$metadata` document. SAP Fiori apps read and write data through OData. On SAP NetWeaver and SAP S/4HANA, **SAP Gateway** runs OData services, and the **Service Builder** (transaction `SEGW`) is the classic tool to build an OData V2 service in ABAP.

New services on SAP S/4HANA are usually built with RAP (see [projections, service definitions, and bindings](./0144-rap-business-services.md)). `SEGW` services are still everywhere, so you need to read, fix, and sometimes build them.

## The pieces of a SEGW project

| Piece                      | What it is                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| entity type                | the structure of one record, with key properties (`Connection`)  |
| entity set                 | the collection of an entity type, used in URLs (`ConnectionSet`) |
| association / navigation   | a relationship between entity types (`Connection` to `Flights`)  |
| model provider class (MPC) | generated: builds the metadata. You extend `ZCL_..._MPC_EXT`     |
| data provider class (DPC)  | generated: answers requests. You code in `ZCL_..._DPC_EXT`       |

The classes without `_EXT` are regenerated each time you choose **Generate Runtime Objects**: never change them. Your code goes into the `_EXT` subclasses, where you **redefine** methods.

> [!TIP]
> `SEGW` is like building a shop. The data model is the catalog (what products exist and what each one looks like). The generated classes are the empty shop with shelves and a till. Your `DPC_EXT` code is the shop assistant who fetches the products from the warehouse (the database) when a customer asks.

## Build the service step by step

1. `SEGW` > **Create Project**: `ZFLIGHT`, type **Service with SAP Annotations**, your package.
2. **Data Model > Import > DDIC Structure**: choose `SPFLI`, name the entity type `Connection`, select the fields `CARRID`, `CONNID`, `CITYFROM`, `CITYTO`, `DEPTIME`, and mark `CARRID` and `CONNID` as keys. Check **Create Default Entity Set** (`ConnectionSet`).
3. **Generate Runtime Objects**: the wizard creates `ZCL_ZFLIGHT_MPC`, `ZCL_ZFLIGHT_MPC_EXT`, `ZCL_ZFLIGHT_DPC`, `ZCL_ZFLIGHT_DPC_EXT`, and the service `ZFLIGHT_SRV`.
4. Register the service in the Gateway hub with `/IWFND/MAINT_SERVICE` > **Add Service**: system alias (often `LOCAL`), technical service name `ZFLIGHT_SRV`.
5. In `ZCL_ZFLIGHT_DPC_EXT`, redefine the methods for each operation you support.

## Read a list: GET_ENTITYSET

A request to `/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet` calls `CONNECTIONSET_GET_ENTITYSET`:

```abap
METHOD connectionset_get_entityset.
  " $filter converted to an ABAP SQL condition, for example: CARRID = 'LH'
  DATA(lv_where) = io_tech_request_context->get_osql_where_clause_convert( ).

  SELECT carrid, connid, cityfrom, cityto, deptime
    FROM spfli
    WHERE (lv_where)
    ORDER BY carrid, connid
    INTO CORRESPONDING FIELDS OF TABLE @et_entityset
    UP TO @is_paging-top ROWS          " $top: 0 means no limit
    OFFSET @is_paging-skip.            " $skip

  IF io_tech_request_context->has_inlinecount( ) = abap_true.
    SELECT COUNT(*) FROM spfli WHERE (lv_where) INTO @DATA(lv_count).
    es_response_context-inlinecount = lv_count.
  ENDIF.
ENDMETHOD.
```

- `get_osql_where_clause_convert( )` turns `$filter` into a dynamic `WHERE` clause with the ABAP field names (see [dynamic SQL](./0117-dynamic-sql-and-calls.md)). It returns an empty string when there's no filter.
- `is_paging` holds `$top` and `$skip`; `it_order` and `io_tech_request_context->get_orderby( )` hold `$orderby`.
- Pushing filter and paging to the database is what makes a service fast. Reading everything and filtering in ABAP works for small tables only.

## Read one record: GET_ENTITY

`/ConnectionSet(Carrid='LH',Connid='0400')` calls `CONNECTIONSET_GET_ENTITY`:

```abap
METHOD connectionset_get_entity.
  DATA ls_key TYPE zcl_zflight_mpc=>ts_connection.

  io_tech_request_context->get_converted_keys( IMPORTING es_key_values = ls_key ).

  SELECT SINGLE carrid, connid, cityfrom, cityto, deptime
    FROM spfli
    WHERE carrid = @ls_key-carrid AND connid = @ls_key-connid
    INTO CORRESPONDING FIELDS OF @er_entity.

  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        textid  = /iwbep/cx_mgw_busi_exception=>business_error
        message = |Connection { ls_key-carrid } { ls_key-connid } not found|.
  ENDIF.
ENDMETHOD.
```

The MPC defines a type `ts_<entity type>` for each entity type. Raising `/IWBEP/CX_MGW_BUSI_EXCEPTION` returns an HTTP error with your message to the client; technical errors use `/IWBEP/CX_MGW_TECH_EXCEPTION`.

Creating, updating, and deleting work the same way: redefine `CONNECTIONSET_CREATE_ENTITY` (read the body with `io_data_provider->read_entry_data( IMPORTING es_data = ... )`), `_UPDATE_ENTITY`, and `_DELETE_ENTITY`. Put the actual database changes in a BAPI or your own class, check authorizations, and don't `COMMIT WORK` yourself: Gateway commits at the end of the request.

> [!WARNING]
> Gateway doesn't check authorizations on your data for you. A user who may call the service may read every row your `SELECT` returns. Add `AUTHORITY-CHECK` (or a check in the `WHERE` clause) in every method.

## Test the service

Use the **Gateway client**, `/IWFND/GW_CLIENT`, or a browser:

```text
/sap/opu/odata/sap/ZFLIGHT_SRV/$metadata
/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet?$format=json
/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet?$filter=Carrid eq 'LH'&$top=5&$inlinecount=allpages
/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet(Carrid='LH',Connid='0400')
```

When something goes wrong, `/IWFND/ERROR_LOG` (hub) and `/IWBEP/ERROR_LOG` (backend) show the error with the request, and you can replay it. Set an external breakpoint in the `DPC_EXT` method to debug a request coming from a browser or a Fiori app.

> [!CAUTION]
> After you change the data model, choose **Generate Runtime Objects** again and clear the metadata cache (`/IWFND/CACHE_CLEANUP` on the hub, `/IWBEP/CACHE_CLEANUP` on the backend). Otherwise clients keep seeing the old `$metadata`, and requests fail with confusing errors.

## Exercise

> [!IMPORTANT]
>
> 1. Build the `ZFLIGHT` project with the entity type `Connection` from `SPFLI`, generate it, and register `ZFLIGHT_SRV`.
> 2. Implement `CONNECTIONSET_GET_ENTITYSET` with filter and paging, and `CONNECTIONSET_GET_ENTITY`.
> 3. In `/IWFND/GW_CLIENT`, read `$metadata`, the connections of `LH`, and a single connection. Then request a connection that doesn't exist and find the error in `/IWFND/ERROR_LOG`.

### Solution

The code is the two methods above. `$metadata` lists the entity type `Connection` with its key `Carrid`, `Connid`. `ConnectionSet?$filter=Carrid eq 'LH'` returns only Lufthansa connections, because `get_osql_where_clause_convert( )` returns `CARRID = 'LH'`. A missing connection returns HTTP status 400 with your message (business errors use 400 unless you set another status), and the error log shows the same message with the request URL.

> [!NOTE]
>
> - OData exposes business data as entity sets with keys, navigation, and query options, described in `$metadata`.
> - `SEGW` generates MPC and DPC classes; your code goes only into the `_EXT` subclasses.
> - Redefine `<set>_GET_ENTITYSET`, `_GET_ENTITY`, `_CREATE_ENTITY`, `_UPDATE_ENTITY`, and `_DELETE_ENTITY`.
> - Push `$filter`, `$top`, and `$skip` to the database, and check authorizations in every method.
> - Register in `/IWFND/MAINT_SERVICE`, test in `/IWFND/GW_CLIENT`, and debug with `/IWFND/ERROR_LOG`; for new S/4HANA services, prefer RAP.
