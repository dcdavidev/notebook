---
title: Varianti e job in background
description: Salvare i valori di input e pianificare i programmi con SM36 e SM37.
level: basic
---

Spesso gli utenti eseguono lo stesso report con lo stesso input tutti i giorni. Una **variante** salva i valori di una schermata di selezione con un nome, così nessuno deve riscriverli. Le varianti sono anche ciò che rende possibili i **job in background**: un job esegue un report senza un utente davanti allo schermo, quindi prende i valori di input da una variante.

Questa lezione mostra come creare le varianti, come pianificare un job in `SM36`, come monitorarlo in `SM37` e che cosa cambia nel tuo codice quando gira in background.

## Creare e usare una variante

1. Esegui il report (per esempio da `SE38`) e compila la schermata di selezione.
2. Scegli **Passa a > Varianti > Salva come variante** (oppure premi il pulsante Salva).
3. Inserisci un nome, per esempio `DAILY_LH`, e una descrizione.
4. Imposta gli attributi che ti servono e salva.

Per usarla, scegli **Passa a > Varianti > Richiama** sulla schermata di selezione, oppure clicca **Esegui con variante** in `SE38`.

Gli attributi più utili:

| Attributo                           | Effetto                                                             |
| ----------------------------------- | ------------------------------------------------------------------- |
| Solo per elaborazione in background | la variante si può usare solo nei job                               |
| Proteggi variante                   | solo l'utente che l'ha creata può modificarla                       |
| Proteggi campo                      | l'utente non può cambiare quel campo dopo aver caricato la variante |
| Nascondi campo                      | il campo non appare quando la variante viene caricata               |
| Variabile di selezione              | il valore viene calcolato a runtime invece di essere fisso          |

Le variabili di selezione risolvono un problema frequente: una variante salvata con la data `2026-01-15` leggerebbe per sempre lo stesso giorno. Con il tipo **D** (calcolo dinamico della data) scegli una regola come "data corrente" o "data corrente - 1", e la data si sposta con il calendario. Con il tipo **T**, il valore arriva da una tabella di variabili gestita con la transazione `STVARV`.

> [!TIP]
> Una variante è come una ricerca salvata in un negozio online: "taglia M, colore blu, sotto i 50 euro". Imposti i filtri una volta e poi clicchi la ricerca salvata, invece di reimpostarli ogni volta.

> [!WARNING]
> Le varianti sono salvate per mandante e non vengono trasportate in automatico. Se un job in produzione ha bisogno di una variante, creala lì, oppure aggiungila a una richiesta di trasporto dalla gestione delle varianti (**Utilità > Richiesta di trasporto**).

## Pianificare un job in SM36

Un **job in background** è una sequenza di uno o più **step**, ognuno dei quali è un programma eseguito con una variante.

1. Apri `SM36` e inserisci un **nome del job**, per esempio `ZFLIGHT_DAILY`, e una **classe del job** (`C` è la priorità normale; `A` e `B` sono più alte).
2. Clicca **Step**, inserisci il nome del programma e la variante e salva lo step.
3. Clicca **Condizione di avvio** e scegli quando gira il job: **Immediato**, **Data/Ora**, **Dopo job** o **Dopo evento**. Spunta **Job periodico** e scegli un periodo (giornaliero, settimanale, ...) per un job che si ripete.
4. Salva il job. Ora è **rilasciato** e aspetta il suo orario di avvio.

Puoi anche avviare un report in background direttamente dalla sua schermata di selezione con **Programma > Esegui in background** (F9).

## Monitorare i job in SM37

`SM37` elenca i job che corrispondono a un nome, un utente, un intervallo di date e uno stato. Lo stato ti dice a che punto è il job:

| Stato       | Significato                                         |
| ----------- | --------------------------------------------------- |
| Pianificato | definito, ma non ancora rilasciato: non partirà     |
| Rilasciato  | in attesa della condizione di avvio                 |
| Pronto      | l'orario è arrivato; aspetta un work process libero |
| Attivo      | in esecuzione ora                                   |
| Terminato   | finito senza errori                                 |
| Interrotto  | finito con un errore o un runtime error             |

Seleziona un job e clicca **Log del job** per vederne i messaggi, oppure **Spool** per vedere la lista che ha scritto. L'output di `WRITE` in un job diventa una **richiesta di spool**, che trovi anche in `SP01`.

## Codice che gira in background

In un job nessuno può rispondere a un popup o guardare lo schermo. Il campo di sistema `sy-batch` vale `abap_true` quando il programma gira in background, quindi puoi adattare il comportamento:

```abap
REPORT zflight_daily.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsocc
    FROM sflight
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).

  IF sy-batch = abap_true.
    " In un job: il messaggio va nel log del job
    MESSAGE |{ lines( lt_flights ) } voli letti per { p_carrid }| TYPE 'S'.
  ENDIF.

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc.   " va nello spool
  ENDLOOP.
```

- I messaggi di tipo `S`, `I` e `W` vengono scritti nel log del job, e il job prosegue.
- Un messaggio di tipo `E` o `A`, o un runtime error, termina il job con stato **Interrotto**.
- Tutto ciò che richiede SAP GUI non funziona: niente popup e niente [file sul PC dell'utente](./0073-files-on-the-presentation-server.md). Scrivi invece i file sull'[application server](./0074-files-on-the-application-server.md).

Puoi pianificare i job anche da codice, con `SUBMIT ... VIA JOB` e i moduli funzione dei job: vedi [chiamare programmi](./0072-calling-programs-and-memory.md) e [elaborazione parallela e in background](./0114-parallel-processing.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Crea una variante per un tuo report sui voli, con la compagnia `LH` e una data del volo che sia sempre la "data corrente" (una variabile di selezione di tipo D).
> 2. Pianifica il report con quella variante in `SM36`, come job ad avvio immediato.
> 3. In `SM37`, trova il job, apri il suo log e il suo spool.

### Soluzione

1. Sulla schermata di selezione inserisci `LH`, scegli **Passa a > Varianti > Salva come variante** e per il campo data imposta **Variabile di selezione** a `D` con la regola "Data corrente".
2. In `SM36`: nome del job `ZFLIGHT_TEST`, **Step** con il tuo programma e la variante, **Condizione di avvio > Immediato**, poi salva.
3. In `SM37` inserisci `ZFLIGHT_TEST` e il tuo utente, esegui la selezione, seleziona il job e clicca **Log del job** e **Spool**. Lo stato dovrebbe essere **Terminato**.

> [!NOTE]
>
> - Una variante salva i valori di una schermata di selezione con un nome; gli attributi proteggono, nascondono o rendono dinamici i campi.
> - Usa le variabili di selezione (tipo D per le date, tipo T per i valori di `STVARV`) perché una variante non blocchi una data.
> - `SM36` crea i job a partire da step (programma + variante) e da una condizione di avvio; `SM37` li monitora.
> - L'output dei job va nello spool (`SP01`); i messaggi vanno nel log del job; i messaggi `E` e `A` interrompono il job.
> - Controlla `sy-batch` ed evita tutto ciò che richiede SAP GUI nei programmi che girano in background.
