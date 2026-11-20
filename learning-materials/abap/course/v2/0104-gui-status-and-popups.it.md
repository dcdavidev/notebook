---
title: GUI status, titoli e popup
description: Menu, barre degli strumenti, tasti funzione e finestre di conferma.
---

_Livello intermedio_

Una schermata senza **GUI status** ha i pulsanti Indietro ed Esci grigi e nessun menu: l'utente è bloccato. Il GUI status definisce la barra dei menu, le barre degli strumenti e i tasti funzione di una schermata, e collega ognuno di essi a un codice funzione che arriva nell'[OK code](./0102-dynpro-flow-logic.it.md). Il **titolo** è il testo nella barra del titolo della finestra.

Qui vedi come costruirli entrambi con il **Menu Painter** e come chiedere una conferma all'utente con un popup standard.

## Le parti di un GUI status

Crei un GUI status nel Menu Painter (transazione `SE41`, oppure in `SE80` con un clic destro sul programma, **Crea > GUI status**). Ha queste parti:

| Parte                             | Contenuto                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Barra dei menu                    | fino a sei menu con le loro voci, per esempio Volo, Modifica, Vai a          |
| Barra degli strumenti standard    | le icone fisse in alto: Invio, Salva, Indietro, Esci, Annulla, Stampa, Trova |
| Barra degli strumenti applicativa | i tuoi pulsanti, con testo e icona, sotto il titolo                          |
| Tasti funzione                    | i tasti `F1`–`F12`, `Maiusc+F1`–`Maiusc+F12`, `Ctrl+...` e i loro codici     |

Ogni pulsante e voce di menu è un **codice funzione** (fino a 20 caratteri, di solito in maiuscolo): lo stesso codice può stare contemporaneamente in un menu, in una barra degli strumenti e su un tasto funzione. I codici abituali per la barra degli strumenti standard sono:

| Icona    | Tasto       | Codice funzione | Tipo funzione           |
| -------- | ----------- | --------------- | ----------------------- |
| Salva    | `Ctrl+S`    | `SAVE`          | normale                 |
| Indietro | `F3`        | `BACK`          | normale o `E` (uscita)  |
| Esci     | `Maiusc+F3` | `EXIT`          | `E` (comando di uscita) |
| Annulla  | `F12`       | `CANCEL`        | `E` (comando di uscita) |

Dai il tipo funzione `E` ai codici che devono funzionare anche quando l'input è sbagliato, e gestiscili in un modulo `AT EXIT-COMMAND` (vedi [i controlli di input](./0103-dynpro-input-checks.it.md)).

> [!TIP]
> Il GUI status è il cruscotto di un'auto: lo stesso comando, come accendere le luci, può stare su una leva, su un pulsante e in un comando vocale. Qualunque cosa usi il guidatore, l'auto riceve lo stesso segnale.

## Impostare status e titolo

Impostali entrambi in un modulo PBO. Lo status resta attivo finché non ne imposti un altro.

```abap
MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.
  SET TITLEBAR 'TITLE_0100' WITH scarr-carrid.   " &1 nel testo del titolo
ENDMODULE.
```

Il titolo lo crei in `SE80` (**Crea > Titolo GUI**) o con un doppio clic sul suo nome. I segnaposto `&1`–`&9` nel testo vengono sostituiti dai valori dopo `WITH`, per esempio "Compagnia &1".

Per disattivare alcune funzioni su una schermata, escludile a runtime:

```abap
DATA lt_excluded TYPE STANDARD TABLE OF sy-ucomm WITH EMPTY KEY.

IF gv_display_only = abap_true.
  lt_excluded = VALUE #( ( 'SAVE' ) ( 'DELETE' ) ).
ENDIF.
SET PF-STATUS 'STATUS_0100' EXCLUDING lt_excluded.
```

Le funzioni escluse diventano grigie o spariscono. Usa questa tecnica invece di creare un secondo status che differisce per un solo pulsante.

