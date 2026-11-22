---
title: Constructor expression
description: Constructor expression, VALUE, NEW, CONV, CORRESPONDING, FILTER, FOR, REDUCE.
---

## Constructor expression

Un'espressione che crea un valore sul posto: `VALUE`, `NEW`, `CONV`, `CAST`, `REF`, `EXACT`, `COND`, `SWITCH`, `REDUCE`, `FILTER`, `CORRESPONDING`. Lezione [91](../course/0091-constructor-expressions.md).

## `VALUE`

L'espressione costruttore che crea strutture e tabelle interne con i loro valori in una sola istruzione. Lezione [91](../course/0091-constructor-expressions.md).

## `NEW`

L'espressione costruttore che crea un oggetto o un dato anonimo e ne restituisce il riferimento: `NEW zcl_flight( )`. Lezione [91](../course/0091-constructor-expressions.md).

## `CONV`

L'espressione costruttore che converte un valore in un altro tipo sul posto, per esempio per passarlo a un parametro. Lezione [91](../course/0091-constructor-expressions.md).

## `CORRESPONDING`

L'espressione che copia i componenti con lo stesso nome da una struttura o tabella a un'altra, con eventuali mappature. Lezione [94](../course/0094-filter-and-corresponding.md).

## `FILTER`

L'espressione che restituisce le righe di una tabella interna che soddisfano una condizione sulla chiave. Lezione [94](../course/0094-filter-and-corresponding.md).

## `FOR`

L'espressione di iterazione usata dentro `VALUE` e `REDUCE` per costruire una tabella o un valore scorrendo un'altra tabella. Lezione [93](../course/0093-for-and-reduce.md).

## `REDUCE`

L'espressione che calcola un solo valore, per esempio una somma, scorrendo una tabella con `FOR`. Lezione [93](../course/0093-for-and-reduce.md).
