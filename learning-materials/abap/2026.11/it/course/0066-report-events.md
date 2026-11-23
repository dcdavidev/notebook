---
title: Gli eventi dei report
description: INITIALIZATION, AT SELECTION-SCREEN, START-OF-SELECTION e altri.
level: basic
---

Un report non viene eseguito dall'alto in basso come uno script. Il runtime lo richiama in momenti precisi, chiamati **eventi**: prima che appaia la schermata di selezione, quando l'utente preme Invio, quando preme Esegui e così via. Per ogni momento a cui vuoi reagire scrivi un **blocco evento**.

Conoscere l'ordine degli eventi ti dice dove mettere i valori di default, i controlli sull'input e la logica principale di un report.

## L'ordine degli eventi

Quando esegui un report con una schermata di selezione, il runtime passa per questi eventi:

| Evento                                       | Quando gira                                                           | Uso tipico                                                     |
| -------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `LOAD-OF-PROGRAM`                            | una volta, quando il programma viene caricato                         | raramente usato nei report                                     |
| `INITIALIZATION`                             | una volta, prima che la schermata di selezione appaia la prima volta  | calcolare valori di default                                    |
| `AT SELECTION-SCREEN OUTPUT`                 | ogni volta, subito prima che la schermata di selezione venga mostrata | modificare la schermata (mostrare, nascondere, bloccare campi) |
| `AT SELECTION-SCREEN ON VALUE-REQUEST FOR p` | quando l'utente preme F4 sul campo `p`                                | un tuo aiuto alla ricerca                                      |
| `AT SELECTION-SCREEN ON p`                   | dopo l'input dell'utente, per il solo campo `p`                       | controllare un campo                                           |
| `AT SELECTION-SCREEN`                        | dopo l'input dell'utente, per tutta la schermata                      | controllare più campi insieme                                  |
| `START-OF-SELECTION`                         | dopo che l'utente preme Esegui (F8) e tutti i controlli sono passati  | leggere i dati, elaborarli, output                             |
| `END-OF-SELECTION`                           | dopo `START-OF-SELECTION`                                             | output finale (soprattutto nel codice vecchio)                 |

Dopo che la lista è visualizzata, entrano in gioco gli eventi di lista come `TOP-OF-PAGE` e `AT LINE-SELECTION`: li trovi in [le liste interattive](./0067-interactive-lists.md).

> [!TIP]
> Pensa a un ristorante. `INITIALIZATION` è apparecchiare la tavola prima che arrivi il cliente. `AT SELECTION-SCREEN` è il cameriere che rilegge l'ordinazione e dice "mi spiace, questo piatto è finito". `START-OF-SELECTION` è la cucina che cucina dopo che l'ordine è confermato.

## Valori di default in INITIALIZATION

`DEFAULT` su un parametro accetta solo una costante. Quando il default va calcolato, riempi il campo in `INITIALIZATION`:

```abap
REPORT zflight_events.

DATA gv_fldate TYPE s_date.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.
SELECT-OPTIONS s_fldate FOR gv_fldate.

INITIALIZATION.
  " Intervallo di default: da oggi a fra 30 giorni
  APPEND VALUE #( sign = 'I' option = 'BT' low = sy-datum high = sy-datum + 30 ) TO s_fldate.
```

`s_fldate` è una tabella di selezione, come spiegato in [SELECT-OPTIONS e range](./0064-select-options-and-ranges.md): ogni riga che aggiungi è un intervallo che l'utente vede sulla schermata.

## Controlli sull'input in AT SELECTION-SCREEN

Se invii un messaggio di errore (tipo `E`) in `AT SELECTION-SCREEN`, il runtime mostra il messaggio e **tiene aperta la schermata di selezione**: l'utente può correggere l'input e riprovare. Con `ON p_carrid` resta pronto per l'input solo quel campo; gli altri sono bloccati finché l'errore non è corretto.

```abap
AT SELECTION-SCREEN ON p_carrid.
  SELECT SINGLE @abap_true
    FROM scarr
    WHERE carrid = @p_carrid
    INTO @DATA(lv_exists).
  IF sy-subrc <> 0.
    MESSAGE e001(zflight) WITH p_carrid.   " La compagnia &1 non esiste
  ENDIF.

AT SELECTION-SCREEN.
  IF s_fldate[] IS INITIAL.                 " [] indica la tabella, non la header line
    MESSAGE w002(zflight).                 " Nessuna data: vengono letti tutti i voli
  ENDIF.
```

