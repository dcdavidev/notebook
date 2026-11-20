---
title: Il layout della schermata di selezione
description: Blocchi, cornici, commenti e modifiche dinamiche dello schermo.
---

_Livello base_

Con [`PARAMETERS`](./0063-parameters.it.md) e [`SELECT-OPTIONS`](./0064-select-options-and-ranges.it.md) ottieni campi di input funzionanti, ma il runtime li impila uno sotto l'altro. Appena un report ha più di tre o quattro campi, la schermata diventa difficile da leggere.

L'istruzione `SELECTION-SCREEN` ti permette di organizzare i campi: raggrupparli in blocchi con cornice, aggiungere commenti e righe vuote, mettere più campi sulla stessa riga e mostrare o nascondere campi mentre l'utente lavora.

## Blocchi e cornici

Un **blocco** raggruppa campi correlati. Con `WITH FRAME` il blocco ha un bordo, e con `TITLE` il bordo ha un titolo, di solito un [simbolo di testo](./0062-text-symbols-and-translation.it.md).

```abap
REPORT zflight_selection.

DATA gv_carrid TYPE s_carr_id.
DATA gv_fldate TYPE s_date.

SELECTION-SCREEN BEGIN OF BLOCK b_sel WITH FRAME TITLE TEXT-t01.
  SELECT-OPTIONS s_carrid FOR gv_carrid.
  SELECT-OPTIONS s_fldate FOR gv_fldate.
SELECTION-SCREEN END OF BLOCK b_sel.

SELECTION-SCREEN BEGIN OF BLOCK b_out WITH FRAME TITLE TEXT-t02.
  PARAMETERS p_max TYPE i DEFAULT 100.
  PARAMETERS p_test AS CHECKBOX DEFAULT 'X'.
SELECTION-SCREEN END OF BLOCK b_out.
```

Crea i simboli di testo `T01` ("Selezione voli") e `T02` ("Opzioni di output") con **Passa a > Elementi di testo > Simboli di testo**. I blocchi si possono annidare, e ogni `BEGIN OF BLOCK` vuole il suo `END OF BLOCK` con lo stesso nome.

> [!TIP]
> I blocchi funzionano come le sezioni di un modulo cartaceo: "Dati anagrafici", "Indirizzo", "Pagamento". Ogni riquadro ha un'intestazione, e trovi il campo che ti serve senza leggere tutta la pagina.

## Commenti, righe vuote e linee

Queste aggiunte inseriscono testo e spazio tra i campi:

| Istruzione                                                 | Che cosa fa                                                      |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `SELECTION-SCREEN SKIP.`                                   | aggiunge una riga vuota (`SKIP 2` ne aggiunge due)               |
| `SELECTION-SCREEN ULINE.`                                  | traccia una linea orizzontale                                    |
| `SELECTION-SCREEN COMMENT /1(50) TEXT-c01.`                | scrive un testo su una nuova riga, colonna 1, largo 50 caratteri |
| `SELECTION-SCREEN COMMENT 1(20) TEXT-c02 FOR FIELD p_max.` | scrive un'etichetta legata a un campo (l'help F1 funziona)       |

```abap
SELECTION-SCREEN BEGIN OF BLOCK b_info WITH FRAME.
  SELECTION-SCREEN COMMENT /1(60) TEXT-c01.   " "Lascia vuota la compagnia per leggerle tutte"
  SELECTION-SCREEN SKIP.
  SELECTION-SCREEN ULINE.
SELECTION-SCREEN END OF BLOCK b_info.
```

La posizione `/1(60)` significa: nuova riga (`/`), colonna 1, lunghezza 60.

## Più campi sulla stessa riga

Tra `BEGIN OF LINE` e `END OF LINE` tutti gli elementi vanno sulla stessa riga. Dentro una riga il testo di selezione di un parametro non viene mostrato, quindi aggiungi tu l'etichetta con `COMMENT` e posizioni l'elemento successivo con `POSITION`.

```abap
SELECTION-SCREEN BEGIN OF LINE.
  SELECTION-SCREEN COMMENT 1(20) TEXT-c02 FOR FIELD p_from.
  PARAMETERS p_from TYPE s_from_cit.
  SELECTION-SCREEN COMMENT 40(5) TEXT-c03 FOR FIELD p_to.   " "a"
  SELECTION-SCREEN POSITION 46.
  PARAMETERS p_to TYPE s_to_city.
SELECTION-SCREEN END OF LINE.
```

> [!WARNING]
> Gli elementi sulla stessa riga non devono sovrapporsi. Se un commento è più largo dello spazio prima del campo successivo, il controllo di sintassi segnala un errore. Conta le colonne: `COMMENT 40(5)` finisce alla colonna 44, quindi il campo successivo può partire dalla 46.

