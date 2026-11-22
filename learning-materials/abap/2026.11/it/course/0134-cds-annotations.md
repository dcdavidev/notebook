---
title: Le annotazioni CDS
description: Metadati per semantica, UI, analisi e ricerca.
---

_Livello pro_

Un'**annotazione** aggiunge metadati a un'entità CDS o a uno dei suoi elementi. Non cambia l'SQL che gira nel database. Dice al compilatore e ai framework che cosa significano i dati: questo campo è un importo in quella valuta, questo è il testo di quella chiave, questa vista è un cubo analitico, mostra questa colonna per prima nell'elenco.

La stessa vista può servire un report, un'app Fiori, una ricerca e una query analitica, e le annotazioni sono ciò che ogni consumatore legge per sapere come usarla.

> [!TIP]
> Le annotazioni sono come le etichette sui barattoli in cucina. Il barattolo contiene la stessa farina con o senza etichetta, ma l'etichetta dice a tutti che cosa c'è dentro, quando scade e su quale ripiano va.

## Sintassi e posizione

Un'annotazione inizia con `@`, ha un nome con i punti e di solito un valore:

```abap
@EndUserText.label: 'Voli'                           // valore di testo
@Search.searchable: true                             // booleano
@AccessControl.authorizationCheck: #NOT_REQUIRED     // valore di enumerazione, con #
@UI.lineItem: [ { position: 10, importance: #HIGH } ] // array di strutture
@ObjectModel: { representativeKey: 'CarrierId',      // stesso prefisso, raggruppato fra graffe
                usageType: { serviceQuality: #A } }
```

- Le **annotazioni di entità** vanno prima di `define view entity` e valgono per tutta la vista.
- Le **annotazioni di elemento** vanno subito prima dell'elemento (o dopo, con `@<`) e valgono solo per quell'elemento.
- Le annotazioni di elemento vengono **propagate**: se `ZC_FlightList` legge da `ZI_Flight`, eredita le annotazioni di elemento di `ZI_Flight`. `@Metadata.ignorePropagatedAnnotations: true` disattiva questo comportamento.

Esistono due gruppi. Le **annotazioni ABAP** vengono valutate dal compilatore e dal runtime ABAP: `@AccessControl`, `@EndUserText`, `@Semantics.amount`, `@Environment`, `@AbapCatalog`. Le **annotazioni specifiche dei framework** sono solo metadati salvati con la vista, letti da un consumatore come Fiori elements (`@UI`), il motore analitico (`@Analytics`) o la ricerca (`@Search`). Un errore di battitura in un'annotazione di framework non blocca l'attivazione, quindi controllala con il completamento del codice (`Ctrl+Space`).

## Semantica e testi

Queste annotazioni descrivono che cosa significano i dati, e quasi ogni vista ne ha bisogno:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Compagnie aeree'
@ObjectModel.representativeKey: 'CarrierId'
@Search.searchable: true
define view entity ZI_Carrier
  as select from scarr
{
      @ObjectModel.text.element: [ 'CarrierName' ]
      @Search.defaultSearchElement: true
  key carrid   as CarrierId,
      @Semantics.text: true
      @Search.defaultSearchElement: true
      @Search.fuzzinessThreshold: 0.8
      carrname as CarrierName,
      currcode as CurrencyCode,
      url      as Url
}
```

| Annotazione                                                            | Significato                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@EndUserText.label`                                                   | l'etichetta della vista o dell'elemento, traducibile               |
| `@Semantics.amount.currencyCode: 'Currency'`                           | questo elemento è un importo nella valuta dell'elemento `Currency` |
| `@Semantics.quantity.unitOfMeasure: 'Unit'`                            | questo elemento è una quantità nell'unità dell'elemento `Unit`     |
| `@Semantics.text: true`                                                | questo elemento è un testo (un nome o una descrizione)             |
| `@ObjectModel.text.element: [ 'CarrierName' ]`                         | il testo di questa chiave è l'elemento `CarrierName`               |
| `@Semantics.user.createdBy`, `@Semantics.systemDateTime.lastChangedAt` | campi amministrativi, riempiti da RAP                              |

