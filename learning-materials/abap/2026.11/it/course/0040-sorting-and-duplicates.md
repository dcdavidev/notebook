---
title: Ordinare, sommare e togliere duplicati
description: SORT, DELETE ADJACENT DUPLICATES e COLLECT.
---

_Livello base_

Tre istruzioni coprono lavori che farai sulle tabelle interne di continuo. `SORT` mette le righe in ordine, `DELETE ADJACENT DUPLICATES` toglie le righe ripetute e `COLLECT` somma i campi numerici delle righe che hanno la stessa chiave.

Gli esempi usano prenotazioni, con una riga per ogni posto prenotato:

```abap
TYPES: BEGIN OF ty_booking,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         customid TYPE s_customer,
         luggweight TYPE s_lugweigh,
       END OF ty_booking.
TYPES tt_bookings TYPE STANDARD TABLE OF ty_booking WITH EMPTY KEY.

DATA(lt_bookings) = VALUE tt_bookings(
  ( carrid = 'LH' connid = '0400' customid = '00000002' luggweight = '20.0' )
  ( carrid = 'AZ' connid = '0555' customid = '00000001' luggweight = '15.5' )
  ( carrid = 'LH' connid = '0400' customid = '00000001' luggweight = '23.0' )
  ( carrid = 'AZ' connid = '0555' customid = '00000001' luggweight = '8.0' ) ).
```

## SORT

`SORT` ordina le righe di una tabella standard o hashed. Indica sempre per quali campi ordinare:

```abap
SORT lt_bookings BY carrid connid.                    " crescente (default)
SORT lt_bookings BY luggweight DESCENDING.            " prima i più pesanti
SORT lt_bookings BY carrid ASCENDING luggweight DESCENDING.
```

| Aggiunta                   | Significato                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `BY f1 f2 ...`             | ordina per questi campi, in quest'ordine                                            |
| `ASCENDING` / `DESCENDING` | direzione; dopo `BY` vale per il campo che la precede                               |
| `STABLE`                   | le righe con gli stessi valori di ordinamento mantengono il loro ordine relativo    |
| `AS TEXT`                  | ordina i campi di testo in ordine alfabetico per la lingua di logon, non per codice |

Senza `BY`, `SORT` usa la chiave primaria della tabella. Per una tabella con chiave vuota, significa che non viene ordinato nulla. Le tabelle sorted non si possono ordinare con `SORT`: il loro ordine è fissato dalla chiave.

> [!WARNING]
> Senza `STABLE`, le righe con valori di ordinamento uguali possono finire in un ordine qualsiasi, e l'ordine può cambiare da un'esecuzione all'altra. Se l'ordine di quelle righe conta, aggiungi `STABLE` o altri campi dopo `BY`.

## DELETE ADJACENT DUPLICATES

`DELETE ADJACENT DUPLICATES` toglie una riga quando ha gli stessi valori della riga immediatamente precedente. I duplicati vengono trovati solo se sono vicini, quindi prima ordini:

```abap
" Una riga per cliente e collegamento
SORT lt_bookings BY carrid connid customid.
DELETE ADJACENT DUPLICATES FROM lt_bookings COMPARING carrid connid customid.

" Righe identiche in tutti i campi
DELETE ADJACENT DUPLICATES FROM lt_bookings COMPARING ALL FIELDS.
```

La prima riga di ogni gruppo resta, le altre spariscono. Senza `COMPARING`, l'istruzione confronta la chiave primaria, cosa che per una tabella con chiave vuota non ha senso: scrivi sempre `COMPARING`.

Un uso frequente è costruire l'elenco dei valori distinti da una tabella più grande:

```abap
DATA(lt_customers) = lt_bookings.
SORT lt_customers BY customid.
DELETE ADJACENT DUPLICATES FROM lt_customers COMPARING customid.
" una riga per cliente (gli altri campi vengono dalla prima riga di ogni gruppo)
```

> [!TIP]
> `DELETE ADJACENT DUPLICATES` è come un insegnante che controlla una fila di studenti: si accorge che qualcuno è in fila due volte solo se i due sono uno accanto all'altro. Mettere prima la fila in ordine alfabetico è ciò che fa funzionare il controllo.

