---
title: ABAP Cloud e clean core
description: API rilasciate, versioni del linguaggio, il modello a livelli e la libreria XCO.
---

_Livello pro_

Per decenni il codice ABAP custom ha potuto leggere qualunque tabella SAP, chiamare qualunque modulo funzione e perfino modificare i programmi di SAP. Questa libertà ha reso gli upgrade lenti e costosi: ogni nuovo rilascio poteva rompere qualcosa. Il **clean core** è la risposta di SAP: lasciare intatto il sistema standard e costruire le estensioni solo su interfacce stabili e documentate. **ABAP Cloud** è il modello di sviluppo che lo impone, nell'ambiente ABAP di SAP BTP, in SAP S/4HANA Cloud e, dal rilascio 2022, anche in SAP S/4HANA on premise.

## Le versioni del linguaggio

Ogni oggetto ABAP ha una **versione del linguaggio ABAP** che decide quali istruzioni e quali oggetti può usare. In ADT la vedi nella vista **Properties** dell'oggetto.

| Versione del linguaggio    | Che cosa permette                                                                      | Dove la incontri                     |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| Standard ABAP              | tutto il linguaggio e ogni oggetto del repository                                      | lo sviluppo classico on premise      |
| ABAP for Cloud Development | un linguaggio ridotto, e solo API rilasciate e oggetti tuoi                            | ABAP Cloud, ovunque                  |
| ABAP for Key Users         | un linguaggio ancora più piccolo per le BAdI scritte dai key user in uno strumento web | la key user extensibility in S/4HANA |

Con **ABAP for Cloud Development**, il controllo di sintassi rifiuta tutto quello che non è pronto per il cloud. Queste righe compilano in Standard ABAP ma sono errori in ABAP Cloud:

```abap
SELECT * FROM mara INTO TABLE @DATA(lt_mara).   " MARA non è rilasciata: usa I_Product
WRITE / 'Ciao'.                                 " niente liste classiche
CALL TRANSACTION 'VA01'.                        " niente transazioni SAP GUI
DATA(lv_today) = sy-datum.                      " usa cl_abap_context_info=>get_system_date( )
```

Quello che resta è comunque tanto: classi, interfacce, tabelle interne, ABAP SQL, CDS, RAP, ABAP Unit ed espressioni moderne. Al posto dei report scrivi classi che implementano `if_oo_adt_classrun` e le esegui con F9 in ADT, oppure costruisci servizi e app Fiori.

## Le API rilasciate

