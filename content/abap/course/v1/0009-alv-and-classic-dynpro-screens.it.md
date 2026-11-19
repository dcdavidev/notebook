---
title: ALV e schermate classiche (Dynpro)
description: Mostrare i dati in griglie professionali e costruire transazioni di dialogo.
---

_Settimana 2 · Livello intermedio · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------- |
| Ora 1  | ALV con `CL_SALV_TABLE`: visualizzazione base, funzioni, colonne                                     |
| Ora 2  | ALV avanzato: ordinamenti, totali, colori, eventi (doppio clic, pulsanti), REUSE e `CL_GUI_ALV_GRID` |
| Ora 3  | Dynpro: Screen Painter, PBO e PAI, campi, GUI status, OK_CODE                                        |
| Ora 4  | Dynpro avanzato: table control, subscreen, tabstrip, controlli, flusso tra schermate                 |

## Ora 1 – L'ALV: la griglia di SAP

**ALV** (_ABAP List Viewer_) è il componente standard per mostrare dati in tabella. Con poche righe l'utente ottiene una griglia con ordinamento, filtri, somme, esportazione in Excel, layout salvabili.

> [!TIP]
> Mostrare dati con `WRITE` è come scrivere a mano una tabella su un foglio. L'ALV è come passare a un foglio Excel: stessi dati, ma l'utente può ordinarli, filtrarli, sommarli e salvarli da solo, senza che tu scriva una riga in più.

Esistono tre "famiglie" di ALV:

| Tecnica                       | Caratteristiche                                                                   | Quando                                    |
| ----------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| `CL_SALV_TABLE` (SALV)        | orientata agli oggetti, semplicissima, sola lettura                               | la scelta di default per i report         |
| `CL_GUI_ALV_GRID`             | più potente, permette la modifica delle celle, va in un contenitore su una Dynpro | griglie modificabili, schermate complesse |
| `REUSE_ALV_GRID_DISPLAY` (FM) | vecchia, basata su moduli funzione, con field catalog                             | codice esistente                          |

Nel mondo Fiori le liste si fanno con Fiori Elements sopra servizi OData/RAP (giorno 15), ma l'ALV resta lo standard nella SAP GUI.

### Il primo ALV con CL_SALV_TABLE

```abap
REPORT zalv_base.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, price, currency, seatsmax, seatsocc
    FROM sflight
    INTO TABLE @DATA(gt_voli).

  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = DATA(lo_alv)
        CHANGING  t_table      = gt_voli ).
      lo_alv->display( ).
    CATCH cx_salv_msg INTO DATA(lx_err).
      MESSAGE lx_err TYPE 'E'.
  ENDTRY.
```

Questo è tutto: esegui e ottieni una griglia completa. Le etichette delle colonne vengono dal Dizionario Dati (per questo conviene tipizzare con elementi dati).

> [!WARNING]
> La tabella passata a `factory` deve esistere finché l'ALV è visibile: usa una variabile globale (o un attributo di classe), non una locale di un metodo che termina.

### Attivare le funzioni della barra

```abap
lo_alv->get_functions( )->set_all( abap_true ).   " ordina, filtra, somma, esporta, layout...
```

### Lavorare sulle colonne

```abap
DATA(lo_cols) = lo_alv->get_columns( ).
lo_cols->set_optimize( abap_true ).                                  " larghezza automatica

TRY.
    DATA(lo_col) = CAST cl_salv_column_table( lo_cols->get_column( 'SEATSMAX' ) ).
    lo_col->set_long_text( 'Posti totali' ).
    lo_col->set_medium_text( 'Posti tot.' ).
    lo_col->set_short_text( 'Posti' ).

    lo_cols->get_column( 'CURRENCY' )->set_visible( abap_false ).    " nascondere
    lo_cols->get_column( 'CARRID' )->set_output_length( 6 ).
    lo_cols->set_column_position( columnname = 'PRICE' position = 2 ).
  CATCH cx_salv_not_found.
ENDTRY.
```

