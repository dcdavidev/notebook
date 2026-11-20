---
title: Classi di eccezione personalizzate
description: Le tue eccezioni con testi di messaggio, attributi, RETRY e RESUME.
---

_Livello intermedio_

Le eccezioni predefinite `CX_SY_` descrivono problemi tecnici: una divisione per zero, una riga di tabella mancante. La tua applicazione ha errori suoi: un volo che non esiste, una prenotazione per più posti di quelli liberi. Una **classe di eccezione personalizzata** dà a ciascuno di questi errori un nome, un testo di messaggio traducibile e attributi con i dettagli, così il chiamante può reagire con precisione. Questa lezione parte dalle [eccezioni basate su classi](./0089-class-based-exceptions.it.md).

## Creare la classe

Una classe di eccezione è una [classe globale](./0087-global-classes.it.md) con un nome che inizia con `ZCX_` e che eredita da una delle tre superclassi di eccezione. In ADT:

```text
Tasto destro sul tuo package > New > ABAP Class
  Name:        ZCX_FLIGHT_ERROR
  Description: Errori sui voli
  Superclass:  CX_STATIC_CHECK
  Interfaces:  IF_T100_DYN_MSG
```

Scegli la superclasse con la tabella della lezione precedente. Per gli errori di business che il chiamante deve gestire è quasi sempre `CX_STATIC_CHECK`. Usa `CX_DYNAMIC_CHECK` quando il chiamante può evitare facilmente l'errore con un controllo, e `CX_NO_CHECK` solo per gli errori che nessuno può gestire localmente.

> [!TIP]
> Una classe di eccezione personalizzata è come un modulo prestampato per segnalare un guasto invece di un biglietto scarabocchiato. Il biglietto dice "si è rotto qualcosa". Il modulo ha un titolo per il tipo di guasto, caselle per i dettagli (quale volo, quale data) e una frase standard che l'ufficio può tradurre in qualsiasi lingua.

## I testi da una classe di messaggi

L'interfaccia `IF_T100_DYN_MSG` (che include `IF_T100_MESSAGE`) prende il testo dell'eccezione da una [classe di messaggi](./0061-messages.it.md). Crea in `SE91` la classe di messaggi `ZFLIGHT` con il messaggio `001`: `Volo &1 &2 non trovato`. Poi completa la classe:

```abap
CLASS zcx_flight_error DEFINITION
  PUBLIC
  INHERITING FROM cx_static_check
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_t100_dyn_msg.

    CONSTANTS:
      BEGIN OF flight_not_found,
        msgid TYPE symsgid VALUE 'ZFLIGHT',
        msgno TYPE symsgno VALUE '001',
        attr1 TYPE scx_attrname VALUE 'CARRID',
        attr2 TYPE scx_attrname VALUE 'CONNID',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF flight_not_found.

    DATA carrid TYPE s_carr_id READ-ONLY.
    DATA connid TYPE s_conn_id READ-ONLY.

    METHODS constructor
      IMPORTING textid   LIKE if_t100_message=>t100key OPTIONAL
                previous LIKE previous OPTIONAL
                carrid   TYPE s_carr_id OPTIONAL
                connid   TYPE s_conn_id OPTIONAL.
ENDCLASS.

CLASS zcx_flight_error IMPLEMENTATION.
  METHOD constructor ##ADT_SUPPRESS_GENERATION.
    super->constructor( previous = previous ).
    me->carrid = carrid.
    me->connid = connid.
    CLEAR me->textid.
    IF textid IS INITIAL.
      if_t100_message~t100key = if_t100_message=>default_textid.
    ELSE.
      if_t100_message~t100key = textid.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

- Ogni **ID di testo** è una struttura costante: classe di messaggi, numero e nomi di al massimo quattro attributi, i cui valori sostituiscono da `&1` a `&4`. Aggiungi una costante per ogni messaggio.
- Gli attributi portano i dettagli. Rendili `READ-ONLY`: il chiamante li legge, solo il costruttore li imposta.
- ADT può generare il costruttore al posto tuo (quick fix con `Ctrl+1` sul nome della classe). `##ADT_SUPPRESS_GENERATION` dice ad ADT di non sovrascrivere le tue modifiche.