Anche i report possono avere un loro status: `SET PF-STATUS` in `START-OF-SELECTION` cambia la barra degli strumenti della lista, e i codici funzione arrivano in `AT USER-COMMAND`.

## I popup di conferma

Il modulo funzione `POPUP_TO_CONFIRM` mostra una finestra standard con una domanda e due o tre pulsanti.

```abap
DATA lv_answer TYPE c LENGTH 1.

CALL FUNCTION 'POPUP_TO_CONFIRM'
  EXPORTING
    titlebar              = 'Uscire dalla transazione'
    text_question         = 'Le modifiche andranno perse. Vuoi salvarle?'
    text_button_1         = 'Salva'
    icon_button_1         = 'ICON_SYSTEM_SAVE'
    text_button_2         = 'Scarta'
    default_button        = '1'
    display_cancel_button = abap_true
  IMPORTING
    answer                = lv_answer
  EXCEPTIONS
    text_not_found        = 1
    OTHERS                = 2.

CASE lv_answer.
  WHEN '1'.                      " Salva
    go_app->save( ).             " la tua logica di salvataggio
    LEAVE TO SCREEN 0.
  WHEN '2'.                      " Scarta
    LEAVE TO SCREEN 0.
  WHEN 'A'.                      " Annulla: resta sulla schermata
ENDCASE.
```

Chiama il popup solo quando ci sono modifiche non salvate: un popup che compare sempre finisce presto per essere chiuso senza leggerlo.

> [!WARNING]
> I popup hanno bisogno di un utente davanti a SAP GUI. In un job in background o in una chiamata RFC senza GUI, un popup fa fallire il programma. Non chiamarne mai uno da codice che può girare in background.

## Una finestra di dialogo tua

Quando i popup standard non bastano, disegna una schermata di tipo **Finestra di dialogo modale** e chiamala con una posizione e una dimensione:

```abap
CALL SCREEN 200 STARTING AT 10 5 ENDING AT 70 12.
```

Dalle un GUI status di tipo **Finestra di dialogo**, che ha solo una barra degli strumenti applicativa in basso, e lasciala con `LEAVE TO SCREEN 0`.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea il GUI status `STATUS_0100` per `SAPMZFLIGHT` con Salva (`SAVE`), Indietro (`BACK`), Esci (`EXIT`, tipo `E`) e Annulla (`CANCEL`, tipo `E`), e un titolo `TITLE_0100` con il testo "Compagnia &1".
> 2. Impostali entrambi nel PBO della schermata `0100`.
> 3. Con `BACK`, chiedi con `POPUP_TO_CONFIRM` se l'utente vuole davvero uscire; esci solo se la risposta è `'1'`.

### Soluzione

```abap
MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.
  SET TITLEBAR 'TITLE_0100' WITH scarr-carrid.
ENDMODULE.

MODULE user_command_0100 INPUT.
  gv_save_ok = ok_code.
  CLEAR ok_code.
  CASE gv_save_ok.
    WHEN 'BACK'.
      CALL FUNCTION 'POPUP_TO_CONFIRM'
        EXPORTING
          text_question         = 'Vuoi davvero uscire?'
          display_cancel_button = abap_false
        IMPORTING
          answer                = gv_answer          " globale, TYPE c LENGTH 1
        EXCEPTIONS
          OTHERS                = 1.
      IF gv_answer = '1'.
        LEAVE TO SCREEN 0.
      ENDIF.
  ENDCASE.
ENDMODULE.
```

> [!NOTE]
>
> - Un GUI status (`SE41`) definisce la barra dei menu, le barre degli strumenti standard e applicativa e i tasti funzione.
> - Ogni elemento attiva un codice funzione; dai il tipo `E` ai codici che devono saltare i controlli di input.
> - Imposta status e titolo nel PBO con `SET PF-STATUS` e `SET TITLEBAR ... WITH`; nascondi funzioni con `EXCLUDING`.
> - `POPUP_TO_CONFIRM` fa una domanda e restituisce `'1'`, `'2'` o `'A'` (annulla).
> - Non mostrare mai popup in codice che può girare in background.
