---
title: Benvenuto nel mondo SAP e ABAP
description: Che cos'è SAP, dove vive ABAP, come si scrive il primo programma.
---

_Settimana 1 · Livello base · 4 ore_

## Come usare questo corso

Il corso dura **3 settimane**, 5 giorni a settimana, 4 ore al giorno (60 ore in totale). Ogni giorno è una lezione come questa.

| Settimana | Livello    | Argomenti principali                                                                |
| --------- | ---------- | ----------------------------------------------------------------------------------- |
| 1         | Base       | SAP, sintassi, tipi di dato, controllo del flusso, Dizionario Dati, tabelle interne |
| 2         | Intermedio | SQL, modularizzazione, report, schermate, ALV, programmazione a oggetti             |
| 3         | Avanzato   | Eccezioni, ABAP moderno, test, enhancement, interfacce, CDS, HANA, RAP e ABAP Cloud |

Ogni giornata è divisa in 4 blocchi da circa 50 minuti, con 10 minuti di pausa tra un blocco e l'altro. Alla fine trovi esercizi, un quiz e le soluzioni.

> [!NOTE]
> Regola d'oro del corso: non leggere soltanto. Scrivi ogni riga di codice a mano nel tuo sistema, eseguila, cambiala, rompila e guarda cosa succede. Si impara programmando, non leggendo.

### Programma di oggi

| Blocco | Contenuto                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------- |
| Ora 1  | Che cos'è SAP, che cos'è un ERP, che cos'è ABAP                                                 |
| Ora 2  | L'architettura di un sistema SAP: livelli, sistemi, mandanti, trasporti                         |
| Ora 3  | Gli strumenti: SAP GUI, transazioni, SE80, SE38, Eclipse ADT. Come ottenere un sistema di prova |
| Ora 4  | Il primo programma, le regole di sintassi, esercizi                                             |

## Ora 1 – Che cos'è SAP e che cos'è ABAP

### SAP, l'azienda e il software

SAP è un'azienda tedesca fondata nel 1972. Produce software gestionale per le aziende. Il suo prodotto più famoso oggi si chiama **SAP S/4HANA**; la versione precedente, ancora usatissima, si chiama **SAP ECC** (o R/3).

### Che cos'è un ERP

ERP significa _Enterprise Resource Planning_: un unico software che gestisce tutte le attività di un'azienda. Acquisti, vendite, magazzino, contabilità, produzione, personale: tutto in un solo sistema e in un solo database.

> [!TIP]
> Immagina un'azienda come un grande ristorante. C'è chi ordina gli ingredienti (acquisti), chi li conserva in dispensa (magazzino), chi cucina (produzione), chi serve ai tavoli (vendite) e chi fa i conti a fine giornata (contabilità). Senza un ERP ognuno usa il proprio quaderno e le informazioni non coincidono mai. Con un ERP c'è un'unica lavagna gigante che tutti leggono e aggiornano: se il cameriere vende un piatto, la dispensa sa subito che mancano ingredienti e la contabilità registra subito l'incasso.

I moduli principali di SAP hanno sigle che sentirai spesso:

| Sigla    | Nome                            | Di cosa si occupa                        |
| -------- | ------------------------------- | ---------------------------------------- |
| FI       | Financial Accounting            | Contabilità generale, clienti, fornitori |
| CO       | Controlling                     | Controllo di gestione, centri di costo   |
| SD       | Sales and Distribution          | Vendite, ordini cliente, fatture         |
| MM       | Materials Management            | Acquisti, magazzino, materiali           |
| PP       | Production Planning             | Pianificazione della produzione          |
| HR / HCM | Human Capital Management        | Personale, buste paga                    |
| PM       | Plant Maintenance               | Manutenzione impianti                    |
| QM       | Quality Management              | Controllo qualità                        |
| WM / EWM | (Extended) Warehouse Management | Gestione dettagliata dei magazzini       |

### Che cos'è ABAP

**ABAP** (_Advanced Business Application Programming_) è il linguaggio di programmazione con cui è scritta gran parte di SAP. Con ABAP tu puoi:

