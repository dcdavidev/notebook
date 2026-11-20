---
title: Le liste interattive
description: TOP-OF-PAGE, AT LINE-SELECTION, HIDE e le liste di dettaglio.
---

_Livello base_

La lista che costruisci con [`WRITE`](./0011-output-with-write.it.md) può fare di più che mostrare del testo. Può avere un'intestazione di pagina che si ripete su ogni pagina, e può reagire quando l'utente fa doppio clic su una riga, aprendo una **lista di dettaglio** con altri dati su quella riga.

Queste sono le **liste classiche**. I report nuovi di solito mostrano i dati in una [griglia ALV](./0099-alv-with-salv.it.md), ma migliaia di report esistenti usano le tecniche di questa lezione, e ti servirà saperli leggere e manutenere.

## Intestazioni di pagina con TOP-OF-PAGE

L'evento `TOP-OF-PAGE` gira ogni volta che inizia una nuova pagina della lista, subito prima che venga scritta la prima riga della pagina. Usalo per le intestazioni delle colonne.

```abap
REPORT zflight_carriers NO STANDARD PAGE HEADING LINE-SIZE 80.

START-OF-SELECTION.
  SELECT carrid, carrname, currcode
    FROM scarr
    ORDER BY carrid
    INTO TABLE @DATA(lt_carriers).

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    WRITE: / ls_carrier-carrid, ls_carrier-carrname, ls_carrier-currcode.
  ENDLOOP.

TOP-OF-PAGE.
  WRITE: / 'Compagnia', 10 'Nome', 40 'Valuta'.
  ULINE.
```

- `NO STANDARD PAGE HEADING` disattiva l'intestazione standard (titolo del programma e numero di pagina), così appare solo la tua.
- `LINE-SIZE 80` imposta la larghezza della lista. Con `LINE-COUNT n` imposti anche il numero di righe per pagina; a quel punto `END-OF-PAGE` può scrivere un piè di pagina.

## Reagire al doppio clic: AT LINE-SELECTION

Quando l'utente fa doppio clic su una riga (o la seleziona e preme F2), il runtime scatena l'evento `AT LINE-SELECTION`. Tutto quello che scrivi con `WRITE` in questo evento va in una nuova lista, la **lista di dettaglio**, che appare sopra la lista di base. Con il pulsante Indietro (F3) l'utente torna alla lista precedente.

Il campo di sistema `sy-lsind` contiene il numero della lista in costruzione: `0` per la lista di base, `1` per la prima lista di dettaglio e così via, fino a `20`. `sy-lisel` contiene il contenuto della riga selezionata dall'utente, come testo.

> [!TIP]
> Una lista classica è come una pila di schede. La lista di base è la scheda sul tavolo; ogni doppio clic mette sopra una nuova scheda, più dettagliata. Indietro toglie la scheda in cima e mostra quella sotto.

## Ricordare la riga con HIDE

La riga della lista è solo testo. Per sapere su quale compagnia ha cliccato l'utente, salvi la chiave con `HIDE` subito dopo aver scritto la riga. `HIDE` memorizza il contenuto attuale di una variabile insieme alla riga. Quando l'utente seleziona la riga, il runtime rimette il valore salvato nella variabile, prima che giri `AT LINE-SELECTION`.

```abap
REPORT zflight_drilldown NO STANDARD PAGE HEADING.

DATA gv_carrid TYPE s_carr_id.

START-OF-SELECTION.
  SELECT carrid, carrname FROM scarr ORDER BY carrid INTO TABLE @DATA(lt_carriers).

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    WRITE: / ls_carrier-carrid, ls_carrier-carrname.
    gv_carrid = ls_carrier-carrid.
    HIDE gv_carrid.                     " memorizzato insieme a questa riga
  ENDLOOP.
  CLEAR gv_carrid.

AT LINE-SELECTION.
  CHECK gv_carrid IS NOT INITIAL.       " l'utente ha cliccato una riga senza dati HIDE
  SELECT connid, cityfrom, cityto FROM spfli
    WHERE carrid = @gv_carrid
    ORDER BY connid
    INTO TABLE @DATA(lt_connections).
  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
  CLEAR gv_carrid.

TOP-OF-PAGE.
  WRITE: / 'Compagnie aeree'.
  ULINE.

TOP-OF-PAGE DURING LINE-SELECTION.
  WRITE: / 'Collegamenti di', gv_carrid.
  ULINE.
```

