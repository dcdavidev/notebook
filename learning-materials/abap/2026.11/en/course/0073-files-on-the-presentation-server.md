---
title: Files on the user's PC
description: Upload and download files through SAP GUI.
level: basic
---

Users often want to export data to a file on their PC, or load a list of values from a spreadsheet they prepared. In SAP terms, the user's PC is the **presentation server**: the machine where SAP GUI runs.

ABAP reaches the user's PC only through SAP GUI, with the class `CL_GUI_FRONTEND_SERVICES`. Its static methods open file dialogs, upload files, and download files.

## Choosing a file: the file dialogs

`FILE_OPEN_DIALOG` shows the standard "Open" window of the operating system and returns the files the user selected. Call it in the F4 help of the file parameter, so the user can browse instead of typing the path:

```abap
PARAMETERS p_file TYPE string LOWER CASE OBLIGATORY.

AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_file.
  DATA lt_files  TYPE filetable.
  DATA lv_rc     TYPE i.
  DATA lv_action TYPE i.

  cl_gui_frontend_services=>file_open_dialog(
    EXPORTING
      window_title = 'Select the file to upload'
      file_filter  = 'CSV files (*.csv)|*.csv'
    CHANGING
      file_table   = lt_files
      rc           = lv_rc
      user_action  = lv_action
    EXCEPTIONS
      OTHERS       = 1 ).
  IF sy-subrc = 0 AND lv_action = cl_gui_frontend_services=>action_ok AND lv_rc > 0.
    p_file = lt_files[ 1 ]-filename.
  ENDIF.
```

- `LOWER CASE` keeps the path as typed: without it, the selection screen converts it to uppercase.
- `rc` is the number of files selected; `user_action` tells you whether the user clicked OK or Cancel.
- `FILE_SAVE_DIALOG` works the same way for the "Save as" window and returns `filename`, `path`, and `fullpath`.

The methods of `CL_GUI_FRONTEND_SERVICES` use classic exceptions, like [function modules](./0070-function-modules.md): list them after `EXCEPTIONS`, or at least `OTHERS`, and check `sy-subrc`.

## Uploading a file: GUI_UPLOAD

`GUI_UPLOAD` reads a file from the PC into an internal table. For a text file, use a table of strings: each line of the file becomes one row.

```abap
START-OF-SELECTION.
  DATA lt_lines TYPE string_table.

  cl_gui_frontend_services=>gui_upload(
    EXPORTING
      filename = p_file
      filetype = 'ASC'               " text file
      codepage = '4110'              " UTF-8
    CHANGING
      data_tab = lt_lines
    EXCEPTIONS
      OTHERS   = 1 ).
  IF sy-subrc <> 0.
    MESSAGE 'The file could not be read' TYPE 'S' DISPLAY LIKE 'E'.
    RETURN.
  ENDIF.

  LOOP AT lt_lines INTO DATA(lv_line).
    SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_carrname).
    WRITE: / lv_carrid, lv_carrname.
  ENDLOOP.
```

- `filetype = 'ASC'` reads text, line by line. `'BIN'` reads the bytes unchanged, for images, PDFs, or other binary files (into a table of type `solix_tab`).
- `codepage = '4110'` is UTF-8. Without it, SAP GUI uses the code page of the PC, and accented characters may be read wrong.
- With `has_field_separator = abap_true`, the method can also split tab-separated columns directly into the fields of a structured table.

> [!TIP]
> SAP GUI is the courier between the server and the PC. The server can't walk into the user's office: it hands the package to the courier, who knows the way. If there's no courier, because nobody is logged on in SAP GUI, nothing gets delivered.

## Downloading a file: GUI_DOWNLOAD

`GUI_DOWNLOAD` writes an internal table to a file on the PC. Build the lines first, then let the user choose where to save:

