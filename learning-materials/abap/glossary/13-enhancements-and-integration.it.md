---
title: Estensioni e integrazione
description: Estendere lo standard SAP e scambiare dati con altri sistemi.
---

**ALE (Application Link Enabling)**: la tecnologia per lo scambio asincrono di dati fra sistemi SAP, di solito tramite IDoc. Lezione [125](../course/v2/0125-idoc-and-ale.it.md).

**BAdI (Business Add-In)**: un punto di estensione a oggetti previsto da SAP: si implementa un'interfaccia per aggiungere logica allo standard senza modificarlo. Lezione [122](../course/v2/0122-badis.it.md).

**Batch input**: la tecnica che carica dati simulando l'inserimento a mano nelle schermate di una transazione (`CALL TRANSACTION`, SM35). Lezione [130](../course/v2/0130-batch-input.it.md).

**Customer exit**: un vecchio punto di estensione previsto da SAP (moduli funzione `EXIT_*`, gestiti con CMOD e SMOD). Lezione [121](../course/v2/0121-user-exits-and-customer-exits.it.md).

**Enhancement**: un'estensione del codice standard SAP senza modificarlo: implicita (all'inizio o alla fine di blocchi) o esplicita (enhancement point e section). Lezioni [120](../course/v2/0120-extending-standard-sap.it.md), [123](../course/v2/0123-enhancement-points.it.md).

**Form (Smart Forms, Adobe Forms)**: i moduli di stampa per documenti come fatture e ordini, progettati con Smart Forms o con Adobe Forms. Lezione [129](../course/v2/0129-forms.it.md).

**HTTP client**: le classi che chiamano servizi web esterni via HTTP, per esempio API REST. Lezione [126](../course/v2/0126-http-and-rest.it.md).

**IDoc (Intermediate Document)**: il formato standard SAP per scambiare documenti di business fra sistemi, usato con ALE ed EDI. Lezione [125](../course/v2/0125-idoc-and-ale.it.md).

**JSON**: il formato testuale per lo scambio di dati via web, che in ABAP si genera e si legge con `/UI2/CL_JSON` o con le trasformazioni. Lezione [127](../course/v2/0127-json-and-xml.it.md).

**OData**: il protocollo REST con cui le app SAP Fiori leggono e scrivono i dati; in ABAP si espone con SAP Gateway o con RAP. Lezioni [128](../course/v2/0128-odata-with-sap-gateway.it.md), [144](../course/v2/0144-rap-business-services.it.md).

**REST**: lo stile architetturale dei servizi web basato su risorse e metodi HTTP (`GET`, `POST`, `PUT`, `DELETE`). Lezione [126](../course/v2/0126-http-and-rest.it.md).

**RFC (Remote Function Call)**: la chiamata di un modulo funzione su un altro sistema, sincrona o asincrona, attraverso una destinazione (SM59). Lezione [124](../course/v2/0124-rfc.it.md).

**SAP Gateway**: il componente che espone dati e logica ABAP come servizi OData (transazione SEGW). Lezione [128](../course/v2/0128-odata-with-sap-gateway.it.md).

**User exit**: un vecchio punto di estensione: una subroutine vuota nel codice standard (spesso `USEREXIT_*`) in cui il cliente aggiunge il proprio codice. Lezione [121](../course/v2/0121-user-exits-and-customer-exits.it.md).

**XML**: il formato di markup per lo scambio di dati, che in ABAP si legge e si genera con `CALL TRANSFORMATION` e le librerie iXML. Lezione [127](../course/v2/0127-json-and-xml.it.md).
