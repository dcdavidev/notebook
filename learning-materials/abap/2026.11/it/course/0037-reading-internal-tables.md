---
title: Leggere singole righe
description: READ TABLE, espressioni tabella, line_exists e line_index.
level: basic
---

Spesso ti serve una sola riga di una tabella: il volo con un certo numero, o la prima riga. ABAP ti dà due modi per leggerla: l'istruzione classica **`READ TABLE`** e le **espressioni tabella**, che leggono una riga dentro qualsiasi espressione. Per le domande con risposta sì o no ci sono le funzioni `line_exists( )` e `line_index( )`.

Gli esempi usano questa tabella:

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         cityto TYPE s_to_city,
       END OF ty_flight.
TYPES tt_flights TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AA' connid = '0017' cityto = 'SAN FRANCISCO' )
  ( carrid = 'AZ' connid = '0555' cityto = 'FRANKFURT' )
  ( carrid = 'LH' connid = '0400' cityto = 'NEW YORK' ) ).
```

## READ TABLE

`READ TABLE` copia una riga in una work area. Scegli la riga per indice o per chiave e controlli sempre `sy-subrc`:

```abap
" Per indice (solo tabelle standard e sorted)
READ TABLE lt_flights INTO DATA(ls_flight) INDEX 1.

" Per campi qualsiasi
READ TABLE lt_flights INTO ls_flight WITH KEY cityto = 'NEW YORK'.

" Per chiave primaria completa: l'accesso più veloce per tabelle sorted e hashed
READ TABLE lt_flights INTO ls_flight
     WITH TABLE KEY carrid = 'AZ' connid = '0555'.

IF sy-subrc = 0.
  WRITE: / 'Trovata alla riga', sy-tabix, ls_flight-cityto.
ELSE.
  WRITE / 'Non trovata'.        " sy-subrc = 4, ls_flight non cambia
ENDIF.
```

| Aggiunta                   | Significato                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `INDEX n`                  | la riga numero `n`                                                     |
| `WITH KEY f = v ...`       | la prima riga con questi valori, in campi qualsiasi                    |
| `WITH TABLE KEY f = v ...` | la riga con questa chiave primaria; devi indicare tutti i campi chiave |
| `TRANSPORTING NO FIELDS`   | non copia nulla, imposta solo `sy-subrc` e `sy-tabix`                  |
| `TRANSPORTING f1 f2`       | copia solo questi campi                                                |

Quando una lettura fallisce, la work area conserva il contenuto precedente. Non usare la work area dopo una lettura senza aver prima controllato `sy-subrc`.

> [!WARNING]
> Su una tabella standard, `WITH KEY` legge le righe una per una finché non trova quella giusta. Su una tabella grande, dentro un ciclo, è lentissimo. Usa una tabella sorted o hashed, oppure una [chiave secondaria](./0035-table-keys.md). Il codice vecchio usa `SORT` e poi `READ TABLE ... BINARY SEARCH` sulle tabelle standard per lo stesso motivo.

Invece di copiare la riga, puoi puntarla con `ASSIGNING` o `REFERENCE INTO`: vedi [i field symbol](./0041-field-symbols.md) e [i riferimenti ai dati](./0042-data-references.md).

## Le espressioni tabella

Un'**espressione tabella** legge una riga con le parentesi quadre, e la puoi usare ovunque serva un valore:

```abap
DATA(ls_first) = lt_flights[ 1 ].                            " per indice
DATA(lv_city)  = lt_flights[ carrid = 'LH' connid = '0400' ]-cityto. " un campo
DATA(lv_conn)  = lt_flights[ cityto = 'FRANKFURT' ]-connid.        " lettura riga per riga
```

Fra le parentesi scrivi un numero (l'indice) oppure coppie campo-valore (la chiave). Con le coppie campo-valore, il sistema usa la chiave primaria se i campi corrispondono, altrimenti legge riga per riga. Per usare una chiave secondaria scrivi `lt_tab[ KEY nome_chiave COMPONENTS f = v ]`.

Un'espressione tabella non imposta `sy-subrc`. Se la riga non esiste, solleva l'eccezione `CX_SY_ITAB_LINE_NOT_FOUND` e il programma si ferma, a meno che tu non la intercetti. Puoi evitare l'eccezione con `OPTIONAL` o `DEFAULT`:

```abap
" Riga iniziale se non trovata
DATA(ls_any) = VALUE ty_flight( lt_flights[ carrid = 'XX' connid = '0001' ] OPTIONAL ).

