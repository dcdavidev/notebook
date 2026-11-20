---
title: 'Complete reports: selection, events, messages, files'
description: Everything you need to build a real SAP report.
---

_Week 2 · Intermediate level · 4 hours_

### Today's schedule

| Block  | Content                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------- |
| Hour 1 | Selection screen: `PARAMETERS`, `SELECT-OPTIONS`, ranges, blocks, checkboxes, radio buttons     |
| Hour 2 | Report and selection events; validations; variants; text elements                               |
| Hour 3 | Messages (SE91, types), authorizations (`AUTHORITY-CHECK`), creating a transaction              |
| Hour 4 | Files: `GUI_UPLOAD`/`GUI_DOWNLOAD`, `OPEN DATASET` (server), background jobs, interactive lists |

## Hour 1 – The selection screen

Almost every report starts with a **selection screen**: the window where the user enters the filters before running it. In classic ABAP you don't draw it: you declare it with a few statements, and SAP generates it on its own.

> [!TIP]
> The selection screen is like the form you fill in at the library to request a book: author, year, subject. The librarian (the program) goes to the archive (the database) and looks only for what you asked for.

### PARAMETERS: a single value

```abap
REPORT zflights_report.

PARAMETERS p_carr  TYPE s_carr_id OBLIGATORY.          " mandatory
PARAMETERS p_date  TYPE d DEFAULT sy-datum.            " proposed value
PARAMETERS p_max   TYPE i DEFAULT 100.
PARAMETERS p_city  TYPE s_from_cit LOWER CASE.         " accepts lowercase
PARAMETERS p_det   AS CHECKBOX DEFAULT 'X'.            " checkbox
PARAMETERS: p_list RADIOBUTTON GROUP grp1 DEFAULT 'X', " radio buttons
            p_alv  RADIOBUTTON GROUP grp1.
PARAMETERS p_file  TYPE string LOWER CASE.
PARAMETERS p_bukrs TYPE bukrs MEMORY ID buk.           " proposes the value from SAP memory
PARAMETERS p_mat   TYPE matnr MATCHCODE OBJECT mat1.   " specific search help
PARAMETERS p_lbox  TYPE c LENGTH 1 AS LISTBOX VISIBLE LENGTH 20. " drop-down list
```

A parameter name can be at most **8 characters** long. A type taken from the ABAP Dictionary brings its label, F1, and F4 along with it.

### SELECT-OPTIONS: ranges and lists of values

`SELECT-OPTIONS` creates two "from... to..." fields plus a button for multiple selection: the user can enter single values, intervals, exclusions, and patterns.

```abap
DATA gv_carrid TYPE s_carr_id.                  " you need a reference field

SELECT-OPTIONS s_carr FOR gv_carrid.
SELECT-OPTIONS s_date FOR sy-datum NO-EXTENSION. " no multiple selection
SELECT-OPTIONS s_conn FOR gv_carrid NO INTERVALS. " single values only
```

A `SELECT-OPTION` is actually an **internal table** (a "range") with 4 columns:

| Column   | Meaning                         | Values                                                                         |
| -------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `SIGN`   | include or exclude              | `I` (include), `E` (exclude)                                                   |
| `OPTION` | operator                        | `EQ`, `NE`, `BT` (between), `NB`, `GT`, `GE`, `LT`, `LE`, `CP` (pattern), `NP` |
| `LOW`    | "from" value                    |                                                                                |
| `HIGH`   | "to" value (only for `BT`/`NB`) |                                                                                |

You use it directly in queries with `IN`:

```abap
SELECT * FROM sflight
  WHERE carrid IN @s_carr AND fldate IN @s_date
  INTO TABLE @DATA(lt_flights).
```

> [!WARNING]
> If the `SELECT-OPTION` is empty, `IN` is **always true**: every record is read. That's intended (no filter = everything), but be careful with huge tables.

### Ranges built in code

