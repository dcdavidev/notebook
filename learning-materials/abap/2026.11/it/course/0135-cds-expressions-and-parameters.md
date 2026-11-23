---
title: Espressioni, funzioni e parametri CDS
description: CASE, cast, funzioni predefinite, aggregati e parametri di input.
level: pro
---

Una CDS view non si limita a rinominare colonne. I suoi elementi possono essere **calcolati**: aritmetica, condizioni, conversioni di tipo, funzioni su stringhe e date, conversione di valuta, aggregati. Tutto gira nel database, quindi è vero [code pushdown](./0131-code-pushdown.md). Con i **parametri di input**, chi chiama può passare valori alla vista, come gli argomenti di un metodo.

La sintassi è vicina alle [espressioni di ABAP SQL](./0097-modern-abap-sql.md), con qualche dettaglio specifico delle CDS.

## Elementi calcolati e CASE

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Voli con elementi calcolati'
define view entity ZI_FlightCalc
  as select from sflight
{
  key carrid                                         as CarrierId,
  key connid                                         as ConnectionId,
  key fldate                                         as FlightDate,
      seatsmax - seatsocc                            as FreeSeats,
      division( seatsocc * 100, seatsmax, 2 )        as OccupancyPercent,
      case
        when seatsocc >= seatsmax then 'F'           // pieno
        when seatsocc = 0         then 'E'           // vuoto
        else                           'O'           // posti disponibili
      end                                            as OccupancyStatus,
      case carrid
        when 'LH' then 'X'
        when 'UA' then 'X'
        else           ' '
      end                                            as IsStarAlliance,
      concat_with_space( carrid, connid, 1 )         as FlightCode,
      cast( seatsocc as abap.fltp )                  as SeatsOccupiedFloat,
      dats_days_between( $session.system_date, fldate ) as DaysToDeparture
}
where
  seatsmax > 0                                       // niente divisione per zero
```

- L'aritmetica usa `+`, `-`, `*`. Per dividere interi usa `div( a, b )` (risultato intero) o `division( a, b, decimali )` (risultato decimale arrotondato). L'operatore `/` funziona solo con tipi in virgola mobile e decimali.
- Un **CASE con condizioni** (`case when condizione then ...`) verifica condizioni; un **CASE semplice** (`case elemento when valore then ...`) confronta un elemento con dei valori.
- `cast( operando as tipo )` converte in un tipo predefinito (`abap.char( 10 )`, `abap.dec( 15, 2 )`, `abap.fltp`, `abap.int8`) o in un elemento dati.
- Le **variabili di sessione** danno il contesto della richiesta corrente: `$session.system_date`, `$session.user`, `$session.system_language`, `$session.client`.

## Funzioni predefinite

| Gruppo     | Funzioni                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Numeriche  | `abs`, `ceil`, `floor`, `round`, `div`, `mod`, `division`                                                                            |
| Stringhe   | `concat`, `concat_with_space`, `substring`, `length`, `left`, `right`, `upper`, `lower`, `replace`, `lpad`, `rpad`, `ltrim`, `rtrim` |
| Date e ore | `dats_is_valid`, `dats_days_between`, `dats_add_days`, `dats_add_months`, `tstmp_current_utctimestamp`, `tstmp_to_dats`              |
| Null       | `coalesce( a, b )`: il primo valore non null                                                                                         |
| Unità      | `currency_conversion`, `unit_conversion`                                                                                             |

> [!WARNING]
> Un percorso attraverso un'associazione con `LEFT OUTER JOIN` restituisce **null** quando non c'è una riga di destinazione. In ABAP il null diventa il valore iniziale, ma dentro la vista un'espressione con un null è anch'essa null: `concat( null, 'X' )` è null, non `'X'`. Avvolgi questi valori in `coalesce( valore, '' )` quando li combini.

## Aggregati e GROUP BY

Le funzioni di aggregazione funzionano come in ABAP SQL. Ogni elemento non aggregato deve stare nella clausola `group by`:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Posti occupati per compagnia'
define view entity ZI_CarrierLoad
  as select from sflight
{
  key carrid                              as CarrierId,
      count( * )                          as FlightCount,
      sum( seatsocc )                     as SeatsOccupied,
      max( fldate )                       as LastFlightDate,
      avg( seatsocc as abap.dec( 10, 1 ) ) as AvgSeatsOccupied
}
group by
  carrid
having
  count( * ) > 10
```

