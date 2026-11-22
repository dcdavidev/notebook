---
title: Il Dizionario ABAP
description: Domini, elementi dati, tabelle, viste, aiuti di ricerca e blocchi.
---

**Aiuto di ricerca**: l'oggetto del Dizionario che propone all'utente i valori possibili di un campo (il tasto F4). Lezione [50](../course/v2/0050-search-helps.it.md).

**Chiave esterna**: il legame fra un campo di una tabella e la chiave di una tabella di controllo, che il Dizionario usa per verificare i valori inseriti. Lezione [47](../course/v2/0047-foreign-keys-and-check-tables.it.md).

**Dizionario ABAP (DDIC)**: il repository centrale delle definizioni di dati condivise: domini, elementi dati, tabelle, strutture, viste (transazione SE11). Lezione [43](../course/v2/0043-abap-dictionary-intro.it.md).

**Dominio**: l'oggetto del Dizionario che definisce le caratteristiche tecniche di un campo: tipo, lunghezza, valori ammessi. Lezione [44](../course/v2/0044-domains.it.md).

**Elemento dati**: l'oggetto del Dizionario che dà significato a un campo: rimanda a un dominio e contiene le etichette e la documentazione. Lezione [45](../course/v2/0045-data-elements.it.md).

**Manutenzione tabelle**: la schermata generata per inserire e modificare a mano i dati di una tabella, aperta con SM30. Lezione [49](../course/v2/0049-views-and-table-maintenance.it.md).

**Oggetto di blocco**: l'oggetto del Dizionario che genera i moduli `ENQUEUE_*` e `DEQUEUE_*` per impedire che due utenti modifichino gli stessi dati insieme. Lezione [51](../course/v2/0051-lock-objects.it.md).

**Tabella del database**: una tabella definita nel Dizionario e creata nel database (tabella trasparente), con campi, chiave e impostazioni tecniche. Lezione [46](../course/v2/0046-database-tables.it.md).

**Tabella di controllo**: la tabella che contiene i valori ammessi per un campo, collegata con una chiave esterna. Lezione [47](../course/v2/0047-foreign-keys-and-check-tables.it.md).

**Tipo tabella**: l'oggetto del Dizionario, o la dichiarazione `TYPES ... TABLE OF`, che descrive una tabella interna: tipo di riga, categoria e chiave. Lezione [48](../course/v2/0048-ddic-structures-and-table-types.it.md).

**Vista**: nel Dizionario, una vista combina campi di più tabelle (vista di database) o serve a mantenerli (vista di manutenzione); oggi si usano le viste CDS. Lezione [49](../course/v2/0049-views-and-table-maintenance.it.md).
