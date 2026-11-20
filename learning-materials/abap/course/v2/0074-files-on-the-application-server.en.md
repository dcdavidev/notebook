---
title: Files on the application server
description: OPEN DATASET, TRANSFER, READ DATASET, and AL11.
---

_Basic level_

Interfaces with other systems often exchange files: a nightly job writes a file of bookings, and another system picks it up from a shared folder. These files live on the **application server**, the machine where the ABAP programs run, not on the user's PC.

Unlike [files on the user's PC](./0073-files-on-the-presentation-server.en.md), application server files don't need SAP GUI, so they work in [background jobs](./0068-variants-and-background-jobs.en.md). ABAP handles them with the **dataset** statements: `OPEN DATASET`, `TRANSFER`, `READ DATASET`, `CLOSE DATASET`, and `DELETE DATASET`.

## Looking at the file system: AL11

Transaction `AL11` lists the directories of the application server known to SAP, such as `DIR_TEMP` or `DIR_HOME`, with their real paths (for example `/usr/sap/<SID>/D00/work` on Linux). Double-click a directory to see its files, and a file to see its content.

Ask your Basis team which directory you're allowed to use for your interfaces. Writing anywhere else may fail because of missing operating system permissions.

## Writing a file

```abap
REPORT zflight_write_file.

PARAMETERS p_file TYPE string LOWER CASE DEFAULT '/tmp/zflight_carriers.csv'.

START-OF-SELECTION.
  SELECT carrid, carrname, currcode FROM scarr INTO TABLE @DATA(lt_carriers).

  OPEN DATASET p_file FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
  IF sy-subrc <> 0.
    MESSAGE |File { p_file } could not be opened| TYPE 'S' DISPLAY LIKE 'E'.
    RETURN.
  ENDIF.

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    DATA(lv_line) = |{ ls_carrier-carrid };{ ls_carrier-carrname };{ ls_carrier-currcode }|.
    TRANSFER lv_line TO p_file.
  ENDLOOP.

  CLOSE DATASET p_file.
  MESSAGE |{ lines( lt_carriers ) } lines written| TYPE 'S'.
```

- The file is identified by its name: every dataset statement uses the same path.
- `TRANSFER` writes one record. In text mode, it adds the end-of-line character.
- `CLOSE DATASET` releases the file. The runtime closes open files at the end of the program, but close them yourself, especially before another program reads them.

> [!CAUTION]
> `FOR OUTPUT` creates the file, or **overwrites** it if it already exists, without asking. Use `FOR APPENDING` to add lines at the end of an existing file.

## Open modes

| Addition        | Effect                                                      |
| --------------- | ----------------------------------------------------------- |
| `FOR INPUT`     | read an existing file; `sy-subrc = 8` if it doesn't exist   |
| `FOR OUTPUT`    | create a new file or overwrite an existing one              |
| `FOR APPENDING` | write at the end of the file; create it if it doesn't exist |
| `FOR UPDATE`    | read and change an existing file                            |

| Mode                          | Use it for                                      |
| ----------------------------- | ----------------------------------------------- |
| `IN TEXT MODE ENCODING UTF-8` | text files, line by line; the usual choice      |
| `IN BINARY MODE`              | bytes unchanged: PDFs, images, or fixed formats |
| `IN LEGACY TEXT MODE`         | old files in a non-Unicode code page            |

The addition `MESSAGE lv_msg` puts the operating system's error text in `lv_msg` when `OPEN DATASET` fails, which helps a lot when you look for the cause.

## Reading a file

`READ DATASET` reads one line per call. Put it in a `DO` loop and stop when `sy-subrc` isn't `0`, which means the end of the file:

```abap
REPORT zflight_read_file.

PARAMETERS p_file TYPE string LOWER CASE DEFAULT '/tmp/zflight_carriers.csv'.

START-OF-SELECTION.
  DATA lv_msg  TYPE string.
  DATA lv_line TYPE string.

  OPEN DATASET p_file FOR INPUT IN TEXT MODE ENCODING UTF-8 MESSAGE lv_msg.
  IF sy-subrc <> 0.
    WRITE: / 'Error:', lv_msg.
    RETURN.
  ENDIF.

  DO.
    READ DATASET p_file INTO lv_line.
    IF sy-subrc <> 0.
      EXIT.                                   " end of file
    ENDIF.
    SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_carrname) DATA(lv_currcode).
    WRITE: / lv_carrid, lv_carrname, lv_currcode.
  ENDDO.

  CLOSE DATASET p_file.
```

`DELETE DATASET p_file` deletes a file, for example after you've processed it.

> [!TIP]
> The dataset statements work like a notebook on a shared shelf. You take it from the shelf (`OPEN`), write or read one line at a time (`TRANSFER`, `READ`), and put it back (`CLOSE`) so the next person can use it.

## Security and portability

- `OPEN DATASET` checks the authorization object `S_DATASET`. If the user (or the job's step user) lacks it, the statement raises an exception and the program dumps. You can check first with the function module `AUTHORITY_CHECK_DATASET`.
- Never build a path from user input without checking it: a value like `../../` could reach files outside your directory. Use **logical file names**, defined in transaction `FILE` and converted to a physical path with the function module `FILE_GET_NAME`, so the path is maintained centrally and can differ between development and production.
- If the system has several application servers, a file in a local directory exists only on the server where it was written. Interfaces normally use a directory shared by all servers.

Errors when opening a file, such as a missing authorization, raise class-based exceptions like `CX_SY_FILE_OPEN` and `CX_SY_FILE_AUTHORITY`. You'll learn to catch them in [class-based exceptions](./0089-class-based-exceptions.en.md).

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that writes all flights of an airline from `SFLIGHT` (connection, date, occupied seats) to a text file in a directory you see in `AL11`.
> 2. Check the file in `AL11`.
> 3. Write a second report that reads the file back and adds up the occupied seats.

### Solution

```abap
REPORT zflight_export.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.
PARAMETERS p_file   TYPE string LOWER CASE DEFAULT '/tmp/zflight_flights.txt'.

START-OF-SELECTION.
  SELECT connid, fldate, seatsocc FROM sflight
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).

  OPEN DATASET p_file FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
  CHECK sy-subrc = 0.
  LOOP AT lt_flights INTO DATA(ls_flight).
    DATA(lv_line) = |{ ls_flight-connid };{ ls_flight-fldate };{ ls_flight-seatsocc }|.
    TRANSFER lv_line TO p_file.
  ENDLOOP.
  CLOSE DATASET p_file.
```

```abap
REPORT zflight_import.

PARAMETERS p_file TYPE string LOWER CASE DEFAULT '/tmp/zflight_flights.txt'.

START-OF-SELECTION.
  DATA lv_line  TYPE string.
  DATA lv_total TYPE i.

  OPEN DATASET p_file FOR INPUT IN TEXT MODE ENCODING UTF-8.
  CHECK sy-subrc = 0.
  DO.
    READ DATASET p_file INTO lv_line.
    IF sy-subrc <> 0.
      EXIT.
    ENDIF.
    SPLIT lv_line AT ';' INTO DATA(lv_connid) DATA(lv_fldate) DATA(lv_seats).
    lv_total = lv_total + lv_seats.
  ENDDO.
  CLOSE DATASET p_file.

  WRITE: / 'Occupied seats:', lv_total.
```

> [!NOTE]
>
> - Application server files are read and written with `OPEN DATASET`, `TRANSFER`, `READ DATASET`, and `CLOSE DATASET`; they work in background jobs.
> - Use `IN TEXT MODE ENCODING UTF-8` for text files and `IN BINARY MODE` for binary data.
> - `FOR OUTPUT` overwrites existing files; `FOR APPENDING` adds to them.
> - Read in a `DO` loop until `sy-subrc` isn't `0`, and always check `sy-subrc` after `OPEN DATASET`.
> - Browse directories with `AL11`; use logical file names (`FILE`, `FILE_GET_NAME`) and the `S_DATASET` authorization for safe paths.