Una **API rilasciata** è un oggetto SAP (una view CDS, una classe, un'interfaccia, un elemento dati, una BAdI) che SAP si impegna a mantenere stabile. Ogni oggetto rilasciato ha uno o più **contratti di rilascio**:

| Contratto | Significato                                                                | Esempio                                     |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| C0        | puoi estenderlo (aggiungere campi, implementarlo come punto di estensione) | un extension include, una BAdI rilasciata   |
| C1        | puoi usarlo nello stesso sistema, nel codice ABAP Cloud                    | `I_Product`, `CL_ABAP_CONTEXT_INFO`         |
| C2        | puoi chiamarlo dall'esterno come API remota                                | un servizio OData o SOAP per l'integrazione |

Esistono altri contratti per casi particolari, come i contenuti di configurazione e le AMDP. Per controllare un oggetto in ADT, aprilo e guarda la scheda **API State** nella vista **Properties**. Il project explorer ha anche un albero **Released Objects** con tutto quello che è rilasciato nel tuo sistema. Quando un vecchio oggetto che usavi non è rilasciato, cerca il suo **successore**: SAP pubblica la corrispondenza nel Cloudification Repository su GitHub, e ADT la mostra nell'API state (per esempio, `MARA` rimanda a `I_Product`).

## Il modello a livelli

Su SAP S/4HANA on premise e private cloud non puoi portare tutto su ABAP Cloud da un momento all'altro. Il **modello a 3 livelli** (3-tier model) organizza il codice che hai:

| Livello | Versione del linguaggio    | Che cosa contiene                                                                             |
| ------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| Tier 1  | ABAP for Cloud Development | le nuove estensioni, che usano solo API rilasciate: la destinazione di tutto il codice nuovo  |
| Tier 2  | Standard ABAP              | i **wrapper**: classi tue che chiamano un'API non rilasciata e che rilasci (C1) per il tier 1 |
| Tier 3  | Standard ABAP              | il codice custom classico: modifiche, vecchi report, accesso diretto alle tabelle             |

Quando il codice del tier 1 ha bisogno di qualcosa che SAP non ha ancora rilasciato, per esempio una BAPI, scrivi una piccola classe wrapper nel tier 2, la rilasci per lo sviluppo cloud e la chiami dal tier 1. Quando più avanti SAP rilascia un'API vera, sostituisci il wrapper.

SAP ha poi affinato questo modello nei **clean core level da A a D**: il livello A è ABAP Cloud con sole API rilasciate, il livello B ammette API classiche stabili come le BAPI, mentre i livelli C e D comprendono oggetti interni e modifiche, che rendono rischiosi gli upgrade. L'idea è la stessa: spostare il codice verso il livello più alto, un oggetto alla volta. Per trovare quello che non è pronto per il cloud, esegui l'ATC con una variante di controllo per la cloud readiness (vedi [qualità del codice](./0107-code-quality.md)).

> [!TIP]
> Il clean core è come affittare un appartamento arredato. Puoi portare i tuoi mobili e appendere quadri ai ganci che il proprietario ha messo nei muri (le API rilasciate), ma non abbatti pareti. Quando il proprietario ristruttura il palazzo (un upgrade), le tue cose sono ancora dove le hai lasciate.

## La libreria XCO

La **libreria XCO** (Extension Components) è un insieme di classi rilasciate per le attività comuni in ABAP Cloud: informazioni di sistema, stringhe, date e ore, il repository ABAP e la generazione di oggetti. Tutto parte dalla classe `xco_cp` o da una classe specializzata come `xco_cp_abap_repository`, e concateni le chiamate fino al valore che ti serve:

```abap
CLASS zcl_cloud_demo DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_cloud_demo IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    " informazioni di sistema
    DATA(lv_user) = xco_cp=>sy->user( )->name.
    DATA(lv_date) = xco_cp=>sy->date( )->as( xco_cp_time=>format->iso_8601_extended )->value.
    out->write( |Utente { lv_user }, data { lv_date }| ).

    " stringhe
    DATA(lt_carriers) = xco_cp=>string( `LH,AA,UA` )->split( `,` )->value.
    out->write( lt_carriers ).

    " il repository ABAP
    IF xco_cp_abap_repository=>object->clas->for( 'ZCL_CLOUD_DEMO' )->exists( ).
      out->write( `La classe esiste` ).
    ENDIF.

    " una view CDS rilasciata al posto di una tabella classica
    SELECT Currency, Decimals
      FROM I_Currency
      ORDER BY Currency
      INTO TABLE @DATA(lt_currencies)
      UP TO 5 ROWS.
    out->write( lt_currencies ).
  ENDMETHOD.
ENDCLASS.
```

XCO legge e scrive anche JSON (vedi [JSON e XML](./0127-json-and-xml.md)) e può generare tabelle, view CDS e classi da codice. Molte API classiche hanno un'alternativa rilasciata anche fuori da XCO, come `cl_abap_context_info` per utente e data, e `cl_system_uuid` per gli UUID.

> [!WARNING]
> Non tutte le classi il cui nome comincia con `CL_` o `XCO_` sono rilasciate. Controlla l'API state prima di costruirci sopra. Se una classe funziona in Standard ABAP ma non nel tuo oggetto cloud, il controllo di sintassi ti dice esattamente quale oggetto non è rilasciato.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la classe `ZCL_CLOUD_DEMO` con la versione del linguaggio **ABAP for Cloud Development** ed eseguila con F9.
> 2. Aggiungi `SELECT * FROM mara` e leggi il messaggio di errore. Trova il successore di `MARA` nell'API state.
> 3. Sostituisci la query con la lettura di cinque prodotti dal successore.

### Soluzione

Il successore di `MARA` è la view rilasciata `I_Product`:

```abap
SELECT Product, ProductType, BaseUnit
  FROM I_Product
  ORDER BY Product
  INTO TABLE @DATA(lt_products)
  UP TO 5 ROWS.
out->write( lt_products ).
```

> [!NOTE]
>
> - Il clean core lascia intatto lo standard; ABAP Cloud lo impone con la versione del linguaggio **ABAP for Cloud Development**.
> - In ABAP Cloud puoi usare solo API rilasciate (contratti C0, C1, C2) e oggetti tuoi; controlla l'**API State** e cerca i successori.
> - Il modello a 3 livelli separa il codice pronto per il cloud (tier 1), i wrapper rilasciati (tier 2) e il codice classico (tier 3); i clean core level A–D lo affinano.
> - La libreria XCO e classi come `cl_abap_context_info` sostituiscono i campi di sistema e molte API classiche.
> - Scrivi il codice nuovo nel tier 1, e porta lì il codice vecchio un passo alla volta.