### Titolo, layout salvabili, strisce

```abap
lo_alv->get_display_settings( )->set_list_header( 'Elenco voli' ).
lo_alv->get_display_settings( )->set_striped_pattern( abap_true ).

DATA(lo_layout) = lo_alv->get_layout( ).
lo_layout->set_key( VALUE #( report = sy-repid ) ).
lo_layout->set_save_restriction( if_salv_c_layout=>restrict_none ).  " l'utente salva i suoi layout
lo_layout->set_default( abap_true ).
```

### ALV a popup e a schermo intero

```abap
lo_alv->set_screen_popup( start_column = 10 end_column = 100
                          start_line   = 5  end_line   = 20 ).
```

## Ora 2 – ALV avanzato

### Ordinamento, subtotali e totali

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

### Colori e icone

Per colorare righe o celle aggiungi alla struttura dati una colonna di tipo `lvc_t_scol` (tabella di colori) e comunicala all'ALV:

```abap
TYPES: BEGIN OF ty_out,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         seatsocc TYPE s_seatsocc,
         seatsmax TYPE s_seatsmax,
         stato    TYPE icon_d,       " icona semaforo
         colori   TYPE lvc_t_scol,   " colori per cella
       END OF ty_out.
DATA gt_out TYPE STANDARD TABLE OF ty_out WITH EMPTY KEY.

LOOP AT gt_out ASSIGNING FIELD-SYMBOL(<o>).
  IF <o>-seatsocc >= <o>-seatsmax.
    <o>-stato  = icon_red_light.
    <o>-colori = VALUE #( ( fname = 'SEATSOCC' color-col = col_negative ) ).
  ELSE.
    <o>-stato = icon_green_light.
  ENDIF.
ENDLOOP.

" dopo factory:
lo_alv->get_columns( )->set_color_column( 'COLORI' ).
```

Le costanti `icon_...` vengono dall'include `<icon>` (aggiungi `INCLUDE <icon>.` nel report se servono); i colori `col_...` sono costanti di sistema (`COL_POSITIVE` verde, `COL_NEGATIVE` rosso, `COL_TOTAL` giallo, `COL_HEADING` blu...).

### Hotspot e doppio clic: gli eventi

Per reagire alle azioni dell'utente si usa un **gestore di eventi**, cioè una classe locale con un metodo registrato sull'evento (le classi le studi domani: qui segui lo schema).

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
    DATA(ls_volo) = gt_voli[ row ].
    MESSAGE |Hai cliccato il volo { ls_volo-carrid } { ls_volo-connid }| TYPE 'I'.
  ENDMETHOD.

  METHOD on_link_click.
    DATA(ls_volo) = gt_voli[ row ].
    SET PARAMETER ID 'CAR' FIELD ls_volo-carrid.
    CALL TRANSACTION 'SE16N'.
  ENDMETHOD.
ENDCLASS.

* dopo factory:
CAST cl_salv_column_table( lo_alv->get_columns( )->get_column( 'CONNID' )
  )->set_cell_type( if_salv_c_cell_type=>hotspot ).
SET HANDLER lcl_handler=>on_double_click FOR lo_alv->get_event( ).
SET HANDLER lcl_handler=>on_link_click FOR lo_alv->get_event( ).
```

### Pulsanti propri sulla barra

In modalità a schermo intero si copia il GUI status standard `SALV_STANDARD` dal programma `SALV_DEMO_TABLE_FUNCTIONS` (in SE41 / SE80) nel tuo programma, si aggiungono i pulsanti e poi:

```abap
lo_alv->set_screen_status( pfstatus      = 'ZSTATUS'
                           report        = sy-repid
                           set_functions = lo_alv->c_functions_all ).
