---
title: Modificare e cancellare righe
description: MODIFY, DELETE e CLEAR, FREE, REFRESH sulle tabelle intere.
---

_Livello base_

Una volta riempita una tabella, spesso devi modificare alcune righe o toglierle. `MODIFY` sovrascrive le righe con il contenuto di una work area, e `DELETE` toglie le righe per indice, per chiave o per condizione. Per svuotare un'intera tabella usi `CLEAR` o `FREE`.

Gli esempi usano questa tabella:

```abap
TYPES: BEGIN OF ty_flight,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         price    TYPE s_price,
         currency TYPE s_currcode,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AZ' connid = '0555' price = 180 currency = 'EUR' )
  ( carrid = 'LH' connid = '0400' price = 650 currency = 'EUR' )
  ( carrid = 'LH' connid = '0402' price = 700 currency = 'EUR' )
  ( carrid = 'AA' connid = '0017' price = 420 currency = 'USD' ) ).
```

## MODIFY

`MODIFY` copia una work area in una o più righe. Scegli le righe per indice, per chiave o con una condizione:

```abap
DATA ls_flight TYPE ty_flight.

" Per indice: sovrascrive la riga 1
ls_flight = VALUE #( carrid = 'AZ' connid = '0555' price = 199 currency = 'EUR' ).
MODIFY lt_flights FROM ls_flight INDEX 1.

" Solo alcuni campi: gli altri campi della riga 2 restano come sono
ls_flight-price = 600.
MODIFY lt_flights FROM ls_flight INDEX 2 TRANSPORTING price.

" Tutte le righe che soddisfano una condizione
ls_flight-currency = 'USD'.
MODIFY lt_flights FROM ls_flight TRANSPORTING currency WHERE carrid = 'LH'.
```

Per le tabelle con una chiave primaria (sorted, hashed o standard con chiave), `MODIFY TABLE` trova la riga in base ai valori di chiave nella work area:

```abap
DATA lt_sorted TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrid connid.
lt_sorted = lt_flights.

ls_flight = VALUE #( carrid = 'AA' connid = '0017' price = 399 currency = 'USD' ).
MODIFY TABLE lt_sorted FROM ls_flight.      " modifica la riga AA 0017
IF sy-subrc <> 0.
  WRITE / 'Nessuna riga con questa chiave'.
ENDIF.
```

`MODIFY` imposta `sy-subrc` a 0 se almeno una riga è cambiata, a 4 altrimenti. Dentro un `LOOP AT ... INTO`, `MODIFY lt_flights FROM ls_flight` senza `INDEX` modifica la riga corrente.

Puoi anche assegnare un valore a un'espressione tabella, che modifica la riga sul posto:

```abap
lt_flights[ carrid = 'LH' connid = '0402' ]-price = 720.
```

> [!WARNING]
> I campi chiave di una tabella sorted o hashed non si possono modificare con `MODIFY`: vengono copiati solo i campi non chiave, oppure ottieni un errore. Per cambiare una chiave, cancella la riga e inseriscine una nuova.

Il modo più comune per modificare le righe in un ciclo è un field symbol, che cambia la riga direttamente senza `MODIFY`: vedi [i field symbol](./0041-field-symbols.it.md).

## DELETE

`DELETE` toglie righe. Come `MODIFY`, lavora per indice, per chiave o per condizione:

```abap
DELETE lt_flights INDEX 1.                            " la riga 1
DELETE lt_flights WHERE currency = 'USD'.             " tutte le righe in USD
DELETE TABLE lt_sorted WITH TABLE KEY carrid = 'AZ' connid = '0555'. " per chiave
DELETE TABLE lt_sorted FROM ls_flight.                " per la chiave in ls_flight
DELETE lt_flights FROM 2 TO 3.                        " le righe da 2 a 3
```

Dopo un `DELETE`, le righe successive salgono, quindi i numeri di riga cambiano. `sy-subrc` vale 0 se è stata cancellata almeno una riga.

> [!WARNING]
> Cancellare righe dentro un `LOOP` sulla stessa tabella è ammesso per la riga corrente, ma è facile sbagliare ed è lento sulle tabelle grandi. Preferisci un solo `DELETE ... WHERE` dopo il ciclo, o prima.

## Svuotare un'intera tabella

| Istruzione          | Che cosa fa                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `CLEAR itab`        | cancella tutte le righe; tiene la memoria iniziale per le righe nuove |
| `FREE itab`         | cancella tutte le righe e libera tutta la memoria                     |
| `REFRESH itab`      | obsoleta: uguale a `CLEAR itab` per le tabelle senza header line      |
| `itab = VALUE #( )` | uguale a `CLEAR itab`                                                 |

```abap
CLEAR lt_flights.
IF lt_flights IS INITIAL.
  WRITE / 'La tabella è vuota'.
ENDIF.
```

Usa `CLEAR` quando riempirai di nuovo la tabella, e `FREE` quando hai finito con una tabella grande e vuoi riavere la memoria. `REFRESH` è obsoleta: la vedrai nel codice vecchio, spesso accanto a tabelle con header line, dove `CLEAR itab` svuoterebbe solo la header line.

> [!CAUTION]
> Un `DELETE itab WHERE ...` con una condizione sbagliata, o un `CLEAR` sulla tabella sbagliata, toglie le righe per sempre: una tabella interna non ha un "annulla". Se ti servono ancora le righe originali, copia prima la tabella (`DATA(lt_backup) = lt_flights.`).

> [!TIP]
> `CLEAR` è come cancellare una lavagna: la lavagna resta appesa al muro, pronta all'uso. `FREE` è come staccarla dal muro e restituirla.

## Esercizio

> [!IMPORTANT]
>
> 1. Con la tabella `lt_flights` di questa lezione, alza il prezzo di `LH 0400` a 680 con `MODIFY ... TRANSPORTING`.
> 2. Cancella tutte le righe di American Airlines (`AA`) con una sola istruzione, poi stampa il numero di righe rimaste.

### Soluzione

```abap
DATA(ls_change) = VALUE ty_flight( price = 680 ).
MODIFY lt_flights FROM ls_change TRANSPORTING price
       WHERE carrid = 'LH' AND connid = '0400'.

DELETE lt_flights WHERE carrid = 'AA'.

DATA(lv_lines) = lines( lt_flights ).
WRITE: / 'Righe rimaste:', lv_lines.   " 3
```

> [!NOTE]
>
> - `MODIFY itab FROM wa INDEX n` modifica una riga per indice; `MODIFY TABLE itab FROM wa` la modifica per chiave.
> - `TRANSPORTING` limita la modifica ad alcuni campi; `WHERE` modifica tutte le righe che corrispondono.
> - I campi chiave delle tabelle sorted e hashed non si possono modificare.
> - `DELETE` toglie righe per `INDEX`, per chiave (`DELETE TABLE`), per intervallo o con `WHERE`.
> - `CLEAR` svuota una tabella, `FREE` libera anche la memoria e `REFRESH` è obsoleta.
