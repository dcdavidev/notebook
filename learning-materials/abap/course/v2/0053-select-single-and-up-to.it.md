---
title: SELECT SINGLE e UP TO n ROWS
description: Leggere una riga, o solo le prime righe.
---

_Livello base_

Spesso non ti serve una tabella intera. Vuoi la compagnia aerea di cui l'utente ha inserito il codice, o i cinque voli più cari. Leggere tutto e buttarne via la maggior parte fa perdere tempo al database e alla rete.

`SELECT SINGLE` legge esattamente una riga in una struttura. `UP TO n ROWS` limita un risultato alle sue prime `n` righe. Entrambi dicono al database di fermarsi prima.

## SELECT SINGLE

`SELECT SINGLE` legge una riga e la mette in una struttura o in una singola variabile. La combini sempre con una clausola `WHERE` che identifica la riga; le condizioni le vedi nel dettaglio in [WHERE e ORDER BY](./0054-where-and-order-by.it.md).

```abap
REPORT zselect_single_demo.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT SINGLE carrid, carrname, currcode
    FROM scarr
    WHERE carrid = @p_carr
    INTO @DATA(ls_carrier).

  IF sy-subrc = 0.
    WRITE: / ls_carrier-carrid, ls_carrier-carrname, ls_carrier-currcode.
  ELSE.
    WRITE: / 'Compagnia', p_carr, 'non trovata'.
  ENDIF.
```

- La destinazione non ha `TABLE`: è una struttura, qui dichiarata inline.
- `p_carr` è una variabile ABAP, quindi ha la `@`.
- `sy-subrc` vale `0` se la riga esiste e `4` se non esiste. In quel caso la destinazione mantiene il contenuto precedente, quindi non usarla mai senza controllare.

Con una sola colonna, la destinazione può essere una variabile semplice:

```abap
SELECT SINGLE carrname
  FROM scarr
  WHERE carrid = @p_carr
  INTO @DATA(lv_name).
```

> [!WARNING]
> Usa `SELECT SINGLE` con la **chiave primaria completa** nella `WHERE` (mandante escluso). Se la condizione trova più righe, il database ne restituisce una, e quale non è definito. Il controllo esteso del programma e l'ATC te lo segnalano.

## Controllare che una riga esista

Per sapere soltanto se una riga esiste, non ti serve nessuna delle sue colonne. Seleziona invece una costante:

```abap
SELECT SINGLE @abap_true
  FROM spfli
  WHERE carrid = @p_carr
  INTO @DATA(lv_exists).

IF lv_exists = abap_true.
  WRITE: / p_carr, 'ha almeno un collegamento'.
ENDIF.
```

Qui la `WHERE` non è la chiave completa, e va bene così: non ti interessa quale riga trova il database, solo che ce ne sia una.

> [!TIP]
> `SELECT SINGLE @abap_true` è come telefonare a un ristorante per chiedere "avete un tavolo libero stasera?". Non chiedi quale tavolo: ti basta un sì.

## UP TO n ROWS

`UP TO n ROWS` legge al massimo `n` righe in una tabella interna. Perché "le prime righe" abbiano un senso, ordina il risultato con `ORDER BY`:

```abap
SELECT carrid, connid, fldate, price
  FROM sflight
  ORDER BY price DESCENDING
  INTO TABLE @DATA(lt_expensive)
  UP TO 5 ROWS.

LOOP AT lt_expensive INTO DATA(ls_flight).
  WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-fldate, ls_flight-price.
ENDLOOP.
```

Il database ordina tutti i voli per prezzo, dal più alto, e restituisce solo i primi cinque. `sy-dbcnt` ti dice quante righe hai ottenuto davvero: meno di cinque se la tabella è piccola.

Senza `ORDER BY` ottieni cinque righe qualsiasi, in un ordine non garantito. Va bene solo per prove veloci, del tipo "fammi vedere qualche dato".

Se `n` vale `0` non c'è limite: ottieni tutte le righe. `n` può essere una variabile, per esempio un parametro della schermata di selezione:

```abap
PARAMETERS p_max TYPE i DEFAULT 10.
...
SELECT carrid, connid, fldate
  FROM sflight
  ORDER BY carrid, connid, fldate
  INTO TABLE @DATA(lt_first)
  UP TO @p_max ROWS.
```

Da ABAP 7.51, `OFFSET o` salta le prime `o` righe: è utile per leggere un risultato una pagina alla volta. Richiede `ORDER BY`:

```abap
SELECT carrid, connid, fldate
  FROM sflight
  ORDER BY carrid, connid, fldate
  INTO TABLE @DATA(lt_page)
  UP TO 10 ROWS OFFSET 20.        " righe dalla 21 alla 30
```

## SINGLE o UP TO 1 ROWS

| Vuoi                                                          | Usa                                        |
| ------------------------------------------------------------- | ------------------------------------------ |
| la riga con questa chiave esatta                              | `SELECT SINGLE` con la chiave completa     |
| sapere se una riga qualsiasi soddisfa la condizione           | `SELECT SINGLE @abap_true`                 |
| la prima riga in un certo ordine (la più economica, l'ultima) | `ORDER BY` + `UP TO 1 ROWS` in una tabella |
| le prime `n` righe                                            | `ORDER BY` + `UP TO n ROWS`                |

`SELECT SINGLE` non ammette `ORDER BY`. Nel codice più vecchio vedrai `SELECT ... UP TO 1 ROWS ... ENDSELECT` usato per leggere "una riga in un certo ordine": funziona, ma leggere in una tabella e prendere la prima riga è più chiaro.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi con `SELECT SINGLE` il nome della compagnia aerea inserita nella schermata di selezione, e stampa un messaggio se non esiste.
> 2. Per la stessa compagnia, stampa i tre voli di `SFLIGHT` con più posti occupati in economy (`SEATSOCC`).

### Soluzione

```abap
REPORT zselect_up_to.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT SINGLE carrname
    FROM scarr
    WHERE carrid = @p_carr
    INTO @DATA(lv_name).
  IF sy-subrc <> 0.
    WRITE: / 'Compagnia', p_carr, 'non trovata'.
    RETURN.
  ENDIF.
  WRITE: / lv_name.

  SELECT connid, fldate, seatsocc, seatsmax
    FROM sflight
    WHERE carrid = @p_carr
    ORDER BY seatsocc DESCENDING
    INTO TABLE @DATA(lt_full)
    UP TO 3 ROWS.

  LOOP AT lt_full INTO DATA(ls_flight).
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc, '/', ls_flight-seatsmax.
  ENDLOOP.
```

> [!NOTE]
>
> - `SELECT SINGLE` legge una riga in una struttura; usala con la chiave primaria completa.
> - Controlla sempre `sy-subrc` prima di usare il risultato di `SELECT SINGLE`.
> - `SELECT SINGLE @abap_true` è il modo più economico per controllare che una riga esista.
> - `UP TO n ROWS` limita il risultato; combinalo con `ORDER BY` per ottenere prime righe sensate.
> - `OFFSET` (da 7.51) salta righe per leggere a pagine.