## COLLECT

`COLLECT` aggiunge una riga a una tabella, ma se esiste già una riga con la stessa chiave, **somma i campi numerici** a quella riga invece di inserirne una nuova. La chiave è la chiave primaria della tabella, e tutti gli altri campi devono essere numerici (`i`, `p`, `f`, `decfloat16`, `decfloat34`, ...).

```abap
TYPES: BEGIN OF ty_total,
         carrid     TYPE s_carr_id,
         connid     TYPE s_conn_id,
         luggweight TYPE s_lugweigh,   " numerico: sommato da COLLECT
       END OF ty_total.

DATA lt_totals TYPE SORTED TABLE OF ty_total WITH UNIQUE KEY carrid connid.

LOOP AT lt_bookings INTO DATA(ls_booking).
  DATA(ls_total) = CORRESPONDING ty_total( ls_booking ).
  COLLECT ls_total INTO lt_totals.
ENDLOOP.

LOOP AT lt_totals INTO ls_total.
  WRITE: / ls_total-carrid, ls_total-connid, ls_total-luggweight.
ENDLOOP.
" AZ 0555 23.5
" LH 0400 43.0
```

`CORRESPONDING ty_total( ls_booking )` copia i campi con lo stesso nome dalla prenotazione alla riga di totale. È spiegato in [FILTER e CORRESPONDING](./0094-filter-and-corresponding.md).

> [!WARNING]
> Con una tabella standard e la chiave di default, la chiave è formata da tutti i campi di tipo carattere: se uno di questi non deve far parte del raggruppamento, `COLLECT` crea righe separate. Dichiara la tabella con una chiave unica esplicita, come nell'esempio, così è chiaro per che cosa raggruppa `COLLECT`.

L'ABAP moderno ha altri modi per totalizzare le righe, come `REDUCE` e `LOOP AT ... GROUP BY`: vedi [FOR e REDUCE](./0093-for-and-reduce.md) e [raggruppare le tabelle interne](./0095-grouping-internal-tables.md). Per i totali dei dati del database, di solito è meglio una `SELECT` con aggregati: vedi [aggregati, GROUP BY e HAVING](./0056-aggregates-and-group-by.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Con `lt_bookings` di questa lezione, costruisci l'elenco dei valori distinti di `carrid` e stampalo.
> 2. Con `COLLECT`, calcola il peso totale del bagaglio per cliente e stampalo, dal più pesante.

### Soluzione

```abap
DATA(lt_airlines) = lt_bookings.
SORT lt_airlines BY carrid.
DELETE ADJACENT DUPLICATES FROM lt_airlines COMPARING carrid.
LOOP AT lt_airlines INTO DATA(ls_airline).
  WRITE / ls_airline-carrid.
ENDLOOP.

TYPES: BEGIN OF ty_cust_total,
         customid   TYPE s_customer,
         luggweight TYPE s_lugweigh,
       END OF ty_cust_total.
DATA lt_cust TYPE STANDARD TABLE OF ty_cust_total WITH KEY customid.

LOOP AT lt_bookings INTO DATA(ls_booking).
  DATA(ls_cust) = CORRESPONDING ty_cust_total( ls_booking ).
  COLLECT ls_cust INTO lt_cust.
ENDLOOP.

SORT lt_cust BY luggweight DESCENDING.
LOOP AT lt_cust INTO ls_cust.
  WRITE: / ls_cust-customid, ls_cust-luggweight.
ENDLOOP.
```

> [!NOTE]
>
> - `SORT itab BY f1 f2` ordina una tabella standard o hashed; aggiungi `DESCENDING`, `STABLE` o `AS TEXT` quando serve.
> - Le tabelle sorted non si ordinano con `SORT`, e `SORT` senza `BY` usa la chiave primaria.
> - `DELETE ADJACENT DUPLICATES ... COMPARING` toglie i vicini ripetuti: prima ordina per gli stessi campi.
> - `COLLECT` somma i campi numerici delle righe con la stessa chiave primaria; dai alla tabella una chiave esplicita.
> - Per i totali, valuta `REDUCE`, `GROUP BY` in un ciclo o una `SELECT` con aggregati.
