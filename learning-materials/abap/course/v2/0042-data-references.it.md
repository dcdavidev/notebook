---
title: I riferimenti ai dati
description: REF TO, GET REFERENCE, l'operatore di dereferenziazione e REFERENCE INTO.
---

_Livello base_

Un **riferimento ai dati** è una variabile che contiene l'indirizzo di un oggetto dati. Come un [field symbol](./0041-field-symbols.it.md), ti permette di lavorare sui dati originali senza copiarli. A differenza di un field symbol, un riferimento è una variabile normale: lo puoi conservare in una struttura o in una tabella, passarlo a un metodo e controllare se è impostato.

I riferimenti ai dati sono anche la base per creare oggetti dati mentre il programma gira, e li trovi ovunque nell'ABAP a oggetti.

## Dichiarare e puntare ai dati

Una variabile riferimento si dichiara con `TYPE REF TO`. La fai puntare a un oggetto dati con `GET REFERENCE OF` oppure, nel codice moderno, con l'operatore `REF`:

```abap
DATA lv_seats TYPE s_seatsocc VALUE 120.

DATA lr_seats TYPE REF TO s_seatsocc.     " può puntare a un s_seatsocc

GET REFERENCE OF lv_seats INTO lr_seats.  " forma classica
lr_seats = REF #( lv_seats ).             " forma moderna, stesso risultato

DATA(lr_inline) = REF #( lv_seats ).      " inline: tipo REF TO s_seatsocc
```

`REF #( )` è una delle espressioni costruttore; le altre sono in [espressioni costruttore](./0091-constructor-expressions.it.md).

Un riferimento che non punta a nulla è **iniziale**. `IS BOUND` ti dice se punta a un oggetto dati valido:

```abap
DATA lr_empty TYPE REF TO s_seatsocc.
IF lr_empty IS NOT BOUND.
  WRITE / 'Nessun dato dietro questo riferimento'.
ENDIF.
```

## L'operatore di dereferenziazione

Per arrivare ai dati dietro un riferimento usi l'**operatore di dereferenziazione** `->*`. Per le strutture, `->` raggiunge una singola componente:

```abap
lr_seats->* = 150.               " modifica lv_seats
WRITE / lv_seats.                " 150

DATA ls_flight TYPE sflight.
DATA(lr_flight) = REF #( ls_flight ).
lr_flight->carrid = 'LH'.        " componente della struttura ls_flight
lr_flight->connid = '0400'.
```

> [!WARNING]
> Dereferenziare un riferimento non legato a nessun dato ferma il programma con un errore a runtime. Controlla `IS BOUND` quando non sei sicuro che il riferimento sia stato impostato.

> [!TIP]
> Un riferimento ai dati è l'indirizzo di una casa scritto su un biglietto. Il biglietto non è la casa, ma con il biglietto puoi andare alla casa e cambiarci delle cose. Puoi fotocopiare il biglietto, metterlo in una cartella o darlo a un amico, e chiunque ne abbia una copia arriva alla stessa casa.

## REFERENCE INTO con le tabelle interne

`LOOP AT`, `READ TABLE` e `APPEND` possono darti un riferimento alla riga invece di una copia:

```abap
TYPES tt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
DATA lt_flights TYPE tt_flights.

APPEND VALUE #( carrid = 'LH' connid = '0400' seatsocc = 120 ) TO lt_flights.
APPEND VALUE #( carrid = 'AZ' connid = '0555' seatsocc = 80 ) TO lt_flights.

LOOP AT lt_flights REFERENCE INTO DATA(lr_row).
  lr_row->seatsocc = lr_row->seatsocc + 1.   " modifica la riga nella tabella
ENDLOOP.

READ TABLE lt_flights REFERENCE INTO lr_row WITH KEY carrid = 'AZ'.
IF sy-subrc = 0.
  WRITE / lr_row->seatsocc.                  " 81
ENDIF.
```

Visto che un riferimento è un valore, puoi raccogliere riferimenti a righe in un'altra tabella, per esempio per costruire un elenco breve delle righe da elaborare più tardi:

```abap
DATA lt_full TYPE STANDARD TABLE OF REF TO sflight WITH EMPTY KEY.

LOOP AT lt_flights REFERENCE INTO lr_row WHERE seatsocc > 100.
  APPEND lr_row TO lt_full.                  " un riferimento, non una copia
ENDLOOP.
```

## Dati anonimi e riferimenti generici

Un riferimento può anche puntare a un oggetto dati senza nome, creato mentre il programma gira. Lo crei con `NEW` o con `CREATE DATA`:

```abap
DATA(lr_count) = NEW i( 10 ).               " un nuovo intero con valore 10
lr_count->* = lr_count->* + 1.

DATA lr_any TYPE REF TO data.               " generico: può puntare a qualsiasi tipo
CREATE DATA lr_any TYPE s_carr_id.
ASSIGN lr_any->* TO FIELD-SYMBOL(<lv_any>). " un field symbol per lavorarci
<lv_any> = 'LH'.
```

`TYPE REF TO data` è un riferimento **generico**. Il tipo dei dati dietro di esso non è noto quando il programma viene controllato, quindi il modo abituale per lavorarci è assegnarlo prima a un field symbol. Creare tipi e dati a runtime è l'argomento degli [oggetti dati dinamici](./0116-dynamic-data.it.md).

| Field symbol                         | Riferimento ai dati                      |
| ------------------------------------ | ---------------------------------------- |
| un nome, `<ls_row>`                  | una variabile, `lr_row`                  |
| non si può conservare in una tabella | si può conservare in tabelle e strutture |
| `IS ASSIGNED`                        | `IS BOUND`                               |
| si usa direttamente come il dato     | serve `->*` o `->comp`                   |

## Esercizio

> [!IMPORTANT]
>
> 1. Dichiara una variabile `lv_price TYPE s_price` con valore 100 e un riferimento `lr_price` a essa con `REF #( )`.
> 2. Aumenta il prezzo di 20 tramite il riferimento e stampa `lv_price`.
> 3. Dichiara un secondo riferimento senza assegnarlo e stampa un messaggio se non è legato a nessun dato.

### Soluzione

```abap
DATA lv_price TYPE s_price VALUE 100.
DATA(lr_price) = REF #( lv_price ).

lr_price->* = lr_price->* + 20.
WRITE / lv_price.                 " 120

DATA lr_other TYPE REF TO s_price.
IF lr_other IS NOT BOUND.
  WRITE / 'lr_other non punta a nulla'.
ENDIF.
```

> [!NOTE]
>
> - Un riferimento ai dati (`TYPE REF TO`) contiene l'indirizzo di un oggetto dati; è una variabile normale.
> - Lo fai puntare ai dati con `REF #( )` o `GET REFERENCE OF`; crei dati nuovi con `NEW` o `CREATE DATA`.
> - `->*` raggiunge l'intero oggetto dati, `->comp` una componente di una struttura.
> - `LOOP AT`, `READ TABLE` e `APPEND` supportano `REFERENCE INTO` per lavorare sulle righe senza copiarle.
> - Controlla `IS BOUND` prima di dereferenziare; un `REF TO data` generico si usa tramite un field symbol.
