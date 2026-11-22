---
title: Glossario ABAP
description: I termini dei corsi ABAP in ordine alfabetico, con il link alla lezione che li spiega.
---

# Glossario ABAP

I termini usati nelle lezioni dei corsi ABAP, in ordine alfabetico. Ogni voce ha una breve definizione e il link alla lezione del [corso v2](../course/v2/README.it.md) che spiega l'argomento nel dettaglio. Le parole chiave ABAP sono scritte in `codice`.

The English version is in [README.en.md](./README.en.md).

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [J](#j) · [L](#l) · [M](#m) · [O](#o) · [P](#p) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w) · [X](#x)

## A

**ABAP**: il linguaggio di programmazione dei sistemi SAP: gira sull'application server ed è il linguaggio con cui si scrivono report, interfacce, estensioni e servizi. Lezione [2](../course/v2/0002-what-is-abap.it.md).

**ABAP channel**: il meccanismo per la comunicazione basata su eventi: _ABAP Messaging Channels_ (AMC) fra sessioni e _ABAP Push Channels_ (APC) verso il browser con WebSocket. Lezione [150](../course/v2/0150-abap-channels.it.md).

**ABAP Cloud**: il modello di sviluppo che usa solo API rilasciate e la versione ristretta del linguaggio, per estensioni compatibili con gli aggiornamenti e con il _clean core_. Lezione [148](../course/v2/0148-abap-cloud.it.md).

**ABAP Development Tools (ADT)**: L'ambiente di sviluppo per ABAP basato su Eclipse; è l'unico strumento per CDS, RAP e ABAP Cloud. Lezione [6](../course/v2/0006-abap-development-tools.it.md).

**ABAP Managed Database Procedure (AMDP)**: un metodo ABAP il cui codice è scritto in SQLScript ed eseguito direttamente nel database SAP HANA. Lezione [137](../course/v2/0137-amdp.it.md).

**ABAP SQL**: il dialetto SQL integrato in ABAP (un tempo _Open SQL_): legge e scrive le tabelle del database in modo indipendente dal database sottostante. Lezioni [52](../course/v2/0052-select-basics.it.md), [97](../course/v2/0097-modern-abap-sql.it.md), [98](../course/v2/0098-advanced-abap-sql.it.md).

**ABAP Unit**: il framework per i test unitari automatici: classi di test locali con `FOR TESTING` e asserzioni di `CL_ABAP_UNIT_ASSERT`. Lezione [105](../course/v2/0105-abap-unit-basics.it.md).

**`abap_bool`, `abap_true`, `abap_false`**: il tipo e le costanti per i valori booleani: in ABAP vero è `'X'` e falso è uno spazio. Lezione [16](../course/v2/0016-boolean-values.it.md).

**abapGit**: un client Git open source scritto in ABAP, per mettere gli oggetti di sviluppo sotto controllo di versione. Lezione [151](../course/v2/0151-abapgit.it.md).

**Aggregato**: una funzione SQL che calcola un valore su un gruppo di righe: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Lezione [56](../course/v2/0056-aggregates-and-group-by.it.md).

**Aiuto di ricerca**: L'oggetto del Dizionario che propone all'utente i valori possibili di un campo (il tasto F4). Lezione [50](../course/v2/0050-search-helps.it.md).

**ALE (Application Link Enabling)**: la tecnologia per lo scambio asincrono di dati fra sistemi SAP, di solito tramite IDoc. Lezione [125](../course/v2/0125-idoc-and-ale.it.md).

**ALV (ABAP List Viewer)**: lo strumento standard per mostrare tabelle di dati con ordinamento, filtri, totali ed esportazione; si usa con `CL_SALV_TABLE` o con `CL_GUI_ALV_GRID`. Lezioni [99](../course/v2/0099-alv-with-salv.it.md), [100](../course/v2/0100-alv-grid-control.it.md).

**Annotazione CDS**: un metadato scritto con `@` in una vista CDS che ne descrive il comportamento: etichette, UI di Fiori, autorizzazioni, ricerca. Lezione [134](../course/v2/0134-cds-annotations.it.md).

**Application server**: il livello del sistema SAP che esegue i programmi ABAP, fra il SAP GUI e il database; ha anche un proprio file system. Lezioni [3](../course/v2/0003-sap-system-architecture.it.md), [74](../course/v2/0074-files-on-the-application-server.it.md).

**Associazione CDS**: una relazione dichiarata fra entità CDS che diventa un join solo quando la si usa (_path expression_). Lezione [133](../course/v2/0133-cds-associations.it.md).

**ATC (ABAP Test Cockpit)**: lo strumento che esegue i controlli statici sul codice: errori, prestazioni, sicurezza e regole di stile. Lezione [107](../course/v2/0107-code-quality.it.md).

**Attributo**: un dato che appartiene a una classe o a un oggetto, dichiarato con `DATA` o `CLASS-DATA`. Lezione [77](../course/v2/0077-attributes-and-methods.it.md).

**Autorizzazione**: il permesso di un utente su un oggetto di autorizzazione; il codice lo verifica con `AUTHORITY-CHECK`. Lezione [110](../course/v2/0110-authorization-checks.it.md).

**Azione (RAP)**: un'operazione non standard di un business object RAP, per esempio "Approva", implementata nella behavior implementation. Lezione [142](../course/v2/0142-rap-validations-determinations-actions.it.md).

## B

**BAdI (Business Add-In)**: un punto di estensione a oggetti previsto da SAP: si implementa un'interfaccia per aggiungere logica allo standard senza modificarlo. Lezione [122](../course/v2/0122-badis.it.md).

**BAPI (Business API)**: un modulo funzione remoto e stabile che espone un'operazione di business, per esempio creare un ordine. Lezione [71](../course/v2/0071-bapis.it.md).

**Batch input**: la tecnica che carica dati simulando l'inserimento a mano nelle schermate di una transazione (`CALL TRANSACTION`, SM35). Lezione [130](../course/v2/0130-batch-input.it.md).

**Behavior definition**: L'oggetto RAP che dichiara che cosa può fare un business object: operazioni, campi, validazioni, determinazioni, azioni, bozze. Lezione [141](../course/v2/0141-rap-behavior-definition.it.md).

**Behavior pool**: la classe globale che contiene la behavior implementation di un business object RAP. Lezione [141](../course/v2/0141-rap-behavior-definition.it.md).

**Bozza (draft)**: in RAP, una copia di lavoro dei dati che l'utente modifica e salva più tardi, senza perderla se chiude l'app. Lezione [146](../course/v2/0146-rap-draft.it.md).

**Breakpoint**: un punto del codice in cui il debugger ferma l'esecuzione; può essere di sessione, esterno o di utente. Lezione [29](../course/v2/0029-breakpoints-and-watchpoints.it.md).

**Business object (RAP)**: un'entità di business (o un albero di entità) con dati, comportamento e servizi, costruita con RAP. Lezione [139](../course/v2/0139-rap-overview.it.md).

## C

**Campo di sistema**: un campo della struttura `sy` che il runtime aggiorna da solo: `sy-subrc`, `sy-tabix`, `sy-datum`, `sy-uname` e altri. Lezione [23](../course/v2/0023-system-fields.it.md).

**`CASE`**: L'istruzione che sceglie un ramo confrontando un valore con una lista di alternative `WHEN`. Lezione [25](../course/v2/0025-case.it.md).

**Casting**: L'assegnazione di un riferimento a una variabile di un altro tipo: _upcast_ verso la superclasse, _downcast_ (`CAST`, `?=`) verso la sottoclasse. Lezione [85](../course/v2/0085-polymorphism-and-casting.it.md).

**CDS (Core Data Services)**: il linguaggio per definire modelli di dati semantici nel database: viste, associazioni, annotazioni e controllo accessi. Lezione [132](../course/v2/0132-cds-view-entities.it.md).

**CDS table function**: un'entità CDS i cui dati vengono calcolati da un metodo AMDP. Lezione [138](../course/v2/0138-cds-table-functions.it.md).

**CDS view entity**: la forma attuale di vista CDS (`DEFINE VIEW ENTITY`): una `SELECT` salvata nel database con annotazioni e associazioni. Lezione [132](../course/v2/0132-cds-view-entities.it.md).

**`CHECK`**: L'istruzione che esce dal blocco corrente, o passa al giro successivo di un ciclo, se la condizione è falsa. Lezione [27](../course/v2/0027-exit-continue-check.it.md).

**Chiave esterna**: il legame fra un campo di una tabella e la chiave di una tabella di controllo, che il Dizionario usa per verificare i valori inseriti. Lezione [47](../course/v2/0047-foreign-keys-and-check-tables.it.md).

**Chiave primaria**: L'insieme dei campi che identifica in modo univoco una riga, di una tabella del database o di una tabella interna. Lezioni [35](../course/v2/0035-table-keys.it.md), [46](../course/v2/0046-database-tables.it.md).

**Chiave secondaria**: una chiave aggiuntiva di una tabella interna, ordinata o hashed, per leggere velocemente con criteri diversi dalla chiave primaria. Lezione [35](../course/v2/0035-table-keys.it.md).

**Ciclo**: un blocco di codice ripetuto: `DO`, `WHILE`, oppure `LOOP AT` sulle righe di una tabella interna. Lezioni [26](../course/v2/0026-do-and-while-loops.it.md), [38](../course/v2/0038-looping-internal-tables.it.md).

**Classe**: il modello da cui si creano gli oggetti: definisce attributi, metodi ed eventi. Può essere locale (in un programma) o globale (nel repository). Lezioni [76](../course/v2/0076-classes-and-objects.it.md), [87](../course/v2/0087-global-classes.it.md).

**Classe astratta**: una classe dichiarata `ABSTRACT` che non si può istanziare: serve solo come superclasse. Lezione [83](../course/v2/0083-abstract-and-final.it.md).

**Classe di eccezione**: una classe che eredita da `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK` o `CX_NO_CHECK` e rappresenta un errore; si lancia con `RAISE EXCEPTION`. Lezioni [89](../course/v2/0089-class-based-exceptions.it.md), [90](../course/v2/0090-custom-exception-classes.it.md).

**Classe di messaggi**: il contenitore dei testi dei messaggi, identificati da un numero a tre cifre (transazione SE91). Lezione [61](../course/v2/0061-messages.it.md).

**Classe final**: una classe dichiarata `FINAL` da cui non si può ereditare. Lezione [83](../course/v2/0083-abstract-and-final.it.md).

**Clean ABAP**: la guida di stile di SAP per scrivere codice ABAP leggibile e manutenibile, ispirata a _Clean Code_. Lezione [107](../course/v2/0107-code-quality.it.md).

**Clean core**: il principio per cui le estensioni non modificano lo standard SAP e usano solo interfacce rilasciate, così gli aggiornamenti restano semplici. Lezione [148](../course/v2/0148-abap-cloud.it.md).

**Code pushdown**: spostare i calcoli sui dati dal server ABAP al database (con ABAP SQL, CDS e AMDP) per sfruttare la velocità di SAP HANA. Lezione [131](../course/v2/0131-code-pushdown.it.md).

**`COMMIT WORK`**: L'istruzione che chiude la LUW SAP: salva in modo definitivo le modifiche al database e avvia i moduli di aggiornamento. Lezione [60](../course/v2/0060-luw-commit-and-rollback.it.md).

**Componente statico**: un attributo o metodo di classe (`CLASS-DATA`, `CLASS-METHODS`) condiviso da tutte le istanze, che si usa senza creare un oggetto. Lezione [81](../course/v2/0081-static-components.it.md).

**`COND`**: un'espressione costruttore che restituisce un valore scelto fra più condizioni `WHEN`, come un `IF` in una sola espressione. Lezione [92](../course/v2/0092-cond-and-switch.it.md).

**Controllo accessi CDS (DCL)**: le regole, scritte in un _access control_, che limitano automaticamente le righe che un utente vede in una vista CDS. Lezione [136](../course/v2/0136-cds-access-control.it.md).

**Conversione di tipo**: il passaggio di un valore da un tipo a un altro, automatico con le regole di conversione o esplicito con `CONV` ed `EXACT`. Lezione [19](../course/v2/0019-type-conversions.it.md).

**`CORRESPONDING`**: L'espressione che copia i componenti con lo stesso nome da una struttura o tabella a un'altra, con eventuali mappature. Lezione [94](../course/v2/0094-filter-and-corresponding.it.md).

**Costante**: un dato con un valore fisso, dichiarato con `CONSTANTS`, che non si può modificare a runtime. Lezione [12](../course/v2/0012-variables-and-constants.it.md).

**Costruttore**: il metodo eseguito automaticamente alla creazione di un oggetto (`constructor`) o al primo uso della classe (`class_constructor`). Lezione [79](../course/v2/0079-constructors.it.md).

**Customer exit**: un vecchio punto di estensione previsto da SAP (moduli funzione `EXIT_*`, gestiti con CMOD e SMOD). Lezione [121](../course/v2/0121-user-exits-and-customer-exits.it.md).

## D

**Data model RAP**: le viste CDS che descrivono le entità di un business object RAP e le loro relazioni padre-figlio (_composition_). Lezione [140](../course/v2/0140-rap-data-model.it.md).

**Debugger**: lo strumento che esegue un programma passo per passo e mostra il valore delle variabili. Lezione [28](../course/v2/0028-debugger-basics.it.md).

**Dependency injection**: passare a una classe gli oggetti da cui dipende invece di farglieli creare, così nei test si possono sostituire con dei _test double_. Lezione [106](../course/v2/0106-test-doubles.it.md).

**Design pattern**: una soluzione collaudata a un problema ricorrente di progettazione: singleton, factory, strategy, observer e altri. Lezione [88](../course/v2/0088-design-patterns.it.md).

**Determinazione**: in RAP, una logica che calcola automaticamente il valore di alcuni campi quando i dati cambiano. Lezione [142](../course/v2/0142-rap-validations-determinations-actions.it.md).

**Dichiarazione inline**: la dichiarazione di una variabile nel punto in cui viene usata, con `DATA(...)` o `FIELD-SYMBOL(...)`, con il tipo dedotto dal contesto. Lezione [18](../course/v2/0018-inline-declarations.it.md).

**Dizionario ABAP (DDIC)**: il repository centrale delle definizioni di dati condivise: domini, elementi dati, tabelle, strutture, viste (transazione SE11). Lezione [43](../course/v2/0043-abap-dictionary-intro.it.md).

**Documento di modifica**: la registrazione di chi ha cambiato quali campi di un oggetto di business, quando, e con quali valori vecchi e nuovi. Lezione [118](../course/v2/0118-change-documents.it.md).

**Dominio**: L'oggetto del Dizionario che definisce le caratteristiche tecniche di un campo: tipo, lunghezza, valori ammessi. Lezione [44](../course/v2/0044-domains.it.md).

**Dump**: il nome comune di un errore a runtime che interrompe il programma; si analizza con la transazione ST22. Lezione [30](../course/v2/0030-runtime-errors.it.md).

**Dynpro**: una schermata classica del SAP GUI, con il suo layout e la sua flow logic (transazione SE51). Lezione [101](../course/v2/0101-dynpro-basics.it.md).

## E

**Eccezione**: una situazione di errore che interrompe il flusso normale e si gestisce con `TRY ... CATCH ... ENDTRY`. Lezione [89](../course/v2/0089-class-based-exceptions.it.md).

**Elaborazione parallela**: L'esecuzione di parti di un lavoro in più processi contemporaneamente, con RFC asincrone o job in background. Lezione [114](../course/v2/0114-parallel-processing.it.md).

**Elemento dati**: L'oggetto del Dizionario che dà significato a un campo: rimanda a un dominio e contiene le etichette e la documentazione. Lezione [45](../course/v2/0045-data-elements.it.md).

**EML (Entity Manipulation Language)**: la parte del linguaggio ABAP che legge e modifica i business object RAP: `READ ENTITIES`, `MODIFY ENTITIES`, `COMMIT ENTITIES`. Lezione [143](../course/v2/0143-eml.it.md).

**Enhancement**: un'estensione del codice standard SAP senza modificarlo: implicita (all'inizio o alla fine di blocchi) o esplicita (enhancement point e section). Lezioni [120](../course/v2/0120-extending-standard-sap.it.md), [123](../course/v2/0123-enhancement-points.it.md).

