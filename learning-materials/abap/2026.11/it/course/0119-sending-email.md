---
title: Inviare email
description: Inviare messaggi e allegati con CL_BCS e SOST.
---

_Livello intermedio_

Spesso un report finisce con "e manda il risultato via mail al team". Nell'ABAP classico lo fai con i **Business Communication Services (BCS)**, un insieme di classi attorno a `CL_BCS`. Costruisci un documento, aggiungi i destinatari e invii. SAP mette il messaggio in una coda, e il processo di invio di SAPconnect lo consegna tramite un server SMTP.

## I mattoni

| Classe               | Ruolo                                                              |
| -------------------- | ------------------------------------------------------------------ |
| `CL_BCS`             | la richiesta di invio: contiene documento, mittente e destinatari  |
| `CL_DOCUMENT_BCS`    | il documento: oggetto, testo e allegati                            |
| `CL_CAM_ADDRESS_BCS` | un indirizzo internet (`create_internet_address`)                  |
| `CL_SAPUSER_BCS`     | un utente SAP, come mittente o destinatario                        |
| `CL_BCS_CONVERT`     | metodi per convertire stringhe nelle tabelle binarie che BCS vuole |

Tutte queste classi sollevano eccezioni di `CX_BCS` (e di sottoclassi come `CX_SEND_REQ_BCS`, `CX_DOCUMENT_BCS`, `CX_ADDRESS_BCS`).

> [!TIP]
> BCS funziona come l'ufficio postale. `CL_DOCUMENT_BCS` è la lettera, `CL_BCS` è la busta con gli indirizzi, `send( )` la imbuca e `COMMIT WORK` è il momento in cui il postino la ritira.

## Inviare un messaggio semplice

```abap
TRY.
    DATA(lo_request) = cl_bcs=>create_persistent( ).

    DATA(lt_body) = VALUE soli_tab( ( line = 'Ciao,' )
                                    ( line = 'il report notturno dei voli è terminato.' ) ).

    DATA(lo_document) = cl_document_bcs=>create_document(
                          i_type    = 'RAW'                 " testo semplice; 'HTM' per HTML
                          i_text    = lt_body
                          i_subject = 'Report voli' ).      " max. 50 caratteri
    lo_request->set_document( lo_document ).

    lo_request->set_sender( cl_cam_address_bcs=>create_internet_address( 'noreply@example.com' ) ).
    lo_request->add_recipient( i_recipient = cl_cam_address_bcs=>create_internet_address( 'team@example.com' )
                               i_express   = abap_true ).

    lo_request->set_send_immediately( abap_true ).
    IF lo_request->send( ) = abap_true.
      COMMIT WORK.                                   " senza commit non parte niente
    ENDIF.

  CATCH cx_bcs INTO DATA(lx_bcs).
    WRITE / lx_bcs->get_text( ).
ENDTRY.
```

- `create_persistent( )` salva la richiesta nel database. Senza `COMMIT WORK` non viene mai inviata.
- `set_send_immediately( abap_true )` chiede a SAPconnect di inviarla subito; altrimenti aspetta il prossimo job di invio pianificato.
- `add_recipient` accetta opzioni come `i_copy` (CC) e `i_blind_copy` (CCN).
- Per usare l'utente corrente come mittente, passa `cl_sapuser_bcs=>create( sy-uname )`.

> [!WARNING]
> Non chiamare `COMMIT WORK` di tua iniziativa quando il codice gira dentro la LUW di qualcun altro, come una BAdI o un [modulo funzione di aggiornamento](./0113-update-task.md). La mail parte con il commit del chiamante; un tuo commit farebbe anche il commit dei dati a metà del chiamante.

## Aggiungere un allegato

Gli allegati sono tabelle binarie (`SOLIX_TAB`). `CL_BCS_CONVERT` trasforma una stringa in una di queste tabelle:

```abap
SELECT carrid, connid, fldate, seatsocc FROM sflight
  WHERE carrid = 'LH'
  INTO TABLE @DATA(lt_flights).

DATA(lv_csv) = |CARRID;CONNID;FLDATE;SEATSOCC\r\n|.
LOOP AT lt_flights INTO DATA(ls_flight).
  lv_csv = lv_csv && |{ ls_flight-carrid };{ ls_flight-connid };{ ls_flight-fldate };{ ls_flight-seatsocc }\r\n|.
ENDLOOP.

DATA lt_solix TYPE solix_tab.
DATA lv_size  TYPE so_obj_len.
TRY.
    cl_bcs_convert=>string_to_solix(
      EXPORTING iv_string   = lv_csv
                iv_codepage = '4110'          " UTF-8
                iv_add_bom  = abap_true       " permette a Excel di riconoscere UTF-8
      IMPORTING et_solix    = lt_solix
                ev_size     = lv_size ).

    lo_document->add_attachment( i_attachment_type    = 'CSV'
                                 i_attachment_subject = 'voli_lh.csv'
                                 i_attachment_size    = lv_size
                                 i_att_content_hex    = lt_solix ).
  CATCH cx_bcs INTO DATA(lx_att).
    WRITE / lx_att->get_text( ).
ENDTRY.
```

