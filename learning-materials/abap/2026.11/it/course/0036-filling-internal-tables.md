---
title: Riempire le tabelle interne
description: APPEND, INSERT, VALUE e BASE.
---

_Livello base_

Ci sono vari modi per mettere righe in una tabella interna. `APPEND` e `INSERT` aggiungono righe una alla volta o le copiano da un'altra tabella. L'operatore `VALUE` costruisce un'intera tabella in un'unica espressione e `BASE` conserva le righe già presenti.

Quale usare dipende dalla [categoria di tabella](./0034-table-categories.md) e da dove arrivano le righe. Tutti gli esempi usano questo tipo di riga:

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
```

## APPEND: aggiungere in fondo

`APPEND` aggiunge una riga in fondo a una tabella standard. Il numero della nuova riga finisce in `sy-tabix`.

```abap
DATA lt_flights TYPE tt_flights.
DATA ls_flight  TYPE ty_flight.

ls_flight-carrid = 'LH'.
ls_flight-connid = '0400'.
ls_flight-price  = 650.
APPEND ls_flight TO lt_flights.

APPEND INITIAL LINE TO lt_flights.            " aggiunge una riga vuota

DATA lt_more TYPE tt_flights.
APPEND LINES OF lt_more TO lt_flights.        " copia tutte le righe di lt_more
APPEND LINES OF lt_more FROM 2 TO 3 TO lt_flights. " solo le righe da 2 a 3
```

`APPEND INITIAL LINE ... ASSIGNING` aggiunge una riga vuota e ti fa riempire la riga sul posto, senza work area. La vedrai nei [field symbol](./0041-field-symbols.md).

## INSERT: aggiungere per chiave o in una posizione

`INSERT ... INTO TABLE` aggiunge una riga secondo la chiave primaria della tabella. Funziona con ogni categoria, quindi è la scelta sicura per le tabelle sorted e hashed:

```abap
DATA lt_sorted TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.

ls_flight-carrid = 'AZ'.
ls_flight-connid = '0555'.
ls_flight-price  = 180.
INSERT ls_flight INTO TABLE lt_sorted.        " va al suo posto nell'ordine
IF sy-subrc = 4.
  WRITE / 'Questo collegamento è già nella tabella'.
ENDIF.
```

| Categoria di tabella        | Che cosa fa `INSERT ... INTO TABLE`                                  |
| --------------------------- | -------------------------------------------------------------------- |
| standard                    | accoda la riga in fondo, come `APPEND`                               |
| sorted                      | mette la riga al suo posto nell'ordine della chiave                  |
| hashed                      | memorizza la riga in base alla chiave                                |
| qualsiasi, con chiave unica | se la chiave esiste già, non aggiunge nulla e imposta `sy-subrc` a 4 |

`INSERT ... INTO itab INDEX n` mette la riga in una certa posizione di una tabella standard; le righe successive scendono di una posizione. `INSERT LINES OF` copia le righe di un'altra tabella.

```abap
INSERT ls_flight INTO lt_flights INDEX 1.     " diventa la prima riga
INSERT LINES OF lt_more INTO TABLE lt_sorted. " ogni riga per chiave
```

> [!WARNING]
> `APPEND` su una tabella sorted deve rispettare l'ordine, e l'`APPEND` di una chiave duplicata su una tabella sorted con chiave unica provoca un errore a runtime. `INSERT ... INTO TABLE` non rompe mai l'ordine: usalo per le tabelle sorted e hashed.

## VALUE: costruire una tabella in un'espressione

L'**operatore `VALUE`** costruisce una tabella da un elenco di righe. Ogni riga sta fra parentesi proprie:

```abap
DATA(lt_new) = VALUE tt_flights(
  ( carrid = 'LH' connid = '0400' price = 650 )
  ( carrid = 'AZ' connid = '0555' price = 180 )
  ( carrid = 'AA' connid = '0017' price = 420 ) ).

lt_flights = VALUE #( ( carrid = 'UA' connid = '0941' price = 900 ) ).
```

- `VALUE tt_flights( ... )` indica il tipo. Con `VALUE #( ... )` il tipo viene dalla variabile di destinazione.
- I campi che non nomini restano iniziali.
- `VALUE` **sostituisce** l'intero contenuto della destinazione: dopo l'ultima istruzione, `lt_flights` ha una sola riga.
- `( LINES OF lt_more )` dentro `VALUE` copia le righe di un'altra tabella.

Quando molte righe condividono un valore, scrivilo una volta sola prima delle righe:

```abap
lt_flights = VALUE #( carrid = 'LH'
                      ( connid = '0400' price = 650 )
                      ( connid = '0402' price = 700 ) ).
```

`VALUE` è una delle espressioni costruttore; vedrai le altre in [espressioni costruttore](./0091-constructor-expressions.md) e come costruire righe da un'altra tabella con `FOR` in [FOR e REDUCE](./0093-for-and-reduce.md).

## BASE: conservare le righe esistenti

Per aggiungere righe con `VALUE` senza perdere quelle che hai, comincia con `BASE`:

```abap
lt_flights = VALUE #( BASE lt_flights
                      ( carrid = 'AF' connid = '0820' price = 300 )
                      ( LINES OF lt_more ) ).
```

`BASE lt_flights` copia prima le righe attuali, poi le nuove vengono aggiunte in fondo (per una tabella standard) o per chiave (per le tabelle sorted e hashed).

> [!TIP]
> `VALUE` senza `BASE` è come scrivere la lista della spesa su un foglio nuovo. `VALUE` con `BASE` è come aggiungere voci in fondo alla lista che hai già.

## Esercizio

> [!IMPORTANT]
>
> 1. Usa `VALUE` per riempire una tabella con due collegamenti Lufthansa, `0400` e `0402`, scrivendo `carrid` una volta sola.
> 2. Aggiungi un terzo collegamento `AZ 0555` con `BASE`, poi stampa il numero di righe.

### Soluzione

```abap
TYPES: BEGIN OF ty_conn,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
       END OF ty_conn.
TYPES tt_conns TYPE STANDARD TABLE OF ty_conn WITH EMPTY KEY.

DATA(lt_conns) = VALUE tt_conns( carrid = 'LH'
                                 ( connid = '0400' )
                                 ( connid = '0402' ) ).

lt_conns = VALUE #( BASE lt_conns ( carrid = 'AZ' connid = '0555' ) ).

DATA(lv_lines) = lines( lt_conns ).
WRITE: / 'Righe:', lv_lines.   " 3
```

> [!NOTE]
>
> - `APPEND` aggiunge una riga in fondo a una tabella standard; `APPEND LINES OF` copia le righe da un'altra tabella.
> - `INSERT ... INTO TABLE` aggiunge per chiave e funziona con ogni categoria; usalo per le tabelle sorted e hashed.
> - Con una chiave unica, un duplicato non viene inserito e `sy-subrc` vale 4.
> - `VALUE #( ( ... ) ( ... ) )` costruisce un'intera tabella e sostituisce il contenuto precedente.
> - `BASE` conserva le righe esistenti e aggiunge quelle nuove.
