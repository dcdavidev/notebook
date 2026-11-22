---
title: OData con SAP Gateway
description: Costruire un servizio OData V2 con SEGW.
---

_Livello pro_

**OData** è un protocollo REST per i dati di business: entità, chiavi, relazioni e opzioni di query standard come `$filter`, `$top` e `$orderby`, tutto descritto in un documento `$metadata`. Le app SAP Fiori leggono e scrivono dati tramite OData. Su SAP NetWeaver e SAP S/4HANA, **SAP Gateway** esegue i servizi OData, e il **Service Builder** (transazione `SEGW`) è lo strumento classico per costruire un servizio OData V2 in ABAP.

I servizi nuovi su SAP S/4HANA di solito si costruiscono con RAP (vedi [proiezioni, service definition e binding](./0144-rap-business-services.md)). I servizi `SEGW` però sono ovunque, quindi devi saperli leggere, correggere e a volte costruire.

## I pezzi di un progetto SEGW

| Pezzo                      | Che cos'è                                                                |
| -------------------------- | ------------------------------------------------------------------------ |
| entity type                | la struttura di un record, con le proprietà chiave (`Connection`)        |
| entity set                 | la collezione di un entity type, usata negli URL (`ConnectionSet`)       |
| associazione / navigazione | una relazione fra entity type (`Connection` verso `Flights`)             |
| model provider class (MPC) | generata: costruisce i metadati. Tu estendi `ZCL_..._MPC_EXT`            |
| data provider class (DPC)  | generata: risponde alle richieste. Tu scrivi codice in `ZCL_..._DPC_EXT` |

Le classi senza `_EXT` vengono rigenerate ogni volta che scegli **Genera oggetti runtime**: non modificarle mai. Il tuo codice va nelle sottoclassi `_EXT`, dove **ridefinisci** i metodi.

