---
title: La behavior definition
description: Implementazione managed, operazioni, controlli sui campi e blocchi.
---

_Livello pro_

Il [data model](./0140-rap-data-model.it.md) dice com'è fatto un viaggio. La **behavior definition** (BDEF) dice che cosa puoi farci: creare, modificare, cancellare, quali campi sono di sola lettura, come si bloccano le istanze e dove vive la logica di business. È un sorgente dichiarativo, scritto nel **behavior definition language**, con lo stesso nome dell'entità root.

Per crearla in ADT, clic destro su `ZR_Travel` e scegli **New Behavior Definition**. Il wizard propone il tipo di implementazione managed.

## Una behavior definition managed

```abap
managed implementation in class zbp_r_travel unique;
strict ( 2 );

define behavior for ZR_Travel alias Travel
persistent table ztravel
lock master
authorization master ( instance )
etag master LocalLastChangedAt
{
  create;
  update;
  delete;
  association _Booking { create; }

  field ( numbering : managed, readonly ) TravelUUID;
  field ( readonly ) OverallStatus, LastChangedAt, LocalLastChangedAt;
  field ( mandatory ) CustomerID, BeginDate, EndDate;

  mapping for ztravel corresponding
  {
    TravelUUID         = travel_uuid;
    TravelID           = travel_id;
    CustomerID         = customer_id;
    BeginDate          = begin_date;
    EndDate            = end_date;
    TotalPrice         = total_price;
    CurrencyCode       = currency_code;
    Description        = description;
    OverallStatus      = overall_status;
    LastChangedAt      = last_changed_at;
    LocalLastChangedAt = local_last_changed_at;
  }
}

define behavior for ZR_Booking alias Booking
persistent table zbooking
lock dependent by _Travel
authorization dependent by _Travel
etag master LocalLastChangedAt
{
  update;
  delete;
  association _Travel;

  field ( numbering : managed, readonly ) BookingUUID;
  field ( readonly ) ParentUUID;
  field ( mandatory ) CarrierID, ConnectionID, FlightDate;

  mapping for zbooking corresponding
  {
    BookingUUID        = booking_uuid;
    ParentUUID         = parent_uuid;
    BookingID          = booking_id;
    CarrierID          = carrier_id;
    ConnectionID       = connection_id;
    FlightDate         = flight_date;
    FlightPrice        = flight_price;
    CurrencyCode       = currency_code;
    LocalLastChangedAt = local_last_changed_at;
  }
}
```

L'intestazione dice che le operazioni standard le implementa il framework (`managed`), che il tuo codice va nel **behavior pool** `ZBP_R_TRAVEL` (`unique` significa una sola classe per tutto il business object) e che valgono i controlli rigorosi della versione 2. Usa `strict ( 2 )` per ogni nuova BDEF: rifiuta sintassi e schemi superati.

C'è un blocco `define behavior for` per ogni entità. `alias` dà un nome breve da usare nel codice: `Travel` invece di `ZR_Travel`.

## Persistenza e operazioni

- `persistent table` indica la tabella in cui scrive il framework managed.
- `mapping for` collega i nomi degli elementi CDS alle colonne della tabella. Con `corresponding`, i campi con lo stesso nome si mappano da soli, e tu elenchi solo quelli diversi.
- `create`, `update` e `delete` abilitano le operazioni standard. Se ne togli una, nessuno può eseguirla, da nessun canale.
- `association _Booking { create; }` permette la **create by association**: le prenotazioni si creano solo attraverso il loro viaggio. Per questo l'entità delle prenotazioni non ha un proprio `create`.

> [!TIP]
> Una behavior definition è come il regolamento appeso in palestra. Non descrive come funzionano gli attrezzi all'interno; dice chi può usare quale attrezzo, quali sono vietati e che devi registrarti alla reception prima di cominciare.

## I controlli sui campi

| Controllo                       | Effetto                                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `field ( readonly )`            | i consumatori non possono cambiarlo; può farlo solo il tuo codice nel behavior pool                                                           |
| `field ( mandatory )`           | deve avere un valore; Fiori lo marca come obbligatorio. Controllalo anche in una validazione, a meno che il tuo rilascio non lo faccia per te |
| `field ( readonly : update )`   | si può impostare alla creazione, non cambiare dopo                                                                                            |
| `field ( numbering : managed )` | il framework riempie la chiave UUID alla creazione                                                                                            |
| `field ( features : instance )` | sola lettura o obbligatorio a seconda dell'istanza, deciso nel behavior pool                                                                  |

Il controllo dinamico funziona anche per le operazioni: `update ( features : instance );` lascia decidere al behavior pool, per esempio, che i viaggi accettati non si possono modificare. Lo implementi in un metodo `get_instance_features`.

## Blocchi, ETag e autorizzazioni

- `lock master` sulla root: quando qualcuno modifica un viaggio o una delle sue prenotazioni, il framework mette un blocco esclusivo sull'intero viaggio. `lock dependent by _Travel` sul figlio dice quale root bloccare. Nello scenario managed, il framework crea e usa l'oggetto di blocco per te.
- `etag master LocalLastChangedAt` attiva il **blocco ottimistico**: il client rimanda il valore che ha letto, e RAP rifiuta la modifica se nel frattempo il campo è cambiato, perché un altro utente ha salvato prima.
- `authorization master ( instance )` significa che il behavior pool controlla l'autorizzazione per ogni istanza, in un metodo `get_instance_authorizations`. Il figlio la eredita con `authorization dependent by _Travel`. Con `( global )`, invece, il controllo è per utente, indipendente dall'istanza.

> [!WARNING]
> Il blocco resta solo fino alla fine della richiesta. RAP è stateless: un utente Fiori che apre un viaggio e lascia la schermata aperta non blocca nessuno, e l'ETag lo protegge dal sovrascrivere dati più recenti. Se gli utenti devono tenere a lungo modifiche non salvate, usa il [draft](./0146-rap-draft.it.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la behavior definition vista sopra per `ZR_Travel`.
> 2. Usa la quick fix (`Ctrl+1`) sulla riga `implementation in class` per creare il behavior pool `ZBP_R_TRAVEL`, e attiva entrambi.
> 3. Rendi `TravelID` di sola lettura in modifica e `CurrencyCode` obbligatorio. Che cosa cambia nel sorgente?

### Soluzione

```abap
  field ( readonly : update ) TravelID;
  field ( mandatory ) CustomerID, BeginDate, EndDate, CurrencyCode;
```

La quick fix crea una classe globale `ZBP_R_TRAVEL` con `FOR BEHAVIOR OF zr_travel` nella definizione, e una classe handler locale con un metodo `get_instance_authorizations` vuoto. Finché non lo riempi, ogni operazione è permessa. La lezione [validazioni, determinazioni e azioni](./0142-rap-validations-determinations-actions.it.md) riempie il behavior pool.

> [!NOTE]
>
> - La behavior definition dichiara che cosa i consumatori possono fare con un business object; ha il nome dell'entità root.
> - `managed implementation in class ... unique; strict ( 2 );` è l'intestazione di una nuova BDEF managed.
> - Ogni entità ha `persistent table`, `mapping for`, le sue operazioni e i suoi controlli sui campi.
> - I figli si creano tramite `association _Child { create; }` e si bloccano tramite `lock dependent by`.
> - `lock master`, `etag master` e `authorization master` impostano blocchi esclusivi, blocco ottimistico e controlli di autorizzazione.
