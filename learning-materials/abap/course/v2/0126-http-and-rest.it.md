---
title: Client HTTP e servizi REST
description: Chiamare API esterne ed esporre i tuoi endpoint HTTP.
---

_Livello pro_

La maggior parte delle integrazioni moderne parla HTTP: un servizio meteo, un fornitore di pagamenti, un'app cloud o l'API REST di un altro sistema SAP. ABAP può stare da entrambe le parti. Come **client** invia richieste HTTP e legge le risposte. Come **server** riceve le richieste tramite l'**Internet Communication Framework (ICF)** e risponde con una tua classe handler. I dati di solito sono JSON, trattato in [JSON e XML](./0127-json-and-xml.it.md).

## Chiamare un'API con CL_HTTP_CLIENT

Nell'ABAP classico (SAP ECC e SAP S/4HANA on-premise), il client è l'interfaccia `IF_HTTP_CLIENT`, creata da `CL_HTTP_CLIENT`:

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
  WRITE: / 'Stato HTTP:', lv_status.
  WRITE: / lv_body.
ENDIF.

lo_client->close( ).
```

- Per un `POST` o un `PUT`, imposta il metodo, `set_content_type( 'application/json' )` e il corpo con `set_cdata( lv_json )`.
- In produzione non scrivere URL e password nel codice: crea una destinazione HTTP di tipo `G` in `SM59` e usa `cl_http_client=>create_by_destination( )`. La destinazione contiene host, dati di logon e proxy.
- HTTPS richiede la catena di certificati del server nel PSE client SSL, che gestisci in `STRUST`. Un certificato mancante è la causa più comune di `http_communication_failure`.

> [!TIP]
> Un client HTTP è un cameriere. Scrivi l'ordinazione (metodo, URL, header, corpo), il cameriere la porta in cucina (`send`), torna con il piatto (`receive`) e ti dice se qualcosa è andato storto (il codice di stato). `close` è pagare il conto e liberare il tavolo.

## Chiamare un'API in ABAP Cloud

In ABAP Cloud, e nei rilasci recenti di SAP S/4HANA, usa le classi rilasciate `CL_WEB_HTTP_CLIENT_MANAGER` e `CL_HTTP_DESTINATION_PROVIDER`:

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
    " registra l'errore, per esempio nel log applicativo
ENDTRY.
```

Nel codice reale crea la destinazione da un **communication arrangement** (`create_by_comm_arrangement`) o da una destinazione BTP (`create_by_cloud_destination`), così è l'amministratore a gestire URL e credenziali.

## Controllare il codice di stato

Una chiamata HTTP che "funziona" può comunque fallire: guarda sempre il codice di stato prima di leggere il corpo.

| Intervallo | Significato          | Esempi                                                                          |
| ---------- | -------------------- | ------------------------------------------------------------------------------- |
| 2xx        | successo             | `200` OK, `201` Created, `204` No Content                                       |
| 3xx        | reindirizzamento     | `301`, `302`                                                                    |
| 4xx        | errore del chiamante | `400` richiesta errata, `401` non autenticato, `403` vietato, `404` non trovato |
| 5xx        | errore del server    | `500`, `502`, `503`                                                             |

> [!WARNING]
> Imposta un timeout e riprova solo sugli errori dove ha senso (`503`, errori di rete), mai su un `400`. E non registrare mai nei log i corpi completi delle richieste o gli header `Authorization`: spesso contengono dati personali o segreti.

## Esporre un endpoint HTTP con l'ICF

Per rispondere alle richieste HTTP, scrivi una classe che implementa `IF_HTTP_EXTENSION` e registrala come handler di un nodo di servizio ICF in `SICF`.

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

In `SICF` crea un servizio sotto `/default_host/sap/bc/`, per esempio `zflights`, inserisci la classe handler nella scheda **Elenco handler**, imposta la procedura di logon e attiva il nodo. L'endpoint diventa `https://<host>:<porta>/sap/bc/zflights?carrid=LH`.

`/UI2/CL_JSON` è disponibile su SAP NetWeaver e S/4HANA on-premise, ma non è rilasciata per ABAP Cloud. In ABAP Cloud crei un **HTTP service** in ADT, e la classe generata implementa `IF_HTTP_SERVICE_EXTENSION` con un metodo `handle_request( request, response )`.

> [!CAUTION]
> Un servizio ICF è raggiungibile da chiunque raggiunga il server. Non creare mai un servizio con dati di logon anonimi salvati se non deve essere pubblico, esegui sempre `AUTHORITY-CHECK` nell'handler e valida ogni campo di input. Per i dati di business preferisci i servizi OData (vedi [OData con SAP Gateway](./0128-odata-with-sap-gateway.it.md) e [i servizi di business RAP](./0144-rap-business-services.it.md)), che offrono già autorizzazioni, paginazione e metadati standard.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la classe handler `ZCL_FLIGHT_HTTP_HANDLER` e il servizio `SICF` `zflights`, e apri l'URL in un browser.
> 2. Scrivi un report che chiama il tuo servizio con `CL_HTTP_CLIENT` e stampa il codice di stato e il corpo.
> 3. Chiamalo con una compagnia che non esiste e con il metodo `POST`, e confronta le risposte.

### Soluzione

Il browser mostra un array JSON come `[{"carrid":"LH","connid":"0400","cityfrom":"FRANKFURT","cityto":"NEW YORK"}, ...]`. Il report riceve lo stato `200` e lo stesso corpo; con una compagnia sconosciuta riceve `200` e `[]`; con `POST` (impostato con `set_method( 'POST' )`) riceve `405`. Quando client e servizio sono sullo stesso sistema, potresti dover inviare i dati di logon con `lo_client->authenticate( username = ... password = ... )` o usare una destinazione.

> [!NOTE]
>
> - On-premise, `CL_HTTP_CLIENT` con `send`, `receive` e `close` chiama le API HTTP; in ABAP Cloud usa `CL_WEB_HTTP_CLIENT_MANAGER`.
> - Tieni URL e credenziali nelle destinazioni (`SM59`, communication arrangement) e i certificati in `STRUST`.
> - Controlla sempre il codice di stato prima di leggere il corpo.
> - Una classe che implementa `IF_HTTP_EXTENSION`, registrata in `SICF`, espone un tuo endpoint.
> - Proteggi ogni endpoint con autenticazione, controlli di autorizzazione e validazione dell'input.
