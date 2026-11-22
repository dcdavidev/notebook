---
title: Le associazioni CDS
description: Relazioni fra entità, path expression ed esposizione.
---

_Livello pro_

Un'**associazione** dichiara una relazione fra due entità CDS: un volo appartiene a una compagnia, una compagnia ha molti collegamenti. A differenza di un join, un'associazione è solo una definizione. Il database unisce le due sorgenti **solo quando qualcuno usa l'associazione**, e solo con i campi richiesti.

Le associazioni sono il modo in cui si costruiscono i modelli CDS: il virtual data model di SAP è una rete di viste collegate da associazioni, e RAP, Fiori elements e l'analisi dei dati le percorrono tutte.

> [!TIP]
> Un join è come prenotare in anticipo un taxi per ogni spostamento che potresti fare durante la giornata. Un'associazione è come avere l'app del taxi sul telefono: chiami un'auto solo quando devi davvero andare da qualche parte.

## Definire un'associazione

Gli esempi usano `ZI_Connection` della lezione sulle [CDS view entity](./0132-cds-view-entities.md) e una piccola vista delle compagnie:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Compagnie aeree'
define view entity ZI_Carrier
  as select from scarr
  association [0..*] to ZI_Connection as _Connection
    on $projection.CarrierId = _Connection.CarrierId
{
  key carrid   as CarrierId,
      carrname as CarrierName,
      currcode as CurrencyCode,
      url      as Url,
      _Connection                       // associazione esposta
}
```

Ora la vista dei voli, con due associazioni verso uno:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Voli'
define view entity ZI_Flight
  as select from sflight
  association [1..1] to ZI_Carrier    as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
  association [1..1] to ZI_Connection as _Connection
    on  $projection.CarrierId    = _Connection.CarrierId
    and $projection.ConnectionId = _Connection.ConnectionId
{
  key carrid               as CarrierId,
  key connid               as ConnectionId,
  key fldate               as FlightDate,
      seatsmax             as SeatsMax,
      seatsocc             as SeatsOccupied,
      _Carrier.CarrierName as CarrierName,   // path expression: diventa un join
      _Carrier,                              // esposta
      _Connection                            // esposta
}
```

- L'associazione sta fra la sorgente dati e la lista degli elementi: `association [cardinalità] to destinazione as _Alias on condizione`.
- Per convenzione, i nomi delle associazioni iniziano con un underscore.
- `$projection.CarrierId` fa riferimento a un elemento di questa vista tramite il suo alias. Puoi anche usare direttamente il campo della sorgente (`sflight.carrid`).
- La **cardinalità** dice quante righe della destinazione corrispondono a una riga della sorgente.

| Cardinalità | Significato                       |
| ----------- | --------------------------------- |
| `[0..1]`    | zero o una (verso uno)            |
| `[1..1]`    | esattamente una                   |
| `[0..*]`    | un numero qualsiasi (verso molti) |
| `[1..*]`    | almeno una                        |

`[1]` da solo è l'abbreviazione di `[0..1]`, e senza cardinalità vale `[0..1]`. I rilasci recenti accettano anche una forma più leggibile come `association of many to one ZI_Carrier as _Carrier`.

> [!WARNING]
> La cardinalità è una promessa, non un controllo. Se dichiari `[0..1]` e i dati hanno più righe corrispondenti, ogni percorso attraverso l'associazione moltiplica le righe del risultato senza alcun errore. Dichiara la cardinalità che i dati hanno davvero.

## Le path expression

Una **path expression** segue un'associazione per leggere un campo della destinazione: `_Carrier.CarrierName`. Quando la vista la usa nella lista degli elementi, il sistema aggiunge un `LEFT OUTER JOIN` all'SQL generato. Le associazioni che non usi non costano nulla.

Puoi seguire più associazioni di fila, aggiungere un filtro e cambiare il tipo di join:

```abap
  _Connection._Carrier.CarrierName                 // due passi (vedi l'esercizio)
  _Carrier[ CurrencyCode = 'EUR' ].CarrierName     // filtro sulla destinazione
  _Carrier[ inner ].CarrierName                    // INNER invece di LEFT OUTER JOIN
```

Un percorso attraverso un'associazione verso molti, come `_Connection.CityTo` in `ZI_Carrier`, restituisce una riga per collegamento, non una per compagnia. Usalo di proposito, oppure aggiungi un filtro che lasci una sola riga: `_Connection[1: CityFrom = 'FRANKFURT'].CityTo`, dove `1:` dichiara il risultato filtrato come verso uno.

## Esporre le associazioni

Elencare il nome dell'associazione nella lista degli elementi, come `_Carrier` sopra, la **espone**: chiunque legga la vista può continuare a navigarla. L'esposizione da sola non aggiunge nessun join. Per esporre un'associazione, ogni campo della sorgente usato nella sua condizione `on` deve essere anche nella lista degli elementi.

In ABAP SQL navighi un'associazione esposta con una barra rovesciata e un trattino:

```abap
SELECT FROM zi_flight
  FIELDS CarrierId,
         ConnectionId,
         FlightDate,
         \_Carrier-CarrierName AS CarrierName,
         \_Connection-CityFrom AS CityFrom,
         \_Connection-CityTo   AS CityTo
  WHERE CarrierId = 'LH'
  INTO TABLE @DATA(lt_flights).
```

Altre CDS view costruite sopra `ZI_Flight` possono usare `_Carrier` e `_Connection` allo stesso modo. Le app Fiori elements seguono le associazioni esposte per la navigazione e gli aiuti alla ricerca, e RAP usa associazioni speciali, le composizioni e `to parent`, per costruire i business object (vedi [il data model RAP](./0140-rap-data-model.md)).

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi a `ZI_Connection` un'associazione `_Carrier` verso `ZI_Carrier`, esponila e aggiungi l'elemento `CarrierName` con una path expression.
> 2. In un report, leggi i collegamenti da `FRANKFURT` con l'URL della compagnia tramite `\_Carrier-Url`.
> 3. In `ZI_Carrier`, aggiungi `_Connection.CityTo` alla lista degli elementi e confronta il numero di righe nella data preview prima e dopo.

### Soluzione

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Collegamenti aerei'
define view entity ZI_Connection
  as select from spfli
  association [1..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
  key carrid               as CarrierId,
  key connid               as ConnectionId,
      cityfrom             as CityFrom,
      cityto               as CityTo,
      // ... gli altri elementi della lezione precedente
      _Carrier.CarrierName as CarrierName,
      _Carrier
}
```

```abap
SELECT FROM zi_connection
  FIELDS CarrierId, ConnectionId, CityTo, \_Carrier-Url AS Url
  WHERE CityFrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_connections).
```

Al passo 3 il numero di righe passa da una per compagnia a una per collegamento: il percorso verso molti moltiplica le righe. Poi togli di nuovo l'elemento. `ZI_Carrier` e `ZI_Connection` possono puntarsi a vicenda; le CDS ammettono associazioni cicliche, purché tu non le segua in un giro chiuso.

> [!NOTE]
>
> - Un'associazione dichiara una relazione; il join avviene solo quando una path expression la usa.
> - Sintassi: `association [cardinalità] to destinazione as _Alias on $projection.campo = _Alias.campo`.
> - La cardinalità è una promessa: valori sbagliati moltiplicano le righe senza avvisare.
> - Le path expression possono concatenare associazioni, filtrare la destinazione e scegliere il tipo di join.
> - Le associazioni esposte si navigano da altre CDS view e da ABAP SQL con `\_Alias-campo`.
