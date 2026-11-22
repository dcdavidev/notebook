---
title: Che cos'è ABAP
description: 'Il linguaggio dei sistemi SAP: dove gira e che cosa ci costruisci.'
---

_Livello principiante_

**ABAP** è il linguaggio di programmazione di SAP. Gran parte dell'ERP che hai conosciuto in [Che cos'è SAP](./0001-what-is-sap.md) è scritta in ABAP, e così quasi ogni estensione personalizzata che le aziende aggiungono ai propri sistemi. Se vuoi leggere, correggere o estendere il codice SAP, ABAP è il linguaggio che ti serve.

Questa lezione spiega da dove viene ABAP, dove gira davvero il tuo codice e che tipo di oggetti costruirai.

## Un po' di storia

ABAP nasce all'inizio degli anni '80 come linguaggio per i report. All'inizio il nome significava _Allgemeiner Berichts-Aufbereitungs-Prozessor_ ("processore generico per la preparazione di report"); in seguito è diventato **Advanced Business Application Programming**.

Negli anni il linguaggio è cresciuto per tappe:

| Fase          | Che cosa ha aggiunto                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- |
| ABAP classico | report, schermate (Dynpro), moduli funzione, Open SQL                                     |
| ABAP Objects  | classi, interfacce ed eventi (fine anni '90, release 4.5 e 4.6)                           |
| ABAP moderno  | espressioni, dichiarazioni inline, viste CDS (7.40 e 7.50, dal 2013)                      |
| ABAP Cloud    | una versione del linguaggio ristretta, pronta per il cloud, con API rilasciate (dal 2019) |

SAP non butta mai via la vecchia sintassi. Un programma scritto nel 1998 di solito gira ancora oggi, quindi nello stesso sistema leggerai stili vecchi e nuovi uno accanto all'altro.

## Dove gira ABAP

Il codice ABAP non gira sul tuo PC. Gira sull'**application server ABAP** (AS ABAP), dentro il sistema SAP. Il tuo PC si limita a mostrare le schermate e a inviare quello che digiti.

- **Il codice vive nel database.** Programmi, classi e tabelle sono salvati nel database del sistema stesso, in una parte chiamata **repository**. Non ci sono file sorgente sul disco.
- **Il sistema lo compila per te.** Quando attivi un programma, il sistema genera una versione compilata (il **load**) ed esegue quella.
- **Il database è nascosto dietro ABAP SQL.** Scrivi le query in **ABAP SQL** e il sistema le traduce per il database sottostante, che sia SAP HANA, Oracle o un altro.
- **Anche gli strumenti di sviluppo sono nel sistema.** Modifichi il codice nell'ABAP Workbench in SAP GUI o in Eclipse con ADT, sempre collegato a un sistema in funzione.

Vedrai come si incastrano questi pezzi in [L'architettura di un sistema SAP](./0003-sap-system-architecture.md).

> [!TIP]
> La maggior parte dei linguaggi è come cucinare a casa: compri gli ingredienti, cucini sul tuo fornello e servi il piatto tu stesso. ABAP è come cucinare nella cucina di un ristorante: fornelli, dispensa e ricette appartengono al ristorante, e tu vai lì a cucinare. La cucina non te la porti mai a casa.

## Com'è fatto ABAP

ABAP si legge quasi come l'inglese. Le istruzioni iniziano con una parola chiave e finiscono con un punto:

```abap
REPORT zdemo_first_look.

DATA lv_carrier TYPE s_carr_id VALUE 'LH'.

SELECT SINGLE carrname
  FROM scarr
  WHERE carrid = @lv_carrier
  INTO @DATA(lv_name).

WRITE lv_name.   " stampa il nome della compagnia aerea, per esempio Lufthansa
```

In poche righe questo programma dichiara una variabile, legge una riga dalla tabella di database `SCARR` (le compagnie aeree del modello dei voli di SAP) e stampa un valore. Nota quanto è vicino il database: non c'è nessun driver da caricare e nessuna connessione da aprire. Imparerai ogni pezzo di questo codice nelle prossime lezioni.

## Che cosa costruisci con ABAP

Come sviluppatore ABAP costruirai, correggerai ed estenderai cose come:

- **Report**: programmi che leggono dati e li mostrano come lista o come griglia.
- **Classi e moduli funzione**: logica di business riutilizzabile.
- **Oggetti del Dizionario**: tabelle di database, tipi di dato e viste.
- **Interfacce**: scambio di dati con altri sistemi tramite file, RFC, IDoc o servizi HTTP e OData.
- **Moduli di stampa**: fatture, bolle di consegna ed etichette da stampare o inviare.
- **Enhancement**: codice tuo inserito nei processi standard SAP senza modificarli.
- **Viste CDS e business object RAP**: i modelli dati e i servizi dietro le moderne app Fiori.

> [!WARNING]
> ABAP non coincide con la "programmazione SAP" in generale. I sistemi SAP usano anche SQLScript su SAP HANA, JavaScript per i front end Fiori (SAPUI5) e Java o Node.js su SAP BTP. ABAP è il linguaggio dell'application server, ed è lì che vive la maggior parte della logica di business personalizzata.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi il programma di esempio qui sopra e scrivi con parole tue che cosa fa ogni istruzione.
> 2. Guarda l'elenco delle cose che costruisci con ABAP e scegli le due che secondo te un'azienda chiede più spesso. Perché?

### Soluzione

1. `REPORT` dà il nome al programma. `DATA` dichiara una variabile che contiene un codice di compagnia aerea, con valore iniziale `LH`. `SELECT SINGLE` legge il nome di quella compagnia dalla tabella `SCARR` in una nuova variabile. `WRITE` stampa il nome sullo schermo.
2. Non c'è un'unica risposta giusta. Nella maggior parte delle aziende report e interfacce sono le richieste più frequenti: ogni reparto ha bisogno delle proprie liste e ogni sistema SAP dialoga con altri sistemi.

> [!NOTE]
>
> - ABAP è il linguaggio di programmazione di SAP; gran parte dell'ERP è scritta in ABAP.
> - Gira sull'application server ABAP, non sul tuo PC; il codice è salvato nel database del sistema.
> - ABAP SQL nasconde le differenze tra i database.
> - Sintassi vecchia e nuova convivono, perché SAP mantiene funzionante il codice esistente.
> - Con ABAP costruisci report, classi, oggetti del Dizionario, interfacce, moduli di stampa, enhancement, viste CDS e app RAP.
