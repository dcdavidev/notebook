---
title: Programmazione a oggetti ed eccezioni
description: Classi, oggetti, ereditarietà, interfacce, eventi ed eccezioni.
---

**Attributo**: un dato che appartiene a una classe o a un oggetto, dichiarato con `DATA` o `CLASS-DATA`. Lezione [77](../course/v2/0077-attributes-and-methods.it.md).

**Casting**: l'assegnazione di un riferimento a una variabile di un altro tipo: _upcast_ verso la superclasse, _downcast_ (`CAST`, `?=`) verso la sottoclasse. Lezione [85](../course/v2/0085-polymorphism-and-casting.it.md).

**Classe**: il modello da cui si creano gli oggetti: definisce attributi, metodi ed eventi. Può essere locale (in un programma) o globale (nel repository). Lezioni [76](../course/v2/0076-classes-and-objects.it.md), [87](../course/v2/0087-global-classes.it.md).

**Classe astratta**: una classe dichiarata `ABSTRACT` che non si può istanziare: serve solo come superclasse. Lezione [83](../course/v2/0083-abstract-and-final.it.md).

**Classe di eccezione**: una classe che eredita da `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK` o `CX_NO_CHECK` e rappresenta un errore; si lancia con `RAISE EXCEPTION`. Lezioni [89](../course/v2/0089-class-based-exceptions.it.md), [90](../course/v2/0090-custom-exception-classes.it.md).

**Classe final**: una classe dichiarata `FINAL` da cui non si può ereditare. Lezione [83](../course/v2/0083-abstract-and-final.it.md).

**Componente statico**: un attributo o metodo di classe (`CLASS-DATA`, `CLASS-METHODS`) condiviso da tutte le istanze, che si usa senza creare un oggetto. Lezione [81](../course/v2/0081-static-components.it.md).

**Costruttore**: il metodo eseguito automaticamente alla creazione di un oggetto (`constructor`) o al primo uso della classe (`class_constructor`). Lezione [79](../course/v2/0079-constructors.it.md).

**Design pattern**: una soluzione collaudata a un problema ricorrente di progettazione: singleton, factory, strategy, observer e altri. Lezione [88](../course/v2/0088-design-patterns.it.md).

**Eccezione**: una situazione di errore che interrompe il flusso normale e si gestisce con `TRY ... CATCH ... ENDTRY`. Lezione [89](../course/v2/0089-class-based-exceptions.it.md).

**Ereditarietà**: il meccanismo con cui una sottoclasse riceve attributi e metodi da una superclasse (`INHERITING FROM`) e può ridefinirli (`REDEFINITION`). Lezione [82](../course/v2/0082-inheritance.it.md).

**Evento (oggetti)**: un segnale che un oggetto lancia con `RAISE EVENT` e a cui altri oggetti rispondono con metodi gestori registrati con `SET HANDLER`. Lezione [86](../course/v2/0086-events.it.md).

**Incapsulamento**: nascondere i dettagli interni di una classe dietro sezioni `PRIVATE` e `PROTECTED`, esponendo solo un'interfaccia `PUBLIC`. Lezione [80](../course/v2/0080-visibility-and-encapsulation.it.md).

**Interfaccia**: un insieme di metodi senza implementazione che più classi possono implementare (`INTERFACES`), garantendo lo stesso comportamento. Lezione [84](../course/v2/0084-interfaces.it.md).

**Istanza**: un oggetto concreto creato da una classe con `NEW` o `CREATE OBJECT`. Nell'architettura, anche un application server con i suoi work process. Lezioni [3](../course/v2/0003-sap-system-architecture.it.md), [76](../course/v2/0076-classes-and-objects.it.md).

**Metodo**: una procedura che appartiene a una classe e lavora sui suoi attributi; si dichiara con `METHODS` e si implementa fra `METHOD` ed `ENDMETHOD`. Lezione [77](../course/v2/0077-attributes-and-methods.it.md).

**Oggetto**: un'istanza di una classe, con i propri valori degli attributi, raggiungibile attraverso una variabile di riferimento. Lezione [76](../course/v2/0076-classes-and-objects.it.md).

**Parametro di metodo**: un dato scambiato con un metodo: `IMPORTING`, `EXPORTING`, `CHANGING` o `RETURNING`. Lezione [78](../course/v2/0078-method-parameters.it.md).

**Polimorfismo**: la capacità di chiamare lo stesso metodo su oggetti di classi diverse e ottenere il comportamento di ciascuna. Lezione [85](../course/v2/0085-polymorphism-and-casting.it.md).

**Visibilità**: le sezioni `PUBLIC`, `PROTECTED` e `PRIVATE` di una classe, che decidono chi può usare ogni componente. Lezione [80](../course/v2/0080-visibility-and-encapsulation.it.md).