**Ereditarietà**: il meccanismo con cui una sottoclasse riceve attributi e metodi da una superclasse (`INHERITING FROM`) e può ridefinirli (`REDEFINITION`). Lezione [82](../course/v2/0082-inheritance.it.md).

**Errore a runtime**: un errore che si verifica durante l'esecuzione, per esempio una divisione per zero, e produce un dump se non viene gestito. Lezione [30](../course/v2/0030-runtime-errors.it.md).

**Espressione costruttore**: un'espressione che crea un valore sul posto: `VALUE`, `NEW`, `CONV`, `CAST`, `REF`, `EXACT`, `COND`, `SWITCH`, `REDUCE`, `FILTER`, `CORRESPONDING`. Lezione [91](../course/v2/0091-constructor-expressions.it.md).

**Espressione regolare**: un modello di testo usato con `FIND`, `REPLACE` e `matches` per cercare e sostituire parti di stringhe. Lezione [96](../course/v2/0096-regular-expressions.it.md).

**Evento (oggetti)**: un segnale che un oggetto lancia con `RAISE EVENT` e a cui altri oggetti rispondono con metodi gestori registrati con `SET HANDLER`. Lezione [86](../course/v2/0086-events.it.md).

**Evento di report**: un blocco eseguito dal runtime in un momento preciso di un report: `INITIALIZATION`, `AT SELECTION-SCREEN`, `START-OF-SELECTION` e altri. Lezione [66](../course/v2/0066-report-events.it.md).

