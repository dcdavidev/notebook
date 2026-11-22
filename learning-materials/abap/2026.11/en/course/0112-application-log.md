---
title: The application log
description: Collect and show messages with the BAL function modules and SLG1.
---

_Intermediate level_

A [message](./0061-messages.md) shown on the screen is gone as soon as the user presses Enter, and a background job has no screen at all. When a program processes many records, you need to collect all its messages, save them, and let someone read them later. The **application log** (also called BAL, Business Application Log) does exactly that.

Standard SAP uses it everywhere: mass changes, interfaces, data migration. Users and support read the logs in transaction `SLG1`.

## Log objects and subobjects

Every log belongs to a **log object** and, optionally, a **subobject**. They classify the logs, so `SLG1` can find them. You define them in transaction `SLG0`:

```text
SLG0 > New entries
  Object: ZFLIGHT     Text: Custom flight applications
Select ZFLIGHT > Subobjects > New entries
  Subobject: CHECK    Text: Overbooking check
```

A log also has a header with an **external ID**, a free text up to 100 characters such as a file name or a document number, and an **expiry date** after which it can be deleted.

> [!TIP]
> The application log is the logbook of a ship. The crew writes down every event as it happens, with its importance; the logbook goes into the archive at the end of the voyage, and anyone can read it later to find out what happened.

## Writing a log

Writing a log takes four steps: create it, add messages, save it, and, if a user is waiting, display it.

```abap
REPORT zflight_overbooking.

DATA gv_log_handle TYPE balloghndl.

START-OF-SELECTION.
  " 1. Create the log in memory
  DATA(ls_log) = VALUE bal_s_log(
    object     = 'ZFLIGHT'
    subobject  = 'CHECK'
    extnumber  = |Overbooking check { sy-datum DATE = USER }|
    aldate_del = sy-datum + 30 ).          " can be deleted after 30 days

  CALL FUNCTION 'BAL_LOG_CREATE'
    EXPORTING
      i_s_log      = ls_log
    IMPORTING
      e_log_handle = gv_log_handle
    EXCEPTIONS
      OTHERS       = 1.

  " 2. Add messages
  SELECT FROM sflight
    FIELDS carrid, connid, fldate
    WHERE seatsocc > sflight~seatsmax            " overbooked flights only
    INTO TABLE @DATA(lt_flights).

  LOOP AT lt_flights INTO DATA(ls_flight).
    " The message fills sy-msgid, sy-msgno, sy-msgv1... without showing anything
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
      probclass = '1' ).                   " 1 = very important

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
      i_text       = |{ lines( lt_flights ) } overbooked flights found|
    EXCEPTIONS
      OTHERS       = 1.
```

`MESSAGE ... INTO` is the recommended way to fill a log message: the message is defined in a message class, so it can be translated, and the where-used list of the message finds this line. Free texts are quicker to write but can't be translated: use them only for technical details.

The **problem class** (`probclass`) sets the importance, from `1` (very important) to `4` (additional information). `SLG1` can filter on it.

## Saving and displaying

```abap
  " 3. Save to the database
  CALL FUNCTION 'BAL_DB_SAVE'
    EXPORTING
      i_t_log_handle = VALUE bal_t_logh( ( gv_log_handle ) )
    EXCEPTIONS
      OTHERS         = 1.
  COMMIT WORK.

  " 4. Show it to the user, only in dialog
  IF sy-batch = abap_false.
    CALL FUNCTION 'BAL_DSP_LOG_DISPLAY'
      EXPORTING
        i_t_log_handle = VALUE bal_t_logh( ( gv_log_handle ) )
      EXCEPTIONS
        OTHERS         = 1.
  ENDIF.
```

`BAL_DB_SAVE` writes the log to the database tables, and the [`COMMIT WORK`](./0060-luw-commit-and-rollback.md) makes it permanent. Until you save it, the log exists only in the memory of your program. To show the log in a popup instead of a full screen, get a display profile with `BAL_DSP_PROFILE_POPUP_GET` and pass it in `i_s_display_profile`.

> [!WARNING]
> If your program rolls back its changes after an error, a log saved in the same LUW is rolled back too, and the error is lost. Save the log in a separate LUW, or call `BAL_DB_SAVE` with `i_2th_connection = abap_true` and `i_2th_connect_commit = abap_true`, which commit it on a second database connection.

## Reading logs in SLG1

In `SLG1`, enter the object, the subobject, the external ID, a time range, or the user, and run. Each log shows its messages with traffic lights for the message type; a double click on a message shows its long text. Expired logs are deleted with `SLG2`, usually in a periodic job.

In ABAP Cloud the BAL function modules aren't released. Use the classes `CL_BALI_LOG`, `CL_BALI_HEADER_SETTER`, and `CL_BALI_LOG_DB`, with a log object created in ADT. The concepts are the same.

## Exercise

> [!IMPORTANT]
>
> 1. Create the log object `ZFLIGHT` with the subobject `CHECK` in `SLG0`, and the message `010` "Flight &1 &2 on &3 is overbooked" in the message class `ZFLIGHT`.
> 2. Run the report `ZFLIGHT_OVERBOOKING` from the lesson, once in dialog and once in the background.
> 3. Find both logs in `SLG1` with the external ID.

### Solution

The report is the one in the lesson. In the background run, `BAL_DSP_LOG_DISPLAY` is skipped because `sy-batch` is set, but the log is saved all the same, and `SLG1` shows both runs under the object `ZFLIGHT`, subobject `CHECK`.

> [!NOTE]
>
> - The application log collects messages, saves them, and shows them later in `SLG1`.
> - Define log objects and subobjects in `SLG0`; each log has an external ID and an expiry date.
> - The steps are `BAL_LOG_CREATE`, `BAL_LOG_MSG_ADD`, `BAL_DB_SAVE` with `COMMIT WORK`, and `BAL_DSP_LOG_DISPLAY`.
> - Fill messages with `MESSAGE ... INTO` so they're translatable and traceable.
> - Show the log only in dialog; in ABAP Cloud, use the `CL_BALI_*` classes.
