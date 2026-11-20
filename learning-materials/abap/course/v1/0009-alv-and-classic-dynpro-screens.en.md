---
title: ALV and classic screens (Dynpro)
description: Show data in professional grids and build dialog transactions.
---

_Week 2 · Intermediate level · 4 hours_

### Today's schedule

| Block  | Content                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------- |
| Hour 1 | ALV with `CL_SALV_TABLE`: basic display, functions, columns                                        |
| Hour 2 | Advanced ALV: sorting, totals, colors, events (double-click, buttons), REUSE and `CL_GUI_ALV_GRID` |
| Hour 3 | Dynpro: Screen Painter, PBO and PAI, fields, GUI status, OK_CODE                                   |
| Hour 4 | Advanced Dynpro: table controls, subscreens, tabstrips, controls, screen flow                      |

## Hour 1 – The ALV: SAP's grid

**ALV** (_ABAP List Viewer_) is the standard component for showing data in a table. With a few lines, the user gets a grid with sorting, filters, sums, export to Excel, and savable layouts.

> [!TIP]
> Showing data with `WRITE` is like drawing a table by hand on a sheet of paper. The ALV is like switching to an Excel sheet: same data, but users can sort, filter, total, and save it on their own, without you writing one more line.

There are three "families" of ALV:

| Technique                     | Characteristics                                                       | When                            |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------- |
| `CL_SALV_TABLE` (SALV)        | object-oriented, very simple, read-only                               | the default choice for reports  |
| `CL_GUI_ALV_GRID`             | more powerful, allows editing cells, lives in a container on a Dynpro | editable grids, complex screens |
| `REUSE_ALV_GRID_DISPLAY` (FM) | old, based on function modules, with a field catalog                  | existing code                   |

In the Fiori world, lists are built with Fiori Elements on top of OData/RAP services (day 15), but the ALV remains the standard in SAP GUI.

### Your first ALV with CL_SALV_TABLE

```abap
REPORT zalv_basic.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, price, currency, seatsmax, seatsocc
    FROM sflight
    INTO TABLE @DATA(gt_flights).

  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = DATA(lo_alv)
        CHANGING  t_table      = gt_flights ).
      lo_alv->display( ).
    CATCH cx_salv_msg INTO DATA(lx_err).
      MESSAGE lx_err TYPE 'E'.
  ENDTRY.
```

That's it: run it and you get a complete grid. The column labels come from the ABAP Dictionary (which is why it pays to type with data elements).

> [!WARNING]
> The table passed to `factory` must exist for as long as the ALV is visible: use a global variable (or a class attribute), not a local variable of a method that ends.

### Turn on the toolbar functions

```abap
lo_alv->get_functions( )->set_all( abap_true ).   " sort, filter, sum, export, layout...
```

### Work with columns

```abap
DATA(lo_cols) = lo_alv->get_columns( ).
lo_cols->set_optimize( abap_true ).                                  " automatic width

TRY.
    DATA(lo_col) = CAST cl_salv_column_table( lo_cols->get_column( 'SEATSMAX' ) ).
    lo_col->set_long_text( 'Total seats' ).
    lo_col->set_medium_text( 'Tot. seats' ).
    lo_col->set_short_text( 'Seats' ).

    lo_cols->get_column( 'CURRENCY' )->set_visible( abap_false ).    " hide
    lo_cols->get_column( 'CARRID' )->set_output_length( 6 ).
    lo_cols->set_column_position( columnname = 'PRICE' position = 2 ).
  CATCH cx_salv_not_found.
ENDTRY.
```

### Title, savable layouts, stripes

```abap
lo_alv->get_display_settings( )->set_list_header( 'Flight list' ).
lo_alv->get_display_settings( )->set_striped_pattern( abap_true ).

DATA(lo_layout) = lo_alv->get_layout( ).
lo_layout->set_key( VALUE #( report = sy-repid ) ).
lo_layout->set_save_restriction( if_salv_c_layout=>restrict_none ).  " users save their own layouts
lo_layout->set_default( abap_true ).
```

### Popup and full-screen ALV

```abap
lo_alv->set_screen_popup( start_column = 10 end_column = 100
                          start_line   = 5  end_line   = 20 ).
```

## Hour 2 – Advanced ALV

### Sorting, subtotals, and totals

