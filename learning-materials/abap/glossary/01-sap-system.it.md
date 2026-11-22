---
title: Il sistema SAP e gli strumenti
description: Architettura, landscape, mandanti, SAP GUI, ADT, pacchetti e trasporti.
---

**ABAP**: il linguaggio di programmazione dei sistemi SAP: gira sull'application server ed è il linguaggio con cui si scrivono report, interfacce, estensioni e servizi. Lezione [2](../course/v2/0002-what-is-abap.it.md).

**ABAP Development Tools (ADT)**: l'ambiente di sviluppo per ABAP basato su Eclipse; è l'unico strumento per CDS, RAP e ABAP Cloud. Lezione [6](../course/v2/0006-abap-development-tools.it.md).

**Application server**: il livello del sistema SAP che esegue i programmi ABAP, fra il SAP GUI e il database; ha anche un proprio file system. Lezioni [3](../course/v2/0003-sap-system-architecture.it.md), [74](../course/v2/0074-files-on-the-application-server.it.md).

**Landscape di sistema**: l'insieme dei sistemi SAP di un'azienda, di solito sviluppo, qualità e produzione, collegati dai trasporti. Lezione [4](../course/v2/0004-system-landscape-and-clients.it.md).

**Mandante**: un'unità indipendente dentro un sistema SAP, con i propri dati e utenti; è il primo campo (`MANDT`) di quasi ogni tabella. Lezione [4](../course/v2/0004-system-landscape-and-clients.it.md).

**Pacchetto**: il contenitore che raggruppa gli oggetti di sviluppo e ne stabilisce il trasporto e la visibilità. Lezione [7](../course/v2/0007-packages-and-transport-requests.it.md).

**Richiesta di trasporto**: il contenitore che registra le modifiche agli oggetti e le porta dal sistema di sviluppo a quelli di qualità e produzione. Lezione [7](../course/v2/0007-packages-and-transport-requests.it.md).

**SAP**: l'azienda tedesca che produce i software gestionali ERP, come SAP ECC e SAP S/4HANA, con cui lavorano molte imprese. Lezione [1](../course/v2/0001-what-is-sap.it.md).

**SAP GUI**: il programma installato sul PC con cui l'utente si collega al sistema SAP e usa le transazioni. Lezione [5](../course/v2/0005-sap-gui-and-transaction-codes.it.md).

**Transazione**: un codice (per esempio SE38 o VA01) che apre direttamente un programma o una funzione del sistema SAP. Lezione [5](../course/v2/0005-sap-gui-and-transaction-codes.it.md).

**Work process**: un processo dell'application server che esegue le richieste degli utenti: dialog, background, update, enqueue, spool. Lezione [3](../course/v2/0003-sap-system-architecture.it.md).