" e si gestisce l'evento added_function OF cl_salv_events con il parametro e_salv_function
```

### Selezione di righe

```abap
lo_alv->get_selections( )->set_selection_mode( if_salv_c_selection_mode=>row_column ).
" dopo l'azione dell'utente:
DATA(lt_righe_sel) = lo_alv->get_selections( )->get_selected_rows( ).
```

### La vecchia scuola: REUSE_ALV_GRID_DISPLAY e field catalog

Nel codice esistente troverai spesso:

```abap
DATA lt_fcat TYPE slis_t_fieldcat_alv.
lt_fcat = VALUE #(
  ( fieldname = 'CARRID' seltext_m = 'Compagnia' key = 'X' )
  ( fieldname = 'CONNID' seltext_m = 'Volo' )
  ( fieldname = 'PRICE'  seltext_m = 'Prezzo' do_sum = 'X' ) ).

CALL FUNCTION 'REUSE_ALV_GRID_DISPLAY'
  EXPORTING
    i_callback_program = sy-repid
    it_fieldcat        = lt_fcat
    is_layout          = VALUE slis_layout_alv( zebra = 'X' colwidth_optimize = 'X' )
  TABLES
    t_outtab           = gt_voli.
```

Il **field catalog** è la tabella che descrive le colonne (nome, testo, larghezza, somma, chiave...). Si può generare dal DDIC con `REUSE_ALV_FIELDCATALOG_MERGE` o `LVC_FIELDCATALOG_MERGE`.

### ALV modificabile: CL_GUI_ALV_GRID

`CL_GUI_ALV_GRID` vive dentro un **contenitore** su una Dynpro (vedi Ora 3). Permette celle editabili:

```abap
DATA go_cont TYPE REF TO cl_gui_custom_container.
DATA go_grid TYPE REF TO cl_gui_alv_grid.

go_cont = NEW #( container_name = 'CC_ALV' ).   " area disegnata sulla Dynpro
go_grid = NEW #( i_parent = go_cont ).

DATA(lt_fcat) = VALUE lvc_t_fcat(
  ( fieldname = 'CARRID' ref_table = 'SFLIGHT' )
  ( fieldname = 'PRICE'  ref_table = 'SFLIGHT' edit = abap_true ) ).

go_grid->set_table_for_first_display(
  EXPORTING is_layout       = VALUE #( zebra = abap_true cwidth_opt = abap_true )
  CHANGING  it_outtab       = gt_voli
            it_fieldcatalog = lt_fcat ).

* Dopo le modifiche dell'utente
go_grid->check_changed_data( ).      " trasferisce le modifiche in gt_voli
go_grid->refresh_table_display( ).
```

Esiste anche `cl_gui_docking_container` (si aggancia ai bordi dello schermo senza dover disegnare un'area).

## Ora 3 – Le Dynpro (schermate classiche)

Una **Dynpro** (_dynamic program_) è una schermata disegnata a mano, con campi, pulsanti, tabelle. È la tecnologia delle transazioni classiche come VA01 o ME21N. I programmi che contengono principalmente Dynpro si chiamano **module pool** (tipo M, nome `SAPMZ...`), ma le Dynpro possono stare anche in report e gruppi funzioni.

> [!TIP]
> Una Dynpro è come uno sportello con un modulo da compilare. Prima che l'utente lo veda, l'impiegato prepara il modulo (**PBO**: _Process Before Output_). Quando l'utente lo restituisce, l'impiegato lo controlla e decide cosa fare (**PAI**: _Process After Input_).

### Gli elementi di una Dynpro

| Elemento         | Descrizione                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| Numero           | 4 cifre (es. 0100)                                                           |
| Attributi        | tipo (normale, subscreen, popup), schermata successiva                       |
| Layout           | disegnato con lo Screen Painter (SE51): campi, etichette, pulsanti, riquadri |
| Lista elementi   | tutti i campi, incluso OK_CODE (il codice del pulsante premuto)              |
| Logica di flusso | `PROCESS BEFORE OUTPUT` / `PROCESS AFTER INPUT` con chiamate ai `MODULE`     |

### La logica di flusso

```abap
PROCESS BEFORE OUTPUT.
  MODULE status_0100.                         " imposta GUI status e titolo
  MODULE prepara_dati_0100.

