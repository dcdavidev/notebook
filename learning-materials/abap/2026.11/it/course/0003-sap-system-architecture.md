---
title: L'architettura di un sistema SAP
description: Livello di presentazione, applicativo e database, work process e istanze.
level: beginner
---

Un sistema SAP non è un programma su un computer. È un insieme di processi che collaborano, di solito distribuiti su più server, e che condividono un unico database. Sapere come si incastrano spiega molte cose che vedrai da sviluppatore: perché un programma va "in timeout", perché un job in background gira da un'altra parte o perché il codice che scrivi non gira mai sul tuo PC.

## Tre livelli

Un sistema SAP è costruito su tre livelli, un'**architettura a tre livelli** (_three-tier_):

| Livello       | Che cosa ci gira                                         | Esempi                                            |
| ------------- | -------------------------------------------------------- | ------------------------------------------------- |
| Presentazione | l'interfaccia utente: mostra le schermate, invia l'input | SAP GUI, un browser con SAP Fiori                 |
| Applicativo   | il runtime ABAP: esegue i tuoi programmi                 | l'application server ABAP (AS ABAP)               |
| Database      | conserva tutti i dati e tutto il codice                  | SAP HANA (S/4HANA), oppure Oracle, Db2, ... (ECC) |

- Il **livello di presentazione** non contiene logica di business. SAP GUI è un "thin client": disegna quello che il server gli dice di disegnare.
- Il **livello applicativo** esegue tutto il codice ABAP. Può crescere in orizzontale: un sistema grande ha molti application server che lavorano fianco a fianco.
- Il **livello database** è un unico database per sistema. Contiene i dati di business (ordini, fatture), la configurazione e il repository con ogni programma e ogni classe.

> [!TIP]
> Torna al ristorante. La sala è il livello di presentazione: i camerieri prendono le ordinazioni e portano i piatti, ma non cucinano. La cucina è il livello applicativo: i cuochi fanno il lavoro vero, e in un ristorante affollato sono tanti. La dispensa è il database: ce n'è una sola, e ogni cuoco prende gli ingredienti da lì.

## Istanze e work process

Un application server esegue una o più **istanze**. Un'istanza è un gruppo di processi avviati insieme, con la propria memoria, identificato da un **numero di istanza** (due cifre, per esempio `00`).

Dentro ogni istanza:

- Il **dispatcher** riceve le richieste degli utenti e le mette in coda.
- I **work process** prendono le richieste dalla coda e le eseguono. Ogni work process è un processo separato del sistema operativo, con la propria connessione al database.

Esistono diversi tipi di work process:

| Tipo | Nome       | Che cosa fa                                                              |
| ---- | ---------- | ------------------------------------------------------------------------ |
| DIA  | Dialog     | esegue le richieste interattive degli utenti                             |
| BTC  | Background | esegue i job in background, senza un utente in attesa                    |
| UPD  | Update     | scrive le modifiche sul database in modo asincrono (update task)         |
| UP2  | Update 2   | esegue gli aggiornamenti a bassa priorità, come le statistiche           |
| ENQ  | Enqueue    | gestisce i blocchi SAP (nei sistemi moderni, un enqueue server separato) |
| SPO  | Spool      | invia l'output alle stampanti                                            |

Un sistema ha anche dei servizi centrali: il **message server**, che conosce tutte le istanze e distribuisce gli utenti tra di esse, e l'**enqueue server**, che conserva la tabella dei blocchi. L'**ICM** (Internet Communication Manager) gestisce il traffico HTTP, per esempio le app Fiori e i web service.

## Un passo di dialogo

Quando premi Invio su una schermata, succede questo:

1. SAP GUI invia il tuo input al dispatcher della tua istanza.
2. Il dispatcher mette la richiesta in coda.
3. Un work process di dialogo libero la prende, carica il contesto del tuo programma ed esegue il codice ABAP.
4. Il codice legge e scrive sul database attraverso la connessione del work process.
5. Il risultato torna a SAP GUI e il work process si libera per l'utente successivo.

Uno di questi giri completi è un **passo di dialogo** (_dialog step_). Un work process ti serve solo per la durata di un passo di dialogo, poi serve qualcun altro. È così che poche decine di work process riescono a servire centinaia di utenti.

> [!WARNING]
> I work process di dialogo hanno un limite di tempo (parametro `rdisp/max_wprun_time`, spesso tra 10 e 60 minuti a seconda della release e delle impostazioni del sistema). Un programma che in dialogo dura di più viene fermato con l'errore di runtime `TIME_OUT`. I programmi lunghi vanno eseguiti in background, come vedrai in [Varianti e job in background](./0068-variants-and-background-jobs.md).

## Dove vederlo

Alcune transazioni mostrano l'architettura di un sistema in funzione. Imparerai ad aprire le transazioni in [SAP GUI e codici transazione](./0005-sap-gui-and-transaction-codes.md).

| Transazione | Che cosa mostra                                                |
| ----------- | -------------------------------------------------------------- |
| `SM51`      | le istanze di application server del sistema                   |
| `SM50`      | i work process dell'istanza corrente e che cosa stanno facendo |
| `SM66`      | i work process di tutte le istanze                             |
| `SM04`      | gli utenti collegati all'istanza corrente                      |

## Esercizio

> [!IMPORTANT]
>
> 1. Apri la transazione `SM51` e conta le istanze del tuo sistema.
> 2. Apri `SM50` e conta i work process di dialogo (`DIA`) e di background (`BTC`). Trova il tuo: è quello che riporta il tuo nome utente.

### Soluzione

1. Ogni riga di `SM51` è un'istanza, con il nome dell'host, l'ID del sistema e il numero di istanza (per esempio `sapdev_DEV_00`). I piccoli sistemi di formazione spesso ne hanno una sola.
2. In `SM50` la colonna **Tipo** mostra `DIA`, `BTC`, `UPD` e così via. Mentre guardi l'elenco, un work process di dialogo è occupato con la tua richiesta: la sua colonna **Utente** riporta il tuo nome utente e la colonna **Report** il programma che costruisce l'elenco.

> [!NOTE]
>
> - Un sistema SAP ha tre livelli: presentazione, applicativo e database.
> - Tutto il codice ABAP gira sull'application server; SAP GUI mostra solo le schermate.
> - Un'istanza ha un dispatcher e diversi work process: dialog, background, update, enqueue e spool.
> - Un work process serve un utente per un passo di dialogo alla volta.
> - `SM51`, `SM50` e `SM66` mostrano le istanze e i work process di un sistema in funzione.
