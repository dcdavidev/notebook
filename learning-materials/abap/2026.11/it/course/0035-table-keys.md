---
title: Chiavi primarie e secondarie
description: Chiavi uniche e non uniche, chiavi vuote e chiavi secondarie.
---

_Livello base_

Una **chiave di tabella** è un insieme di campi che il sistema usa per trovare le righe in una tabella interna. Ogni tabella ha una **chiave primaria** e può avere fino a 15 **chiavi secondarie** per altri modi di leggerla.

La chiave decide se i duplicati sono ammessi, come sono organizzate le tabelle sorted e hashed e quanto è veloce una lettura per chiave. Scegliere la chiave fa parte della dichiarazione della tabella, proprio come scegliere la [categoria di tabella](./0034-table-categories.md).

## Chiavi uniche e non uniche

Elenchi i campi chiave dopo `KEY` e dici se due righe possono avere gli stessi valori di chiave:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         price    TYPE s_price,
       END OF ty_flight.

" Unica: una sola riga per carrid + connid + fldate
DATA lt_flights TYPE SORTED TABLE OF ty_flight
                WITH UNIQUE KEY carrid connid fldate.

" Non unica: più righe possono avere lo stesso carrid + connid
DATA lt_by_conn TYPE SORTED TABLE OF ty_flight
                WITH NON-UNIQUE KEY carrid connid.
```

| Categoria | Chiavi primarie ammesse                               |
| --------- | ----------------------------------------------------- |
| standard  | chiave `NON-UNIQUE`, chiave di default o chiave vuota |
| sorted    | chiave `UNIQUE` o `NON-UNIQUE`                        |
| hashed    | solo chiave `UNIQUE`                                  |

Con una chiave unica, se inserisci un duplicato con `INSERT ... INTO TABLE` la riga non viene aggiunta e `sy-subrc` vale 4. Per una tabella standard, `WITH KEY` da solo significa `WITH NON-UNIQUE KEY`.

Se il tipo di riga non è una struttura, per esempio in una tabella di stringhe, la chiave è l'intera riga. La scrivi con la pseudo-componente `table_line`:

```abap
DATA lt_cities TYPE SORTED TABLE OF string WITH UNIQUE KEY table_line.
```

## Chiave di default e chiave vuota

Due forme speciali valgono solo per la chiave primaria:

- `WITH DEFAULT KEY`: la chiave è formata da tutti i campi di tipo carattere e byte della riga (per esempio `c`, `n`, `d`, `t`, `x`, `string`). I campi numerici ne restano fuori.
- `WITH EMPTY KEY`: la tabella non ha nessuna chiave. Solo le tabelle standard possono avere una chiave vuota.

```abap
DATA lt_default TYPE STANDARD TABLE OF ty_flight WITH DEFAULT KEY.
" chiave = carrid connid fldate (price è numerico, quindi resta fuori)

DATA lt_empty TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
" nessuna chiave: quando cerchi dici sempre quali campi usare
```

> [!WARNING]
> La chiave di default dipende dai tipi dei campi, quindi è facile sbagliarla: aggiungi un campo di testo alla struttura e diventa in silenzio parte della chiave. Le istruzioni che usano la chiave primaria, come `SORT itab` senza `BY` o `DELETE ADJACENT DUPLICATES` senza `COMPARING`, a quel punto si comportano in modo diverso. Per le tabelle standard preferisci `WITH EMPTY KEY` o una chiave esplicita.

> [!TIP]
> Una chiave è come il modo in cui una biblioteca dispone i libri sugli scaffali. Per autore (chiave unica: una posizione per ogni libro) è la chiave primaria. Un secondo catalogo per argomento è una chiave secondaria: i libri non si spostano, ma hai un altro modo veloce per trovarli.

## Le chiavi secondarie

Una **chiave secondaria** offre un secondo percorso di accesso veloce alle stesse righe. La aggiungi dopo la chiave primaria con un nome, un tipo (`SORTED` o `HASHED`) e i suoi campi dopo `COMPONENTS`:

```abap
TYPES: BEGIN OF ty_connection,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_connection.