PROCESS AFTER INPUT.
  MODULE exit_command_0100 AT EXIT-COMMAND.   " Indietro/Esci/Annulla senza controlli
  FIELD gs_volo-carrid MODULE controlla_compagnia ON REQUEST.
  CHAIN.
    FIELD: gs_volo-fldate, gs_volo-price.
    MODULE controlla_data_prezzo.             " se dà errore, riapre entrambi i campi
  ENDCHAIN.
  MODULE user_command_0100.
```

Questo linguaggio (logica di flusso) **non è ABAP**: ha solo poche istruzioni (`MODULE`, `FIELD`, `CHAIN`, `LOOP`, `CALL SUBSCREEN`). I `MODULE` invece sono scritti in ABAP nel programma.

### Il programma ABAP

```abap
PROGRAM sapmzvoli.

TABLES sflight.                    " collega i campi della Dynpro alla struttura
                                   " (unico uso ancora ammesso di TABLES)
DATA gs_volo   TYPE sflight.
DATA gv_okcode TYPE sy-ucomm.      " nella lista elementi, il campo OK si chiama GV_OKCODE

MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.     " barra dei menu e pulsanti (creata con SE41)
  SET TITLEBAR 'TITLE_0100'.
ENDMODULE.

MODULE exit_command_0100 INPUT.
  LEAVE PROGRAM.
ENDMODULE.

MODULE controlla_compagnia INPUT.
  SELECT SINGLE @abap_true FROM scarr WHERE carrid = @gs_volo-carrid INTO @DATA(lv_ok).
  IF sy-subrc <> 0.
    MESSAGE 'Compagnia inesistente' TYPE 'E'.   " riapre solo il campo per la correzione
  ENDIF.
ENDMODULE.

MODULE user_command_0100 INPUT.
  DATA(lv_ok_code) = gv_okcode.
  CLEAR gv_okcode.                 " svuotare sempre l'OK code!
  CASE lv_ok_code.
    WHEN 'BACK' OR 'EXIT' OR 'CANC'.
      LEAVE TO SCREEN 0.           " torna indietro
    WHEN 'LEGGI'.
      SELECT SINGLE * FROM sflight
        WHERE carrid = @gs_volo-carrid AND connid = @gs_volo-connid
        INTO @gs_volo.
    WHEN 'AVANTI'.
      CALL SCREEN 200.
  ENDCASE.
ENDMODULE.
```

I campi della Dynpro vengono collegati alle variabili ABAP **con lo stesso nome**: il trasporto dei valori avviene in automatico tra PBO → schermo e schermo → PAI.

### GUI status e titolo (SE41)

Il **GUI status** definisce la barra dei menu, i pulsanti della barra degli strumenti standard (Indietro F3, Esci Shift+F3, Annulla F12, Salva Ctrl+S) e quelli della barra applicativa. Ogni pulsante ha un **codice funzione** (es. `'SAVE'`) che finisce nell'OK_CODE. I pulsanti di uscita vanno marcati come tipo "E" per far scattare `AT EXIT-COMMAND`.

### Navigare tra le schermate

| Istruzione                                                | Effetto                      |
| --------------------------------------------------------- | ---------------------------- |
| `CALL SCREEN 200.`                                        | apre la 200 e poi torna      |
| `CALL SCREEN 300 STARTING AT 10 5.`                       | apre come popup              |
| `SET SCREEN 200. LEAVE SCREEN.` (o `LEAVE TO SCREEN 200`) | passa alla 200 senza ritorno |
| `LEAVE TO SCREEN 0.`                                      | torna al punto di chiamata   |
| `LEAVE PROGRAM.`                                          | esce dal programma           |

Per avviare un module pool si crea una **transazione di dialogo** in SE93 (programma + numero schermata iniziale).

## Ora 4 – Dynpro avanzate

### Table control

Un **table control** mostra una tabella interna su una Dynpro con scorrimento:

```abap
* Nel programma
CONTROLS tc_voli TYPE TABLEVIEW USING SCREEN 0200.
DATA gt_voli TYPE STANDARD TABLE OF sflight.

