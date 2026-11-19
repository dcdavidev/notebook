---
title: RAP, ABAP Cloud e il tuo futuro da sviluppatore
description: Costruire un'app Fiori completa con il RESTful Application Programming Model.
---

_Settimana 3 · Livello avanzato · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                     |
| ------ | --------------------------------------------------------------------------------------------- |
| Ora 1  | ABAP Cloud, Clean Core, API rilasciate, modello di estensibilità a 3 livelli                  |
| Ora 2  | RAP passo per passo: tabelle, CDS, behavior definition, proiezione, servizio, anteprima Fiori |
| Ora 3  | Logica di business RAP: validazioni, determinazioni, azioni, draft, EML                       |
| Ora 4  | Strumenti (abapGit, gCTS), progetto finale, certificazione e piano di studio                  |

## Ora 1 – ABAP Cloud e Clean Core

### Il problema che risolve

Per decenni le aziende hanno modificato ed esteso SAP in ogni angolo: enhancement impliciti, lettura diretta di tabelle interne, modifiche. Risultato: ogni aggiornamento diventava un progetto costoso, perché il codice custom si rompeva.

**Clean Core** è la strategia di SAP per tenere "pulito" il nucleo: le estensioni usano solo interfacce stabili e ufficiali, così gli aggiornamenti non rompono nulla.

> [!TIP]
> È la differenza tra appendere i quadri ai chiodi previsti dal proprietario (API rilasciate) e incollarli direttamente sui tubi del riscaldamento (oggetti interni). Nel primo caso, se il proprietario rifà l'impianto, i quadri restano su; nel secondo, cadono tutti.

### Che cos'è ABAP Cloud

**ABAP Cloud** è il modello di sviluppo moderno di SAP, con quattro pilastri:

| Pilastro                     | Significato                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linguaggio ABAP per la cloud | versione ristretta di ABAP: niente istruzioni obsolete o legate alla SAP GUI (`WRITE`, Dynpro, `SUBMIT`, `CALL TRANSACTION`, accesso diretto al file system...) |
| Solo API rilasciate          | puoi usare solo oggetti SAP "released" (con contratto di stabilità C1): CDS standard come `I_Customer`, classi come `XCO_CP_*`, BAdI rilasciati                 |
| Eclipse ADT                  | unico ambiente di sviluppo                                                                                                                                      |
| RAP                          | il modello per servizi, app Fiori e API                                                                                                                         |

ABAP Cloud si usa in:

- **SAP BTP, ABAP Environment** (detto "Steampunk"): ABAP come servizio in cloud;
- **SAP S/4HANA Cloud Public Edition** (developer extensibility, detto "Embedded Steampunk");
- **SAP S/4HANA Cloud Private Edition e on-premise recenti**: puoi scegliere per ogni pacchetto la versione di linguaggio "ABAP for Cloud Development".

### Il modello di estensibilità a 3 livelli (on-premise / private)

| Livello (tier)          | Che cosa contiene                                                                                          | Regole                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Tier 1 – ABAP Cloud     | nuovi sviluppi custom                                                                                      | linguaggio cloud, solo API rilasciate: la scelta di default |
| Tier 2 – API enablement | "wrapper": classi in ABAP classico che incapsulano un oggetto non rilasciato e lo rilasciano per il tier 1 | solo quando manca un'API rilasciata                         |
| Tier 3 – ABAP classico  | codice esistente e casi senza alternative                                                                  | da ridurre nel tempo                                        |

Come sapere se un oggetto è rilasciato: in ADT, nella vista **Properties → API State** dell'oggetto; oppure nell'app/repository dei "Released Objects" e nel Cloud Readiness dell'ATC. Per gli oggetti classici non rilasciati SAP indica spesso un **successore** rilasciato.

### API moderne da conoscere (ABAP Cloud)

| Esigenza                       | API                                                                        |
| ------------------------------ | -------------------------------------------------------------------------- |
| Output su console              | `if_oo_adt_classrun`                                                       |
| Data e ora                     | `cl_abap_context_info`, `utclong_current( )`, `xco_cp=>sy`                 |
| Stringhe, JSON, tabelle, Excel | libreria XCO (`xco_cp`, `xco_cp_json`, `xco_cp_xlsx`)                      |
| Numeri progressivi             | `cl_numberrange_runtime`                                                   |
| Log applicativo                | `cl_bali_log`                                                              |
| HTTP client                    | `cl_web_http_client_manager` + destinazioni `cl_http_destination_provider` |
| Lavori in background           | Application Jobs (`if_apj_dt_exec_object`, `if_apj_rt_exec_object`), bgPF  |
| E-mail                         | `cl_bcs_mail_message`                                                      |
| Dati anagrafici e documenti    | CDS rilasciate `I_*` e Business Object RAP rilasciati via EML              |