```abap
DATA lr_city TYPE RANGE OF s_from_cit.
lr_city = VALUE #( sign = 'I' option = 'EQ' ( low = 'ROME' ) ( low = 'FRANKFURT' ) ).
APPEND VALUE #( sign = 'I' option = 'CP' low = 'NEW*' ) TO lr_city.

SELECT * FROM spfli WHERE cityfrom IN @lr_city INTO TABLE @DATA(lt_spfli).

IF 'ROME' IN lr_city.               " you can use it in IFs too
ENDIF.
```

### Organize the screen

```abap
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.   " frame with a title
  PARAMETERS p_carr2 TYPE s_carr_id.
  SELECT-OPTIONS s_fld FOR sy-datum.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE TEXT-002.
  SELECTION-SCREEN BEGIN OF LINE.                               " several elements on the same line
    SELECTION-SCREEN COMMENT 1(20) TEXT-003.
    PARAMETERS p_x AS CHECKBOX USER-COMMAND chk.                " USER-COMMAND: reacts to the click
  SELECTION-SCREEN END OF LINE.
SELECTION-SCREEN END OF BLOCK b2.

SELECTION-SCREEN SKIP 1.
SELECTION-SCREEN ULINE.
SELECTION-SCREEN PUSHBUTTON /1(20) TEXT-004 USER-COMMAND push.

* Tabs (tabstrip) and additional screens
SELECTION-SCREEN BEGIN OF SCREEN 1100 AS SUBSCREEN.
  PARAMETERS p_a TYPE c LENGTH 10.
SELECTION-SCREEN END OF SCREEN 1100.
```

### Text elements

Every program has three kinds of texts (menu Goto → Text Elements), translatable into every language (transaction SE63):

| Type               | What it is for                         | Usage                                             |
| ------------------ | -------------------------------------- | ------------------------------------------------- |
| Text symbols       | texts used in the code                 | `TEXT-001` or `'Default text'(001)`               |
| Selection texts    | labels of the parameters on the screen | tick "Dictionary reference" to use the DDIC label |
| Titles and headers | program title and list headers         |                                                   |

> [!WARNING]
> Don't write user-visible texts directly in the code (`'Error!'`): use text symbols or message classes, so the program can be translated.

## Hour 2 – Report events

A classic report is **event-driven**: SAP calls your blocks in a precise order.

| Event                                            | When it runs                                | Typical use                                    |
| ------------------------------------------------ | ------------------------------------------- | ---------------------------------------------- |
| `LOAD-OF-PROGRAM`                                | when the program is loaded                  | very rare                                      |
| `INITIALIZATION`                                 | before the selection screen is shown        | propose calculated default values              |
| `AT SELECTION-SCREEN OUTPUT`                     | every time before the screen is shown (PBO) | hide/disable fields dynamically                |
| `AT SELECTION-SCREEN ON field`                   | after input, for one field                  | validate a field                               |
| `AT SELECTION-SCREEN ON VALUE-REQUEST FOR field` | when the user presses F4                    | custom search help                             |
| `AT SELECTION-SCREEN ON HELP-REQUEST FOR field`  | when the user presses F1                    | custom help                                    |
| `AT SELECTION-SCREEN`                            | after input, for the whole screen (PAI)     | cross-field validations                        |
| `START-OF-SELECTION`                             | after F8                                    | reading and processing the data                |
| `END-OF-SELECTION`                               | after `START-OF-SELECTION`                  | output (historical, tied to logical databases) |
| `TOP-OF-PAGE`                                    | at the start of every list page             | headers                                        |
| `END-OF-PAGE`                                    | at the end of every page                    | footers                                        |
| `AT LINE-SELECTION`                              | double-click on a list line                 | interactive lists                              |
| `AT USER-COMMAND`                                | button pressed on the list                  | interactive lists                              |