La classe di messaggi `ZFLIGHT` e i suoi messaggi sono tuoi: vedi [i messaggi](./0061-messages.md).

> [!WARNING]
> `AT SELECTION-SCREEN` gira anche quando l'utente preme Invio o clicca un radio button con `USER-COMMAND`, non solo con Esegui. Tieni lì controlli veloci e non leggere grandi quantità di dati: quello va in `START-OF-SELECTION`.

## La logica principale in START-OF-SELECTION

`START-OF-SELECTION` gira quando l'input è valido. È il posto dove leggere il database e scrivere l'output.

```abap
START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid = @p_carrid
      AND fldate IN @s_fldate
    INTO TABLE @DATA(lt_flights).

  IF lt_flights IS INITIAL.
    MESSAGE s003(zflight) DISPLAY LIKE 'E'.   " Nessun volo trovato
    RETURN.
  ENDIF.

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-fldate,
             ls_flight-seatsocc, '/', ls_flight-seatsmax.
  ENDLOOP.
```

- Le istruzioni che non stanno in nessun blocco evento appartengono automaticamente a `START-OF-SELECTION`. Scrivi comunque la parola chiave: il programma si legge meglio.
- Un blocco evento finisce dove inizia la parola chiave dell'evento successivo. Non c'è un'istruzione `END-OF-...` che lo chiude.
- Un `MESSAGE` di tipo `E` in `START-OF-SELECTION` termina il programma invece di tornare alla schermata. Per questo l'esempio usa il tipo `S` con `DISPLAY LIKE 'E'` e `RETURN`.

> [!WARNING]
> I dati dichiarati con `DATA` in `INITIALIZATION`, `START-OF-SELECTION` e nella maggior parte degli altri blocchi evento sono **globali**, non locali al blocco: una variabile dichiarata inline in `START-OF-SELECTION`, come `lt_flights`, è visibile nel resto del programma. L'eccezione è `AT SELECTION-SCREEN` (in tutte le sue varianti): il runtime lo implementa come una procedura, quindi i suoi dati sono locali. Tieni corti i blocchi evento e sposta la logica vera nei [metodi](./0076-classes-and-objects.md) appena li conosci.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report con un parametro per la compagnia aerea e `SELECT-OPTIONS` per la data del volo.
> 2. In `INITIALIZATION`, imposta l'intervallo di date sul mese corrente.
> 3. In `AT SELECTION-SCREEN ON`, rifiuta una compagnia che non è in `SCARR`. In `START-OF-SELECTION`, elenca i voli corrispondenti di `SFLIGHT`.

### Soluzione

```abap
REPORT zflight_month.

DATA gv_fldate TYPE s_date.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.
SELECT-OPTIONS s_fldate FOR gv_fldate.

INITIALIZATION.
  DATA lv_first TYPE d.
  DATA lv_last  TYPE d.
  lv_first = sy-datum.
  lv_first+6(2) = '01'.                          " primo giorno del mese
  lv_last = lv_first + 31.                       " un giorno del mese successivo
  lv_last+6(2) = '01'.
  lv_last = lv_last - 1.                         " ultimo giorno del mese
  APPEND VALUE #( sign = 'I' option = 'BT' low = lv_first high = lv_last ) TO s_fldate.

AT SELECTION-SCREEN ON p_carrid.
  SELECT SINGLE @abap_true FROM scarr
    WHERE carrid = @p_carrid
    INTO @DATA(lv_exists).
  IF sy-subrc <> 0.
    MESSAGE |La compagnia { p_carrid } non esiste| TYPE 'E'.
  ENDIF.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsocc
    FROM sflight
    WHERE carrid = @p_carrid
      AND fldate IN @s_fldate
    ORDER BY fldate
    INTO TABLE @DATA(lt_flights).

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc.
  ENDLOOP.
```

> [!NOTE]
>
> - Un report è un insieme di blocchi evento che il runtime richiama in un ordine fisso.
> - `INITIALIZATION` gira una volta prima della schermata di selezione: usalo per i default calcolati.
> - `AT SELECTION-SCREEN OUTPUT` modifica la schermata; `AT SELECTION-SCREEN` e `AT SELECTION-SCREEN ON` controllano l'input, e un messaggio `E` tiene aperta la schermata.
> - `START-OF-SELECTION` contiene la logica principale; il codice fuori da ogni blocco evento appartiene a lui.
> - I dati dichiarati nei blocchi evento sono globali, tranne in `AT SELECTION-SCREEN`, dove sono locali.