" Un valore di default se non trovata
DATA(lv_dest) = VALUE s_to_city( lt_flights[ carrid = 'XX' connid = '0001' ]-cityto
                                DEFAULT 'sconosciuta' ).
```

Le eccezioni e `TRY ... CATCH` sono spiegati in [le eccezioni basate su classi](./0089-class-based-exceptions.md).

## line_exists e line_index

Quando vuoi solo sapere se una riga c'è, usa le funzioni predefinite. Ricevono un'espressione tabella e non sollevano mai eccezioni:

```abap
IF line_exists( lt_flights[ carrid = 'LH' connid = '0400' ] ).
  WRITE / 'LH 0400 è nella tabella'.
ENDIF.

DATA(lv_row) = line_index( lt_flights[ cityto = 'FRANKFURT' ] ).
WRITE / lv_row.     " 2; 0 se nessuna riga corrisponde
```

> [!TIP]
> `READ TABLE` è come chiedere una pratica all'impiegato e ricevere una copia più un biglietto con scritto "trovata" o "non trovata". Un'espressione tabella è come infilare tu la mano nel cassetto: veloce e diretto, ma se la pratica non c'è resti a mani vuote. `line_exists( )` è solo dare un'occhiata nel cassetto.

## Quale usare

| Vuoi                                  | Usa                                               |
| ------------------------------------- | ------------------------------------------------- |
| sapere se una riga esiste             | `line_exists( )`                                  |
| il numero della riga                  | `line_index( )`                                   |
| una riga che deve esserci             | un'espressione tabella                            |
| una riga che potrebbe mancare         | `VALUE tipo( ... OPTIONAL )`, oppure `READ TABLE` |
| una riga e il risultato in `sy-subrc` | `READ TABLE`                                      |

## Esercizio

> [!IMPORTANT]
>
> 1. Con la tabella `lt_flights` di questa lezione, stampa la destinazione di `AZ 0555` con un'espressione tabella.
> 2. Controlla con `line_exists( )` se `UA 0941` è nella tabella e stampa un messaggio in entrambi i casi.
> 3. Leggi `UA 0941` con `READ TABLE` e stampa `sy-subrc`.

### Soluzione

```abap
DATA(lv_city) = lt_flights[ carrid = 'AZ' connid = '0555' ]-cityto.
WRITE / lv_city.   " FRANKFURT

IF line_exists( lt_flights[ carrid = 'UA' connid = '0941' ] ).
  WRITE / 'UA 0941 esiste'.
ELSE.
  WRITE / 'UA 0941 non esiste'.
ENDIF.

READ TABLE lt_flights TRANSPORTING NO FIELDS
     WITH TABLE KEY carrid = 'UA' connid = '0941'.
WRITE: / 'sy-subrc:', sy-subrc.   " 4
```

> [!NOTE]
>
> - `READ TABLE ... INTO` copia una riga, scelta con `INDEX`, `WITH KEY` o `WITH TABLE KEY`; controlla `sy-subrc` ogni volta.
> - `sy-tabix` contiene il numero della riga trovata in una tabella indice.
> - Un'espressione tabella `itab[ ... ]` legge una riga dentro qualsiasi espressione; se la riga manca, solleva `CX_SY_ITAB_LINE_NOT_FOUND`.
> - `OPTIONAL` e `DEFAULT` dentro `VALUE tipo( )` evitano l'eccezione.
> - `line_exists( )` e `line_index( )` rispondono a "c'è?" e "dov'è?" senza eccezioni.