**`EXIT`, `CONTINUE`**: le istruzioni che, in un ciclo, rispettivamente escono dal ciclo e passano subito al giro successivo. Lezione [27](../course/v2/0027-exit-continue-check.it.md).

## F

**Field symbol**: un segnaposto (`<fs>`) che punta a un dato esistente, per esempio una riga di tabella interna, e permette di modificarlo senza copiarlo. Lezione [41](../course/v2/0041-field-symbols.it.md).

**`FILTER`**: L'espressione che restituisce le righe di una tabella interna che soddisfano una condizione sulla chiave. Lezione [94](../course/v2/0094-filter-and-corresponding.it.md).

**Fiori elements**: il framework di SAP Fiori che genera le app (liste, pagine oggetto) a partire da un servizio OData e dalle annotazioni. Lezione [145](../course/v2/0145-rap-fiori-elements.it.md).

**Flow logic**: il codice di una Dynpro che collega la schermata ai moduli ABAP, diviso in PBO e PAI. Lezione [102](../course/v2/0102-dynpro-flow-logic.it.md).

**`FOR`**: L'espressione di iterazione usata dentro `VALUE` e `REDUCE` per costruire una tabella o un valore scorrendo un'altra tabella. Lezione [93](../course/v2/0093-for-and-reduce.it.md).