DATA lt_connections TYPE HASHED TABLE OF ty_connection
  WITH UNIQUE KEY carrid connid                          " chiave primaria
  WITH NON-UNIQUE SORTED KEY by_from COMPONENTS cityfrom. " chiave secondaria
```

Scegli la chiave con `WITH KEY nome_chiave COMPONENTS` quando leggi e con `USING KEY` quando cicli:

```abap
" Leggere una riga tramite la chiave secondaria
READ TABLE lt_connections INTO DATA(ls_conn)
     WITH KEY by_from COMPONENTS cityfrom = 'FRANKFURT'.

" Ciclare solo sulle righe che corrispondono, tramite la chiave secondaria
LOOP AT lt_connections INTO ls_conn USING KEY by_from
     WHERE cityfrom = 'FRANKFURT'.
  WRITE: / ls_conn-carrid, ls_conn-connid, ls_conn-cityto.
ENDLOOP.
```

`READ TABLE` e `LOOP AT` sono spiegati in [leggere singole righe](./0037-reading-internal-tables.md) e in [ciclare sulle tabelle interne](./0038-looping-internal-tables.md).

Regole da ricordare:

- Una chiave secondaria hashed deve essere `UNIQUE`. Una chiave secondaria sorted può essere `UNIQUE` o `NON-UNIQUE`.
- La chiave primaria si chiama sempre `primary_key`; puoi scrivere `USING KEY primary_key` per essere esplicito.
- Ogni chiave secondaria costa memoria e tempo quando le righe cambiano. Aggiungila solo se leggi davvero la tabella per quei campi e se la tabella è grande.
- Una chiave secondaria non unica viene costruita la prima volta che la usi, non a ogni inserimento.

## Esercizio

> [!IMPORTANT]
>
> 1. Dichiara una tabella standard di voli con `carrid`, `connid`, `fldate` e `seatsocc` (`s_seatsocc`), con una chiave primaria vuota e una chiave secondaria sorted non unica `by_date` su `fldate`.
> 2. Aggiungi tre voli, due dei quali nella stessa data, e cicla solo sui voli di quella data usando la chiave secondaria.

### Soluzione

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         seatsocc TYPE s_seatsocc,
       END OF ty_flight.

DATA lt_flights TYPE STANDARD TABLE OF ty_flight
  WITH EMPTY KEY
  WITH NON-UNIQUE SORTED KEY by_date COMPONENTS fldate.
DATA ls_flight TYPE ty_flight.

ls_flight-carrid = 'LH'. ls_flight-connid = '0400'.
ls_flight-fldate = '20260301'. ls_flight-seatsocc = 120.
APPEND ls_flight TO lt_flights.
ls_flight-carrid = 'AZ'. ls_flight-connid = '0555'.
ls_flight-fldate = '20260301'. ls_flight-seatsocc = 80.
APPEND ls_flight TO lt_flights.
ls_flight-carrid = 'AA'. ls_flight-connid = '0017'.
ls_flight-fldate = '20260302'. ls_flight-seatsocc = 200.
APPEND ls_flight TO lt_flights.

LOOP AT lt_flights INTO ls_flight USING KEY by_date WHERE fldate = '20260301'.
  WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
ENDLOOP.
```

> [!NOTE]
>
> - Ogni tabella interna ha una chiave primaria: unica, non unica, di default o vuota.
> - Le tabelle hashed richiedono una chiave unica; solo le tabelle standard possono avere una chiave vuota.
> - La chiave di default prende tutti i campi di tipo carattere e byte: preferisci una chiave esplicita o `WITH EMPTY KEY`.
> - Le chiavi secondarie (`SORTED` o `HASHED`) aggiungono percorsi di accesso veloci su altri campi; le usi con `WITH KEY ... COMPONENTS` e `USING KEY`.
> - `table_line` indica l'intera riga quando il tipo di riga non è una struttura.
