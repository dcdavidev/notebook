---
description: Corso intensivo di 15 giorni su SAP e ABAP, dalle basi ad ABAP Cloud e RAP.
tags:
  - SAP
  - ABAP
  - SAP HANA
  - SAP S/4HANA
  - CDS
  - RAP
  - ABAP Cloud
---

# ABAP

Un corso intensivo che ti porta da zero fino a costruire un'app Fiori completa su SAP S/4HANA. Ogni lezione spiega un argomento passo per passo, con analogie della vita di tutti i giorni, codice reale, esercizi, un quiz e le soluzioni.

## A chi è rivolto

- Sviluppatori che non conoscono SAP e vogliono imparare ABAP dalle basi.
- Sviluppatori ABAP che conoscono l'ABAP classico e vogliono passare ad ABAP moderno, CDS e RAP.
- Consulenti funzionali che vogliono leggere e capire il codice custom.

Non serve conoscere SAP. Un po' di esperienza di programmazione aiuta, ma non è obbligatoria.

## Come è organizzato il corso

Il corso dura **15 giorni**, divisi in **3 settimane**. Ogni giorno è una lezione di circa **4 ore**, divisa in 4 blocchi da un'ora.

| Settimana   | Livello    | Lezioni | Che cosa impari                                                                                                   |
| ----------- | ---------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| Settimana 1 | Base       | 1–5     | il sistema SAP, la sintassi ABAP, i tipi di dato, il controllo del flusso, il Dizionario Dati, le tabelle interne |
| Settimana 2 | Intermedio | 6–10    | ABAP SQL, modularizzazione, report, ALV e Dynpro, programmazione a oggetti                                        |
| Settimana 3 | Avanzato   | 11–15   | eccezioni, ABAP moderno e test, enhancement e interfacce, HANA e CDS, RAP                                         |

Ogni lezione ha la stessa struttura:

1. **Programma di oggi**: i quattro blocchi della giornata.
2. **Ora 1–4**: la spiegazione, con esempi di codice.
3. **Esercizi**: pratica da fare su un sistema reale.
4. **Quiz**: domande per verificare cosa ricordi.
5. **Soluzioni**: il codice degli esercizi principali e le risposte al quiz.
6. **Riepilogo**: che cosa hai imparato e che cosa viene dopo.

Lungo il percorso troverai questi riquadri:

> [!TIP]
> Un'**analogia** che collega un'idea nuova a qualcosa che conosci già.

> [!WARNING]
> Un **avvertimento** su un errore comune o un rischio.

> [!IMPORTANT]
> Gli **esercizi** del giorno.

> [!NOTE]
> Il **riepilogo** alla fine di ogni lezione.

## Indice

### Settimana 1 – Livello base

1. [Benvenuto nel mondo SAP e ABAP](./0001-welcome-to-sap-and-abap.it.md): che cos'è SAP, dove vive ABAP, come si scrive il primo programma.
2. [Variabili, tipi di dato e operazioni](./0002-variables-data-types-and-operations.it.md): come ABAP conserva numeri, testi, date e come li trasforma.
3. [Decisioni, cicli e debugger](./0003-decisions-loops-and-the-debugger.it.md): come il programma sceglie cosa fare e come ripete le operazioni.
4. [Il Dizionario Dati (SE11)](./0004-the-abap-dictionary-se11.it.md): domini, elementi dati, tabelle, strutture, viste e aiuti di ricerca.
5. [Le tabelle interne](./0005-internal-tables.it.md): lo strumento più usato in ABAP, elenchi di dati in memoria.

### Settimana 2 – Livello intermedio

6. [Leggere e scrivere nel database: ABAP SQL](./0006-reading-and-writing-the-database-with-abap-sql.it.md): `SELECT`, `JOIN`, aggregazioni, `INSERT`, `UPDATE`, `DELETE`, `COMMIT` e LUW.
7. [Modularizzazione: dividere il codice in blocchi](./0007-modularization.it.md): include, subroutine, moduli funzione, BAPI, memoria SAP e ABAP.
8. [Report completi: selezione, eventi, messaggi, file](./0008-complete-reports.it.md): tutto ciò che serve per costruire un vero report SAP.
9. [ALV e schermate classiche (Dynpro)](./0009-alv-and-classic-dynpro-screens.it.md): mostrare i dati in griglie professionali e costruire transazioni di dialogo.
10. [Programmazione a oggetti (ABAP Objects)](./0010-object-oriented-programming-abap-objects.it.md): classi, oggetti, metodi, ereditarietà, interfacce e polimorfismo.

### Settimana 3 – Livello avanzato

11. [Eccezioni, design pattern e programmazione dinamica](./0011-exceptions-design-patterns-and-dynamic-programming.it.md): gestire gli errori in modo professionale e scrivere codice che si adatta a runtime.
12. [ABAP moderno e test automatici](./0012-modern-abap-and-automated-tests.it.md): espressioni 7.4/7.5x, raggruppamenti, ABAP Unit, test double e qualità del codice.
13. [Enhancement, interfacce, stampe e tecniche di sistema](./0013-enhancements-interfaces-forms-and-system-techniques.it.md): estendere lo standard SAP, scambiare dati con altri sistemi, produrre documenti.
14. [ABAP su SAP HANA e le CDS view](./0014-abap-on-sap-hana-and-cds-views.it.md): code pushdown, Core Data Services, controllo accessi, AMDP e analisi delle prestazioni.
15. [RAP, ABAP Cloud e il tuo futuro da sviluppatore](./0015-rap-abap-cloud-and-your-future.it.md): costruire un'app Fiori completa con il RESTful Application Programming Model.

## Che cosa ti serve

- **Un sistema SAP su cui esercitarti.** Va bene uno di questi:
  - un sistema sandbox o di sviluppo aziendale, con una chiave sviluppatore;
  - un account SAP BTP trial con ABAP Environment (gratuito; solo ABAP Cloud, quindi alcuni argomenti classici come le Dynpro e le liste `WRITE` lì non sono disponibili);
  - la developer edition di ABAP Platform, se riesci a installarla.
- **Gli strumenti**: SAP GUI per le transazioni classiche, ed Eclipse con gli ABAP Development Tools (ADT) per lo sviluppo moderno, le CDS e RAP.
- **Dati di esempio**: gli esempi usano il modello dei voli di SAP (tabelle `SCARR`, `SPFLI`, `SFLIGHT`, `SBOOK`). Se il tuo sistema non ha dati, generali con il report `SAPBC_DATA_GENERATOR`.

## Come studiare

- Segui le lezioni in ordine: ognuna si basa sulle precedenti.
- Scrivi il codice a mano invece di copiarlo, ed eseguilo nel debugger.
- Fai gli esercizi prima di guardare le soluzioni.
- Alla fine, costruisci il progetto finale descritto nella lezione 15.

## Questa versione

Questa è la **v1** del corso. Gli esempi si basano su SAP S/4HANA e ABAP 7.5x, con il modello ABAP Cloud nelle ultime lezioni. Codici organizzativi, numeri e nomi negli esempi (società, organizzazioni commerciali, numeri materiale) sono di esempio: dipendono dal customizing del tuo sistema.

Hai trovato un errore o vuoi migliorare una lezione? Ogni pagina ha il link "Modifica questa pagina su GitHub". Leggi la [guida ai contenuti](https://github.com/dcdavidev/notebook/blob/main/learning-materials/README.md) per sapere come si scrivono le lezioni.
