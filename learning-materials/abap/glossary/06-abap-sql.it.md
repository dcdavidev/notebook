---
title: ABAP SQL e LUW
description: Leggere e scrivere il database, e salvare i dati in modo coerente.
---

**ABAP SQL**: il dialetto SQL integrato in ABAP (un tempo _Open SQL_): legge e scrive le tabelle del database in modo indipendente dal database sottostante. Lezioni [52](../course/v2/0052-select-basics.it.md), [97](../course/v2/0097-modern-abap-sql.it.md), [98](../course/v2/0098-advanced-abap-sql.it.md).

**Aggregato**: una funzione SQL che calcola un valore su un gruppo di righe: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Lezione [56](../course/v2/0056-aggregates-and-group-by.it.md).

**`COMMIT WORK`**: l'istruzione che chiude la LUW SAP: salva in modo definitivo le modifiche al database e avvia i moduli di aggiornamento. Lezione [60](../course/v2/0060-luw-commit-and-rollback.it.md).

**`FOR ALL ENTRIES`**: l'aggiunta di `SELECT` che legge le righe corrispondenti a ogni riga di una tabella interna; se la tabella è vuota legge tutto. Lezione [57](../course/v2/0057-for-all-entries.it.md).

**`GROUP BY`**: in SQL raggruppa le righe per calcolare aggregati; con `LOOP AT ... GROUP BY` raggruppa le righe di una tabella interna. Lezioni [56](../course/v2/0056-aggregates-and-group-by.it.md), [95](../course/v2/0095-grouping-internal-tables.it.md).

**`HAVING`**: la condizione SQL che filtra i gruppi dopo il `GROUP BY`, in base ai valori aggregati. Lezione [56](../course/v2/0056-aggregates-and-group-by.it.md).

**Join**: la combinazione in una sola `SELECT` delle righe di più tabelle collegate: `INNER JOIN`, `LEFT OUTER JOIN` e altri. Lezione [55](../course/v2/0055-joins.it.md).

**LUW (Logical Unit of Work)**: un gruppo di modifiche che viene salvato o annullato tutto insieme. Ci sono la LUW di database e la LUW SAP. Lezione [60](../course/v2/0060-luw-commit-and-rollback.it.md).

**`ORDER BY`**: la clausola SQL che ordina i risultati di una `SELECT`. Lezione [54](../course/v2/0054-where-and-order-by.it.md).

**`ROLLBACK WORK`**: l'istruzione che annulla tutte le modifiche della LUW SAP non ancora confermate. Lezione [60](../course/v2/0060-luw-commit-and-rollback.it.md).

**Scrittura sul database**: le istruzioni `INSERT`, `UPDATE`, `MODIFY` e `DELETE` che cambiano i dati delle tabelle del database. Lezione [59](../course/v2/0059-writing-to-the-database.it.md).

**`SELECT`**: l'istruzione ABAP SQL che legge dati dal database, in una tabella interna, in una struttura o riga per riga. Lezione [52](../course/v2/0052-select-basics.it.md).

**`SELECT SINGLE`**: la variante di `SELECT` che legge al massimo una riga, di solito con la chiave completa. Lezione [53](../course/v2/0053-select-single-and-up-to.it.md).

**Subquery**: una `SELECT` dentro un'altra `SELECT`, usata per esempio con `IN` o `EXISTS` nella condizione `WHERE`. Lezione [58](../course/v2/0058-subqueries-and-union.it.md).

**`UNION`**: l'operatore SQL che unisce in un solo risultato le righe di due `SELECT`. Lezione [58](../course/v2/0058-subqueries-and-union.it.md).

**`WHERE`**: la clausola che filtra le righe in una `SELECT`, in un `LOOP AT` o in un `DELETE`. Lezione [54](../course/v2/0054-where-and-order-by.it.md).