**`FOR ALL ENTRIES`**: L'aggiunta di `SELECT` che legge le righe corrispondenti a ogni riga di una tabella interna; se la tabella è vuota legge tutto. Lezione [57](../course/v2/0057-for-all-entries.it.md).

**Form (Smart Forms, Adobe Forms)**: i moduli di stampa per documenti come fatture e ordini, progettati con Smart Forms o con Adobe Forms. Lezione [129](../course/v2/0129-forms.it.md).

## G

**`GROUP BY`**: in SQL raggruppa le righe per calcolare aggregati; con `LOOP AT ... GROUP BY` raggruppa le righe di una tabella interna. Lezioni [56](../course/v2/0056-aggregates-and-group-by.it.md), [95](../course/v2/0095-grouping-internal-tables.it.md).

**Gruppo funzioni**: il programma che raccoglie moduli funzione correlati e i loro dati globali (transazione SE80 o SE37). Lezione [70](../course/v2/0070-function-modules.it.md).

**GUI status**: L'insieme di menu, pulsanti e tasti funzione di una schermata, impostato con `SET PF-STATUS`. Lezione [104](../course/v2/0104-gui-status-and-popups.it.md).

## H

**`HAVING`**: la condizione SQL che filtra i gruppi dopo il `GROUP BY`, in base ai valori aggregati. Lezione [56](../course/v2/0056-aggregates-and-group-by.it.md).