## Mostrare e nascondere campi a runtime

Puoi modificare la schermata subito prima che venga visualizzata, nell'evento `AT SELECTION-SCREEN OUTPUT`. Assegna ai campi che vuoi controllare un **gruppo di modifica** con `MODIF ID`, poi scorri la tabella `SCREEN` e cambia gli attributi degli elementi che corrispondono.

```abap
PARAMETERS p_list RADIOBUTTON GROUP out DEFAULT 'X' USER-COMMAND out_changed.
PARAMETERS p_file RADIOBUTTON GROUP out.
PARAMETERS p_path TYPE string LOWER CASE MODIF ID fil.

AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN INTO DATA(ls_screen).
    IF ls_screen-group1 = 'FIL'.
      IF p_file = abap_true.
        ls_screen-active = '1'.     " mostra il campo
      ELSE.
        ls_screen-active = '0'.     " nasconde il campo
      ENDIF.
      MODIFY SCREEN FROM ls_screen.
    ENDIF.
  ENDLOOP.
```

- `USER-COMMAND` fa sì che il gruppo di radio button invii un codice funzione quando l'utente ci clicca: la schermata viene elaborata di nuovo e `AT SELECTION-SCREEN OUTPUT` gira, così il campo compare o sparisce subito.
- Il gruppo di modifica è salvato in maiuscolo in `group1`, quindi confronta con `'FIL'`.
- Altri campi utili di `SCREEN`: `input` (`'0'` rende il campo di sola lettura), `required` (`'1'` lo rende obbligatorio), `invisible`.

> [!WARNING]
> Modificare solo `ls_screen` non basta: devi riscriverlo con `MODIFY SCREEN`. E la modifica funziona solo in `AT SELECTION-SCREEN OUTPUT`; negli altri eventi il runtime ricostruisce la schermata e la tua modifica si perde.

L'ordine in cui girano gli eventi della schermata di selezione è spiegato in [gli eventi dei report](./0066-report-events.it.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Crea un report con due blocchi con cornice: "Selezione voli" con `SELECT-OPTIONS` per compagnia aerea e data del volo, e "Output" con due radio button, "Lista" e "File".
> 2. Aggiungi un parametro per il percorso del file, visibile solo quando è selezionato "File".
> 3. Metti in cima al primo blocco una riga di commento che spiega che cosa fa il report.

### Soluzione

```abap
REPORT zflight_layout.

DATA gv_carrid TYPE s_carr_id.
DATA gv_fldate TYPE s_date.

SELECTION-SCREEN BEGIN OF BLOCK b_sel WITH FRAME TITLE TEXT-t01.
  SELECTION-SCREEN COMMENT /1(60) TEXT-c01.
  SELECTION-SCREEN SKIP.
  SELECT-OPTIONS s_carrid FOR gv_carrid.
  SELECT-OPTIONS s_fldate FOR gv_fldate.
SELECTION-SCREEN END OF BLOCK b_sel.

SELECTION-SCREEN BEGIN OF BLOCK b_out WITH FRAME TITLE TEXT-t02.
  PARAMETERS p_list RADIOBUTTON GROUP out DEFAULT 'X' USER-COMMAND out_changed.
  PARAMETERS p_file RADIOBUTTON GROUP out.
  PARAMETERS p_path TYPE string LOWER CASE MODIF ID fil.
SELECTION-SCREEN END OF BLOCK b_out.

AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN INTO DATA(ls_screen).
    IF ls_screen-group1 = 'FIL'.
      IF p_file = abap_true.
        ls_screen-active = '1'.
      ELSE.
        ls_screen-active = '0'.
      ENDIF.
      MODIFY SCREEN FROM ls_screen.
    ENDIF.
  ENDLOOP.

START-OF-SELECTION.
  WRITE / 'Selezione completata.'.
```

> [!NOTE]
>
> - `SELECTION-SCREEN BEGIN OF BLOCK ... WITH FRAME TITLE` raggruppa i campi in un riquadro con cornice e titolo.
> - `SKIP`, `ULINE` e `COMMENT` aggiungono spazio, linee e testo; `/1(60)` significa nuova riga, colonna 1, lunghezza 60.
> - `BEGIN OF LINE` mette più elementi sulla stessa riga; aggiungi le etichette con `COMMENT ... FOR FIELD` e posiziona i campi con `POSITION`.
> - Per mostrare, nascondere o bloccare campi, usa `MODIF ID` e `LOOP AT SCREEN` con `MODIFY SCREEN` in `AT SELECTION-SCREEN OUTPUT`.
> - `USER-COMMAND` su radio button e checkbox aggiorna la schermata appena l'utente clicca.