```abap
DATA(lo_sorts) = lo_alv->get_sorts( ).
lo_sorts->add_sort( columnname = 'CARRID' subtotal = abap_true ).
lo_sorts->add_sort( columnname = 'FLDATE' sequence = if_salv_c_sort=>sort_down ).

DATA(lo_aggr) = lo_alv->get_aggregations( ).
lo_aggr->add_aggregation( columnname  = 'SEATSOCC'
                          aggregation = if_salv_c_aggregation=>total ).

DATA(lo_filters) = lo_alv->get_filters( ).
lo_filters->add_filter( columnname = 'CARRID' sign = 'I' option = 'EQ' low = 'LH' ).
```

### Colors and icons

To color rows or cells, add a column of type `lvc_t_scol` (a color table) to the data structure and tell the ALV about it:

```abap
TYPES: BEGIN OF ty_out,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         seatsocc TYPE s_seatsocc,
         seatsmax TYPE s_seatsmax,
         status   TYPE icon_d,       " traffic light icon
         colors   TYPE lvc_t_scol,   " colors per cell
       END OF ty_out.
DATA gt_out TYPE STANDARD TABLE OF ty_out WITH EMPTY KEY.

LOOP AT gt_out ASSIGNING FIELD-SYMBOL(<o>).
  IF <o>-seatsocc >= <o>-seatsmax.
    <o>-status = icon_red_light.
    <o>-colors = VALUE #( ( fname = 'SEATSOCC' color-col = col_negative ) ).
  ELSE.
    <o>-status = icon_green_light.
  ENDIF.
ENDLOOP.

" after factory:
lo_alv->get_columns( )->set_color_column( 'COLORS' ).
```

The `icon_...` constants come from the `<icon>` include (add `INCLUDE <icon>.` to the report if you need them); the `col_...` colors are system constants (`COL_POSITIVE` green, `COL_NEGATIVE` red, `COL_TOTAL` yellow, `COL_HEADING` blue...).

### Hotspots and double-click: events

To react to user actions, you use an **event handler**: a local class with a method registered for the event (you'll study classes tomorrow: for now just follow the pattern).

```abap
CLASS lcl_handler DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS on_double_click
      FOR EVENT double_click OF cl_salv_events_table
      IMPORTING row column.
    CLASS-METHODS on_link_click
      FOR EVENT link_click OF cl_salv_events_table
      IMPORTING row column.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD on_double_click.
    DATA(ls_flight) = gt_flights[ row ].
    MESSAGE |You clicked flight { ls_flight-carrid } { ls_flight-connid }| TYPE 'I'.
  ENDMETHOD.

  METHOD on_link_click.
    DATA(ls_flight) = gt_flights[ row ].
    SET PARAMETER ID 'CAR' FIELD ls_flight-carrid.
    CALL TRANSACTION 'SE16N'.
  ENDMETHOD.
ENDCLASS.

* after factory:
CAST cl_salv_column_table( lo_alv->get_columns( )->get_column( 'CONNID' )
  )->set_cell_type( if_salv_c_cell_type=>hotspot ).
SET HANDLER lcl_handler=>on_double_click FOR lo_alv->get_event( ).
SET HANDLER lcl_handler=>on_link_click FOR lo_alv->get_event( ).
```

### Your own toolbar buttons

In full-screen mode, you copy the standard GUI status `SALV_STANDARD` from the program `SALV_DEMO_TABLE_FUNCTIONS` (in SE41 / SE80) into your program, add your buttons, and then:

```abap
lo_alv->set_screen_status( pfstatus      = 'ZSTATUS'
                           report        = sy-repid
                           set_functions = lo_alv->c_functions_all ).
" and you handle the added_function event OF cl_salv_events with the e_salv_function parameter
```

### Row selection

```abap
lo_alv->get_selections( )->set_selection_mode( if_salv_c_selection_mode=>row_column ).
" after the user's action:
DATA(lt_selected_rows) = lo_alv->get_selections( )->get_selected_rows( ).
```

### The old school: REUSE_ALV_GRID_DISPLAY and the field catalog

In existing code you'll often find:

```abap
DATA lt_fcat TYPE slis_t_fieldcat_alv.
lt_fcat = VALUE #(
  ( fieldname = 'CARRID' seltext_m = 'Airline' key = 'X' )
  ( fieldname = 'CONNID' seltext_m = 'Flight' )
  ( fieldname = 'PRICE'  seltext_m = 'Price' do_sum = 'X' ) ).

CALL FUNCTION 'REUSE_ALV_GRID_DISPLAY'
  EXPORTING
    i_callback_program = sy-repid
    it_fieldcat        = lt_fcat
    is_layout          = VALUE slis_layout_alv( zebra = 'X' colwidth_optimize = 'X' )
  TABLES
    t_outtab           = gt_flights.
```

The **field catalog** is the table that describes the columns (name, text, width, sum, key...). You can generate it from the DDIC with `REUSE_ALV_FIELDCATALOG_MERGE` or `LVC_FIELDCATALOG_MERGE`.

### Editable ALV: CL_GUI_ALV_GRID

`CL_GUI_ALV_GRID` lives inside a **container** on a Dynpro (see hour 3). It allows editable cells:

```abap
DATA go_cont TYPE REF TO cl_gui_custom_container.
DATA go_grid TYPE REF TO cl_gui_alv_grid.

go_cont = NEW #( container_name = 'CC_ALV' ).   " area drawn on the Dynpro
go_grid = NEW #( i_parent = go_cont ).

DATA(lt_fcat) = VALUE lvc_t_fcat(
  ( fieldname = 'CARRID' ref_table = 'SFLIGHT' )
  ( fieldname = 'PRICE'  ref_table = 'SFLIGHT' edit = abap_true ) ).

go_grid->set_table_for_first_display(
  EXPORTING is_layout       = VALUE #( zebra = abap_true cwidth_opt = abap_true )
  CHANGING  it_outtab       = gt_flights
            it_fieldcatalog = lt_fcat ).

* After the user's changes
go_grid->check_changed_data( ).      " transfers the changes into gt_flights
go_grid->refresh_table_display( ).
```

There's also `cl_gui_docking_container` (it docks to the edges of the screen, so you don't have to draw an area).

