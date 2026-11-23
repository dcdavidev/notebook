---
title: La gestione delle bozze
description: Permettere agli utenti di salvare il lavoro prima che sia completo.
level: pro
---

Senza bozze, un'app RAP salva un'istanza solo quando è tutto valido: se l'utente chiude il browser a metà di un viaggio con cinque prenotazioni, il lavoro è perso. Con la **gestione delle bozze** (draft), ogni modifica finisce prima in una **bozza**, una copia dell'istanza salvata in una tabella apposita. L'utente può uscire e tornare, e i dati arrivano nelle tabelle vere solo quando sceglie **Save**. Fiori elements supporta le bozze senza configurazioni aggiuntive.

## Istanze attive e istanze bozza

Un business object con le bozze ha due tipi di istanze:

| Istanza | Salvata in                           | Chi la vede                   | Deve essere valida? |
| ------- | ------------------------------------ | ----------------------------- | ------------------- |
| Attiva  | la tabella persistente (`ztravel`)   | tutti                         | sì                  |
| Bozza   | la tabella delle bozze (`ztravel_d`) | solo l'utente che la possiede | no                  |

La vita di una bozza segue alcune **draft action**:

- **Edit** copia un'istanza attiva in una nuova bozza e mette un blocco esclusivo sull'istanza attiva.
- Ogni modifica nella UI aggiorna subito la bozza. Le determinazioni on modify vengono eseguite; le validazioni che falliscono non la bloccano.
- **Activate** esegue **Prepare** (le validazioni e le determinazioni che elenchi), poi copia la bozza nell'istanza attiva e cancella la bozza.
- **Discard** cancella la bozza e rilascia il blocco.
- **Resume** riapre una bozza esistente dopo che il blocco è scaduto, e blocca di nuovo l'istanza attiva.

Anche creare un nuovo viaggio nella UI crea prima una bozza: l'istanza attiva compare solo con **Activate**.

## Attivare le bozze nella behavior definition

Parti dalla behavior definition managed di `ZR_Travel` della lezione sulla [behavior definition](./0141-rap-behavior-definition.md) e aggiungi le parole chiave delle bozze:

```abap
managed implementation in class zbp_r_travel unique;
strict ( 2 );
with draft;

define behavior for ZR_Travel alias Travel
persistent table ztravel
draft table ztravel_d
lock master total etag LastChangedAt
authorization master ( instance )
etag master LocalLastChangedAt
{
  create;
  update;
  delete;
  association _Booking { create; with draft; }

  field ( numbering : managed, readonly ) TravelUUID;
  field ( readonly ) TravelID, OverallStatus, LastChangedAt, LocalLastChangedAt;

  action acceptTravel result [1] $self;
  determination setTravelID on save { create; }
  validation validateDates on save { create; field BeginDate, EndDate; }

  draft action Edit;
  draft action Activate optimized;
  draft action Discard;
  draft action Resume;
  draft determine action Prepare
  {
    validation validateDates;
    validation Booking~validateFlightDate;
  }

  mapping for ztravel corresponding
  {
    TravelUUID         = travel_uuid;
    TravelID           = travel_id;
    CustomerID         = customer_id;
    BeginDate          = begin_date;
    EndDate            = end_date;
    TotalPrice         = total_price;
    CurrencyCode       = currency_code;
    Description        = description;
    OverallStatus      = overall_status;
    LastChangedAt      = last_changed_at;
    LocalLastChangedAt = local_last_changed_at;
  }
}

define behavior for ZR_Booking alias Booking
persistent table zbooking
draft table zbooking_d
lock dependent by _Travel
authorization dependent by _Travel
etag master LocalLastChangedAt
{
  update;
  delete;
  association _Travel { with draft; }

  field ( numbering : managed, readonly ) BookingUUID;
  field ( readonly ) ParentUUID;

  validation validateFlightDate on save { create; field FlightDate; }

  mapping for zbooking corresponding
  {
    BookingUUID        = booking_uuid;
    ParentUUID         = parent_uuid;
    BookingID          = booking_id;
    CarrierID          = carrier_id;
    ConnectionID       = connection_id;
    FlightDate         = flight_date;
    FlightPrice        = flight_price;
    CurrencyCode       = currency_code;
    LocalLastChangedAt = local_last_changed_at;
  }
}
```

Le novità:

- `with draft;` nella testata attiva le bozze per tutto il business object.
- `draft table` indica la tabella delle bozze di ogni entità.
- `total etag` sul lock master è obbligatorio: è il campo che il framework confronta all'**Activate** per essere sicuro che nessuno abbia cambiato l'istanza attiva nel frattempo. Deve cambiare a ogni modifica, quindi di solito è il campo `LastChangedAt` con `@Semantics.systemDateTime.lastChangedAt: true`.
- Ogni associazione dentro il business object ha bisogno di `with draft;`, così collega bozze con bozze e istanze attive con istanze attive.
- `draft determine action Prepare` elenca le validazioni e le determinazioni che girano prima dell'attivazione. Una validazione che non è nell'elenco non viene eseguita sulle bozze.

## La tabella delle bozze

