---
title: Il batch input
description: Compilare automaticamente le transazioni con BDC e SHDB.
---

_Livello pro_

Il **batch input** (detto anche **BDC**, _batch data communication_) esegue una transazione di dialogo come se un utente stesse digitando: compila i campi schermata per schermata e preme i pulsanti. La transazione esegue tutti i suoi controlli normali, quindi i dati che arrivano nel database sono coerenti come se li avesse inseriti una persona a mano.

È una tecnica vecchia e fragile, ma la incontri ancora nelle migrazioni di dati e nelle interfacce legacy. Usala solo quando non esiste una [BAPI](./0071-bapis.it.md) o un'API rilasciata per quel lavoro.

## Registrare una transazione con SHDB

I nomi di schermate e campi non si indovinano: si registrano. Nella transazione `SHDB` (il registratore di transazioni):

1. Scegli **Nuova registrazione**, dai un nome e inserisci il codice transazione.
2. Esegui la transazione normalmente: digita i valori e premi i pulsanti che premeresti di solito.
3. Salva. Il registratore mostra ogni schermata con programma, numero di schermata, campi e codici funzione.

Dalla registrazione puoi generare un programma di esempio o un modulo funzione. Schermate e campi registrati sono la materia prima della tabella interna che guida il batch input.

> [!TIP]
> SHDB è come registrare una macro in un foglio di calcolo: fai il lavoro una volta a mano e il registratore annota ogni tasto, così un programma può ripeterlo con altri valori.

## La tabella `BDCDATA`

Il batch input è guidato da una tabella interna di tipo `BDCDATA`. Ogni riga è l'inizio di una schermata oppure il valore di un campo:

| Campo      | Riga di schermata    | Riga di campo                               |
| ---------- | -------------------- | ------------------------------------------- |
| `PROGRAM`  | nome del module pool | vuoto                                       |
| `DYNPRO`   | numero di schermata  | vuoto                                       |
| `DYNBEGIN` | `X`                  | vuoto                                       |
| `FNAM`     | vuoto                | nome del campo, per esempio `SFLIGHT-PRICE` |
| `FVAL`     | vuoto                | valore, in formato esterno                  |

Il codice funzione da premere va nel campo speciale `BDC_OKCODE`, e la posizione del cursore in `BDC_CURSOR`. Due piccoli metodi di supporto rendono il codice leggibile.

L'esempio qui sotto cambia il prezzo di un volo con una transazione di dialogo personalizzata `ZFLIGHT_EDIT` (programma `SAPMZFLIGHT`), come quella che puoi costruire con le [lezioni sui Dynpro](./0101-dynpro-basics.it.md): la schermata 100 chiede la chiave del volo, la 200 mostra i dettagli. Con una transazione standard, i nomi vengono dalla tua registrazione SHDB.

```abap
CLASS lcl_bdc DEFINITION.
  PUBLIC SECTION.
    DATA mt_bdc TYPE STANDARD TABLE OF bdcdata WITH EMPTY KEY.
    METHODS add_screen IMPORTING iv_program TYPE bdc_prog
                                 iv_dynpro  TYPE bdc_dynr.
    METHODS add_field IMPORTING iv_name  TYPE fnam_____4
                                iv_value TYPE clike.
ENDCLASS.

CLASS lcl_bdc IMPLEMENTATION.
  METHOD add_screen.
    APPEND VALUE #( program = iv_program dynpro = iv_dynpro dynbegin = abap_true ) TO mt_bdc.
  ENDMETHOD.
  METHOD add_field.
    APPEND VALUE #( fnam = iv_name fval = iv_value ) TO mt_bdc.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_bdc) = NEW lcl_bdc( ).
  DATA lv_date  TYPE s_date VALUE '20250315'.
  DATA lv_price TYPE s_price VALUE '450.00'.

  lo_bdc->add_screen( iv_program = 'SAPMZFLIGHT' iv_dynpro = '0100' ).
  lo_bdc->add_field( iv_name = 'SFLIGHT-CARRID' iv_value = 'LH' ).
  lo_bdc->add_field( iv_name = 'SFLIGHT-CONNID' iv_value = '0400' ).
  lo_bdc->add_field( iv_name = 'SFLIGHT-FLDATE' iv_value = |{ lv_date DATE = USER }| ).
  lo_bdc->add_field( iv_name = 'BDC_OKCODE'     iv_value = '=EDIT' ).

  lo_bdc->add_screen( iv_program = 'SAPMZFLIGHT' iv_dynpro = '0200' ).
  lo_bdc->add_field( iv_name = 'SFLIGHT-PRICE'  iv_value = |{ lv_price NUMBER = USER }| ).
  lo_bdc->add_field( iv_name = 'BDC_OKCODE'     iv_value = '=SAVE' ).
```