## Hour 3 – Dynpro (classic screens)

A **Dynpro** (_dynamic program_) is a hand-drawn screen with fields, buttons, and tables. It's the technology behind classic transactions such as VA01 or ME21N. Programs that mainly contain Dynpros are called **module pools** (type M, name `SAPMZ...`), but Dynpros can also live in reports and function groups.

> [!TIP]
> A Dynpro is like a counter with a form to fill in. Before the user sees it, the clerk prepares the form (**PBO**: _Process Before Output_). When the user hands it back, the clerk checks it and decides what to do (**PAI**: _Process After Input_).

### The parts of a Dynpro

| Part         | Description                                                             |
| ------------ | ----------------------------------------------------------------------- |
| Number       | 4 digits (for example 0100)                                             |
| Attributes   | type (normal, subscreen, popup), next screen                            |
| Layout       | drawn with the Screen Painter (SE51): fields, labels, buttons, frames   |
| Element list | all the fields, including OK_CODE (the code of the button pressed)      |
| Flow logic   | `PROCESS BEFORE OUTPUT` / `PROCESS AFTER INPUT` with calls to `MODULE`s |

### Flow logic

```abap
PROCESS BEFORE OUTPUT.
  MODULE status_0100.                         " sets the GUI status and title
  MODULE prepare_data_0100.

PROCESS AFTER INPUT.
  MODULE exit_command_0100 AT EXIT-COMMAND.   " Back/Exit/Cancel without checks
  FIELD gs_flight-carrid MODULE check_airline ON REQUEST.
  CHAIN.
    FIELD: gs_flight-fldate, gs_flight-price.
    MODULE check_date_price.                  " on error, reopens both fields
  ENDCHAIN.
  MODULE user_command_0100.
```

This language (flow logic) **is not ABAP**: it has only a few statements (`MODULE`, `FIELD`, `CHAIN`, `LOOP`, `CALL SUBSCREEN`). The `MODULE`s, instead, are written in ABAP in the program.

### The ABAP program

