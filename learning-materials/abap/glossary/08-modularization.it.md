---
title: Modularizzazione, programmi e file
description: Include, subroutine, moduli funzione, BAPI, memoria e file.
---

**BAPI (Business API)**: un modulo funzione remoto e stabile che espone un'operazione di business, per esempio creare un ordine. Lezione [71](../course/v2/0071-bapis.it.md).

**Gruppo funzioni**: il programma che raccoglie moduli funzione correlati e i loro dati globali (transazione SE80 o SE37). Lezione [70](../course/v2/0070-function-modules.it.md).

**Include**: un programma che contiene un pezzo di codice inserito in altri programmi con `INCLUDE`; nel Dizionario, anche una struttura inclusa in un'altra. Lezioni [32](../course/v2/0032-nested-structures.it.md), [69](../course/v2/0069-includes-and-subroutines.it.md).

**Memoria ABAP, memoria SAP**: le aree per passare dati fra programmi: la memoria ABAP (`EXPORT`/`IMPORT ... MEMORY`) dentro una sessione, la memoria SAP (`SET`/`GET PARAMETER`) per tutto il logon. Lezione [72](../course/v2/0072-calling-programs-and-memory.it.md).

**Modulo funzione**: una procedura globale e riutilizzabile, con interfaccia ed eccezioni, che si chiama con `CALL FUNCTION`. Lezione [70](../course/v2/0070-function-modules.it.md).

**Subroutine**: il vecchio modo di modularizzare il codice con `FORM` e `PERFORM`; oggi si usano i metodi. Lezione [69](../course/v2/0069-includes-and-subroutines.it.md).
