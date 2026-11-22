---
title: L'analisi delle prestazioni
description: La traccia SQL (ST05) e l'analisi del runtime (SAT).
---

_Livello intermedio_

Quando un programma è lento, non tirare a indovinare dove va il tempo: misuralo. Due strumenti standard rispondono alla domanda in pochi minuti. La **traccia SQL** (`ST05`) registra ogni accesso al database, e l'**analisi del runtime** (`SAT`) misura quanto dura in ABAP ogni istruzione e ogni metodo.

Qui vedi come usarli entrambi. Le regole per rendere il codice più veloce arrivano in [scrivere ABAP veloce](./0109-performance-best-practices.md).

## Il programma da analizzare

Gli esempi analizzano questo report. Funziona, ma legge il nome del cliente una volta per ogni prenotazione:

```abap
REPORT zslow_flights.

START-OF-SELECTION.
  SELECT * FROM sbook INTO TABLE @DATA(lt_bookings) UP TO 2000 ROWS.

  LOOP AT lt_bookings INTO DATA(ls_booking).
    SELECT SINGLE name FROM scustom
      WHERE id = @ls_booking-customid
      INTO @DATA(lv_name).                       " una chiamata al database per riga
    WRITE: / ls_booking-carrid, ls_booking-connid, ls_booking-bookid, lv_name.
  ENDLOOP.
```

## La traccia SQL (ST05)

`ST05` registra le istruzioni SQL che arrivano al database, con la loro durata e il numero di righe.

1. Avvia `ST05` e scegli **Attiva traccia con filtro**. Limitala al tuo utente e, se vuoi, al nome del programma. Lascia selezionata la traccia SQL.
2. Esegui il programma in un'altra sessione.
3. Torna in `ST05`, scegli **Disattiva traccia** e poi **Visualizza traccia**.

La lista della traccia mostra una riga per ogni operazione sul database:

| Colonna      | Significato                                          |
| ------------ | ---------------------------------------------------- |
| Durata       | tempo sul database, in microsecondi                  |
| Record       | righe restituite o modificate                        |
| Nome oggetto | la tabella o la vista                                |
| Istruzione   | l'istruzione SQL così come l'ha ricevuta il database |

Due valutazioni mostrano a colpo d'occhio i veri problemi:

- **Riepilogo istruzioni** (_statement summary_) raggruppa le istruzioni per testo e mostra quante volte è stata eseguita ciascuna e quanto è durata in totale. Per il report qui sopra, la `SELECT` su `SCUSTOM` compare con fino a 2.000 esecuzioni.
- **Istruzioni con valori identici** (_value-identical statements_) elenca le istruzioni eseguite più volte con esattamente gli stessi valori: pura ripetizione, che un buffer o un join eliminerebbe.

Le letture servite dal [buffer delle tabelle](./0046-database-tables.md) non arrivano al database, quindi non compaiono nella traccia SQL; per vederle attiva la traccia del buffer.

Seleziona un'istruzione e scegli **Explain** per vedere il piano di esecuzione scelto dal database: se ha usato un indice o ha letto l'intera tabella.

> [!TIP]
> La traccia SQL è la bolletta telefonica dettagliata. Il totale ti dice che hai speso troppo; l'elenco delle chiamate mostra che hai telefonato allo stesso numero tremila volte.

`ST05` può registrare anche altre tracce: accessi al buffer delle tabelle, chiamate RFC, operazioni di enqueue (blocchi) e chiamate HTTP. Selezionale nella stessa schermata quando ti servono.

> [!WARNING]
> La traccia registra tutto quello che fanno sul server gli utenti che selezioni. Imposta sempre un filtro, tieni la traccia breve e disattivala quando hai finito: una traccia attiva senza filtro rallenta il sistema e riempie i file di traccia.

## L'analisi del runtime (SAT)

`SAT` misura il lato ABAP: quanto tempo va a ogni metodo, modulo funzione, ciclo e istruzione.

1. Avvia `SAT`. Inserisci il programma o la transazione nella scheda **In dialogo**.
2. Tieni la variante di misurazione di default, oppure creane una con l'**aggregazione per posizione di chiamata** disattivata se ti serve l'intera gerarchia delle chiamate.
3. Scegli **Esegui**. Il programma gira; quando termina, `SAT` mostra la valutazione.

La valutazione ha diversi strumenti:

| Strumento               | Che cosa mostra                                                             |
| ----------------------- | --------------------------------------------------------------------------- |
| Hit list                | ogni istruzione o chiamata con il numero di esecuzioni, tempo lordo e netto |
| Tabelle DB              | le tabelle lette e il tempo speso su ognuna                                 |
| Profilo                 | il tempo diviso per package, programma o componente                         |
| Gerarchia chiamate      | chi ha chiamato che cosa, in ordine                                         |
| Blocchi di elaborazione | il tempo per metodo, funzione, form ed evento                               |

Il **tempo lordo** include tutto quello che viene chiamato da un'istruzione; il **tempo netto** è il tempo della sola istruzione. Ordina la hit list per tempo netto per trovare il codice lento di per sé, e per tempo lordo per trovare la chiamata che avvia la parte lenta.

In alto, `SAT` mostra come il totale si divide fra tempo ABAP, database e sistema. Se prevale il tempo del database, passa a `ST05`; se prevale il tempo ABAP, guarda cicli e tabelle interne.

In ADT la stessa misurazione è l'**ABAP Profiler**: fai clic destro sul programma, scegli **Profile As > ABAP Application** e poi apri la traccia nella vista ABAP Traces.

## Misurare un singolo blocco

Per confrontare due versioni di un piccolo pezzo di codice, misuralo nel programma con un timer ad alta risoluzione:

```abap
DATA(lo_timer) = cl_abap_runtime=>create_hr_timer( ).

DATA(lv_start) = lo_timer->get_runtime( ).
" ... il codice da misurare ...
DATA(lv_end) = lo_timer->get_runtime( ).

WRITE: / |Runtime: { lv_end - lv_start } microsecondi|.
```

Esegui ogni versione più volte: la prima esecuzione è spesso più lenta perché i buffer sono ancora vuoti.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea il report `ZSLOW_FLIGHTS` della lezione e traccialo con `ST05`. Quante volte viene eseguita la `SELECT` su `SCUSTOM`?
> 2. Misuralo con `SAT` e annota la divisione fra tempo ABAP e tempo del database.
> 3. Sostituisci la `SELECT SINGLE` nel ciclo con un join, traccia di nuovo e confronta.

### Soluzione

Il riepilogo istruzioni mostra la `SELECT` su `SCUSTOM` una volta per prenotazione, e la maggior parte del tempo è tempo del database. Con un join c'è una sola istruzione:

```abap
SELECT FROM sbook AS b
  INNER JOIN scustom AS c ON c~id = b~customid
  FIELDS b~carrid, b~connid, b~bookid, c~name
  INTO TABLE @DATA(lt_bookings)
  UP TO 2000 ROWS.
```

> [!NOTE]
>
> - Misura prima di ottimizzare: `ST05` per il database, `SAT` per ABAP.
> - In `ST05`, attiva la traccia con un filtro, esegui il programma, disattiva e visualizza.
> - Il riepilogo istruzioni e le istruzioni con valori identici rivelano le chiamate ripetute al database; Explain mostra il piano di esecuzione.
> - In `SAT`, la hit list mostra tempo lordo e netto per istruzione; il profilo mostra il tempo ABAP rispetto a quello del database.
> - In ADT usa l'ABAP Profiler; per un singolo blocco usa `cl_abap_runtime=>create_hr_timer( )`.
