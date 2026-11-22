---
title: Il tuo primo programma
description: Creare, controllare, attivare ed eseguire un report che saluta.
---

_Livello principiante_

È il momento di scrivere codice. Il tuo primo programma è un **report**, detto anche **programma eseguibile**: un programma che avvii direttamente e che mostra il suo output sullo schermo. Saluta, e strada facendo attraversi il ciclo che ripeterai per ogni oggetto che scriverai in ABAP: **creare, salvare, controllare, attivare, eseguire**.

Puoi seguire i passi in ADT o in SAP GUI: qui sotto trovi entrambi.

## Creare il programma in ADT

1. Nel Project Explorer fai clic destro sul tuo pacchetto (`$TMP` o `$ZTRAINING`, da [Pacchetti e richieste di trasporto](./0007-packages-and-transport-requests.md)) e scegli **New > ABAP Program**.
2. Inserisci il nome `ZHELLO_WORLD` e la descrizione "Il mio primo programma", poi premi **Next**.
3. Per un pacchetto locale non c'è nessuna richiesta di trasporto da scegliere: premi **Finish**.

ADT apre l'editor con una riga già scritta:

```abap
REPORT zhello_world.
```

`REPORT` è la prima istruzione di ogni programma eseguibile, seguita dal nome del programma. Ora aggiungi l'output:

```abap
REPORT zhello_world.

WRITE 'Ciao, mondo!'.
```

## Creare il programma in SAP GUI

1. Apri la transazione `SE38` (l'ABAP Editor).
2. Digita `ZHELLO_WORLD` nel campo **Programma** e premi **Crea**.
3. Nella finestra **Attributi** inserisci il titolo "Il mio primo programma" e scegli il tipo **Programma eseguibile**. Premi **Salva**.
4. Quando il sistema chiede un pacchetto, inserisci `$TMP` oppure premi **Oggetto locale**.
5. Si apre l'editor con l'istruzione `REPORT`. Aggiungi sotto l'istruzione `WRITE`.

Le due strade creano lo stesso oggetto nello stesso sistema: puoi creare un programma in SAP GUI e aprirlo in ADT, o viceversa.

## Controllare, attivare ed eseguire

| Passo       | ADT       | SAP GUI (`SE38`) | Che cosa fa                                                |
| ----------- | --------- | ---------------- | ---------------------------------------------------------- |
| Salvare     | `Ctrl+S`  | `Ctrl+S`         | memorizza il sorgente come versione inattiva               |
| Controllare | `Ctrl+F2` | `Ctrl+F2`        | esegue il controllo di sintassi ed elenca gli errori       |
| Attivare    | `Ctrl+F3` | `Ctrl+F3`        | controlla di nuovo e genera la versione attiva, eseguibile |
| Eseguire    | `F8`      | `F8`             | esegue la versione attiva                                  |

Quando lo esegui, il programma mostra una schermata di **lista** con una riga:

```text
Ciao, mondo!
```

Premi `F3` per tornare all'editor.

> [!TIP]
> Salvare, controllare e attivare sono come scrivere una lettera, rileggerla e imbucarla. La bozza salvata resta sulla tua scrivania; solo la lettera imbucata (la versione attiva) arriva a qualcun altro.

## Quando il controllo trova un errore

Togli il punto alla fine dell'istruzione `WRITE` e premi `Ctrl+F2`. Il controllo si ferma con un errore simile a questo:

```text
L'ultima istruzione non è completa (manca il punto).
```

ADT lo mostra nella vista **Problems** e segna la riga con un'icona rossa; in SAP GUI compare in fondo all'editor. Fai doppio clic sul messaggio per saltare alla riga. Rimetti il punto, controlla di nuovo e attiva.

> [!WARNING]
> Un oggetto con errori di sintassi si può salvare ma non attivare. Se lo lasci così, la versione **attiva** resta quella vecchia, ed è quella che eseguono tutti gli altri. L'editor mostra "inattivo" accanto al nome finché l'attivazione non va a buon fine.

## Su SAP BTP: una classe console

Nel SAP BTP ABAP environment e negli altri sistemi ABAP Cloud non ci sono report né liste `WRITE`. Lì il primo programma di solito è una classe che scrive nella **ABAP Console** di ADT. Creala con **New > ABAP Class**, nome `ZCL_HELLO_WORLD`, e sostituisci il codice generato con:

```abap
CLASS zcl_hello_world DEFINITION
  PUBLIC FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_hello_world IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    out->write( 'Ciao, mondo!' ).
  ENDMETHOD.
ENDCLASS.
```

Attivala con `Ctrl+F3` ed eseguila con `F9`: il testo compare nella vista ABAP Console. Non preoccuparti per ora di `CLASS`, `METHOD` e `INTERFACES`: le classi iniziano in [Classi e oggetti](./0076-classes-and-objects.md). Fino ad allora le lezioni usano i report, e quando il codice di una lezione non usa `WRITE` puoi incollare le stesse istruzioni nel metodo `main`.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea, attiva ed esegui `ZHELLO_WORLD`.
> 2. Aggiungi una seconda istruzione `WRITE` con il tuo nome, attiva ed esegui di nuovo.
> 3. Togli un apice da uno dei testi, controlla il programma e leggi il messaggio di errore.

### Soluzione

```abap
REPORT zhello_world.

WRITE 'Ciao, mondo!'.
WRITE 'Mi chiamo Ada.'.
```

I due testi compaiono sulla stessa riga, separati da uno spazio: `WRITE` continua sulla riga corrente finché non ne chiedi una nuova, come vedrai in [L'output con WRITE](./0011-output-with-write.md). Senza l'apice di chiusura, il controllo segnala un errore come "I letterali che occupano più di una riga non sono ammessi": il letterale non finisce mai.

> [!NOTE]
>
> - Un report (programma eseguibile) inizia con `REPORT nome.` e si esegue con `F8`.
> - Crei i programmi in ADT (**New > ABAP Program**) o in `SE38`; entrambi lavorano sullo stesso oggetto.
> - Il ciclo è sempre lo stesso: salvare, controllare (`Ctrl+F2`), attivare (`Ctrl+F3`), eseguire.
> - Un oggetto con errori resta inattivo; tutti gli altri continuano a eseguire la vecchia versione attiva.
> - In ABAP Cloud il primo programma è una classe con `if_oo_adt_classrun`, eseguita con `F9`.
