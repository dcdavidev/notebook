---
title: Le CDS table function
description: Usare un'AMDP come sorgente dati di un'entità CDS.
---

_Livello pro_

Una procedura [AMDP](./0137-amdp.it.md) si chiama da ABAP, come un metodo. Ma a volte ti serve logica SQLScript **dentro un modello di dati**: come sorgente di una CDS view, in un join, in un'app Fiori. Una **CDS table function** dà a SQLScript una faccia CDS. Ne definisci la firma in CDS, la implementi con una funzione AMDP e poi la leggi come qualsiasi entità CDS, da ABAP SQL o da altre viste.

## Le due parti di una table function

Una table function è sempre formata da due oggetti:

1. Una **data definition** con `define table function`: i parametri, le colonne restituite e il nome del metodo che la implementa.
2. Una **classe AMDP** con un metodo statico `FOR TABLE FUNCTION`, implementato `BY DATABASE FUNCTION` in SQLScript.

> [!TIP]
> Una table function è come un distributore automatico. Il pannello frontale (la definizione CDS) mostra i pulsanti e che cosa esce; il meccanismo dietro (l'AMDP) può essere complicato quanto vuole. I clienti vedono solo il pannello.

## La definizione CDS

```abap
@EndUserText.label: 'Posti occupati per compagnia'
@ClientHandling.type: #CLIENT_DEPENDENT
@ClientHandling.algorithm: #SESSION_VARIABLE
define table function ZTF_CarrierLoad
  with parameters
    p_from : s_date
  returns
  {
    client   : abap.clnt;
    carrid   : s_carr_id;
    flights  : abap.int8;
    occupied : abap.int8;
  }
  implemented by method zcl_tf_carrier_load=>get_load;
```

- `returns` elenca le colonne del risultato con i loro tipi, come i campi di una struttura. Non ci sono `key`, `select` né `from`: le righe le fornisce l'AMDP.
- La funzione è **dipendente dal mandante**: la prima colonna ha tipo `abap.clnt`, e ABAP SQL la filtra sul mandante corrente. `@ClientHandling.algorithm: #SESSION_VARIABLE` comunica all'AMDP qual è il mandante corrente tramite la sessione del database.
- `implemented by method` indica la classe e il metodo. La definizione CDS e il metodo si citano a vicenda, quindi attivali insieme.

## L'implementazione AMDP

```abap
CLASS zcl_tf_carrier_load DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_amdp_marker_hdb.
    CLASS-METHODS get_load FOR TABLE FUNCTION ztf_carrierload.
ENDCLASS.

CLASS zcl_tf_carrier_load IMPLEMENTATION.
  METHOD get_load BY DATABASE FUNCTION FOR HDB LANGUAGE SQLSCRIPT
                  OPTIONS READ-ONLY
                  USING sflight.
    RETURN SELECT mandt         AS client,
                  carrid,
                  COUNT(*)      AS flights,
                  SUM(seatsocc) AS occupied
             FROM sflight
            WHERE mandt  = SESSION_CONTEXT('CLIENT')
              AND fldate >= :p_from
            GROUP BY mandt, carrid;
  ENDMETHOD.
ENDCLASS.
```

- Il metodo è statico (`CLASS-METHODS`) e non ha una propria lista di parametri: `FOR TABLE FUNCTION` prende parametri e risultato dalla definizione CDS.
- `BY DATABASE FUNCTION`, non `BY DATABASE PROCEDURE`: una funzione restituisce una tabella con `RETURN`.
- Le colonne restituite devono corrispondere alla lista `returns` per nome, ordine e tipo.
- Il filtro sul mandante tocca a te, come in ogni AMDP.

## Leggere una table function

ABAP SQL la legge come una CDS view con parametri:

```abap
SELECT FROM ztf_carrierload( p_from = '20250101' )
  FIELDS carrid, flights, occupied
  ORDER BY occupied DESCENDING
  INTO TABLE @DATA(lt_load).
```

E una CDS view entity può usarla come sorgente dati, aggiungere associazioni ed esporla al resto del modello:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Carico delle compagnie con nome'
define view entity ZI_CarrierLoadFromTf
  with parameters
    p_from : s_date
  as select from ZTF_CarrierLoad( p_from: $parameters.p_from )
  association [1..1] to ZI_Carrier as _Carrier
    on $projection.CarrierId = _Carrier.CarrierId
{
  key carrid               as CarrierId,
      flights              as FlightCount,
      occupied             as SeatsOccupied,
      _Carrier.CarrierName as CarrierName,
      _Carrier
}
```

> [!WARNING]
> Il database non riesce a spingere i filtri della query esterna dentro l'SQLScript di una table function bene come fa per una vista. Un `WHERE carrid = 'LH'` sopra la funzione può comunque lasciarle calcolare prima tutte le compagnie. Passa i filtri importanti come **parametri**, così l'AMDP può usarli subito.

## Quando usare una table function

Usa una table function quando un modello CDS ha bisogno di un passo che le CDS da sole non sanno esprimere, per esempio una funzione specifica di HANA o una logica in più passi con tabelle intermedie. Se basta una normale CDS view entity con espressioni e aggregati, come in questo caso, preferisci la vista: è portabile, più semplice e supporta il [controllo accessi](./0136-cds-access-control.it.md) senza lavoro in più.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea `ZCL_TF_CARRIER_LOAD` e `ZTF_CarrierLoad` e attivali.
> 2. Leggi la funzione da ABAP per i voli dell'anno corrente.
> 3. Aggiungi una colonna `seatsmax` con la capacità totale, nella definizione CDS e nell'AMDP.

### Soluzione

Nella definizione CDS aggiungi `seatsmax : abap.int8;` dopo `occupied`. Nell'AMDP aggiungi `SUM(seatsmax) AS seatsmax` dopo `SUM(seatsocc) AS occupied`, nella stessa posizione. Per l'anno, calcola prima la data, `DATA(lv_from) = CONV s_date( |{ sy-datum(4) }0101| ).`, e passala come `p_from = @lv_from`.

> [!NOTE]
>
> - Una CDS table function è un'entità CDS le cui righe arrivano da una funzione AMDP.
> - La parte CDS (`define table function`) dichiara parametri, colonne `returns` e `implemented by method`.
> - La parte ABAP è un metodo statico `FOR TABLE FUNCTION`, implementato `BY DATABASE FUNCTION` con `RETURN SELECT ...`.
> - Le colonne restituite devono corrispondere alla definizione; il filtro sul mandante spetta a te.
> - Passa i filtri come parametri, e preferisci una normale view entity quando le CDS sanno esprimere la logica.
