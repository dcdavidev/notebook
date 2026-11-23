---
title: L'ALV grid control
description: CL_GUI_ALV_GRID, catalogo campi, layout, eventi e celle modificabili.
level: intermediate
---

`CL_GUI_ALV_GRID` è la classe ALV dietro la maggior parte delle griglie custom in SAP GUI. Rispetto a [`CL_SALV_TABLE`](./0099-alv-with-salv.md) richiede più codice, ma ti dà il pieno controllo: descrivi ogni colonna in un **catalogo campi** (_field catalog_), reagisci a molti eventi e permetti all'utente di **modificare le celle**.

La griglia è un **GUI control**: un componente che vive dentro un **container** su una schermata. In un vero programma di dialogo il container è un'area custom control che disegni sulla tua [schermata](./0101-dynpro-basics.md). Per tenere questa lezione in un solo report, gli esempi usano il container `cl_gui_container=>default_screen`, che riempie la schermata della lista che un report mostra dopo una `WRITE`.

## La griglia in un report

```abap
REPORT zflight_grid.

DATA gt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
DATA go_grid    TYPE REF TO cl_gui_alv_grid.

START-OF-SELECTION.
  SELECT * FROM sflight INTO TABLE @gt_flights UP TO 100 ROWS.

  go_grid = NEW cl_gui_alv_grid( i_parent = cl_gui_container=>default_screen ).

  go_grid->set_table_for_first_display(
    EXPORTING  i_structure_name = 'SFLIGHT'
    CHANGING   it_outtab        = gt_flights
    EXCEPTIONS OTHERS           = 1 ).

  WRITE space.   " mostra la schermata della lista che ospita la griglia
```

La tabella di output deve restare viva finché la griglia è sullo schermo: la griglia ne tiene un riferimento, non una copia. Rendila una variabile globale o un attributo di una classe, mai una variabile locale di un metodo che termina.

> [!TIP]
> Il container è la cornice e la griglia è il quadro. Prima appendi la cornice al muro (la schermata), poi ci metti dentro il quadro.

## Il catalogo campi

Il **catalogo campi** (tipo `LVC_T_FCAT`) ha una riga per colonna. Il modulo funzione `LVC_FIELDCATALOG_MERGE` lo costruisce da una struttura del Dizionario ABAP; poi modifichi le righe che ti servono.

```abap
DATA lt_fcat TYPE lvc_t_fcat.

CALL FUNCTION 'LVC_FIELDCATALOG_MERGE'
  EXPORTING
    i_structure_name = 'SFLIGHT'
  CHANGING
    ct_fieldcat      = lt_fcat
  EXCEPTIONS
    OTHERS           = 1.

LOOP AT lt_fcat ASSIGNING FIELD-SYMBOL(<ls_fcat>).
  CASE <ls_fcat>-fieldname.
    WHEN 'MANDT'.
      <ls_fcat>-tech = abap_true.        " mai visibile
    WHEN 'PLANETYPE'.
      <ls_fcat>-no_out = abap_true.      " nascosta, l'utente può mostrarla
    WHEN 'CONNID'.
      <ls_fcat>-hotspot = abap_true.     " cliccabile
    WHEN 'PRICE'.
      <ls_fcat>-edit = abap_true.        " modificabile
    WHEN 'SEATSOCC'.
      <ls_fcat>-do_sum = abap_true.      " totale in fondo
      <ls_fcat>-coltext = 'Occupati'.
  ENDCASE.
ENDLOOP.
```

| Campo       | Significato                                    |
| ----------- | ---------------------------------------------- |
| `fieldname` | il nome del componente nella tabella di output |
| `coltext`   | l'intestazione della colonna                   |
| `outputlen` | la larghezza della colonna                     |
| `col_pos`   | la posizione della colonna                     |
| `key`       | colonna chiave: colorata e fissa a sinistra    |
| `no_out`    | colonna nascosta                               |
| `tech`      | colonna tecnica, mai visibile                  |
| `edit`      | celle modificabili                             |
| `do_sum`    | totale della colonna                           |
| `hotspot`   | cella cliccabile                               |

Per un tipo tabella che non è nel Dizionario ABAP, riempi tu il catalogo con `VALUE lvc_t_fcat( ( fieldname = ... coltext = ... ) ... )`, oppure usa `CL_SALV_CONTROLLER_METADATA=>GET_LVC_FIELDCATALOG` su un oggetto SALV.

## Layout e prima visualizzazione

Il **layout** (tipo `LVC_S_LAYO`) contiene le impostazioni dell'intera griglia.

```abap
DATA(ls_layout) = VALUE lvc_s_layo(
  zebra      = abap_true                 " righe alternate
  cwidth_opt = abap_true                 " ottimizza la larghezza delle colonne
  sel_mode   = 'A'                       " selezione di righe e colonne
  grid_title = 'Voli' ).

go_grid->set_table_for_first_display(
  EXPORTING  is_layout       = ls_layout
  CHANGING   it_outtab       = gt_flights
             it_fieldcatalog = lt_fcat
  EXCEPTIONS OTHERS          = 1 ).
```