**HTTP client**: le classi che chiamano servizi web esterni via HTTP, per esempio API REST. Lezione [126](../course/v2/0126-http-and-rest.it.md).

## I

**IDoc (Intermediate Document)**: il formato standard SAP per scambiare documenti di business fra sistemi, usato con ALE ed EDI. Lezione [125](../course/v2/0125-idoc-and-ale.it.md).

**`IF`**: L'istruzione che esegue un blocco di codice solo se un'espressione logica è vera, con eventuali `ELSEIF` ed `ELSE`. Lezione [24](../course/v2/0024-if-and-logical-expressions.it.md).

**Incapsulamento**: nascondere i dettagli interni di una classe dietro sezioni `PRIVATE` e `PROTECTED`, esponendo solo un'interfaccia `PUBLIC`. Lezione [80](../course/v2/0080-visibility-and-encapsulation.it.md).

**Include**: un programma che contiene un pezzo di codice inserito in altri programmi con `INCLUDE`; nel Dizionario, anche una struttura inclusa in un'altra. Lezioni [32](../course/v2/0032-nested-structures.it.md), [69](../course/v2/0069-includes-and-subroutines.it.md).

**Interfaccia**: un insieme di metodi senza implementazione che più classi possono implementare (`INTERFACES`), garantendo lo stesso comportamento. Lezione [84](../course/v2/0084-interfaces.it.md).

**Intervallo di numerazione**: L'oggetto che distribuisce numeri progressivi univoci, per esempio per i numeri dei documenti (transazione SNRO). Lezione [111](../course/v2/0111-number-ranges.it.md).

**Istanza**: un oggetto concreto creato da una classe con `NEW` o `CREATE OBJECT`. Nell'architettura, anche un application server con i suoi work process. Lezioni [3](../course/v2/0003-sap-system-architecture.it.md), [76](../course/v2/0076-classes-and-objects.it.md).

## J

**Job in background**: un programma eseguito senza interazione con l'utente, pianificato con SM36 e controllato con SM37. Lezione [68](../course/v2/0068-variants-and-background-jobs.it.md).

**Join**: la combinazione in una sola `SELECT` delle righe di più tabelle collegate: `INNER JOIN`, `LEFT OUTER JOIN` e altri. Lezione [55](../course/v2/0055-joins.it.md).

**JSON**: il formato testuale per lo scambio di dati via web, che in ABAP si genera e si legge con `/UI2/CL_JSON` o con le trasformazioni. Lezione [127](../course/v2/0127-json-and-xml.it.md).

## L

**Landscape di sistema**: L'insieme dei sistemi SAP di un'azienda, di solito sviluppo, qualità e produzione, collegati dai trasporti. Lezione [4](../course/v2/0004-system-landscape-and-clients.it.md).

**`LIKE`**: L'aggiunta che dichiara un dato con lo stesso tipo di un altro dato esistente. Lezione [17](../course/v2/0017-types-and-like.it.md).

**Lista interattiva**: una lista classica in cui l'utente fa doppio clic su una riga per aprire una lista di dettaglio (`AT LINE-SELECTION`). Lezione [67](../course/v2/0067-interactive-lists.it.md).

**Log applicativo**: il registro standard dei messaggi di un'elaborazione, salvato nel database e consultabile con SLG1. Lezione [112](../course/v2/0112-application-log.it.md).

**LUW (Logical Unit of Work)**: un gruppo di modifiche che viene salvato o annullato tutto insieme. Ci sono la LUW di database e la LUW SAP. Lezione [60](../course/v2/0060-luw-commit-and-rollback.it.md).

## M

**Mandante**: un'unità indipendente dentro un sistema SAP, con i propri dati e utenti; è il primo campo (`MANDT`) di quasi ogni tabella. Lezione [4](../course/v2/0004-system-landscape-and-clients.it.md).

**Manutenzione tabelle**: la schermata generata per inserire e modificare a mano i dati di una tabella, aperta con SM30. Lezione [49](../course/v2/0049-views-and-table-maintenance.it.md).

**Memoria ABAP, memoria SAP**: le aree per passare dati fra programmi: la memoria ABAP (`EXPORT`/`IMPORT ... MEMORY`) dentro una sessione, la memoria SAP (`SET`/`GET PARAMETER`) per tutto il logon. Lezione [72](../course/v2/0072-calling-programs-and-memory.it.md).

**Messaggio**: un testo mostrato all'utente con `MESSAGE`, di tipo informativo, di successo, di avviso, di errore o di interruzione. Lezione [61](../course/v2/0061-messages.it.md).

