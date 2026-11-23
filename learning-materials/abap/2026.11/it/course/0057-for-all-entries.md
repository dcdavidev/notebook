---
title: FOR ALL ENTRIES
description: Leggere le righe che corrispondono al contenuto di una tabella interna.
level: basic
---

A volte i valori su cui filtri non stanno nella schermata di selezione ma in una tabella interna: i collegamenti che hai appena letto, i materiali che un utente ha caricato da un file, il risultato di un modulo funzione. `FOR ALL ENTRIES IN` legge le righe del database che corrispondono a **una qualsiasi** riga di una tabella interna, con una sola istruzione.

È uno dei costrutti più usati dell'ABAP classico, e uno dei più facili da sbagliare. Questa lezione mostra come funziona e le regole per usarlo in sicurezza.

## Come funziona

Indichi la tabella interna dopo `FOR ALL ENTRIES IN` e, nella `WHERE`, confronti le colonne con i suoi componenti:

```abap
REPORT zfae_demo.

" 1. La tabella guida: i collegamenti che partono da Francoforte
SELECT carrid, connid, cityto
  FROM spfli
  WHERE cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_connections).

" 2. I voli di quei collegamenti
IF lt_connections IS NOT INITIAL.
  SELECT carrid, connid, fldate, price, currency
    FROM sflight
    FOR ALL ENTRIES IN @lt_connections
    WHERE carrid = @lt_connections-carrid
      AND connid = @lt_connections-connid
    INTO TABLE @DATA(lt_flights).
ENDIF.

WRITE: / lines( lt_flights ), 'voli da Francoforte'.
```

La tabella interna si chiama **tabella guida** (_driver table_). Concettualmente, il database esegue la `SELECT` una volta per ogni riga della tabella guida e unisce i risultati. In pratica l'interfaccia del database raggruppa le righe in poche istruzioni grandi, ma il risultato è lo stesso.

> [!TIP]
> `FOR ALL ENTRIES` è come dare al bibliotecario la tua lista di titoli invece di chiedere un libro alla volta. Il bibliotecario porta tutti i libri della lista in un solo viaggio. Ma se gli consegni una lista vuota, un bibliotecario distratto ti porta l'intera biblioteca.

## Regola 1: mai una tabella guida vuota

Se la tabella guida è vuota, il database ignora la condizione `WHERE` e restituisce **tutte le righe** della tabella.

```abap
CLEAR lt_connections.

SELECT carrid, connid, fldate
  FROM sflight
  FOR ALL ENTRIES IN @lt_connections
  WHERE carrid = @lt_connections-carrid
    AND connid = @lt_connections-connid
  INTO TABLE @DATA(lt_everything).          " tutti i voli di tutte le compagnie!
```

> [!CAUTION]
> Su una tabella grande, come i documenti contabili, una tabella guida vuota legge milioni di righe, riempie la memoria e finisce in un dump o in un tempo di esecuzione lunghissimo. Metti sempre `IF lt_driver IS NOT INITIAL.` intorno a un `FOR ALL ENTRIES`.

## Regola 2: i duplicati spariscono

`FOR ALL ENTRIES` elimina le righe duplicate dal risultato, come se avessi scritto `DISTINCT`. Se la lista di selezione non contiene la chiave primaria completa, due righe diverse del database con gli stessi valori nelle colonne selezionate diventano una riga sola, e perdi dati.

```abap
" Sbagliato: due prenotazioni con lo stesso prezzo sullo stesso volo diventano una riga
SELECT carrid, connid, fldate, loccuram
  FROM sbook
  FOR ALL ENTRIES IN @lt_flights
  WHERE carrid = @lt_flights-carrid
    AND connid = @lt_flights-connid
    AND fldate = @lt_flights-fldate
  INTO TABLE @DATA(lt_amounts).

" Giusto: includi la chiave completa (BOOKID) così ogni prenotazione resta
SELECT carrid, connid, fldate, bookid, loccuram
  FROM sbook
  FOR ALL ENTRIES IN @lt_flights
  WHERE carrid = @lt_flights-carrid
    AND connid = @lt_flights-connid
    AND fldate = @lt_flights-fldate
  INTO TABLE @DATA(lt_bookings).
```