> [!TIP]
> Events are like the stages of a dinner at a restaurant: the welcome (`INITIALIZATION`), the waiter gives you the menu (`OUTPUT`), checks that the dish you ordered exists (`AT SELECTION-SCREEN`), the kitchen cooks (`START-OF-SELECTION`), the dish arrives at the table (output). You write what to do at each stage; the restaurant decides the order.

### A complete report

```abap
REPORT zflights_complete.

DATA gv_carrid TYPE s_carr_id.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  SELECT-OPTIONS s_carr FOR gv_carrid.
  PARAMETERS p_from TYPE d.
  PARAMETERS p_to   TYPE d.
  PARAMETERS p_full AS CHECKBOX USER-COMMAND ful.
  PARAMETERS p_min  TYPE i MODIF ID min.
SELECTION-SCREEN END OF BLOCK b1.

INITIALIZATION.
  p_from = sy-datum - 30.
  p_to   = sy-datum + 365.

AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN.
    IF screen-group1 = 'MIN'.
      screen-active = COND #( WHEN p_full = abap_true THEN '0' ELSE '1' ).
      MODIFY SCREEN.
    ENDIF.
  ENDLOOP.

AT SELECTION-SCREEN.
  IF p_from > p_to.
    MESSAGE 'The start date is after the end date' TYPE 'E'.
  ENDIF.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid IN @s_carr
      AND fldate BETWEEN @p_from AND @p_to
    ORDER BY carrid, connid, fldate
    INTO TABLE @DATA(gt_flights).

  IF gt_flights IS INITIAL.
    MESSAGE 'No flights found' TYPE 'S' DISPLAY LIKE 'W'.
    RETURN.
  ENDIF.

  LOOP AT gt_flights INTO DATA(gs_flight).
    IF p_full = abap_true AND gs_flight-seatsocc < gs_flight-seatsmax.
      CONTINUE.
    ENDIF.
    IF p_full = abap_false AND gs_flight-seatsmax - gs_flight-seatsocc < p_min.
      CONTINUE.
    ENDIF.
    WRITE: / gs_flight-carrid, gs_flight-connid, gs_flight-fldate,
             gs_flight-seatsocc, '/', gs_flight-seatsmax.
  ENDLOOP.

TOP-OF-PAGE.
  WRITE: / 'Flight list', sy-datum.
  ULINE.
```

`MODIF ID` assigns a group to fields, so you can hide or show them together with `LOOP AT SCREEN`. Fields of `screen`: `active`, `input` (0 = read-only), `invisible`, `required`, `intensified`.

### Variants

A **variant** saves the selection screen values under a name so you can reuse them (the "Save" button on the screen). They are essential for background jobs. You can create protected variants and variants with dynamic values (for example "today - 1" through selection variables, table TVARVC).

## Hour 3 – Messages, authorizations, transactions

### Messages

Messages tell the user about information or errors. You define them in a **message class** (SE91), for example `ZCOURSE`, with numbers from 000 to 999 and placeholders `&1 &2 &3 &4`:

| No. | Text                              |
| --- | --------------------------------- |
| 001 | Flight &1 &2 not found            |
| 002 | &1 flights processed successfully |
| 003 | Date &1 is not valid              |

```abap
MESSAGE e001(zcourse) WITH lv_carrid lv_connid.       " error with class and number
MESSAGE s002(zcourse) WITH lines( lt_flights ).       " success
MESSAGE ID 'ZCOURSE' TYPE 'I' NUMBER '003' WITH lv_date.
MESSAGE 'Direct text' TYPE 'I'.                       " not recommended (can't be translated)
MESSAGE TEXT-005 TYPE 'W'.

* Put the text in a variable instead of showing it
MESSAGE e001(zcourse) WITH lv_carrid lv_connid INTO DATA(lv_text).
```

Message types and how they behave:

