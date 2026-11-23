---
title: Il log applicativo
description: Raccogliere e mostrare messaggi con i moduli funzione BAL e SLG1.
level: intermediate
---

Un [messaggio](./0061-messages.md) mostrato a video sparisce appena l'utente preme Invio, e un job in background non ha proprio uno schermo. Quando un programma elabora molti record, devi raccogliere tutti i suoi messaggi, salvarli e permettere a qualcuno di leggerli in seguito. Il **log applicativo** (detto anche BAL, Business Application Log) fa esattamente questo.

Lo standard SAP lo usa ovunque: modifiche di massa, interfacce, migrazione dati. Utenti e supporto leggono i log nella transazione `SLG1`.

## Oggetti e sotto-oggetti di log

Ogni log appartiene a un **oggetto di log** e, facoltativamente, a un **sotto-oggetto**. Servono a classificare i log, così `SLG1` può trovarli. Li definisci nella transazione `SLG0`:

```text
SLG0 > Nuove voci
  Oggetto: ZFLIGHT       Testo: Applicazioni voli custom
Seleziona ZFLIGHT > Sotto-oggetti > Nuove voci
  Sotto-oggetto: CHECK   Testo: Controllo overbooking
```

Un log ha anche un'intestazione con un **ID esterno**, un testo libero fino a 100 caratteri come un nome di file o un numero di documento, e una **data di scadenza** dopo la quale può essere cancellato.

> [!TIP]
> Il log applicativo è il giornale di bordo di una nave. L'equipaggio annota ogni evento quando succede, con la sua importanza; a fine viaggio il giornale finisce in archivio, e chiunque può leggerlo in seguito per capire che cosa è successo.

## Scrivere un log

Scrivere un log richiede quattro passi: crearlo, aggiungere messaggi, salvarlo e, se un utente sta aspettando, mostrarlo.

```abap
REPORT zflight_overbooking.

DATA gv_log_handle TYPE balloghndl.

START-OF-SELECTION.
  " 1. Crea il log in memoria
  DATA(ls_log) = VALUE bal_s_log(
    object     = 'ZFLIGHT'
    subobject  = 'CHECK'
    extnumber  = |Controllo overbooking { sy-datum DATE = USER }|
    aldate_del = sy-datum + 30 ).          " cancellabile dopo 30 giorni

  CALL FUNCTION 'BAL_LOG_CREATE'
    EXPORTING
      i_s_log      = ls_log
    IMPORTING
      e_log_handle = gv_log_handle
    EXCEPTIONS
      OTHERS       = 1.

  " 2. Aggiungi i messaggi
  SELECT FROM sflight
    FIELDS carrid, connid, fldate
    WHERE seatsocc > sflight~seatsmax            " solo i voli in overbooking
    INTO TABLE @DATA(lt_flights).

  LOOP AT lt_flights INTO DATA(ls_flight).
    " Il messaggio riempie sy-msgid, sy-msgno, sy-msgv1... senza mostrare niente
    MESSAGE e010(zflight) WITH ls_flight-carrid ls_flight-connid ls_flight-fldate
            INTO DATA(lv_dummy) ##NEEDED.

    DATA(ls_msg) = VALUE bal_s_msg(
      msgty     = sy-msgty
      msgid     = sy-msgid
      msgno     = sy-msgno
      msgv1     = sy-msgv1
      msgv2     = sy-msgv2
      msgv3     = sy-msgv3
      msgv4     = sy-msgv4
      probclass = '1' ).                   " 1 = molto importante

    CALL FUNCTION 'BAL_LOG_MSG_ADD'
      EXPORTING
        i_log_handle = gv_log_handle
        i_s_msg      = ls_msg
      EXCEPTIONS
        OTHERS       = 1.
  ENDLOOP.

  CALL FUNCTION 'BAL_LOG_MSG_ADD_FREE_TEXT'
    EXPORTING
      i_log_handle = gv_log_handle
      i_msgty      = 'S'
      i_text       = |Trovati { lines( lt_flights ) } voli in overbooking|
    EXCEPTIONS
      OTHERS       = 1.
```

