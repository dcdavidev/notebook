---
title: Validazioni, determinazioni e azioni
description: La logica di business nel behavior pool.
---

_Livello pro_

Il framework managed crea, modifica, cancella e salva già i viaggi. Quello che non può sapere sono le tue regole di business: la data di fine non può precedere quella di inizio, un nuovo viaggio parte con lo stato "aperto", un viaggio riceve il prossimo numero libero, e un agente può accettare un viaggio con un clic. Queste regole sono **validazioni**, **determinazioni** e **azioni**. Le dichiari nella [behavior definition](./0141-rap-behavior-definition.it.md) e le implementi nel **behavior pool**.

## Dichiarare la logica

Aggiungi queste righe al blocco `ZR_Travel` della behavior definition, e rendi `TravelID` di sola lettura, perché lo riempie una determinazione:

```abap
  field ( readonly ) TravelID, OverallStatus, LastChangedAt, LocalLastChangedAt;

  validation validateDates on save { create; field BeginDate, EndDate; }
  determination setStatusToOpen on modify { create; }
  determination setTravelID on save { create; }
  action acceptTravel result [1] $self;
```

| Elemento                   | Quando gira                                                      | Che cosa fa                                                        |
| -------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Validazione                | nella sequenza di salvataggio, se è scattato il suo trigger      | controlla i dati; in caso di errore il salvataggio viene rifiutato |
| Determinazione `on modify` | subito dopo la modifica che la attiva, nella fase di interazione | calcola valori che l'utente vede subito                            |
| Determinazione `on save`   | nella sequenza di salvataggio, prima delle validazioni           | calcola valori che contano solo al salvataggio                     |
| Azione                     | quando un consumatore la chiama, per esempio da un pulsante      | un'operazione non standard con una logica propria                  |

Il **trigger** fra graffe elenca le operazioni (`create`, `update`, `delete`) e i campi (`field BeginDate, EndDate`) che fanno partire la validazione o la determinazione.

Metti il cursore su ogni nuovo nome e usa la quick fix (`Ctrl+1`) per aggiungere il metodo al behavior pool.

> [!TIP]
> Pensa a un modulo online. Una determinazione è il campo che si riempie da solo (la città compare quando digiti il CAP). Una validazione è il messaggio rosso quando premi **Invia** con una data sbagliata. Un'azione è un pulsante in più, come **Approva**, che fa una cosa precisa.

## La classe handler

Il behavior pool `ZBP_R_TRAVEL` è una classe globale quasi vuota. Il codice sta in una **classe handler locale** nella scheda **Local Types**, che eredita da `cl_abap_behavior_handler`. Ogni metodo dichiara che cosa gestisce con `FOR VALIDATE`, `FOR DETERMINE` o `FOR MODIFY`:

```abap
CLASS lhc_travel DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS get_instance_authorizations FOR INSTANCE AUTHORIZATION
      IMPORTING keys REQUEST requested_authorizations FOR Travel RESULT result.
    METHODS validateDates FOR VALIDATE ON SAVE
      IMPORTING keys FOR Travel~validateDates.
    METHODS setStatusToOpen FOR DETERMINE ON MODIFY
      IMPORTING keys FOR Travel~setStatusToOpen.
    METHODS setTravelID FOR DETERMINE ON SAVE
      IMPORTING keys FOR Travel~setTravelID.
    METHODS acceptTravel FOR MODIFY
      IMPORTING keys FOR ACTION Travel~acceptTravel RESULT result.
ENDCLASS.
```

Ogni metodo riceve `keys`, le istanze da gestire, e ha i parametri changing impliciti `failed`, `reported` e, per le azioni, `mapped`. I metodi leggono e modificano il business object solo con l'[EML](./0143-eml.it.md), sempre `IN LOCAL MODE`: così salti i controlli di autorizzazione e di feature, che valgono per i consumatori, non per la logica interna del business object.

## Le validazioni

```abap
  METHOD validateDates.
    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel
        FIELDS ( BeginDate EndDate ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).

    LOOP AT lt_travels INTO DATA(ls_travel).
      IF ls_travel-EndDate < ls_travel-BeginDate.
        APPEND VALUE #( %tky = ls_travel-%tky ) TO failed-travel.
        APPEND VALUE #( %tky             = ls_travel-%tky
                        %msg             = new_message_with_text(
                                             severity = if_abap_behv_message=>severity-error
                                             text     = 'La data di fine precede la data di inizio' )
                        %element-EndDate = if_abap_behv=>mk-on ) TO reported-travel.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.
```

