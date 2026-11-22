---
title: Ciclare sulle tabelle interne
description: LOOP AT con WHERE, FROM, TO e le istruzioni di livello di controllo.
---

_Livello base_

`LOOP AT` elabora le righe di una tabella interna una dopo l'altra. È l'istruzione che scriverai più spesso con le tabelle interne. Puoi limitare il ciclo alle righe che soddisfano una condizione o a un intervallo di numeri di riga, e puoi reagire quando un gruppo di righe comincia o finisce con le **istruzioni di livello di controllo**.

Gli esempi usano voli di `SFLIGHT`:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         seatsocc TYPE s_seatsocc,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AZ' connid = '0555' fldate = '20260301' seatsocc = 80 )
  ( carrid = 'AZ' connid = '0555' fldate = '20260308' seatsocc = 95 )
  ( carrid = 'LH' connid = '0400' fldate = '20260301' seatsocc = 120 )
  ( carrid = 'LH' connid = '0402' fldate = '20260302' seatsocc = 60 ) ).
```

## LOOP AT ... INTO

A ogni passo, `LOOP AT ... INTO` copia la riga corrente nella work area e `sy-tabix` contiene il suo numero di riga:

```abap
LOOP AT lt_flights INTO DATA(ls_flight).
  WRITE: / sy-tabix, ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
ENDLOOP.

IF sy-subrc <> 0.
  WRITE / 'La tabella è vuota'.   " sy-subrc = 4 se non c'è stato nessun passo
ENDIF.
```

- Dopo `ENDLOOP`, `sy-subrc` vale 0 se il ciclo è stato eseguito almeno una volta, 4 altrimenti.
- `EXIT`, `CONTINUE` e `CHECK` funzionano dentro `LOOP` come negli altri cicli: vedi [EXIT, CONTINUE e CHECK](./0027-exit-continue-check.md).
- Modificare la work area non modifica la tabella. Per cambiare le righe usa `ASSIGNING` (vedi [i field symbol](./0041-field-symbols.md)) o `MODIFY` (vedi [modificare e cancellare righe](./0039-changing-and-deleting-rows.md)).

## WHERE, FROM e TO

`WHERE` elabora solo le righe che soddisfano una condizione. `FROM` e `TO` limitano il ciclo a un intervallo di numeri di riga (solo tabelle indice).

```abap
" Solo i voli Lufthansa con più di 100 posti occupati
LOOP AT lt_flights INTO ls_flight WHERE carrid = 'LH' AND seatsocc > 100.
  WRITE: / ls_flight-connid, ls_flight-fldate.
ENDLOOP.

" Solo le righe da 2 a 3
LOOP AT lt_flights INTO ls_flight FROM 2 TO 3.
  WRITE: / sy-tabix, ls_flight-carrid.
ENDLOOP.
```

`WHERE` è più veloce di un `IF` dentro il ciclo, e su una tabella sorted, o con una [chiave secondaria](./0035-table-keys.md) e `USING KEY`, il sistema salta direttamente alle righe giuste invece di leggerle tutte.

> [!WARNING]
> Un ciclo dentro un ciclo su due tabelle standard grandi (per esempio tutte le prenotazioni per ogni volo) legge `n × m` righe e diventa lentissimo. Rendi la tabella interna al ciclo sorted o hashed, oppure dalle una chiave secondaria, così il `LOOP ... WHERE` o il `READ TABLE` interno non scorre tutta la tabella.

## Le istruzioni di livello di controllo

Dentro un ciclo puoi eseguire codice quando un gruppo di righe comincia o finisce. I gruppi sono formati dai campi più a sinistra della riga, quindi la tabella **deve essere ordinata** prima per quei campi.

| Istruzione        | Viene eseguita                                                                    |
| ----------------- | --------------------------------------------------------------------------------- |
| `AT FIRST`        | una volta, alla prima riga                                                        |
| `AT NEW campo`    | alla prima riga di ogni gruppo di `campo`                                         |
| `AT END OF campo` | all'ultima riga di ogni gruppo di `campo`                                         |
| `AT LAST`         | una volta, all'ultima riga                                                        |
| `SUM`             | dentro `AT END OF` o `AT LAST`: somma i campi numerici del gruppo nella work area |

Un gruppo "di `campo`" sono tutte le righe consecutive con lo stesso valore in `campo` **e in tutti i campi alla sua sinistra**. `SORT` è spiegata in [ordinare, sommare e togliere duplicati](./0040-sorting-and-duplicates.md).

```abap
SORT lt_flights BY carrid connid.

