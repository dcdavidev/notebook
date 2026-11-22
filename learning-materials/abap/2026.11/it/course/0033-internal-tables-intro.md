---
title: Che cos'è una tabella interna
description: 'Elenchi di righe in memoria: lo strumento più usato in ABAP.'
---

_Livello base_

Una **tabella interna** è un elenco di righe che vive nella memoria del tuo programma. Tutte le righe hanno lo stesso tipo, di solito una [struttura](./0031-structures.md), e la tabella può crescere o ridursi mentre il programma gira. Quando il programma finisce, la tabella sparisce.

Quasi ogni programma ABAP usa le tabelle interne: leggi i dati dal database in una tabella, li elabori in memoria e poi li mostri, li salvi o li passi a un altro programma. Qui vedi che cos'è una tabella interna, come si dichiara e come ci metti dentro le righe e le rileggi.

## Righe in memoria

Una **work area** è una variabile che contiene una riga. La tabella interna contiene tante righe dello stesso tipo. Riempi la work area, la copi nella tabella e più tardi copi le righe dalla tabella in una work area per leggerle.

> [!TIP]
> Il database è il grande archivio in cantina. Una tabella interna è la pila di fotocopie che ti porti alla scrivania: ci puoi scrivere sopra, riordinarle e buttarne via qualcuna. L'archivio non cambia, a meno che tu non scenda di nuovo ad aggiornarlo.

| Tabella del database                        | Tabella interna                          |
| ------------------------------------------- | ---------------------------------------- |
| vive nel database, su disco                 | vive nella memoria del programma         |
| esiste finché qualcuno non la cancella      | esiste solo mentre il programma gira     |
| condivisa da tutti gli utenti e i programmi | privata del tuo programma                |
| si legge e si scrive con ABAP SQL           | si legge e si scrive con istruzioni ABAP |

## Dichiarare una tabella interna

Una tabella interna si dichiara con `TYPE ... TABLE OF` seguito dal tipo di riga:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,   " codice compagnia aerea
         connid   TYPE s_conn_id,   " numero del collegamento
         cityfrom TYPE s_from_cit,  " città di partenza
         cityto   TYPE s_to_city,   " città di arrivo
       END OF ty_flight.

DATA lt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.  " la tabella
DATA ls_flight  TYPE ty_flight.                                   " una riga
```

- `STANDARD` è la **categoria di tabella**. Ce ne sono tre, spiegate in [tabelle standard, sorted e hashed](./0034-table-categories.md).
- `WITH EMPTY KEY` dice che la tabella non ha chiave. Le chiavi sono spiegate in [chiavi primarie e secondarie](./0035-table-keys.md).

Puoi anche definire un **tipo tabella** con `TYPES` e usarlo per più tabelle:

```abap
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA lt_rome_flights  TYPE tt_flights.
DATA lt_paris_flights TYPE tt_flights.
```

Il tipo di riga può venire anche dal Dizionario ABAP: `TYPE STANDARD TABLE OF spfli WITH EMPTY KEY` ti dà una tabella con tutti i campi della tabella del database `SPFLI`.

## Aggiungere righe e rileggerle

Il modo più semplice per aggiungere una riga è riempire la work area e accodarla alla tabella con `APPEND`. Per leggere tutte le righe usi `LOOP AT ... INTO`: il ciclo copia una riga alla volta nella work area.

```abap
REPORT zflight_table_intro.

TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_flight.

DATA lt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
DATA ls_flight  TYPE ty_flight.

ls_flight-carrid   = 'LH'.
ls_flight-connid   = '0400'.
ls_flight-cityfrom = 'FRANKFURT'.
ls_flight-cityto   = 'NEW YORK'.
APPEND ls_flight TO lt_flights.          " riga 1

ls_flight-carrid   = 'AZ'.
ls_flight-connid   = '0555'.
ls_flight-cityfrom = 'ROME'.
ls_flight-cityto   = 'FRANKFURT'.
APPEND ls_flight TO lt_flights.          " riga 2

DATA(lv_lines) = lines( lt_flights ).   " numero di righe
WRITE: / 'Righe:', lv_lines.

LOOP AT lt_flights INTO ls_flight.
  WRITE: / sy-tabix, ls_flight-carrid, ls_flight-connid,
           ls_flight-cityfrom, ls_flight-cityto.
ENDLOOP.
```

- `lines( lt_flights )` restituisce il numero di righe.
- Dentro il ciclo, `sy-tabix` contiene il numero della riga corrente.
- `IF lt_flights IS INITIAL` è vera quando la tabella non ha righe.

Ci sono molti altri modi per riempire una tabella, per esempio `VALUE` e `INSERT`: li trovi in [riempire le tabelle interne](./0036-filling-internal-tables.md). Nei programmi veri le righe arrivano di solito dal database con una `SELECT ... INTO TABLE`, che incontrerai in [leggere dati con SELECT](./0052-select-basics.md).

## Tabelle con header line (obsolete)

Nel codice vecchio troverai tabelle dichiarate così:

```abap
DATA itab TYPE TABLE OF ty_flight WITH HEADER LINE.   " obsoleto
DATA: BEGIN OF itab2 OCCURS 0,                        " obsoleto
        carrid TYPE s_carr_id,
      END OF itab2.
```

Una **header line** è una work area con lo stesso nome della tabella: `itab` indica la work area e `itab[]` il corpo della tabella. È fonte di confusione e non è ammessa nelle classi. Riconoscila nei programmi vecchi, ma nel tuo codice dichiara sempre una work area separata.

> [!WARNING]
> Con una header line, `CLEAR itab` svuota solo la work area, non le righe. Per svuotare la tabella serve `CLEAR itab[]`. È un errore frequente nel codice vecchio.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report con una tabella di compagnie aeree: ogni riga ha il codice della compagnia (`s_carr_id`) e il nome (`s_carrname`).
> 2. Accoda tre compagnie a tua scelta, poi stampa il numero di righe e ogni riga con il suo numero.

### Soluzione

```abap
REPORT zairline_table.

TYPES: BEGIN OF ty_airline,
         carrid   TYPE s_carr_id,
         carrname TYPE s_carrname,
       END OF ty_airline.

DATA lt_airlines TYPE STANDARD TABLE OF ty_airline WITH EMPTY KEY.
DATA ls_airline  TYPE ty_airline.

ls_airline-carrid = 'LH'. ls_airline-carrname = 'Lufthansa'.
APPEND ls_airline TO lt_airlines.
ls_airline-carrid = 'AZ'. ls_airline-carrname = 'Alitalia'.
APPEND ls_airline TO lt_airlines.
ls_airline-carrid = 'AF'. ls_airline-carrname = 'Air France'.
APPEND ls_airline TO lt_airlines.

DATA(lv_lines) = lines( lt_airlines ).
WRITE: / 'Compagnie:', lv_lines.
LOOP AT lt_airlines INTO ls_airline.
  WRITE: / sy-tabix, ls_airline-carrid, ls_airline-carrname.
ENDLOOP.
```

> [!NOTE]
>
> - Una tabella interna è un elenco di righe dello stesso tipo, nella memoria del programma.
> - Una work area contiene una riga; copi le righe fra la work area e la tabella.
> - La dichiari con `TYPE STANDARD TABLE OF tipo_riga WITH EMPTY KEY`, oppure definisci un tipo tabella con `TYPES`.
> - `APPEND` aggiunge una riga in fondo, `LOOP AT ... INTO` legge tutte le righe, `lines( )` le conta.
> - Le tabelle con header line sono obsolete: usa sempre una work area separata.