Chiama `set_table_for_first_display` una volta sola. Quando in seguito i dati cambiano, aggiorna `gt_flights` e chiama `go_grid->refresh_table_display( )`.

## Eventi e celle modificabili

Gestisci gli eventi con una classe locale, come per qualsiasi [evento ABAP](./0086-events.md).

```abap
CLASS lcl_handler DEFINITION.
  PUBLIC SECTION.
    METHODS on_hotspot FOR EVENT hotspot_click OF cl_gui_alv_grid
      IMPORTING e_row_id e_column_id.
    METHODS on_data_changed FOR EVENT data_changed OF cl_gui_alv_grid
      IMPORTING er_data_changed.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD on_hotspot.
    DATA(ls_flight) = gt_flights[ e_row_id-index ].
    MESSAGE |Volo { ls_flight-carrid } { ls_flight-connid } del { ls_flight-fldate DATE = USER }| TYPE 'I'.
  ENDMETHOD.

  METHOD on_data_changed.
    DATA lv_price TYPE s_price.
    LOOP AT er_data_changed->mt_good_cells INTO DATA(ls_cell) WHERE fieldname = 'PRICE'.
      er_data_changed->get_cell_value( EXPORTING i_row_id    = ls_cell-row_id
                                                 i_fieldname = ls_cell-fieldname
                                       IMPORTING e_value     = lv_price ).
      IF lv_price <= 0.
        er_data_changed->add_protocol_entry( i_msgid     = '00'
                                             i_msgty     = 'E'
                                             i_msgno     = '001'
                                             i_msgv1     = 'Il prezzo deve essere positivo'
                                             i_fieldname = ls_cell-fieldname
                                             i_row_id    = ls_cell-row_id ).
      ENDIF.
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.
```

Registra gli handler e l'evento di modifica dopo aver creato la griglia:

```abap
DATA(lo_handler) = NEW lcl_handler( ).
SET HANDLER lo_handler->on_hotspot      FOR go_grid.
SET HANDLER lo_handler->on_data_changed FOR go_grid.

" Solleva DATA_CHANGED appena l'utente lascia una cella modificata
go_grid->register_edit_event( i_event_id = cl_gui_alv_grid=>mc_evt_modified ).
```

`DATA_CHANGED` viene eseguito prima che i nuovi valori arrivino in `gt_flights`. Se aggiungi un errore al protocollo, la griglia lo mostra e tiene il valore sbagliato fuori dalla tabella. Prima di salvare, chiama `go_grid->check_changed_data( )`: esegue i controlli per le celle ancora in modifica e copia le modifiche valide nella tabella di output.

> [!WARNING]
> La griglia funziona solo in SAP GUI. Non gira nei job in background e non è disponibile in ABAP Cloud. Per le app web usa Fiori elements con [RAP](./0139-rap-overview.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Mostra `SFLIGHT` in una `CL_GUI_ALV_GRID` con un catalogo campi costruito dal Dizionario ABAP, righe alternate e larghezze ottimizzate.
> 2. Rendi modificabile `SEATSOCC` e rifiuta in `DATA_CHANGED` i valori maggiori di `SEATSMAX`.

### Soluzione

Il programma è quello di questa lezione, con questo controllo in `on_data_changed` (campo `SEATSOCC` modificabile nel catalogo):

```abap
DATA lv_seatsocc TYPE s_seatsocc.
LOOP AT er_data_changed->mt_good_cells INTO DATA(ls_cell) WHERE fieldname = 'SEATSOCC'.
  er_data_changed->get_cell_value( EXPORTING i_row_id    = ls_cell-row_id
                                             i_fieldname = 'SEATSOCC'
                                   IMPORTING e_value     = lv_seatsocc ).
  IF lv_seatsocc > gt_flights[ ls_cell-row_id ]-seatsmax.
    er_data_changed->add_protocol_entry( i_msgid     = '00'
                                         i_msgty     = 'E'
                                         i_msgno     = '001'
                                         i_msgv1     = 'Più posti di quelli disponibili'
                                         i_fieldname = 'SEATSOCC'
                                         i_row_id    = ls_cell-row_id ).
  ENDIF.
ENDLOOP.
```

> [!NOTE]
>
> - `CL_GUI_ALV_GRID` è un GUI control: ha bisogno di un container su una schermata e tiene un riferimento alla tabella di output.
> - Il catalogo campi (`LVC_T_FCAT`) descrive le colonne; `LVC_FIELDCATALOG_MERGE` lo costruisce dal Dizionario ABAP.
> - Il layout (`LVC_S_LAYO`) contiene le impostazioni della griglia; visualizza una volta, poi `refresh_table_display( )`.
> - Imposta `edit` nel catalogo, registra un evento di modifica e controlla l'input in `DATA_CHANGED`.
> - Chiama `check_changed_data( )` prima di salvare i dati.