```abap
PROGRAM sapmzflights.

TABLES sflight.                    " links the Dynpro fields to the structure
                                   " (the only use of TABLES still allowed)
DATA gs_flight TYPE sflight.
DATA gv_okcode TYPE sy-ucomm.      " in the element list, the OK field is called GV_OKCODE

MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.     " menu bar and buttons (created with SE41)
  SET TITLEBAR 'TITLE_0100'.
ENDMODULE.

MODULE exit_command_0100 INPUT.
  LEAVE PROGRAM.
ENDMODULE.

MODULE check_airline INPUT.
  SELECT SINGLE @abap_true FROM scarr WHERE carrid = @gs_flight-carrid INTO @DATA(lv_ok).
  IF sy-subrc <> 0.
    MESSAGE 'Airline does not exist' TYPE 'E'.   " reopens only that field for correction
  ENDIF.
ENDMODULE.

MODULE user_command_0100 INPUT.
  DATA(lv_ok_code) = gv_okcode.
  CLEAR gv_okcode.                 " always clear the OK code!
  CASE lv_ok_code.
    WHEN 'BACK' OR 'EXIT' OR 'CANC'.
      LEAVE TO SCREEN 0.           " go back
    WHEN 'READ'.
      SELECT SINGLE * FROM sflight
        WHERE carrid = @gs_flight-carrid AND connid = @gs_flight-connid
        INTO @gs_flight.
    WHEN 'NEXT'.
      CALL SCREEN 200.
  ENDCASE.
ENDMODULE.
```

Dynpro fields are linked to ABAP variables **with the same name**: values are transported automatically from PBO → screen and from screen → PAI.

### GUI status and title (SE41)

The **GUI status** defines the menu bar, the buttons of the standard toolbar (Back F3, Exit Shift+F3, Cancel F12, Save Ctrl+S), and those of the application toolbar. Every button has a **function code** (for example `'SAVE'`) that ends up in the OK_CODE. Exit buttons must be marked as type "E" to trigger `AT EXIT-COMMAND`.

### Navigate between screens

| Statement                                                  | Effect                        |
| ---------------------------------------------------------- | ----------------------------- |
| `CALL SCREEN 200.`                                         | opens 200 and then comes back |
| `CALL SCREEN 300 STARTING AT 10 5.`                        | opens it as a popup           |
| `SET SCREEN 200. LEAVE SCREEN.` (or `LEAVE TO SCREEN 200`) | moves to 200 with no return   |
| `LEAVE TO SCREEN 0.`                                       | returns to the calling point  |
| `LEAVE PROGRAM.`                                           | exits the program             |

To start a module pool, you create a **dialog transaction** in SE93 (program + initial screen number).

## Hour 4 – Advanced Dynpro

### Table control

A **table control** shows an internal table on a Dynpro, with scrolling:

```abap
* In the program
CONTROLS tc_flights TYPE TABLEVIEW USING SCREEN 0200.
DATA gt_flights TYPE STANDARD TABLE OF sflight.

* Flow logic of 0200
PROCESS BEFORE OUTPUT.
  MODULE status_0200.
  LOOP AT gt_flights INTO gs_flight WITH CONTROL tc_flights CURSOR tc_flights-current_line.
  ENDLOOP.

PROCESS AFTER INPUT.
  LOOP AT gt_flights.
    MODULE update_row.   " MODIFY gt_flights FROM gs_flight INDEX tc_flights-current_line
  ENDLOOP.
  MODULE user_command_0200.
```

The Screen Painter has a wizard that generates complete table controls. In many cases, an ALV in a container is simpler and more powerful.

### Subscreens and tabstrips

- A **subscreen** is a screen placed inside an area of another one (`CALL SUBSCREEN area INCLUDING sy-repid '0110'` in both PBO and PAI).
- A **tabstrip** is a set of tabs; each tab shows a subscreen (`CONTROLS ts_main TYPE TABSTRIP.`). Here too, the Screen Painter offers a wizard.

### Custom F4 help in a Dynpro

```abap
PROCESS ON VALUE-REQUEST.
  FIELD gs_flight-carrid MODULE f4_carrid.

MODULE f4_carrid INPUT.
  SELECT carrid, carrname FROM scarr INTO TABLE @DATA(lt_f4).
  CALL FUNCTION 'F4IF_INT_TABLE_VALUE_REQUEST'
    EXPORTING
      retfield    = 'CARRID'
      dynpprog    = sy-repid
      dynpnr      = sy-dynnr
      dynprofield = 'GS_FLIGHT-CARRID'
      value_org   = 'S'
    TABLES
      value_tab   = lt_f4.
ENDMODULE.
```

There's also `PROCESS ON HELP-REQUEST` for custom F1 help.

### Change fields dynamically

As with selection screens, in PBO you can use `LOOP AT SCREEN ... MODIFY SCREEN` to make fields invisible, mandatory, or read-only (for example "Display" mode versus "Change" mode).

### GUI controls

Besides the ALV, you can place other controls in a container: a text editor (`cl_gui_textedit`), a tree (`cl_salv_tree`, `cl_gui_alv_tree`), an HTML viewer (`cl_gui_html_viewer`), pictures (`cl_gui_picture`), charts. Every control lives in a container and communicates through events.

