---
title: CDS
description: CDS (Core Data Services), CDS view entity, CDS association, Path expression, CDS annotation, CDS access control (DCL), CDS table function.
---

## CDS (Core Data Services)

Il linguaggio per definire modelli di dati semantici nel database: viste, associazioni, annotazioni e controllo accessi. Lezione [132](../course/0132-cds-view-entities.md).

## CDS view entity

La forma attuale di vista CDS (`DEFINE VIEW ENTITY`): una `SELECT` salvata nel database con annotazioni e associazioni. Lezione [132](../course/0132-cds-view-entities.md).

## CDS association

Una relazione dichiarata fra entità CDS che diventa un join solo quando la si usa (_path expression_). Lezione [133](../course/0133-cds-associations.md).

## Path expression

Il modo di seguire un'associazione CDS con la notazione a punto o a barra, per esempio `_Carrier.Name`: il join si crea solo in quel momento. Lezione [133](../course/0133-cds-associations.md).

## CDS annotation

Un metadato scritto con `@` in una vista CDS che ne descrive il comportamento: etichette, UI di Fiori, autorizzazioni, ricerca. Lezione [134](../course/0134-cds-annotations.md).

## CDS access control (DCL)

Le regole, scritte in un _access control_, che limitano automaticamente le righe che un utente vede in una vista CDS. Lezione [136](../course/0136-cds-access-control.md).

## CDS table function

Un'entità CDS i cui dati vengono calcolati da un metodo AMDP. Lezione [138](../course/0138-cds-table-functions.md).
