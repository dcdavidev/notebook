---
title: App Fiori elements dalle annotazioni
description: Costruire la UI con le metadata extension e vederla in anteprima.
---

_Livello pro_

**SAP Fiori elements** costruisce un'interfaccia web completa a partire dai metadati di un servizio OData: non scrivi né JavaScript né HTML. È il servizio a dire alla UI quali campi mostrare, in che ordine, con quali etichette e quali filtri, tramite le **annotazioni UI**. Con RAP queste annotazioni le scrivi in CDS, quindi la UI del tuo business object sta accanto al suo modello dati e al suo comportamento.

Questa lezione parte dal business object dei viaggi e dal suo servizio OData V4 di [proiezioni, service definition e binding](./0144-rap-business-services.md): l'entità root `ZR_Travel`, la sua child `ZR_Booking` e le proiezioni `ZC_Travel` e `ZC_Booking`.

## List report e object page

Fiori elements offre alcuni **floorplan**, cioè layout di pagina già pronti. Un'app RAP transazionale ne usa quasi sempre due insieme:

| Floorplan         | Che cosa mostra                                                         | Annotazioni principali                 |
| ----------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| List report       | una barra dei filtri e una tabella di istanze, per esempio i viaggi     | `@UI.selectionField`, `@UI.lineItem`   |
| Object page       | una singola istanza con testata e sezioni, per esempio un viaggio       | `@UI.headerInfo`, `@UI.facet`          |
| (dentro entrambi) | campi di form e tabelle delle entità child, per esempio le prenotazioni | `@UI.identification`, `@UI.fieldGroup` |

La UI legge le annotazioni dal documento `$metadata` del servizio. Se cambi un'annotazione e la attivi, l'app la vede al caricamento successivo: niente build, niente deploy.

## Le metadata extension

Potresti scrivere le annotazioni `@UI` direttamente nella view di proiezione, ma diventerebbero presto più lunghe della view stessa. Una **metadata extension** (`DDLX`) è un oggetto CDS separato che contiene solo annotazioni per un'entità. Per permetterla, la proiezione deve avere `@Metadata.allowExtensions: true`:

```abap
@EndUserText.label: 'Proiezione viaggi'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
define root view entity ZC_Travel
  provider contract transactional_query
  as projection on ZR_Travel
{
  key TravelUUID,
      TravelID,
      @ObjectModel.text.element: [ 'CustomerName' ]
      @Consumption.valueHelpDefinition: [ { entity: { name: '/DMO/I_Customer', element: 'CustomerID' } } ]
      CustomerID,
      _Customer.LastName as CustomerName,
      BeginDate,
      EndDate,
      TotalPrice,
      CurrencyCode,
      Description,
      OverallStatus,
      StatusCriticality,          " 1 rosso, 2 giallo, 3 verde: un CASE in ZR_Travel
      LocalLastChangedAt,
      _Booking : redirected to composition child ZC_Booking,
      _Customer
}
```

Le annotazioni semantiche, come l'help di ricerca e il testo, restano nella proiezione: descrivono i dati. Le annotazioni di layout vanno nella metadata extension. In ADT, clic destro sulla proiezione e scegli **New Metadata Extension**:

```abap
@Metadata.layer: #CUSTOMER
@UI.headerInfo: { typeName: 'Viaggio',
                  typeNamePlural: 'Viaggi',
                  title: { type: #STANDARD, value: 'TravelID' },
                  description: { type: #STANDARD, value: 'Description' } }
annotate entity ZC_Travel with
{
  @UI.facet: [ { id: 'TravelDetails',
                 purpose: #STANDARD,
                 type: #IDENTIFICATION_REFERENCE,
                 label: 'Viaggio',
                 position: 10 },
               { id: 'Bookings',
                 purpose: #STANDARD,
                 type: #LINEITEM_REFERENCE,
                 label: 'Prenotazioni',
                 position: 20,
                 targetElement: '_Booking' } ]
  @UI.hidden: true
  TravelUUID;

  @UI: { lineItem:       [ { position: 10, importance: #HIGH } ],
         identification: [ { position: 10 } ],
         selectionField: [ { position: 10 } ] }
  TravelID;

  @UI: { lineItem:       [ { position: 20, importance: #HIGH } ],
         identification: [ { position: 20 } ],
         selectionField: [ { position: 20 } ] }
  CustomerID;

  @UI: { lineItem:       [ { position: 30 } ],
         identification: [ { position: 30 } ] }
  BeginDate;

  @UI: { lineItem:       [ { position: 40 } ],
         identification: [ { position: 40 } ] }
  EndDate;

  @UI: { lineItem:       [ { position: 50 } ],
         identification: [ { position: 50 } ] }
  TotalPrice;

  @UI: { lineItem:       [ { position: 60, criticality: 'StatusCriticality' },
                           { type: #FOR_ACTION, dataAction: 'acceptTravel', label: 'Accetta' } ],
         identification: [ { position: 60, criticality: 'StatusCriticality' },
                           { type: #FOR_ACTION, dataAction: 'acceptTravel', label: 'Accetta' } ],
         selectionField: [ { position: 30 } ] }
  OverallStatus;

  @UI.identification: [ { position: 70 } ]
  Description;

  @UI.hidden: true
  StatusCriticality;
}
```