## Ora 2 – RAP passo per passo

**RAP** (_ABAP RESTful Application Programming Model_) è il modello standard per costruire servizi OData, app Fiori e API transazionali. Al posto di scrivere a mano schermate, controlli, blocchi e salvataggi, li **dichiari** e il framework fa il resto.

> [!TIP]
> Con le Dynpro costruivi la casa mattone per mattone: impianto elettrico, idraulico, porte. Con RAP scegli la casa da un progetto modulare: dichiari quante stanze vuoi e cosa deve succedere quando apri una porta; impianti, serrature e allacciamenti (OData, blocchi, transazioni, UI) sono già inclusi.

### Le parti di un'applicazione RAP

| Strato        | Oggetto                                                           | Ruolo                                                   |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| Dati          | tabella di database (+ tabella draft)                             | dove si salvano i dati                                  |
| Modello       | CDS view entity "root" (`R_` o `I_`) con composizioni             | il business object (BO)                                 |
| Comportamento | Behavior Definition (BDEF) + classe Behavior Pool                 | che operazioni si possono fare e con che logica         |
| Proiezione    | CDS projection view (`C_`) + projection BDEF + metadata extension | cosa esporre a una specifica app, con le annotazioni UI |
| Servizio      | Service Definition                                                | quali entità pubblicare                                 |
| Protocollo    | Service Binding (OData V4 – UI)                                   | come pubblicarle                                        |
| Interfaccia   | anteprima Fiori Elements / app Fiori                              | l'utente                                                |

### Il modo più veloce: il generatore

In ADT: tasto destro sulla tabella → **Generate ABAP Repository Objects** → "OData UI Service" (o "Generate RAP BO"). Il wizard crea tutti gli oggetti dello schema con draft. È ottimo per partire: poi studi e personalizzi ogni pezzo. Qui sotto vediamo gli oggetti a mano per capirli.

### 1. La tabella

```sql
@EndUserText.label : 'Viaggi'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zviaggio {
  key client           : abap.clnt not null;
  key viaggio_uuid     : sysuuid_x16 not null;
  viaggio_id           : abap.numc(8);
  cliente_id           : abap.numc(6);
  data_inizio          : abap.dats;
  data_fine            : abap.dats;
  @Semantics.amount.currencyCode : 'zviaggio.valuta'
  prezzo               : abap.curr(16,2);
  valuta               : abap.cuky;
  descrizione          : abap.char(256);
  stato                : abap.char(1);
  creato_da            : abp_creation_user;
  creato_il            : abp_creation_tstmpl;
  modificato_da        : abp_locinst_lastchange_user;
  modificato_il_locale : abp_locinst_lastchange_tstmpl;
  modificato_il        : abp_lastchange_tstmpl;
}
```

(In ADT le tabelle si definiscono con questa sintassi testuale; in SE11 vedi lo stesso oggetto in forma grafica.) I campi amministrativi (creato da/il, modificato da/il) servono a RAP per il controllo della concorrenza (ETag) e vengono riempiti in automatico.

### 2. La CDS root view

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Viaggio - BO'
define root view entity ZR_Viaggio
  as select from zviaggio
{
  key viaggio_uuid         as ViaggioUuid,
      viaggio_id           as ViaggioId,
      cliente_id           as ClienteId,
      data_inizio          as DataInizio,
      data_fine            as DataFine,
      @Semantics.amount.currencyCode: 'Valuta'
      prezzo               as Prezzo,
      valuta               as Valuta,
      descrizione          as Descrizione,
      stato                as Stato,
      @Semantics.user.createdBy: true
      creato_da            as CreatoDa,
      @Semantics.systemDateTime.createdAt: true
      creato_il            as CreatoIl,
      @Semantics.user.localInstanceLastChangedBy: true
      modificato_da        as ModificatoDa,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      modificato_il_locale as ModificatoIlLocale,
      @Semantics.systemDateTime.lastChangedAt: true
      modificato_il        as ModificatoIl
}
```

`root` indica che è la radice del business object. Le entità figlie (es. prenotazioni del viaggio) si collegano con `composition [0..*] of ZR_Prenotazione as _Prenotazioni` nella root e `association to parent ZR_Viaggio as _Viaggio` nella figlia.

### 3. La Behavior Definition (BDEF)

```text
managed implementation in class zbp_r_viaggio unique;
strict ( 2 );
with draft;

