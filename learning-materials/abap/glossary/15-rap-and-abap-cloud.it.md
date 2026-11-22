---
title: RAP, ABAP Cloud e oltre
description: Il RESTful Application Programming Model, ABAP Cloud e le tecniche avanzate.
---

**ABAP channel**: il meccanismo per la comunicazione basata su eventi: _ABAP Messaging Channels_ (AMC) fra sessioni e _ABAP Push Channels_ (APC) verso il browser con WebSocket. Lezione [150](../course/v2/0150-abap-channels.it.md).

**ABAP Cloud**: il modello di sviluppo che usa solo API rilasciate e la versione ristretta del linguaggio, per estensioni compatibili con gli aggiornamenti e con il _clean core_. Lezione [148](../course/v2/0148-abap-cloud.it.md).

**abapGit**: un client Git open source scritto in ABAP, per mettere gli oggetti di sviluppo sotto controllo di versione. Lezione [151](../course/v2/0151-abapgit.it.md).

**Azione (RAP)**: un'operazione non standard di un business object RAP, per esempio "Approva", implementata nella behavior implementation. Lezione [142](../course/v2/0142-rap-validations-determinations-actions.it.md).

**Behavior definition**: l'oggetto RAP che dichiara che cosa può fare un business object: operazioni, campi, validazioni, determinazioni, azioni, bozze. Lezione [141](../course/v2/0141-rap-behavior-definition.it.md).

**Behavior pool**: la classe globale che contiene la behavior implementation di un business object RAP. Lezione [141](../course/v2/0141-rap-behavior-definition.it.md).

**Bozza (draft)**: in RAP, una copia di lavoro dei dati che l'utente modifica e salva più tardi, senza perderla se chiude l'app. Lezione [146](../course/v2/0146-rap-draft.it.md).

**Business object (RAP)**: un'entità di business (o un albero di entità) con dati, comportamento e servizi, costruita con RAP. Lezione [139](../course/v2/0139-rap-overview.it.md).

**Clean core**: il principio per cui le estensioni non modificano lo standard SAP e usano solo interfacce rilasciate, così gli aggiornamenti restano semplici. Lezione [148](../course/v2/0148-abap-cloud.it.md).

**Data model RAP**: le viste CDS che descrivono le entità di un business object RAP e le loro relazioni padre-figlio (_composition_). Lezione [140](../course/v2/0140-rap-data-model.it.md).

**Determinazione**: in RAP, una logica che calcola automaticamente il valore di alcuni campi quando i dati cambiano. Lezione [142](../course/v2/0142-rap-validations-determinations-actions.it.md).

**EML (Entity Manipulation Language)**: la parte del linguaggio ABAP che legge e modifica i business object RAP: `READ ENTITIES`, `MODIFY ENTITIES`, `COMMIT ENTITIES`. Lezione [143](../course/v2/0143-eml.it.md).

**Fiori elements**: il framework di SAP Fiori che genera le app (liste, pagine oggetto) a partire da un servizio OData e dalle annotazioni. Lezione [145](../course/v2/0145-rap-fiori-elements.it.md).

**Proiezione (RAP)**: lo strato di viste CDS e di behavior sopra il data model che decide che cosa espone un servizio specifico. Lezione [144](../course/v2/0144-rap-business-services.it.md).

**RAP (RESTful Application Programming Model)**: il modello di programmazione moderno di SAP per costruire servizi OData e app Fiori con CDS, behavior definition ed EML. Lezione [139](../course/v2/0139-rap-overview.it.md).

**Service binding**: l'oggetto RAP che pubblica una service definition con un protocollo, per esempio OData V2 o V4, per UI o per API. Lezione [144](../course/v2/0144-rap-business-services.it.md).

**Service definition**: l'oggetto RAP che elenca le entità CDS esposte da un servizio. Lezione [144](../course/v2/0144-rap-business-services.it.md).

**Shared object**: un oggetto conservato nella memoria condivisa dell'application server e letto da più programmi e utenti. Lezione [149](../course/v2/0149-shared-objects.it.md).

**Unmanaged (RAP)**: lo scenario RAP in cui scrivi tu la logica di salvataggio, di solito per riusare codice esistente; con _additional save_ aggiungi logica a uno scenario managed. Lezione [147](../course/v2/0147-rap-unmanaged-and-save.it.md).

**Validazione**: in RAP, un controllo sui dati che blocca il salvataggio e restituisce un messaggio se i valori non sono validi. Lezione [142](../course/v2/0142-rap-validations-determinations-actions.it.md).
