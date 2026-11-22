---
title: SAP HANA e CDS
description: Code pushdown, viste CDS e AMDP.
---

**ABAP Managed Database Procedure (AMDP)**: un metodo ABAP il cui codice è scritto in SQLScript ed eseguito direttamente nel database SAP HANA. Lezione [137](../course/v2/0137-amdp.it.md).

**Annotazione CDS**: un metadato scritto con `@` in una vista CDS che ne descrive il comportamento: etichette, UI di Fiori, autorizzazioni, ricerca. Lezione [134](../course/v2/0134-cds-annotations.it.md).

**Associazione CDS**: una relazione dichiarata fra entità CDS che diventa un join solo quando la si usa (_path expression_). Lezione [133](../course/v2/0133-cds-associations.it.md).

**CDS (Core Data Services)**: il linguaggio per definire modelli di dati semantici nel database: viste, associazioni, annotazioni e controllo accessi. Lezione [132](../course/v2/0132-cds-view-entities.it.md).

**CDS table function**: un'entità CDS i cui dati vengono calcolati da un metodo AMDP. Lezione [138](../course/v2/0138-cds-table-functions.it.md).

**CDS view entity**: la forma attuale di vista CDS (`DEFINE VIEW ENTITY`): una `SELECT` salvata nel database con annotazioni e associazioni. Lezione [132](../course/v2/0132-cds-view-entities.it.md).

**Code pushdown**: spostare i calcoli sui dati dal server ABAP al database (con ABAP SQL, CDS e AMDP) per sfruttare la velocità di SAP HANA. Lezione [131](../course/v2/0131-code-pushdown.it.md).

**Controllo accessi CDS (DCL)**: le regole, scritte in un _access control_, che limitano automaticamente le righe che un utente vede in una vista CDS. Lezione [136](../course/v2/0136-cds-access-control.it.md).

**SAP HANA**: il database in memoria di SAP, colonnare, su cui girano SAP S/4HANA e il code pushdown. Lezione [131](../course/v2/0131-code-pushdown.it.md).
