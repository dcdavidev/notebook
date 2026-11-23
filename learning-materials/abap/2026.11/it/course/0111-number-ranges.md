---
title: Gli intervalli di numerazione
description: Generare numeri di documento unici con SNRO.
level: intermediate
---

Ogni ordine di vendita, fattura e prenotazione in SAP ha un numero unico. Molti utenti creano documenti nello stesso momento, quindi il numero non può essere "il numero più alto della tabella più uno": due utenti leggerebbero lo stesso massimo e otterrebbero lo stesso numero. SAP risolve il problema con gli **intervalli di numerazione** (_number range_): un contatore centrale che assegna ogni numero una volta sola.

Le tue applicazioni usano lo stesso meccanismo. Definisci un **oggetto intervallo di numerazione** nella transazione `SNRO`, e il tuo programma gli chiede il numero successivo.

## Oggetti e intervalli

Un **oggetto intervallo di numerazione** è il contatore per un tipo di documento. Ha:

- un nome di al massimo 10 caratteri, per esempio `ZFLBOOK`;
- un **dominio della lunghezza del numero**, che stabilisce quante cifre hanno i numeri, per esempio `NUM10` per 10 cifre;
- uno o più **intervalli**.

Un **intervallo** è una fascia di numeri con un suo contatore:

| Campo             | Significato                                                                | Esempio      |
| ----------------- | -------------------------------------------------------------------------- | ------------ |
| N.                | il numero dell'intervallo                                                  | `01`         |
| Da numero         | il primo numero                                                            | `0000000001` |
| A numero          | l'ultimo numero                                                            | `0999999999` |
| Stato numerazione | l'ultimo numero assegnato                                                  | `0000004711` |
| Est               | esterno: il numero lo inserisce l'utente, il sistema lo controlla soltanto | disattivato  |

Intervalli diversi ti permettono di separare tipi di documento: per esempio `01` per le prenotazioni dal web e `02` per quelle allo sportello. Se l'oggetto ha un **sotto-oggetto** (come la società), ogni valore del sotto-oggetto ha i suoi intervalli.

> [!TIP]
> Un intervallo di numerazione è il distributore di biglietti al banco della gastronomia. Ogni cliente prende un biglietto e riceve un numero diverso, anche se dieci persone lo prendono nello stesso istante. Nessuno conta le persone in coda per sapere il proprio numero.

## Creare l'oggetto in SNRO

```text
SNRO > Oggetto: ZFLBOOK > Crea
  Testo breve:                    Prenotazioni voli
  Testo esteso:                   Numeri di prenotazione per le prenotazioni voli custom
  Dominio lunghezza numero:       NUM10
  % warning:                      10.0      (avvisa quando resta il 10% dell'intervallo)
  Buffer in memoria principale:   Numeri nel buffer: 10
Salva, poi: Intervalli > Modifica > Inserisci intervallo
  N. 01   Da 0000000001   A 0999999999
```

La gestione degli intervalli è disponibile anche nella transazione `SNUM` o tramite la classe `CL_NUMBERRANGE_INTERVALS`.

> [!CAUTION]
> Gli intervalli dipendono dal mandante, e il loro stato numerazione cambia in ogni sistema. Non trasportare intervalli in un sistema di produzione che li sta già usando: il trasporto sovrascrive lo stato numerazione e il sistema assegna numeri che esistono già. Crea gli intervalli direttamente in ogni sistema, oppure trasportali una volta sola, prima dell'avvio produttivo.

## Ottenere il numero successivo

Il modulo funzione classico è `NUMBER_GET_NEXT`:

```abap
DATA lv_booking_no TYPE n LENGTH 10.
DATA lv_returncode TYPE inri-returncode.

CALL FUNCTION 'NUMBER_GET_NEXT'
  EXPORTING
    nr_range_nr             = '01'
    object                  = 'ZFLBOOK'
  IMPORTING
    number                  = lv_booking_no
    returncode              = lv_returncode
  EXCEPTIONS
    interval_not_found      = 1
    number_range_not_intern = 2
    object_not_found        = 3
    quantity_is_0           = 4
    quantity_is_not_1       = 5
    interval_overflow       = 6
    buffer_overflow         = 7
    OTHERS                  = 8.

IF sy-subrc <> 0.
  MESSAGE ID sy-msgid TYPE 'E' NUMBER sy-msgno
          WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
ENDIF.

CASE lv_returncode.
  WHEN '1'.
    MESSAGE 'L''intervallo di numerazione è quasi esaurito' TYPE 'W'.
  WHEN '2'.
    MESSAGE 'Questo era l''ultimo numero dell''intervallo' TYPE 'W'.
ENDCASE.
```