## Sollevare e catturare la tua eccezione

```abap
CLASS lcl_flight_repo DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS get_flight
      IMPORTING iv_carrid        TYPE s_carr_id
                iv_connid        TYPE s_conn_id
      RETURNING VALUE(rs_flight) TYPE spfli
      RAISING   zcx_flight_error.
ENDCLASS.

CLASS lcl_flight_repo IMPLEMENTATION.
  METHOD get_flight.
    SELECT SINGLE * FROM spfli
      WHERE carrid = @iv_carrid AND connid = @iv_connid
      INTO @rs_flight.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_flight_error
        EXPORTING textid = zcx_flight_error=>flight_not_found
                  carrid = iv_carrid
                  connid = iv_connid.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  TRY.
      DATA(ls_flight) = lcl_flight_repo=>get_flight( iv_carrid = 'XX' iv_connid = '0001' ).
    CATCH zcx_flight_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).          " Volo XX 0001 non trovato
      MESSAGE lx_error TYPE 'S' DISPLAY LIKE 'E'.
  ENDTRY.
```

`MESSAGE` accetta un oggetto eccezione che implementa `IF_T100_MESSAGE` e ne mostra il testo come qualsiasi altro messaggio.

Visto che la classe implementa `IF_T100_DYN_MSG`, da ABAP 7.50 la puoi sollevare anche con un messaggio qualsiasi e i suoi valori `WITH`, senza una costante di ID di testo:

```abap
RAISE EXCEPTION TYPE zcx_flight_error
  MESSAGE e001(zflight) WITH iv_carrid iv_connid.
```

## RETRY

`RETRY` in un blocco `CATCH` fa ripartire l'intero blocco `TRY`. Usalo quando il gestore può eliminare la causa, per esempio passando a un valore di riserva:

```abap
DATA lv_connid TYPE s_conn_id VALUE '9999'.

TRY.
    DATA(ls_connection) = lcl_flight_repo=>get_flight( iv_carrid = 'LH' iv_connid = lv_connid ).
    WRITE: / ls_connection-cityfrom, ls_connection-cityto.
  CATCH zcx_flight_error.
    IF lv_connid <> '0400'.
      lv_connid = '0400'.                       " ripiega su un collegamento noto
      RETRY.
    ENDIF.
ENDTRY.
```

> [!WARNING]
> `RETRY` va in ciclo infinito se la causa non viene davvero eliminata. Cambia sempre qualcosa prima di riprovare e assicurati che la condizione non possa ripresentarsi, oppure conta i tentativi.

## RESUME

Un'**eccezione ripristinabile** (_resumable_) permette a chi l'ha sollevata di proseguire dopo che il gestore ha esaminato il problema: utile per gli avvisi che non devono fermare un'intera elaborazione. Servono tre pezzi insieme:

1. Chi solleva usa `RAISE RESUMABLE EXCEPTION`.
2. Ogni metodo che attraversa la dichiara con `RAISING RESUMABLE( ... )`.
3. Il gestore usa `CATCH BEFORE UNWIND`, così il contesto di chi ha sollevato esiste ancora, e chiama `RESUME`.

