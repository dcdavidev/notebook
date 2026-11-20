---
title: Sending email
description: Send messages and attachments with CL_BCS and SOST.
---

_Intermediate level_

Reports often end with "and mail the result to the team". In classic ABAP you do it with **Business Communication Services (BCS)**, a set of classes around `CL_BCS`. You build a document, add recipients, and send. SAP puts the message in a queue, and the SAPconnect send process delivers it through an SMTP server.

## The building blocks

| Class                | Role                                                         |
| -------------------- | ------------------------------------------------------------ |
| `CL_BCS`             | the send request: holds the document, sender, and recipients |
| `CL_DOCUMENT_BCS`    | the document: subject, body, and attachments                 |
| `CL_CAM_ADDRESS_BCS` | an internet address (`create_internet_address`)              |
| `CL_SAPUSER_BCS`     | an SAP user, as sender or recipient                          |
| `CL_BCS_CONVERT`     | helpers to convert strings to the binary tables BCS expects  |

All these classes raise exceptions of `CX_BCS` (and subclasses such as `CX_SEND_REQ_BCS`, `CX_DOCUMENT_BCS`, `CX_ADDRESS_BCS`).

> [!TIP]
> BCS works like the post office. `CL_DOCUMENT_BCS` is the letter, `CL_BCS` is the envelope with the addresses, `send( )` drops it in the mailbox, and `COMMIT WORK` is the moment the postman picks it up.

## Send a simple message

```abap
TRY.
    DATA(lo_request) = cl_bcs=>create_persistent( ).

    DATA(lt_body) = VALUE soli_tab( ( line = 'Hello,' )
                                    ( line = 'the nightly flight report has finished.' ) ).

    DATA(lo_document) = cl_document_bcs=>create_document(
                          i_type    = 'RAW'                 " plain text; 'HTM' for HTML
                          i_text    = lt_body
                          i_subject = 'Flight report' ).    " max. 50 characters
    lo_request->set_document( lo_document ).

    lo_request->set_sender( cl_cam_address_bcs=>create_internet_address( 'noreply@example.com' ) ).
    lo_request->add_recipient( i_recipient = cl_cam_address_bcs=>create_internet_address( 'team@example.com' )
                               i_express   = abap_true ).

    lo_request->set_send_immediately( abap_true ).
    IF lo_request->send( ) = abap_true.
      COMMIT WORK.                                   " nothing leaves without the commit
    ENDIF.

  CATCH cx_bcs INTO DATA(lx_bcs).
    WRITE / lx_bcs->get_text( ).
ENDTRY.
```

- `create_persistent( )` stores the request in the database. Without `COMMIT WORK` it's never sent.
- `set_send_immediately( abap_true )` asks SAPconnect to send it at once; otherwise it waits for the next scheduled send job.
- `add_recipient` takes options such as `i_copy` (CC) and `i_blind_copy` (BCC).
- To use the current user as sender, pass `cl_sapuser_bcs=>create( sy-uname )`.

> [!WARNING]
> Don't call `COMMIT WORK` yourself when the code runs inside someone else's LUW, such as a BAdI or an [update function module](./0113-update-task.en.md). The mail is sent with the caller's commit; a commit of your own would also commit the caller's half-finished data.

## Add an attachment

Attachments are binary tables (`SOLIX_TAB`). `CL_BCS_CONVERT` turns a string into one:

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
                iv_add_bom  = abap_true       " lets Excel detect UTF-8
      IMPORTING et_solix    = lt_solix
                ev_size     = lv_size ).

    lo_document->add_attachment( i_attachment_type    = 'CSV'
                                 i_attachment_subject = 'flights_lh.csv'
                                 i_attachment_size    = lv_size
                                 i_att_content_hex    = lt_solix ).
  CATCH cx_bcs INTO DATA(lx_att).
    WRITE / lx_att->get_text( ).
ENDTRY.
```

Add the attachment before `send( )`. For a PDF from a form, you pass the PDF `XSTRING` through `cl_bcs_convert=>xstring_to_solix( )` and use type `PDF`.

## Monitor in SOST and SCOT

- `SOST` lists every send request with its status: waiting, sent, or error. You can display the message, read the error, and resend it.
- `SCOT` is the SAPconnect configuration (SMTP node, address types, send jobs). Basis usually owns it.

In development and test systems, SAPconnect is often configured not to send outside mail at all, so a message can stay "waiting" in `SOST` forever. That's normal: check `SOST` instead of your inbox.

> [!CAUTION]
> A test system with a production copy contains real customer addresses. Never send mails from a test run to addresses read from the database unless SAPconnect is set up to block or redirect them.

## The newer API

On SAP BTP ABAP Environment and recent SAP S/4HANA releases, the released class `CL_BCS_MAIL_MESSAGE` replaces `CL_BCS` with a shorter API: `create_instance( )`, `set_sender( )`, `add_recipient( )`, `set_subject( )`, `set_main( )` with a `CL_BCS_MAIL_TEXTPART`, `add_attachment( )`, and `send( )`. Use it in ABAP Cloud code, where `CL_BCS` isn't released.

## Exercise

> [!IMPORTANT]
> Write a report that sends you an HTML mail (type `HTM`) with the number of flights per airline in a table, and the same data as a CSV attachment. Find the request in `SOST`.

### Solution

```abap
REPORT zflight_mail.

START-OF-SELECTION.
  SELECT carrid, COUNT(*) AS flights FROM sflight
    GROUP BY carrid ORDER BY carrid
    INTO TABLE @DATA(lt_count).

  DATA(lv_html) = `<table><tr><th>Airline</th><th>Flights</th></tr>`.
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
                            i_subject = 'Flights per airline' ).

      DATA lt_solix TYPE solix_tab.
      DATA lv_size  TYPE so_obj_len.
      cl_bcs_convert=>string_to_solix( EXPORTING iv_string   = lv_csv
                                                 iv_codepage = '4110'
                                                 iv_add_bom  = abap_true
                                       IMPORTING et_solix    = lt_solix
                                                 ev_size     = lv_size ).
      lo_document->add_attachment( i_attachment_type    = 'CSV'
                                   i_attachment_subject = 'flights.csv'
                                   i_attachment_size    = lv_size
                                   i_att_content_hex    = lt_solix ).

      lo_request->set_document( lo_document ).
      lo_request->add_recipient( cl_sapuser_bcs=>create( sy-uname ) ).
      lo_request->set_send_immediately( abap_true ).
      lo_request->send( ).
      COMMIT WORK.
      WRITE / 'Mail queued: see SOST'.
    CATCH cx_bcs INTO DATA(lx_bcs).
      WRITE / lx_bcs->get_text( ).
  ENDTRY.
```

The SAP user recipient gets the mail in the SAP inbox (`SBWP`), and also at the email address of the user master record if SAPconnect is set up for it.

> [!NOTE]
>
> - `CL_BCS` is the send request, `CL_DOCUMENT_BCS` the document, `CL_CAM_ADDRESS_BCS` and `CL_SAPUSER_BCS` the addresses.
> - Nothing is sent without `COMMIT WORK`; don't commit inside someone else's LUW.
> - Attachments are `SOLIX_TAB` tables: convert with `CL_BCS_CONVERT`.
> - Check the status in `SOST`; the SMTP setup lives in `SCOT`.
> - In ABAP Cloud, use `CL_BCS_MAIL_MESSAGE`.