| Type | Name        | Where it appears                 | What happens                                                                                         |
| ---- | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `S`  | Success     | status bar at the bottom (green) | the program continues                                                                                |
| `I`  | Information | popup                            | continues after the user presses Enter                                                               |
| `W`  | Warning     | status bar (yellow)              | on the selection screen: the user can correct or press Enter to continue                             |
| `E`  | Error       | status bar (red)                 | on the selection screen: blocks and requires a correction. In `START-OF-SELECTION`: ends the program |
| `A`  | Abort       | popup                            | the program ends                                                                                     |
| `X`  | Exit        | dump                             | `MESSAGE_TYPE_X` dump (for "impossible" errors)                                                      |

> [!TIP]
> Message types are like road signs: S is "welcome" (just informs), W is "caution, dangerous bend" (you can carry on), E is "road closed" (you must turn back), A is "end of the road": the journey is over.

> [!WARNING]
> How messages behave depends on the context (event, screen, background, method). A type E message inside a method or in an FM called through RFC behaves differently. In modern code, inside classes, you prefer **exceptions** (day 11) and show messages only at the user interface level.

### Authorizations: AUTHORITY-CHECK

SAP controls access with **authorization objects** (SU21). Each object has fields (for example company code, activity). User roles (PFCG) hold the authorizations. **Your code must check them**: SAP doesn't do it for you for data read in a report.

```abap
AUTHORITY-CHECK OBJECT 'S_CARRID'
  ID 'CARRID' FIELD p_carr
  ID 'ACTVT'  FIELD '03'.     " 01 = create, 02 = change, 03 = display, 06 = delete

IF sy-subrc <> 0.
  MESSAGE e004(zcourse) WITH p_carr.   " "No authorization for airline &1"
ENDIF.
```

- **SU53**: shows the user's last failed authorization check (useful for support).
- **ST01** / **STAUTHTRACE**: authorization trace.
- You can create Z authorization objects in SU21 to protect your own functions.

> [!TIP]
> An authorization object is your company badge: the door (`AUTHORITY-CHECK`) checks whether your badge opens that department (field) for that activity (enter, change, just look).

### Create a transaction (SE93)

To give users a handy code such as `ZFLIGHTS`:

1. SE93 → code `ZFLIGHTS` → Create.
2. Type: _Program and selection screen_ (report transaction).
3. Program: `ZFLIGHTS_COMPLETE`, screen 1000.
4. Tick the GUI options (SAP GUI for Windows/HTML/Java).
5. Enter an authorization object if needed (for example, `S_TCODE` is checked automatically).

Other types: dialog transaction (module pool, day 9), OO transaction (class method), variant transaction, parameter transaction (for example SM30 on a specific table).

## Hour 4 – Files, background jobs, interactive lists

### Files on the user's PC (frontend)

```abap
PARAMETERS p_file TYPE string LOWER CASE.

AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_file.
  DATA lt_files TYPE filetable.
  DATA lv_rc    TYPE i.
  cl_gui_frontend_services=>file_open_dialog(
    EXPORTING file_filter = '*.csv'
    CHANGING  file_table  = lt_files
              rc          = lv_rc ).
  IF lt_files IS NOT INITIAL.
    p_file = lt_files[ 1 ]-filename.
  ENDIF.

START-OF-SELECTION.
  DATA lt_lines TYPE string_table.
  cl_gui_frontend_services=>gui_upload(
    EXPORTING  filename = p_file
               filetype = 'ASC'
               codepage = '4110'          " UTF-8
    CHANGING   data_tab = lt_lines
    EXCEPTIONS OTHERS   = 1 ).
  IF sy-subrc <> 0.
    MESSAGE 'Error reading the file' TYPE 'E'.
  ENDIF.

  LOOP AT lt_lines INTO DATA(lv_line) FROM 2.   " skip the header
    SPLIT lv_line AT ';' INTO DATA(lv_code) DATA(lv_descr) DATA(lv_price).
    " ... convert and save
  ENDLOOP.

* Write a file
  cl_gui_frontend_services=>gui_download(
    EXPORTING filename = 'C:\temp\export.csv'
              filetype = 'ASC'
    CHANGING  data_tab = lt_lines ).
```

