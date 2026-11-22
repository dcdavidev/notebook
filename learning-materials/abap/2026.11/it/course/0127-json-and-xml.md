---
title: JSON e XML
description: Serializzare e leggere dati con CALL TRANSFORMATION e XCO.
---

_Livello pro_

Quando ABAP parla con altri sistemi tramite [HTTP](./0126-http-and-rest.md), file o code, i dati devono diventare testo: XML o JSON. Trasformare dati ABAP in testo è la **serializzazione**; rileggere il testo in dati ABAP è la **deserializzazione** (o parsing). Il kernel fa entrambe le cose con `CALL TRANSFORMATION`, e in ABAP Cloud la libreria XCO aggiunge una comoda API per JSON.

## CALL TRANSFORMATION e asXML

`CALL TRANSFORMATION` esegue un programma di trasformazione sulla sorgente e scrive il risultato. La **trasformazione identità** predefinita `id` converte qualsiasi dato ABAP da e verso **asXML**, il formato XML canonico per i dati ABAP.

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
  RESULT XML DATA(lv_xml).            " lv_xml è un XSTRING (UTF-8)
```

Il risultato ha questo aspetto (abbreviato). Ogni riga di una tabella diventa un elemento `item`:

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

Il parsing è la stessa istruzione nella direzione opposta:

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

Il nome dopo `SOURCE` o `RESULT` (`flights`) diventa il nome dell'elemento in maiuscolo, e deve coincidere dalle due parti.

> [!TIP]
> La trasformazione identità è come una ditta di traslochi con i suoi scatoloni standard. Impacchetta qualsiasi cosa e la spacchetta perfettamente all'arrivo, ma solo se anche dall'altra parte si usano gli stessi scatoloni. Per gli scatoloni di qualcun altro (un formato esterno) ti serve una trasformazione scritta apposta.

## JSON con la trasformazione identità

La stessa istruzione scrive **asJSON**, la forma JSON di asXML, se le passi un writer JSON della libreria sXML:

```abap
DATA(lo_writer) = cl_sxml_string_writer=>create( type = if_sxml=>co_xt_json ).

CALL TRANSFORMATION id
  SOURCE flights = lt_flights
  RESULT XML lo_writer.

DATA(lv_json) = cl_abap_conv_codepage=>create_in( )->convert( lo_writer->get_output( ) ).
" {"FLIGHTS":[{"CARRID":"LH","CONNID":"0400","PRICE":666.00},{"CARRID":"AZ",...}]}
```

Il parsing di JSON funziona come quello di XML: `CALL TRANSFORMATION id SOURCE XML lv_json_xstring RESULT flights = lt_back`. Il kernel riconosce il JSON da solo.

asJSON ha una forma fissa: un oggetto radice con nomi in maiuscolo. Le API esterne usano i propri nomi (di solito `camelCase`), quindi asJSON va bene solo quando entrambe le parti sono ABAP. Nei rilasci più vecchi converti l'`XSTRING` con `cl_abap_codepage=>convert_from( )` invece di `CL_ABAP_CONV_CODEPAGE`.

## I tuoi formati: le simple transformation

Per un formato esterno fisso, scrivi una **simple transformation** (ST) in `STRANS` o in ADT. È un piccolo template XML che associa gli elementi ai campi ABAP, e funziona nelle due direzioni:

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

La chiami per nome: `CALL TRANSFORMATION zflights_st SOURCE flights = lt_flights RESULT XML lv_xml`. Esistono anche le trasformazioni XSLT, ma le simple transformation sono più veloci e più facili da leggere. Una simple transformation può scrivere anche JSON, tramite il writer JSON di sXML.

## JSON in ABAP Cloud con XCO

La libreria XCO (vedi [ABAP Cloud e clean core](./0148-abap-cloud.md)) ha un modulo JSON che converte i nomi per te:

```abap
" ABAP -> JSON, con nomi in camelCase
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

Con `underscore_to_camel_case`, un componente `FLIGHT_DATE` diventa `flightDate`, e viceversa. Sui sistemi on-premise la classe `/UI2/CL_JSON` offre funzioni simili (`serialize` e `deserialize` con `pretty_name`), ma non è rilasciata per ABAP Cloud.

> [!WARNING]
> Attenzione ai tipi. JSON non ha le date, quindi le date arrivano come stringhe (`"2026-12-15"` o `"20261215"`) e devono adattarsi al tipo del campo ABAP. `true` e `false` di JSON richiedono una conversione in `abap_bool` (XCO ha `boolean_to_abap_bool`). I numeri con molte cifre possono perdere precisione in alcuni client se li invii come numeri JSON: nel dubbio, invia gli importi come stringhe.

> [!CAUTION]
> Non fare mai il parsing di un file XML di provenienza non affidabile con una trasformazione o un parser che risolve entità esterne o annidamenti molto profondi senza limiti. Usa le API standard di sXML e delle trasformazioni, che non caricano entità esterne, e limita la dimensione di ciò che accetti.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi 3 righe di `SCARR` in una tabella interna e serializzale in asXML e in asJSON. Stampa entrambi.
> 2. Deserializza l'asJSON in una seconda tabella e controlla che le due tabelle siano uguali.
> 3. Se hai un sistema ABAP Cloud, produci lo stesso JSON con XCO e `underscore_to_camel_case`.

### Soluzione

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
WRITE / COND string( WHEN lt_back = lt_carriers THEN 'Uguali' ELSE 'Diverse' ).
```

L'output è `{"CARRIERS":[{"CARRID":"AA","CARRNAME":"American Airlines","CURRCODE":"USD"},...]}` e `Uguali`.

> [!NOTE]
>
> - `CALL TRANSFORMATION id` serializza qualsiasi dato ABAP in asXML e lo rilegge.
> - Con un `CL_SXML_STRING_WRITER` di tipo JSON, la stessa istruzione scrive asJSON (nomi in maiuscolo).
> - Per i formati esterni scrivi una simple transformation in `STRANS`; funziona nelle due direzioni.
> - In ABAP Cloud, `XCO_CP_JSON` serializza e legge JSON, con conversioni di nomi come `underscore_to_camel_case`.
> - Controlla date, booleani e importi, e intercetta `CX_TRANSFORMATION_ERROR`.