> [!WARNING]
> `FVAL` contiene quello che l'utente digiterebbe, quindi date, numeri e importi devono essere nel **formato esterno dell'utente** (separatore decimale e formato data dalle impostazioni utente). Usa string template come `|{ lv_date DATE = USER }|` e `|{ lv_price NUMBER = USER }|` invece di formati scritti a mano.

## Eseguirlo con CALL TRANSACTION

Il modo più rapido per eseguire la tabella è `CALL TRANSACTION ... USING`. Scegli la modalità di visualizzazione e raccogli i messaggi che la transazione invia:

```abap
  DATA lt_messages TYPE STANDARD TABLE OF bdcmsgcoll WITH EMPTY KEY.
  DATA(ls_options) = VALUE ctu_params( dismode = 'N'     " nessuna schermata
                                       updmode = 'S'     " aggiornamento sincrono
                                       defsize = abap_true ).

  CALL TRANSACTION 'ZFLIGHT_EDIT' WITH AUTHORITY-CHECK
    USING lo_bdc->mt_bdc
    OPTIONS FROM ls_options
    MESSAGES INTO lt_messages.

  IF sy-subrc <> 0.
    LOOP AT lt_messages INTO DATA(ls_message) WHERE msgtyp CA 'EA'.
      MESSAGE ID ls_message-msgid TYPE 'I' NUMBER ls_message-msgnr
        WITH ls_message-msgv1 ls_message-msgv2 ls_message-msgv3 ls_message-msgv4.
    ENDLOOP.
  ENDIF.
```

| `DISMODE` | Che cosa vedi                             |
| --------- | ----------------------------------------- |
| `A`       | ogni schermata (utile per i test)         |
| `E`       | solo le schermate in cui c'è un errore    |
| `N`       | niente: la transazione gira in background |

Usa la modalità di aggiornamento `S` quando il passo successivo ha bisogno dei dati già salvati; `A` (asincrona) è più veloce ma ritorna prima che l'aggiornamento finisca.

## Eseguirlo come sessione in SM35

Per i caricamenti grandi puoi invece salvare i dati in una **sessione di batch input** ed elaborarla più tardi con la transazione `SM35`. La sessione conserva ogni transazione, e gli errori, così un utente può correggerli e rielaborarli.

```abap
CALL FUNCTION 'BDC_OPEN_GROUP'
  EXPORTING
    client = sy-mandt
    group  = 'ZFLIGHTS'
    user   = sy-uname
    keep   = abap_true.     " conserva la sessione dopo l'elaborazione

" una volta per ogni transazione da registrare
CALL FUNCTION 'BDC_INSERT'
  EXPORTING
    tcode     = 'ZFLIGHT_EDIT'
  TABLES
    dynprotab = lo_bdc->mt_bdc.

CALL FUNCTION 'BDC_CLOSE_GROUP'.
```

Il programma `RSBDCSUB` elabora le sessioni in un job di background. Il batch input si rompe quando cambia il layout di una schermata, e non funziona con i controlli come le griglie ALV o i tree control. Per le migrazioni verso S/4HANA usa invece il Migration Cockpit.

## Esercizio

> [!IMPORTANT]
>
> 1. Registra in `SHDB` una semplice transazione di modifica sul tuo sistema e guarda le schermate e i campi che elenca.
> 2. Scrivi un report che costruisce la tabella `BDCDATA` dalla registrazione e la esegue con `CALL TRANSACTION` in modalità `A`, poi in modalità `N`.
> 3. Stampa ogni messaggio di tipo `E` o `A` che ritorna.

### Soluzione

Usa la classe di supporto `lcl_bdc` con il programma, i numeri di schermata e i campi della tua registrazione, e il blocco `CALL TRANSACTION` visto sopra. In modalità `N`, `sy-subrc` è diverso da `0` quando la transazione si ferma con un errore, e `lt_messages` ti dice perché.

> [!NOTE]
>
> - Il batch input ripete una transazione di dialogo schermata per schermata, con tutti i suoi controlli.
> - Registra schermate e campi con `SHDB`; il programma riempie una tabella `BDCDATA` con righe di schermata e righe di campo.
> - `BDC_OKCODE` contiene il codice funzione; i valori devono essere nel formato esterno dell'utente.
> - `CALL TRANSACTION ... USING ... OPTIONS FROM ... MESSAGES INTO` lo esegue subito; `BDC_OPEN_GROUP`, `BDC_INSERT` e `BDC_CLOSE_GROUP` creano una sessione per `SM35`.
> - Preferisci una BAPI o un'API rilasciata: il batch input si rompe quando le schermate cambiano.
