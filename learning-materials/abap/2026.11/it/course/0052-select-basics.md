---
title: Leggere dati con SELECT
description: 'Le prime query ABAP SQL: campi, INTO e sy-subrc.'
level: basic
---

**ABAP SQL** è la parte del linguaggio ABAP che legge e scrive le tabelle del database. Somiglia all'SQL standard, ma viene controllato dal compilatore ABAP e funziona allo stesso modo su tutti i database supportati da SAP. L'istruzione più importante è `SELECT`: legge righe dal database e le mette in variabili e tabelle interne.

Quasi ogni programma che scriverai comincia con una `SELECT`. Questa lezione mostra la forma di base: quali colonne leggere, dove mettere il risultato e come sapere se hai trovato qualcosa.

## La tua prima SELECT

Questo report legge tutte le compagnie aeree da `SCARR` in una tabella interna e le stampa:

```abap
REPORT zselect_demo.

SELECT carrid, carrname, currcode
  FROM scarr
  INTO TABLE @DATA(lt_carriers).

LOOP AT lt_carriers INTO DATA(ls_carrier).
  WRITE: / ls_carrier-carrid, ls_carrier-carrname, ls_carrier-currcode.
ENDLOOP.
```

Le parti dell'istruzione:

| Parte                     | Significato                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `SELECT carrid, carrname` | la **lista di selezione**: le colonne da leggere, separate da virgole     |
| `FROM scarr`              | la **sorgente dati**: una tabella del database, una vista o un'entità CDS |
| `INTO TABLE @DATA(...)`   | la **destinazione**: qui una nuova tabella interna dichiarata inline      |

La `@` davanti a `DATA(...)` indica una variabile ABAP, detta **variabile host**, così il compilatore la distingue da una colonna del database. Usala per ogni variabile ABAP dentro una `SELECT`. [ABAP SQL moderno](./0097-modern-abap-sql.md) approfondisce le variabili host e le espressioni SQL.

Il mandante non lo scrivi: ABAP SQL legge solo le righe del mandante corrente e aggiunge da solo la condizione su `MANDT`.

> [!TIP]
> Una `SELECT` è come un ordine al banco della gastronomia. Dici quali prodotti vuoi (la lista di selezione), da quale banco (`FROM`) e porgi il vassoio (`INTO`). Il commesso riempie il vassoio: non passi tu dietro al banco a prendere le cose.

## Scegliere le colonne

`SELECT *` legge tutte le colonne. È comodo, ma sposta più dati del necessario, soprattutto sulle tabelle con molti campi. Elenca le colonne che usi.

```abap
* Tutte le colonne: il tipo di riga è SCARR
SELECT * FROM scarr INTO TABLE @DATA(lt_all).

* Solo due colonne: il tipo di riga ha solo CARRID e CARRNAME
SELECT carrid, carrname FROM scarr INTO TABLE @DATA(lt_names).
```

Se hai già una tabella di destinazione con una struttura diversa, `INTO CORRESPONDING FIELDS OF TABLE` copia ogni colonna nel componente con lo stesso nome e ignora gli altri:

```abap
TYPES: BEGIN OF ty_carrier,
         carrid   TYPE s_carr_id,
         carrname TYPE s_carrname,
         url      TYPE s_carrurl,
       END OF ty_carrier.

DATA lt_carriers TYPE STANDARD TABLE OF ty_carrier WITH EMPTY KEY.

SELECT carrid, carrname
  FROM scarr
  INTO CORRESPONDING FIELDS OF TABLE @lt_carriers.   " URL resta vuoto
```

`INTO TABLE` sostituisce il contenuto della destinazione. Per aggiungere le righe a quelle già presenti usa invece `APPENDING TABLE`.

Da ABAP 7.50 puoi anche scrivere prima la clausola `FROM` e poi le colonne dopo `FIELDS`. Il risultato è lo stesso, ma così ADT ti propone i nomi delle colonne mentre scrivi:

```abap
SELECT FROM scarr
  FIELDS carrid, carrname
  INTO TABLE @DATA(lt_carriers2).
```

## `sy-subrc` e `sy-dbcnt`

Dopo ogni `SELECT`, il runtime imposta due [campi di sistema](./0023-system-fields.md):

- `sy-subrc` vale `0` se è stata letta almeno una riga, e `4` se non ne è stata letta nessuna.
- `sy-dbcnt` contiene il numero di righe lette.

```abap
SELECT carrid, carrname
  FROM scarr
  INTO TABLE @DATA(lt_found).

IF sy-subrc = 0.
  WRITE: / sy-dbcnt, 'compagnie trovate'.
ELSE.
  WRITE: / 'Nessuna compagnia trovata. Genera i dati con SAPBC_DATA_GENERATOR.'.
ENDIF.
```

Con `INTO TABLE` puoi anche controllare `lt_found IS INITIAL`: un risultato vuoto lascia una tabella vuota.

## I loop SELECT e la sintassi vecchia

Senza `TABLE`, una `SELECT` è un ciclo: legge una riga alla volta in una struttura ed esegue il codice fino a `ENDSELECT` per ogni riga.

```abap
SELECT carrid, carrname
  FROM scarr
  INTO @DATA(ls_carrier).
  WRITE: / ls_carrier-carrid, ls_carrier-carrname.
ENDSELECT.
```

> [!WARNING]
> Evita i loop `SELECT ... ENDSELECT`. Tengono aperto il cursore del database mentre il tuo codice gira, e ti invogliano a mettere altre `SELECT` dentro il ciclo. Leggi tutto in una tabella interna con `INTO TABLE`, poi fai `LOOP AT`.

Nei programmi più vecchi troverai le stesse istruzioni senza virgole e senza `@`:

```abap
DATA lt_old TYPE STANDARD TABLE OF scarr.
SELECT carrid carrname FROM scarr INTO CORRESPONDING FIELDS OF TABLE lt_old.  " stile vecchio
```

Questa sintassi funziona ancora, ma non puoi mescolarla con le dichiarazioni inline né con le altre funzioni moderne. Scrivi il codice nuovo con le virgole e la `@`.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi le colonne `CARRID`, `CONNID`, `CITYFROM` e `CITYTO` di tutti i collegamenti di `SPFLI` in una tabella interna dichiarata inline.
> 2. Stampa il numero di righe lette, poi una riga per ogni collegamento. Se non trovi niente, stampa invece un messaggio.

### Soluzione

```abap
REPORT zselect_spfli.

SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  INTO TABLE @DATA(lt_connections).

IF sy-subrc <> 0.
  WRITE: / 'Nessun collegamento trovato.'.
  RETURN.
ENDIF.

WRITE: / sy-dbcnt, 'collegamenti'.
LOOP AT lt_connections INTO DATA(ls_connection).
  WRITE: / ls_connection-carrid, ls_connection-connid,
           ls_connection-cityfrom, ls_connection-cityto.
ENDLOOP.
```

> [!NOTE]
>
> - `SELECT colonne FROM sorgente INTO destinazione` legge i dati; al mandante ci pensa ABAP SQL.
> - Separa le colonne con le virgole e metti `@` davanti a ogni variabile ABAP.
> - Elenca le colonne che ti servono invece di usare `SELECT *`.
> - `sy-subrc = 0` significa che sono state trovate righe; `sy-dbcnt` dice quante.
> - Preferisci `INTO TABLE` seguito da `LOOP AT` a un loop `SELECT ... ENDSELECT`.