* Logica di flusso della 0200
PROCESS BEFORE OUTPUT.
  MODULE status_0200.
  LOOP AT gt_voli INTO gs_volo WITH CONTROL tc_voli CURSOR tc_voli-current_line.
  ENDLOOP.

PROCESS AFTER INPUT.
  LOOP AT gt_voli.
    MODULE aggiorna_riga.   " MODIFY gt_voli FROM gs_volo INDEX tc_voli-current_line
  ENDLOOP.
  MODULE user_command_0200.
```

Lo Screen Painter ha un assistente (wizard) per generare table control completi. In molti casi un ALV su contenitore è più semplice e potente.

### Subscreen e tabstrip

- Una **subscreen** è una schermata inserita dentro un'area di un'altra (`CALL SUBSCREEN area INCLUDING sy-repid '0110'` sia in PBO sia in PAI).
- Un **tabstrip** è un insieme di schede; ogni scheda mostra una subscreen (`CONTROLS ts_main TYPE TABSTRIP.`). Anche qui lo Screen Painter offre un wizard.

### Aiuti F4 personalizzati in una Dynpro

```abap
PROCESS ON VALUE-REQUEST.
  FIELD gs_volo-carrid MODULE f4_carrid.

MODULE f4_carrid INPUT.
  SELECT carrid, carrname FROM scarr INTO TABLE @DATA(lt_f4).
  CALL FUNCTION 'F4IF_INT_TABLE_VALUE_REQUEST'
    EXPORTING
      retfield    = 'CARRID'
      dynpprog    = sy-repid
      dynpnr      = sy-dynnr
      dynprofield = 'GS_VOLO-CARRID'
      value_org   = 'S'
    TABLES
      value_tab   = lt_f4.
ENDMODULE.
```

Esiste anche `PROCESS ON HELP-REQUEST` per F1 personalizzato.

### Modificare dinamicamente i campi

Come per le selezioni, in PBO puoi usare `LOOP AT SCREEN ... MODIFY SCREEN` per rendere campi invisibili, obbligatori o di sola lettura (es. modalità "Visualizza" contro "Modifica").

### Controlli GUI

Oltre all'ALV, su un contenitore si possono mettere altri controlli: editor di testo (`cl_gui_textedit`), albero (`cl_salv_tree`, `cl_gui_alv_tree`), visualizzatore HTML (`cl_gui_html_viewer`), immagini (`cl_gui_picture`), grafici. Ogni controllo vive in un contenitore e comunica con eventi.

### Dynpro e il futuro

Le Dynpro **non esistono in ABAP Cloud** e non si usano per nuovi sviluppi S/4HANA orientati a Fiori. Tuttavia migliaia di transazioni aziendali sono Dynpro e dovrai manutenerle. Oggi una nuova interfaccia si costruisce di preferenza con Fiori Elements + RAP (giorno 15).

## Esercizi

> [!IMPORTANT]
>
> 1. Riscrivi il report di ieri mostrando il risultato in un ALV `CL_SALV_TABLE` con tutte le funzioni attive, ottimizzazione colonne e un titolo.
> 2. Aggiungi un ordinamento per compagnia con subtotale dei posti occupati e un totale generale.
> 3. Aggiungi una colonna semaforo: rosso se il volo è pieno, giallo se occupato oltre l'80%, verde altrimenti. Colora in rosso la cella `SEATSOCC` dei voli pieni.
> 4. Rendi la colonna `CONNID` un hotspot: al clic mostra in un secondo ALV a popup le prenotazioni (`SBOOK`) di quel volo.
> 5. Crea un module pool `SAPMZVOLI` con una schermata 0100 dove l'utente inserisce compagnia e numero volo, preme "Leggi" e vede città di partenza e arrivo. Gestisci Indietro/Esci/Annulla e un errore se la compagnia non esiste. Crea la transazione `ZVOLI_DIALOG`.
> 6. (Facoltativo) Aggiungi una schermata 0200 con un ALV modificabile `CL_GUI_ALV_GRID` sui voli della compagnia e un pulsante "Salva" che mostra quante righe sono cambiate.

## Quiz

1. Quali sono le tre tecniche ALV e quando usare ciascuna?
2. Da dove prende l'ALV le etichette delle colonne?
3. Che cos'è un field catalog?
4. Che cosa succede nel PBO e nel PAI di una Dynpro?
5. A che cosa serve `AT EXIT-COMMAND`?
6. Perché si svuota l'OK_CODE nel PAI?
7. Come si collegano i campi della Dynpro alle variabili ABAP?

## Soluzioni

```abap
REPORT zes09_alv.

