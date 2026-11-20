---
title: 'Schermate di selezione: PARAMETERS'
description: Campi di input, checkbox, radio button e list box.
---

_Livello base_

La maggior parte dei report comincia chiedendo all'utente che cosa fare: quale compagnia, quale data, se mostrare una lista o una griglia. La schermata in cui inserisce questi valori è la **schermata di selezione**. In un report non la disegni: dichiari i suoi campi nel codice, e il sistema costruisce la schermata per te.

`PARAMETERS` dichiara un singolo campo di input. Le sue aggiunte lo trasformano in un campo obbligatorio, in una checkbox, in un gruppo di radio button o in una list box.

## Il tuo primo parametro

```abap
REPORT zparameters_demo.

PARAMETERS p_carr TYPE s_carr_id.

START-OF-SELECTION.
  WRITE: / 'Hai scelto', p_carr.
```

Esegui il report: prima di `START-OF-SELECTION` il sistema mostra una schermata di selezione con un campo. Quando l'utente preme **Esegui** (F8), il valore è in `p_carr` e il programma prosegue.

- Un parametro è una variabile globale che la schermata di selezione riempie.
- Il suo nome può avere al massimo **8 caratteri**. Il prefisso `p_` è la convenzione abituale.
- Se lo tipizzi con un elemento dati come `S_CARR_ID`, il campo ottiene l'aiuto F4, la documentazione F1 e, con un testo di selezione, l'etichetta dell'elemento dati (vedi [Simboli di testo e traduzione](./0062-text-symbols-and-translation.it.md)).

> [!TIP]
> Una schermata di selezione è come il modulo alla reception di un albergo. Prima di avere la chiave compili nome, date e tipo di camera. Il receptionist (il programma) si mette al lavoro solo dopo che hai consegnato il modulo.

## Aggiunte utili

```abap
PARAMETERS:
  p_carr  TYPE s_carr_id OBLIGATORY DEFAULT 'LH',   " obbligatorio, con un default
  p_date  TYPE s_date DEFAULT sy-datum,             " la data di oggi
  p_max   TYPE i DEFAULT 100,
  p_city  TYPE s_city LOWER CASE,                   " mantiene le minuscole
  p_conn  TYPE spfli-connid MEMORY ID con,          " parametro della memoria SAP
  p_carr2 TYPE spfli-carrid VALUE CHECK.            " controllato su SCARR
```

| Aggiunta        | Effetto                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `OBLIGATORY`    | l'utente non può eseguire il report con il campo vuoto                                                                         |
| `DEFAULT val`   | il valore iniziale; può essere un letterale o un campo di sistema come `sy-datum`                                              |
| `LOWER CASE`    | mantiene le lettere minuscole; senza, l'input viene convertito in maiuscolo                                                    |
| `MEMORY ID pid` | propone e salva il valore nella memoria SAP con un ID parametro (vedi [memoria SAP](./0072-calling-programs-and-memory.it.md)) |
| `VALUE CHECK`   | controlla l'input con la tabella di controllo o i valori fissi di un campo del Dizionario                                      |
| `NO-DISPLAY`    | il campo non viene mostrato; utile quando un altro programma lo riempie con `SUBMIT`                                           |

`VALUE CHECK` funziona solo quando il tipo fa riferimento a un campo di tabella con una chiave esterna, come `spfli-carrid`: il sistema rifiuta allora una compagnia che non è in `SCARR`.

> [!WARNING]
> Senza `LOWER CASE`, tutto quello che l'utente scrive viene convertito in maiuscolo. È quello che vuoi per i codici come `LH`, ma rovina le ricerche su nomi o indirizzi email. Aggiungi `LOWER CASE` ai campi di testo libero.

## Le checkbox

`AS CHECKBOX` trasforma un parametro in una checkbox. Il parametro ha tipo `c` di lunghezza 1: `'X'` (`abap_true`) quando è selezionata, vuoto quando non lo è.

```abap
PARAMETERS p_test AS CHECKBOX DEFAULT 'X'.   " esecuzione di prova

START-OF-SELECTION.
  IF p_test = abap_true.
    WRITE: / 'Esecuzione di prova: non viene salvato niente'.
  ENDIF.
```

