---
title: Elaborazione parallela e in background
description: RFC asincrona, bgRFC e il background processing framework.
level: intermediate
---

Normalmente un programma fa una cosa dopo l'altra in un solo work process. Quando il lavoro è grande (milioni di documenti, una chiamata lenta per ogni cliente), puoi dividerlo in pacchetti ed eseguirli **in parallelo** in più work process, oppure affidarlo al sistema perché lo esegua **in background** dopo la fine della tua transazione.

Questa lezione mostra i tre strumenti principali: la RFC asincrona per il lavoro parallelo di cui aspetti il risultato, la bgRFC per chiamate affidabili in background e il background processing framework per il codice moderno. Per pianificare interi programmi come job, vedi [varianti e job in background](./0068-variants-and-background-jobs.md).

## Scegliere lo strumento giusto

| Strumento                              | Quando gira                                  | Il tuo programma    | Uso tipico                                           |
| -------------------------------------- | -------------------------------------------- | ------------------- | ---------------------------------------------------- |
| RFC asincrona (aRFC)                   | subito, in work process di dialogo paralleli | aspetta i risultati | dividere un calcolo lungo in pacchetti               |
| RFC in background (bgRFC)              | dopo il `COMMIT WORK`, una volta sola        | non aspetta         | chiamate affidabili allo stesso o a un altro sistema |
| background processing framework (bgPF) | dopo il `COMMIT WORK`, una volta sola        | non aspetta         | passi asincroni nel codice RAP e ABAP Cloud          |

> [!TIP]
> La aRFC è un capoufficio che distribuisce una pila di pratiche a cinque colleghi e aspetta alla scrivania che ognuno gli riporti il risultato. La bgRFC e il bgPF sono il vassoio della posta in uscita: lasci la busta, vai a casa, e l'ufficio postale garantisce che venga consegnata una volta.

## La RFC asincrona

La aRFC chiama un modulo funzione **abilitato RFC** (vedi [le remote function call](./0124-rfc.md)) in una nuova sessione, mentre il tuo programma prosegue. `DESTINATION IN GROUP` manda ogni chiamata a un work process di dialogo libero di un gruppo di server (definito in `RZ12`; `DEFAULT` significa tutti i server).

Il modulo funzione, contrassegnato come **Modulo abilitato RFC** in `SE37`:

```abap
FUNCTION z_flights_of_carrier.
*"  IMPORTING
*"     VALUE(IV_CARRID) TYPE S_CARR_ID
*"  EXPORTING
*"     VALUE(EV_SEATS_FREE) TYPE I
  SELECT SUM( seatsmax - seatsocc ) FROM sflight
    WHERE carrid = @iv_carrid
    INTO @ev_seats_free.
ENDFUNCTION.
```

Il chiamante avvia un task per compagnia, raccoglie i risultati in un metodo di callback e aspetta:

```abap
CLASS lcl_collector DEFINITION.
  PUBLIC SECTION.
    DATA mv_done TYPE i.
    METHODS on_end IMPORTING p_task TYPE clike.   " esattamente questa firma
ENDCLASS.

CLASS lcl_collector IMPLEMENTATION.
  METHOD on_end.
    DATA lv_seats TYPE i.
    RECEIVE RESULTS FROM FUNCTION 'Z_FLIGHTS_OF_CARRIER'
      IMPORTING  ev_seats_free = lv_seats
      EXCEPTIONS system_failure = 1 communication_failure = 2 OTHERS = 3.
    IF sy-subrc = 0.
      WRITE: / p_task, lv_seats.
    ENDIF.
    mv_done += 1.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_collector) = NEW lcl_collector( ).
  DATA lv_started TYPE i.

  SELECT carrid FROM scarr INTO TABLE @DATA(lt_carriers).

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    DATA(lv_task) = CONV char32( ls_carrier-carrid ).   " nome del task univoco
    CALL FUNCTION 'Z_FLIGHTS_OF_CARRIER'
      STARTING NEW TASK lv_task
      DESTINATION IN GROUP DEFAULT
      CALLING lo_collector->on_end ON END OF TASK
      EXPORTING
        iv_carrid             = ls_carrier-carrid
      EXCEPTIONS
        system_failure        = 1
        communication_failure = 2
        resource_failure      = 3.          " nessun work process libero adesso
    IF sy-subrc = 0.
      lv_started += 1.
    ENDIF.
  ENDLOOP.

  WAIT FOR ASYNCHRONOUS TASKS UNTIL lo_collector->mv_done >= lv_started UP TO 600 SECONDS.
```

- Il callback gira solo mentre il chiamante aspetta (`WAIT`) o fra due passi di dialogo.
- `RECEIVE RESULTS` va chiamato dentro il callback, per lo stesso modulo funzione.
- Con `resource_failure`, i programmi reali aspettano un po' e riprovano invece di saltare il pacchetto. Il modulo funzione `SPBT_INITIALIZE` ti dice quanti work process liberi ha il gruppo.