INCLUDE <icon>.

TYPES: BEGIN OF ty_out,
         semaforo TYPE icon_d,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         seatsmax TYPE s_seatsmax,
         seatsocc TYPE s_seatsocc,
         colori   TYPE lvc_t_scol,
       END OF ty_out.
DATA gt_out TYPE STANDARD TABLE OF ty_out WITH EMPTY KEY.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc FROM sflight
    INTO CORRESPONDING FIELDS OF TABLE @gt_out.

  LOOP AT gt_out ASSIGNING FIELD-SYMBOL(<o>).
    DATA(lv_perc) = COND decfloat34( WHEN <o>-seatsmax > 0
                                     THEN <o>-seatsocc * 100 / <o>-seatsmax ).
    <o>-semaforo = COND #( WHEN lv_perc >= 100 THEN icon_red_light
                           WHEN lv_perc >= 80  THEN icon_yellow_light
                           ELSE icon_green_light ).
    IF lv_perc >= 100.
      <o>-colori = VALUE #( ( fname = 'SEATSOCC' color-col = col_negative ) ).
    ENDIF.
  ENDLOOP.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = gt_out ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_columns( )->set_color_column( 'COLORI' ).
      lo_alv->get_display_settings( )->set_list_header( 'Occupazione voli' ).
      lo_alv->get_sorts( )->add_sort( columnname = 'CARRID' subtotal = abap_true ).
      lo_alv->get_aggregations( )->add_aggregation( columnname = 'SEATSOCC' ).
      lo_alv->display( ).
    CATCH cx_salv_msg cx_salv_not_found cx_salv_data_error cx_salv_existing.
      MESSAGE 'Errore ALV' TYPE 'E'.
  ENDTRY.
```

Quiz:

1. `CL_SALV_TABLE` per report in sola lettura (default); `CL_GUI_ALV_GRID` per griglie modificabili su Dynpro; `REUSE_ALV_*` nel codice vecchio.
2. Dagli elementi dati del Dizionario Dati.
3. La tabella che descrive le colonne di un ALV (nome, testi, proprietà).
4. Il PBO prepara la schermata prima che l'utente la veda; il PAI elabora l'input dopo un'azione dell'utente.
5. A eseguire un modulo di uscita senza fare i controlli sui campi (per permettere di uscire anche con dati errati).
6. Perché altrimenti il codice resterebbe valorizzato e un semplice Invio ripeterebbe l'ultima funzione.
7. Con lo stesso nome: campo Dynpro `GS_VOLO-CARRID` ↔ variabile `gs_volo-carrid`.

> [!NOTE]
> Oggi hai imparato: l'ALV in tutte le sue forme (SALV, GRID, REUSE), colonne, ordinamenti, totali, colori, eventi; le Dynpro con PBO/PAI, GUI status, navigazione, table control, subscreen, tabstrip e F4. Domani: la programmazione a oggetti.