define behavior for ZR_Viaggio alias Viaggio
persistent table zviaggio
draft table zviaggio_d
etag master ModificatoIlLocale
lock master total etag ModificatoIl
authorization master ( global )
{
  field ( readonly, numbering : managed ) ViaggioUuid;
  field ( readonly ) ViaggioId, Stato, CreatoDa, CreatoIl, ModificatoDa, ModificatoIl, ModificatoIlLocale;
  field ( mandatory ) ClienteId, DataInizio, DataFine;

  create;
  update;
  delete;

  action ( features : instance ) accetta result [1] $self;
  action ( features : instance ) rifiuta result [1] $self;

  determination impostaNumero on save { create; }
  determination impostaStatoIniziale on modify { create; }
  validation validaDate on save { create; field DataInizio, DataFine; }
  validation validaCliente on save { create; field ClienteId; }

  draft action Edit;
  draft action Activate optimized;
  draft action Discard;
  draft action Resume;
  draft determine action Prepare { validation validaDate; validation validaCliente; }

  mapping for zviaggio corresponding
  {
    ViaggioUuid        = viaggio_uuid;
    ViaggioId          = viaggio_id;
    ClienteId          = cliente_id;
    DataInizio         = data_inizio;
    DataFine           = data_fine;
    Prezzo             = prezzo;
    Valuta             = valuta;
    Descrizione        = descrizione;
    Stato              = stato;
    CreatoDa           = creato_da;
    CreatoIl           = creato_il;
    ModificatoDa       = modificato_da;
    ModificatoIlLocale = modificato_il_locale;
    ModificatoIl       = modificato_il;
  }
}
```

Le parole chiave principali:

| Elemento                                               | Significato                                                                                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `managed`                                              | il framework gestisce create/update/delete e il salvataggio (alternativa: `unmanaged`, quando la logica di salvataggio esiste già, es. BAPI) |
| `with draft`                                           | i dati in modifica vengono salvati come bozza (l'utente può interrompere e riprendere)                                                       |
| `persistent table` / `draft table`                     | tabella reale e tabella delle bozze (generabile con un quick fix)                                                                            |
| `etag` / `lock master`                                 | controllo della concorrenza e blocchi                                                                                                        |
| `authorization master`                                 | controllo autorizzazioni (`global` = per operazione, `instance` = per singolo record)                                                        |
| `field ( readonly / mandatory / numbering : managed )` | proprietà dei campi                                                                                                                          |
| `action`                                               | operazione personalizzata (pulsante nell'app)                                                                                                |
| `determination`                                        | calcolo automatico quando succede qualcosa (`on modify` / `on save`)                                                                         |
| `validation`                                           | controllo eseguito al salvataggio, può bloccarlo                                                                                             |
| `features : instance`                                  | abilitare/disabilitare dinamicamente un'azione o un campo                                                                                    |

### 4. Proiezione, servizio, binding

```sql
@EndUserText.label: 'Viaggio - proiezione'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@Search.searchable: true
define root view entity ZC_Viaggio
  provider contract transactional_query
  as projection on ZR_Viaggio
{
  key ViaggioUuid,
      @Search.defaultSearchElement: true
      ViaggioId,
      ClienteId,
      DataInizio,
      DataFine,
      Prezzo,
      Valuta,
      Descrizione,
      Stato,
      ModificatoIlLocale
}
```

```text
projection;
strict ( 2 );
use draft;

