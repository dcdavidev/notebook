---
title: I file sul PC dell'utente
description: Caricare e scaricare file tramite SAP GUI.
level: basic
---

Gli utenti vogliono spesso esportare dati in un file sul loro PC, oppure caricare un elenco di valori da un foglio di calcolo che hanno preparato. In termini SAP, il PC dell'utente è il **presentation server**: la macchina su cui gira SAP GUI.

ABAP raggiunge il PC dell'utente solo tramite SAP GUI, con la classe `CL_GUI_FRONTEND_SERVICES`. I suoi metodi statici aprono le finestre di dialogo dei file, caricano file e scaricano file.

## Scegliere un file: le finestre di dialogo

`FILE_OPEN_DIALOG` mostra la finestra standard "Apri" del sistema operativo e restituisce i file selezionati dall'utente. Chiamalo nell'aiuto F4 del parametro del file, così l'utente può sfogliare le cartelle invece di scrivere il percorso:

```abap
PARAMETERS p_file TYPE string LOWER CASE OBLIGATORY.

AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_file.
  DATA lt_files  TYPE filetable.
  DATA lv_rc     TYPE i.
  DATA lv_action TYPE i.

  cl_gui_frontend_services=>file_open_dialog(
    EXPORTING
      window_title = 'Seleziona il file da caricare'
      file_filter  = 'File CSV (*.csv)|*.csv'
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

- `LOWER CASE` mantiene il percorso così come è stato scritto: senza, la schermata di selezione lo converte in maiuscolo.
- `rc` è il numero di file selezionati; `user_action` ti dice se l'utente ha cliccato OK o Annulla.
- `FILE_SAVE_DIALOG` funziona allo stesso modo per la finestra "Salva con nome" e restituisce `filename`, `path` e `fullpath`.

I metodi di `CL_GUI_FRONTEND_SERVICES` usano eccezioni classiche, come i [moduli funzione](./0070-function-modules.md): elencale dopo `EXCEPTIONS`, o almeno `OTHERS`, e controlla `sy-subrc`.

## Caricare un file: GUI_UPLOAD

`GUI_UPLOAD` legge un file dal PC in una tabella interna. Per un file di testo usa una tabella di stringhe: ogni riga del file diventa una riga della tabella.

```abap
START-OF-SELECTION.
  DATA lt_lines TYPE string_table.

  cl_gui_frontend_services=>gui_upload(
    EXPORTING
      filename = p_file
      filetype = 'ASC'               " file di testo
      codepage = '4110'              " UTF-8
    CHANGING
      data_tab = lt_lines
    EXCEPTIONS
      OTHERS   = 1 ).
  IF sy-subrc <> 0.
    MESSAGE 'Impossibile leggere il file' TYPE 'S' DISPLAY LIKE 'E'.
    RETURN.
  ENDIF.

  LOOP AT lt_lines INTO DATA(lv_line).
    SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_carrname).
    WRITE: / lv_carrid, lv_carrname.
  ENDLOOP.
```

- `filetype = 'ASC'` legge testo, riga per riga. `'BIN'` legge i byte così come sono, per immagini, PDF o altri file binari (in una tabella di tipo `solix_tab`).
- `codepage = '4110'` è UTF-8. Senza, SAP GUI usa la code page del PC, e i caratteri accentati possono essere letti male.
- Con `has_field_separator = abap_true`, il metodo può anche dividere le colonne separate da tabulazione direttamente nei campi di una tabella strutturata.

> [!TIP]
> SAP GUI è il corriere tra il server e il PC. Il server non può entrare nell'ufficio dell'utente: consegna il pacco al corriere, che conosce la strada. Se il corriere non c'è, perché nessuno è collegato con SAP GUI, non arriva niente.

## Scaricare un file: GUI_DOWNLOAD

`GUI_DOWNLOAD` scrive una tabella interna in un file sul PC. Prima costruisci le righe, poi lascia scegliere all'utente dove salvare:

```abap
SELECT carrid, carrname, currcode FROM scarr INTO TABLE @DATA(lt_carriers).

DATA lt_csv TYPE string_table.
APPEND `CARRID;CARRNAME;CURRCODE` TO lt_csv.                 " riga di intestazione
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
    default_file_name = 'compagnie.csv'
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
    write_bom = abap_true          " aiuta i fogli di calcolo a riconoscere UTF-8
  CHANGING
    data_tab  = lt_csv
  EXCEPTIONS
    OTHERS    = 1 ).
```

> [!WARNING]
> Questi metodi hanno bisogno di SAP GUI. Non funzionano nei [job in background](./0068-variants-and-background-jobs.md), nelle chiamate RFC senza GUI, nelle app web né in ABAP Cloud. Se un programma deve girare anche in background, controlla `sy-batch` e scrivi invece il file sull'[application server](./0074-files-on-the-application-server.md).

Quando il programma scarica o carica un file, SAP GUI può chiedere all'utente di consentire l'accesso al file. È l'impostazione di sicurezza di SAP GUI, non un errore del tuo codice.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che scarica tutti i collegamenti di `SPFLI` (compagnia, collegamento, da, a) come file CSV, con una finestra "Salva con nome".
> 2. Scrivi un secondo report con un parametro per il file e un aiuto F4 che apre la finestra "Apri". Carica il file CSV e stampa ogni riga, divisa in colonne.

### Soluzione

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
    MESSAGE |{ lines( lt_csv ) } righe scritte| TYPE 'S'.
  ENDIF.
```

Per il secondo report, combina gli esempi di `FILE_OPEN_DIALOG` e `GUI_UPLOAD` di questa lezione, e dividi ogni riga con `SPLIT lv_line AT ';' INTO lv_carrid lv_connid lv_cityfrom lv_cityto`.

> [!NOTE]
>
> - Il PC dell'utente è il presentation server; ABAP lo raggiunge solo tramite SAP GUI e `CL_GUI_FRONTEND_SERVICES`.
> - `FILE_OPEN_DIALOG` e `FILE_SAVE_DIALOG` fanno scegliere un file all'utente; chiama il primo in `AT SELECTION-SCREEN ON VALUE-REQUEST`.
> - `GUI_UPLOAD` legge un file in una tabella interna; `GUI_DOWNLOAD` ne scrive uno. Usa `filetype` `'ASC'` per il testo e `'BIN'` per i dati binari.
> - Imposta `codepage = '4110'` per UTF-8, e `LOWER CASE` sui parametri con il percorso del file.
> - Niente di tutto questo funziona in background: lì usa i file dell'application server.