```abap
SELECT carrid, carrname, currcode FROM scarr INTO TABLE @DATA(lt_carriers).

DATA lt_csv TYPE string_table.
APPEND `CARRID;CARRNAME;CURRCODE` TO lt_csv.                 " header line
LOOP AT lt_carriers INTO DATA(ls_carrier).
  APPEND |{ ls_carrier-carrid };{ ls_carrier-carrname };{ ls_carrier-currcode }| TO lt_csv.
ENDLOOP.

DATA lv_name     TYPE string.
DATA lv_path     TYPE string.
DATA lv_fullpath TYPE string.
DATA lv_action   TYPE i.

cl_gui_frontend_services=>file_save_dialog(
  EXPORTING
    default_extension = 'csv'
    default_file_name = 'carriers.csv'
  CHANGING
    filename          = lv_name
    path              = lv_path
    fullpath          = lv_fullpath
    user_action       = lv_action
  EXCEPTIONS
    OTHERS            = 1 ).
IF sy-subrc <> 0 OR lv_action <> cl_gui_frontend_services=>action_ok.
  RETURN.
ENDIF.

cl_gui_frontend_services=>gui_download(
  EXPORTING
    filename  = lv_fullpath
    filetype  = 'ASC'
    codepage  = '4110'
    write_bom = abap_true          " helps spreadsheet programs recognize UTF-8
  CHANGING
    data_tab  = lt_csv
  EXCEPTIONS
    OTHERS    = 1 ).
```

> [!WARNING]
> These methods need SAP GUI. They don't work in [background jobs](./0068-variants-and-background-jobs.md), in RFC calls without a GUI, in web apps, or in ABAP Cloud. If a program must also run in the background, check `sy-batch` and write the file on the [application server](./0074-files-on-the-application-server.md) instead.

When the program downloads or uploads, SAP GUI may ask the user to allow access to the file. That's the SAP GUI security setting, not an error in your code.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that downloads all connections of `SPFLI` (airline, connection, from, to) as a CSV file, with a "Save as" dialog.
> 2. Write a second report with a file parameter and an F4 help that opens the "Open" dialog. Upload the CSV file and write each line, split into columns.

### Solution

```abap
REPORT zflight_download.

START-OF-SELECTION.
  SELECT carrid, connid, cityfrom, cityto FROM spfli INTO TABLE @DATA(lt_connections).

  DATA lt_csv TYPE string_table.
  LOOP AT lt_connections INTO DATA(ls_connection).
    APPEND |{ ls_connection-carrid };{ ls_connection-connid };{ ls_connection-cityfrom };{ ls_connection-cityto }| TO lt_csv.
  ENDLOOP.

  DATA: lv_name TYPE string, lv_path TYPE string, lv_fullpath TYPE string, lv_action TYPE i.
  cl_gui_frontend_services=>file_save_dialog(
    EXPORTING default_extension = 'csv'
    CHANGING  filename = lv_name path = lv_path fullpath = lv_fullpath user_action = lv_action
    EXCEPTIONS OTHERS = 1 ).
  CHECK sy-subrc = 0 AND lv_action = cl_gui_frontend_services=>action_ok.

  cl_gui_frontend_services=>gui_download(
    EXPORTING filename = lv_fullpath filetype = 'ASC' codepage = '4110'
    CHANGING  data_tab = lt_csv
    EXCEPTIONS OTHERS = 1 ).
  IF sy-subrc = 0.
    MESSAGE |{ lines( lt_csv ) } lines written| TYPE 'S'.
  ENDIF.
```

For the second report, combine the `FILE_OPEN_DIALOG` and `GUI_UPLOAD` examples from this lesson, and split each line with `SPLIT lv_line AT ';' INTO lv_carrid lv_connid lv_cityfrom lv_cityto`.

> [!NOTE]
>
> - The user's PC is the presentation server; ABAP reaches it only through SAP GUI and `CL_GUI_FRONTEND_SERVICES`.
> - `FILE_OPEN_DIALOG` and `FILE_SAVE_DIALOG` let the user choose a file; call the first in `AT SELECTION-SCREEN ON VALUE-REQUEST`.
> - `GUI_UPLOAD` reads a file into an internal table; `GUI_DOWNLOAD` writes one. Use `filetype` `'ASC'` for text and `'BIN'` for binary data.
> - Set `codepage = '4110'` for UTF-8, and `LOWER CASE` on file path parameters.
> - Nothing here works in the background: use application server files there.
