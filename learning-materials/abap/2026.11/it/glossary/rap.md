---
title: RAP
description: RAP (RESTful Application Programming Model), Business object, RAP data model, Projection, Managed scenario, Unmanaged scenario, Late numbering.
---

## RAP (RESTful Application Programming Model)

Il modello di programmazione moderno di SAP per costruire servizi OData e app Fiori con CDS, behavior definition ed EML. Lezione [139](../course/0139-rap-overview.md).

## Business object

Un'entità di business (o un albero di entità) con dati, comportamento e servizi, costruita con RAP. Lezione [139](../course/0139-rap-overview.md).

## RAP data model

Le viste CDS che descrivono le entità di un business object RAP e le loro relazioni padre-figlio (_composition_). Lezione [140](../course/0140-rap-data-model.md).

## Projection

Lo strato di viste CDS e di behavior sopra il data model che decide che cosa espone un servizio specifico. Lezione [144](../course/0144-rap-business-services.md).

## Managed scenario

Lo scenario RAP in cui il framework legge e salva i dati da solo; tu scrivi solo la logica di business. Lezioni [139](../course/0139-rap-overview.md), [140](../course/0140-rap-data-model.md).

## Unmanaged scenario

Lo scenario RAP in cui scrivi tu la logica di salvataggio, di solito per riusare codice esistente; con _additional save_ aggiungi logica a uno scenario managed. Lezione [147](../course/0147-rap-unmanaged-and-save.md).

## Late numbering

In RAP, l'assegnazione della chiave definitiva di una nuova istanza solo al salvataggio, per esempio da un intervallo di numerazione. Lezione [147](../course/0147-rap-unmanaged-and-save.md).