`avg` richiede un tipo di destinazione con `as`, perché la media di interi non è un intero. `having` filtra i gruppi dopo l'aggregazione, come negli [aggregati di ABAP SQL](./0056-aggregates-and-group-by.md).

## I parametri di input

Una vista con **parametri** riceve valori da chi la chiama. Qui chi chiama sceglie una valuta di destinazione, e la vista converte i prezzi:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Prezzi dei voli in una valuta di destinazione'
define view entity ZI_FlightPrice
  with parameters
    p_currency : s_currcode,
    @Environment.systemField: #SYSTEM_DATE
    p_date     : abap.dats
  as select from sflight
{
  key carrid                 as CarrierId,
  key connid                 as ConnectionId,
  key fldate                 as FlightDate,
      @Semantics.amount.currencyCode: 'TargetCurrency'
      currency_conversion( amount             => price,
                           source_currency    => currency,
                           target_currency    => $parameters.p_currency,
                           exchange_rate_date => $parameters.p_date,
                           error_handling     => 'SET_TO_NULL' ) as PriceConverted,
      $parameters.p_currency as TargetCurrency
}
where
  fldate >= $parameters.p_date
```

- I parametri si dichiarano con `with parameters`, si tipizzano con un tipo predefinito o un elemento dati, e si usano come `$parameters.nome`.
- `@Environment.systemField: #SYSTEM_DATE` riempie il parametro con la data di sistema quando ABAP SQL non lo passa. Altri valori sono `#USER`, `#SYSTEM_LANGUAGE` e `#CLIENT`.
- `currency_conversion` usa i tassi di cambio della tabella `TCURR`. Senza `error_handling => 'SET_TO_NULL'`, un tasso mancante ferma la query con un errore.

ABAP SQL passa i parametri fra parentesi dopo il nome, con `=`; un'altra CDS view li passa con `:`.

```abap
SELECT FROM zi_flightprice( p_currency = 'EUR' )   " p_date: la data di sistema
  FIELDS CarrierId, ConnectionId, FlightDate, PriceConverted, TargetCurrency
  INTO TABLE @DATA(lt_prices).
```

```abap
  as select from ZI_FlightPrice( p_currency: 'EUR', p_date: $session.system_date )
```

## Esercizio

> [!IMPORTANT]
>
> 1. Crea `ZI_FlightCalc` e controlla `FreeSeats`, `OccupancyStatus` e `DaysToDeparture` nella data preview.
> 2. Crea una vista `ZI_ConnectionsFrom` su `SPFLI` con un parametro `p_city` (tipo `s_from_cit`) che restituisce i collegamenti da quella città e un elemento `Route` con `CityFrom` e `CityTo` separati da un trattino.
> 3. Leggila da ABAP per `'FRANKFURT'`.

### Soluzione

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Collegamenti da una città'
define view entity ZI_ConnectionsFrom
  with parameters
    p_city : s_from_cit
  as select from spfli
{
  key carrid                                  as CarrierId,
  key connid                                  as ConnectionId,
      concat( concat( cityfrom, '-' ), cityto ) as Route
}
where
  cityfrom = $parameters.p_city
```

```abap
SELECT FROM zi_connectionsfrom( p_city = 'FRANKFURT' )
  FIELDS *
  INTO TABLE @DATA(lt_routes).
```

`concat` ignora gli spazi finali dei suoi argomenti, quindi il risultato è `FRANKFURT-NEW YORK`.

> [!NOTE]
>
> - Gli elementi si calcolano con aritmetica, `CASE`, `cast` e funzioni predefinite; tutto gira nel database.
> - Usa `div` o `division` per gli interi; `/` funziona solo con tipi in virgola mobile e decimali.
> - Le variabili `$session` danno data di sistema, utente, lingua e mandante.
> - Gli aggregati richiedono `group by` per ogni elemento non aggregato; `having` filtra i gruppi.
> - Parametri: `with parameters`, `$parameters.nome` all'interno, `( nome = valore )` in ABAP SQL e `( nome: valore )` nelle CDS.