> [!WARNING]
> Files on the PC only work in dialog (with SAP GUI open). In a background job there's no PC connected: use files on the server.

For real Excel (.xlsx) there are open source libraries (abap2xlsx) and, on recent systems, the `XCO_CP_XLSX` class (ABAP Cloud).

### Files on the application server

```abap
DATA(lv_path) = `/usr/sap/trans/tmp/flights.txt`.

* Write
OPEN DATASET lv_path FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
IF sy-subrc = 0.
  LOOP AT gt_flights INTO DATA(ls_f).
    TRANSFER |{ ls_f-carrid };{ ls_f-connid };{ ls_f-fldate }| TO lv_path.
  ENDLOOP.
  CLOSE DATASET lv_path.
ENDIF.

* Read
OPEN DATASET lv_path FOR INPUT IN TEXT MODE ENCODING UTF-8.
DO.
  READ DATASET lv_path INTO DATA(lv_row).
  IF sy-subrc <> 0. EXIT. ENDIF.
  WRITE / lv_row.
ENDDO.
CLOSE DATASET lv_path.

DELETE DATASET lv_path.  " delete
```

Useful transactions: **AL11** (browse the server directories), **CG3Y**/**CG3Z** (download/upload files between server and PC), **FILE** (logical paths, better than fixed paths, read with the FM `FILE_GET_NAME`). Check access with the `S_DATASET` object.

### Background jobs

A report can run in the background, with no user logged on: for long or overnight processing.

- **SM36**: define a job (program + variant + time/frequency).
- **SM37**: monitor jobs (status, log, spool).
- From the selection screen menu: Program → Execute in Background.
- `sy-batch = abap_true` means the program is running in the background.
- The output (`WRITE` or ALV) ends up in the spool (SP01).

```abap
IF sy-batch = abap_true.
  " no popups, no files on the PC, messages go to the job log
ENDIF.
```

From a program you can schedule a job with `JOB_OPEN`, `SUBMIT ... VIA JOB ... NUMBER ... AND RETURN`, `JOB_CLOSE`. Modern systems also have the Application Job framework.

### Interactive lists (classic)

```abap
START-OF-SELECTION.
  SELECT carrid, carrname FROM scarr INTO TABLE @DATA(lt_carr).
  LOOP AT lt_carr INTO DATA(ls_carr).
    WRITE / ls_carr-carrid HOTSPOT ON.   " clickable
    WRITE ls_carr-carrname.
    HIDE ls_carr-carrid.                 " stores the value for the line
  ENDLOOP.

AT LINE-SELECTION.
  " ls_carr-carrid holds the value of the clicked line (thanks to HIDE)
  SELECT connid, cityfrom, cityto FROM spfli
    WHERE carrid = @ls_carr-carrid INTO TABLE @DATA(lt_conn).
  WRITE: / 'Flights of', ls_carr-carrid, '- list level', sy-lsind.
  LOOP AT lt_conn INTO DATA(ls_conn).
    WRITE: / ls_conn-connid, ls_conn-cityfrom, ls_conn-cityto.
  ENDLOOP.
```

`sy-lsind` is the list level (0 = basic list, up to 20 levels). Today `WRITE` lists have been replaced by the ALV (tomorrow), but you'll find them in existing programs.

## Exercises

> [!IMPORTANT]
>
> 1. Create the report `ZES08_FLIGHTS` with a selection block with a title: `SELECT-OPTIONS` for airline and flight date, a mandatory parameter for the maximum number of rows, and two radio buttons "Only flights with free seats" / "All".
> 2. In `INITIALIZATION`, propose the dates from the first to the last day of the current month.
> 3. In `AT SELECTION-SCREEN`, check that the airlines entered exist in `SCARR`; otherwise show an error message from your `ZCOURSE` class.
> 4. Add an `AUTHORITY-CHECK` on `S_CARRID` for every airline read and exclude those that aren't authorized.
> 5. Add an "Export to file" checkbox that, when ticked, shows a field for the path (`MODIF ID`) and downloads the result as CSV.
> 6. Create the transaction `ZES08` and a variant `CURRENT_MONTH`. Run the report in the background and look at the result in SM37 / spool.

## Quiz

1. What is the difference between `PARAMETERS` and `SELECT-OPTIONS`?
2. What are the 4 columns of a range?
3. What happens with `WHERE field IN s_opt` if `s_opt` is empty?
4. In which event do you validate the selection screen data?
5. What happens with a type E message in `AT SELECTION-SCREEN`?
6. Why must you write `AUTHORITY-CHECK` in your reports?
7. Why doesn't `GUI_UPLOAD` work in the background?
8. In which transaction do you monitor jobs?

## Solutions

```abap
REPORT zes08_flights.

DATA gv_carr TYPE s_carr_id.
DATA gv_date TYPE s_date.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  SELECT-OPTIONS: s_carr FOR gv_carr,
                  s_date FOR gv_date.
  PARAMETERS p_max TYPE i OBLIGATORY DEFAULT 200.
  PARAMETERS: p_free RADIOBUTTON GROUP g1 DEFAULT 'X',
              p_all  RADIOBUTTON GROUP g1.
SELECTION-SCREEN END OF BLOCK b1.

INITIALIZATION.
  DATA(lv_first) = sy-datum.
  lv_first+6(2) = '01'.
  DATA(lv_next) = lv_first + 31.
  lv_next+6(2) = '01'.
  s_date[] = VALUE #( ( sign = 'I' option = 'BT' low = lv_first high = lv_next - 1 ) ).

AT SELECTION-SCREEN ON s_carr.
  SELECT carrid FROM scarr WHERE carrid IN @s_carr INTO TABLE @DATA(lt_ok).
  IF lt_ok IS INITIAL.
    MESSAGE e001(zcourse) WITH 'Airline' 'does not exist'.
  ENDIF.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid IN @s_carr AND fldate IN @s_date
    ORDER BY carrid, connid, fldate
    INTO TABLE @DATA(lt_flights) UP TO @p_max ROWS.

  LOOP AT lt_flights INTO DATA(ls_f).
    AUTHORITY-CHECK OBJECT 'S_CARRID' ID 'CARRID' FIELD ls_f-carrid ID 'ACTVT' FIELD '03'.
    CHECK sy-subrc = 0.
    CHECK p_all = abap_true OR ls_f-seatsocc < ls_f-seatsmax.
    WRITE: / ls_f-carrid, ls_f-connid, ls_f-fldate, ls_f-seatsocc, ls_f-seatsmax.
  ENDLOOP.
```

Note: in `INITIALIZATION`, `s_date[]` refers to the range table (`SELECT-OPTIONS` have a header line; `s_date` alone is the line). Adding 31 days to the first of the month always lands in the next month; setting the day back to 01 and subtracting 1 gives the last day of the current month.

Quiz:

1. `PARAMETERS` accepts a single value; `SELECT-OPTIONS` accepts intervals, lists, exclusions, and patterns (it's a range).
2. `SIGN`, `OPTION`, `LOW`, `HIGH`.
3. The condition is always true: no filter.
4. In `AT SELECTION-SCREEN` (or `ON field`).
5. The screen stays open, the message appears in red, and the user must correct the input.
6. Because SAP doesn't automatically check the data your code reads: without a check, anyone who can run the report would see everything.
7. Because in the background there's no SAP GUI and no PC connected.
8. SM37.

> [!NOTE]
> Today you learned: selection screens, ranges, events, validations, variants, text elements, messages, authorizations, transactions, files on the PC and the server, background jobs, and interactive lists. Tomorrow: the ALV and classic screens (Dynpro).
