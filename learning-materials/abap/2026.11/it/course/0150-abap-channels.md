---
title: Gli ABAP channel
description: Inviare messaggi in push con ABAP Messaging Channel e ABAP Push Channel.
---

_Livello pro_

L'ABAP classico funziona a richieste e risposte: un programma o un browser chiede, il server risponde. Se sul server cambia qualcosa, per esempio arriva una nuova prenotazione, il client non lo sa finché non chiede di nuovo. Gli **ABAP channel** ribaltano lo schema e permettono al server di inviare messaggi in **push** appena succede un evento. Ce ne sono di due tipi:

- Gli **ABAP Messaging Channel** (AMC) inviano messaggi fra sessioni ABAP, anche su application server diversi dello stesso sistema, con un modello publish e subscribe.
- Gli **ABAP Push Channel** (APC) aprono una connessione **WebSocket** fra il server ABAP e un client come un browser, così entrambe le parti possono inviare messaggi in qualunque momento.

Usati insieme, un programma ABAP pubblica su un canale AMC, e un APC inoltra ogni messaggio a tutti i browser collegati.

## I messaging channel

Un messaging channel lo definisci nella transazione `SAMC`:

1. Crea un'applicazione, per esempio `ZFLIGHT_AMC`.
2. Aggiungi un canale, per esempio `/bookings`, con il tipo di messaggio **TEXT** (gli altri tipi sono binario e **Push Channel Protocol**, un formato semplice con campi di testata e un corpo).
3. Imposta l'**activity scope**, cioè chi riceve i messaggi: tutte le sessioni del sistema, solo quelle dello stesso mandante o solo quelle dello stesso utente.
4. In **Authorized Programs**, elenca ogni programma o classe che può inviare o ricevere sul canale, con l'attività **Send** o **Receive**. Un programma che non è nell'elenco riceve un'eccezione.

Un **producer** invia un messaggio al canale:

```abap
REPORT zamc_send_booking.

PARAMETERS p_text TYPE string LOWER CASE DEFAULT `Nuova prenotazione per LH 0400`.

START-OF-SELECTION.
  TRY.
      DATA(lo_producer) = CAST if_amc_message_producer_text(
        cl_amc_channel_manager=>create_message_producer(
          i_application_id = 'ZFLIGHT_AMC'
          i_channel_id     = '/bookings' ) ).
      lo_producer->send( i_message = p_text ).
      WRITE / 'Messaggio inviato'.
    CATCH cx_amc_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).
  ENDTRY.
```

Un **consumer** registra un oggetto ricevitore e aspetta. Il ricevitore implementa un'interfaccia adatta al tipo di messaggio, qui `if_amc_message_receiver_text`:

```abap
REPORT zamc_receive_booking.

CLASS lcl_receiver DEFINITION.
  PUBLIC SECTION.
    INTERFACES if_amc_message_receiver_text.
    DATA mt_messages TYPE string_table READ-ONLY.
ENDCLASS.

CLASS lcl_receiver IMPLEMENTATION.
  METHOD if_amc_message_receiver_text~receive.
    APPEND i_message TO mt_messages.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_receiver) = NEW lcl_receiver( ).
  TRY.
      cl_amc_channel_manager=>create_message_consumer(
          i_application_id = 'ZFLIGHT_AMC'
          i_channel_id     = '/bookings'
        )->start_message_delivery( i_receiver = lo_receiver ).
    CATCH cx_amc_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).
      RETURN.
  ENDTRY.

  " il programma dorme finché arriva un messaggio, al massimo 60 secondi
  WAIT FOR MESSAGING CHANNELS UNTIL lines( lo_receiver->mt_messages ) > 0 UP TO 60 SECONDS.

  LOOP AT lo_receiver->mt_messages INTO DATA(lv_message).
    WRITE / lv_message.
  ENDLOOP.
```

Esegui il ricevitore in una sessione e il mittente in un'altra: il ricevitore si sveglia e stampa il messaggio. I messaggi arrivano solo ai consumer che sono in ascolto in quel momento; AMC non li memorizza.

> [!WARNING]
> `WAIT FOR MESSAGING CHANNELS` è l'unico punto in cui il ricevitore riceve i messaggi: il metodo `receive` viene chiamato mentre il programma aspetta, mai in mezzo ad altro codice. Imposta sempre `UP TO n SECONDS`, altrimenti il programma può restare in attesa per sempre.

## I push channel

Un push channel lo definisci nella transazione `SAPC`:

1. Crea un'applicazione, per esempio `ZFLIGHT_APC`, con il tipo di connessione **WebSocket** e il tipo stateless.
2. Lascia che `SAPC` generi la classe, per esempio `ZCL_APC_WSP_EXT_ZFLIGHT_APC`, che eredita da `CL_APC_WSP_EXT_STATELESS_BASE`.
3. Attiva il servizio. `SAPC` crea il nodo corrispondente in `SICF`, così il canale risponde a un URL come `wss://host:port/sap/bc/apc/sap/zflight_apc`.

Nella classe generata ridefinisci due metodi: `on_start`, chiamato quando un client si collega, e `on_message`, chiamato quando il client invia un messaggio. Qui `on_start` collega la connessione al canale AMC, così ogni messaggio pubblicato su `/bookings` arriva dritto al browser, e `on_message` risponde al client:

```abap
METHOD if_apc_wsp_extension~on_start.
  TRY.
      i_context->get_binding_manager( )->bind_amc_message_consumer(
        i_application_id = 'ZFLIGHT_AMC'
        i_channel_id     = '/bookings' ).
    CATCH cx_apc_error INTO DATA(lx_error).
      DATA(lv_text) = lx_error->get_text( ).
      MESSAGE lv_text TYPE 'E'.
  ENDTRY.
ENDMETHOD.

METHOD if_apc_wsp_extension~on_message.
  TRY.
      DATA(lv_request) = i_message->get_text( ).
      DATA(lo_reply) = i_message_manager->create_message( ).
      lo_reply->set_text( |Ricevuto: { lv_request }| ).
      i_message_manager->send( lo_reply ).
    CATCH cx_apc_error INTO DATA(lx_error).
      DATA(lv_text) = lx_error->get_text( ).
      MESSAGE lv_text TYPE 'E'.
  ENDTRY.
ENDMETHOD.
```

Perché il collegamento funzioni, aggiungi la classe APC ai programmi autorizzati del canale in `SAMC`, con l'attività **Receive via APC**. Lato client bastano poche righe di JavaScript:

```javascript
const socket = new WebSocket('wss://myhost:44300/sap/bc/apc/sap/zflight_apc');

socket.onopen = () => socket.send('Ciao dal browser');
socket.onmessage = (event) => console.log('Il server dice:', event.data);
```

Ora esegui `ZAMC_SEND_BOOKING`: il messaggio compare nella console del browser senza ricaricare la pagina.

> [!TIP]
> AMC è come una stazione radio: chi è sintonizzato in quel momento sente la notizia, chi non lo è se la perde. APC è una linea telefonica fra la stazione e la casa di un ascoltatore, così la notizia arriva anche a chi sta fuori dall'edificio.

## Quando usare gli ABAP channel

- Dashboard e monitor in tempo reale che si aggiornano appena i dati cambiano.
- Avvisare un utente che un job in background è finito, invece di fargli ricaricare la pagina.
- La collaborazione, quando più utenti lavorano sullo stesso oggetto.
- Svegliare una sessione ABAP che aspetta un'altra sessione, invece di interrogare in loop una tabella di database.

Per messaggi che non devono andare persi, o che devono arrivare ad altri sistemi, usa invece una coda o un'infrastruttura di eventi, come il bgRFC (vedi [elaborazione parallela e in background](./0114-parallel-processing.md)) o i business event di RAP.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea l'applicazione AMC `ZFLIGHT_AMC` con il canale `/bookings` in `SAMC`, e autorizza i due report.
> 2. Esegui `ZAMC_RECEIVE_BOOKING` in una sessione e `ZAMC_SEND_BOOKING` in una seconda, e verifica che il testo arrivi.
> 3. Modifica il ricevitore in modo che aspetti tre messaggi invece di uno.

### Soluzione

I passi 1 e 2 usano il codice qui sopra. Per il passo 3, cambia solo la condizione dell'attesa:

```abap
WAIT FOR MESSAGING CHANNELS UNTIL lines( lo_receiver->mt_messages ) >= 3 UP TO 60 SECONDS.
```

> [!NOTE]
>
> - Gli ABAP channel inviano messaggi in push invece di aspettare che il client chieda.
> - AMC (`SAMC`) invia messaggi fra sessioni ABAP con producer, consumer e `WAIT FOR MESSAGING CHANNELS`.
> - APC (`SAPC`) apre un WebSocket verso un client; ridefinisci `on_start` e `on_message` nella classe generata.
> - Collega una connessione APC a un canale AMC per inoltrare al browser i messaggi ABAP.
> - Ogni mittente e ogni ricevitore deve essere autorizzato in `SAMC`; i messaggi AMC non vengono memorizzati.
