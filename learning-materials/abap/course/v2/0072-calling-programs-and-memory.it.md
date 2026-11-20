---
title: Chiamare programmi, memoria SAP e memoria ABAP
description: SUBMIT, CALL TRANSACTION, SET/GET PARAMETER, EXPORT/IMPORT.
---

_Livello base_

Un programma può avviare altri programmi: eseguire un report con `SUBMIT`, oppure aprire una transazione con `CALL TRANSACTION`. Spesso i due programmi devono condividere dei dati, per esempio per aprire una transazione già compilata con la compagnia aerea che l'utente ha appena selezionato.

ABAP ha due aree di memoria per questo, con nomi che si confondono facilmente: la **memoria SAP** e la **memoria ABAP**. Questa lezione mostra come chiamare i programmi e quando usare ciascuna memoria.

## Eseguire un report con SUBMIT

`SUBMIT` esegue un programma eseguibile. Con `AND RETURN`, il controllo torna al tuo programma quando il report chiamato finisce; senza, il tuo programma termina e viene sostituito da quello chiamato.

```abap
DATA lt_dates TYPE RANGE OF s_date.
lt_dates = VALUE #( ( sign = 'I' option = 'BT' low = '20260101' high = '20261231' ) ).

SUBMIT zflight_report
  WITH p_carrid = 'LH'          " valorizza un parametro
  WITH s_fldate IN lt_dates     " valorizza una SELECT-OPTIONS con una range table
  AND RETURN.
```

| Aggiunta                     | Effetto                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `WITH p = valore`            | imposta un parametro o un singolo valore di una `SELECT-OPTIONS`                           |
| `WITH s IN range_table`      | riempie una `SELECT-OPTIONS` con una [range table](./0064-select-options-and-ranges.it.md) |
| `USING SELECTION-SET 'VAR1'` | usa una [variante](./0068-variants-and-background-jobs.it.md)                              |
| `VIA SELECTION-SCREEN`       | mostra prima la schermata di selezione del report chiamato                                 |
| `EXPORTING LIST TO MEMORY`   | tiene la lista in memoria invece di mostrarla                                              |
| `VIA JOB nome NUMBER n`      | esegue il report come step di un job in background                                         |

> [!WARNING]
> Senza `AND RETURN`, il codice dopo `SUBMIT` non gira mai. Se il tuo programma "si ferma" dopo un `SUBMIT`, controlla di non averlo dimenticato.

## Aprire una transazione con CALL TRANSACTION

`CALL TRANSACTION` avvia una transazione e torna al tuo programma quando l'utente la lascia. `LEAVE TO TRANSACTION` avvia una transazione e non torna indietro.

```abap
CALL TRANSACTION 'SE16' WITH AUTHORITY-CHECK.
```

- `WITH AUTHORITY-CHECK` controlla che l'utente sia autorizzato ad avviare la transazione (lo stesso controllo di quando la scrivi nel campo comandi). Aggiungilo sempre: senza, il controllo esteso del programma segnala un avviso di sicurezza.
- `AND SKIP FIRST SCREEN` salta la prima schermata della transazione. Funziona solo se tutti i campi obbligatori di quella schermata sono già compilati, di solito tramite la memoria SAP (vedi sotto).
- `USING bdc_table` fornisce alla transazione i valori di input: è il [batch input](./0130-batch-input.it.md).

## La memoria SAP: SET e GET PARAMETER

La **memoria SAP** appartiene al logon dell'utente. È condivisa da tutte le finestre (sessioni) che l'utente ha aperto, e vive fino al logoff. Contiene valori brevi identificati da un **ID parametro** (parametro `SPA/GPA`) lungo al massimo 20 caratteri.

```abap
SET PARAMETER ID 'CAR' FIELD p_carrid.     " scrive

DATA lv_carrid TYPE s_carr_id.
GET PARAMETER ID 'CAR' FIELD lv_carrid.    " legge; sy-subrc = 4 se non è impostato
```

Gli ID parametro sono collegati agli elementi dati nel [Dizionario](./0045-data-elements.it.md): `S_CARR_ID` ha l'ID parametro `CAR`. I campi di schermata basati su un elemento dati così possono leggere e scrivere la memoria SAP, ed è per questo che un valore inserito in una transazione compare spesso come default nella successiva. Su una schermata di selezione lo attivi con l'aggiunta `MEMORY ID`:

```abap
PARAMETERS p_carrid TYPE s_carr_id MEMORY ID car.   " valorizzato dalla memoria SAP
```

Puoi vedere e impostare i tuoi valori in **Sistema > Profilo utente > Dati propri**, scheda **Parametri**.

Un uso classico: compilare la prima schermata di una transazione prima di aprirla.