**Metodo**: una procedura che appartiene a una classe e lavora sui suoi attributi; si dichiara con `METHODS` e si implementa fra `METHOD` ed `ENDMETHOD`. Lezione [77](../course/v2/0077-attributes-and-methods.it.md).

**Modulo funzione**: una procedura globale e riutilizzabile, con interfaccia ed eccezioni, che si chiama con `CALL FUNCTION`. Lezione [70](../course/v2/0070-function-modules.it.md).

**Modulo funzione di aggiornamento**: un modulo funzione chiamato `IN UPDATE TASK`, che scrive nel database solo al `COMMIT WORK`, in un processo separato. Lezione [113](../course/v2/0113-update-task.it.md).

## O

**OData**: il protocollo REST con cui le app SAP Fiori leggono e scrivono i dati; in ABAP si espone con SAP Gateway o con RAP. Lezioni [128](../course/v2/0128-odata-with-sap-gateway.it.md), [144](../course/v2/0144-rap-business-services.it.md).

**Oggetto**: un'istanza di una classe, con i propri valori degli attributi, raggiungibile attraverso una variabile di riferimento. Lezione [76](../course/v2/0076-classes-and-objects.it.md).

**Oggetto di blocco**: L'oggetto del Dizionario che genera i moduli `ENQUEUE_*` e `DEQUEUE_*` per impedire che due utenti modifichino gli stessi dati insieme. Lezione [51](../course/v2/0051-lock-objects.it.md).

**`ORDER BY`**: la clausola SQL che ordina i risultati di una `SELECT`. Lezione [54](../course/v2/0054-where-and-order-by.it.md).

## P

**Pacchetto**: il contenitore che raggruppa gli oggetti di sviluppo e ne stabilisce il trasporto e la visibilità. Lezione [7](../course/v2/0007-packages-and-transport-requests.it.md).

**PAI, PBO**: i due momenti della flow logic di una Dynpro: _Process Before Output_, prima di mostrare la schermata, e _Process After Input_, dopo l'azione dell'utente. Lezione [102](../course/v2/0102-dynpro-flow-logic.it.md).

**`PARAMETERS`**: L'istruzione che crea un campo di input singolo sulla schermata di selezione di un report. Lezione [63](../course/v2/0063-parameters.it.md).

**Parametro di metodo**: un dato scambiato con un metodo: `IMPORTING`, `EXPORTING`, `CHANGING` o `RETURNING`. Lezione [78](../course/v2/0078-method-parameters.it.md).

**Polimorfismo**: la capacità di chiamare lo stesso metodo su oggetti di classi diverse e ottenere il comportamento di ciascuna. Lezione [85](../course/v2/0085-polymorphism-and-casting.it.md).

**Pretty printer**: la funzione dell'editor che riformatta il codice: indentazione e maiuscole o minuscole delle parole chiave. Lezione [10](../course/v2/0010-comments-and-formatting.it.md).

**Proiezione (RAP)**: lo strato di viste CDS e di behavior sopra il data model che decide che cosa espone un servizio specifico. Lezione [144](../course/v2/0144-rap-business-services.it.md).

## R

**Range**: una tabella con le colonne `SIGN`, `OPTION`, `LOW` e `HIGH` che descrive un insieme di valori, come quella di `SELECT-OPTIONS`. Lezione [64](../course/v2/0064-select-options-and-ranges.it.md).

**RAP (RESTful Application Programming Model)**: il modello di programmazione moderno di SAP per costruire servizi OData e app Fiori con CDS, behavior definition ed EML. Lezione [139](../course/v2/0139-rap-overview.it.md).

**`REDUCE`**: L'espressione che calcola un solo valore, per esempio una somma, scorrendo una tabella con `FOR`. Lezione [93](../course/v2/0093-for-and-reduce.it.md).

**Report**: un programma eseguibile (`REPORT`), di solito con una schermata di selezione e un output a lista o ALV. Lezioni [8](../course/v2/0008-hello-world.it.md), [66](../course/v2/0066-report-events.it.md).

**REST**: lo stile architetturale dei servizi web basato su risorse e metodi HTTP (`GET`, `POST`, `PUT`, `DELETE`). Lezione [126](../course/v2/0126-http-and-rest.it.md).

**RFC (Remote Function Call)**: la chiamata di un modulo funzione su un altro sistema, sincrona o asincrona, attraverso una destinazione (SM59). Lezione [124](../course/v2/0124-rfc.it.md).

**Richiesta di trasporto**: il contenitore che registra le modifiche agli oggetti e le porta dal sistema di sviluppo a quelli di qualità e produzione. Lezione [7](../course/v2/0007-packages-and-transport-requests.it.md).

**Riferimento ai dati**: una variabile `REF TO` che contiene l'indirizzo di un dato e si dereferenzia con `->*`. Lezione [42](../course/v2/0042-data-references.it.md).

**`ROLLBACK WORK`**: L'istruzione che annulla tutte le modifiche della LUW SAP non ancora confermate. Lezione [60](../course/v2/0060-luw-commit-and-rollback.it.md).

**RTTS (Runtime Type Services)**: le classi che descrivono un tipo a runtime (RTTI) e ne creano di nuovi (RTTC), come `CL_ABAP_TYPEDESCR`. Lezione [115](../course/v2/0115-rtts.it.md).

