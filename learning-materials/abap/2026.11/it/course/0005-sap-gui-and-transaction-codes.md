---
title: SAP GUI e codici transazione
description: Accedere, muoversi e aprire le transazioni che uno sviluppatore usa ogni giorno.
---

_Livello principiante_

**SAP GUI** è il client desktop classico dei sistemi SAP. Anche se scriverai gran parte del codice in Eclipse, userai SAP GUI ogni giorno: per eseguire programmi, guardare i dati, leggere i dump e aprire i tanti strumenti che esistono solo lì.

In SAP GUI ci arrivi a tutto tramite i **codici transazione**: nomi brevi come `SE38` o `SE11` che aprono un'applicazione precisa. Imparare a muoversi con i codici transazione è il modo più rapido per orientarsi in un sistema.

## L'accesso

SAP GUI si avvia con **SAP Logon**, una piccola finestra con l'elenco dei sistemi a cui puoi collegarti. I dati di connessione te li dà l'amministratore (o un elenco già pronto). Fai doppio clic su un sistema per aprire la schermata di accesso e compila:

| Campo    | Significato                                          |
| -------- | ---------------------------------------------------- |
| Mandante | il numero di mandante a tre cifre, per esempio `100` |
| Utente   | il tuo nome utente in quel sistema                   |
| Password | la tua password (la cambierai al primo accesso)      |
| Lingua   | la lingua di accesso, per esempio `IT` o `EN`        |

La lingua di accesso decide la lingua di menu, testi e messaggi. Puoi accedere allo stesso sistema in lingue diverse e vedere gli stessi programmi con testi diversi. I mandanti li hai conosciuti in [Landscape di sistema e mandanti](./0004-system-landscape-and-clients.md).

## La finestra di SAP GUI

Dopo l'accesso vedi il menu **SAP Easy Access**. Ogni schermata di SAP GUI ha le stesse parti:

```text
+----------------------------------------------------------------+
| Barra dei menu       Menu, Elabora, Preferiti, Extra, Sistema  |
| Barra standard       [campo comandi] [Salva] [Indietro] ...    |
| Barra del titolo     il nome della schermata corrente          |
| Barra applicazione   i pulsanti dell'applicazione corrente     |
|                                                                |
| Area dello schermo   campi, liste e alberi                     |
|                                                                |
| Barra di stato       messaggi e informazioni di sistema        |
+----------------------------------------------------------------+
```

- Il **campo comandi** è il campo di input in alto a sinistra nella barra standard. È lì che digiti i codici transazione.
- La **barra di stato** in basso mostra i messaggi: verdi per i successi, gialli per gli avvertimenti, rossi per gli errori. Leggila ogni volta che qualcosa non funziona.
- **Sistema > Stato** mostra dove ti trovi: la transazione, il programma, il numero di schermata, il mandante e la release.

Alcuni tasti funzione valgono quasi ovunque:

| Tasto      | Che cosa fa                                |
| ---------- | ------------------------------------------ |
| `Invio`    | conferma l'input                           |
| `F1`       | guida sul campo in cui si trova il cursore |
| `F3`       | torna alla schermata precedente            |
| `Shift+F3` | esce dall'applicazione corrente            |
| `F12`      | annulla senza salvare                      |
| `F4`       | elenco dei valori possibili per il campo   |
| `F8`       | esegui (per esempio un report)             |
| `Ctrl+S`   | salva                                      |

## I codici transazione

Un **codice transazione** è il nome di un punto di accesso a un'applicazione. Lo digiti nel campo comandi e premi Invio. Il campo comandi accetta anche alcuni prefissi:

| Input    | Che cosa fa                                                |
| -------- | ---------------------------------------------------------- |
| `SE38`   | apre `SE38`, solo dal menu Easy Access                     |
| `/nSE38` | chiude la transazione corrente e apre `SE38`               |
| `/oSE38` | apre `SE38` in una nuova finestra (una nuova **sessione**) |
| `/n`     | chiude la transazione corrente e torna al menu             |
| `/i`     | chiude la sessione corrente                                |
| `/nend`  | esce dal sistema, dopo aver chiesto conferma               |

Puoi tenere aperte più sessioni contemporaneamente (sei per default), per esempio l'editor in una e il data browser in un'altra.

> [!WARNING]
> `/n` chiude la transazione corrente **senza salvare**. Se hai modifiche non salvate in un editor, le perdi. Salva prima, oppure apri la nuova transazione in un'altra sessione con `/o`.

> [!TIP]
> I codici transazione sono come i numeri rapidi del telefono. Puoi sempre sfogliare la rubrica (l'albero del menu Easy Access), ma quando conosci il numero, un codice breve ti porta subito a destinazione.

## Le transazioni dello sviluppatore

Queste sono le transazioni che userai di più come sviluppatore ABAP. Aggiungi ai **Preferiti** quelle che usi spesso (clic destro su **Preferiti > Inserisci transazione**).

| Transazione | Che cosa apre                                                                   |
| ----------- | ------------------------------------------------------------------------------- |
| `SE80`      | Object Navigator: tutto l'ABAP Workbench in un unico albero                     |
| `SE38`      | ABAP Editor: creare ed eseguire programmi                                       |
| `SE11`      | Dizionario ABAP: tabelle, elementi dati, domini, tipi                           |
| `SE24`      | Class Builder: classi e interfacce globali                                      |
| `SE37`      | Function Builder: moduli funzione                                               |
| `SE91`      | classi di messaggi                                                              |
| `SE93`      | codici transazione: visualizzarli o crearli                                     |
| `SE16N`     | data browser: guardare il contenuto di una tabella                              |
| `SE09`      | Transport Organizer: le tue richieste di trasporto                              |
| `ST22`      | errori di runtime (dump)                                                        |
| `SU3`       | le tue impostazioni utente: formato data, notazione decimale, valori di default |

Per scoprire quale transazione apre una schermata, guarda **Sistema > Stato**. Per vedere i codici transazione nell'albero del menu Easy Access, attiva **Extra > Impostazioni > Visualizza nomi tecnici**.

## Esercizio

> [!IMPORTANT]
>
> 1. Accedi al tuo sistema e attiva la visualizzazione dei nomi tecnici nel menu Easy Access.
> 2. Apri `SE38` con `/nSE38`, poi apri `SE11` in una seconda sessione con `/oSE11`.
> 3. Aggiungi `SE38`, `SE11` e `SE80` ai tuoi Preferiti.

### Soluzione

1. **Extra > Impostazioni**, spunta **Visualizza nomi tecnici** e conferma: ogni voce di menu ora mostra il suo codice transazione.
2. `/nSE38` sostituisce la schermata corrente con l'ABAP Editor; `/oSE11` apre una nuova finestra di SAP GUI con il Dizionario ABAP, mentre la prima finestra resta su `SE38`.
3. Clic destro su **Preferiti**, scegli **Inserisci transazione**, digita il codice transazione e conferma. Ripeti per ognuno.

> [!NOTE]
>
> - SAP GUI è il client classico: SAP Logon elenca i sistemi, la schermata di accesso chiede mandante, utente, password e lingua.
> - Il campo comandi accetta i codici transazione, con `/n` (stessa sessione) e `/o` (nuova sessione).
> - La barra di stato mostra i messaggi; **Sistema > Stato** mostra dove ti trovi.
> - `SE80`, `SE38`, `SE11`, `SE24`, `SE37`, `SE16N` e `ST22` sono le transazioni di tutti i giorni dello sviluppatore.
> - Salva prima di usare `/n`: esce dalla transazione senza salvare.
