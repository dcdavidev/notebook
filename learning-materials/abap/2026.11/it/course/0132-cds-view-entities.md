---
title: Le CDS view entity
description: Definire modelli di dati nel database con i Core Data Services.
---

_Livello pro_

I **Core Data Services (CDS)** ti permettono di definire modelli di dati in un linguaggio dedicato, vicino all'SQL, e di salvarli nel repository ABAP. Quando attivi una CDS view, il sistema crea la vista corrispondente nel database, quindi la logica gira lì: le CDS sono lo strumento principale del [code pushdown](./0131-code-pushdown.md) e la base delle app Fiori, dell'analisi dei dati e di RAP.

Una **CDS view entity** è il tipo attuale di CDS view. Qui vedi come crearne una, che cosa può contenere e come leggerla da ABAP.

## View entity e le vecchie viste DDIC-based

Incontrerai due tipi di CDS view:

| Tipo                | Istruzione           | Stato                                                                                                                 |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CDS view DDIC-based | `define view`        | obsoleta dalla 7.56; crea anche una vista SQL nel Dizionario ABAP, con il nome indicato in `@AbapCatalog.sqlViewName` |
| CDS view entity     | `define view entity` | quella da usare: nessuna vista aggiuntiva nel Dizionario, attivazione più veloce, controlli più severi                |

Il codice vecchio è pieno di `define view` con l'annotazione `@AbapCatalog.sqlViewName`. Sappila leggere, ma crea view entity per tutto ciò che è nuovo. I rilasci recenti hanno anche uno strumento di migrazione che converte le viste DDIC-based in view entity.

> [!TIP]
> Una CDS view è come una ricerca salvata nel programma di posta: non conserva i messaggi, conserva la regola che li trova. Ogni volta che la apri, vedi il risultato aggiornato.

## La tua prima view entity

Le CDS view si creano solo in ADT: clic destro sul pacchetto, **New > Other ABAP Repository Object > Core Data Services > Data Definition**, inserisci il nome `ZI_FLIGHT` e scegli il modello **Define View Entity**.

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Voli'
define view entity ZI_Flight
  as select from sflight
{
  key carrid    as CarrierId,
  key connid    as ConnectionId,
  key fldate    as FlightDate,
      @Semantics.amount.currencyCode: 'Currency'
      price     as Price,
      currency  as Currency,
      planetype as PlaneType,
      seatsmax  as SeatsMax,
      seatsocc  as SeatsOccupied
}
where
  seatsmax > 0
```

- `define view entity` dà il nome; per convenzione è in CamelCase, e il repository lo salva in maiuscolo.
- `as select from` indica la **sorgente dati**: una tabella di database, un'altra entità CDS o un join di più sorgenti.
- La **lista degli elementi** fra graffe è la lista di proiezione. `key` segna gli elementi chiave; `as` dà a ogni elemento un alias, di solito in CamelCase.
- Le righe che iniziano con `@` sono **annotazioni**, metadati per il compilatore e per i framework: vedi [le annotazioni CDS](./0134-cds-annotations.md).
- I commenti usano `//` per una riga e `/* ... */` per più righe.

Premi `Ctrl+F3` per attivare e `F8` per aprire la **data preview**, dove puoi filtrare, ordinare e contare le righe senza scrivere un programma.

Il mandante è gestito in automatico: quando leggi una tabella dipendente dal mandante, la vista restituisce solo le righe del mandante corrente. Non selezioni né filtri mai `mandt`.

## I join e la sorgente dati

La sorgente dati può essere un join, scritto come in SQL:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Voli con nome della compagnia'
define view entity ZI_FlightWithCarrier
  as select from sflight
    inner join   scarr on scarr.carrid = sflight.carrid
{
  key sflight.carrid   as CarrierId,
  key sflight.connid   as ConnectionId,
  key sflight.fldate   as FlightDate,
      scarr.carrname   as CarrierName,
      sflight.seatsocc as SeatsOccupied
}
```

I join funzionano, ma la maggior parte dei modelli CDS usa invece le **associazioni**: relazioni che diventano join solo quando qualcuno ne ha bisogno. Sono l'argomento delle [associazioni CDS](./0133-cds-associations.md). Elementi calcolati, `CASE` e aggregati sono in [espressioni, funzioni e parametri CDS](./0135-cds-expressions-and-parameters.md).

## Leggere una view entity in ABAP

Per ABAP SQL una CDS view entity è una sorgente dati come le altre. Usi il nome dell'entità e gli alias:

```abap
SELECT FROM zi_flight
  FIELDS CarrierId, ConnectionId, FlightDate, SeatsMax, SeatsOccupied
  WHERE CarrierId = 'LH'
  ORDER BY FlightDate
  INTO TABLE @DATA(lt_flights).

cl_demo_output=>display( lt_flights ).
```

Puoi anche tipizzare variabili con essa: `DATA ls_flight TYPE zi_flight.` dichiara una struttura con gli elementi della vista.

## I nomi nel virtual data model

I modelli CDS standard di SAP seguono il **virtual data model** (VDM), e i progetti custom spesso ne copiano i prefissi:

| Prefisso | Livello                                                  | Esempio         |
| -------- | -------------------------------------------------------- | --------------- |
| `I_`     | viste base e composite (interface), riutilizzabili       | `ZI_Flight`     |
| `C_`     | viste di consumo per una sola app o report               | `ZC_FlightList` |
| `R_`     | viste di riuso ristrette, base di un business object RAP | `ZR_Travel`     |

> [!WARNING]
> Ogni data definition contiene esattamente un'entità, e il nome del file deve coincidere con quello dell'entità. Se rinomini l'entità nel sorgente, l'attivazione fallisce: crea invece una nuova data definition.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la view entity `ZI_Connection` su `SPFLI` con la chiave `CarrierId` e `ConnectionId`, e gli elementi `CityFrom`, `CityTo`, `DepartureTime` e `Distance` con la sua unità `DistanceUnit`.
> 2. Apri la data preview e filtra i collegamenti da `FRANKFURT`.
> 3. Leggi la vista in un report con ABAP SQL e mostra il risultato con `cl_demo_output`.

### Soluzione

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Collegamenti aerei'
define view entity ZI_Connection
  as select from spfli
{
  key carrid   as CarrierId,
  key connid   as ConnectionId,
      cityfrom as CityFrom,
      cityto   as CityTo,
      deptime  as DepartureTime,
      @Semantics.quantity.unitOfMeasure: 'DistanceUnit'
      distance as Distance,
      distid   as DistanceUnit
}
```

```abap
SELECT FROM zi_connection
  FIELDS *
  WHERE CityFrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_connections).
cl_demo_output=>display( lt_connections ).
```

> [!NOTE]
>
> - Una CDS view entity (`define view entity`) definisce un modello di dati che gira nel database.
> - Le viste DDIC-based (`define view` con `@AbapCatalog.sqlViewName`) sono obsolete: crea view entity.
> - Le CDS view si creano in ADT; si attivano con `Ctrl+F3` e si controllano i dati con la data preview (`F8`).
> - Il mandante è gestito in automatico; ABAP SQL legge la vista con il nome dell'entità e gli alias degli elementi.
> - Segui i prefissi del VDM: `I_` per le viste riutilizzabili, `C_` per il consumo, `R_` per le viste base di RAP.
