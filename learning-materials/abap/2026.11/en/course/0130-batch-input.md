---
title: Batch input
description: Fill transactions automatically with BDC and SHDB.
---

_Pro level_

**Batch input** (also called **BDC**, batch data communication) runs a dialog transaction as if a user were typing: it fills the fields screen by screen and presses the buttons. The transaction runs all its normal checks, so the data that ends up in the database is as consistent as if someone had entered it by hand.

It's an old technique, and fragile, but you'll still meet it in data migrations and in legacy interfaces. Use it only when there's no [BAPI](./0071-bapis.md) or released API for the job.

## Record a transaction with SHDB

You don't guess screen and field names: you record them. In transaction `SHDB` (the transaction recorder):

1. Choose **New recording**, give it a name, and enter the transaction code.
2. Run the transaction normally: type the values and press the buttons you'd press.
3. Save. The recorder shows every screen with its program, screen number, fields, and function codes.

From the recording you can generate a sample program or a function module. Recorded fields and screens are the raw material for the internal table that drives batch input.

> [!TIP]
> SHDB is like recording a macro in a spreadsheet: you do the job once by hand, and the recorder writes down every keystroke so a program can replay it with other values.

## The `BDCDATA` table

Batch input is driven by an internal table of type `BDCDATA`. Each row is either the start of a screen or a field value:

| Field      | Screen row       | Field row                               |
| ---------- | ---------------- | --------------------------------------- |
| `PROGRAM`  | module pool name | empty                                   |
| `DYNPRO`   | screen number    | empty                                   |
| `DYNBEGIN` | `X`              | empty                                   |
| `FNAM`     | empty            | field name, for example `SFLIGHT-PRICE` |
| `FVAL`     | empty            | value, in external format               |

The function code to press goes into the special field `BDC_OKCODE`, and the cursor position into `BDC_CURSOR`. Two small helper methods keep the code readable.

The example below changes the price of a flight through a custom dialog transaction `ZFLIGHT_EDIT` (program `SAPMZFLIGHT`), like the one you can build with the [Dynpro lessons](./0101-dynpro-basics.md): screen 100 asks for the flight key, screen 200 shows the details. With a standard transaction, the names come from your SHDB recording.

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
> `FVAL` is what the user would type, so dates, numbers, and amounts must be in the **user's external format** (decimal separator and date format from the user settings). Use string templates such as `|{ lv_date DATE = USER }|` and `|{ lv_price NUMBER = USER }|` instead of hard-coded formats.

## Run it with CALL TRANSACTION

The fastest way to run the table is `CALL TRANSACTION ... USING`. You choose the display mode and collect the messages the transaction sends:

```abap
  DATA lt_messages TYPE STANDARD TABLE OF bdcmsgcoll WITH EMPTY KEY.
  DATA(ls_options) = VALUE ctu_params( dismode = 'N'     " no screens
                                       updmode = 'S'     " synchronous update
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

| `DISMODE` | What you see                                    |
| --------- | ----------------------------------------------- |
| `A`       | every screen (good for testing)                 |
| `E`       | only the screens where an error occurs          |
| `N`       | nothing: the transaction runs in the background |

Use update mode `S` when the next step needs the data already saved; `A` (asynchronous) is faster but returns before the update finishes.

## Run it as a session in SM35

For large loads, you can store the data in a **batch input session** instead and process it later in transaction `SM35`. The session keeps every transaction, and the errors, so a user can correct and reprocess them.

```abap
CALL FUNCTION 'BDC_OPEN_GROUP'
  EXPORTING
    client = sy-mandt
    group  = 'ZFLIGHTS'
    user   = sy-uname
    keep   = abap_true.     " keep the session after processing

" once per transaction to record
CALL FUNCTION 'BDC_INSERT'
  EXPORTING
    tcode     = 'ZFLIGHT_EDIT'
  TABLES
    dynprotab = lo_bdc->mt_bdc.

CALL FUNCTION 'BDC_CLOSE_GROUP'.
```

The program `RSBDCSUB` processes sessions in a background job. Batch input breaks when a screen layout changes, and it doesn't work with controls such as ALV grids or tree controls. For migrations into S/4HANA, use the Migration Cockpit instead.

## Exercise

> [!IMPORTANT]
>
> 1. Record a simple change transaction in `SHDB` on your system and look at the screens and fields it lists.
> 2. Write a report that builds the `BDCDATA` table from the recording and runs it with `CALL TRANSACTION` in mode `A`, then in mode `N`.
> 3. Print every message of type `E` or `A` that comes back.

### Solution

Use the `lcl_bdc` helper class with the program, screen numbers, and fields from your recording, and the `CALL TRANSACTION` block above. In mode `N`, `sy-subrc` is not `0` when the transaction stops with an error, and `lt_messages` tells you why.

> [!NOTE]
>
> - Batch input replays a dialog transaction screen by screen, with all its checks.
> - Record the screens and fields with `SHDB`; the program fills a `BDCDATA` table with screen rows and field rows.
> - `BDC_OKCODE` holds the function code; values must be in the user's external format.
> - `CALL TRANSACTION ... USING ... OPTIONS FROM ... MESSAGES INTO` runs it immediately; `BDC_OPEN_GROUP`, `BDC_INSERT`, and `BDC_CLOSE_GROUP` create a session for `SM35`.
> - Prefer a BAPI or a released API: batch input breaks when screens change.
