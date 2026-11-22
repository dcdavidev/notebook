---
title: Il controllo accessi CDS
description: Limitare le righe con i ruoli DCL e gli oggetti di autorizzazione.
---

_Livello pro_

Un report classico controlla le autorizzazioni con [`AUTHORITY-CHECK`](./0110-authorization-checks.md) e poi filtra da solo le righe. Una CDS view la leggono molti consumatori, da ABAP SQL alle app Fiori agli strumenti di analisi, quindi il controllo appartiene alla vista. Il **controllo accessi CDS** fa esattamente questo: un **ruolo CDS**, scritto nel Data Control Language (**DCL**), aggiunge un filtro a ogni lettura ABAP SQL della vista, in base alle autorizzazioni dell'utente.

L'utente vede semplicemente meno righe. Nessun errore, nessun codice in più nel consumatore.

> [!TIP]
> Pensa alla tessera magnetica di un albergo. Tutti gli ospiti usano lo stesso ascensore e gli stessi corridoi, ma la tessera apre solo la porta della propria camera. Il ruolo CDS è il sistema delle tessere: un solo edificio, un insieme di porte diverso per ogni ospite.

## Attivare il controllo

La vista dichiara se si aspetta il controllo accessi con `@AccessControl.authorizationCheck`:

| Valore             | Significato                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `#CHECK`           | ci si aspetta un ruolo; senza, il controllo sintattico dà un warning |
| `#NOT_REQUIRED`    | non serve un ruolo, ma se esiste viene applicato                     |
| `#NOT_ALLOWED`     | i ruoli non vengono mai applicati                                    |
| `#PRIVILEGED_ONLY` | la vista si può leggere solo con accesso privilegiato                |

```abap
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Voli'
define view entity ZI_Flight
  as select from sflight
  // ... associazioni ed elementi come nelle lezioni precedenti
```

## Scrivere un ruolo

Un ruolo è un oggetto a sé: in ADT, **New > Other ABAP Repository Object > Core Data Services > Access Control**. Dagli lo stesso nome della vista.

```abap
@EndUserText.label: 'Controllo accessi per ZI_Flight'
@MappingRole: true
define role ZI_FLIGHT {
  grant select on ZI_Flight
    where ( CarrierId ) = aspect pfcg_auth( S_CARRID, CARRID, ACTVT = '03' );
}
```

- `grant select on` indica l'entità protetta.
- La clausola `where` è la **condizione di accesso**. Qui è una **condizione PFCG**: l'elemento `CarrierId` viene confrontato con il campo `CARRID` dell'oggetto di autorizzazione `S_CARRID`, per i ruoli assegnati all'utente con attività `03` (visualizzazione).
- `@MappingRole: true` significa che il ruolo è assegnato automaticamente a tutti gli utenti. Che cosa vede ciascuno dipende comunque dai suoi ruoli PFCG.

A runtime ABAP SQL aggiunge la condizione alla clausola `WHERE`. Un utente il cui ruolo PFCG permette `S_CARRID` con `CARRID = LH` e `UA` legge solo i voli Lufthansa e United; un utente con `*` vede tutto; un utente senza `S_CARRID` non vede niente.

## Altri tipi di condizione

Puoi combinare le condizioni con `and` e `or`, e usarne di diversi tipi. Questo ruolo protegge una vista delle prenotazioni `ZI_Booking` su `SBOOK` e nasconde le prenotazioni annullate:

```abap
@EndUserText.label: 'Controllo accessi per ZI_Booking'
@MappingRole: true
define role ZI_BOOKING {
  grant select on ZI_Booking
    where ( CarrierId ) = aspect pfcg_auth( S_CARRID, CARRID, ACTVT = '03' )
      and Cancelled <> 'X';                             // condizione letterale
}
```

| Condizione | Esempio                                                | Effetto                                                       |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| PFCG       | `( CarrierId ) = aspect pfcg_auth( S_CARRID, CARRID )` | valori presi dalle autorizzazioni dell'utente                 |
| Letterale  | `Cancelled <> 'X'`                                     | un filtro fisso                                               |
| Utente     | `CreatedBy ?= aspect user`                             | il nome dell'utente corrente; `?=` accetta anche valori vuoti |
| Ereditata  | `inheriting conditions from entity ZI_Flight`          | riusa le condizioni del ruolo di un'altra entità              |

L'ereditarietà è il modo abituale per proteggere una vista di consumo: `grant select on ZC_FlightList where inheriting conditions from entity ZI_Flight;`. Se le condizioni di `ZI_Flight` cambiano, la vista di consumo si adegua.

> [!WARNING]
> Il controllo accessi funziona solo per le **letture ABAP SQL dell'entità CDS**. Una `SELECT` diretta sulla tabella `SFLIGHT`, una CDS view sopra con `#NOT_ALLOWED` o l'SQL nativo in un'AMDP lo aggirano. Fai in modo che la vista protetta sia l'unica strada con cui le tue app leggono i dati.

## Accesso privilegiato e test

A volte un programma deve leggere tutte le righe indipendentemente dall'utente, per esempio un job di background che calcola dei totali. Allora chiede esplicitamente l'accesso privilegiato, e i ruoli non vengono applicati:

```abap
SELECT FROM zi_flight WITH PRIVILEGED ACCESS
  FIELDS CarrierId, COUNT( * ) AS flights
  GROUP BY CarrierId
  INTO TABLE @DATA(lt_all).
```

In RAP, l'aggiunta `PRIVILEGED` dell'[EML](./0143-eml.md) ha un ruolo simile per i controlli di autorizzazione di un business object. Usa l'accesso privilegiato di proposito e documenta il motivo.

Per testare un ruolo, accedi con un utente che ha un'autorizzazione `S_CARRID` limitata e avvia la data preview: applica i ruoli dell'utente corrente. In ADT, **Open With > Access Control** sulla vista mostra quali ruoli valgono per essa.

## Esercizio

> [!IMPORTANT]
>
> 1. Imposta `@AccessControl.authorizationCheck: #CHECK` su `ZI_Flight` e crea il ruolo `ZI_FLIGHT` con la condizione PFCG su `S_CARRID`.
> 2. Avvia la data preview con il tuo utente, poi chiedi un utente di test il cui ruolo PFCG permette solo `CARRID = LH`. Confronta i risultati.
> 3. Crea `ZC_FlightList` sopra `ZI_Flight` e proteggila con una condizione ereditata.

### Soluzione

```abap
@EndUserText.label: 'Controllo accessi per ZC_FlightList'
@MappingRole: true
define role ZC_FLIGHTLIST {
  grant select on ZC_FlightList
    where inheriting conditions from entity ZI_Flight;
}
```

L'utente di test vede solo i voli `LH` in entrambe le viste, senza alcun messaggio di errore. Se non vedi nessuna riga, l'utente non ha un'autorizzazione `S_CARRID` con attività `03`.

> [!NOTE]
>
> - Il controllo accessi CDS filtra le righe a ogni lettura ABAP SQL di un'entità CDS, in base alle autorizzazioni dell'utente.
> - `@AccessControl.authorizationCheck: #CHECK` sulla vista, e un ruolo `define role ... grant select on ... where ...` in DCL.
> - Le condizioni PFCG collegano gli elementi ai campi degli oggetti di autorizzazione; esistono anche condizioni letterali, sull'utente ed ereditate.
> - Leggere direttamente la tabella aggira il ruolo: rendi la vista l'unica via di accesso.
> - `WITH PRIVILEGED ACCESS` salta i ruoli di proposito; usalo solo dove è giustificato.
