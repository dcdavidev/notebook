---
title: L'output con WRITE
description: Stampare testi e valori su una lista classica, con posizioni e formati.
---

_Livello principiante_

`WRITE` stampa testi e valori su una **lista classica**: la semplice schermata di output, simile a una pagina, che hai visto eseguendo [il tuo primo programma](./0008-hello-world.it.md). Le applicazioni moderne mostrano i dati in griglie e app Fiori, ma `WRITE` resta il modo più rapido per vedere che cosa fa un piccolo programma, e lo troverai in migliaia di report esistenti.

Questa lezione tratta righe, posizioni e le opzioni di formato più utili.

## Righe e catene

Ogni `WRITE` continua sulla riga corrente, con uno spazio tra un output e l'altro. Una barra (`/`) inizia una nuova riga:

```abap
REPORT zwrite_demo.

WRITE 'Voli'.
WRITE 'di oggi'.              " stessa riga: "Voli di oggi"
WRITE / 'Seconda riga'.       " nuova riga
WRITE: / 'Terza riga', 'ancora la terza'.
```

L'ultima istruzione è un'istruzione concatenata, come in [Le regole della sintassi ABAP](./0009-syntax-rules.it.md): `WRITE` si scrive una volta e le parti sono separate da virgole. La maggior parte delle liste si scrive così.

Altre tre istruzioni danno forma alla pagina:

| Istruzione | Che cosa fa                                    |
| ---------- | ---------------------------------------------- |
| `SKIP`     | lascia una riga vuota (`SKIP 3` ne lascia tre) |
| `ULINE`    | traccia una linea orizzontale lungo la lista   |
| `NEW-LINE` | inizia una nuova riga, come `/`                |

Quando la riga è piena, l'output continua su quella successiva. La larghezza della lista la decide il programma o la dimensione della finestra; puoi impostarla con `REPORT zwrite_demo LINE-SIZE 120.`

## Posizioni e lunghezze

Puoi scegliere la colonna in cui inizia un output e quanti caratteri occupa. La forma completa è `WRITE AT /pos(len) valore`, e ogni parte è facoltativa:

```abap
WRITE: / 'Compagnia', 15 'Da',        30 'A'.
WRITE: / 'LH',        15 'Francoforte', 30 'New York'.
WRITE: / 'AZ',        15 'Roma',      30 'Tokyo'.
WRITE AT /15(4) 'Francoforte'.      " solo 4 caratteri: "Fran"
ULINE AT /1(40).                    " una linea lunga 40 caratteri
```

- `/` inizia una nuova riga;
- `15` è la colonna in cui inizia l'output;
- `(4)` è la **lunghezza di output**: i valori più lunghi vengono troncati.

In questo esempio i valori sono letterali, quindi `AT` è facoltativo. `AT` serve quando la posizione o la lunghezza sono variabili.

Ogni tipo ha una lunghezza di output predefinita. Il testo è allineato a sinistra, i numeri sono allineati a destra nel loro campo:

```abap
WRITE / 42.         " il numero compare allineato a destra, dopo degli spazi
WRITE / '42'.       " il testo compare all'inizio della riga
```

## Formati e colori

Le opzioni di formato seguono il valore:

| Opzione                                                               | Che cosa fa                                         |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| `COLOR COL_HEADING`, `COL_TOTAL`, `COL_POSITIVE`, `COL_NEGATIVE`, ... | colore di sfondo dell'output                        |
| `INTENSIFIED OFF`                                                     | colore più chiaro                                   |
| `INVERSE`                                                             | testo colorato invece dello sfondo colorato         |
| `LEFT-JUSTIFIED`, `CENTERED`, `RIGHT-JUSTIFIED`                       | allineamento dentro la lunghezza di output          |
| `NO-GAP`                                                              | nessuno spazio dopo questo output                   |
| `NO-ZERO`                                                             | gli zeri iniziali diventano spazi                   |
| `USING EDIT MASK`                                                     | applica uno schema, come `'__:__:__'` per gli orari |