## Ricerca, aiuti alla ricerca e analisi

Le annotazioni `@Search` rendono una vista utilizzabile in una ricerca a testo libero. `@Search.searchable: true` sulla vista, `@Search.defaultSearchElement: true` sugli elementi in cui cercare, e `@Search.fuzzinessThreshold` (da 0 a 1) per accettare errori di battitura. Fiori elements le usa per il campo di ricerca sopra un elenco.

Le annotazioni `@Consumption` descrivono come un consumatore deve offrire un elemento, per esempio l'aiuto alla ricerca:

```abap
      @Consumption.valueHelpDefinition: [ { entity: { name: 'ZI_Carrier', element: 'CarrierId' } } ]
  key carrid as CarrierId,
```

Le annotazioni `@Analytics` trasformano le viste in un modello analitico. Un **cubo** contiene le misure e punta alle **dimensioni** tramite associazioni di chiave esterna:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Occupazione dei voli'
@Analytics.dataCategory: #CUBE
define view entity ZI_FlightCube
  as select from sflight
  association [1..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
      @ObjectModel.foreignKey.association: '_Carrier'
  key carrid   as CarrierId,
  key connid   as ConnectionId,
  key fldate   as FlightDate,
      @Aggregation.default: #SUM
      seatsmax as SeatsMax,
      @Aggregation.default: #SUM
      seatsocc as SeatsOccupied,
      _Carrier
}
```

Per un modello analitico completo, `ZI_Carrier` riceve `@Analytics.dataCategory: #DIMENSION`, e una vista query sopra il cubo definisce righe, colonne e filtri per strumenti come SAP Analytics Cloud.

## Annotazioni UI e metadata extension

Le annotazioni `@UI` descrivono una schermata Fiori elements: quali colonne mostra l'elenco (`@UI.lineItem`), quali campi sono filtri (`@UI.selectionField`) e che cosa contiene la object page (`@UI.identification`, `@UI.facet`, `@UI.headerInfo`).

Le annotazioni UI diventano presto lunghe, quindi di solito vivono in un oggetto separato, una **metadata extension**, invece che nella vista stessa. La vista lo permette con `@Metadata.allowExtensions: true`. Le scriverai entrambe in [app Fiori elements dalle annotazioni](./0145-rap-fiori-elements.md).

> [!WARNING]
> Non mettere tutto in una sola vista. Tieni le annotazioni semantiche (`@Semantics`, `@ObjectModel`) nelle viste interface riutilizzabili, e le annotazioni UI e di consumo nel livello di consumo o nelle sue metadata extension, dove dipende da loro una sola app.

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi a `ZI_Carrier` le annotazioni viste sopra, attiva e apri la vista **Active Annotations** (clic destro sul sorgente, **Open With > Active Annotations**).
> 2. In `ZI_Flight`, aggiungi `@EndUserText.label: 'Posti occupati'` a `SeatsOccupied` e controlla nella stessa vista quale etichetta vince.
> 3. Crea `ZI_FlightCube` e aprilo nella data preview.

### Soluzione

La vista **Active Annotations** elenca tutte le annotazioni che valgono per ogni elemento, comprese quelle propagate e le etichette che arrivano dagli elementi dati. Il tuo `@EndUserText.label` su `SeatsOccupied` sostituisce l'etichetta dell'elemento dati `S_SEATSOCC`: un'annotazione scritta nella vista vince sempre su una propagata.

> [!NOTE]
>
> - Le annotazioni aggiungono metadati a entità ed elementi; non cambiano l'SQL.
> - Le annotazioni di entità vanno prima di `define view entity`, quelle di elemento prima dell'elemento; le annotazioni di elemento vengono propagate.
> - Le annotazioni ABAP le valuta il compilatore; quelle dei framework (`@UI`, `@Analytics`, `@Search`) le leggono i consumatori.
> - `@Semantics` e `@ObjectModel` descrivono importi, quantità, testi e chiavi; `@Search` e `@Consumption` servono per la ricerca e gli aiuti alla ricerca; `@Analytics` costruisce cubi e dimensioni.
> - Metti le annotazioni UI nelle metadata extension, non nelle viste riutilizzabili.