### Dynpro and the future

Dynpros **don't exist in ABAP Cloud** and aren't used for new Fiori-oriented S/4HANA development. Still, thousands of business transactions are Dynpros, and you'll have to maintain them. Today, a new user interface is preferably built with Fiori Elements + RAP (day 15).

## Exercises

> [!IMPORTANT]
>
> 1. Rewrite yesterday's report so it shows the result in a `CL_SALV_TABLE` ALV with all functions on, optimized columns, and a title.
> 2. Add sorting by airline with a subtotal of occupied seats and a grand total.
> 3. Add a traffic light column: red if the flight is full, yellow if more than 80% occupied, green otherwise. Color the `SEATSOCC` cell of full flights red.
> 4. Make the `CONNID` column a hotspot: on click, show the bookings (`SBOOK`) of that flight in a second popup ALV.
> 5. Create a module pool `SAPMZFLIGHTS` with a screen 0100 where the user enters airline and flight number, presses "Read", and sees the departure and arrival cities. Handle Back/Exit/Cancel and an error if the airline doesn't exist. Create the transaction `ZFLIGHTS_DIALOG`.
> 6. (Optional) Add a screen 0200 with an editable `CL_GUI_ALV_GRID` on the airline's flights and a "Save" button that shows how many rows changed.

## Quiz

1. What are the three ALV techniques, and when do you use each one?
2. Where does the ALV get the column labels from?
3. What is a field catalog?
4. What happens in the PBO and the PAI of a Dynpro?
5. What is `AT EXIT-COMMAND` for?
6. Why do you clear the OK_CODE in the PAI?
7. How are Dynpro fields linked to ABAP variables?

## Solutions

```abap
REPORT zes09_alv.

INCLUDE <icon>.

TYPES: BEGIN OF ty_out,
         light    TYPE icon_d,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         seatsmax TYPE s_seatsmax,
         seatsocc TYPE s_seatsocc,
         colors   TYPE lvc_t_scol,
       END OF ty_out.
DATA gt_out TYPE STANDARD TABLE OF ty_out WITH EMPTY KEY.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc FROM sflight
    INTO CORRESPONDING FIELDS OF TABLE @gt_out.

  LOOP AT gt_out ASSIGNING FIELD-SYMBOL(<o>).
    DATA(lv_perc) = COND decfloat34( WHEN <o>-seatsmax > 0
                                     THEN <o>-seatsocc * 100 / <o>-seatsmax ).
    <o>-light = COND #( WHEN lv_perc >= 100 THEN icon_red_light
                        WHEN lv_perc >= 80  THEN icon_yellow_light
                        ELSE icon_green_light ).
    IF lv_perc >= 100.
      <o>-colors = VALUE #( ( fname = 'SEATSOCC' color-col = col_negative ) ).
    ENDIF.
  ENDLOOP.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = gt_out ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_columns( )->set_color_column( 'COLORS' ).
      lo_alv->get_display_settings( )->set_list_header( 'Flight occupancy' ).
      lo_alv->get_sorts( )->add_sort( columnname = 'CARRID' subtotal = abap_true ).
      lo_alv->get_aggregations( )->add_aggregation( columnname = 'SEATSOCC' ).
      lo_alv->display( ).
    CATCH cx_salv_msg cx_salv_not_found cx_salv_data_error cx_salv_existing.
      MESSAGE 'ALV error' TYPE 'E'.
  ENDTRY.
```

Quiz:

1. `CL_SALV_TABLE` for read-only reports (the default); `CL_GUI_ALV_GRID` for editable grids on a Dynpro; `REUSE_ALV_*` in old code.
2. From the data elements of the ABAP Dictionary.
3. The table that describes the columns of an ALV (name, texts, properties).
4. The PBO prepares the screen before the user sees it; the PAI processes the input after a user action.
5. To run an exit module without checking the fields (so the user can leave even with wrong data).
6. Because otherwise the code would stay filled, and a simple Enter would repeat the last function.
7. By the same name: Dynpro field `GS_FLIGHT-CARRID` ↔ variable `gs_flight-carrid`.

> [!NOTE]
> Today you learned: the ALV in all its forms (SALV, GRID, REUSE), columns, sorting, totals, colors, and events; Dynpros with PBO/PAI, GUI status, navigation, table controls, subscreens, tabstrips, and F4. Tomorrow: object-oriented programming.