`MESSAGE ... INTO` è il modo consigliato per riempire un messaggio di log: il messaggio è definito in una classe di messaggi, quindi si può tradurre, e la lista di utilizzo del messaggio trova questa riga. I testi liberi si scrivono più in fretta ma non si possono tradurre: usali solo per dettagli tecnici.

La **classe di problema** (`probclass`) stabilisce l'importanza, da `1` (molto importante) a `4` (informazione aggiuntiva). `SLG1` può filtrare su di essa.

## Salvare e mostrare

```abap
  " 3. Salva nel database
  CALL FUNCTION 'BAL_DB_SAVE'
    EXPORTING
      i_t_log_handle = VALUE bal_t_logh( ( gv_log_handle ) )
    EXCEPTIONS
      OTHERS         = 1.
  COMMIT WORK.

  " 4. Mostralo all'utente, solo in dialogo
  IF sy-batch = abap_false.
    CALL FUNCTION 'BAL_DSP_LOG_DISPLAY'
      EXPORTING
        i_t_log_handle = VALUE bal_t_logh( ( gv_log_handle ) )
      EXCEPTIONS
        OTHERS         = 1.
  ENDIF.
```

`BAL_DB_SAVE` scrive il log nelle tabelle del database, e il [`COMMIT WORK`](./0060-luw-commit-and-rollback.md) lo rende definitivo. Finché non lo salvi, il log esiste solo nella memoria del tuo programma. Per mostrare il log in un popup invece che a schermo intero, ottieni un profilo di visualizzazione con `BAL_DSP_PROFILE_POPUP_GET` e passalo in `i_s_display_profile`.

> [!WARNING]
> Se dopo un errore il tuo programma annulla le sue modifiche, anche un log salvato nella stessa LUW viene annullato, e l'errore si perde. Salva il log in una LUW separata, oppure chiama `BAL_DB_SAVE` con `i_2th_connection = abap_true` e `i_2th_connect_commit = abap_true`, che lo confermano su una seconda connessione al database.

## Leggere i log in SLG1

In `SLG1`, inserisci l'oggetto, il sotto-oggetto, l'ID esterno, un intervallo di tempo o l'utente, ed esegui. Ogni log mostra i suoi messaggi con un semaforo per il tipo di messaggio; un doppio clic su un messaggio ne mostra il testo esteso. I log scaduti si cancellano con `SLG2`, di solito in un job periodico.

In ABAP Cloud i moduli funzione BAL non sono rilasciati. Usa le classi `CL_BALI_LOG`, `CL_BALI_HEADER_SETTER` e `CL_BALI_LOG_DB`, con un oggetto di log creato in ADT. I concetti sono gli stessi.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea in `SLG0` l'oggetto di log `ZFLIGHT` con il sotto-oggetto `CHECK`, e nella classe di messaggi `ZFLIGHT` il messaggio `010` "Il volo &1 &2 del &3 è in overbooking".
> 2. Esegui il report `ZFLIGHT_OVERBOOKING` della lezione, una volta in dialogo e una volta in background.
> 3. Trova entrambi i log in `SLG1` tramite l'ID esterno.

### Soluzione

Il report è quello della lezione. Nell'esecuzione in background, `BAL_DSP_LOG_DISPLAY` viene saltato perché `sy-batch` è impostato, ma il log viene salvato lo stesso, e `SLG1` mostra entrambe le esecuzioni sotto l'oggetto `ZFLIGHT`, sotto-oggetto `CHECK`.

> [!NOTE]
>
> - Il log applicativo raccoglie i messaggi, li salva e li mostra in seguito in `SLG1`.
> - Definisci oggetti e sotto-oggetti di log in `SLG0`; ogni log ha un ID esterno e una data di scadenza.
> - I passi sono `BAL_LOG_CREATE`, `BAL_LOG_MSG_ADD`, `BAL_DB_SAVE` con `COMMIT WORK` e `BAL_DSP_LOG_DISPLAY`.
> - Riempi i messaggi con `MESSAGE ... INTO`, così sono traducibili e rintracciabili.
> - Mostra il log solo in dialogo; in ABAP Cloud usa le classi `CL_BALI_*`.