Una riga in `failed-travel` blocca il salvataggio. Una riga in `reported-travel` porta il messaggio, e `%element` dice a Fiori quale campo evidenziare. `%tky` è la **chiave transazionale**: la chiave più i campi tecnici di RAP, come l'indicatore di bozza. Passa sempre `%tky`, non solo i campi chiave.

## Le determinazioni

```abap
  METHOD setStatusToOpen.
    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel FIELDS ( OverallStatus ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).
    DELETE lt_travels WHERE OverallStatus IS NOT INITIAL.
    CHECK lt_travels IS NOT INITIAL.

    MODIFY ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel UPDATE FIELDS ( OverallStatus )
      WITH VALUE #( FOR ls_travel IN lt_travels
                    ( %tky = ls_travel-%tky  OverallStatus = 'O' ) ).
  ENDMETHOD.

  METHOD setTravelID.
    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel FIELDS ( TravelID ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).
    DELETE lt_travels WHERE TravelID IS NOT INITIAL.
    CHECK lt_travels IS NOT INITIAL.

    SELECT SINGLE FROM ztravel FIELDS MAX( travel_id ) INTO @DATA(lv_max_id).

    MODIFY ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel UPDATE FIELDS ( TravelID )
      WITH VALUE #( FOR ls_travel IN lt_travels INDEX INTO lv_index
                    ( %tky = ls_travel-%tky  TravelID = lv_max_id + lv_index ) ).
  ENDMETHOD.
```

Le determinazioni devono essere **idempotenti**: eseguirle due volte dà lo stesso risultato. Per questo entrambe saltano le istanze che hanno già un valore.

> [!WARNING]
> `MAX( travel_id ) + 1` va bene per imparare, ma due utenti che salvano nello stesso momento possono ottenere lo stesso numero. In un'app reale prendi il numero da un [intervallo di numerazione](./0111-number-ranges.it.md).

## Le azioni

```abap
  METHOD acceptTravel.
    MODIFY ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel UPDATE FIELDS ( OverallStatus )
      WITH VALUE #( FOR ls_key IN keys ( %tky = ls_key-%tky  OverallStatus = 'A' ) ).

    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).

    result = VALUE #( FOR ls_travel IN lt_travels
                      ( %tky = ls_travel-%tky  %param = ls_travel ) ).
  ENDMETHOD.
```

`result [1] $self` nella behavior definition significa che l'azione restituisce il viaggio modificato, così Fiori può aggiornare la schermata. Per disattivare il pulsante sui viaggi già accettati, dichiara l'azione con `( features : instance )` e decidi in `get_instance_features`.

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi alla behavior definition la validazione, le due determinazioni e l'azione, e implementale in `ZBP_R_TRAVEL`.
> 2. Aggiungi un'azione `rejectTravel` che imposta lo stato a `X`.
> 3. Aggiungi una validazione `validateCustomer` che rifiuta i viaggi il cui cliente non esiste in `/DMO/I_Customer`.

### Soluzione

```abap
  action rejectTravel result [1] $self;
  validation validateCustomer on save { create; field CustomerID; }
```

`rejectTravel` è una copia di `acceptTravel` con `OverallStatus = 'X'`. Per `validateCustomer`, leggi il `CustomerID` delle istanze, seleziona quelli esistenti da `/dmo/i_customer` con `FOR ALL ENTRIES` o con un join su una tabella interna, e riempi `failed-travel` e `reported-travel` con `%element-CustomerID = if_abap_behv=>mk-on` per ogni cliente mancante.

> [!NOTE]
>
> - Le validazioni controllano i dati nella sequenza di salvataggio; una riga in `failed` blocca il salvataggio.
> - Le determinazioni calcolano valori `on modify` (visibili subito) o `on save`; tienile idempotenti.
> - Le azioni sono operazioni aggiuntive, dichiarate con `action nome result [1] $self;`.
> - La logica vive in una classe handler locale che eredita da `cl_abap_behavior_handler`, nel behavior pool.
> - Dentro il behavior pool usa l'EML `IN LOCAL MODE` e `%tky`; segnala i messaggi con `reported` e `%msg`.
