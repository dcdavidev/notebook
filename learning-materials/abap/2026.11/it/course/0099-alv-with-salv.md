---
title: ALV con CL_SALV_TABLE
description: Mostrare qualsiasi tabella interna come griglia professionale in poche righe.
---

_Livello intermedio_

L'**ALV** (ABAP List Viewer) è il modo standard per mostrare dati in forma di tabella in SAP GUI. Gli utenti hanno gratis ordinamento, filtri, totali, esportazione in Excel e layout salvati, e tu non scrivi nemmeno una `WRITE`.

La classe `CL_SALV_TABLE` è l'API ALV più semplice: le passi una tabella interna e lei fa il resto. Usala per qualsiasi lista in sola lettura. Quando ti servono celle modificabili o il pieno controllo della schermata, usa l'[ALV grid control](./0100-alv-grid-control.md).

## L'ALV minimo

Il metodo statico `factory` crea l'oggetto ALV per una tabella interna. `display` lo mostra a schermo intero.

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

L'ALV legge le intestazioni delle colonne dagli elementi dati del Dizionario ABAP, quindi le colonne di `SFLIGHT` hanno le loro etichette solite. I campi senza elemento dati (per esempio i campi calcolati) non hanno intestazione: impostala tu, come vedi più avanti.

> [!TIP]
> `CL_SALV_TABLE` è come il chiosco per stampare le foto: inserisci la scheda di memoria (la tua tabella interna), scegli qualche opzione e ricevi la stampa finita. Non puoi ridisegnare la foto, ma non ti serve.

## La barra degli strumenti e le impostazioni di visualizzazione

L'oggetto ALV ti dà un metodo getter per ogni gruppo di impostazioni. Chiamali prima di `display`.

```abap
" Tutte le funzioni standard: ordinamento, filtri, totali, esportazione, layout
lo_alv->get_functions( )->set_all( abap_true ).

" Righe alternate e un titolo
DATA(lo_display) = lo_alv->get_display_settings( ).
lo_display->set_striped_pattern( abap_true ).
lo_display->set_list_header( 'Voli' ).

" Permetti all'utente di salvare layout (ordine colonne, filtri, ordinamento)
DATA(lo_layout) = lo_alv->get_layout( ).
lo_layout->set_key( VALUE #( report = sy-repid ) ).
lo_layout->set_save_restriction( if_salv_c_layout=>restrict_none ).
```

| Getter                    | Classe                     | Che cosa imposti                          |
| ------------------------- | -------------------------- | ----------------------------------------- |
| `get_functions( )`        | `CL_SALV_FUNCTIONS_LIST`   | le funzioni della barra degli strumenti   |
| `get_display_settings( )` | `CL_SALV_DISPLAY_SETTINGS` | titolo, righe alternate                   |
| `get_columns( )`          | `CL_SALV_COLUMNS_TABLE`    | larghezza delle colonne e singole colonne |
| `get_sorts( )`            | `CL_SALV_SORTS`            | ordinamento iniziale e subtotali          |
| `get_aggregations( )`     | `CL_SALV_AGGREGATIONS`     | totali                                    |
| `get_layout( )`           | `CL_SALV_LAYOUT`           | layout salvati                            |
| `get_event( )`            | `CL_SALV_EVENTS_TABLE`     | eventi come il doppio clic                |

## Colonne, ordinamento e totali

```abap
TRY.
    DATA(lo_columns) = lo_alv->get_columns( ).
    lo_columns->set_optimize( abap_true ).            " larghezza adatta al contenuto

    DATA(lo_column) = lo_columns->get_column( 'SEATSMAX' ).
    lo_column->set_visible( abap_false ).             " nascosta, l'utente può mostrarla

    lo_column = lo_columns->get_column( 'SEATSOCC' ).
    lo_column->set_long_text( 'Posti occupati' ).
    lo_column->set_medium_text( 'Occupati' ).
    lo_column->set_short_text( 'Occ.' ).

    lo_alv->get_sorts( )->add_sort( columnname = 'CARRID' subtotal = abap_true ).
    lo_alv->get_aggregations( )->add_aggregation( 'SEATSOCC' ).
  CATCH cx_salv_not_found cx_salv_data_error cx_salv_existing.
    MESSAGE 'Impossibile applicare le impostazioni ALV' TYPE 'I'.
ENDTRY.
```

I nomi delle colonne sono sempre in maiuscolo. `get_column` solleva `CX_SALV_NOT_FOUND` se il nome è sbagliato. Il testo breve ha al massimo 10 caratteri, quello medio 20, quello lungo 40.

## Gli eventi: il doppio clic

Registra un metodo handler per gli eventi di `get_event( )`. Per un hotspot (una cella cliccabile) fai il cast della colonna a `CL_SALV_COLUMN_TABLE` e impostane il tipo di cella.

```abap
CLASS lcl_handler DEFINITION.
  PUBLIC SECTION.
    METHODS on_double_click
      FOR EVENT double_click OF cl_salv_events_table
      IMPORTING row column.
ENDCLASS.

CLASS lcl_handler IMPLEMENTATION.
  METHOD on_double_click.
    MESSAGE |Riga { row }, colonna { column }| TYPE 'I'.
  ENDMETHOD.
ENDCLASS.

" Dopo factory, prima di display:
DATA(lo_handler) = NEW lcl_handler( ).
DATA(lo_events) = lo_alv->get_event( ).
SET HANDLER lo_handler->on_double_click FOR lo_events.

" Facoltativo: rendi CONNID un hotspot (evento LINK_CLICK)
DATA(lo_connid) = CAST cl_salv_column_table(
  lo_alv->get_columns( )->get_column( 'CONNID' ) ).   " solleva CX_SALV_NOT_FOUND
lo_connid->set_cell_type( if_salv_c_cell_type=>hotspot ).
```

Per leggere la riga cliccata, tieni la tabella interna dove l'handler può vederla, per esempio come tabella globale o come attributo, e leggila con `lt_flights[ row ]`.

> [!WARNING]
> `CL_SALV_TABLE` non supporta celle modificabili. Online trovi vecchi trucchi per renderla modificabile; non usarli nel codice di produzione. Usa invece `CL_GUI_ALV_GRID`.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che mostra i collegamenti di `SPFLI` in una `CL_SALV_TABLE` con tutte le funzioni della barra degli strumenti e la larghezza delle colonne ottimizzata.
> 2. Ordina la lista per compagnia e nascondi la colonna `PERIOD`.
> 3. Con un doppio clic, mostra in un messaggio la città di partenza e di arrivo della riga.

### Soluzione

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
      MESSAGE 'Errore ALV' TYPE 'E'.
  ENDTRY.
```

> [!NOTE]
>
> - `cl_salv_table=>factory( )` costruisce un ALV per qualsiasi tabella interna; `display( )` lo mostra.
> - Le intestazioni vengono dagli elementi dati del Dizionario ABAP; imposta tu i testi per i campi che non ne hanno.
> - Ogni gruppo di impostazioni ha il suo getter: funzioni, visualizzazione, colonne, ordinamenti, aggregazioni, layout, eventi.
> - I nomi delle colonne sono in maiuscolo; intercetta `CX_SALV_NOT_FOUND` e le altre eccezioni `CX_SALV_*`.
> - `CL_SALV_TABLE` è in sola lettura: per le celle modificabili usa `CL_GUI_ALV_GRID`.