- `@UI.headerInfo` imposta il titolo della object page e il nome della tabella.
- `@UI.facet` costruisce le sezioni della object page: `#IDENTIFICATION_REFERENCE` mostra i campi con `@UI.identification`, mentre `#LINEITEM_REFERENCE` con `targetElement` mostra la tabella `@UI.lineItem` dell'entità child.
- `#FOR_ACTION` aggiunge un pulsante per l'azione `acceptTravel` della [behavior definition](./0141-rap-behavior-definition.md). L'azione deve essere anche nella behavior definition di proiezione, con `use action acceptTravel;`.
- `criticality` colora il campo in base al valore di un altro elemento.

Scrivi una seconda metadata extension per `ZC_Booking` con almeno `@UI.lineItem` e `@UI.identification`, altrimenti la tabella delle prenotazioni nella object page resta vuota.

> [!WARNING]
> Nelle metadata extension le annotazioni di elemento finiscono con un punto e virgola dopo il nome dell'elemento, e puoi annotare solo elementi che esistono nella proiezione. Se l'app non mostra colonne, controlla che la metadata extension sia attiva e che nella proiezione ci sia `@Metadata.allowExtensions: true`.

### I layer

`@Metadata.layer` decide quale metadata extension vince quando più di una annota lo stesso elemento. Dalla priorità più bassa alla più alta: `#CORE`, `#LOCALIZATION`, `#INDUSTRY`, `#PARTNER`, `#CUSTOMER`. Le tue estensioni usano `#CUSTOMER`.

## Vedere l'app in anteprima

1. Apri il service binding del servizio, per esempio `ZUI_TRAVEL_O4`, e verifica che sia pubblicato.
2. Nell'elenco **Entity Set and Association**, seleziona `Travel`.
3. Scegli **Preview**. ADT apre il list report nel browser, con la barra dei filtri, la tabella e il pulsante **Create**.
4. Scegli **Go** per caricare i dati, poi clicca una riga per aprire la object page.

L'anteprima serve solo durante lo sviluppo. Per dare l'app agli utenti generi un vero progetto Fiori elements con SAP Fiori tools, in SAP Business Application Studio o in Visual Studio Code, e lo pubblichi sul sistema ABAP o su SAP BTP. Il progetto non contiene quasi codice: punta al servizio, e al resto pensano le annotazioni.

> [!TIP]
> Fiori elements è come una stampante di moduli che legge un modello. Non disegni il modulo riga per riga: compili il modello (le annotazioni) con che cosa va dove, e la stampante impagina ogni pagina sempre nello stesso modo.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea una metadata extension per `ZC_Travel` che mostri nel list report ID viaggio, cliente, date, prezzo e stato, con i filtri su ID viaggio e cliente.
> 2. Aggiungi una object page con una sezione **Viaggio** per i campi e una sezione **Prenotazioni** per la tabella child.
> 3. Apri l'anteprima e verifica che lo stato sia colorato e che compaia il pulsante **Accetta**.

### Soluzione

Usa la metadata extension qui sopra. Per la tabella delle prenotazioni, annota `ZC_Booking`:

```abap
@Metadata.layer: #CUSTOMER
@UI.headerInfo: { typeName: 'Prenotazione', typeNamePlural: 'Prenotazioni',
                  title: { type: #STANDARD, value: 'BookingID' } }
annotate entity ZC_Booking with
{
  @UI.facet: [ { id: 'BookingDetails', purpose: #STANDARD,
                 type: #IDENTIFICATION_REFERENCE, label: 'Prenotazione', position: 10 } ]
  @UI.hidden: true
  BookingUUID;

  @UI: { lineItem: [ { position: 10 } ], identification: [ { position: 10 } ] }
  BookingID;

  @UI: { lineItem: [ { position: 20 } ], identification: [ { position: 20 } ] }
  CarrierID;

  @UI: { lineItem: [ { position: 30 } ], identification: [ { position: 30 } ] }
  ConnectionID;

  @UI: { lineItem: [ { position: 40 } ], identification: [ { position: 40 } ] }
  FlightDate;

  @UI: { lineItem: [ { position: 50 } ], identification: [ { position: 50 } ] }
  FlightPrice;
}
```

> [!NOTE]
>
> - Fiori elements genera la UI dai metadati OData e dalle loro annotazioni `@UI`: nessun codice di interfaccia.
> - Un'app transazionale usa un list report (`@UI.lineItem`, `@UI.selectionField`) e una object page (`@UI.headerInfo`, `@UI.facet`, `@UI.identification`).
> - Metti le annotazioni di layout in una metadata extension; la proiezione deve avere `@Metadata.allowExtensions: true`.
> - `#FOR_ACTION` aggiunge i pulsanti delle azioni, e `criticality` colora un campo.
> - Vedi l'app in anteprima dal service binding; per la produzione, genera un progetto con SAP Fiori tools.
