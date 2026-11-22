---
title: Internal table
description: Internal table, Standard table, Sorted table, Hashed table, Table type, Work area.
---

## Internal table

Una tabella in memoria che contiene un elenco di righe dello stesso tipo, per elaborare dati durante l'esecuzione. Lezione [33](../course/0033-internal-tables-intro.md).

## Standard table

Il tipo più comune di tabella interna: righe in ordine di inserimento e accesso per indice o con ricerca lineare. Lezione [34](../course/0034-table-categories.md).

## Sorted table

Una tabella interna sempre ordinata per chiave, con ricerca binaria automatica. Lezione [34](../course/0034-table-categories.md).

## Hashed table

Una tabella interna con chiave univoca e accesso tramite funzione di hash: il tempo di lettura non dipende dal numero di righe. Lezione [34](../course/0034-table-categories.md).

## Table type

L'oggetto del Dizionario, o la dichiarazione `TYPES ... TABLE OF`, che descrive una tabella interna: tipo di riga, categoria e chiave. Lezione [48](../course/0048-ddic-structures-and-table-types.md).

## Work area

Una struttura con lo stesso tipo delle righe di una tabella interna, usata per leggere, inserire o modificare una riga alla volta. Lezioni [33](../course/0033-internal-tables-intro.md), [36](../course/0036-filling-internal-tables.md).