```abap
CLASS lcl_checker DEFINITION.
  PUBLIC SECTION.
    TYPES tt_spfli TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.
    CLASS-METHODS check_flights
      IMPORTING it_flights TYPE tt_spfli
      RAISING   RESUMABLE(zcx_flight_error).
ENDCLASS.

CLASS lcl_checker IMPLEMENTATION.
  METHOD check_flights.
    LOOP AT it_flights INTO DATA(ls_flight) WHERE distance = 0.
      RAISE RESUMABLE EXCEPTION TYPE zcx_flight_error
        EXPORTING textid = zcx_flight_error=>flight_not_found
                  carrid = ls_flight-carrid
                  connid = ls_flight-connid.
      WRITE: / 'Controllato dopo l''avviso:', ls_flight-connid.   " gira dopo RESUME
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_flights TYPE lcl_checker=>tt_spfli.
  SELECT * FROM spfli INTO TABLE @lt_flights.
  TRY.
      lcl_checker=>check_flights( lt_flights ).
    CATCH BEFORE UNWIND zcx_flight_error INTO DATA(lx_warning).
      WRITE / lx_warning->get_text( ).
      IF lx_warning->is_resumable = abap_true.
        RESUME.                                  " prosegue subito dopo il RAISE
      ENDIF.
  ENDTRY.
```

Se il gestore non chiama `RESUME`, l'eccezione viene gestita normalmente: lo stack si svuota e il programma prosegue dopo `ENDTRY`.

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi a `ZFLIGHT` il messaggio `002` `Solo &1 posti liberi sul volo &2`, e a `ZCX_FLIGHT_ERROR` un ID di testo `not_enough_seats` con un attributo `free_seats` (tipo `i`).
> 2. Scrivi un metodo `book` che legge una riga di `SFLIGHT` e solleva `not_enough_seats` quando `seatsmax - seatsocc` è minore dei posti richiesti.
> 3. Chiamalo, cattura l'eccezione e stampa `get_text( )` e l'attributo `free_seats`.

### Soluzione

```abap
" In ZCX_FLIGHT_ERROR
    CONSTANTS:
      BEGIN OF not_enough_seats,
        msgid TYPE symsgid VALUE 'ZFLIGHT',
        msgno TYPE symsgno VALUE '002',
        attr1 TYPE scx_attrname VALUE 'FREE_SEATS',
        attr2 TYPE scx_attrname VALUE 'CONNID',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF not_enough_seats.
    DATA free_seats TYPE i READ-ONLY.
    " aggiungi free_seats TYPE i OPTIONAL al costruttore e imposta me->free_seats

" Il metodo
  METHOD book.
    SELECT SINGLE * FROM sflight
      WHERE carrid = @iv_carrid AND connid = @iv_connid AND fldate = @iv_fldate
      INTO @DATA(ls_flight).
    DATA(lv_free) = ls_flight-seatsmax - ls_flight-seatsocc.
    IF lv_free < iv_seats.
      RAISE EXCEPTION TYPE zcx_flight_error
        EXPORTING textid     = zcx_flight_error=>not_enough_seats
                  connid     = iv_connid
                  free_seats = lv_free.
    ENDIF.
  ENDMETHOD.

" Il chiamante
  TRY.
      lcl_booking=>book( iv_carrid = 'LH' iv_connid = '0400'
                         iv_fldate = '20261215' iv_seats = 500 ).
    CATCH zcx_flight_error INTO DATA(lx_error).
      WRITE: / lx_error->get_text( ), lx_error->free_seats.
  ENDTRY.
```

> [!NOTE]
>
> - Una classe di eccezione personalizzata è una classe globale `ZCX_` che eredita da `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK` o `CX_NO_CHECK`.
> - Con `IF_T100_DYN_MSG` i testi vengono da una classe di messaggi; ogni costante di ID di testo collega gli attributi a `&1`...`&4`.
> - La sollevi con `RAISE EXCEPTION TYPE ... EXPORTING textid = ...`, oppure con `MESSAGE ... WITH ...`.
> - `RETRY` fa ripartire il blocco `TRY`; prima assicurati di aver eliminato la causa.
> - `RESUME` prosegue dopo un `RAISE RESUMABLE EXCEPTION`; richiede `RAISING RESUMABLE( ... )` e `CATCH BEFORE UNWIND`.