- creare nuovi report (programmi che leggono dati e li mostrano),
- creare nuove transazioni e schermate,
- estendere il comportamento standard di SAP (enhancement),
- scambiare dati con altri sistemi (interfacce),
- creare moduli di stampa (fatture, bolle),
- creare servizi per app web Fiori.

Caratteristiche di ABAP da conoscere fin da subito:

- È un linguaggio **pensato per il business**: lavora benissimo con tabelle di dati, importi, valute, date.
- Ha la **sintassi in inglese**, molto leggibile: `SELECT`, `LOOP AT`, `IF`, `WRITE`.
- **Non distingue maiuscole e minuscole** nelle parole chiave e nei nomi (`write` e `WRITE` sono uguali).
- Il codice **vive dentro il sistema SAP**, non in file sul tuo computer. Lo scrivi, lo salvi e lo esegui dentro SAP.
- Il database è **integrato nel linguaggio**: puoi scrivere `SELECT` direttamente nel codice.
- Esiste da oltre 40 anni, quindi convivono sintassi vecchie e moderne. In questo corso impari entrambe, ma ti indico sempre quella moderna da preferire.

> [!TIP]
> ABAP sta a SAP come la lingua italiana sta a un ufficio di Roma: tutto quello che succede lì dentro è scritto in quella lingua. Se vuoi lavorare in quell'ufficio, ti serve parlarla.

### Il ruolo dello sviluppatore ABAP

Di solito un consulente funzionale (che conosce i processi, per esempio le vendite) scrive una **specifica funzionale**: "voglio un report che mostri gli ordini aperti per cliente". Tu, sviluppatore, scrivi una **specifica tecnica** (come lo farai) e poi il codice. Alla fine il funzionale e l'utente fanno i test.

## Ora 2 – Architettura di un sistema SAP

### I tre livelli

Un sistema SAP classico ha tre livelli (architettura a 3 livelli):

| Livello       | Che cosa fa              | Esempio                           |
| ------------- | ------------------------ | --------------------------------- |
| Presentazione | Quello che l'utente vede | SAP GUI, browser con Fiori        |
| Applicazione  | Dove gira il codice ABAP | Application Server ABAP (AS ABAP) |
| Database      | Dove sono salvati i dati | SAP HANA, Oracle, SQL Server...   |

> [!TIP]
> Torniamo al ristorante. La sala con i tavoli è il livello di presentazione (il cliente vede solo quella). La cucina è il livello di applicazione (lì si lavora davvero: i cuochi sono i programmi ABAP). La dispensa e il frigorifero sono il database (dove si conservano gli ingredienti, cioè i dati).

Il tuo codice ABAP gira sul server di applicazione. Quando l'utente preme un pulsante, la richiesta arriva al server, un **processo di lavoro** (_work process_) esegue il tuo programma, che legge e scrive dati nel database, e poi il risultato torna allo schermo.

### Il panorama di sistemi (System Landscape)

Un'azienda non ha un solo sistema SAP, ma di solito tre:

| Sistema        | Sigla tipica | A cosa serve                             |
| -------------- | ------------ | ---------------------------------------- |
| Sviluppo       | DEV          | Qui scrivi il codice                     |
| Qualità / Test | QAS          | Qui gli utenti provano il tuo codice     |
| Produzione     | PRD          | Qui lavora l'azienda vera, con dati veri |

Il codice si scrive **solo** in sviluppo e si sposta negli altri sistemi tramite **richieste di trasporto** (_transport requests_).

> [!TIP]
> Pensa a un pasticcere: prova la ricetta nuova nella cucina di casa (DEV), la fa assaggiare agli amici (QAS) e solo quando tutti sono soddisfatti la mette in vetrina nella pasticceria (PRD). La richiesta di trasporto è la scatola in cui porta la torta da un posto all'altro.

### Il mandante (client)

Dentro un sistema SAP esistono più **mandanti**, identificati da tre cifre (es. 100, 200, 800). Ogni mandante ha i suoi dati aziendali separati, come se fossero aziende diverse dentro lo stesso sistema.