## S

**SAP**: L'azienda tedesca che produce i software gestionali ERP, come SAP ECC e SAP S/4HANA, con cui lavorano molte imprese. Lezione [1](../course/v2/0001-what-is-sap.it.md).

**SAP Gateway**: il componente che espone dati e logica ABAP come servizi OData (transazione SEGW). Lezione [128](../course/v2/0128-odata-with-sap-gateway.it.md).

**SAP GUI**: il programma installato sul PC con cui l'utente si collega al sistema SAP e usa le transazioni. Lezione [5](../course/v2/0005-sap-gui-and-transaction-codes.it.md).

**SAP HANA**: il database in memoria di SAP, colonnare, su cui girano SAP S/4HANA e il code pushdown. Lezione [131](../course/v2/0131-code-pushdown.it.md).

**Schermata di selezione**: la schermata di input di un report, costruita con `PARAMETERS`, `SELECT-OPTIONS` e `SELECTION-SCREEN`. Lezioni [63](../course/v2/0063-parameters.it.md), [65](../course/v2/0065-selection-screen-layout.it.md).

**Scrittura sul database**: le istruzioni `INSERT`, `UPDATE`, `MODIFY` e `DELETE` che cambiano i dati delle tabelle del database. Lezione [59](../course/v2/0059-writing-to-the-database.it.md).

**`SELECT`**: L'istruzione ABAP SQL che legge dati dal database, in una tabella interna, in una struttura o riga per riga. Lezione [52](../course/v2/0052-select-basics.it.md).

**`SELECT SINGLE`**: la variante di `SELECT` che legge al massimo una riga, di solito con la chiave completa. Lezione [53](../course/v2/0053-select-single-and-up-to.it.md).

**`SELECT-OPTIONS`**: L'istruzione che crea sulla schermata di selezione un campo per intervalli e liste di valori, legato a una tabella range. Lezione [64](../course/v2/0064-select-options-and-ranges.it.md).

**Service binding**: L'oggetto RAP che pubblica una service definition con un protocollo, per esempio OData V2 o V4, per UI o per API. Lezione [144](../course/v2/0144-rap-business-services.it.md).

**Service definition**: L'oggetto RAP che elenca le entità CDS esposte da un servizio. Lezione [144](../course/v2/0144-rap-business-services.it.md).

**Shared object**: un oggetto conservato nella memoria condivisa dell'application server e letto da più programmi e utenti. Lezione [149](../course/v2/0149-shared-objects.it.md).

**Simbolo di testo**: un testo di un programma (`TEXT-001`) salvato a parte e traducibile nelle varie lingue. Lezione [62](../course/v2/0062-text-symbols-and-translation.it.md).

**SQL dinamico**: una `SELECT` in cui tabella, campi o condizioni sono stringhe decise a runtime. Lezione [117](../course/v2/0117-dynamic-sql-and-calls.it.md).

**Struttura**: un dato composto da più campi (componenti) di tipi diversi, come una riga di tabella. Lezioni [31](../course/v2/0031-structures.it.md), [48](../course/v2/0048-ddic-structures-and-table-types.it.md).

**Struttura annidata**: una struttura che contiene altre strutture o tabelle come componenti. Lezione [32](../course/v2/0032-nested-structures.it.md).

**Subquery**: una `SELECT` dentro un'altra `SELECT`, usata per esempio con `IN` o `EXISTS` nella condizione `WHERE`. Lezione [58](../course/v2/0058-subqueries-and-union.it.md).

**Subroutine**: il vecchio modo di modularizzare il codice con `FORM` e `PERFORM`; oggi si usano i metodi. Lezione [69](../course/v2/0069-includes-and-subroutines.it.md).

**`SWITCH`**: L'espressione che restituisce un valore in base al valore di un operando, come un `CASE` in una sola espressione. Lezione [92](../course/v2/0092-cond-and-switch.it.md).

**`sy-subrc`**: il codice di ritorno dell'ultima istruzione: `0` vuol dire successo. Va controllato dopo `SELECT`, `READ TABLE` e chiamate. Lezione [23](../course/v2/0023-system-fields.it.md).

## T

**Tabella del database**: una tabella definita nel Dizionario e creata nel database (tabella trasparente), con campi, chiave e impostazioni tecniche. Lezione [46](../course/v2/0046-database-tables.it.md).

**Tabella di controllo**: la tabella che contiene i valori ammessi per un campo, collegata con una chiave esterna. Lezione [47](../course/v2/0047-foreign-keys-and-check-tables.it.md).

**Tabella hashed**: una tabella interna con chiave univoca e accesso tramite funzione di hash: il tempo di lettura non dipende dal numero di righe. Lezione [34](../course/v2/0034-table-categories.it.md).

**Tabella interna**: una tabella in memoria che contiene un elenco di righe dello stesso tipo, per elaborare dati durante l'esecuzione. Lezione [33](../course/v2/0033-internal-tables-intro.it.md).

