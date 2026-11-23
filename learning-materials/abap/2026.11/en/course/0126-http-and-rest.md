---
title: HTTP clients and REST services
description: Call external APIs and expose your own HTTP endpoints.
level: pro
---

Most modern integrations speak HTTP: a weather service, a payment provider, a cloud app, or another SAP system's REST API. ABAP can be on both sides. As a **client**, it sends HTTP requests and reads the responses. As a **server**, it receives requests through the **Internet Communication Framework (ICF)** and answers them with your own handler class. The data is usually JSON, covered in [JSON and XML](./0127-json-and-xml.md).

## Call an API with CL_HTTP_CLIENT

In classic ABAP (SAP ECC and SAP S/4HANA on-premise), the client is the interface `IF_HTTP_CLIENT`, created by `CL_HTTP_CLIENT`:

```abap
DATA lo_client TYPE REF TO if_http_client.

cl_http_client=>create_by_url(
  EXPORTING
    url                = 'https://api.example.com/flights?carrier=LH'
  IMPORTING
    client             = lo_client
  EXCEPTIONS
    argument_not_found = 1
    plugin_not_active  = 2
    internal_error     = 3
    OTHERS             = 4 ).
IF sy-subrc <> 0.
  RETURN.
ENDIF.

lo_client->request->set_method( if_http_request=>co_request_method_get ).
lo_client->request->set_header_field( name = 'Accept' value = 'application/json' ).

lo_client->send( EXCEPTIONS http_communication_failure = 1
                            http_invalid_state         = 2
                            http_processing_failed     = 3
                            OTHERS                     = 4 ).
IF sy-subrc = 0.
  lo_client->receive( EXCEPTIONS http_communication_failure = 1
                                 http_invalid_state         = 2
                                 http_processing_failed     = 3
                                 OTHERS                     = 4 ).
ENDIF.
IF sy-subrc <> 0.
  lo_client->get_last_error( IMPORTING message = DATA(lv_error) ).
  WRITE / lv_error.
ELSE.
  lo_client->response->get_status( IMPORTING code = DATA(lv_status) ).
  DATA(lv_body) = lo_client->response->get_cdata( ).
  WRITE: / 'HTTP status:', lv_status.
  WRITE: / lv_body.
ENDIF.

lo_client->close( ).
```

- For a `POST` or `PUT`, set the method, `set_content_type( 'application/json' )`, and the body with `set_cdata( lv_json )`.
- In production, don't hard-code URLs and passwords: create an HTTP destination of type `G` in `SM59` and use `cl_http_client=>create_by_destination( )`. The destination holds the host, the logon data, and the proxy.
- HTTPS needs the server's certificate chain in the SSL client PSE, which you maintain in `STRUST`. A missing certificate is the most common cause of `http_communication_failure`.

> [!TIP]
> An HTTP client is a waiter. You write the order (method, URL, headers, body), the waiter takes it to the kitchen (`send`), comes back with the dish (`receive`), and tells you if something went wrong (the status code). `close` is paying the bill and freeing the table.

## Call an API in ABAP Cloud

In ABAP Cloud, and in recent SAP S/4HANA releases, use the released classes `CL_WEB_HTTP_CLIENT_MANAGER` and `CL_HTTP_DESTINATION_PROVIDER`:

```abap
TRY.
    DATA(lo_destination) = cl_http_destination_provider=>create_by_url(
                             i_url = 'https://api.example.com/flights?carrier=LH' ).
    DATA(lo_http) = cl_web_http_client_manager=>create_by_http_destination( lo_destination ).

    lo_http->get_http_request( )->set_header_field( i_name  = 'Accept'
                                                    i_value = 'application/json' ).
    DATA(lo_response) = lo_http->execute( if_web_http_client=>get ).

    DATA(lv_status) = lo_response->get_status( )-code.
    DATA(lv_body)   = lo_response->get_text( ).
    lo_http->close( ).
  CATCH cx_http_dest_provider_error cx_web_http_client_error INTO DATA(lx_http).
    " log the error, for example in the application log
ENDTRY.
```

In real code, create the destination from a **communication arrangement** (`create_by_comm_arrangement`) or a BTP destination (`create_by_cloud_destination`), so the administrator manages URL and credentials.

## Check the status code

