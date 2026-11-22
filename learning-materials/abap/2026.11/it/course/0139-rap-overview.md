---
title: Il RESTful Application Programming Model
description: L'architettura di RAP e gli oggetti che compongono un'app RAP.
---

_Livello pro_

L'**ABAP RESTful Application Programming Model** (**RAP**) è il modello di SAP per costruire app transazionali e API in ABAP moderno: app Fiori che creano, modificano e cancellano dati, e servizi OData che altri sistemi chiamano. È il modo standard di sviluppare in S/4HANA e l'unico in ABAP Cloud.

RAP mette insieme quello che hai visto finora: le CDS per il modello di dati, le classi ABAP per la logica di business e OData per il servizio. Questa lezione ti dà la mappa. Le successive costruiscono un'app completa per i viaggi, un pezzo alla volta.

## Perché RAP

Con [SAP Gateway e SEGW](./0128-odata-with-sap-gateway.md) scrivi da solo l'infrastruttura OData: un metodo per ogni entità e operazione, i tuoi blocchi, il tuo buffer, la tua logica di salvataggio. RAP ti dà un framework che fa questo lavoro:

- il **data model** si definisce una volta sola, in CDS;
- il **comportamento** (che cosa puoi fare con i dati) si dichiara, non si programma;
- nello scenario **managed**, il framework crea, aggiorna, cancella, blocca e salva per te;
- tu scrivi solo la logica di business: controlli, valori derivati e azioni.

> [!TIP]
> RAP è come la cucina ben attrezzata di una catena di ristoranti. Forni, frigoriferi e lavastoviglie sono già installati e funzionano ovunque allo stesso modo (il framework). Lo chef decide solo le ricette (la logica di business), e ogni ristorante serve i piatti nello stesso modo (OData).

## I livelli di un'app RAP

| Livello                 | Oggetti                                                                    | Che cosa fa                                                                   |
| ----------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Data model              | tabelle di database, CDS view entity (root e child)                        | la struttura del business object e le sue relazioni                           |
| Comportamento           | behavior definition, behavior pool (classe ABAP)                           | operazioni, controlli sui campi, blocchi, validazioni, determinazioni, azioni |
| Proiezione del servizio | viste di proiezione, behavior definition di proiezione, metadata extension | la parte del business object che usa un'app o un'API, e le sue annotazioni UI |
| Servizio di business    | service definition, service binding                                        | quali entità sono esposte, con quale protocollo (OData V2 o V4, UI o Web API) |
| Consumo                 | app Fiori elements, client di Web API, EML in ABAP                         | gli utenti e i programmi che chiamano il servizio                             |

Un **business object** (BO) è il data model più il suo comportamento: un albero di entità con una **entità root** (per esempio il viaggio) e **entità child** (le sue prenotazioni), gestite come un'unica unità per i blocchi e il salvataggio.

## Gli oggetti che creerai

Per l'app dei viaggi delle prossime lezioni, l'elenco è questo:

| Oggetto                        | Nome                          | Lezione                                                                                  |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------- |
| Tabelle di database            | `ZTRAVEL`, `ZBOOKING`         | [il data model RAP](./0140-rap-data-model.md)                                            |
| View entity root e child       | `ZR_Travel`, `ZR_Booking`     | [il data model RAP](./0140-rap-data-model.md)                                            |
| Behavior definition            | `ZR_Travel`                   | [la behavior definition](./0141-rap-behavior-definition.md)                              |
| Behavior pool                  | `ZBP_R_TRAVEL`                | [validazioni, determinazioni e azioni](./0142-rap-validations-determinations-actions.md) |
| Viste e behavior di proiezione | `ZC_Travel`, `ZC_Booking`     | [proiezioni e servizi](./0144-rap-business-services.md)                                  |
| Service definition e binding   | `ZUI_TRAVEL`, `ZUI_TRAVEL_O4` | [proiezioni e servizi](./0144-rap-business-services.md)                                  |
| Metadata extension             | `ZC_Travel`, `ZC_Booking`     | [app Fiori elements](./0145-rap-fiori-elements.md)                                       |

I rilasci recenti hanno un wizard che genera tutti questi oggetti a partire da una tabella di database (clic destro sulla tabella in ADT, **Generate ABAP Repository Objects**). Costruisci gli oggetti a mano almeno una volta, così sai che cosa fa il wizard.

## Tipi di implementazione

| Tipo                                    | Chi esegue create, update, delete e salvataggio | Uso tipico                                                             |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Managed                                 | il framework RAP, sulle tabelle che indichi     | app nuove su tabelle nuove                                             |
| Managed con additional o unmanaged save | il framework, con il tuo codice di salvataggio  | scrivere documenti di modifica o chiamare API esistenti al salvataggio |
| Unmanaged                               | il tuo codice, per ogni operazione              | incapsulare logica esistente, come BAPI o moduli funzione              |

Entrambi i tipi possono aggiungere il **draft**, così gli utenti possono salvare un lavoro incompleto (vedi [la gestione delle bozze](./0146-rap-draft.md)). Gli scenari unmanaged sono in [scenari unmanaged e additional save](./0147-rap-unmanaged-and-save.md).

## Come gira una richiesta

Ogni modifica a un business object passa per due fasi:

1. **Fase di interazione**: le richieste (create, update, azioni) modificano il **buffer transazionale**, una copia in memoria delle istanze. Qui girano le determinazioni on modify, e nel database non arriva ancora niente.
2. **Sequenza di salvataggio**: quando la richiesta viene confermata, il framework esegue le validazioni e le determinazioni on save, e solo se va tutto bene scrive il buffer nel database, tutto in una volta.

Se una validazione fallisce, non si salva niente, e i messaggi tornano a chi ha chiamato. Le stesse fasi valgono quando il codice ABAP chiama il business object con l'[Entity Manipulation Language](./0143-eml.md).

> [!WARNING]
> Dentro RAP non scrivi mai `COMMIT WORK`, `ROLLBACK WORK` o istruzioni `INSERT`/`UPDATE` dirette sulle tabelle del business object durante la fase di interazione. La transazione la controlla il framework; violare questa regola provoca dump o dati incoerenti.

## Esercizio

> [!IMPORTANT]
>
> 1. Se il tuo sistema ha l'ABAP flight reference scenario, apri il pacchetto `/DMO/FLIGHT_MANAGED` in ADT.
> 2. Trova un oggetto per ogni livello: una view entity root, una behavior definition, un behavior pool, una vista di proiezione, una service definition e un service binding.
> 3. Apri il service binding e avvia l'anteprima dell'entità dei viaggi.

### Soluzione

Nel pacchetto, le data definition sono sotto **Core Data Services > Data Definitions**, le behavior definition sotto **Behavior Definitions**, i behavior pool sotto **Source Code Library > Classes** (nomi che iniziano con `/DMO/BP_`) e i servizi sotto **Business Services**. Nel service binding seleziona l'entità e scegli **Preview** per aprire un'app Fiori elements nel browser.

> [!NOTE]
>
> - RAP è il modello per le app Fiori transazionali e le API in S/4HANA e ABAP Cloud.
> - Livelli: data model (CDS), comportamento (behavior definition e pool), proiezione, service definition, service binding.
> - Un business object è un albero di entità con una root, bloccato e salvato come un'unica unità.
> - RAP managed gestisce le operazioni standard; tu scrivi validazioni, determinazioni e azioni.
> - Le modifiche vanno prima nel buffer transazionale; la sequenza di salvataggio le controlla e le scrive tutte insieme.