```abap
DATA lv_program TYPE programm VALUE 'ZFLIGHT_REPORT'.
SET PARAMETER ID 'RID' FIELD lv_program.         " RID = nome del programma in SE38
CALL TRANSACTION 'SE38' WITH AUTHORITY-CHECK.    " il nome del programma è già compilato
```

## La memoria ABAP: EXPORT e IMPORT

La **memoria ABAP** appartiene a una **sequenza di chiamate**: la catena di programmi avviati con `SUBMIT ... AND RETURN` e `CALL TRANSACTION` dalla stessa sessione principale. Può contenere qualsiasi oggetto dati, anche tabelle interne, sotto un ID che scegli tu.

```abap
" Nel programma chiamante
DATA lt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.
SELECT * FROM scarr INTO TABLE @lt_carriers.

EXPORT carriers = lt_carriers TO MEMORY ID 'ZFLIGHT_CARRIERS'.
SUBMIT zflight_receiver AND RETURN.
FREE MEMORY ID 'ZFLIGHT_CARRIERS'.

" In ZFLIGHT_RECEIVER
DATA lt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.
IMPORT carriers = lt_carriers FROM MEMORY ID 'ZFLIGHT_CARRIERS'.
IF sy-subrc <> 0.
  WRITE / 'Niente nella memoria ABAP'.
ENDIF.
```

- Il nome prima di `=` (`carriers`) è il nome del dato nel cluster di memoria. Usa lo stesso nome e un tipo compatibile in `EXPORT` e `IMPORT`.
- `FREE MEMORY ID` cancella i dati quando non ti servono più.

| Memoria      | Istruzioni                                       | Visibilità                                    | Contenuto                     |
| ------------ | ------------------------------------------------ | --------------------------------------------- | ----------------------------- |
| Memoria SAP  | `SET PARAMETER`, `GET PARAMETER`                 | tutte le sessioni dell'utente, fino al logoff | valori carattere brevi        |
| Memoria ABAP | `EXPORT ... TO MEMORY`, `IMPORT ... FROM MEMORY` | una sequenza di chiamate in una sessione      | qualsiasi dato, anche tabelle |

> [!TIP]
> La memoria SAP è il post-it attaccato al monitor: ogni finestra che apri può leggerlo, e resta lì finché non vai a casa. La memoria ABAP è una cartellina che passa di mano in mano dentro un ufficio: la vedono solo le persone di quella catena.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report `ZFLIGHT_SENDER` che legge da `SPFLI` i collegamenti di una compagnia, li mette nella memoria ABAP e chiama `ZFLIGHT_RECEIVER` con `SUBMIT ... AND RETURN`.
> 2. Scrivi `ZFLIGHT_RECEIVER`, che importa la tabella e la stampa.
> 3. In `ZFLIGHT_SENDER`, imposta anche l'ID parametro `CAR`. Dai a `ZFLIGHT_RECEIVER` un parametro `p_carrid` con `MEMORY ID car`, chiamalo con `VIA SELECTION-SCREEN` e controlla che il campo sia già compilato.

### Soluzione

```abap
REPORT zflight_sender.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT * FROM spfli
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_connections).

  EXPORT connections = lt_connections TO MEMORY ID 'ZFLIGHT_CONN'.
  SET PARAMETER ID 'CAR' FIELD p_carrid.
  SUBMIT zflight_receiver VIA SELECTION-SCREEN AND RETURN.
  FREE MEMORY ID 'ZFLIGHT_CONN'.
```

```abap
REPORT zflight_receiver.

PARAMETERS p_carrid TYPE s_carr_id MEMORY ID car.   " mostra il valore della memoria SAP

START-OF-SELECTION.
  DATA lt_connections TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.
  IMPORT connections = lt_connections FROM MEMORY ID 'ZFLIGHT_CONN'.

  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
```

> [!NOTE]
>
> - `SUBMIT ... AND RETURN` esegue un report e torna indietro; `WITH`, `USING SELECTION-SET` e `VIA SELECTION-SCREEN` ne controllano l'input.
> - `CALL TRANSACTION ... WITH AUTHORITY-CHECK` apre una transazione e torna indietro; `AND SKIP FIRST SCREEN` salta una prima schermata già compilata.
> - La memoria SAP (`SET`/`GET PARAMETER`) è condivisa da tutte le sessioni di un utente e contiene valori brevi per ID parametro.
> - La memoria ABAP (`EXPORT`/`IMPORT ... MEMORY ID`) è condivisa dai programmi di una sequenza di chiamate e contiene qualsiasi dato, anche tabelle.
> - Pulisci la memoria ABAP con `FREE MEMORY ID` quando hai finito.