**Tabella sorted**: una tabella interna sempre ordinata per chiave, con ricerca binaria automatica. Lezione [34](../course/v2/0034-table-categories.it.md).

**Tabella standard**: il tipo più comune di tabella interna: righe in ordine di inserimento e accesso per indice o con ricerca lineare. Lezione [34](../course/v2/0034-table-categories.it.md).

**Template di stringa**: una stringa fra barre verticali (`|...|`) con espressioni fra graffe `{ }` e opzioni di formattazione. Lezione [22](../course/v2/0022-string-templates.it.md).

**Test double**: un oggetto finto che prende il posto di una dipendenza reale (database, API) durante un test. Lezione [106](../course/v2/0106-test-doubles.it.md).

**Tipi carattere**: i tipi per il testo: `c` a lunghezza fissa, `n` per testo numerico, `string` a lunghezza variabile. Lezione [13](../course/v2/0013-character-types.it.md).

**Tipi data e ora**: i tipi `d` (data, `AAAAMMGG`), `t` (ora, `HHMMSS`), `utclong` e i time stamp, con cui si possono fare calcoli. Lezione [15](../course/v2/0015-date-and-time-types.it.md).

**Tipi numerici**: i tipi per i numeri: `i` e `int8` interi, `p` packed con decimali fissi, `decfloat16` e `decfloat34`, `f` a virgola mobile binaria. Lezione [14](../course/v2/0014-numeric-types.it.md).

**Tipo tabella**: L'oggetto del Dizionario, o la dichiarazione `TYPES ... TABLE OF`, che descrive una tabella interna: tipo di riga, categoria e chiave. Lezione [48](../course/v2/0048-ddic-structures-and-table-types.it.md).

**Transazione**: un codice (per esempio SE38 o VA01) che apre direttamente un programma o una funzione del sistema SAP. Lezione [5](../course/v2/0005-sap-gui-and-transaction-codes.it.md).

**`TYPES`**: L'istruzione che definisce un tipo di dato locale, da usare poi con `TYPE`. Lezione [17](../course/v2/0017-types-and-like.it.md).

## U

**`UNION`**: L'operatore SQL che unisce in un solo risultato le righe di due `SELECT`. Lezione [58](../course/v2/0058-subqueries-and-union.it.md).

**Unmanaged (RAP)**: lo scenario RAP in cui scrivi tu la logica di salvataggio, di solito per riusare codice esistente; con _additional save_ aggiungi logica a uno scenario managed. Lezione [147](../course/v2/0147-rap-unmanaged-and-save.it.md).

**User exit**: un vecchio punto di estensione: una subroutine vuota nel codice standard (spesso `USEREXIT_*`) in cui il cliente aggiunge il proprio codice. Lezione [121](../course/v2/0121-user-exits-and-customer-exits.it.md).

## V

**Validazione**: in RAP, un controllo sui dati che blocca il salvataggio e restituisce un messaggio se i valori non sono validi. Lezione [142](../course/v2/0142-rap-validations-determinations-actions.it.md).

**`VALUE`**: L'espressione costruttore che crea strutture e tabelle interne con i loro valori in una sola istruzione. Lezione [91](../course/v2/0091-constructor-expressions.it.md).

**Variabile**: un dato con nome, dichiarato con `DATA`, il cui valore può cambiare durante l'esecuzione. Lezione [12](../course/v2/0012-variables-and-constants.it.md).

**Variante**: un insieme salvato di valori per una schermata di selezione, da riusare o da usare in un job in background. Lezione [68](../course/v2/0068-variants-and-background-jobs.it.md).

**Visibilità**: le sezioni `PUBLIC`, `PROTECTED` e `PRIVATE` di una classe, che decidono chi può usare ogni componente. Lezione [80](../course/v2/0080-visibility-and-encapsulation.it.md).

**Vista**: nel Dizionario, una vista combina campi di più tabelle (vista di database) o serve a mantenerli (vista di manutenzione); oggi si usano le viste CDS. Lezione [49](../course/v2/0049-views-and-table-maintenance.it.md).

## W

**Watchpoint**: un punto di arresto del debugger che scatta quando il valore di una variabile cambia o soddisfa una condizione. Lezione [29](../course/v2/0029-breakpoints-and-watchpoints.it.md).

**`WHERE`**: la clausola che filtra le righe in una `SELECT`, in un `LOOP AT` o in un `DELETE`. Lezione [54](../course/v2/0054-where-and-order-by.it.md).

**Work process**: un processo dell'application server che esegue le richieste degli utenti: dialog, background, update, enqueue, spool. Lezione [3](../course/v2/0003-sap-system-architecture.it.md).

**`WRITE`**: L'istruzione che stampa testo e valori in una lista classica. Lezione [11](../course/v2/0011-output-with-write.it.md).

## X

**XML**: il formato di markup per lo scambio di dati, che in ABAP si legge e si genera con `CALL TRANSFORMATION` e le librerie iXML. Lezione [127](../course/v2/0127-json-and-xml.it.md).

**`xsdbool`**: la funzione che trasforma un'espressione logica in `abap_true` o `abap_false`. Lezione [16](../course/v2/0016-boolean-values.it.md).