An HTTP call that "works" can still fail: always look at the status code before you read the body.

| Range | Meaning        | Examples                                                                     |
| ----- | -------------- | ---------------------------------------------------------------------------- |
| 2xx   | success        | `200` OK, `201` Created, `204` No Content                                    |
| 3xx   | redirect       | `301`, `302`                                                                 |
| 4xx   | caller's error | `400` bad request, `401` not authenticated, `403` forbidden, `404` not found |
| 5xx   | server's error | `500`, `502`, `503`                                                          |

> [!WARNING]
> Set a timeout and retry only on errors where it makes sense (`503`, network errors), never on `400`. And never log full request bodies or `Authorization` headers: they often contain personal data or secrets.

## Expose an HTTP endpoint with the ICF

To answer HTTP requests, write a class that implements `IF_HTTP_EXTENSION`, and register it as a handler of an ICF service node in `SICF`.

```abap
CLASS zcl_flight_http_handler DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_http_extension.
ENDCLASS.

CLASS zcl_flight_http_handler IMPLEMENTATION.
  METHOD if_http_extension~handle_request.
    IF server->request->get_method( ) <> 'GET'.
      server->response->set_status( code = 405 reason = 'Method Not Allowed' ).
      RETURN.
    ENDIF.

    DATA(lv_carrid) = to_upper( server->request->get_form_field( 'carrid' ) ).

    SELECT carrid, connid, cityfrom, cityto FROM spfli
      WHERE carrid = @lv_carrid
      INTO TABLE @DATA(lt_connections).

    DATA(lv_json) = /ui2/cl_json=>serialize( data        = lt_connections
                                             pretty_name = /ui2/cl_json=>pretty_mode-low_case ).

    server->response->set_status( code = 200 reason = 'OK' ).
    server->response->set_content_type( 'application/json' ).
    server->response->set_cdata( lv_json ).
  ENDMETHOD.
ENDCLASS.
```

In `SICF`, create a service under `/default_host/sap/bc/`, for example `zflights`, enter the handler class on the **Handler List** tab, set the logon procedure, and activate the node. The endpoint is then `https://<host>:<port>/sap/bc/zflights?carrid=LH`.

`/UI2/CL_JSON` is available on SAP NetWeaver and S/4HANA on-premise, but isn't released for ABAP Cloud. In ABAP Cloud, you create an **HTTP service** in ADT, and the generated class implements `IF_HTTP_SERVICE_EXTENSION` with a method `handle_request( request, response )`.

> [!CAUTION]
> An ICF service is reachable by anyone who can reach the server. Never create a service with stored anonymous logon data unless it's meant to be public, always run `AUTHORITY-CHECK` in the handler, and validate every input field. For business data, prefer OData services (see [OData with SAP Gateway](./0128-odata-with-sap-gateway.md) and [RAP business services](./0144-rap-business-services.md)), which come with standard authorization, paging, and metadata.

## Exercise

> [!IMPORTANT]
>
> 1. Create the handler class `ZCL_FLIGHT_HTTP_HANDLER` and the `SICF` service `zflights`, and open the URL in a browser.
> 2. Write a report that calls your own service with `CL_HTTP_CLIENT` and prints the status code and the body.
> 3. Call it with an airline that doesn't exist, and with the method `POST`, and compare the answers.

### Solution

The browser shows a JSON array such as `[{"carrid":"LH","connid":"0400","cityfrom":"FRANKFURT","cityto":"NEW YORK"}, ...]`. The report gets status `200` and the same body; with an unknown airline it gets `200` and `[]`; with `POST` (set with `set_method( 'POST' )`) it gets `405`. When the client and the service are on the same system, you may have to send logon data with `lo_client->authenticate( username = ... password = ... )` or use a destination.

> [!NOTE]
>
> - On-premise, `CL_HTTP_CLIENT` with `send`, `receive`, and `close` calls HTTP APIs; in ABAP Cloud use `CL_WEB_HTTP_CLIENT_MANAGER`.
> - Keep URLs and credentials in destinations (`SM59`, communication arrangements), and certificates in `STRUST`.
> - Always check the status code before reading the body.
> - A class implementing `IF_HTTP_EXTENSION`, registered in `SICF`, exposes your own endpoint.
> - Protect every endpoint with authentication, authorization checks, and input validation.