LOOP AT lt_flights INTO ls_flight.
  AT FIRST.
    WRITE / 'Posti occupati per compagnia'.
    ULINE.
  ENDAT.

  AT NEW carrid.
    WRITE / ls_flight-carrid.            " la prima riga di una nuova compagnia
  ENDAT.

  WRITE: /5 ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc.

  AT END OF carrid.
    SUM.                                 " ora seatsocc contiene il totale del gruppo
    WRITE: /5 'Totale', ls_flight-seatsocc.
  ENDAT.

  AT LAST.
    SUM.
    WRITE: / 'Totale generale', ls_flight-seatsocc.
  ENDAT.
ENDLOOP.
```

Regole per i livelli di controllo:

- Dentro `AT ... ENDAT`, i campi a destra del campo di gruppo non contengono i valori della riga corrente: vengono sostituiti da valori iniziali o da asterischi. Usali fuori dal blocco `AT`.
- Non combinare i livelli di controllo con `WHERE`, `FROM` o `TO`: i gruppi verrebbero calcolati sulla tabella intera, non sulle righe che elabori.
- La work area deve avere il tipo di riga della tabella (qui ci pensa `INTO DATA(ls_flight)`).

> [!TIP]
> I livelli di controllo sono come i subtotali di uno scontrino del supermercato ordinato per reparto: la cassa stampa un'intestazione quando inizia un nuovo reparto, gli articoli e un subtotale quando finisce. Se gli articoli non fossero ordinati per reparto, avresti un'intestazione e un subtotale per ogni articolo.

Per raggruppamenti più flessibili, senza ordinare e senza le regole sugli asterischi, l'ABAP moderno ha `LOOP AT ... GROUP BY`: vedi [raggruppare le tabelle interne](./0095-grouping-internal-tables.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Con la tabella `lt_flights` di questa lezione, stampa solo i voli del `20260301`.
> 2. Ordina la tabella per `carrid connid` e stampa, per ogni collegamento, il totale di `seatsocc` con `AT END OF connid` e `SUM`.

### Soluzione

```abap
LOOP AT lt_flights INTO DATA(ls_flight) WHERE fldate = '20260301'.
  WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
ENDLOOP.

SORT lt_flights BY carrid connid.
LOOP AT lt_flights INTO ls_flight.
  AT END OF connid.
    SUM.
    WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-seatsocc.
  ENDAT.
ENDLOOP.
```

`AT END OF connid` chiude un gruppo ogni volta che cambia `carrid` o `connid`, perché `carrid` sta a sinistra di `connid`.

> [!NOTE]
>
> - `LOOP AT ... INTO` copia ogni riga in una work area; `sy-tabix` è il numero della riga corrente.
> - `WHERE` filtra le righe; `FROM` e `TO` limitano i numeri di riga (solo tabelle indice).
> - I cicli annidati su tabelle standard grandi sono lenti: per la tabella interna al ciclo usa tabelle sorted o hashed, o chiavi secondarie.
> - `AT FIRST`, `AT NEW`, `AT END OF` e `AT LAST` richiedono una tabella ordinata per i campi di gruppo; `SUM` somma i campi numerici.
> - Dentro un blocco `AT`, i campi a destra del campo di gruppo non sono affidabili.
