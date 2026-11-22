---
description: Corso ABAP completo e al tuo ritmo, in 152 lezioni brevi, dal primo programma a RAP e ABAP Cloud.
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

Un corso ABAP completo, dal primo programma fino alle app Fiori con RAP e ABAP Cloud. Ogni lezione tratta **un solo argomento**: la leggi, provi il codice, fai l'esercizio e passi alla successiva.

## A chi è rivolto

- Chi non conosce SAP e vuole imparare ABAP da zero.
- Sviluppatori ABAP che conoscono l'ABAP classico e vogliono passare ad ABAP moderno, CDS e RAP.
- Consulenti funzionali che vogliono leggere e capire il codice custom.
- Chi conosce già ABAP e cerca un riferimento rapido su un argomento preciso.

Non serve conoscere SAP. Un po' di esperienza di programmazione aiuta, ma non è obbligatoria.

## Come funziona

Il corso è **al tuo ritmo**: non ci sono giorni, ore o scadenze. Ogni lezione è breve e si completa in una sola lettura. Puoi seguirle tutte in ordine, oppure saltare direttamente all'argomento che ti serve.

Le lezioni sono divise in **4 livelli**:

| Livello      | Lezioni | Che cosa impari                                                                                                        |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| Principiante | 1–30    | il sistema SAP, gli strumenti, la sintassi, i tipi di dato, le stringhe, il controllo del flusso e il debugger         |
| Base         | 31–74   | strutture e tabelle interne, il Dizionario ABAP, ABAP SQL, i report, i moduli funzione e i file                        |
| Intermedio   | 75–119  | la programmazione a oggetti, le eccezioni, ABAP moderno, ALV e Dynpro, i test, le prestazioni e le tecniche di sistema |
| Pro          | 120–152 | enhancement, integrazione, SAP HANA e CDS, RAP, ABAP Cloud e il progetto finale                                        |

Ogni lezione ha la stessa struttura:

1. **Introduzione**: che cosa impari e perché serve.
2. **Spiegazione**: l'argomento passo per passo, con esempi di codice.
3. **Esercizio**: una piccola prova da fare su un sistema reale.
4. **Riepilogo**: i punti da ricordare.

Lungo il percorso troverai questi riquadri:

> [!TIP]
> Un'**analogia** che collega un'idea nuova a qualcosa che conosci già.

> [!WARNING]
> Un **avvertimento** su un errore comune o un rischio.

> [!IMPORTANT]
> L'**esercizio** della lezione.

> [!NOTE]
> Il **riepilogo** alla fine di ogni lezione.

## Indice

### Principiante

