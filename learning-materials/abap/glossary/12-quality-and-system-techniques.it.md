---
title: Test, qualità e tecniche di sistema
description: Test, controlli sul codice, autorizzazioni, log, aggiornamenti e programmazione dinamica.
---

**ABAP Unit**: il framework per i test unitari automatici: classi di test locali con `FOR TESTING` e asserzioni di `CL_ABAP_UNIT_ASSERT`. Lezione [105](../course/v2/0105-abap-unit-basics.it.md).

**ATC (ABAP Test Cockpit)**: lo strumento che esegue i controlli statici sul codice: errori, prestazioni, sicurezza e regole di stile. Lezione [107](../course/v2/0107-code-quality.it.md).

**Autorizzazione**: il permesso di un utente su un oggetto di autorizzazione; il codice lo verifica con `AUTHORITY-CHECK`. Lezione [110](../course/v2/0110-authorization-checks.it.md).

**Clean ABAP**: la guida di stile di SAP per scrivere codice ABAP leggibile e manutenibile, ispirata a _Clean Code_. Lezione [107](../course/v2/0107-code-quality.it.md).

**Dependency injection**: passare a una classe gli oggetti da cui dipende invece di farglieli creare, così nei test si possono sostituire con dei _test double_. Lezione [106](../course/v2/0106-test-doubles.it.md).

**Documento di modifica**: la registrazione di chi ha cambiato quali campi di un oggetto di business, quando, e con quali valori vecchi e nuovi. Lezione [118](../course/v2/0118-change-documents.it.md).

**Elaborazione parallela**: l'esecuzione di parti di un lavoro in più processi contemporaneamente, con RFC asincrone o job in background. Lezione [114](../course/v2/0114-parallel-processing.it.md).

**Intervallo di numerazione**: l'oggetto che distribuisce numeri progressivi univoci, per esempio per i numeri dei documenti (transazione SNRO). Lezione [111](../course/v2/0111-number-ranges.it.md).

**Log applicativo**: il registro standard dei messaggi di un'elaborazione, salvato nel database e consultabile con SLG1. Lezione [112](../course/v2/0112-application-log.it.md).

**Modulo funzione di aggiornamento**: un modulo funzione chiamato `IN UPDATE TASK`, che scrive nel database solo al `COMMIT WORK`, in un processo separato. Lezione [113](../course/v2/0113-update-task.it.md).

**RTTS (Runtime Type Services)**: le classi che descrivono un tipo a runtime (RTTI) e ne creano di nuovi (RTTC), come `CL_ABAP_TYPEDESCR`. Lezione [115](../course/v2/0115-rtts.it.md).

**SQL dinamico**: una `SELECT` in cui tabella, campi o condizioni sono stringhe decise a runtime. Lezione [117](../course/v2/0117-dynamic-sql-and-calls.it.md).

**Test double**: un oggetto finto che prende il posto di una dipendenza reale (database, API) durante un test. Lezione [106](../course/v2/0106-test-doubles.it.md).
