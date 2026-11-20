---
title: Gli ABAP Development Tools in Eclipse
description: Installare ADT, collegarsi a un sistema e orientarsi nell'IDE.
---

_Livello principiante_

Gli **ABAP Development Tools** (ADT) sono un insieme di plug-in che trasformano l'IDE Eclipse in un editor ABAP. Sono lo strumento consigliato da SAP per lo sviluppo ABAP, e per alcuni oggetti l'unico: viste CDS, behavior definition e tutto ciò che riguarda ABAP Cloud si modificano solo in ADT.

Continuerai a usare SAP GUI, come hai visto in [SAP GUI e codici transazione](./0005-sap-gui-and-transaction-codes.it.md), ma gran parte del codice di questo corso è più comoda da scrivere in Eclipse.

## Installare ADT

ADT è gratuito. Ti servono:

1. **Eclipse**: scarica una release recente dell'IDE Eclipse da eclipse.org (il pacchetto "Eclipse IDE for Java Developers" va bene). Controlla sulla pagina SAP Development Tools le versioni di Eclipse supportate da ADT.
2. **I plug-in ADT**: in Eclipse scegli **Help > Install New Software**, inserisci l'update site `https://tools.hana.ondemand.com/latest`, seleziona **ABAP Development Tools** e segui la procedura guidata. Riavvia Eclipse quando te lo chiede.
3. **SAP GUI** (facoltativo ma utile): ADT lo usa per aprire, dentro un editor di Eclipse, le schermate che esistono solo in SAP GUI. Su Windows installa SAP GUI for Windows; su macOS e Linux, SAP GUI for Java.

Dopo il riavvio passa alla **prospettiva ABAP**: **Window > Perspective > Open Perspective > Other > ABAP**. Una **prospettiva** è una disposizione salvata di viste ed editor per un certo tipo di lavoro.

## Collegarsi a un sistema

In ADT ogni connessione a un sistema è un **progetto ABAP**:

- **Sistema on-premise**: **File > New > ABAP Project**. Scegli il sistema dal tuo elenco di SAP Logon, poi inserisci mandante, utente, password e lingua, proprio come nella schermata di accesso di SAP GUI.
- **SAP BTP ABAP environment**: **File > New > ABAP Cloud Project**, e accedi con la service key o l'URL che ti dà l'amministratore.

Il progetto compare nel **Project Explorer**. Ogni progetto mostra i tuoi **Favorite Packages**, a partire da `$TMP` (i tuoi oggetti locali), e la **System Library** con tutti i pacchetti del sistema. Aggiungi ai preferiti i pacchetti su cui lavori; i pacchetti sono spiegati in [Pacchetti e richieste di trasporto](./0007-packages-and-transport-requests.it.md).

> [!TIP]
> Un progetto ABAP è come un segnalibro che ti fa anche accedere. Il codice non vive nella cartella del progetto sul tuo PC: resta nel sistema SAP, e ADT ti apre una finestra su di esso.

## Orientarsi nell'IDE

La prospettiva ABAP ha alcune viste che userai continuamente:

| Vista               | Che cosa mostra                                                 |
| ------------------- | --------------------------------------------------------------- |
| Project Explorer    | i tuoi progetti, pacchetti e oggetti                            |
| Editor              | il codice sorgente dell'oggetto aperto                          |
| Outline             | la struttura dell'oggetto corrente: tipi, dati, metodi          |
| Problems            | errori di sintassi e avvertimenti dell'ultimo controllo         |
| Properties          | pacchetto, autore, versione del linguaggio e altre impostazioni |
| Transport Organizer | le tue richieste di trasporto                                   |
| ABAP Console        | l'output di una classe eseguita come applicazione console       |

Per aprire un oggetto non serve sfogliare l'albero: premi `Ctrl+Shift+A` (**Open ABAP Development Object**) e digita una parte del nome, per esempio `SCARR` o `CL_SALV_TABLE`.

## Le scorciatoie da tastiera

Queste scorciatoie coprono quasi tutto il lavoro quotidiano:

| Scorciatoia     | Che cosa fa                                                            |
| --------------- | ---------------------------------------------------------------------- |
| `Ctrl+Shift+A`  | apre un oggetto di sviluppo per nome                                   |
| `Ctrl+Space`    | completamento del codice                                               |
| `Ctrl+1`        | quick fix: fai creare ad ADT un metodo o una variabile mancante        |
| `F2`            | mostra documentazione e firma dell'elemento sotto il cursore           |
| `F3`            | va alla definizione dell'elemento sotto il cursore                     |
| `Ctrl+F2`       | controlla la sintassi                                                  |
| `Ctrl+F3`       | attiva l'oggetto corrente                                              |
| `Ctrl+Shift+F3` | attiva tutti gli oggetti inattivi                                      |
| `Shift+F1`      | formatta il codice sorgente (il pretty printer)                        |
| `F8`            | esegue un report nella SAP GUI integrata                               |
| `F9`            | esegue una classe nella ABAP Console                                   |
| `F1`            | documentazione delle parole chiave ABAP per la parola sotto il cursore |

`F1` è particolarmente utile: la **documentazione delle parole chiave ABAP** è il riferimento ufficiale del linguaggio, e si apre direttamente nell'IDE.

> [!WARNING]
> Salvare non è attivare. `Ctrl+S` salva una versione **inattiva**, e il sistema continua a eseguire la vecchia versione attiva finché non attivi. Attiva con `Ctrl+F3` quando vuoi che la modifica conti. Lo metterai in pratica in [Il tuo primo programma](./0008-hello-world.it.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Installa Eclipse e ADT e crea un progetto ABAP per il tuo sistema.
> 2. Premi `Ctrl+Shift+A`, apri la tabella di database `SCARR` e guarda i suoi campi.
> 3. Metti il cursore sulla parola `SELECT` in un programma qualsiasi e premi `F1`.

### Soluzione

1. **File > New > ABAP Project** (o **ABAP Cloud Project** su SAP BTP). Dopo l'accesso il progetto compare nel Project Explorer, con `$TMP` tra i pacchetti preferiti.
2. ADT apre `SCARR` in un editor di codice: nelle release recenti la definizione della tabella è mostrata come testo, con `mandt`, `carrid`, `carrname`, `currcode` e `url`.
3. Si apre la documentazione delle parole chiave ABAP sull'istruzione `SELECT`, con la sintassi, le aggiunte e gli esempi.

> [!NOTE]
>
> - ADT è un insieme di plug-in Eclipse per ABAP, installati da `https://tools.hana.ondemand.com/latest`.
> - Un progetto ABAP è una connessione a un sistema e a un mandante; il codice resta nel sistema.
> - `Ctrl+Shift+A` apre qualsiasi oggetto, `F2` e `F3` spiegano e navigano, `F1` apre la documentazione delle parole chiave.
> - `Ctrl+F2` controlla, `Ctrl+F3` attiva: salvare da solo non attiva.
> - Gli oggetti CDS, RAP e ABAP Cloud si modificano solo in ADT.
