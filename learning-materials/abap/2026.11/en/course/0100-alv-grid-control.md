---
title: The ALV grid control
description: CL_GUI_ALV_GRID, field catalog, layout, events, and editable cells.
---

_Intermediate level_

`CL_GUI_ALV_GRID` is the ALV class behind most custom grids in SAP GUI. Compared with [`CL_SALV_TABLE`](./0099-alv-with-salv.md) it needs more code, but it gives you full control: you describe every column in a **field catalog**, react to many events, and let the user **edit cells**.

The grid is a **GUI control**: a component that lives inside a **container** on a screen. In a real dialog program the container is a custom control area that you draw on your own [screen](./0101-dynpro-basics.md). To keep this lesson in a single report, the examples use the container `cl_gui_container=>default_screen`, which fills the list screen that a report shows after `WRITE`.

## The grid in a report

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

  WRITE space.   " shows the list screen that hosts the grid
```

The output table must stay alive as long as the grid is on screen: the grid keeps a reference to it, not a copy. Make it a global variable or an attribute of a class, never a local variable of a method that ends.

> [!TIP]
> The container is the picture frame and the grid is the picture. You hang the frame on the wall (the screen) first, then put the picture in it.

## The field catalog

The **field catalog** (type `LVC_T_FCAT`) has one row per column. The function module `LVC_FIELDCATALOG_MERGE` builds it from a Dictionary structure; then you change the rows you need.

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
      <ls_fcat>-tech = abap_true.        " never shown
    WHEN 'PLANETYPE'.
      <ls_fcat>-no_out = abap_true.      " hidden, the user can show it
    WHEN 'CONNID'.
      <ls_fcat>-hotspot = abap_true.     " clickable
    WHEN 'PRICE'.
      <ls_fcat>-edit = abap_true.        " editable
    WHEN 'SEATSOCC'.
      <ls_fcat>-do_sum = abap_true.      " total at the bottom
      <ls_fcat>-coltext = 'Occupied'.
  ENDCASE.
ENDLOOP.
```

| Field       | Meaning                                   |
| ----------- | ----------------------------------------- |
| `fieldname` | the component name in the output table    |
| `coltext`   | the column heading                        |
| `outputlen` | the column width                          |
| `col_pos`   | the position of the column                |
| `key`       | key column: colored and fixed on the left |
| `no_out`    | hidden column                             |
| `tech`      | technical column, never shown             |
| `edit`      | editable cells                            |
| `do_sum`    | total of the column                       |
| `hotspot`   | clickable cell                            |

For a table type that isn't in the Dictionary, fill the catalog yourself with `VALUE lvc_t_fcat( ( fieldname = ... coltext = ... ) ... )`, or use `CL_SALV_CONTROLLER_METADATA=>GET_LVC_FIELDCATALOG` on a SALV object.

## Layout and first display

The **layout** (type `LVC_S_LAYO`) holds the settings for the whole grid.

```abap
DATA(ls_layout) = VALUE lvc_s_layo(
  zebra      = abap_true                 " striped rows
  cwidth_opt = abap_true                 " optimize column widths
  sel_mode   = 'A'                       " select rows and columns
  grid_title = 'Flights' ).

go_grid->set_table_for_first_display(
  EXPORTING  is_layout       = ls_layout
  CHANGING   it_outtab       = gt_flights
             it_fieldcatalog = lt_fcat
  EXCEPTIONS OTHERS          = 1 ).
```

Call `set_table_for_first_display` only once. When the data changes later, update `gt_flights` and call `go_grid->refresh_table_display( )`.

## Events and editable cells

Handle the events with a local class, as with any [ABAP event](./0086-events.md).

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
    MESSAGE |Flight { ls_flight-carrid } { ls_flight-connid } on { ls_flight-fldate DATE = USER }| TYPE 'I'.
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
                                             i_msgv1     = 'The price must be positive'
                                             i_fieldname = ls_cell-fieldname
                                             i_row_id    = ls_cell-row_id ).
      ENDIF.
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.
```

Register the handlers and the edit event after creating the grid:

```abap
DATA(lo_handler) = NEW lcl_handler( ).
SET HANDLER lo_handler->on_hotspot      FOR go_grid.
SET HANDLER lo_handler->on_data_changed FOR go_grid.

" Raise DATA_CHANGED as soon as the user leaves a changed cell
go_grid->register_edit_event( i_event_id = cl_gui_alv_grid=>mc_evt_modified ).
```

`DATA_CHANGED` runs before the new values reach `gt_flights`. If you add an error to the protocol, the grid shows it and keeps the wrong value out of the table. Before you save, call `go_grid->check_changed_data( )`: it runs the checks for cells still being edited and copies the valid changes into the output table.

> [!WARNING]
> The grid works only in SAP GUI. It doesn't run in background jobs, and it isn't available in ABAP Cloud. For web apps, use Fiori elements with [RAP](./0139-rap-overview.md).

## Exercise

> [!IMPORTANT]
>
> 1. Show `SFLIGHT` in a `CL_GUI_ALV_GRID` with a field catalog built from the Dictionary, zebra stripes, and optimized widths.
> 2. Make `SEATSOCC` editable and reject values greater than `SEATSMAX` in `DATA_CHANGED`.

### Solution

The program is the one in this lesson, with this check in `on_data_changed` (field `SEATSOCC` editable in the catalog):

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
                                         i_msgv1     = 'More seats than available'
                                         i_fieldname = 'SEATSOCC'
                                         i_row_id    = ls_cell-row_id ).
  ENDIF.
ENDLOOP.
```

> [!NOTE]
>
> - `CL_GUI_ALV_GRID` is a GUI control: it needs a container on a screen and keeps a reference to the output table.
> - The field catalog (`LVC_T_FCAT`) describes the columns; `LVC_FIELDCATALOG_MERGE` builds it from the Dictionary.
> - The layout (`LVC_S_LAYO`) holds the grid settings; display once, then `refresh_table_display( )`.
> - Set `edit` in the catalog, register an edit event, and check the input in `DATA_CHANGED`.
> - Call `check_changed_data( )` before you save the data.