> [!WARNING]
> Se sommi gli importi di `lt_amounts` della prima query, il totale è troppo basso e nessuno se ne accorge. Seleziona sempre la chiave primaria completa della tabella che leggi con `FOR ALL ENTRIES`.

## Altre regole e buone abitudini

- **Togli i duplicati dalla tabella guida** prima di usarla. La stessa chiave due volte rende solo più grande l'istruzione. Ordina la tabella e usa `DELETE ADJACENT DUPLICATES` (vedi [Ordinare, sommare e togliere i duplicati](./0040-sorting-and-duplicates.md)).
- **Non contare sull'ordine** del risultato. Se ti serve un ordine, ordinalo in ABAP con `SORT`.
- **Evita gli aggregati** (`SUM`, `COUNT`, ...) e `GROUP BY`: con `FOR ALL ENTRIES` sono limitati e i risultati non sono quelli che ti aspetti. Leggi le righe e sommale in ABAP, oppure usa un join.
- **Fai coincidere i tipi**: il componente della tabella guida deve avere lo stesso tipo della colonna con cui lo confronti.

```abap
SORT lt_connections BY carrid connid.
DELETE ADJACENT DUPLICATES FROM lt_connections COMPARING carrid connid.
```

## FOR ALL ENTRIES o un join

Se entrambe le tabelle stanno nel database, un [join](./0055-joins.md) di solito è più semplice e più veloce: una sola istruzione, nessun rischio di tabella vuota, nessun duplicato perso. L'esempio in due passi all'inizio di questa lezione si scrive meglio così:

```abap
SELECT f~carrid, f~connid, f~fldate, f~price, f~currency
  FROM spfli AS p
  INNER JOIN sflight AS f ON f~carrid = p~carrid
                         AND f~connid = p~connid
  WHERE p~cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_flights_join).
```

Usa `FOR ALL ENTRIES` quando la tabella guida non viene dal database: un file, l'input dell'utente, la chiamata a un'API. Da ABAP 7.52 puoi anche usare una tabella interna direttamente come sorgente dati di una `SELECT`, e così cadono quasi tutti questi limiti: vedi [ABAP SQL avanzato](./0098-advanced-abap-sql.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Costruisci a mano una tabella interna con tre numeri cliente (per esempio `1`, `2` e `3`).
> 2. Con `FOR ALL ENTRIES` leggi da `SBOOK` tutte le prenotazioni di quei clienti, senza perderne nessuna.
> 3. Assicurati che il programma non faccia niente se la tabella è vuota.

### Soluzione

```abap
REPORT zfae_exercise.

TYPES tt_customers TYPE STANDARD TABLE OF s_customer WITH EMPTY KEY.

DATA(lt_customers) = VALUE tt_customers( ( '00000001' ) ( '00000002' ) ( '00000003' ) ).

SORT lt_customers.
DELETE ADJACENT DUPLICATES FROM lt_customers.

IF lt_customers IS INITIAL.
  RETURN.
ENDIF.

SELECT carrid, connid, fldate, bookid, customid, loccuram, loccurkey
  FROM sbook
  FOR ALL ENTRIES IN @lt_customers
  WHERE customid = @lt_customers-table_line
  INTO TABLE @DATA(lt_bookings).

WRITE: / lines( lt_bookings ), 'prenotazioni'.
```

La tabella guida non ha una struttura, quindi la sua unica colonna si chiama `table_line`.

> [!NOTE]
>
> - `FOR ALL ENTRIES IN @itab` legge le righe che corrispondono a una qualsiasi riga di una tabella interna.
> - Con una tabella guida vuota vengono lette tutte le righe: controlla sempre prima `IS NOT INITIAL`.
> - Le righe duplicate del risultato vengono eliminate: seleziona la chiave primaria completa.
> - Togli i duplicati dalla tabella guida e ordina il risultato in ABAP.
> - Preferisci un join quando entrambe le tabelle stanno nel database.
