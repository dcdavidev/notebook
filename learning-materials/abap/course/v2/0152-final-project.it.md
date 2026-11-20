---
title: Il progetto finale
description: Costruire un'app completa che usa quello che hai imparato in ogni livello.
---

_Livello pro_

Il progetto finale è un'**app completa di prenotazione voli**: gli agenti di viaggio creano viaggi per i clienti, aggiungono prenotazioni di voli, vedono il prezzo totale e accettano il viaggio. La costruisci da cima a fondo, dalle tabelle di database a una UI Fiori elements, e ogni passo usa lezioni di tutti e quattro i livelli. Qui non c'è sintassi nuova: quando un passo ti sembra poco familiare, segui il link alla lezione che lo spiega.

Ti serve un sistema con gli ABAP Development Tools e lo scenario di riferimento dei voli `/DMO/`, che puoi installare con [abapGit](./0151-abapgit.it.md). Tutti gli oggetti vanno in un unico package, per esempio `ZFB`, con una richiesta di trasporto (vedi [package e richieste di trasporto](./0007-packages-and-transport-requests.it.md)).

## Che cosa costruisci

| Parte                 | Oggetti                                                                  | Lezioni su cui si basa                                                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modello dati          | tabelle `ZFB_TRAVEL`, `ZFB_BOOKING`; CDS `ZR_FB_Travel`, `ZR_FB_Booking` | [tipi di dati](./0017-types-and-like.it.md), [tabelle di database](./0046-database-tables.it.md), [CDS view entity](./0132-cds-view-entities.it.md), [data model RAP](./0140-rap-data-model.it.md)                                                                                          |
| Logica di business    | behavior definition, behavior pool, `ZCL_FB_PRICE_CALCULATOR`            | [classi](./0076-classes-and-objects.it.md), [FOR e REDUCE](./0093-for-and-reduce.it.md), [behavior definition](./0141-rap-behavior-definition.it.md), [validazioni e azioni](./0142-rap-validations-determinations-actions.it.md), [EML](./0143-eml.it.md), [bozze](./0146-rap-draft.it.md) |
| Test e qualità        | classe di test ABAP Unit, esecuzione dell'ATC                            | [ABAP Unit](./0105-abap-unit-basics.it.md), [qualità del codice](./0107-code-quality.it.md)                                                                                                                                                                                                 |
| Servizio e UI         | proiezioni, metadata extension, servizio `ZUI_FB_TRAVEL_O4`              | [servizi di business](./0144-rap-business-services.it.md), [Fiori elements](./0145-rap-fiori-elements.it.md)                                                                                                                                                                                |
| Report di back office | report `ZFB_TRAVEL_OVERVIEW`                                             | [selection screen](./0063-parameters.it.md), [SELECT](./0052-select-basics.it.md), [messaggi](./0061-messages.it.md), [ALV](./0099-alv-with-salv.it.md)                                                                                                                                     |

## Il modello dati

### Le tabelle di database

Crea due tabelle in ADT. Ogni viaggio ha un UUID come chiave tecnica, un numero di viaggio leggibile, le date, un prezzo e i campi amministrativi che RAP riempie da solo:

```abap
@EndUserText.label : 'App prenotazione voli: viaggi'
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

`ZFB_BOOKING` ha le stesse annotazioni di testata e questi campi: `client`, `booking_uuid` (chiave), `parent_uuid` (l'UUID del viaggio), `booking_id` (`/dmo/booking_id`), `carrier_id`, `connection_id`, `flight_date`, `flight_price` (con la sua annotazione della divisa), `currency_code` e `local_last_changed_at`.

### Le CDS view entity

L'entità root legge i viaggi, aggiunge una criticità per lo stato e definisce la composizione verso le prenotazioni:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Viaggio'
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
        when 'A' then 3      -- accettato: verde
        when 'X' then 1      -- annullato: rosso
        else 2               -- aperto: giallo
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

`ZR_FB_Booking` è una `define view entity` su `zfb_booking` con `association to parent ZR_FB_Travel as _Travel on $projection.ParentUUID = _Travel.TravelUUID`, i campi rinominati in camel case (`BookingUUID`, `ParentUUID`, `BookingID`, `CarrierID`, `ConnectionID`, `FlightDate`, `FlightPrice`, `CurrencyCode`, `LocalLastChangedAt`) e `_Travel` esposta.

## Il business object

### La behavior definition

Un business object managed con le bozze, due determinazioni, una validazione e un'azione:

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

Genera le tabelle delle bozze e il behavior pool con i quick fix.

### Il calcolatore del prezzo e il suo test

Tieni la regola di business fuori dal behavior pool, in una classe semplice che puoi testare senza database: il totale è la somma dei prezzi dei voli più una commissione di servizio fissa.

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

Nella scheda **Test Classes** della stessa classe:

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

### Il behavior pool

L'handler dei viaggi dà a ogni nuovo viaggio un numero e lo stato `O` (aperto), controlla le date e implementa l'azione. Dichiara i metodi con il quick fix, poi riempili:

```abap
METHOD setInitialValues.
  READ ENTITIES OF zr_fb_travel IN LOCAL MODE
    ENTITY Travel FIELDS ( TravelID ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_travels).
  DELETE lt_travels WHERE TravelID IS NOT INITIAL.
  CHECK lt_travels IS NOT INITIAL.

  " numerazione semplice; un'app vera usa un intervallo di numerazione (lezione 111)
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
                                           text     = 'La data di fine è precedente alla data di inizio' )
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