Il codice di ritorno è vuoto quando va tutto bene, `1` quando il numero è nella zona di warning impostata in `SNRO` e `2` quando era l'ultimo numero. Con il parametro `quantity` puoi chiedere un blocco di numeri in una volta.

In S/4HANA e in ABAP Cloud usa la classe `CL_NUMBERRANGE_RUNTIME`, che solleva eccezioni basate su classi:

```abap
TRY.
    cl_numberrange_runtime=>number_get(
      EXPORTING nr_range_nr = '01'
                object      = 'ZFLBOOK'
      IMPORTING number      = DATA(lv_number)
                returncode  = DATA(lv_rc) ).
    lv_booking_no = lv_number.             " il numero torna con 20 cifre
  CATCH cx_nr_object_not_found cx_number_ranges INTO DATA(lx_nr).
    MESSAGE lx_nr TYPE 'E'.
ENDTRY.
```

## Buffer e buchi nella numerazione

Leggere il contatore dal database per ogni numero creerebbe un collo di bottiglia, quindi di solito gli intervalli di numerazione sono **bufferizzati**:

| Buffer             | Effetto                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Nessun buffer      | ogni numero è letto dal database: niente buchi, ma lento sotto carico                          |
| Memoria principale | ogni application server tiene un blocco di numeri: veloce, ma con buchi e numeri non in ordine |
| Buffer parallelo   | come la memoria principale, ma per work process, con meno attese sui blocchi                   |

Con il buffer in memoria principale, i numeri rimasti nel buffer quando un server si riavvia vanno persi, e due server assegnano numeri che non sono in ordine di tempo. Per le prenotazioni va bene. Se la legge chiede numeri senza buchi, come per le fatture in molti paesi, disattiva il buffer per quell'oggetto.

> [!WARNING]
> Prendi il numero il più tardi possibile, subito prima di salvare il documento. Un numero preso per un documento che poi viene annullato è perso: il contatore non torna mai indietro, e con il buffer un rollback non lo restituisce.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea in `SNRO` l'oggetto `ZFLBOOK` con il dominio `NUM10` e un intervallo `01` da `1` a `999999999`.
> 2. Scrivi un report che prende cinque numeri in un ciclo e li stampa.
> 3. Cambia lo stato numerazione dell'intervallo in `SNRO` ed esegui di nuovo il report.

### Soluzione

```abap
REPORT zflbook_numbers.

DATA lv_number TYPE n LENGTH 10.

START-OF-SELECTION.
  DO 5 TIMES.
    CALL FUNCTION 'NUMBER_GET_NEXT'
      EXPORTING
        nr_range_nr = '01'
        object      = 'ZFLBOOK'
      IMPORTING
        number      = lv_number
      EXCEPTIONS
        OTHERS      = 1.
    IF sy-subrc <> 0.
      MESSAGE 'Nessun numero disponibile' TYPE 'E'.
    ENDIF.
    WRITE: / lv_number.
  ENDDO.
```

> [!NOTE]
>
> - Gli intervalli di numerazione assegnano numeri unici anche quando molti utenti creano documenti contemporaneamente.
> - Definisci l'oggetto in `SNRO` con un dominio della lunghezza del numero e degli intervalli; ogni intervallo ha il suo stato numerazione.
> - Prendi i numeri con `NUMBER_GET_NEXT` o `CL_NUMBERRANGE_RUNTIME=>NUMBER_GET` e controlla il codice di ritorno.
> - Il buffer rende veloci gli intervalli di numerazione ma permette buchi; disattivalo quando la legge chiede numeri senza buchi.
> - Non trasportare intervalli su un sistema che li usa, e prendi il numero subito prima di salvare.
