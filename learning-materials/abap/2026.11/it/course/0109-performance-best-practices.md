---
title: Scrivere ABAP veloce
description: Le regole che rendono veloci i programmi sul database e in memoria.
---

_Livello intermedio_

La maggior parte dei programmi ABAP lenti è lenta per gli stessi pochi motivi: leggono troppi dati, chiamano il database troppo spesso o cercano riga per riga in grandi tabelle interne. Una manciata di regole evita quasi tutti questi problemi, e quando scrivi codice nuovo non costano nulla.

Prima misura con gli strumenti dell'[analisi delle prestazioni](./0108-performance-analysis.md); poi applica la regola adatta al problema che hai trovato.

## Le regole per il database

Il database è condiviso da tutti gli utenti, e ogni viaggio fino a lui costa tempo. Queste cinque regole sono le linee guida classiche per ABAP SQL:

| Regola                                 | Come                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Tieni piccolo l'insieme dei risultati  | sempre una clausola `WHERE`; `UP TO n ROWS` quando ti servono poche righe |
| Trasferisci solo i dati che ti servono | elenca le colonne invece di `SELECT *`; aggrega sul database              |
| Riduci il numero di round trip         | niente `SELECT` nei cicli; usa join, subquery o `FOR ALL ENTRIES`         |
| Tieni basso lo sforzo di ricerca       | filtra su campi chiave o di indice                                        |
| Riduci il carico sul database          | usa il buffer delle tabelle per tabelle piccole che cambiano di rado      |

```abap
" Lento: tutte le colonne, tutte le righe, totali calcolati in ABAP
SELECT * FROM sflight INTO TABLE @DATA(lt_all).
LOOP AT lt_all INTO DATA(ls_all) WHERE carrid = 'LH'.
  lv_seats = lv_seats + ls_all-seatsocc.
ENDLOOP.

" Veloce: il database filtra e somma, torna indietro una riga sola
SELECT SUM( seatsocc ) FROM sflight
  WHERE carrid = 'LH'
  INTO @DATA(lv_total).
```

## Meno round trip

Una `SELECT` dentro un `LOOP` è il problema di prestazioni più comune in ABAP: 10.000 righe significano 10.000 chiamate al database. Leggi invece tutto quello che ti serve con una sola istruzione:

- un [join](./0055-joins.md) quando i dati sono in tabelle collegate;
- [`FOR ALL ENTRIES`](./0057-for-all-entries.md) o un [join con una tabella interna](./0098-advanced-abap-sql.md) quando le chiavi vengono da una tabella in memoria;
- poi leggi i dettagli da una tabella interna per chiave.

Lo stesso vale per le scritture: modifica molte righe con una sola istruzione.

```abap
" Lento: una INSERT per riga
LOOP AT lt_new_bookings INTO DATA(ls_new).
  INSERT zbooking FROM @ls_new.
ENDLOOP.

" Veloce: una sola INSERT di massa
INSERT zbooking FROM TABLE @lt_new_bookings.
```

> [!WARNING]
> Prima di `FOR ALL ENTRIES`, controlla sempre che la tabella guida non sia vuota. Con una tabella vuota la condizione `WHERE` viene ignorata e la `SELECT` legge l'intera tabella del database.

> [!TIP]
> Andare al database è come andare al supermercato. Dieci viaggi per dieci articoli richiedono molto più tempo di un viaggio solo con la lista della spesa, anche se il carrello è più pesante.

## Le tabelle interne

In memoria, il costo viene dalla ricerca. Una `READ TABLE` o un `LOOP ... WHERE` su una **tabella standard** guarda le righe una per una; su una tabella **sorted** o **hashed** salta direttamente alle righe giuste. La differenza è piccola con 100 righe ed enorme con 100.000.