L'handler delle prenotazioni ricalcola il totale del viaggio padre con la classe di calcolo. Per semplicità, presuppone che tutte le prenotazioni di un viaggio usino la divisa del viaggio:

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

Per ora lascia vuoto `get_instance_authorizations`: ogni utente può fare tutto. Aggiungere controlli veri fa parte dell'esercizio.

## Il servizio e l'app

1. Crea le proiezioni `ZC_FB_Travel` (con `provider contract transactional_query` e `@Metadata.allowExtensions: true`) e `ZC_FB_Booking`, e la behavior definition di proiezione con `use draft`, le istruzioni `use` per le operazioni, `use action acceptTravel` e le draft action, come nella [gestione delle bozze](./0146-rap-draft.it.md).
2. Scrivi le metadata extension per entrambe le proiezioni, con il list report, la object page, la criticità dello stato e il pulsante **Accetta**, come nelle [app Fiori elements](./0145-rap-fiori-elements.it.md).
3. Crea la service definition e un binding OData V4 di tipo UI:

```abap
@EndUserText.label: 'App prenotazione voli'
define service ZUI_FB_TRAVEL {
  expose ZC_FB_Travel  as Travel;
  expose ZC_FB_Booking as Booking;
  expose /DMO/I_Customer as Customer;
}
```

4. Pubblica il binding `ZUI_FB_TRAVEL_O4` e apri l'anteprima. Crea un viaggio, aggiungi due prenotazioni, guarda cambiare il prezzo totale, salva e accetta il viaggio.

Su un sistema con Standard ABAP, il back office può leggere gli stessi dati con un report classico. La view CDS è l'unica fonte di verità per entrambi:

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
    MESSAGE 'Nessun viaggio trovato' TYPE 'S' DISPLAY LIKE 'W'.
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

## Controllare e condividere

Prima di considerare finita l'app:

- Esegui gli unit test con Ctrl+Shift+F10 e correggi ogni errore.
- Esegui l'ATC sul package ed elimina i rilievi (vedi [qualità del codice](./0107-code-quality.it.md)).
- Segui una volta nel debugger la determinazione `recalcTotalPrice`, per vedere all'opera le chiamate EML (vedi [il debugger](./0028-debugger-basics.it.md)).
- Invia il package a un repository Git con [abapGit](./0151-abapgit.it.md), così conservi il progetto e puoi mostrarlo.

> [!TIP]
> Il progetto finale è come costruire una casetta dopo aver imparato ogni mestiere da solo. Le fondamenta sono le tabelle, i muri sono le view CDS, l'impianto elettrico è il behavior e la porta d'ingresso è l'app Fiori. Ogni parte è stata una lezione; adesso si reggono a vicenda.

## Esercizio

> [!IMPORTANT]
>
> 1. Costruisci l'app come descritto, e verifica che un viaggio con la data di fine precedente alla data di inizio non si possa salvare.
> 2. Aggiungi un'azione `cancelTravel` che imposta lo stato a `X`, con un pulsante nel list report.
> 3. Sostituisci il `get_instance_authorizations` vuoto con un controllo vero, oppure aggiungi un controllo accessi CDS per `ZR_FB_Travel` (vedi [il controllo accessi CDS](./0136-cds-access-control.it.md)).

### Soluzione

1. Quando scegli **Save**, `Prepare` esegue `validateDates`, che riempie `failed` e `reported`: la bozza resta aperta, e la data di fine è segnata con l'errore.
2. Nella behavior definition aggiungi `action cancelTravel result [1] $self;`, nella proiezione `use action cancelTravel;` e nella metadata extension una seconda voce `#FOR_ACTION` con `dataAction: 'cancelTravel'`. L'implementazione è uguale a `acceptTravel` con `OverallStatus = 'X'`.
3. Un semplice controllo di istanza vieta le modifiche ai viaggi annullati:

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
> - L'app mette insieme tutti i livelli: tipi e SQL, classi e test, CDS, RAP e Fiori elements.
> - Il modello dati è fatto di due tabelle, una view entity root e una child, e una composizione.
> - Una behavior definition managed con le bozze contiene la logica di business; metti le regole pure in una classe separata e testata.
> - Proiezioni, metadata extension, service definition e binding trasformano il business object in un'app Fiori.
> - Chiudi con test, ATC e abapGit, e continua ad ampliare l'app con quello che imparerai dopo.
