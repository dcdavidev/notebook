---
title: Il data model RAP
description: Tabelle di database, entità root e child, e composizioni.
---

_Livello pro_

Ogni business object RAP parte dal suo **data model**: le tabelle di database che conservano i dati e le CDS view entity che descrivono il business object come un albero. Questa lezione costruisce il data model dell'app dei viaggi: un viaggio con le sue prenotazioni.

La [panoramica di RAP](./0139-rap-overview.it.md) dà il quadro generale; qui scrivi i primi oggetti.

## Le tabelle di database

Un business object managed ha bisogno di tabelle proprie. Le crei in ADT come **database table** (**New > Other ABAP Repository Object > Dictionary > Database Table**), scritte in codice sorgente DDL:

```abap
@EndUserText.label : 'Viaggio'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table ztravel {
  key client            : abap.clnt not null;
  key travel_uuid       : sysuuid_x16 not null;
  travel_id             : /dmo/travel_id;
  customer_id           : /dmo/customer_id;
  begin_date            : /dmo/begin_date;
  end_date              : /dmo/end_date;
  @Semantics.amount.currencyCode : 'ztravel.currency_code'
  total_price           : /dmo/total_price;
  currency_code         : /dmo/currency_code;
  description           : /dmo/description;
  overall_status        : /dmo/overall_status;
  last_changed_at       : abp_lastchange_tstmpl;
  local_last_changed_at : abp_locinst_lastchange_tstmpl;
}
```

```abap
@EndUserText.label : 'Prenotazione'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zbooking {
  key client            : abap.clnt not null;
  key booking_uuid      : sysuuid_x16 not null;
  parent_uuid           : sysuuid_x16;
  booking_id            : /dmo/booking_id;
  carrier_id            : /dmo/carrier_id;
  connection_id         : /dmo/connection_id;
  flight_date           : /dmo/flight_date;
  @Semantics.amount.currencyCode : 'zbooking.currency_code'
  flight_price          : /dmo/flight_price;
  currency_code         : /dmo/currency_code;
  local_last_changed_at : abp_locinst_lastchange_tstmpl;
}
```

- La chiave è un **UUID** (`sysuuid_x16`), un ID tecnico di 16 byte che RAP può generare alla creazione. Il numero leggibile, `travel_id`, è un campo normale.
- `parent_uuid` collega ogni prenotazione al suo viaggio.
- I due **timestamp** servono a RAP: `last_changed_at` per l'intero business object, `local_last_changed_at` per ogni istanza. RAP li usa per il blocco ottimistico con gli ETag.
- Gli elementi dati vengono dal flight model `/DMO/`. Se non lo hai, usa elementi dati tuoi o tipi predefiniti.

> [!TIP]
> L'UUID e il numero del viaggio sono come il chip di un passaporto e il numero stampato. Il chip lo identifica in modo univoco per le macchine; il numero stampato è quello che le persone leggono e digitano.

## L'entità root

Il business object è descritto da CDS view entity sopra le tabelle. L'**entità root** si marca con `define root view entity` e dichiara i suoi figli con una **composizione**:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Viaggio'
define root view entity ZR_Travel
  as select from ztravel
  composition [0..*] of ZR_Booking      as _Booking
  association [0..1] to /DMO/I_Customer as _Customer
    on $projection.CustomerID = _Customer.CustomerID
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
        when 'O' then 2      // aperto: giallo
        when 'A' then 3      // accettato: verde
        when 'X' then 1      // rifiutato: rosso
        else 0
      end                   as StatusCriticality,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at       as LastChangedAt,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      _Booking,
      _Customer
}
```

Una **composizione** è un'associazione speciale: le prenotazioni esistono solo come parte di un viaggio. Cancellare il viaggio cancella le sue prenotazioni, e bloccare il viaggio blocca anche loro. A differenza di un'associazione normale, una composizione non ha la condizione `on`: la definisce il figlio.

Le annotazioni `@Semantics.systemDateTime` dicono a RAP di riempire automaticamente i timestamp a ogni modifica.

## L'entità child

Il figlio è una view entity normale con un'associazione **to parent**:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Prenotazione'
define view entity ZR_Booking
  as select from zbooking
  association to parent ZR_Travel as _Travel
    on $projection.ParentUUID = _Travel.TravelUUID
{
  key booking_uuid          as BookingUUID,
      parent_uuid           as ParentUUID,
      booking_id            as BookingID,
      carrier_id            as CarrierID,
      connection_id         as ConnectionID,
      flight_date           as FlightDate,
      @Semantics.amount.currencyCode: 'CurrencyCode'
      flight_price          as FlightPrice,
      currency_code         as CurrencyCode,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      _Travel
}
```

La coppia `composition of` nel padre e `association to parent` nel figlio costruisce l'albero. Entrambe devono essere esposte nelle liste degli elementi. Un figlio può avere a sua volta dei figli, con altre composizioni, ma ogni business object ha esattamente una root.

> [!WARNING]
> Attiva le due viste insieme (`Ctrl+Shift+F3`, attiva tutto): la root fa riferimento al figlio e il figlio alla root, quindi attivarne una da sola fallisce.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea nel tuo pacchetto le tabelle `ZTRAVEL` e `ZBOOKING` e le view entity `ZR_Travel` e `ZR_Booking`.
> 2. Riempi qualche riga con una classe che implementa `if_oo_adt_classrun`, generando gli UUID con `cl_system_uuid=>create_uuid_x16_static( )`.
> 3. Apri `ZR_Travel` nella data preview e segui l'associazione `_Booking` fino alle prenotazioni di un viaggio.

### Soluzione

```abap
METHOD if_oo_adt_classrun~main.
  DELETE FROM ztravel.
  DELETE FROM zbooking.

  TRY.
      DATA(lv_travel_uuid) = cl_system_uuid=>create_uuid_x16_static( ).

      INSERT ztravel FROM @( VALUE ztravel( travel_uuid    = lv_travel_uuid
                                            travel_id      = '00000001'
                                            customer_id    = '000001'
                                            begin_date     = '20250601'
                                            end_date       = '20250610'
                                            total_price    = '1200.00'
                                            currency_code  = 'EUR'
                                            description    = 'Viaggio di lavoro'
                                            overall_status = 'O' ) ).

      INSERT zbooking FROM @( VALUE zbooking( booking_uuid  = cl_system_uuid=>create_uuid_x16_static( )
                                              parent_uuid   = lv_travel_uuid
                                              booking_id    = '0001'
                                              carrier_id    = 'LH'
                                              connection_id = '0400'
                                              flight_date   = '20250601'
                                              flight_price  = '600.00'
                                              currency_code = 'EUR' ) ).
      out->write( |{ sy-dbcnt } prenotazione inserita| ).
    CATCH cx_uuid_error INTO DATA(lx_uuid).
      out->write( lx_uuid->get_text( ) ).
  ENDTRY.
ENDMETHOD.
```

Nella data preview, clic destro su una riga di viaggio e scegli **Follow Association > \_Booking**.

> [!NOTE]
>
> - Un business object managed ha tabelle proprie, di solito con chiavi UUID e timestamp per RAP.
> - L'entità root usa `define root view entity` e dichiara i figli con `composition [0..*] of`.
> - Ogni figlio ha `association to parent` con la condizione `on` verso la chiave della root.
> - Le composizioni indicano appartenenza: i figli si creano, si bloccano e si cancellano insieme al padre.
> - Le annotazioni `@Semantics.systemDateTime` permettono a RAP di riempire automaticamente i timestamp di modifica.