La tabella delle bozze non la scrivi a mano. Metti il cursore sul nome `ztravel_d` nella behavior definition e usa il quick fix (Ctrl+1) **Create draft table**. ADT genera qualcosa di simile:

```abap
@EndUserText.label : 'Tabella delle bozze per ZR_TRAVEL'
@AbapCatalog.enhancement.category : #EXTENSIBLE_ANY
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table ztravel_d {
  key mandt              : mandt not null;
  key traveluuid         : sysuuid_x16 not null;
  travelid               : /dmo/travel_id;
  customerid             : /dmo/customer_id;
  begindate              : /dmo/begin_date;
  enddate                : /dmo/end_date;
  @Semantics.amount.currencyCode : 'ztravel_d.currencycode'
  totalprice             : /dmo/total_price;
  currencycode           : /dmo/currency_code;
  description            : /dmo/description;
  overallstatus          : /dmo/overall_status;
  lastchangedat          : abp_lastchange_tstmpl;
  locallastchangedat     : abp_locinst_lastchange_tstmpl;
  "%admin"               : include sych_bdl_draft_admin_inc;
}
```

I nomi dei campi seguono i **nomi degli elementi CDS**, non le colonne della tabella persistente, e l'include `sych_bdl_draft_admin_inc` aggiunge i dati amministrativi (UUID della bozza, proprietario, ora di creazione e di modifica). Quando aggiungi un campo alla view CDS, rigenera la tabella delle bozze con lo stesso quick fix.

> [!WARNING]
> Non leggere e non scrivere mai le tabelle delle bozze con ABAP SQL. La loro struttura appartiene al framework e può cambiare. Usa EML: legge e modifica le bozze al posto tuo.

## Le bozze nella proiezione e in EML

Anche la behavior definition di proiezione deve esporre le bozze:

```abap
projection;
strict ( 2 );
use draft;

define behavior for ZC_Travel alias Travel
{
  use create;
  use update;
  use delete;
  use action acceptTravel;

  use action Edit;
  use action Activate;
  use action Discard;
  use action Resume;
  use action Prepare;

  use association _Booking { create; with draft; }
}

define behavior for ZC_Booking alias Booking
{
  use update;
  use delete;
  use association _Travel { with draft; }
}
```

In [EML](./0143-eml.md), la chiave di un'entità con bozze è `%tky`, che contiene la chiave più `%is_draft`. Nel behavior pool usa sempre `%tky` invece di `%key`, e il codice funziona per entrambi i tipi di istanza:

```abap
READ ENTITIES OF zr_travel IN LOCAL MODE
  ENTITY Travel
    FIELDS ( BeginDate EndDate ) WITH CORRESPONDING #( keys )
  RESULT DATA(lt_travels).

LOOP AT lt_travels INTO DATA(ls_travel) WHERE EndDate < BeginDate.
  APPEND VALUE #( %tky = ls_travel-%tky ) TO failed-travel.
ENDLOOP.
```

Fuori dal business object, imposta `%is_draft` in modo esplicito: `if_abap_behv=>mk-on` per una bozza, `if_abap_behv=>mk-off` per un'istanza attiva. Per attivare una bozza da codice, chiama l'azione: `MODIFY ENTITIES OF zr_travel ENTITY Travel EXECUTE Activate FROM VALUE #( ( %key-TravelUUID = lv_uuid ) )` e poi `COMMIT ENTITIES`.

> [!TIP]
> Una bozza è come un'email nella cartella Bozze. Puoi scriverla in più momenti, lasciare campi vuoti, e nessun altro la vede. Solo quando premi **Invia** deve essere completa, e a quel punto lascia la cartella Bozze per sempre.

## Esercizio

> [!IMPORTANT]
>
> 1. Attiva le bozze per il tuo business object dei viaggi, genera le due tabelle delle bozze e aggiungi `use draft` alla proiezione.
> 2. Nell'anteprima Fiori, crea un viaggio con la data di fine precedente alla data di inizio, esci dalla pagina e torna: la bozza c'è ancora.
> 3. Scegli **Save** e verifica che ora la validazione blocchi l'attivazione con un messaggio di errore.

### Soluzione

Usa le behavior definition qui sopra, poi genera `ztravel_d` e `zbooking_d` con il quick fix e attiva tutto. Nell'anteprima, un nuovo viaggio mostra **Draft** nello stato. Al **Save**, `Activate` esegue `Prepare`, `validateDates` riempie `failed` e `reported`, e la bozza resta finché non correggi le date.

> [!NOTE]
>
> - Con le bozze, le modifiche vanno prima in una tabella delle bozze e arrivano nelle tabelle attive solo con **Activate**.
> - Aggiungi `with draft;`, una `draft table` per ogni entità, `total etag` sul lock master e `with draft` su ogni associazione.
> - Le draft action sono `Edit`, `Activate`, `Discard`, `Resume` e `Prepare`; elenca in `Prepare` le validazioni che devono girare prima del salvataggio.
> - Genera le tabelle delle bozze con il quick fix, e non accedervi mai con ABAP SQL.
> - In EML usa `%tky` e `%is_draft`, così lo stesso codice gestisce bozze e istanze attive.