| Accesso                                            | Tabella standard | Tabella sorted                | Tabella hashed         |
| -------------------------------------------------- | ---------------- | ----------------------------- | ---------------------- |
| Lettura per chiave completa                        | lineare          | binaria (veloce)              | costante (velocissima) |
| `LOOP ... WHERE` sulla parte iniziale della chiave | lineare          | binaria, poi le righe trovate | lineare                |
| Lettura per indice                                 | costante         | costante                      | non possibile          |

La trappola classica è il ciclo annidato:

```abap
" Lento: per ogni volo, una scansione completa di tutte le prenotazioni
LOOP AT lt_flights INTO DATA(ls_flight).
  LOOP AT lt_bookings INTO DATA(ls_booking)
       WHERE carrid = ls_flight-carrid AND connid = ls_flight-connid.
    " ...
  ENDLOOP.
ENDLOOP.

" Veloce: prenotazioni in una tabella sorted, il LOOP interno trova le righe con ricerca binaria
DATA lt_bookings_sorted TYPE SORTED TABLE OF sbook
  WITH NON-UNIQUE KEY carrid connid.
lt_bookings_sorted = lt_bookings.

LOOP AT lt_flights INTO ls_flight.
  LOOP AT lt_bookings_sorted INTO ls_booking
       WHERE carrid = ls_flight-carrid AND connid = ls_flight-connid.
    " ...
  ENDLOOP.
ENDLOOP.
```

Altre regole per le tabelle interne:

- Scegli il [tipo di tabella](./0034-table-categories.md) in base all'accesso che ti serve, e aggiungi una [chiave secondaria](./0035-table-keys.md) quando una tabella viene letta per due chiavi diverse.
- Su una tabella standard che devi tenere, fai `SORT` una volta e usa `READ TABLE ... BINARY SEARCH` invece di cercare riga per riga.
- Nei cicli usa `ASSIGNING FIELD-SYMBOL(<ls_row>)` o `REFERENCE INTO` per righe larghe e quando le modifichi: `INTO` copia ogni riga.
- Non costruire grandi tabelle riga per riga con `INSERT ... INDEX 1` né usare `DELETE` dentro un ciclo su una tabella standard: ogni chiamata sposta tutte le righe che seguono.

## Non ottimizzare tutto

Un codice leggibile conta più delle micro-ottimizzazioni che fanno risparmiare un millisecondo. Applica le regole qui sopra mentre scrivi, poi misura. Ottimizza solo dove la traccia mostra che va il tempo, e misura di nuovo per dimostrare che la modifica è servita.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che legge `SFLIGHT` per una compagnia e, per ogni volo, conta le prenotazioni in `SBOOK` con una `SELECT COUNT(*)` dentro il ciclo.
> 2. Riscrivilo con una sola `SELECT` che raggruppa le prenotazioni per volo.
> 3. Confronta le due versioni con `ST05`.

### Soluzione

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT FROM sflight AS f
    LEFT OUTER JOIN sbook AS b
      ON  b~carrid = f~carrid
      AND b~connid = f~connid
      AND b~fldate = f~fldate
    FIELDS f~carrid, f~connid, f~fldate, COUNT( b~bookid ) AS bookings
    WHERE f~carrid = @p_carrid
    GROUP BY f~carrid, f~connid, f~fldate
    INTO TABLE @DATA(lt_result).

  cl_demo_output=>display( lt_result ).
```

`COUNT( b~bookid )` conta solo le prenotazioni trovate, quindi i voli senza prenotazioni ricevono 0.

> [!NOTE]
>
> - Leggi poche righe e poche colonne, e lascia che sia il database a filtrare e aggregare.
> - Evita le `SELECT` nei cicli: usa join, `FOR ALL ENTRIES` (mai con una tabella vuota) o un join con una tabella interna.
> - Scrivi con operazioni di massa come `INSERT ... FROM TABLE`.
> - Usa tabelle sorted e hashed o chiavi secondarie per l'accesso per chiave; evita i cicli annidati sulle tabelle standard.
> - Misura prima e dopo: ottimizza dove va davvero il tempo.