Aggiungi l'allegato prima di `send( )`. Per un PDF generato da un modulo di stampa, passi l'`XSTRING` del PDF a `cl_bcs_convert=>xstring_to_solix( )` e usi il tipo `PDF`.

## Monitorare in SOST e SCOT

- `SOST` elenca tutte le richieste di invio con il loro stato: in attesa, inviata o in errore. Puoi visualizzare il messaggio, leggere l'errore e inviarlo di nuovo.
- `SCOT` è la configurazione di SAPconnect (nodo SMTP, tipi di indirizzo, job di invio). Di solito è compito del team basis.

Nei sistemi di sviluppo e di test SAPconnect spesso è configurato per non inviare affatto posta all'esterno, quindi un messaggio può restare "in attesa" in `SOST` per sempre. È normale: controlla `SOST` invece della tua casella di posta.

> [!CAUTION]
> Un sistema di test copiato dalla produzione contiene indirizzi veri dei clienti. Non inviare mai mail da un test a indirizzi letti dal database, a meno che SAPconnect non sia configurato per bloccarle o reindirizzarle.

## La nuova API

Su SAP BTP ABAP Environment e nei rilasci recenti di SAP S/4HANA, la classe rilasciata `CL_BCS_MAIL_MESSAGE` sostituisce `CL_BCS` con un'API più breve: `create_instance( )`, `set_sender( )`, `add_recipient( )`, `set_subject( )`, `set_main( )` con una `CL_BCS_MAIL_TEXTPART`, `add_attachment( )` e `send( )`. Usala nel codice ABAP Cloud, dove `CL_BCS` non è rilasciata.

## Esercizio

> [!IMPORTANT]
> Scrivi un report che ti invia una mail HTML (tipo `HTM`) con il numero di voli per compagnia in una tabella, e gli stessi dati come allegato CSV. Trova la richiesta in `SOST`.

### Soluzione

```abap
REPORT zflight_mail.

START-OF-SELECTION.
  SELECT carrid, COUNT(*) AS flights FROM sflight
    GROUP BY carrid ORDER BY carrid
    INTO TABLE @DATA(lt_count).

  DATA(lv_html) = `<table><tr><th>Compagnia</th><th>Voli</th></tr>`.
  DATA(lv_csv)  = |CARRID;FLIGHTS\r\n|.
  LOOP AT lt_count INTO DATA(ls_count).
    lv_html = lv_html && |<tr><td>{ ls_count-carrid }</td><td>{ ls_count-flights }</td></tr>|.
    lv_csv  = lv_csv && |{ ls_count-carrid };{ ls_count-flights }\r\n|.
  ENDLOOP.
  lv_html = lv_html && `</table>`.

  TRY.
      DATA(lo_request)  = cl_bcs=>create_persistent( ).
      DATA(lo_document) = cl_document_bcs=>create_document(
                            i_type    = 'HTM'
                            i_text    = cl_document_bcs=>string_to_soli( lv_html )
                            i_subject = 'Voli per compagnia' ).

      DATA lt_solix TYPE solix_tab.
      DATA lv_size  TYPE so_obj_len.
      cl_bcs_convert=>string_to_solix( EXPORTING iv_string   = lv_csv
                                                 iv_codepage = '4110'
                                                 iv_add_bom  = abap_true
                                       IMPORTING et_solix    = lt_solix
                                                 ev_size     = lv_size ).
      lo_document->add_attachment( i_attachment_type    = 'CSV'
                                   i_attachment_subject = 'voli.csv'
                                   i_attachment_size    = lv_size
                                   i_att_content_hex    = lt_solix ).

      lo_request->set_document( lo_document ).
      lo_request->add_recipient( cl_sapuser_bcs=>create( sy-uname ) ).
      lo_request->set_send_immediately( abap_true ).
      lo_request->send( ).
      COMMIT WORK.
      WRITE / 'Mail in coda: vedi SOST'.
    CATCH cx_bcs INTO DATA(lx_bcs).
      WRITE / lx_bcs->get_text( ).
  ENDTRY.
```

L'utente SAP destinatario riceve la mail nella casella SAP (`SBWP`), e anche all'indirizzo email della sua anagrafica utente se SAPconnect è configurato per farlo.

> [!NOTE]
>
> - `CL_BCS` è la richiesta di invio, `CL_DOCUMENT_BCS` il documento, `CL_CAM_ADDRESS_BCS` e `CL_SAPUSER_BCS` gli indirizzi.
> - Senza `COMMIT WORK` non parte niente; non fare commit dentro la LUW di qualcun altro.
> - Gli allegati sono tabelle `SOLIX_TAB`: converti con `CL_BCS_CONVERT`.
> - Controlla lo stato in `SOST`; la configurazione SMTP è in `SCOT`.
> - In ABAP Cloud usa `CL_BCS_MAIL_MESSAGE`.