1. [Che cos'è SAP](./0001-what-is-sap.md): l'azienda, i suoi prodotti ERP e perché le imprese li usano.
2. [Che cos'è ABAP](./0002-what-is-abap.md): il linguaggio dei sistemi SAP: dove gira e che cosa ci costruisci.
3. [L'architettura di un sistema SAP](./0003-sap-system-architecture.md): livello di presentazione, applicativo e database, work process e istanze.
4. [Landscape di sistema e mandanti](./0004-system-landscape-and-clients.md): sistemi di sviluppo, qualità e produzione, e che cos'è un mandante.
5. [SAP GUI e codici transazione](./0005-sap-gui-and-transaction-codes.md): accedere, muoversi e aprire le transazioni che uno sviluppatore usa ogni giorno.
6. [Gli ABAP Development Tools in Eclipse](./0006-abap-development-tools.md): installare ADT, collegarsi a un sistema e orientarsi nell'IDE.
7. [Pacchetti e richieste di trasporto](./0007-packages-and-transport-requests.md): dove vivono i tuoi oggetti e come viaggiano dallo sviluppo alla produzione.
8. [Il tuo primo programma](./0008-hello-world.md): creare, controllare, attivare ed eseguire un report che saluta.
9. [Le regole della sintassi ABAP](./0009-syntax-rules.md): istruzioni, punti, parole chiave, istruzioni concatenate e nomi.
10. [Commenti e formattazione](./0010-comments-and-formatting.md): commenti di riga e di fine riga, il pretty printer e il codice leggibile.
11. [L'output con WRITE](./0011-output-with-write.md): stampare testi e valori su una lista classica, con posizioni e formati.
12. [Variabili e costanti](./0012-variables-and-constants.md): dichiarare oggetti dati con DATA e CONSTANTS e usare i letterali.
13. [I tipi carattere: c, n, string](./0013-character-types.md): testo a lunghezza fissa, testo numerico e stringhe di qualsiasi lunghezza.
14. [I tipi numerici](./0014-numeric-types.md): interi, numeri packed, virgola mobile decimale e binaria.
15. [I tipi data e ora](./0015-date-and-time-types.md): date, ore, time stamp e calcoli con essi.
16. [I valori booleani](./0016-boolean-values.md): abap_bool, abap_true, abap_false e xsdbool.
17. [Definire tipi con TYPES e LIKE](./0017-types-and-like.md): I tuoi tipi, i riferimenti ai tipi del Dizionario e LIKE.
18. [Le dichiarazioni inline](./0018-inline-declarations.md): DATA(...) e FINAL(...): dichiarare una variabile dove la riempi la prima volta.
19. [Le conversioni di tipo](./0019-type-conversions.md): che cosa succede quando assegni un valore a una variabile di un altro tipo.
20. [Le operazioni aritmetiche](./0020-arithmetic-operations.md): operatori, DIV e MOD, arrotondamenti e funzioni numeriche.
21. [Lavorare con le stringhe](./0021-working-with-strings.md): concatenare, dividere, misurare, spostare e cambiare il maiuscolo del testo.
22. [I template di stringa](./0022-string-templates.md): costruire testi con espressioni incorporate e opzioni di formato.
23. [I campi di sistema](./0023-system-fields.md): sy-subrc, sy-datum, sy-uname e gli altri campi che il runtime riempie.
24. [IF e le espressioni logiche](./0024-if-and-logical-expressions.md): confronti, AND, OR, NOT e predicati come IS INITIAL.
25. [CASE](./0025-case.md): scegliere un ramo fra tanti confrontando un solo valore.
26. [I cicli DO e WHILE](./0026-do-and-while-loops.md): ripetere codice un numero fisso di volte o finché vale una condizione.
27. [EXIT, CONTINUE e CHECK](./0027-exit-continue-check.md): uscire da un ciclo o saltare al passo successivo.
28. [Il debugger: primi passi](./0028-debugger-basics.md): avviare il debugger, eseguire il codice passo per passo e ispezionare le variabili.
29. [Breakpoint e watchpoint](./0029-breakpoints-and-watchpoints.md): fermare il programma esattamente dove e quando vuoi.
30. [Gli errori a runtime e la ST22](./0030-runtime-errors.md): leggere un dump e trovare la causa di un crash.

### Base

31. [Le strutture](./0031-structures.md): raggruppare campi correlati in un solo oggetto dati.
32. [Strutture annidate e include](./0032-nested-structures.md): strutture dentro strutture, e INCLUDE TYPE.
33. [Che cos'è una tabella interna](./0033-internal-tables-intro.md): elenchi di righe in memoria: lo strumento più usato in ABAP.
34. [Tabelle standard, sorted e hashed](./0034-table-categories.md): le tre categorie di tabella e quando usare ciascuna.
35. [Chiavi primarie e secondarie](./0035-table-keys.md): chiavi uniche e non uniche, chiavi vuote e chiavi secondarie.
36. [Riempire le tabelle interne](./0036-filling-internal-tables.md): APPEND, INSERT, VALUE e BASE.
37. [Leggere singole righe](./0037-reading-internal-tables.md): READ TABLE, espressioni tabella, line_exists e line_index.
38. [Ciclare sulle tabelle interne](./0038-looping-internal-tables.md): LOOP AT con WHERE, FROM, TO e le istruzioni di livello di controllo.
39. [Modificare e cancellare righe](./0039-changing-and-deleting-rows.md): MODIFY, DELETE e CLEAR, FREE, REFRESH sulle tabelle intere.
40. [Ordinare, sommare e togliere duplicati](./0040-sorting-and-duplicates.md): SORT, DELETE ADJACENT DUPLICATES e COLLECT.
41. [I field symbol](./0041-field-symbols.md): lavorare direttamente su una riga o una variabile senza copiarla.
42. [I riferimenti ai dati](./0042-data-references.md): REF TO, GET REFERENCE, l'operatore di dereferenziazione e REFERENCE INTO.
43. [Il Dizionario ABAP](./0043-abap-dictionary-intro.md): il catalogo centrale dei tipi e degli oggetti del database.
44. [I domini](./0044-domains.md): tipo tecnico, lunghezza, intervalli di valori e routine di conversione.
45. [Gli elementi dati](./0045-data-elements.md): significato di business, etichette e documentazione di un campo.
46. [Le tabelle del database](./0046-database-tables.md): creare una tabella trasparente con campi, chiavi e impostazioni tecniche.
47. [Chiavi esterne e tabelle di controllo](./0047-foreign-keys-and-check-tables.md): collegare le tabelle e controllare i valori inseriti.
48. [Strutture e tipi tabella nel Dizionario](./0048-ddic-structures-and-table-types.md): tipi globali che ogni programma può riutilizzare.
49. [Viste e manutenzione delle tabelle](./0049-views-and-table-maintenance.md): viste di database, viste di manutenzione e SM30.
50. [Gli aiuti di ricerca](./0050-search-helps.md): l'aiuto F4: aiuti di ricerca elementari e collettivi.
51. [Gli oggetti di blocco](./0051-lock-objects.md): il concetto di blocco SAP, ENQUEUE e DEQUEUE.
52. [Leggere dati con SELECT](./0052-select-basics.md): le prime query ABAP SQL: campi, INTO e sy-subrc.
53. [SELECT SINGLE e UP TO n ROWS](./0053-select-single-and-up-to.md): leggere una riga, o solo le prime righe.
54. [WHERE e ORDER BY](./0054-where-and-order-by.md): filtrare e ordinare le righe che il database restituisce.
55. [I join](./0055-joins.md): INNER JOIN e LEFT OUTER JOIN fra più tabelle.
56. [Aggregati, GROUP BY e HAVING](./0056-aggregates-and-group-by.md): COUNT, SUM, AVG, MIN, MAX e risultati raggruppati.
57. [FOR ALL ENTRIES](./0057-for-all-entries.md): leggere le righe che corrispondono al contenuto di una tabella interna.
58. [Subquery e UNION](./0058-subqueries-and-union.md): EXISTS, IN con una subquery e la combinazione di risultati.
59. [Scrivere dati: INSERT, UPDATE, MODIFY, DELETE](./0059-writing-to-the-database.md): modificare il contenuto delle tabelle del database.
60. [La LUW: COMMIT e ROLLBACK](./0060-luw-commit-and-rollback.md): LUW di database, LUW SAP e la coerenza dei dati.
61. [I messaggi](./0061-messages.md): classi di messaggi, tipi di messaggio e l'istruzione MESSAGE.
62. [Simboli di testo e traduzione](./0062-text-symbols-and-translation.md): tenere i testi fuori dal codice e tradurli.
63. [Schermate di selezione: PARAMETERS](./0063-parameters.md): campi di input, checkbox, radio button e list box.
64. [SELECT-OPTIONS e range](./0064-select-options-and-ranges.md): far inserire all'utente intervalli ed elenchi di valori.
65. [Il layout della schermata di selezione](./0065-selection-screen-layout.md): blocchi, cornici, commenti e modifiche dinamiche dello schermo.
66. [Gli eventi dei report](./0066-report-events.md): INITIALIZATION, AT SELECTION-SCREEN, START-OF-SELECTION e altri.
67. [Le liste interattive](./0067-interactive-lists.md): TOP-OF-PAGE, AT LINE-SELECTION, HIDE e le liste di dettaglio.
68. [Varianti e job in background](./0068-variants-and-background-jobs.md): salvare i valori di input e pianificare i programmi con SM36 e SM37.
69. [Include e subroutine](./0069-includes-and-subroutines.md): dividere un programma in file, e leggere FORM e PERFORM nel codice legacy.
70. [I moduli funzione](./0070-function-modules.md): gruppi funzione, interfacce, eccezioni e SE37.
71. [Le BAPI](./0071-bapis.md): chiamare le API di business standard e gestire BAPIRET2.
72. [Chiamare programmi, memoria SAP e memoria ABAP](./0072-calling-programs-and-memory.md): SUBMIT, CALL TRANSACTION, SET/GET PARAMETER, EXPORT/IMPORT.
73. [I file sul PC dell'utente](./0073-files-on-the-presentation-server.md): caricare e scaricare file tramite SAP GUI.
74. [I file sull'application server](./0074-files-on-the-application-server.md): OPEN DATASET, TRANSFER, READ DATASET e AL11.

### Intermedio

75. [Perché la programmazione a oggetti](./0075-why-object-oriented.md): dalle procedure agli oggetti: che cosa cambia e perché aiuta.
76. [Classi e oggetti](./0076-classes-and-objects.md): classi locali, DEFINITION e IMPLEMENTATION, NEW e riferimenti.
77. [Attributi e metodi](./0077-attributes-and-methods.md): dati e comportamento di un oggetto, e l'autoriferimento me.
78. [I parametri dei metodi](./0078-method-parameters.md): IMPORTING, EXPORTING, CHANGING, RETURNING e chiamate funzionali.
79. [I costruttori](./0079-constructors.md): costruttori di istanza e statici.
80. [Visibilità e incapsulamento](./0080-visibility-and-encapsulation.md): PUBLIC, PROTECTED, PRIVATE, READ-ONLY e friend.
81. [I componenti statici](./0081-static-components.md): CLASS-DATA, CLASS-METHODS e l'operatore =>.
82. [L'ereditarietà](./0082-inheritance.md): sottoclassi, REDEFINITION e super.
83. [Classi astratte e final](./0083-abstract-and-final.md): classi che non puoi istanziare e classi che non puoi estendere.
84. [Le interfacce](./0084-interfaces.md): contratti che classi non correlate possono implementare.
85. [Polimorfismo e casting](./0085-polymorphism-and-casting.md): una chiamata, tanti comportamenti; up cast, down cast e IS INSTANCE OF.
86. [Gli eventi](./0086-events.md): EVENTS, RAISE EVENT e SET HANDLER.
87. [Le classi globali](./0087-global-classes.md): creare classi riutilizzabili in ADT e SE24, con classi locali di test e di supporto.
88. [I design pattern](./0088-design-patterns.md): singleton, factory e strategy in ABAP.
89. [Le eccezioni basate su classi](./0089-class-based-exceptions.md): TRY, CATCH, CLEANUP, RAISE EXCEPTION e la gerarchia delle eccezioni.
90. [Classi di eccezione personalizzate](./0090-custom-exception-classes.md): le tue eccezioni con testi di messaggio, attributi, RETRY e RESUME.
91. [Le espressioni costruttore](./0091-constructor-expressions.md): VALUE, NEW, CONV, CAST, REF, EXACT e LET.
92. [COND e SWITCH](./0092-cond-and-switch.md): espressioni condizionali che restituiscono un valore.
93. [FOR e REDUCE](./0093-for-and-reduce.md): costruire e riassumere tabelle in una sola espressione.
94. [FILTER e CORRESPONDING](./0094-filter-and-corresponding.md): filtrare tabelle per chiave e mappare campi fra strutture.
95. [Raggruppare le tabelle interne](./0095-grouping-internal-tables.md): LOOP AT ... GROUP BY e LOOP AT GROUP.
96. [FIND, REPLACE e le espressioni regolari](./0096-regular-expressions.md): cercare e modificare testi con i pattern.
97. [ABAP SQL moderno](./0097-modern-abap-sql.md): variabili host, dichiarazioni inline, espressioni SQL e CASE.
98. [ABAP SQL avanzato](./0098-advanced-abap-sql.md): common table expression, window function e SELECT da tabelle interne.
99. [ALV con CL_SALV_TABLE](./0099-alv-with-salv.md): mostrare qualsiasi tabella interna come griglia professionale in poche righe.
100.  [L'ALV grid control](./0100-alv-grid-control.md): CL_GUI_ALV_GRID, catalogo campi, layout, eventi e celle modificabili.
101.  [Le schermate classiche (Dynpro)](./0101-dynpro-basics.md): screen Painter, programmi di dialogo e codici transazione.
102.  [La flow logic: PBO e PAI](./0102-dynpro-flow-logic.md): moduli, codici OK e il ciclo fra schermo e programma.
103.  [I controlli di input sulle schermate](./0103-dynpro-input-checks.md): FIELD, CHAIN, messaggi di errore e comandi di uscita.
104.  [GUI status, titoli e popup](./0104-gui-status-and-popups.md): menu, barre degli strumenti, tasti funzione e finestre di conferma.
105.  [ABAP Unit](./0105-abap-unit-basics.md): scrivere ed eseguire test automatici per le tue classi.
106.  [Test double e dependency injection](./0106-test-doubles.md): isolare il codice sotto test dal database e dalle altre classi.
107.  [Qualità del codice: ATC e Clean ABAP](./0107-code-quality.md): controlli statici, l'ABAP Test Cockpit e la guida di stile Clean ABAP.
108.  [L'analisi delle prestazioni](./0108-performance-analysis.md): la traccia SQL (ST05) e l'analisi del runtime (SAT).
109.  [Scrivere ABAP veloce](./0109-performance-best-practices.md): le regole che rendono veloci i programmi sul database e in memoria.
110.  [I controlli di autorizzazione](./0110-authorization-checks.md): oggetti di autorizzazione, AUTHORITY-CHECK e ruoli.
111.  [Gli intervalli di numerazione](./0111-number-ranges.md): generare numeri di documento unici con SNRO.
112.  [Il log applicativo](./0112-application-log.md): raccogliere e mostrare messaggi con i moduli funzione BAL e SLG1.
113.  [I moduli funzione di aggiornamento](./0113-update-task.md): CALL FUNCTION IN UPDATE TASK, PERFORM ON COMMIT e SM13.
114.  [Elaborazione parallela e in background](./0114-parallel-processing.md): RFC asincrona, bgRFC e il background processing framework.
115.  [I runtime type services (RTTS)](./0115-rtts.md): descrivere e creare tipi mentre il programma gira.
116.  [Gli oggetti dati dinamici](./0116-dynamic-data.md): CREATE DATA, ASSIGN COMPONENT e i tipi generici.
117.  [SQL dinamico e chiamate dinamiche](./0117-dynamic-sql-and-calls.md): costruire query e chiamare metodi di cui conosci il nome solo a runtime.
118.  [I documenti di modifica](./0118-change-documents.md): registrare chi ha cambiato che cosa e quando, con SCDO.
119.  [Inviare email](./0119-sending-email.md): inviare messaggi e allegati con CL_BCS e SOST.

### Pro

120. [Estendere lo standard SAP](./0120-extending-standard-sap.md): modifiche, exit, BAdI e l'enhancement framework in sintesi.
121. [User exit e customer exit](./0121-user-exits-and-customer-exits.md): le tecniche di estensione più vecchie, presenti in ogni sistema.
122. [Le BAdI](./0122-badis.md): trovare, implementare e filtrare i Business Add-In.
123. [Enhancement impliciti ed espliciti](./0123-enhancement-points.md): aggiungere codice negli enhancement point e nelle section dei programmi standard.
124. [Le remote function call (RFC)](./0124-rfc.md): chiamare moduli funzione in altri sistemi: sincrone, asincrone e destinazioni.
125. [IDoc e ALE](./0125-idoc-and-ale.md): scambiare documenti di business fra sistemi.
126. [Client HTTP e servizi REST](./0126-http-and-rest.md): chiamare API esterne ed esporre i tuoi endpoint HTTP.
127. [JSON e XML](./0127-json-and-xml.md): serializzare e leggere dati con CALL TRANSFORMATION e XCO.
128. [OData con SAP Gateway](./0128-odata-with-sap-gateway.md): costruire un servizio OData V2 con SEGW.
129. [Smart Forms e Adobe Forms](./0129-forms.md): stampare fatture, etichette e altri documenti.
130. [Il batch input](./0130-batch-input.md): compilare automaticamente le transazioni con BDC e SHDB.
131. [ABAP su SAP HANA e code pushdown](./0131-code-pushdown.md): spostare la logica sui dati dall'application server al database.
132. [Le CDS view entity](./0132-cds-view-entities.md): definire modelli di dati nel database con i Core Data Services.
133. [Le associazioni CDS](./0133-cds-associations.md): relazioni fra entità, path expression ed esposizione.
134. [Le annotazioni CDS](./0134-cds-annotations.md): metadati per semantica, UI, analisi e ricerca.
135. [Espressioni, funzioni e parametri CDS](./0135-cds-expressions-and-parameters.md): CASE, cast, funzioni predefinite, aggregati e parametri di input.
136. [Il controllo accessi CDS](./0136-cds-access-control.md): limitare le righe con i ruoli DCL e gli oggetti di autorizzazione.
137. [ABAP Managed Database Procedures](./0137-amdp.md): scrivere SQLScript dentro le classi ABAP.
138. [Le CDS table function](./0138-cds-table-functions.md): usare un'AMDP come sorgente dati di un'entità CDS.
139. [Il RESTful Application Programming Model](./0139-rap-overview.md): l'architettura di RAP e gli oggetti che compongono un'app RAP.
140. [Il data model RAP](./0140-rap-data-model.md): tabelle di database, entità root e child, e composizioni.
141. [La behavior definition](./0141-rap-behavior-definition.md): implementazione managed, operazioni, controlli sui campi e blocchi.
142. [Validazioni, determinazioni e azioni](./0142-rap-validations-determinations-actions.md): la logica di business nel behavior pool.
143. [L'Entity Manipulation Language](./0143-eml.md): READ ENTITIES, MODIFY ENTITIES e COMMIT ENTITIES.
144. [Proiezioni, service definition e binding](./0144-rap-business-services.md): esporre un business object RAP come servizio OData.
145. [App Fiori elements dalle annotazioni](./0145-rap-fiori-elements.md): costruire la UI con le metadata extension e vederla in anteprima.
146. [La gestione delle bozze](./0146-rap-draft.md): permettere agli utenti di salvare il lavoro prima che sia completo.
147. [Scenari unmanaged e additional save](./0147-rap-unmanaged-and-save.md): riutilizzare codice e BAPI esistenti dentro RAP.
148. [ABAP Cloud e clean core](./0148-abap-cloud.md): API rilasciate, versioni del linguaggio, il modello a livelli e la libreria XCO.
149. [Gli shared object](./0149-shared-objects.md): condividere dati fra programmi tramite la memoria condivisa.
150. [Gli ABAP channel](./0150-abap-channels.md): inviare messaggi in push con ABAP Messaging Channel e ABAP Push Channel.
151. [abapGit e il controllo di versione](./0151-abapgit.md): tenere il codice ABAP in repository Git.
152. [Il progetto finale](./0152-final-project.md): costruire un'app completa che usa quello che hai imparato in ogni livello.

## Che cosa ti serve

- **Un sistema SAP su cui esercitarti.** Va bene uno di questi:
  - un sistema sandbox o di sviluppo aziendale, con una chiave sviluppatore;
  - un account SAP BTP trial con ABAP Environment (gratuito; solo ABAP Cloud, quindi alcuni argomenti classici come le Dynpro e le liste `WRITE` lì non sono disponibili);
  - la developer edition di ABAP Platform, se riesci a installarla.
- **Gli strumenti**: SAP GUI per le transazioni classiche, ed Eclipse con gli ABAP Development Tools (ADT) per lo sviluppo moderno, le CDS e RAP.
- **Dati di esempio**: gli esempi usano il modello dei voli di SAP (tabelle `SCARR`, `SPFLI`, `SFLIGHT`, `SBOOK`). Se il tuo sistema non ha dati, generali con il report `SAPBC_DATA_GENERATOR`.

## Come studiare

- Se parti da zero, segui le lezioni in ordine: ognuna si basa sulle precedenti.
- Se conosci già un livello, salta al successivo e torna indietro solo quando ti serve.
- Scrivi il codice a mano invece di copiarlo, ed eseguilo nel debugger.
- Fai l'esercizio prima di passare alla lezione successiva.
- Alla fine, costruisci il [progetto finale](./0152-final-project.md).

## Questa edizione

Questa è l'edizione **2026.11** del corso: 152 lezioni, una per argomento, al tuo ritmo, in 4 livelli, dalle basi del sistema SAP fino agli ABAP channel e ad abapGit. Il [glossario](../glossary/README.md) spiega i termini del corso, con il link alla lezione di ciascuno.

Gli esempi si basano su SAP S/4HANA e ABAP 7.5x, con il modello ABAP Cloud nel livello pro. Codici organizzativi, numeri e nomi negli esempi (società, organizzazioni commerciali, numeri materiale) sono di esempio: dipendono dal customizing del tuo sistema.

Hai trovato un errore o vuoi migliorare una lezione? Ogni pagina ha il link "Modifica questa pagina su GitHub". Leggi la [guida ai contenuti](https://github.com/dcdavidev/notebook/blob/main/learning-materials/README.md) per sapere come si scrivono le lezioni.
