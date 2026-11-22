---
title: ALV with CL_SALV_TABLE
description: Show any internal table as a professional grid in a few lines.
---

_Intermediate level_

The **ALV** (ABAP List Viewer) is the standard way to show tabular data in SAP GUI. Users get sorting, filters, totals, Excel export, and saved layouts for free, and you don't write a single `WRITE`.

The class `CL_SALV_TABLE` is the simplest ALV API: you hand it an internal table and it does the rest. Use it for any read-only list. When you need editable cells or full control over the screen, use the [ALV grid control](./0100-alv-grid-control.md).

## The minimal ALV

The static method `factory` creates the ALV object for an internal table. `display` shows it full screen.

```abap
REPORT zflight_salv.

START-OF-SELECTION.
  SELECT FROM sflight
    FIELDS carrid, connid, fldate, price, currency, seatsmax, seatsocc
    INTO TABLE @DATA(lt_flights)
    UP TO 200 ROWS.

  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = DATA(lo_alv)
        CHANGING  t_table      = lt_flights ).

      lo_alv->display( ).
    CATCH cx_salv_msg INTO DATA(lx_msg).
      MESSAGE lx_msg TYPE 'E'.
  ENDTRY.
```

The ALV reads the column headings from the Dictionary data elements of the fields, so `SFLIGHT` columns get their usual labels. Fields that have no data element (calculated fields, for example) get no heading: set one yourself, as shown below.

> [!TIP]
> `CL_SALV_TABLE` is like a photo printing kiosk: you put in the memory card (your internal table), pick a few options, and get back a finished print. You can't redraw the photo, but you don't need to.

## The toolbar and the display settings

The ALV object gives you a getter for each group of settings. Call them before `display`.

```abap
" All standard functions: sort, filter, totals, export, layouts
lo_alv->get_functions( )->set_all( abap_true ).

" Zebra stripes and a title
DATA(lo_display) = lo_alv->get_display_settings( ).
lo_display->set_striped_pattern( abap_true ).
lo_display->set_list_header( 'Flights' ).

" Let the user save layouts (column order, filters, sorting)
DATA(lo_layout) = lo_alv->get_layout( ).
lo_layout->set_key( VALUE #( report = sy-repid ) ).
lo_layout->set_save_restriction( if_salv_c_layout=>restrict_none ).
```

| Getter                    | Class                      | What you set                     |
| ------------------------- | -------------------------- | -------------------------------- |
| `get_functions( )`        | `CL_SALV_FUNCTIONS_LIST`   | the toolbar functions            |
| `get_display_settings( )` | `CL_SALV_DISPLAY_SETTINGS` | title, zebra stripes             |
| `get_columns( )`          | `CL_SALV_COLUMNS_TABLE`    | column widths and single columns |
| `get_sorts( )`            | `CL_SALV_SORTS`            | initial sorting and subtotals    |
| `get_aggregations( )`     | `CL_SALV_AGGREGATIONS`     | totals                           |
| `get_layout( )`           | `CL_SALV_LAYOUT`           | saved layouts                    |
| `get_event( )`            | `CL_SALV_EVENTS_TABLE`     | events such as double click      |

## Columns, sorting, and totals

```abap
TRY.
    DATA(lo_columns) = lo_alv->get_columns( ).
    lo_columns->set_optimize( abap_true ).            " width fits the content

    DATA(lo_column) = lo_columns->get_column( 'SEATSMAX' ).
    lo_column->set_visible( abap_false ).             " hidden, the user can show it

    lo_column = lo_columns->get_column( 'SEATSOCC' ).
    lo_column->set_long_text( 'Occupied seats' ).
    lo_column->set_medium_text( 'Occupied' ).
    lo_column->set_short_text( 'Occ.' ).

    lo_alv->get_sorts( )->add_sort( columnname = 'CARRID' subtotal = abap_true ).
    lo_alv->get_aggregations( )->add_aggregation( 'SEATSOCC' ).
  CATCH cx_salv_not_found cx_salv_data_error cx_salv_existing.
    MESSAGE 'ALV settings could not be applied' TYPE 'I'.
ENDTRY.
```

Column names are always in uppercase. `get_column` raises `CX_SALV_NOT_FOUND` if the name is wrong. The short text is at most 10 characters, the medium text 20, the long text 40.

## Events: double click

Register a handler method for the events of `get_event( )`. For a hotspot (a clickable cell) cast the column to `CL_SALV_COLUMN_TABLE` and set its cell type.

```abap
CLASS lcl_handler DEFINITION.
  PUBLIC SECTION.
    METHODS on_double_click
      FOR EVENT double_click OF cl_salv_events_table
      IMPORTING row column.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD on_double_click.
    MESSAGE |Row { row }, column { column }| TYPE 'I'.
  ENDMETHOD.
ENDCLASS.

 After factory, before display:
DATA(lo_handler) = NEW lcl_handler( ).
DATA(lo_events) = lo_alv->get_event( ).
SET HANDLER lo_handler->on_double_click FOR lo_events.

" Optional: make CONNID a hotspot (event LINK_CLICK)
DATA(lo_connid) = CAST cl_salv_column_table(
  lo_alv->get_columns( )->get_column( 'CONNID' ) ).   " raises CX_SALV_NOT_FOUND
lo_connid->set_cell_type( if_salv_c_cell_type=>hotspot ).
```

To read the clicked row, keep the internal table where the handler can see it, for example as a global table or an attribute, and read it with `lt_flights[ row ]`.

> [!WARNING]
> `CL_SALV_TABLE` doesn't support editable cells. You'll find old tricks online that make it editable; don't use them in production code. Use `CL_GUI_ALV_GRID` instead.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that shows the connections of `SPFLI` in a `CL_SALV_TABLE` with all toolbar functions and optimized column widths.
> 2. Sort the list by airline and hide the column `PERIOD`.
> 3. On a double click, show the departure and arrival city of the row in a message.

### Solution

```abap
REPORT zspfli_salv.

DATA gt_spfli TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.

CLASS lcl_handler DEFINITION.
  PUBLIC SECTION.
    METHODS on_double_click FOR EVENT double_click OF cl_salv_events_table
      IMPORTING row.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD on_double_click.
    DATA(ls_spfli) = gt_spfli[ row ].
    MESSAGE |{ ls_spfli-cityfrom } -> { ls_spfli-cityto }| TYPE 'I'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SELECT * FROM spfli INTO TABLE @gt_spfli.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = gt_spfli ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_columns( )->get_column( 'PERIOD' )->set_visible( abap_false ).
      lo_alv->get_sorts( )->add_sort( 'CARRID' ).

      DATA(lo_handler) = NEW lcl_handler( ).
      DATA(lo_events) = lo_alv->get_event( ).
      SET HANDLER lo_handler->on_double_click FOR lo_events.
      lo_alv->display( ).
    CATCH cx_salv_msg cx_salv_not_found cx_salv_existing cx_salv_data_error.
      MESSAGE 'ALV error' TYPE 'E'.
  ENDTRY.
```

> [!NOTE]
>
> - `cl_salv_table=>factory( )` builds an ALV for any internal table; `display( )` shows it.
> - Headings come from the Dictionary data elements; set texts yourself for fields without one.
> - Each group of settings has its getter: functions, display settings, columns, sorts, aggregations, layout, events.
> - Column names are in uppercase; catch `CX_SALV_NOT_FOUND` and the other `CX_SALV_*` exceptions.
> - `CL_SALV_TABLE` is read-only: for editable cells use `CL_GUI_ALV_GRID`.