- I **dati** (clienti, ordini...) dipendono dal mandante.
- Il **codice ABAP** invece è indipendente dal mandante: se scrivi un programma nel mandante 100, lo vedi anche nel 200.

> [!TIP]
> Il sistema SAP è un condominio, i mandanti sono gli appartamenti. Ogni famiglia ha i suoi mobili (dati), ma l'impianto elettrico e le tubature (il codice) sono uguali per tutti.

Per questo quasi tutte le tabelle del database hanno come primo campo `MANDT` (il mandante). Open SQL lo gestisce in automatico per te: lo vedrai nel giorno 6.

### Repository e pacchetti

Tutti gli oggetti di sviluppo (programmi, tabelle, classi...) vivono nel **Repository** di SAP. Gli oggetti sono organizzati in **pacchetti** (_packages_), come cartelle.

- Il pacchetto `$TMP` è speciale: è "locale", i suoi oggetti **non** vengono trasportati. Usalo per esercitarti.
- I tuoi oggetti devono iniziare con **Z** o **Y**: è lo "spazio dei nomi del cliente". Tutto ciò che non inizia con Z o Y è di SAP e non va toccato.

> [!WARNING]
> Mai chiamare un tuo programma senza la Z o la Y iniziale. Il sistema non te lo permette (o ti chiede una chiave speciale), perché rischieresti di sovrascrivere oggetti standard SAP.

## Ora 3 – Gli strumenti di lavoro

### SAP GUI e le transazioni

La **SAP GUI** è il programma installato sul PC che si collega al sistema SAP. In alto a sinistra c'è il **campo comandi**, dove scrivi un **codice transazione** (_t-code_) per aprire una funzione.

| Transazione  | A cosa serve                                      |
| ------------ | ------------------------------------------------- |
| SE80         | Object Navigator: l'ambiente di sviluppo completo |
| SE38         | Editor dei programmi (report)                     |
| SE11         | Dizionario dati (tabelle, strutture, tipi)        |
| SE37         | Function Builder (moduli funzione)                |
| SE24         | Class Builder (classi)                            |
| SE91         | Classi di messaggi                                |
| SE93         | Creare una transazione                            |
| SE09 / SE10  | Gestione richieste di trasporto                   |
| SE16 / SE16N | Visualizzare il contenuto di una tabella          |
| ST22         | Errori a runtime (dump)                           |
| SM37         | Job in background                                 |
| SAT / ST05   | Analisi prestazioni / traccia SQL                 |

Trucchi del campo comandi:

- `/n` + transazione: apre la transazione nella stessa finestra (es. `/nSE38`).
- `/o` + transazione: apre una nuova finestra (es. `/oSE11`).
- `/nex` esce dal sistema senza conferma (attenzione!).

### Eclipse con ABAP Development Tools (ADT)

Oggi lo strumento consigliato da SAP è **Eclipse** con il plugin **ADT**. Per il nuovo ABAP Cloud e per le CDS (giorni 14 e 15) è **obbligatorio**. SE80 resta utile per gli oggetti vecchi (schermate classiche, SmartForms).

Scorciatoie ADT da imparare subito:

| Tasti            | Azione                                      |
| ---------------- | ------------------------------------------- |
| Ctrl + S         | Salva                                       |
| Ctrl + F2        | Controlla la sintassi                       |
| Ctrl + F3        | Attiva                                      |
| F8               | Esegui (come applicazione console o report) |
| Ctrl + Spazio    | Completamento automatico                    |
| Shift + F1       | Formatta il codice (Pretty Printer)         |
| F3               | Vai alla definizione dell'oggetto           |
| Ctrl + Shift + A | Apri un oggetto qualsiasi                   |

### Salva, controlla, attiva

In SAP ogni oggetto ha due versioni: **inattiva** (bozza) e **attiva** (quella che il sistema usa davvero). Il ciclo è sempre:

1. Scrivi il codice.
2. **Salva** (versione inattiva).
3. **Controlla** la sintassi.
4. **Attiva**: solo ora gli altri utenti e programmi "vedono" la nuova versione.
5. **Esegui** (F8).

