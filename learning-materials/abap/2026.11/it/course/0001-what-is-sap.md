---
title: Che cos'è SAP
description: L'azienda, i suoi prodotti ERP e perché le imprese li usano.
level: beginner
---

Prima di scrivere una riga di ABAP conviene sapere per quale tipo di sistema la scrivi. I programmi ABAP girano dentro i sistemi SAP, e i sistemi SAP fanno funzionare ogni giorno molte delle più grandi aziende del mondo: è lì che vendono, comprano, pagano, spediscono e producono.

Questa lezione spiega che cos'è SAP, che cosa fa un sistema ERP e quali prodotti SAP incontrerai sul lavoro.

## L'azienda

**SAP** è un'azienda tedesca di software, fondata nel 1972 da cinque ex dipendenti IBM. Il nome sta per _Systemanalyse und Programmentwicklung_ ("analisi di sistema e sviluppo di programmi"); oggi è semplicemente il marchio. SAP produce software gestionale: programmi che le aziende usano per far girare i propri processi, non giochi o app per il consumatore.

Quando qualcuno dice "da noi usiamo SAP", di solito intende un prodotto preciso: il sistema ERP dell'azienda.

## Che cos'è un sistema ERP

**ERP** significa _Enterprise Resource Planning_: un unico sistema integrato che gestisce tutte le attività principali di un'azienda. Acquisti, vendite, magazzino, contabilità, produzione e personale condividono **un solo database** e un'unica base di dati anagrafici (clienti, fornitori, materiali).

L'idea chiave è l'integrazione. Quando un venditore registra una consegna, il sistema scarica la giacenza dal magazzino, crea un documento contabile e aggiorna le partite aperte del cliente, tutto nello stesso momento. Nessuno digita due volte gli stessi dati e ogni reparto vede gli stessi numeri.

> [!TIP]
> Pensa a un ristorante. C'è chi ordina gli ingredienti, chi li conserva, chi cucina, chi serve ai tavoli e chi fa i conti. Se ognuno tiene il proprio quaderno, i numeri non tornano mai. Un ERP è un'unica grande lavagna che tutti leggono e aggiornano: quando il cameriere vende un piatto, la dispensa sa subito che mancano ingredienti e la cassa registra l'incasso.

## Moduli e aree di business

L'ERP di SAP è organizzato in aree funzionali, chiamate tradizionalmente **moduli**. Sentirai le loro sigle in continuazione:

| Sigla | Nome                          | Di che cosa si occupa                     |
| ----- | ----------------------------- | ----------------------------------------- |
| FI    | Financial Accounting          | contabilità generale, clienti e fornitori |
| CO    | Controlling                   | centri di costo, controllo di gestione    |
| SD    | Sales and Distribution        | ordini di vendita, consegne, fatturazione |
| MM    | Materials Management          | acquisti, giacenze, materiali             |
| PP    | Production Planning           | ordini di produzione, pianificazione      |
| PM    | Plant Maintenance             | manutenzione di macchinari e impianti     |
| QM    | Quality Management            | ispezioni e controllo qualità             |
| EWM   | Extended Warehouse Management | processi di magazzino dettagliati         |
| HCM   | Human Capital Management      | dipendenti, buste paga                    |

I **consulenti funzionali** configurano questi moduli per ogni azienda (questa configurazione si chiama **customizing**). Gli **sviluppatori ABAP** scrivono il codice che lo standard non copre: report personalizzati, interfacce verso altri sistemi, moduli di stampa ed estensioni.

## I prodotti SAP che incontrerai

L'ERP di SAP è passato per diverse generazioni. Sistemi vecchi e nuovi convivono, quindi nei progetti reali li troverai tutti:

| Prodotto          | Anni           | Note                                                                                    |
| ----------------- | -------------- | --------------------------------------------------------------------------------------- |
| SAP R/2           | 1979–anni '90  | sistema mainframe, ormai storico                                                        |
| SAP R/3           | 1992–anni 2000 | architettura client-server: la base di tutto ciò che è venuto dopo                      |
| SAP ERP (ECC 6.0) | 2006–oggi      | il successore di R/3, gira su molti database; la manutenzione standard termina nel 2027 |
| SAP S/4HANA       | 2015–oggi      | l'ERP attuale, gira solo sul database SAP HANA                                          |
| SAP S/4HANA Cloud | 2017–oggi      | S/4HANA come servizio, con regole più rigide per il codice personalizzato               |

Intorno all'ERP, SAP offre molti altri prodotti, per esempio:

- **SAP HANA**: un database in memoria, la base di S/4HANA.
- **SAP Business Technology Platform (BTP)**: la piattaforma cloud di SAP, dove puoi sviluppare anche in ABAP (l'ABAP environment, detto anche "Steampunk").
- **SAP Fiori**: la moderna interfaccia web delle applicazioni SAP.
- **SAP BW/4HANA**, **SAP SuccessFactors**, **SAP Ariba**: analisi dei dati, risorse umane nel cloud e approvvigionamenti.

La maggior parte di questi prodotti, e sicuramente ogni sistema ECC e S/4HANA, è scritta in ABAP. Per questo gli sviluppatori ABAP sono così richiesti: il linguaggio è presentato in [Che cos'è ABAP](./0002-what-is-abap.md).

> [!WARNING]
> Non confondere il prodotto con la versione. "SAP" da solo dice poco: un sistema ECC 6.0 e un sistema S/4HANA 2023 hanno tabelle diverse, strumenti diversi e regole diverse per il codice personalizzato. Quando inizi un progetto, la prima cosa da scoprire è su quale prodotto e quale release stai lavorando.

## Esercizio

> [!IMPORTANT]
>
> 1. Se hai accesso a un sistema SAP, accedi e apri il menu **Sistema > Stato**. Trova la versione del prodotto nelle informazioni sui componenti (cerca `S4CORE` per S/4HANA o `SAP_APPL` per ECC).
> 2. Scegli un'azienda che conosci (un supermercato, una casa automobilistica, una compagnia aerea) ed elenca tre processi di business che userebbero FI, SD e MM.

### Soluzione

1. In **Sistema > Stato**, il pulsante delle informazioni sui componenti elenca i componenti software installati e le loro release. Se vedi `S4CORE`, sei su S/4HANA; se vedi `SAP_APPL` con release 600 o superiore e nessun `S4CORE`, sei su ECC.
2. Per una compagnia aerea, per esempio: SD vende i biglietti e fattura le agenzie di viaggio; MM acquista carburante e forniture per il catering; FI registra i ricavi, paga i fornitori e chiude il bilancio.

> [!NOTE]
>
> - SAP è un'azienda tedesca che produce software gestionale.
> - Un sistema ERP gestisce tutti i processi principali di un'azienda in un unico sistema integrato, con un solo database.
> - Moduli come FI, CO, SD e MM coprono le aree di business; i consulenti li configurano, gli sviluppatori li estendono.
> - I principali prodotti ERP sono ECC 6.0 (la generazione precedente) e S/4HANA (quella attuale, su SAP HANA).
> - La maggior parte dei prodotti SAP è scritta in ABAP.