> [!WARNING]
> Ogni task occupa un work process di dialogo. Se ne avvii troppi, gli utenti non riescono a lavorare. Limita il numero di task paralleli e concorda un gruppo di server con il team basis.

## La RFC in background (bgRFC)

La **bgRFC** registra le chiamate nel database e le esegue dopo il `COMMIT WORK`, una volta sola. Con le **code** (qRFC) le chiamate di una coda girano anche nell'ordine giusto. Sostituisce il vecchio `CALL FUNCTION ... IN BACKGROUND TASK` (tRFC), che troverai ancora nel codice vecchio.

```abap
TRY.
    DATA(lo_destination) = cl_bgrfc_destination_outbound=>create( 'ZFLIGHT_BGRFC' ).
    DATA(lo_unit) = lo_destination->create_trfc_unit( ).

    CALL FUNCTION 'Z_FLIGHTS_OF_CARRIER'
      IN BACKGROUND UNIT lo_unit
      EXPORTING
        iv_carrid = 'LH'.

    COMMIT WORK.                       " la unit viene salvata e poi eseguita
  CATCH cx_bgrfc_invalid_destination INTO DATA(lx_error).
    WRITE / lx_error->get_text( ).
ENDTRY.
```

Il nome della destinazione è una destinazione bgRFC in entrata o in uscita definita in `SBGRFCCONF`. Controlli le unit in `SBGRFCMON`. I parametri di export vengono ignorati: nessuno aspetta il risultato.

## Il background processing framework

Il **background processing framework (bgPF)** è il modo moderno, basato su classi, per eseguire codice in modo asincrono dopo il commit. Si appoggia alla bgRFC ed è rilasciato per ABAP Cloud. Scrivi una classe operazione e ne passi un'istanza a un processo:

```abap
CLASS zcl_flight_recalc DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_bgmc_op_single_tx_uncontr.
    METHODS constructor IMPORTING iv_carrid TYPE s_carr_id.
  PRIVATE SECTION.
    DATA mv_carrid TYPE s_carr_id.
ENDCLASS.

CLASS zcl_flight_recalc IMPLEMENTATION.
  METHOD constructor.
    mv_carrid = iv_carrid.
  ENDMETHOD.

  METHOD if_bgmc_op_single_tx_uncontr~execute.
    " gira più tardi, in background, nella sua LUW
    UPDATE sflight SET seatsocc = 0 WHERE carrid = @mv_carrid AND fldate < @sy-datum.
  ENDMETHOD.
ENDCLASS.
```

```abap
TRY.
    DATA(lo_process) = cl_bgmc_process_factory=>get_default( )->create( ).
    lo_process->set_name( 'Ricalcolo voli' ).
    lo_process->set_operation_tx_uncontrolled( NEW zcl_flight_recalc( 'LH' ) ).
    lo_process->save_for_execution( ).
    COMMIT WORK.                      " il processo parte dopo il commit
  CATCH cx_bgmc INTO DATA(lx_bgmc).
    WRITE / lx_bgmc->get_text( ).
ENDTRY.
```

L'oggetto viene serializzato, quindi i suoi attributi devono essere serializzabili. Esiste anche una variante **controllata** (`IF_BGMC_OP_SINGLE`) che segue le fasi transazionali di RAP. Il framework è disponibile da ABAP 7.58 (SAP S/4HANA 2023) e su SAP BTP; nei rilasci precedenti usa la bgRFC.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea il modulo funzione abilitato RFC `Z_FLIGHTS_OF_CARRIER`.
> 2. Scrivi il report con la aRFC ed eseguilo. Confronta il tempo di esecuzione con un semplice ciclo che chiama il modulo funzione in modo sincrono.
> 3. Imposta `UP TO 1 SECONDS` nel `WAIT` e guarda che fine fanno i risultati che arrivano in ritardo.

### Soluzione

La versione sincrona chiama `CALL FUNCTION 'Z_FLIGHTS_OF_CARRIER' EXPORTING iv_carrid = ls_carrier-carrid IMPORTING ev_seats_free = lv_seats.` dentro il ciclo. Con poche compagnie e pochi dati la versione parallela può essere persino più lenta: avviare un task ha un costo, quindi l'elaborazione parallela conviene solo con pacchetti grandi. Con un `WAIT` breve il programma prosegue prima che tutti i callback siano girati, e i risultati in ritardo vanno persi.

> [!NOTE]
>
> - La aRFC (`STARTING NEW TASK`) esegue in parallelo moduli funzione abilitati RFC; raccogli i risultati con un callback e `WAIT FOR ASYNCHRONOUS TASKS`.
> - Gestisci sempre `resource_failure` e limita il numero di task paralleli.
> - La bgRFC (`IN BACKGROUND UNIT`) esegue le chiamate dopo il `COMMIT WORK`, una volta sola e, se serve, in ordine; si configura in `SBGRFCCONF` e si controlla in `SBGRFCMON`.
> - Il background processing framework avvolge la bgRFC in classi: una classe operazione più `CL_BGMC_PROCESS_FACTORY`.
> - L'elaborazione parallela conviene solo quando ogni pacchetto ha abbastanza lavoro.
