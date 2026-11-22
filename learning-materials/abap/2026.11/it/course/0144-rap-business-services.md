---
title: Proiezioni, service definition e binding
description: Esporre un business object RAP come servizio OData.
---

_Livello pro_

Il business object dei viaggi ora ha un [data model](./0140-rap-data-model.md), un [comportamento](./0141-rap-behavior-definition.md) e una [logica di business](./0142-rap-validations-determinations-actions.md), ma nessuno fuori da ABAP può raggiungerlo. Altri tre livelli lo trasformano in un servizio OData: la **proiezione**, che sceglie che cosa una certa app può vedere e fare; la **service definition**, che elenca le entità esposte; e il **service binding**, che sceglie il protocollo e pubblica il servizio.

## Le viste di proiezione

Una **vista di proiezione** è una CDS view entity sopra il business object, scritta con `as projection on`. Può solo scegliere, rinominare e annotare elementi della vista base; non può unire nuove sorgenti. Così il business object resta l'unica fonte di verità, e ogni app riceve una vista su misura.

```abap
@EndUserText.label: 'Proiezione del viaggio'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
define root view entity ZC_Travel
  provider contract transactional_query
  as projection on ZR_Travel
{
  key TravelUUID,
      TravelID,
      CustomerID,
      _Customer.LastName as CustomerName,
      BeginDate,
      EndDate,
      TotalPrice,
      CurrencyCode,
      Description,
      OverallStatus,
      StatusCriticality,
      LocalLastChangedAt,
      _Booking : redirected to composition child ZC_Booking,
      _Customer
}
```

```abap
@EndUserText.label: 'Proiezione della prenotazione'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
define view entity ZC_Booking
  as projection on ZR_Booking
{
  key BookingUUID,
      ParentUUID,
      BookingID,
      CarrierID,
      ConnectionID,
      FlightDate,
      FlightPrice,
      CurrencyCode,
      LocalLastChangedAt,
      _Travel : redirected to parent ZC_Travel
}
```

- `provider contract transactional_query` dice che questa proiezione serve un servizio OData transazionale. In strict mode è obbligatorio per la proiezione della root.
- `redirected to composition child` e `redirected to parent` fanno puntare le composizioni alle proiezioni invece che alle viste base, così l'intero albero è esposto al livello di proiezione.
- `@Metadata.allowExtensions: true` ti permette di mettere le annotazioni UI in una metadata extension, come in [app Fiori elements](./0145-rap-fiori-elements.md).

> [!TIP]
> Il business object è il menu completo di un ristorante. Una proiezione è il menu del pranzo stampato per la terrazza: la stessa cucina e gli stessi piatti, ma solo alcuni, con nomi scelti per quei clienti.

## La behavior definition di proiezione

Anche la proiezione ha bisogno di una behavior definition, che stabilisce quali operazioni del comportamento base può usare questa app. Clic destro su `ZC_Travel` e scegli **New Behavior Definition**: ADT propone il tipo `projection`.

```abap
projection;
strict ( 2 );

define behavior for ZC_Travel alias Travel
use etag
{
  use create;
  use update;
  use delete;

  use action acceptTravel;

  use association _Booking { create; }
}

define behavior for ZC_Booking alias Booking
use etag
{
  use update;
  use delete;

  use association _Travel;
}
```

`use` può solo riutilizzare ciò che offre il comportamento base; non può aggiungere nuova logica. Per costruire un'app di sola lettura sullo stesso business object, scrivi un'altra proiezione senza `use create`, `use update` e `use delete`.

## La service definition

Una **service definition** elenca le entità che un servizio espone, con i nomi che vedranno i consumatori:

```abap
@EndUserText.label: 'Servizio dei viaggi'
define service ZUI_TRAVEL {
  expose ZC_Travel       as Travel;
  expose ZC_Booking      as Booking;
  expose /DMO/I_Customer as Customer;
}
```

Esponi ogni entità di cui l'app ha bisogno, comprese le destinazioni degli aiuti alla ricerca e delle associazioni come `/DMO/I_Customer`. Le entità non esposte per il consumatore semplicemente non esistono.

## Il service binding

Il **service binding** collega la service definition a un protocollo. In ADT, clic destro su `ZUI_TRAVEL` e scegli **New Service Binding**:

| Tipo di binding    | Quando usarlo                                  |
| ------------------ | ---------------------------------------------- |
| OData V4 - UI      | app Fiori elements (la scelta attuale)         |
| OData V2 - UI      | app Fiori che hanno ancora bisogno di OData V2 |
| OData V4 - Web API | API per altri sistemi, senza annotazioni UI    |
| OData V2 - Web API | API per sistemi che parlano solo OData V2      |

Chiama il binding `ZUI_TRAVEL_O4`, scegli **OData V4 - UI**, attivalo e premi **Publish**. ADT mostra poi l'URL del servizio e le entità esposte. Seleziona `Travel` e premi **Preview** per aprire un'app Fiori elements nel browser, dove puoi creare, modificare, cancellare e accettare viaggi.

> [!WARNING]
> Su un sistema on-premise, **Publish** registra il servizio in SAP Gateway, ed è una modifica che richiede autorizzazioni e, in alcuni landscape, una richiesta di trasporto apposita. Se il pulsante è disattivato o dà errore, chiedi al team Basis; per OData V4 la registrazione si trova nella transazione `/IWFND/V4_ADMIN`.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea `ZC_Travel`, `ZC_Booking`, la behavior definition di proiezione, la service definition `ZUI_TRAVEL` e il binding `ZUI_TRAVEL_O4`.
> 2. Pubblica il binding e apri l'anteprima. Crea un viaggio con la data di fine precedente a quella di inizio e controlla il messaggio di errore.
> 3. Crea un secondo binding di tipo **OData V4 - Web API** sulla stessa service definition e apri il suo documento `$metadata`.

### Soluzione

All'inizio l'anteprima mostra un elenco vuoto: premi **Go** per caricare i dati. Quando salvi il viaggio sbagliato, compare il messaggio di `validateDates` e il campo della data di fine viene evidenziato, perché la validazione imposta `%element-EndDate`. Il binding Web API espone le stesse entità e operazioni, ma il suo `$metadata` non contiene annotazioni UI.

> [!NOTE]
>
> - Le viste di proiezione (`as projection on`) scelgono e rinominano elementi del business object per una sola app; la root richiede `provider contract transactional_query`.
> - Le composizioni si reindirizzano con `redirected to composition child` e `redirected to parent`.
> - La behavior definition di proiezione riusa operazioni e azioni con `use`.
> - La service definition espone le entità con `expose ... as ...`, comprese le destinazioni degli aiuti alla ricerca.
> - Il service binding sceglie OData V2 o V4, UI o Web API; pubblicalo e usa **Preview** per provarlo.