> [!TIP]
> È come scrivere una mail: la bozza (inattiva) la vedi solo tu; quando premi "Invia" (attiva) diventa ufficiale per tutti.

### Come ottenere un sistema per esercitarti

Hai tre strade (verifica sempre sul sito SAP la disponibilità aggiornata):

- **SAP BTP, ABAP Environment – trial gratuito**: si usa con Eclipse ADT. È ABAP Cloud (sintassi moderna, niente SAP GUI e niente `WRITE`). Ottimo per i giorni 12–15.
- **ABAP Platform Developer Edition** (sistema completo da installare, per esempio tramite Docker, con licenza di prova): include SAP GUI e tutto l'ABAP classico.
- **Il sistema di sviluppo della tua azienda o del tuo cliente**, se ne hai accesso.

> [!WARNING]
> Nei sistemi ABAP Cloud alcune istruzioni classiche (`WRITE`, schermate di selezione, SE38) non esistono. Per gli esempi console usiamo allora la classe con l'interfaccia `if_oo_adt_classrun` che vedi più sotto.

## Ora 4 – Il tuo primo programma

### Creare un report con SE38

1. Vai in SE38.
2. Nome programma: `ZHELLO_WORLD`. Clicca "Crea".
3. Titolo: "Il mio primo programma". Tipo: **Programma eseguibile** (_Executable program_).
4. Pacchetto: `$TMP` (pulsante "Oggetto locale").
5. Scrivi il codice qui sotto, salva, attiva (Ctrl+F3) ed esegui (F8).

```abap
REPORT zhello_world.

* Questo è un commento: inizia con l'asterisco in prima colonna
WRITE 'Ciao mondo!'.             " Anche questo è un commento
NEW-LINE.
WRITE 'Sto imparando ABAP'.
```

Risultato: una lista con due righe di testo.

### Lo stesso in ABAP Cloud (Eclipse)

In ADT crei una **classe** (File > New > ABAP Class), per esempio `ZCL_HELLO_WORLD`:

```abap
CLASS zcl_hello_world DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_hello_world IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    out->write( 'Ciao mondo!' ).
    out->write( 'Sto imparando ABAP' ).
  ENDMETHOD.
ENDCLASS.
```

Premi F9 (o F8 e "ABAP Application (Console)"): il testo appare nella vista Console. Non preoccuparti se non capisci ancora `CLASS` e `METHOD`: nel giorno 10 li spieghiamo con calma. Per ora considerali la "cornice" dentro cui scrivere le istruzioni.

### Le regole di sintassi fondamentali

- Ogni **istruzione** finisce con un **punto** `.` Dimenticare il punto è l'errore n. 1 dei principianti.
- Un'istruzione può stare su più righe; più istruzioni possono stare sulla stessa riga.
- **Commento di riga intera**: `*` nella **prima colonna**.
- **Commento di fine riga**: `"` (virgolette doppie) in qualsiasi punto.
- I **testi** (letterali) vanno tra apici singoli `'testo'` oppure tra backtick per le stringhe.
- Maiuscole e minuscole nel codice sono indifferenti; però **dentro gli apici** contano: `'Ciao'` è diverso da `'CIAO'`.
- Le parole sono separate da almeno uno **spazio**. ABAP è severo con gli spazi: `a = b + c.` funziona, `a=b+c.` no.

### L'istruzione a catena (chained statement)

Quando più istruzioni iniziano con la stessa parola, puoi scriverla una volta sola usando i **due punti** `:` e separando le parti con la **virgola**:

```abap
WRITE 'Uno'.
WRITE 'Due'.
WRITE 'Tre'.

* equivale a:
WRITE: 'Uno', 'Due', 'Tre'.
```

> [!TIP]
> I due punti sono come dire "ripeti per ognuno": "Compra: pane, latte, uova" significa "compra il pane, compra il latte, compra le uova".

### Lavorare con WRITE

`WRITE` stampa nella lista classica. Alcune varianti:

```abap
WRITE 'Testo'.                 " scrive di seguito
WRITE / 'Nuova riga'.          " lo slash va a capo
WRITE /10 'Rientrato'.         " a capo e parte dalla colonna 10
ULINE.                         " linea orizzontale
SKIP 2.                        " due righe vuote
WRITE 'Rosso' COLOR COL_NEGATIVE.
WRITE sy-datum.                " data di oggi (campo di sistema)
WRITE sy-uname.                " utente collegato
```

### Pretty Printer e convenzioni

Usa sempre il **Pretty Printer** (Shift+F1 in SE38/ADT) per indentare il codice. Convenzione comune: parole chiave in MAIUSCOLO, nomi in minuscolo (in ADT si imposta nelle preferenze). Codice ordinato = meno errori.

### Gli errori: il dump (ST22)

Se il programma va in errore durante l'esecuzione (per esempio una divisione per zero), SAP mostra un **dump**: una schermata con il tipo di errore, il punto del codice e le variabili. Tutti i dump si consultano in **ST22**. Non spaventarti: leggere i dump è una delle abilità più utili dello sviluppatore.

```abap
REPORT zdump_test.
DATA lv_x TYPE i VALUE 10.
DATA lv_y TYPE i VALUE 0.
lv_x = lv_x / lv_y.   " dump COMPUTE_INT_ZERODIVIDE
```

Esegui il programma e poi apri ST22 per vedere il dump.

### Richieste di trasporto (cenni pratici)

Quando un oggetto non è in `$TMP`, SAP ti chiede una **richiesta di trasporto**. La richiesta (es. `DEVK900123`) contiene uno o più **task**, uno per sviluppatore. A fine sviluppo si **rilasciano** prima i task e poi la richiesta (in SE09/SE10). Il team Basis importa poi la richiesta in QAS e PRD.

## Esercizi

> [!IMPORTANT]
>
> 1. Crea il programma `ZES01_PRESENTAZIONE` che stampi il tuo nome, la tua città e la data di oggi (usa `sy-datum`), ognuno su una riga diversa.
> 2. Riscrivi l'esercizio 1 usando una sola istruzione `WRITE` a catena.
> 3. Aggiungi una riga di separazione con `ULINE` e una riga colorata.
> 4. Provoca volutamente un errore di sintassi (togli un punto). Leggi il messaggio del controllo sintattico. Poi provoca un dump con una divisione per zero e analizzalo in ST22.
> 5. Apri SE16N, inserisci la tabella `T001` (società) ed esegui. Osserva i campi. Poi prova `SCARR` (compagnie aeree del modello didattico "flight").

## Quiz

1. Che cosa significa ERP?
2. In quale dei tre livelli gira il codice ABAP?
3. Perché i tuoi oggetti devono iniziare con Z o Y?
4. Che differenza c'è tra mandante e sistema?
5. Che cosa succede se salvi un programma ma non lo attivi?
6. Come si scrive un commento di fine riga?
7. A che cosa servono i due punti nell'istruzione `WRITE: 'a', 'b'.`?
8. In quale transazione trovi i dump?

## Soluzioni

```abap
REPORT zes01_presentazione.

WRITE: / 'Nome: Mario Rossi',
       / 'Città: Roma',
       / 'Data:', sy-datum.
ULINE.
WRITE / 'Fine presentazione' COLOR COL_POSITIVE.
```

Quiz:

1. Enterprise Resource Planning, un unico gestionale per tutta l'azienda.
2. Nel livello di applicazione (application server).
3. Perché Z e Y sono lo spazio dei nomi del cliente: così non entri in conflitto con gli oggetti SAP.
4. Il sistema è l'installazione intera (DEV, QAS, PRD); il mandante è una "sotto-azienda" con dati separati dentro un sistema.
5. Il sistema continua a usare la vecchia versione attiva; la tua modifica resta una bozza.
6. Con le virgolette doppie `"`.
7. Creano un'istruzione a catena: ripetono `WRITE` per ogni elemento separato da virgola.
8. ST22.

> [!NOTE]
> Oggi hai imparato: cos'è SAP e ABAP, l'architettura a tre livelli, DEV/QAS/PRD, mandanti, pacchetti, il ciclo salva-controlla-attiva, le regole base della sintassi e il tuo primo programma. Domani: le variabili e i tipi di dato.
