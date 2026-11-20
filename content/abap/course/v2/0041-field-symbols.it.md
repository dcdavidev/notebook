---
title: I field symbol
description: Lavorare direttamente su una riga o una variabile senza copiarla.
---

_Livello base_

Un **field symbol** è un nome segnaposto per un oggetto dati che esiste già. Non contiene un valore proprio: punta a un'altra variabile o a una riga di una tabella, e tutto quello che fai con il field symbol avviene direttamente su quell'oggetto dati.

Con le tabelle interne, i field symbol ti permettono di leggere e modificare le righe senza copiarle in una work area e poi indietro. È più breve da scrivere e più veloce sulle tabelle grandi.

## Dichiarare e assegnare

Il nome di un field symbol sta sempre fra parentesi angolari. Lo dichiari con `FIELD-SYMBOLS` e lo colleghi a un oggetto dati con `ASSIGN`:

```abap
DATA lv_price TYPE s_price VALUE 100.

FIELD-SYMBOLS <lv_price> TYPE s_price.

ASSIGN lv_price TO <lv_price>.
<lv_price> = 150.                 " modifica lv_price

WRITE / lv_price.                 " 150
```

- `IS ASSIGNED` ti dice se il field symbol punta a qualcosa: `IF <lv_price> IS ASSIGNED`.
- `UNASSIGN <lv_price>` toglie il collegamento; la variabile in sé non cambia.
- `TYPE any` crea un field symbol **generico**, che può puntare a dati di qualsiasi tipo. Lo userai negli [oggetti dati dinamici](./0116-dynamic-data.it.md).

> [!TIP]
> Una work area è la fotocopia di una pagina: ci puoi scrivere sopra, ma il libro non cambia finché non incolli la copia al suo posto. Un field symbol è il tuo dito sulla pagina del libro: quello che scrivi finisce direttamente sulla pagina.

> [!WARNING]
> Usare un field symbol non assegnato ferma il programma con l'errore a runtime `GETWA_NOT_ASSIGNED`. Dopo un `ASSIGN` o un `READ TABLE ... ASSIGNING` che può fallire, controlla prima `sy-subrc` o `IS ASSIGNED`.

## I field symbol nei cicli

`LOOP AT ... ASSIGNING` fa puntare il field symbol a ogni riga, una dopo l'altra. Una modifica al field symbol è una modifica alla riga, senza `MODIFY`:

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'AZ' connid = '0555' price = 180 )
  ( carrid = 'LH' connid = '0400' price = 650 ) ).

" Aumenta ogni prezzo del 10%
LOOP AT lt_flights ASSIGNING FIELD-SYMBOL(<ls_flight>).
  <ls_flight>-price = <ls_flight>-price * '1.1'.
ENDLOOP.
```

`FIELD-SYMBOL(<ls_flight>)` è una dichiarazione inline, come `DATA(...)`: il field symbol prende il tipo di riga della tabella. Puoi anche dichiararlo prima con `FIELD-SYMBOLS <ls_flight> TYPE ty_flight` e scrivere `ASSIGNING <ls_flight>`.

Confrontalo con la versione con work area:

```abap
LOOP AT lt_flights INTO DATA(ls_flight).
  ls_flight-price = ls_flight-price * '1.1'.
  MODIFY lt_flights FROM ls_flight.        " serve per riscrivere la copia
ENDLOOP.
```

## Righe singole e righe nuove

Anche `READ TABLE` e `APPEND` funzionano con i field symbol:

```abap
READ TABLE lt_flights ASSIGNING FIELD-SYMBOL(<ls_lh>)
     WITH KEY carrid = 'LH' connid = '0400'.
IF sy-subrc = 0.
  <ls_lh>-price = 599.                     " modifica la riga nella tabella
ENDIF.

APPEND INITIAL LINE TO lt_flights ASSIGNING FIELD-SYMBOL(<ls_new>).
<ls_new>-carrid = 'AA'.                    " riempie la nuova riga sul posto
<ls_new>-connid = '0017'.
<ls_new>-price  = 420.
```

`ASSIGN` funziona anche con un'espressione tabella. Se la riga non esiste, `ASSIGN` non solleva eccezioni: imposta `sy-subrc` a 4 e lascia invariato il field symbol.

```abap
ASSIGN lt_flights[ carrid = 'UA' connid = '0941' ] TO FIELD-SYMBOL(<ls_ua>).
IF sy-subrc <> 0.
  WRITE / 'UA 0941 non trovato'.
ENDIF.
```

## Regole da ricordare

- Su una tabella sorted o hashed non puoi modificare i campi chiave tramite un field symbol: il programma si ferma con un errore a runtime.
- Dopo `ENDLOOP`, il field symbol punta ancora all'ultima riga. Non usarlo per sbaglio dopo il ciclo.
- Se cancelli la riga a cui punta un field symbol, il field symbol non è più assegnato.
- Un field symbol è più veloce di `INTO` per righe larghe e tabelle grandi, perché non viene copiato nulla. Per poche righe piccole vanno bene entrambi.

La stessa idea di "puntare invece di copiare", con una variabile che puoi conservare e passare in giro, è il riferimento ai dati: vedi [i riferimenti ai dati](./0042-data-references.it.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Riempi una tabella di voli con tre righe, due delle quali Lufthansa (`LH`).
> 2. Con `LOOP AT ... ASSIGNING` e `WHERE`, applica ai voli Lufthansa uno sconto di 50 sul prezzo, senza usare `MODIFY`.
> 3. Stampa la tabella.

### Soluzione

```abap
TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         price  TYPE s_price,
       END OF ty_flight.
TYPES tt_flights TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.

DATA(lt_flights) = VALUE tt_flights(
  ( carrid = 'LH' connid = '0400' price = 650 )
  ( carrid = 'LH' connid = '0402' price = 700 )
  ( carrid = 'AZ' connid = '0555' price = 180 ) ).

LOOP AT lt_flights ASSIGNING FIELD-SYMBOL(<ls_flight>) WHERE carrid = 'LH'.
  <ls_flight>-price = <ls_flight>-price - 50.
ENDLOOP.

LOOP AT lt_flights ASSIGNING <ls_flight>.
  WRITE: / <ls_flight>-carrid, <ls_flight>-connid, <ls_flight>-price.
ENDLOOP.
```

> [!NOTE]
>
> - Un field symbol punta a un oggetto dati esistente; le modifiche fatte tramite il field symbol cambiano l'originale.
> - Lo dichiari con `FIELD-SYMBOLS <nome> TYPE ...` o inline con `FIELD-SYMBOL(<nome>)`, e lo colleghi con `ASSIGN`.
> - `LOOP AT ... ASSIGNING` e `READ TABLE ... ASSIGNING` modificano le righe sul posto, senza `MODIFY`.
> - Usare un field symbol non assegnato provoca `GETWA_NOT_ASSIGNED`: controlla `sy-subrc` o `IS ASSIGNED`.
> - I campi chiave delle tabelle sorted e hashed non si modificano tramite un field symbol.
