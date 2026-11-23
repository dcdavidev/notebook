---
title: Simboli di testo e traduzione
description: Tenere i testi fuori dal codice e tradurli.
level: basic
---

Un sistema SAP viene usato in più lingue contemporaneamente: un utente a Milano fa il logon in italiano, un collega a Monaco in tedesco. Un letterale di testo come `'Totale'` nel codice viene mostrato in italiano a tutti. Per mostrare a ogni utente la sua lingua, i testi devono stare fuori dal codice, dove i traduttori possono raggiungerli.

Ogni programma ha un **pool di testi** con i suoi **elementi di testo**: simboli di testo, testi di selezione, titolo e intestazioni di lista. Sono memorizzati per lingua, e il programma mostra la versione nella lingua di logon dell'utente.

## I simboli di testo

Un **simbolo di testo** è un testo con un ID di tre caratteri, come `001` o `A01`. In SAP GUI li gestisci con **Passa a > Elementi di testo > Simboli di testo**, in ADT aprendo gli elementi di testo del programma (dal menu contestuale del programma, **Open Others > Text Elements**).

```text
Simboli di testo di ZTEXT_DEMO
  Sim  Testo                     Lungh. max
  001  Compagnia                 20
  002  Numero di collegamenti    30
  003  Nessun dato trovato       30
```

Nel codice usi un simbolo di testo in due modi:

```abap
REPORT ztext_demo.

" 1. TEXT-nnn: il simbolo di testo da solo
WRITE: / TEXT-001.

" 2. Un letterale con l'ID del simbolo: il letterale fa da riserva
WRITE: / 'Numero di collegamenti'(002).
```

Con la seconda forma il programma mostra il simbolo di testo `002` se esiste nella lingua di logon, altrimenti il letterale. Il codice resta leggibile, perché vedi il testo nel punto in cui lo usi.

> [!TIP]
> I simboli di testo funzionano come i cartelli numerati di un aeroporto. Il cartello dice "Gate 12" nella lingua della carta d'imbarco di ogni passeggero, ma la piantina dell'aeroporto dice solo "cartello 12". Cambi lingua, e ogni cartello cambia senza spostarne nemmeno uno.

In SAP GUI fai doppio clic sull'ID del simbolo nell'editor per crearlo o aprirlo. In ADT la quick fix (`Ctrl+1`) su un letterale come `'Compagnia'(001)` propone di creare il simbolo di testo.

> [!WARNING]
> `TEXT-001` da solo è vuoto se il simbolo non esiste nella lingua di logon e non è configurata una lingua di riserva. Una traduzione mancante mostra allora uno spazio vuoto al posto del testo. Preferisci la forma `'Compagnia'(001)`, che ripiega sul letterale.

I simboli di testo funzionano anche nei template di stringa, come normali oggetti dati:

```abap
DATA(lv_count) = 42.
WRITE: / |{ TEXT-002 }: { lv_count }|.
```

## I testi di selezione e gli altri elementi di testo

Gli altri elementi di testo di un programma:

| Elemento di testo     | Che cos'è                                                                    |
| --------------------- | ---------------------------------------------------------------------------- |
| Testi di selezione    | le etichette di `PARAMETERS` e `SELECT-OPTIONS` nella schermata di selezione |
| Titolo                | il titolo del programma, mostrato nella barra del titolo                     |
| Intestazioni di lista | l'intestazione e i titoli delle colonne di una lista classica                |

Senza un testo di selezione, la schermata di selezione mostra il nome tecnico, per esempio `P_CARR`. Per un parametro tipizzato con un elemento dati, seleziona **Rif. Dizionario** nei testi di selezione: l'etichetta arriva dall'elemento dati, che è già tradotto. `PARAMETERS` lo vedrai in [Schermate di selezione: PARAMETERS](./0063-parameters.md).

## Tradurre i testi

I testi li gestisci nella **lingua originale** del programma, la lingua di logon che usavi quando l'hai creato. I traduttori li traducono nelle altre lingue con la transazione `SE63`, oppure direttamente dall'editor con **Passa a > Traduzione**.

In `SE63` scegli **Traduzione > Oggetti ABAP > Testi brevi**, seleziona il tipo di oggetto per i testi dei programmi (il pool di testi) e inserisci il nome del programma, la lingua di origine e la lingua di destinazione.

Le traduzioni fanno parte del programma e viaggiano nella stessa richiesta di trasporto. Lo stesso meccanismo vale per tutto ciò che in SAP ha un testo: i [messaggi](./0061-messages.md), le etichette degli elementi dati, i valori fissi dei domini e i testi degli oggetti del Dizionario.

> [!CAUTION]
> Gli elementi di testo vanno **attivati** dopo ogni modifica. Un programma con elementi di testo non attivi mostra i testi vecchi, o nessun testo, e la modifica non viene trasportata.

## Che cosa non tradurre

Non tutti i testi vanno nel pool di testi. Tieni come letterali:

- i valori tecnici con cui il programma fa confronti, come `'X'` o `'LH'`;
- i nomi di tabelle, campi e transazioni;
- i testi che non vengono mai mostrati agli utenti, come le chiavi di un log.

Per i testi delle classi globali, usati per esempio nei web service o nelle app Fiori, usi allo stesso modo i simboli di testo della classe (in ADT: **Text Elements** della classe).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che elenca le compagnie di `SCARR` con una riga di intestazione fatta dei simboli di testo `001` (Compagnia) e `002` (Nome), e un messaggio dal simbolo `003` quando non trova niente.
> 2. Fai il logon in una seconda lingua, traduci i tre simboli con `SE63` o **Passa a > Traduzione** ed esegui di nuovo il report.

### Soluzione

```abap
REPORT ztext_exercise.

SELECT carrid, carrname
  FROM scarr
  INTO TABLE @DATA(lt_carriers).

IF lt_carriers IS INITIAL.
  WRITE: / 'Nessun dato trovato'(003).
  RETURN.
ENDIF.

WRITE: / 'Compagnia'(001), 20 'Nome'(002).
ULINE.
LOOP AT lt_carriers INTO DATA(ls_carrier).
  WRITE: / ls_carrier-carrid, 20 ls_carrier-carrname.
ENDLOOP.
```

Dopo la traduzione, le intestazioni compaiono nella lingua con cui fai il logon. I nomi delle compagnie arrivano dal database e non cambiano.

> [!NOTE]
>
> - Gli elementi di testo (simboli di testo, testi di selezione, titolo, intestazioni di lista) tengono i testi per l'utente fuori dal codice.
> - Usa `'letterale'(nnn)`: mostra il simbolo di testo e, se manca, ripiega sul letterale.
> - Seleziona **Rif. Dizionario** nei testi di selezione per riusare l'etichetta tradotta dell'elemento dati.
> - Traduci con `SE63` o **Passa a > Traduzione**; le traduzioni viaggiano con il programma.
> - Attiva gli elementi di testo dopo ogni modifica.