define behavior for ZC_Viaggio alias Viaggio
{
  use create;
  use update;
  use delete;

  use action accetta;
  use action rifiuta;

  use action Edit;
  use action Activate;
  use action Discard;
  use action Resume;
  use action Prepare;
}
```

Metadata extension (annotazioni UI, file DDLX):

```sql
@Metadata.layer: #CORE
@UI.headerInfo: { typeName: 'Viaggio', typeNamePlural: 'Viaggi',
                  title: { type: #STANDARD, value: 'ViaggioId' } }
annotate entity ZC_Viaggio with
{
  @UI.facet: [ { id: 'Generale', purpose: #STANDARD, type: #IDENTIFICATION_REFERENCE,
                 label: 'Dati generali', position: 10 } ]

  @UI.hidden: true
  ViaggioUuid;

  @UI: { lineItem: [ { position: 10 } ], identification: [ { position: 10 } ],
         selectionField: [ { position: 10 } ] }
  ViaggioId;

  @UI: { lineItem: [ { position: 20 } ], identification: [ { position: 20 } ],
         selectionField: [ { position: 20 } ] }
  ClienteId;

  @UI: { lineItem: [ { position: 30 } ], identification: [ { position: 30 } ] }
  DataInizio;

  @UI: { lineItem: [ { position: 40 } ], identification: [ { position: 40 } ] }
  DataFine;

  @UI: { lineItem: [ { position: 50 } ], identification: [ { position: 50 } ] }
  Prezzo;

  @UI: { lineItem: [ { position: 60 },
                     { type: #FOR_ACTION, dataAction: 'accetta', label: 'Accetta' },
                     { type: #FOR_ACTION, dataAction: 'rifiuta', label: 'Rifiuta' } ],
         identification: [ { position: 60 },
                           { type: #FOR_ACTION, dataAction: 'accetta', label: 'Accetta' },
                           { type: #FOR_ACTION, dataAction: 'rifiuta', label: 'Rifiuta' } ] }
  Stato;
}
```

Service definition e binding:

```sql
@EndUserText.label: 'Servizio viaggi'
define service ZUI_VIAGGIO {
  expose ZC_Viaggio as Viaggio;
}
```

Poi: tasto destro sulla service definition → **New Service Binding** → tipo **OData V4 – UI** → attiva → **Publish** → seleziona l'entità → **Preview**. Si apre nel browser un'app Fiori Elements completa: lista con filtri, pagina di dettaglio, creazione, modifica, cancellazione, bozze, pulsanti delle azioni. Senza aver scritto una riga di interfaccia utente.

## Ora 3 – La logica di business RAP

### La classe Behavior Pool

Dalla BDEF, con un quick fix (Ctrl+1) ADT genera la classe `ZBP_R_VIAGGIO` con una classe locale handler (`lhc_viaggio`) che contiene un metodo per ogni validazione, determinazione e azione. Il codice si scrive con **EML**.

### EML: Entity Manipulation Language

**EML** è l'estensione di ABAP per leggere e modificare business object RAP. Si usa sia dentro il behavior pool (`IN LOCAL MODE`, salta i controlli di autorizzazione e feature) sia da fuori.

```abap
" Leggere
READ ENTITIES OF zr_viaggio IN LOCAL MODE
  ENTITY Viaggio
    FIELDS ( DataInizio DataFine ) WITH CORRESPONDING #( keys )
  RESULT DATA(lt_viaggi).

" Modificare
MODIFY ENTITIES OF zr_viaggio IN LOCAL MODE
  ENTITY Viaggio
    UPDATE FIELDS ( Stato )
    WITH VALUE #( FOR v IN lt_viaggi ( %tky = v-%tky Stato = 'A' ) ).

" Da un programma esterno: creare e salvare
MODIFY ENTITIES OF zr_viaggio
  ENTITY Viaggio
    CREATE FIELDS ( ClienteId DataInizio DataFine Prezzo Valuta )
    WITH VALUE #( ( %cid = 'V1' ClienteId = '000001' DataInizio = '20261201'
                    DataFine = '20261210' Prezzo = 1500 Valuta = 'EUR' ) )
  MAPPED DATA(ls_mapped)
  FAILED DATA(ls_failed)
  REPORTED DATA(ls_reported).

COMMIT ENTITIES.        " salvataggio (fuori da RAP; dentro RAP lo fa il framework)
```

Componenti speciali con `%`: `%tky` (chiave transazionale, include l'indicatore draft), `%key`, `%cid` (id provvisorio per nuove istanze), `%control`, `%msg`, `%element`, `%is_draft`, `%param`. Le strutture `failed`, `reported`, `mapped` restituiscono errori, messaggi e chiavi assegnate.

### Una validazione

```abap
METHOD validaDate.
  READ ENTITIES OF zr_viaggio IN LOCAL MODE
    ENTITY Viaggio FIELDS ( DataInizio DataFine ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_viaggi).

  LOOP AT lt_viaggi INTO DATA(ls_v).
    APPEND VALUE #( %tky = ls_v-%tky %state_area = 'VALIDA_DATE' ) TO reported-viaggio.

    IF ls_v-DataFine < ls_v-DataInizio.
      APPEND VALUE #( %tky = ls_v-%tky ) TO failed-viaggio.
      APPEND VALUE #( %tky        = ls_v-%tky
                      %state_area = 'VALIDA_DATE'
                      %msg        = new_message_with_text(
                                      severity = if_abap_behv_message=>severity-error
                                      text     = 'La data di fine precede quella di inizio' )
                      %element-DataFine = if_abap_behv=>mk-on ) TO reported-viaggio.
    ENDIF.
  ENDLOOP.
ENDMETHOD.
```

Mettere la chiave in `failed` blocca il salvataggio; il messaggio in `reported` appare all'utente vicino al campo indicato in `%element`. In un progetto reale i testi vengono da una classe di messaggi (eccezione che implementa `IF_ABAP_BEHV_MESSAGE`).

### Una determinazione

```abap
METHOD impostaStatoIniziale.
  READ ENTITIES OF zr_viaggio IN LOCAL MODE
    ENTITY Viaggio FIELDS ( Stato ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_viaggi).
  DELETE lt_viaggi WHERE Stato IS NOT INITIAL.
  CHECK lt_viaggi IS NOT INITIAL.

  MODIFY ENTITIES OF zr_viaggio IN LOCAL MODE
    ENTITY Viaggio UPDATE FIELDS ( Stato )
    WITH VALUE #( FOR v IN lt_viaggi ( %tky = v-%tky Stato = 'O' ) ).   " O = aperto
ENDMETHOD.
```

### Un'azione e il controllo dinamico delle funzioni

```abap
METHOD accetta.
  MODIFY ENTITIES OF zr_viaggio IN LOCAL MODE
    ENTITY Viaggio UPDATE FIELDS ( Stato )
    WITH VALUE #( FOR k IN keys ( %tky = k-%tky Stato = 'A' ) ).

  READ ENTITIES OF zr_viaggio IN LOCAL MODE
    ENTITY Viaggio ALL FIELDS WITH CORRESPONDING #( keys )
    RESULT DATA(lt_viaggi).

  result = VALUE #( FOR v IN lt_viaggi ( %tky = v-%tky %param = v ) ).
ENDMETHOD.

METHOD get_instance_features.
  READ ENTITIES OF zr_viaggio IN LOCAL MODE
    ENTITY Viaggio FIELDS ( Stato ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_viaggi).

  result = VALUE #( FOR v IN lt_viaggi
    ( %tky            = v-%tky
      %action-accetta = COND #( WHEN v-Stato = 'A' THEN if_abap_behv=>fc-o-disabled
                                                   ELSE if_abap_behv=>fc-o-enabled )
      %action-rifiuta = COND #( WHEN v-Stato = 'X' THEN if_abap_behv=>fc-o-disabled
                                                   ELSE if_abap_behv=>fc-o-enabled ) ) ).
ENDMETHOD.
```

### Il ciclo di vita di una transazione RAP

1. **Interaction phase**: l'utente crea/modifica (in draft o direttamente); vengono eseguite determinazioni "on modify" e azioni.
2. **Save sequence**: `finalize` (determinazioni on save) → `check_before_save` (validazioni) → se tutto ok `adjust_numbers` (numerazione tardiva) → `save` → `cleanup`.

In uno scenario **unmanaged** o con **additional save** scrivi tu il codice della save sequence in una classe saver (`lsc_...`), per esempio chiamando una BAPI.

> [!WARNING]
> Nel behavior pool non si usano `COMMIT WORK`, `ROLLBACK WORK`, `CALL TRANSACTION`, `SUBMIT`, messaggi con `MESSAGE` o popup: il framework controlla la transazione e i messaggi passano da `reported`.

### Altri temi RAP da approfondire

- **Business events** (`event` nella BDEF, `RAISE ENTITY EVENT`) per l'integrazione asincrona.
- **Servizi Web API** (binding OData V4 – Web API) per integrazioni senza UI.
- **Side effects**, value help (`@Consumption.valueHelpDefinition`), ricerca.
- **Estensibilità dei BO RAP** (`extend behavior`) e BO standard rilasciati (es. `I_SalesOrderTP`) modificabili con EML.
- **Test**: `cl_botd_txbufdbl_bo_test_env` e `cl_botd_mockemlapi_bo_test_env` per i test double dei BO.

## Ora 4 – Strumenti, progetto finale, carriera

### abapGit e gCTS

- **abapGit** è un client Git open source scritto in ABAP: salva il codice in repository Git (GitHub, GitLab...). Nella versione ADT è integrato in Eclipse e disponibile su BTP. Serve per condividere codice, fare backup, usare progetti open source (es. abap2xlsx) e progetti di esempio di SAP.
- **gCTS** (_git-enabled Change and Transport System_) collega il sistema di trasporto SAP a Git.

### Il progetto finale del corso

Costruisci l'applicazione **"Gestione richieste ferie"** usando tutto ciò che hai imparato:

1. **Dizionario**: tabelle `ZFERIE_RICH` (richiesta) e `ZFERIE_TIPO` (tipi: ferie, permesso, malattia) con elementi dati e domini con valori fissi per lo stato (N nuova, A approvata, R rifiutata).
2. **CDS**: `ZR_RichiestaFerie` (root) con associazione al tipo, campo calcolato "giorni richiesti" (`dats_days_between`).
3. **RAP managed con draft**: validazioni (data fine ≥ inizio, massimo 20 giorni, nessuna sovrapposizione con altre richieste dello stesso dipendente), determinazione (stato iniziale N, dipendente = utente corrente), azioni "Approva" e "Rifiuta" abilitate solo se lo stato è N.
4. **Accessi**: DCL che mostra a ogni utente solo le proprie richieste.
5. **UI**: metadata extension con lista, filtri e pagina di dettaglio; anteprima Fiori Elements.
6. **Test**: classe ABAP Unit per la logica di validazione (estrai i calcoli in una classe separata e testala).
7. **Report classico** (tier 3, per esercizio): report ALV per l'ufficio del personale con le statistiche per tipo e mese (CDS con aggregazioni + `CL_SALV_TABLE`).
8. **Qualità**: ATC senza errori, nomi coerenti, codice formattato.

### Certificazione

La certificazione più rilevante per i nuovi sviluppatori è **SAP Certified Associate – Back-End Developer – ABAP Cloud** (codice esame `C_ABAPD`, il suffisso cambia con le versioni: es. `_2309`, `_2507`). Copre CDS e modellazione dati, RAP, sintassi ABAP moderna, programmazione a oggetti, ABAP SQL ed estensibilità. Verifica sempre sul sito SAP Learning ([learning.sap.com](https://learning.sap.com)) codice attuale, contenuti, durata e prerequisiti, e il percorso di apprendimento gratuito consigliato ("Learning Journey"). Le certificazioni SAP vanno mantenute con un aggiornamento periodico ("Stay certified").

### Risorse per continuare

| Risorsa                                                                | A cosa serve                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Documentazione delle parole chiave ABAP (F1 in ADT/SE80, help.sap.com) | la fonte ufficiale per ogni istruzione, con esempi                             |
| SAP Learning (learning.sap.com)                                        | percorsi gratuiti su ABAP Cloud, RAP, CDS                                      |
| SAP Community (community.sap.com)                                      | blog, domande e risposte                                                       |
| Clean ABAP (GitHub SAP/styleguides)                                    | guida di stile                                                                 |
| Repository GitHub SAP-samples                                          | esempi ufficiali RAP e ABAP Cloud (es. ABAP Flight Reference Scenario `/DMO/`) |
| Programmi demo nel sistema                                             | `DEMO_*`, `SALV_DEMO_*`, `BCALV_*`, classi `CL_DEMO_*` (transazione ABAPDOCU)  |
| SAP BTP trial                                                          | ambiente gratuito per esercitarti con ABAP Cloud                               |

### Il tuo piano dopo il corso

| Periodo       | Obiettivo                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Settimane 4–5 | Rifai tutti gli esercizi senza guardare le soluzioni; completa il progetto finale                            |
| Settimane 6–8 | Studia il Learning Journey ufficiale ABAP Cloud e i progetti di esempio `/DMO/`                              |
| Mesi 3–4      | Leggi codice reale: programmi standard SAP in debug, programmi Z del tuo sistema; prova la certificazione    |
| Continuo      | Un argomento a settimana in profondità (es. IDoc, Adobe Forms, AMDP), sempre con un piccolo progetto pratico |

> [!TIP]
> Imparare ABAP è come imparare a guidare: dopo il corso hai la patente, ma diventi un buon guidatore solo macinando chilometri. Ogni bug che risolvi, ogni dump che leggi, ogni programma standard che debugghi sono chilometri.

## Esercizi

> [!IMPORTANT]
>
> 1. Crea un account SAP BTP trial con ABAP Environment (o usa il tuo sistema S/4HANA recente) e crea la classe console Hello World in ABAP Cloud.
> 2. In un pacchetto con versione di linguaggio "ABAP for Cloud Development", prova a usare `SELECT * FROM mara` e `WRITE`: leggi gli errori e trova il successore rilasciato (es. `I_Product`).
> 3. Crea la tabella `ZVIAGGIO` e usa il generatore "OData UI Service" per creare l'intera app. Avvia l'anteprima Fiori e crea 3 viaggi.
> 4. Aggiungi la validazione sulle date, la determinazione dello stato e le azioni Accetta/Rifiuta con il controllo dinamico delle funzioni.
> 5. Scrivi una classe console che crea un viaggio con EML (`MODIFY ENTITIES` + `COMMIT ENTITIES`) e ne stampa l'esito leggendo `failed`/`reported`.
> 6. Completa il progetto finale "Gestione richieste ferie".

## Quiz

1. Che cos'è il Clean Core?
2. Quali sono i quattro pilastri di ABAP Cloud?
3. Che cosa sono i tier 1, 2 e 3?
4. Quali oggetti compongono un'app RAP, dal database alla UI?
5. Differenza tra managed e unmanaged?
6. Differenza tra validazione e determinazione?
7. A che cosa servono `failed` e `reported`?
8. Perché nel behavior pool non si scrive `COMMIT WORK`?

## Soluzioni

```abap
CLASS zcl_crea_viaggio DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_crea_viaggio IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    MODIFY ENTITIES OF zr_viaggio
      ENTITY Viaggio
        CREATE FIELDS ( ClienteId DataInizio DataFine Prezzo Valuta Descrizione )
        WITH VALUE #( ( %cid = 'V1' ClienteId = '000001'
                        DataInizio = '20261201' DataFine = '20261210'
                        Prezzo = 1500 Valuta = 'EUR' Descrizione = 'Viaggio di prova' ) )
      MAPPED DATA(ls_mapped)
      FAILED DATA(ls_failed)
      REPORTED DATA(ls_reported).

    IF ls_failed IS NOT INITIAL.
      out->write( 'Creazione fallita' ).
      RETURN.
    ENDIF.

    COMMIT ENTITIES RESPONSE OF zr_viaggio
      FAILED DATA(ls_commit_failed)
      REPORTED DATA(ls_commit_reported).

    IF ls_commit_failed IS INITIAL.
      out->write( 'Viaggio creato e salvato' ).
    ELSE.
      LOOP AT ls_commit_reported-viaggio INTO DATA(ls_rep).
        out->write( ls_rep-%msg->if_message~get_text( ) ).
      ENDLOOP.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

Quiz:

1. La strategia di mantenere il nucleo SAP non modificato, estendendolo solo tramite interfacce stabili e rilasciate, così gli aggiornamenti non rompono il codice custom.
2. Linguaggio ABAP per la cloud, solo API rilasciate, Eclipse ADT, RAP.
3. Tier 1: sviluppi ABAP Cloud; tier 2: wrapper che rilasciano oggetti classici per il tier 1; tier 3: ABAP classico esistente.
4. Tabella → CDS root (e figlie) → behavior definition + behavior pool → proiezione CDS + BDEF di proiezione + metadata extension → service definition → service binding → app Fiori Elements.
5. Managed: il framework gestisce operazioni standard e salvataggio; unmanaged: li implementi tu (es. riusando BAPI esistenti).
6. La validazione controlla e può bloccare il salvataggio; la determinazione calcola o imposta valori in automatico.
7. `failed` indica le istanze per cui l'operazione è fallita; `reported` contiene i messaggi da mostrare.
8. Perché la transazione è gestita dal framework RAP, che esegue la save sequence e il commit al momento giusto.

> [!NOTE]
> Complimenti: hai completato il corso intensivo ABAP! In 15 giorni sei passato dal primo `WRITE` fino a RAP e ABAP Cloud: sistema SAP, sintassi, tipi, tabelle interne, Dizionario Dati, SQL, modularizzazione, report, ALV, Dynpro, oggetti, eccezioni, ABAP moderno, test, enhancement, interfacce, stampe, CDS, HANA e RAP. Ora si guida: buon lavoro!