> [!TIP]
> `SEGW` è come allestire un negozio. Il modello dati è il catalogo (quali prodotti esistono e com'è fatto ciascuno). Le classi generate sono il negozio vuoto, con gli scaffali e la cassa. Il tuo codice in `DPC_EXT` è il commesso che va a prendere i prodotti in magazzino (il database) quando un cliente li chiede.

## Costruire il servizio passo per passo

1. `SEGW` > **Crea progetto**: `ZFLIGHT`, tipo **Service with SAP Annotations**, il tuo package.
2. **Data Model > Importa > Struttura DDIC**: scegli `SPFLI`, chiama l'entity type `Connection`, seleziona i campi `CARRID`, `CONNID`, `CITYFROM`, `CITYTO`, `DEPTIME` e marca `CARRID` e `CONNID` come chiavi. Spunta **Crea entity set di default** (`ConnectionSet`).
3. **Genera oggetti runtime**: la procedura crea `ZCL_ZFLIGHT_MPC`, `ZCL_ZFLIGHT_MPC_EXT`, `ZCL_ZFLIGHT_DPC`, `ZCL_ZFLIGHT_DPC_EXT` e il servizio `ZFLIGHT_SRV`.
4. Registra il servizio nell'hub Gateway con `/IWFND/MAINT_SERVICE` > **Aggiungi servizio**: alias di sistema (spesso `LOCAL`), nome tecnico del servizio `ZFLIGHT_SRV`.
5. In `ZCL_ZFLIGHT_DPC_EXT` ridefinisci i metodi per ogni operazione che supporti.

## Leggere un elenco: GET_ENTITYSET

Una richiesta a `/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet` chiama `CONNECTIONSET_GET_ENTITYSET`:

```abap
METHOD connectionset_get_entityset.
  " $filter convertito in una condizione ABAP SQL, per esempio: CARRID = 'LH'
  DATA(lv_where) = io_tech_request_context->get_osql_where_clause_convert( ).

  SELECT carrid, connid, cityfrom, cityto, deptime
    FROM spfli
    WHERE (lv_where)
    ORDER BY carrid, connid
    INTO CORRESPONDING FIELDS OF TABLE @et_entityset
    UP TO @is_paging-top ROWS          " $top: 0 significa nessun limite
    OFFSET @is_paging-skip.            " $skip

  IF io_tech_request_context->has_inlinecount( ) = abap_true.
    SELECT COUNT(*) FROM spfli WHERE (lv_where) INTO @DATA(lv_count).
    es_response_context-inlinecount = lv_count.
  ENDIF.
ENDMETHOD.
```

- `get_osql_where_clause_convert( )` trasforma `$filter` in una clausola `WHERE` dinamica con i nomi dei campi ABAP (vedi [SQL dinamico](./0117-dynamic-sql-and-calls.md)). Restituisce una stringa vuota quando non c'è filtro.
- `is_paging` contiene `$top` e `$skip`; `it_order` e `io_tech_request_context->get_orderby( )` contengono `$orderby`.
- Spingere filtro e paginazione nel database è ciò che rende veloce un servizio. Leggere tutto e filtrare in ABAP va bene solo per tabelle piccole.

## Leggere un record: GET_ENTITY

`/ConnectionSet(Carrid='LH',Connid='0400')` chiama `CONNECTIONSET_GET_ENTITY`:

```abap
METHOD connectionset_get_entity.
  DATA ls_key TYPE zcl_zflight_mpc=>ts_connection.

  io_tech_request_context->get_converted_keys( IMPORTING es_key_values = ls_key ).

  SELECT SINGLE carrid, connid, cityfrom, cityto, deptime
    FROM spfli
    WHERE carrid = @ls_key-carrid AND connid = @ls_key-connid
    INTO CORRESPONDING FIELDS OF @er_entity.

  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        textid  = /iwbep/cx_mgw_busi_exception=>business_error
        message = |Collegamento { ls_key-carrid } { ls_key-connid } non trovato|.
  ENDIF.
ENDMETHOD.
```

La MPC definisce un tipo `ts_<entity type>` per ogni entity type. Sollevare `/IWBEP/CX_MGW_BUSI_EXCEPTION` restituisce al client un errore HTTP con il tuo messaggio; gli errori tecnici usano `/IWBEP/CX_MGW_TECH_EXCEPTION`.

Creazione, modifica e cancellazione funzionano allo stesso modo: ridefinisci `CONNECTIONSET_CREATE_ENTITY` (leggi il corpo con `io_data_provider->read_entry_data( IMPORTING es_data = ... )`), `_UPDATE_ENTITY` e `_DELETE_ENTITY`. Metti le modifiche vere al database in una BAPI o in una tua classe, controlla le autorizzazioni e non fare `COMMIT WORK` di tua iniziativa: Gateway fa il commit alla fine della richiesta.

> [!WARNING]
> Gateway non controlla per te le autorizzazioni sui tuoi dati. Un utente che può chiamare il servizio può leggere tutte le righe che la tua `SELECT` restituisce. Aggiungi `AUTHORITY-CHECK` (o un controllo nella clausola `WHERE`) in ogni metodo.

## Testare il servizio

Usa il **Gateway client**, `/IWFND/GW_CLIENT`, o un browser:

```text
/sap/opu/odata/sap/ZFLIGHT_SRV/$metadata
/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet?$format=json
/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet?$filter=Carrid eq 'LH'&$top=5&$inlinecount=allpages
/sap/opu/odata/sap/ZFLIGHT_SRV/ConnectionSet(Carrid='LH',Connid='0400')
```

Quando qualcosa va storto, `/IWFND/ERROR_LOG` (hub) e `/IWBEP/ERROR_LOG` (backend) mostrano l'errore con la richiesta, e puoi rieseguirla. Imposta un breakpoint esterno nel metodo di `DPC_EXT` per fare debug di una richiesta che arriva da un browser o da un'app Fiori.

> [!CAUTION]
> Dopo aver cambiato il modello dati, scegli di nuovo **Genera oggetti runtime** e svuota la cache dei metadati (`/IWFND/CACHE_CLEANUP` nell'hub, `/IWBEP/CACHE_CLEANUP` sul backend). Altrimenti i client continuano a vedere il vecchio `$metadata` e le richieste falliscono con errori poco chiari.

## Esercizio

> [!IMPORTANT]
>
> 1. Costruisci il progetto `ZFLIGHT` con l'entity type `Connection` da `SPFLI`, generalo e registra `ZFLIGHT_SRV`.
> 2. Implementa `CONNECTIONSET_GET_ENTITYSET` con filtro e paginazione, e `CONNECTIONSET_GET_ENTITY`.
> 3. In `/IWFND/GW_CLIENT` leggi `$metadata`, i collegamenti di `LH` e un singolo collegamento. Poi richiedi un collegamento che non esiste e trova l'errore in `/IWFND/ERROR_LOG`.

### Soluzione

Il codice è quello dei due metodi qui sopra. `$metadata` elenca l'entity type `Connection` con la chiave `Carrid`, `Connid`. `ConnectionSet?$filter=Carrid eq 'LH'` restituisce solo i collegamenti Lufthansa, perché `get_osql_where_clause_convert( )` restituisce `CARRID = 'LH'`. Un collegamento mancante restituisce lo stato HTTP 400 con il tuo messaggio (gli errori di business usano 400 se non imposti un altro stato), e il log degli errori mostra lo stesso messaggio con l'URL della richiesta.

> [!NOTE]
>
> - OData espone i dati di business come entity set con chiavi, navigazione e opzioni di query, descritti in `$metadata`.
> - `SEGW` genera le classi MPC e DPC; il tuo codice va solo nelle sottoclassi `_EXT`.
> - Ridefinisci `<set>_GET_ENTITYSET`, `_GET_ENTITY`, `_CREATE_ENTITY`, `_UPDATE_ENTITY` e `_DELETE_ENTITY`.
> - Spingi `$filter`, `$top` e `$skip` nel database, e controlla le autorizzazioni in ogni metodo.
> - Registra in `/IWFND/MAINT_SERVICE`, testa in `/IWFND/GW_CLIENT` e fai debug con `/IWFND/ERROR_LOG`; per i servizi S/4HANA nuovi preferisci RAP.