- `TOP-OF-PAGE DURING LINE-SELECTION` è l'intestazione delle liste di dettaglio. `TOP-OF-PAGE` da solo vale solo per la lista di base.
- La variabile per `HIDE` deve essere globale, perché l'evento che la legge gira più tardi.
- Le righe della lista di dettaglio non hanno dati `HIDE`, quindi un doppio clic lì si ferma al `CHECK` e non si apre nessuna nuova lista. Nei report con più livelli decidi che cosa mostrare con `CASE sy-lsind`.

> [!WARNING]
> Se l'utente clicca una riga su cui non hai chiamato `HIDE`, come un'intestazione o una riga vuota, la variabile mantiene il valore che aveva prima. Per questo l'esempio svuota `gv_carrid` dopo il loop e alla fine di `AT LINE-SELECTION`, e lo controlla all'inizio. Senza quei `CLEAR`, un clic sull'intestazione apre i dettagli dell'ultima compagnia.

## Altri eventi di lista

| Evento            | Quando gira                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `END-OF-PAGE`     | alla fine di ogni pagina, se il report ha `LINE-COUNT`                                                                  |
| `AT USER-COMMAND` | quando l'utente sceglie una funzione dello stato GUI della lista (vedi [stato GUI](./0104-gui-status-and-popups.it.md)) |
| `AT PFnn`         | quando l'utente preme il tasto funzione Fnn (obsoleto: usa uno stato GUI)                                               |

Ogni lista di dettaglio termina quando finisce il blocco evento. A quel punto il runtime la visualizza.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che elenca i collegamenti di `SPFLI` con un'intestazione di pagina.
> 2. Al doppio clic, mostra una lista di dettaglio con i voli di quel collegamento presi da `SFLIGHT` (data, posti occupati, posti massimi).
> 3. Dai alla lista di dettaglio una sua intestazione con la compagnia e il numero del collegamento.

### Soluzione

```abap
REPORT zflight_connections NO STANDARD PAGE HEADING.

DATA gv_carrid TYPE s_carr_id.
DATA gv_connid TYPE s_conn_id.

START-OF-SELECTION.
  SELECT carrid, connid, cityfrom, cityto FROM spfli
    ORDER BY carrid, connid
    INTO TABLE @DATA(lt_connections).

  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-carrid, ls_connection-connid,
             ls_connection-cityfrom, ls_connection-cityto.
    gv_carrid = ls_connection-carrid.
    gv_connid = ls_connection-connid.
    HIDE: gv_carrid, gv_connid.
  ENDLOOP.
  CLEAR: gv_carrid, gv_connid.

AT LINE-SELECTION.
  CHECK gv_carrid IS NOT INITIAL.
  SELECT fldate, seatsocc, seatsmax FROM sflight
    WHERE carrid = @gv_carrid
      AND connid = @gv_connid
    ORDER BY fldate
    INTO TABLE @DATA(lt_flights).
  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-fldate, ls_flight-seatsocc, ls_flight-seatsmax.
  ENDLOOP.
  CLEAR: gv_carrid, gv_connid.

TOP-OF-PAGE.
  WRITE: / 'Compagnia', 'Collegamento', 'Da', 'A'.
  ULINE.

TOP-OF-PAGE DURING LINE-SELECTION.
  WRITE: / 'Voli di', gv_carrid, gv_connid.
  ULINE.
```

> [!NOTE]
>
> - `TOP-OF-PAGE` scrive l'intestazione della lista di base; `TOP-OF-PAGE DURING LINE-SELECTION` quella delle liste di dettaglio.
> - `AT LINE-SELECTION` gira con il doppio clic o F2 e costruisce una nuova lista di dettaglio.
> - `sy-lsind` è il numero della lista corrente (da 0 a 20); `sy-lisel` contiene la riga selezionata come testo.
> - `HIDE` memorizza una variabile globale insieme alla riga e la ripristina quando l'utente seleziona quella riga. Svuota la variabile per evitare valori vecchi.
> - Per i report nuovi preferisci l'ALV; conosci le liste classiche per manutenere il codice vecchio.
