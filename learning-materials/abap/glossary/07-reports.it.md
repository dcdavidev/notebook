---
title: Report, messaggi e schermate di selezione
description: Messaggi, testi, schermate di selezione, eventi, liste e job.
---

**Classe di messaggi**: il contenitore dei testi dei messaggi, identificati da un numero a tre cifre (transazione SE91). Lezione [61](../course/v2/0061-messages.it.md).

**Evento di report**: un blocco eseguito dal runtime in un momento preciso di un report: `INITIALIZATION`, `AT SELECTION-SCREEN`, `START-OF-SELECTION` e altri. Lezione [66](../course/v2/0066-report-events.it.md).

**Job in background**: un programma eseguito senza interazione con l'utente, pianificato con SM36 e controllato con SM37. Lezione [68](../course/v2/0068-variants-and-background-jobs.it.md).

**Lista interattiva**: una lista classica in cui l'utente fa doppio clic su una riga per aprire una lista di dettaglio (`AT LINE-SELECTION`). Lezione [67](../course/v2/0067-interactive-lists.it.md).

**Messaggio**: un testo mostrato all'utente con `MESSAGE`, di tipo informativo, di successo, di avviso, di errore o di interruzione. Lezione [61](../course/v2/0061-messages.it.md).

**`PARAMETERS`**: l'istruzione che crea un campo di input singolo sulla schermata di selezione di un report. Lezione [63](../course/v2/0063-parameters.it.md).

**Range**: una tabella con le colonne `SIGN`, `OPTION`, `LOW` e `HIGH` che descrive un insieme di valori, come quella di `SELECT-OPTIONS`. Lezione [64](../course/v2/0064-select-options-and-ranges.it.md).

**Report**: un programma eseguibile (`REPORT`), di solito con una schermata di selezione e un output a lista o ALV. Lezioni [8](../course/v2/0008-hello-world.it.md), [66](../course/v2/0066-report-events.it.md).

**Schermata di selezione**: la schermata di input di un report, costruita con `PARAMETERS`, `SELECT-OPTIONS` e `SELECTION-SCREEN`. Lezioni [63](../course/v2/0063-parameters.it.md), [65](../course/v2/0065-selection-screen-layout.it.md).

**`SELECT-OPTIONS`**: l'istruzione che crea sulla schermata di selezione un campo per intervalli e liste di valori, legato a una tabella range. Lezione [64](../course/v2/0064-select-options-and-ranges.it.md).

**Simbolo di testo**: un testo di un programma (`TEXT-001`) salvato a parte e traducibile nelle varie lingue. Lezione [62](../course/v2/0062-text-symbols-and-translation.it.md).

**Variante**: un insieme salvato di valori per una schermata di selezione, da riusare o da usare in un job in background. Lezione [68](../course/v2/0068-variants-and-background-jobs.it.md).
