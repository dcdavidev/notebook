---
title: Tabelle standard, sorted e hashed
description: Le tre categorie di tabella e quando usare ciascuna.
---

_Livello base_

Ogni tabella interna appartiene a una **categoria di tabella**: standard, sorted o hashed. La categoria decide come vengono conservate le righe e quanto velocemente il sistema trova una riga. Il contenuto può essere lo stesso; cambiano la velocità di lettura e le regole per aggiungere righe.

Scegliere la categoria giusta è uno dei modi più semplici per rendere veloce un programma. Una scelta sbagliata funziona benissimo con dieci righe e diventa lentissima con un milione.

## Le tre categorie

| Categoria  | Come sono tenute le righe                    | Accesso per indice | Accesso per chiave                                | Chiave                  |
| ---------- | -------------------------------------------- | ------------------ | ------------------------------------------------- | ----------------------- |
| `STANDARD` | nell'ordine in cui le aggiungi               | sì                 | ricerca lineare: legge una riga dopo l'altra      | `NON-UNIQUE` o vuota    |
| `SORTED`   | sempre ordinate per chiave                   | sì                 | ricerca binaria: veloce, cresce lentamente        | `UNIQUE` o `NON-UNIQUE` |
| `HASHED`   | in una struttura hash, senza ordine visibile | no                 | accesso hash: stessa velocità per ogni dimensione | solo `UNIQUE`           |

Le tabelle standard e sorted sono **tabelle indice**: ogni riga ha un numero (1, 2, 3...) e puoi leggere direttamente la riga 5. Una tabella hashed non ha indice: arrivi a una riga solo tramite la sua chiave.

> [!TIP]
> Una tabella standard è un mazzo di carte nell'ordine in cui le hai pescate: per trovare l'asso di cuori le guardi una per una. Una tabella sorted è un dizionario: lo apri a metà e restringi la ricerca. Una tabella hashed è un guardaroba con lo scontrino numerato: dai il numero e ricevi subito il cappotto, per quanti cappotti ci siano.

## Dichiarare ogni categoria

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_flight.

" Standard: non serve una chiave
DATA lt_standard TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

" Sorted: la chiave definisce l'ordine
DATA lt_sorted TYPE SORTED TABLE OF ty_flight
               WITH UNIQUE KEY carrid connid.

" Hashed: la chiave deve essere unica
DATA lt_hashed TYPE HASHED TABLE OF ty_flight
               WITH UNIQUE KEY carrid connid.
```

`DATA lt_tab TYPE TABLE OF ty_flight` senza categoria è la forma breve di `STANDARD TABLE OF ty_flight WITH DEFAULT KEY`. Spesso la chiave di default non è quella che vuoi: vedi [chiavi primarie e secondarie](./0035-table-keys.it.md).

## Come la categoria cambia il comportamento

Aggiungi le stesse righe, nello stesso ordine, a una tabella standard e a una sorted:

```abap
REPORT zflight_categories.

TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
       END OF ty_flight.

DATA lt_standard TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
DATA lt_sorted   TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.
DATA ls_flight   TYPE ty_flight.

ls_flight-carrid = 'LH'. ls_flight-connid = '0400'.
INSERT ls_flight INTO TABLE lt_standard.
INSERT ls_flight INTO TABLE lt_sorted.

ls_flight-carrid = 'AA'. ls_flight-connid = '0017'.
INSERT ls_flight INTO TABLE lt_standard.
INSERT ls_flight INTO TABLE lt_sorted.

WRITE / 'Standard:'.
LOOP AT lt_standard INTO ls_flight.
  WRITE: / ls_flight-carrid, ls_flight-connid.   " prima LH, poi AA
ENDLOOP.

WRITE / 'Sorted:'.
LOOP AT lt_sorted INTO ls_flight.
  WRITE: / ls_flight-carrid, ls_flight-connid.   " prima AA, poi LH