## I radio button

`RADIOBUTTON GROUP` crea un gruppo di radio button: l'utente può selezionarne esattamente uno. Tutti i pulsanti del gruppo hanno lo stesso nome di gruppo, di al massimo 4 caratteri. È selezionato il primo, a meno che tu non imposti `DEFAULT 'X'` su un altro.

```abap
PARAMETERS:
  p_list RADIOBUTTON GROUP out DEFAULT 'X',
  p_alv  RADIOBUTTON GROUP out,
  p_file RADIOBUTTON GROUP out.

START-OF-SELECTION.
  CASE abap_true.
    WHEN p_list. WRITE: / 'Output come lista'.
    WHEN p_alv.  WRITE: / 'Output come griglia'.
    WHEN p_file. WRITE: / 'Output su file'.
  ENDCASE.
```

`CASE abap_true` con `WHEN p_...` è un modo comune e leggibile per trovare il pulsante selezionato.

## Le list box

`AS LISTBOX VISIBLE LENGTH n` mostra un elenco a discesa. Se il tipo del parametro è un elemento dati il cui dominio ha valori fissi, l'elenco viene riempito automaticamente con quelli. Altrimenti lo riempi con il modulo funzione `VRM_SET_VALUES` prima che la schermata venga mostrata, nell'evento `AT SELECTION-SCREEN OUTPUT` (vedi [Gli eventi dei report](./0066-report-events.it.md)):

```abap
PARAMETERS p_class TYPE s_class AS LISTBOX VISIBLE LENGTH 15 DEFAULT 'Y'.

AT SELECTION-SCREEN OUTPUT.
  DATA(lt_values) = VALUE vrm_values( ( key = 'Y' text = 'Economy' )
                                      ( key = 'C' text = 'Business' )
                                      ( key = 'F' text = 'Prima classe' ) ).
  CALL FUNCTION 'VRM_SET_VALUES'
    EXPORTING
      id     = 'P_CLASS'                   " il nome del parametro, in maiuscolo
      values = lt_values.

START-OF-SELECTION.
  WRITE: / 'Classe:', p_class.
```

L'utente vede i testi; il parametro riceve la chiave. Blocchi, cornici e le altre opzioni di layout sono trattati in [Il layout della schermata di selezione](./0065-selection-screen-layout.it.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report con un parametro obbligatorio per la compagnia (default `LH`), un parametro per il numero massimo di righe (default 20) e una checkbox "solo voli con posti liberi".
> 2. Leggi `SFLIGHT` con questi valori e stampa il risultato.

### Soluzione

```abap
REPORT zparameters_exercise.

PARAMETERS:
  p_carr TYPE s_carr_id OBLIGATORY DEFAULT 'LH',
  p_max  TYPE i DEFAULT 20,
  p_free AS CHECKBOX.

START-OF-SELECTION.
  SELECT connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid = @p_carr
    ORDER BY fldate
    INTO TABLE @DATA(lt_flights)
    UP TO @p_max ROWS.

  LOOP AT lt_flights INTO DATA(ls_flight).
    IF p_free = abap_true AND ls_flight-seatsocc >= ls_flight-seatsmax.
      CONTINUE.
    ENDIF.
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc, ls_flight-seatsmax.
  ENDLOOP.
```

Siccome il ciclo filtra dopo la `SELECT`, possono comparire meno di `p_max` righe. Per evitarlo, quando la checkbox è selezionata esegui una seconda `SELECT` con `AND seatsocc < seatsmax` nella `WHERE`.

> [!NOTE]
>
> - `PARAMETERS` dichiara un campo di input nella schermata di selezione; il nome ha al massimo 8 caratteri.
> - Tipizza i parametri con elementi dati per avere F1, F4 ed etichette tradotte.
> - `OBLIGATORY`, `DEFAULT`, `LOWER CASE`, `MEMORY ID` e `VALUE CHECK` controllano l'input e i valori proposti.
> - `AS CHECKBOX` dà `'X'` o vuoto; `RADIOBUTTON GROUP` fa scegliere all'utente esattamente un'opzione.
> - `AS LISTBOX` usa i valori fissi del dominio o un elenco riempito con `VRM_SET_VALUES`.
