---
title: Le BAPI
description: Chiamare le API di business standard e gestire BAPIRET2.
level: basic
---

Quando il tuo programma deve creare un ordine di vendita, registrare una fattura o prenotare un volo, non dovresti scrivere direttamente nelle tabelle di SAP: le transazioni standard fanno molti controlli e aggiornamenti che ti sfuggirebbero. Chiami invece una **BAPI** (Business Application Programming Interface): un [modulo funzione](./0070-function-modules.md) standard che esegue un'operazione di business con tutti i controlli della transazione.

Le BAPI seguono regole precise, e una volta che le conosci puoi usare qualsiasi BAPI allo stesso modo.

## Che cosa rende un modulo funzione una BAPI

Una BAPI è un modulo funzione abilitato per le chiamate remote che implementa un metodo di un oggetto di business, come `SalesOrder.CreateFromData` o `Flight.GetList`. Ogni BAPI segue le stesse convenzioni:

- Il nome è `BAPI_<oggetto>_<metodo>`, per esempio `BAPI_FLIGHT_GETLIST`.
- Non ha eccezioni classiche. Gli errori e gli altri messaggi tornano in un parametro chiamato `RETURN`, di tipo `BAPIRET2` (una struttura o una tabella).
- Non mostra schermate né popup, quindi funziona anche in background e via [RFC](./0124-rfc.md).
- **Non fa il commit**. È chi chiama a decidere quando salvare, con `BAPI_TRANSACTION_COMMIT`, o annullare, con `BAPI_TRANSACTION_ROLLBACK`.

Usa la transazione `BAPI` (il BAPI Explorer) per sfogliare gli oggetti di business per area applicativa e vederne le BAPI, con documentazione e parametri. Poi provale in `SE37`.

> [!TIP]
> Una BAPI è come lo sportello di una banca. Non entri nel caveau a spostare i soldi da solo: compili un modulo, l'impiegato lo controlla e ti restituisce una ricevuta che dice "fatto" oppure "rifiutato, perché...". La ricevuta è `RETURN`.

## La struttura BAPIRET2

| Campo                         | Contenuto                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `TYPE`                        | tipo di messaggio: `S` successo, `I` informazione, `W` avviso, `E` errore, `A` interruzione |
| `ID`, `NUMBER`                | classe di messaggi e numero del messaggio                                                   |
| `MESSAGE`                     | il testo del messaggio, già completo                                                        |
| `MESSAGE_V1` ... `MESSAGE_V4` | le variabili del messaggio                                                                  |
| `PARAMETER`, `ROW`, `FIELD`   | a quale parametro, riga e campo si riferisce il messaggio                                   |

La BAPI è fallita se `RETURN` contiene almeno un messaggio di tipo `E` o `A`. Un `RETURN` vuoto di solito significa successo, ma alcune BAPI restituiscono anche un messaggio `S` di conferma.

> [!WARNING]
> `sy-subrc` dopo la chiamata di una BAPI vale quasi sempre `0`, anche quando la BAPI è fallita: non ci sono eccezioni che lo impostino. Controlla sempre il parametro `RETURN`.

## Leggere dati con una BAPI

Il modello dei voli ha le sue BAPI, quindi puoi provarle su qualsiasi sistema con i dati dei voli:

```abap
REPORT zflight_bapi_list.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  DATA lt_flights TYPE STANDARD TABLE OF bapisfldat WITH EMPTY KEY.
  DATA lt_return  TYPE STANDARD TABLE OF bapiret2 WITH EMPTY KEY.

  CALL FUNCTION 'BAPI_FLIGHT_GETLIST'
    EXPORTING
      airline     = p_carrid
      max_rows    = 20
    TABLES
      flight_list = lt_flights
      return      = lt_return.

  LOOP AT lt_return INTO DATA(ls_return) WHERE type CA 'EA'.
    WRITE: / ls_return-message.
    RETURN.
  ENDLOOP.

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-airlineid, ls_flight-connectid, ls_flight-flightdate,
             ls_flight-cityfrom, ls_flight-cityto.
  ENDLOOP.
```

Nota che i parametri delle BAPI usano nomi di campo in inglese (`AIRLINEID`, `CONNECTID`) invece dei nomi tecnici delle tabelle (`CARRID`, `CONNID`). Molte BAPI meno recenti usano ancora parametri `TABLES`, come qui.

## Modificare dati: commit o rollback

Una BAPI che crea o modifica dati prepara le modifiche, ma non viene salvato nulla finché non fai il commit. Controlla prima `RETURN`, poi decidi:

```abap
REPORT zflight_bapi_booking.

START-OF-SELECTION.
  " Prende un volo, un cliente e un'agenzia qualsiasi dai dati dei voli
  SELECT SINGLE carrid, connid, fldate FROM sflight WHERE carrid = 'LH' INTO @DATA(ls_flight).
  SELECT SINGLE id FROM scustom INTO @DATA(lv_customer).
  SELECT SINGLE agencynum FROM stravelag INTO @DATA(lv_agency).

  DATA ls_booking TYPE bapisbonew.
  ls_booking-airlineid  = ls_flight-carrid.
  ls_booking-connectid  = ls_flight-connid.
  ls_booking-flightdate = ls_flight-fldate.
  ls_booking-customerid = lv_customer.
  ls_booking-agencynum  = lv_agency.
  ls_booking-class      = 'Y'.                 " economy
  ls_booking-passname   = 'Mario Rossi'.

  DATA lv_booking_id TYPE bapisbokey-bookingid.
  DATA lt_return     TYPE STANDARD TABLE OF bapiret2 WITH EMPTY KEY.

  CALL FUNCTION 'BAPI_FLBOOKING_CREATEFROMDATA'
    EXPORTING
      booking_data  = ls_booking
    IMPORTING
      bookingnumber = lv_booking_id
    TABLES
      return        = lt_return.

  DATA(lv_error) = abap_false.
  LOOP AT lt_return INTO DATA(ls_return) WHERE type CA 'EA'.
    lv_error = abap_true.
    WRITE: / ls_return-message.
  ENDLOOP.

  IF lv_error = abap_true.
    CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
  ELSE.
    DATA ls_commit_return TYPE bapiret2.
    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
      EXPORTING
        wait   = abap_true                    " aspetta la fine dell'aggiornamento
      IMPORTING
        return = ls_commit_return.
    WRITE: / 'Prenotazione creata:', lv_booking_id.
  ENDIF.
```

- `WAIT = abap_true` fa aspettare al commit la fine dell'aggiornamento del database. Usalo quando l'istruzione successiva legge i dati appena salvati, o chiama un'altra BAPI che ne ha bisogno.
- `BAPI_TRANSACTION_COMMIT` e `BAPI_TRANSACTION_ROLLBACK` chiudono la [LUW SAP](./0060-luw-commit-and-rollback.md): tutte le chiamate BAPI dall'ultimo commit vengono salvate o annullate insieme.

> [!CAUTION]
> Non chiamare mai `COMMIT WORK` o una BAPI di commit dopo una BAPI che ha restituito un errore. Alcune BAPI lasciano modifiche parziali nel buffer di aggiornamento, e un commit salverebbe dati incoerenti. Fai invece il rollback.

Per testare in `SE37` una BAPI che modifica dati, usa **Modulo funzione > Test > Sequenze di test**: inserisci la BAPI e poi `BAPI_TRANSACTION_COMMIT`, così girano entrambe nella stessa sessione. Un test singolo della sola BAPI non salva nulla.

## Esercizio

> [!IMPORTANT]
>
> 1. Trova nella transazione `BAPI` l'oggetto di business delle prenotazioni dei voli ed elenca le sue BAPI.
> 2. Scrivi un report che crea una prenotazione con `BAPI_FLBOOKING_CREATEFROMDATA`, con il volo indicato nella schermata di selezione.
> 3. Stampa tutti i messaggi di `RETURN`, fai il commit solo se non ci sono errori e controlla la nuova prenotazione in `SBOOK` con `SE16`.

### Soluzione

1. In `BAPI`, passa alla scheda **Alfabetico** e apri `FlightBooking`: tra i suoi metodi trovi `CreateFromData`, `GetList`, `GetDetail` e `Cancel`. Clicca un metodo per vedere il modulo funzione che c'è dietro, come `BAPI_FLBOOKING_CREATEFROMDATA`.
2. Parti dal report di prenotazione qui sopra e sostituisci la `SELECT SINGLE` su `SFLIGHT` con i parametri `p_carrid`, `p_connid` e `p_fldate`.
3. Cambia il loop in `LOOP AT lt_return INTO DATA(ls_return).` perché stampi ogni messaggio, e tieni il controllo `WHERE type CA 'EA'` in un loop separato o con un `IF` all'interno. Dopo il commit, il numero di prenotazione compare in `SBOOK` con il tuo ID cliente.

> [!NOTE]
>
> - Una BAPI è un modulo funzione abilitato per le chiamate remote che esegue un'operazione di business con tutti i controlli standard.
> - Gli errori non sollevano eccezioni: controlla nel parametro `RETURN` (`BAPIRET2`) i messaggi di tipo `E` o `A`.
> - Le BAPI non fanno il commit: chiama `BAPI_TRANSACTION_COMMIT` (con `WAIT`) in caso di successo, `BAPI_TRANSACTION_ROLLBACK` in caso di errore.
> - Usa la transazione `BAPI` per trovare le BAPI e le sequenze di test di `SE37` per provare quelle che modificano dati.
> - I nomi dei campi delle BAPI sono spesso in inglese (`AIRLINEID`), non quelli dei campi delle tabelle (`CARRID`).