ENDLOOP.
```

`INSERT ... INTO TABLE` funziona con ogni categoria: una tabella standard accoda la riga in fondo, una sorted la mette al posto giusto, una hashed la memorizza in base alla chiave. I dettagli sono in [riempire le tabelle interne](./0036-filling-internal-tables.it.md).

Alcune istruzioni hanno senso solo per alcune categorie:

- `APPEND` funziona sulle tabelle standard. Su una sorted funziona solo se la nuova riga va in fondo; altrimenti il programma si ferma con un errore a runtime.
- L'accesso per indice (`INDEX 3`, `FROM 2 TO 5`) non è possibile sulle tabelle hashed.
- `SORT` non è ammessa sulle tabelle sorted: sono sempre ordinate per chiave.
- Non puoi modificare i campi chiave di una riga in una tabella sorted o hashed: romperesti l'ordine o l'hash.

> [!WARNING]
> Non usare mai `APPEND` su una tabella sorted, a meno che tu non sia sicuro che le righe arrivino già nell'ordine della chiave. Usa invece `INSERT ... INTO TABLE`: mette sempre la riga al posto giusto.

## Quale scegliere

| Situazione                                                           | Categoria |
| -------------------------------------------------------------------- | --------- |
| una tabella piccola, o che leggi soprattutto dall'inizio alla fine   | standard  |
| leggi le righe per indice, o devi mantenere l'ordine di inserimento  | standard  |
| leggi spesso per chiave e ti servono anche le righe in ordine        | sorted    |
| leggi per una parte della chiave (per esempio solo `carrid`)         | sorted    |
| una tabella grande che leggi solo per la sua chiave completa e unica | hashed    |

Una tabella sorted può usare una chiave parziale a partire da sinistra (per esempio solo `carrid` di `carrid connid`) per trovare le righe in fretta. Una tabella hashed ha bisogno ogni volta della chiave completa.

Per una tabella che leggi in più modi puoi aggiungere **chiavi secondarie** a qualsiasi categoria: vedi [chiavi primarie e secondarie](./0035-table-keys.it.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Dichiara una tabella hashed di compagnie aeree con i campi `carrid` e `carrname` e una chiave unica su `carrid`.
> 2. Inserisci `LH Lufthansa`, `AA American Airlines` e `AZ Alitalia`. Poi inserisci di nuovo `LH` con un altro nome e stampa `sy-subrc`.

### Soluzione

```abap
TYPES: BEGIN OF ty_airline,
         carrid   TYPE s_carr_id,
         carrname TYPE s_carrname,
       END OF ty_airline.

DATA lt_airlines TYPE HASHED TABLE OF ty_airline WITH UNIQUE KEY carrid.
DATA ls_airline  TYPE ty_airline.

ls_airline-carrid = 'LH'. ls_airline-carrname = 'Lufthansa'.
INSERT ls_airline INTO TABLE lt_airlines.
ls_airline-carrid = 'AA'. ls_airline-carrname = 'American Airlines'.
INSERT ls_airline INTO TABLE lt_airlines.
ls_airline-carrid = 'AZ'. ls_airline-carrname = 'Alitalia'.
INSERT ls_airline INTO TABLE lt_airlines.

ls_airline-carrid = 'LH'. ls_airline-carrname = 'Altro nome'.
INSERT ls_airline INTO TABLE lt_airlines.
WRITE: / 'sy-subrc:', sy-subrc.   " 4: la chiave LH esiste già
```

> [!NOTE]
>
> - Le tabelle standard mantengono l'ordine di inserimento e cercano per chiave una riga dopo l'altra.
> - Le tabelle sorted sono sempre ordinate per chiave e usano una ricerca binaria.
> - Le tabelle hashed non hanno indice e trovano una riga tramite la chiave unica completa in tempo costante.
> - Le tabelle standard e sorted sono tabelle indice; le hashed no.
> - Per le tabelle sorted e hashed usa `INSERT ... INTO TABLE`, non `APPEND`.
