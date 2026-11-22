---
title: Le schermate classiche (Dynpro)
description: Screen Painter, programmi di dialogo e codici transazione.
---

_Livello intermedio_

Un **dynpro** (dynamic program) è una schermata classica di SAP GUI: i campi, i pulsanti e i controlli che l'utente vede, più un piccolo pezzo di codice che dice al sistema che cosa fare prima e dopo la visualizzazione. Anche le selection screen e le liste ALV sono dynpro, generati al posto tuo. Quando ti serve una schermata con un layout tuo, come un modulo di inserimento con più schede, la disegni tu.

Migliaia di transazioni standard e custom sono costruite così, quindi incontrerai i dynpro in quasi ogni sistema on-premise. Le nuove applicazioni usano Fiori, ma le schermate classiche devi comunque saperle leggere, correggere ed estendere.

## Le parti di una schermata

Ogni schermata appartiene a un programma e ha un numero di quattro cifre, per esempio `0100`. La modifichi con lo **Screen Painter** (transazione `SE51`, oppure da `SE80`). Ha quattro parti:

| Parte          | Contenuto                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------ |
| Attributi      | descrizione breve, tipo di schermata, schermata successiva, posizione del cursore          |
| Layout         | gli elementi della schermata, disegnati con il Layout Editor grafico                       |
| Lista elementi | tutti gli elementi con nome, tipo, lunghezza e proprietà; qui dai il nome al campo OK code |
| Flow logic     | il codice eseguito prima che la schermata sia mostrata e dopo l'azione dell'utente         |

Il tipo di schermata stabilisce come viene usata:

| Tipo di schermata          | Uso                                                       |
| -------------------------- | --------------------------------------------------------- |
| Normale                    | una schermata intera                                      |
| Subscreen                  | una parte di schermata, mostrata dentro un'area subscreen |
| Finestra di dialogo modale | una finestra popup                                        |

> [!WARNING]
> ADT in Eclipse non sa modificare le schermate. Quando apri una schermata da ADT, avvia lo Screen Painter in un SAP GUI integrato. Se lavori sui dynpro, tieni installato SAP GUI.

## I programmi di dialogo

Le schermate possono appartenere a un programma eseguibile (report), a un gruppo funzione o a un **module pool**: un programma di tipo M che non puoi avviare con `F8`, ma solo tramite un codice transazione. Un module pool con le sue schermate si chiama **programma di dialogo**. Per convenzione il suo nome è `SAPMZ...` o `SAPMY...`, per esempio `SAPMZFLIGHT`.

Quando crei un module pool in `SE80` con un include TOP, il sistema crea il programma principale e i suoi include:

```abap
*&---------------------------------------------------------------------*
*& Module pool  SAPMZFLIGHT
*&---------------------------------------------------------------------*
INCLUDE mzflighttop.   " dati globali
INCLUDE mzflighto01.   " moduli PBO
INCLUDE mzflighti01.   " moduli PAI
INCLUDE mzflightf01.   " altro codice
```

L'include TOP inizia con `PROGRAM` invece che con `REPORT` e contiene i dati globali:

```abap
PROGRAM sapmzflight.

TABLES scarr.                  " work area per i campi di schermata SCARR-...

DATA ok_code TYPE sy-ucomm.    " codice funzione del pulsante premuto dall'utente
DATA gs_flight TYPE sflight.   " alternativa: campi di schermata GS_FLIGHT-...
```

`TABLES` è obsoleto ovunque tranne qui: dichiara una work area con lo stesso nome di una struttura del Dizionario ABAP, così i campi di schermata presi dal Dizionario corrispondono a una variabile del programma. Una struttura globale dichiarata con `DATA`, come `gs_flight`, funziona allo stesso modo.

## Disegnare il layout

Crea la schermata con un clic destro sul programma in `SE80`, poi **Crea > Schermata**, numero `0100`, tipo Normale. Nel Layout Editor:

1. Fai clic su **Campi Dizionario/programma** (`F6`), inserisci `SCARR` e scegli i campi `CARRID`, `CARRNAME` e `CURRCODE`. L'editor mette un'etichetta e un campo di input per ognuno.
2. Aggiungi un pulsante con il testo "Salva" e il codice funzione `SAVE`.
3. Nella lista elementi, dai all'ultimo elemento, di tipo OK, il nome `OK_CODE`.
4. Salva e attiva.

| Elemento               | Scopo                                                     |
| ---------------------- | --------------------------------------------------------- |
| Campo di testo         | un'etichetta fissa                                        |
| Campo di input/output  | un campo che il programma riempie e l'utente può cambiare |
| Checkbox, radio button | una scelta                                                |
| Pulsante               | attiva un codice funzione                                 |
| Riquadro               | una cornice che raggruppa elementi                        |
| Area subscreen         | uno spazio per un subscreen                               |
| Table control          | una tabella scorrevole di campi di input                  |
| Custom control         | uno spazio per un GUI control come una griglia ALV        |

Il legame fra schermata e programma è il **nome**: a runtime il sistema copia il valore della variabile di programma `SCARR-CARRID` nel campo di schermata `SCARR-CARRID` prima della visualizzazione, e di nuovo all'indietro dopo l'input dell'utente. Come e quando succede è l'argomento della [flow logic](./0102-dynpro-flow-logic.md).

> [!TIP]
> La schermata è un modulo di carta e il programma è l'impiegato. Il modulo ha caselle con un'etichetta; l'impiegato ha cassetti con le stesse etichette. Prima di consegnare il modulo, l'impiegato copia ogni cassetto nella sua casella; quando il modulo torna indietro, ricopia ogni casella nel suo cassetto.

## Avviare la schermata

Da qualsiasi programma chiami una schermata con `CALL SCREEN`:

```abap
START-OF-SELECTION.
  CALL SCREEN 100.
```

Per avviare un module pool, crea una **transazione di dialogo** in `SE93`:

```text
SE93 > Codice transazione: ZFLIGHT > Crea
  Oggetto iniziale: Programma e dynpro (transazione di dialogo)
  Programma: SAPMZFLIGHT
  Numero dynpro: 0100
  Supporto GUI: SAP GUI per Windows (e HTML, Java se ti servono)
```

Ora l'utente digita `ZFLIGHT` nel campo comandi e la schermata si apre.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea il module pool `SAPMZFLIGHT` con un include TOP e i dati globali visti sopra.
> 2. Crea la schermata `0100` con i campi `SCARR-CARRID`, `SCARR-CARRNAME`, `SCARR-CURRCODE`, un pulsante "Salva" e il campo OK code `OK_CODE`.
> 3. Crea la transazione di dialogo `ZFLIGHT` che avvia la schermata `0100` ed eseguila.

### Soluzione

Gli oggetti si creano in `SE80` e `SE93` come descritto nella lezione. La schermata si apre con tre campi vuoti e un pulsante. Premere il pulsante per ora non fa niente, e per uscire scrivi `/n` nel campo comandi: il comportamento lo aggiungono la [flow logic](./0102-dynpro-flow-logic.md) e il [GUI status](./0104-gui-status-and-popups.md).

> [!NOTE]
>
> - Un dynpro è una schermata con attributi, layout, lista elementi e flow logic, modificata nello Screen Painter (`SE51`/`SE80`).
> - Un module pool (tipo M) si avvia solo con un codice transazione; con le sue schermate è un programma di dialogo.
> - Campi di schermata e variabili del programma sono legati dal nome; `TABLES` si usa ancora per i campi del Dizionario sulle schermate.
> - Dai un nome al campo OK code nella lista elementi e dichiara per esso una variabile di tipo `sy-ucomm`.
> - Chiama una schermata con `CALL SCREEN nnnn`, oppure crea una transazione di dialogo in `SE93`.
