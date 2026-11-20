---
title: 'Il debugger: primi passi'
description: Avviare il debugger, eseguire il codice passo per passo e ispezionare le variabili.
---

_Livello principiante_

Quando un programma dà il risultato sbagliato, rileggere il codice non sempre basta. Il **debugger** ti permette di fermare il programma mentre gira, eseguirlo un'istruzione alla volta e guardare il valore di ogni variabile in quel momento. Vedi che cosa fa davvero il programma, non che cosa pensi che faccia.

Il debugger ABAP esiste in due forme con le stesse idee: in SAP GUI e in Eclipse con ADT. Questa lezione le mostra entrambe.

> [!TIP]
> Eseguire un programma normalmente è guardare un film a velocità piena. Il debugger è il telecomando: metti in pausa, vai avanti un fotogramma alla volta e blocchi l'immagine per guardare ogni dettaglio.

## Avviare il debugger

Per usare il debugger ti serve un punto in cui il programma si ferma: un **breakpoint**. I modi più semplici per averne uno:

| Dove    | Come                                                                                                  |
| ------- | ----------------------------------------------------------------------------------------------------- |
| SAP GUI | scrivi `/h` nel campo comandi e premi Invio, poi avvia il programma: si ferma alla prima istruzione   |
| SAP GUI | nell'editor ABAP (`SE38`), metti il cursore su una riga e fai clic su **Imposta/Cancella breakpoint** |
| ADT     | fai doppio clic sul righello a sinistra del numero di riga nell'editor (oppure premi Ctrl+Shift+B)    |

Poi esegui il programma come al solito, per esempio con F8. Quando raggiunge il breakpoint, si apre il debugger: in SAP GUI in una nuova finestra, in ADT nella prospettiva **Debug**. La riga evidenziata è quella **che sta per essere eseguita**.

I diversi tipi di breakpoint, e come fermarti solo quando un valore cambia, li imparerai in [Breakpoint e watchpoint](./0029-breakpoints-and-watchpoints.it.md).

## Eseguire il codice passo per passo

Gli stessi tasti funzione valgono in SAP GUI e in ADT:

| Tasto | Nome          | Che cosa fa                                                                          |
| ----- | ------------- | ------------------------------------------------------------------------------------ |
| F5    | Passo singolo | esegue l'istruzione corrente; se chiama un metodo o una routine, ci entra            |
| F6    | Esegui        | esegue l'istruzione corrente; una chiamata viene eseguita per intero, senza entrarci |
| F7    | Ritorno       | esegue il resto del metodo o della routine corrente e si ferma dopo la chiamata      |
| F8    | Continua      | esegue fino al prossimo breakpoint, o fino alla fine del programma                   |

In un report semplice senza chiamate, F5 e F6 fanno la stessa cosa. Quando lavorerai con metodi e moduli funzione, F6 ti farà saltare il codice di cui ti fidi, e F5 ti farà entrare nel codice che vuoi controllare.

## Guardare le variabili

Mentre il programma è fermo, puoi vedere il valore corrente di qualsiasi variabile:

- **SAP GUI**: fai doppio clic su una variabile nel codice sorgente, oppure scrivi il suo nome nella lista **Variabili** sulla destra. Le schede **Desktop** e **Standard** mostrano insieme sorgente e variabili.
- **ADT**: la vista **Variables** elenca le variabili locali; passa il mouse su una variabile nell'editor per vederne il valore in un tooltip.

Puoi guardare anche i campi di sistema come `sy-subrc` o `sy-index`: scrivili come qualsiasi altra variabile.

Provalo con questo report: metti un breakpoint sulla riga del `DO`, eseguilo e premi F5 qualche volta guardando `lv_total` e `sy-index`.

```abap
REPORT zdebug_demo.

DATA lv_total TYPE i.
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '120.50'.

DO 3 TIMES.
  lv_total += sy-index.
ENDDO.

lv_price = lv_price * lv_total.
WRITE: / lv_total, lv_price.
```

## Cambiare i valori durante il debug

In entrambi i debugger puoi **cambiare** il valore di una variabile: in SAP GUI, fai clic sull'icona della matita accanto al valore; in ADT, fai clic destro sulla variabile nella vista **Variables** e scegli **Change Value**. Poi prosegui: il programma continua con il nuovo valore.

È utile per provare un ramo senza cambiare i dati, per esempio impostando `sy-subrc` a 4 per vedere che cosa fa il percorso di errore.

> [!CAUTION]
> Le modifiche ai valori nel debugger vengono registrate, e in produzione di solito le autorizzazioni le vietano, a ragione: puoi scrivere dati incoerenti nel database. Fai debug con modifiche solo nei sistemi di sviluppo e di test.

> [!WARNING]
> Il debugger ferma davvero il programma. Se fai il debug di un programma che ha bloccato dei dati o aperto una transazione sul database, questi restano bloccati per gli altri utenti finché non prosegui. Non lasciare aperta a lungo una sessione di debug.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea il report `zdebug_demo` di questa lezione e avvialo con un breakpoint sulla riga del `DO`.
> 2. Attraversa il ciclo con F5 e annota il valore di `lv_total` dopo ogni passo.
> 3. Prima dell'ultimo `WRITE`, cambia `lv_total` in 10 nel debugger, prosegui con F8 e controlla l'output.

### Soluzione

Dopo i tre passi `lv_total` vale 1, poi 3, poi 6. Senza modifiche l'output è `6` e `723.00`. Se imposti `lv_total` a 10 prima della riga della moltiplicazione, l'output diventa `10` e `1205.00`; se lo cambi dopo la moltiplicazione, cambia solo il primo valore.

> [!NOTE]
>
> - Il debugger ferma un programma in esecuzione, così puoi eseguirlo passo per passo e ispezionare le variabili.
> - Avvialo con `/h` in SAP GUI, oppure metti un breakpoint nell'editor ed esegui il programma.
> - F5 entra nelle chiamate, F6 le salta, F7 esce dalla routine corrente, F8 prosegue.
> - Fai doppio clic su una variabile o passaci sopra con il mouse per vederne il valore; i campi di sistema funzionano allo stesso modo.
> - Puoi cambiare i valori durante il debug, ma solo nei sistemi di sviluppo e di test.