```abap
WRITE / 'Tutto esaurito' COLOR COL_NEGATIVE.
WRITE / 'Posti liberi'   COLOR COL_POSITIVE INTENSIFIED OFF.
WRITE AT /1(20) 'Totale' CENTERED COLOR COL_TOTAL.
WRITE: / 'ABC', 'DEF' NO-GAP, 'GHI'.         " "ABC DEFGHI"
WRITE / '000123' NO-ZERO.                    " "   123"
```

Per colorare più output, usa `FORMAT` invece di ripetere l'opzione. Resta attivo finché non lo cambi o non scrivi `FORMAT RESET`:

```abap
FORMAT COLOR COL_HEADING.
WRITE: / 'Compagnia', 15 'Da', 30 'A'.
FORMAT RESET.
```

## Date, orari e l'utente

Date e orari vengono formattati per l'utente che esegue il programma, con il formato data e i separatori delle impostazioni utente (transazione `SU3`):

```abap
WRITE: / 'Stampato da', sy-uname,
       / 'Data:', sy-datum,                        " per esempio 19.11.2026 o 11/19/2026
       / 'Ora:', sy-uzeit USING EDIT MASK '__:__:__'.
```

`sy-uname`, `sy-datum` e `sy-uzeit` sono **campi di sistema**: valori che il runtime riempie per te, qui il nome utente, la data e l'ora. Li trovi in [I campi di sistema](./0023-system-fields.it.md).

> [!WARNING]
> Nei programmi veri non scrivere direttamente nel `WRITE` i testi che leggono gli utenti: non si possono tradurre. Usa i simboli di testo come `TEXT-001`, spiegati in [Simboli di testo e traduzione](./0062-text-symbols-and-translation.it.md). Gli esempi di questo corso usano i letterali per restare brevi.

> [!TIP]
> Una lista classica è come una pagina scritta a macchina. Puoi spostare il carrello su una colonna, andare a capo e passare al nastro rosso, ma una volta che un carattere è sulla pagina non lo sposti più.

Le liste classiche non esistono in ABAP Cloud, e i report moderni mostrano le tabelle con l'ALV, come vedrai in [ALV con CL_SALV_TABLE](./0099-alv-with-salv.it.md). Per imparare e per le verifiche veloci, `WRITE` è perfetto.

## Esercizio

> [!IMPORTANT]
> Scrivi un report `ZFLIGHT_BOARD` che stampi questo tabellone delle partenze: un'intestazione colorata, una linea sotto, tre voli in colonne che iniziano a 1, 10 e 25, e un piè di pagina con il tuo nome utente e la data.
>
> ```text
> Partenze
> ----------------------------------------
> LH 400   Francoforte    New York
> AZ 788   Roma           Tokyo
> UA 941   Francoforte    San Francisco
> ```

### Soluzione

```abap
REPORT zflight_board.

WRITE AT /1(40) 'Partenze' COLOR COL_HEADING.
ULINE AT /1(40).
WRITE: / 'LH 400', 10 'Francoforte', 25 'New York',
       / 'AZ 788', 10 'Roma',        25 'Tokyo',
       / 'UA 941', 10 'Francoforte', 25 'San Francisco'.
SKIP.
WRITE: / 'Stampato da', sy-uname, 'il', sy-datum.
```

> [!NOTE]
>
> - `WRITE` continua la riga corrente; `/` ne inizia una nuova; `SKIP` e `ULINE` aggiungono spazio e linee.
> - `WRITE AT /pos(len)` imposta la colonna e la lunghezza di output; i valori più lunghi vengono troncati.
> - Il testo è allineato a sinistra, i numeri a destra nella loro lunghezza di output.
> - `COLOR`, `NO-GAP`, `NO-ZERO` e `USING EDIT MASK` cambiano il formato; `FORMAT` applica un formato a più output.
> - Le date seguono le impostazioni utente; le liste classiche non sono disponibili in ABAP Cloud.
