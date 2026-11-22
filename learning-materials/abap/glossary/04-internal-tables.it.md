---
title: Strutture e tabelle interne
description: Strutture, tabelle interne, chiavi, field symbol e riferimenti.
---

**Chiave primaria**: l'insieme dei campi che identifica in modo univoco una riga, di una tabella del database o di una tabella interna. Lezioni [35](../course/v2/0035-table-keys.it.md), [46](../course/v2/0046-database-tables.it.md).

**Chiave secondaria**: una chiave aggiuntiva di una tabella interna, ordinata o hashed, per leggere velocemente con criteri diversi dalla chiave primaria. Lezione [35](../course/v2/0035-table-keys.it.md).

**Field symbol**: un segnaposto (`<fs>`) che punta a un dato esistente, per esempio una riga di tabella interna, e permette di modificarlo senza copiarlo. Lezione [41](../course/v2/0041-field-symbols.it.md).

**Riferimento ai dati**: una variabile `REF TO` che contiene l'indirizzo di un dato e si dereferenzia con `->*`. Lezione [42](../course/v2/0042-data-references.it.md).

**Struttura**: un dato composto da più campi (componenti) di tipi diversi, come una riga di tabella. Lezioni [31](../course/v2/0031-structures.it.md), [48](../course/v2/0048-ddic-structures-and-table-types.it.md).

**Struttura annidata**: una struttura che contiene altre strutture o tabelle come componenti. Lezione [32](../course/v2/0032-nested-structures.it.md).

**Tabella hashed**: una tabella interna con chiave univoca e accesso tramite funzione di hash: il tempo di lettura non dipende dal numero di righe. Lezione [34](../course/v2/0034-table-categories.it.md).

**Tabella interna**: una tabella in memoria che contiene un elenco di righe dello stesso tipo, per elaborare dati durante l'esecuzione. Lezione [33](../course/v2/0033-internal-tables-intro.it.md).

**Tabella sorted**: una tabella interna sempre ordinata per chiave, con ricerca binaria automatica. Lezione [34](../course/v2/0034-table-categories.it.md).

**Tabella standard**: il tipo più comune di tabella interna: righe in ordine di inserimento e accesso per indice o con ricerca lineare. Lezione [34](../course/v2/0034-table-categories.it.md).
