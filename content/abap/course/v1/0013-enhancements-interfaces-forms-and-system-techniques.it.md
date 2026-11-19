---
title: Enhancement, interfacce, stampe e tecniche di sistema
description: Estendere lo standard SAP, scambiare dati con altri sistemi, produrre documenti.
---

_Settimana 3 · Livello avanzato · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Ora 1  | Estendere SAP: modifiche, user exit, customer exit, BTE, append, BAdI classici e nuovi, enhancement implicito/esplicito |
| Ora 2  | Interfacce: RFC/BAPI, IDoc e ALE, batch input (BDC), servizi web SOAP e REST, OData con SEGW                            |
| Ora 3  | Moduli di stampa: SAPscript, SmartForms, Adobe Forms; e-mail con `CL_BCS`                                               |
| Ora 4  | Blocchi (`ENQUEUE`), update task, intervalli di numerazione, elaborazione parallela, testi lunghi, change document      |

## Ora 1 – Estendere lo standard SAP

Le aziende quasi sempre hanno bisogno di adattare SAP: un controllo in più al salvataggio di un ordine, un campo aggiuntivo, un calcolo diverso. **Non si modifica il codice SAP** (sarebbe sovrascritto agli aggiornamenti): si usano i **punti di estensione** previsti.

> [!TIP]
> SAP è come un appartamento in affitto arredato. Non puoi abbattere i muri (modificare lo standard), ma il proprietario ha previsto dei ganci e delle prese (punti di estensione) dove puoi appendere quadri e attaccare elettrodomestici tuoi. Quando il proprietario rinnova l'appartamento (upgrade), i tuoi quadri restano al loro posto.

### La scala delle tecniche (dalla più vecchia alla più moderna)

| Tecnica                                                                | Come funziona                                                                           | Dove si trova                              |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------ |
| Modifica (_modification_)                                              | cambi il codice SAP con una chiave di accesso (SSCR)                                    | Modification Assistant; da evitare         |
| User exit                                                              | `FORM` vuoti `USEREXIT_...` in include SAP modificabili (soprattutto SD)                | es. `MV45AFZZ` per gli ordini di vendita   |
| Customer exit                                                          | FM `EXIT_<prog>_<nnn>` che chiamano un include `ZX...`; si attivano tramite un progetto | SMOD (esplora), CMOD (progetto)            |
| Business Transaction Event (BTE)                                       | FM richiamati in punti di FI                                                            | FIBF                                       |
| Append structure / Customizing include                                 | campi aggiuntivi in tabelle e strutture standard                                        | SE11                                       |
| BAdI classico                                                          | interfaccia + classe di implementazione                                                 | SE18 (definizione), SE19 (implementazione) |
| Enhancement Framework: BAdI nuovo (kernel BAdI)                        | come il classico ma più veloce, integrato                                               | SE18/SE19, `GET BADI` / `CALL BADI`        |
| Enhancement point/section esplicito                                    | punti previsti da SAP nel codice dove inserire codice                                   | SE80/ADT: Enhance                          |
| Enhancement implicito                                                  | all'inizio e alla fine di ogni `FORM`, FM, metodo, include, struttura                   | SE80/ADT                                   |
| Key user extensibility / Developer extensibility (S/4HANA, ABAP Cloud) | campi e logiche custom tramite app Fiori o BAdI rilasciati                              | app "Custom Fields", "Custom Logic"        |

### Customer exit: esempio

1. **SMOD**: cerca l'enhancement (es. `V45A0002` per ordini, o filtra per pacchetto della transazione).
2. **CMOD**: crea un progetto `ZPROGETTO`, assegna l'enhancement.
3. Doppio clic sul componente (es. `EXIT_SAPMV45A_002`): dentro c'è `INCLUDE ZXVVAU...`. Doppio clic e crea l'include.
4. Scrivi il codice usando i parametri del FM.
5. **Attiva il progetto** (senza attivazione il codice non viene eseguito).

### BAdI: il modo standard moderno

Un **BAdI** (_Business Add-In_) è un punto di estensione a oggetti: SAP definisce un'interfaccia e chiama i suoi metodi in un certo punto del programma; tu crei una classe di implementazione. È il polimorfismo del giorno 10 applicato alle estensioni.

Come trovare il BAdI giusto:

- In SE18 cerca per nome/pacchetto della transazione.
- Metti un breakpoint nel metodo `GET_INSTANCE` della classe `CL_EXITHANDLER` (BAdI classici) o un breakpoint sull'istruzione `GET BADI` / `CALL BADI` (nuovi), poi esegui la transazione.
- Cerca nei siti di documentazione e nelle note SAP.

Implementare un BAdI nuovo:

1. SE19 → "Create Implementation" → Enhancement Spot (es. `BADI_SD_SALES`) → nome implementazione enhancement `ZEI_ORDINI`.
2. Crea l'implementazione BAdI (`ZBI_ORDINI`) e la classe (`ZCL_BI_ORDINI`).
3. Implementa i metodi dell'interfaccia.
4. Se il BAdI ha un filtro (es. paese, società), imposta i valori per cui l'implementazione deve scattare.
5. Attiva.

```abap
" Il BAdI nel codice SAP (lato chiamante)
DATA lo_badi TYPE REF TO zbadi_controllo_prezzo.
GET BADI lo_badi FILTERS land1 = ls_cliente-land1.
CALL BADI lo_badi->controlla EXPORTING is_ordine   = ls_ordine
                             CHANGING  ct_messaggi = lt_msg.

" La tua implementazione
CLASS zcl_bi_controllo_prezzo IMPLEMENTATION.
  METHOD zif_badi_controllo_prezzo~controlla.
    IF is_ordine-netwr > 100000.
      APPEND VALUE #( type = 'W' message = 'Ordine sopra 100.000: verifica' ) TO ct_messaggi.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

Puoi anche definire BAdI tuoi per rendere estensibili i tuoi programmi (Enhancement Spot + definizione BAdI + interfaccia). Un BAdI può essere a uso singolo o multiplo (più implementazioni attive), e avere un'implementazione di fallback.

### Enhancement implicito ed esplicito

In SE80 o ADT apri un oggetto standard e scegli **Enhance** (icona spirale, Shift+F4). Appaiono i punti di aggancio:

```abap
ENHANCEMENT 1 ZEI_MIO_CONTROLLO.    "active version
  IF vbak-auart = 'ZOR' AND vbak-kunnr IS INITIAL.
    MESSAGE e010(zcorso).
  ENDIF.
ENDENHANCEMENT.
```

> [!WARNING]
> Gli enhancement impliciti sono molto potenti ma fragili: dipendono da variabili interne del programma SAP che possono cambiare a un aggiornamento. Preferisci sempre, nell'ordine: **BAdI → enhancement esplicito → customer/user exit → implicito → modifica**.

### Aggiungere campi a tabelle standard

- **Append structure**: in SE11 apri la tabella standard (es. `VBAK`) → Append Structure → crea `ZAVBAK` con campi che iniziano con `ZZ` (es. `ZZPROGETTO`). Il campo si aggiunge alla tabella senza modificarla.
- **Customizing include** (`CI_...`): include previsti da SAP in certe strutture, da riempire con i tuoi campi.

## Ora 2 – Interfacce con altri sistemi

| Tecnologia         | Tipo                             | Uso tipico                                                                            |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------- |
| RFC / BAPI         | sincrono (o tRFC/qRFC asincrono) | SAP ↔ SAP, SAP ↔ sistemi con connettori (Java, .NET, Python)                          |
| IDoc / ALE         | asincrono, documenti strutturati | scambio documenti (ordini, fatture, anagrafiche) con partner o altri sistemi SAP; EDI |
| Batch input (BDC)  | simula l'utente sulle schermate  | migrazioni e caricamenti dove non esiste una BAPI                                     |
| File (CSV, XML)    | asincrono                        | scambi semplici, sistemi legacy                                                       |
| Web service SOAP   | sincrono                         | integrazioni enterprise, SAP PI/PO                                                    |
| REST / HTTP / JSON | sincrono                         | API moderne, sistemi cloud                                                            |
| OData              | REST standardizzato              | app Fiori, integrazioni moderne                                                       |

### IDoc e ALE

Un **IDoc** (_Intermediate Document_) è un documento elettronico strutturato in segmenti (testata, posizioni...), con un numero univoco e uno stato.

> [!TIP]
> L'IDoc è come un pacco postale standard: ha l'etichetta del mittente e del destinatario (record di controllo), il contenuto ordinato in scatole numerate (segmenti) e il codice di tracciamento con lo stato della spedizione (record di stato).

Concetti e transazioni:

| Concetto                                                  | Transazione                         |
| --------------------------------------------------------- | ----------------------------------- |
| Tipo di base IDoc (struttura, es. `ORDERS05`) e segmenti  | WE30 / WE31                         |
| Estensione di un tipo IDoc (segmenti Z)                   | WE30                                |
| Tipo messaggio (es. `ORDERS`)                             | WE81 / WE82                         |
| Porte (file, tRFC, XML)                                   | WE21                                |
| Accordi partner (chi riceve cosa, come)                   | WE20                                |
| Monitor IDoc                                              | WE02 / WE05 / BD87 (rielaborazione) |
| Modello di distribuzione ALE                              | BD64                                |
| Codici di processo (quale FM elabora un IDoc in ingresso) | WE42                                |

Stati importanti: in uscita **03** (passato alla porta), 12, 02/29 (errori); in ingresso **64** (pronto), **53** (elaborato con successo), **51** (errore applicativo).

Per un IDoc in uscita da programma si usa il FM `MASTER_IDOC_DISTRIBUTE`; per l'ingresso si scrive un FM con l'interfaccia standard (modello `IDOC_INPUT_ORDERS`) e lo si registra con un codice di processo.

### Batch input (BDC)

Il **batch input** simula un utente che compila le schermate di una transazione. Si registra una sessione con **SHDB** (registratore di transazioni), che genera anche un programma di esempio.

```abap
DATA lt_bdc TYPE STANDARD TABLE OF bdcdata WITH EMPTY KEY.
DATA lt_msg TYPE STANDARD TABLE OF bdcmsgcoll WITH EMPTY KEY.

lt_bdc = VALUE #(
  ( program = 'SAPMF02D' dynpro = '0101' dynbegin = 'X' )
  ( fnam = 'RF02D-KUNNR' fval = '0000001000' )
  ( fnam = 'BDC_OKCODE'  fval = '/00' )
  " ... altre schermate e campi registrati con SHDB
).

CALL TRANSACTION 'XD02' WITH AUTHORITY-CHECK USING lt_bdc
     OPTIONS FROM VALUE ctu_params( dismode = 'N' updmode = 'S' )   " N = senza schermo, A = tutte le schermate, E = solo errori
     MESSAGES INTO lt_msg.
```

In alternativa si crea una sessione (FM `BDC_OPEN_GROUP`, `BDC_INSERT`, `BDC_CLOSE_GROUP`) elaborata poi in SM35. Il batch input è fragile (dipende dal layout delle schermate) e non funziona con i controlli moderni: usalo solo se non esiste una BAPI o un'API. In S/4HANA per le migrazioni si usa il **Migration Cockpit** (LTMC/app Fiori); il vecchio LSMW è ancora presente in ECC.

### Servizi web e REST

**Fornire un servizio SOAP**: da un FM abilitato RFC o da una classe si genera un servizio web (Enterprise Service, SE80 → Service Provider), configurato in **SOAMANAGER**.

**Consumare un servizio SOAP**: si genera un proxy client da un WSDL (SE80/ADT → Service Consumer), poi si configura la porta logica in SOAMANAGER.

**Chiamare un'API REST** (classe `cl_http_client`, o in ABAP Cloud `cl_web_http_client_manager`):

```abap
cl_http_client=>create_by_destination(
  EXPORTING destination = 'Z_API_METEO'          " destinazione HTTP in SM59 (tipo G)
  IMPORTING client      = DATA(lo_http) ).

lo_http->request->set_method( 'GET' ).
cl_http_utility=>set_request_uri( request = lo_http->request
                                  uri     = '/v1/previsioni?citta=Roma' ).
lo_http->send( ).
lo_http->receive( ).
lo_http->response->get_status( IMPORTING code = DATA(lv_code) ).
DATA(lv_json) = lo_http->response->get_cdata( ).
lo_http->close( ).

" Convertire JSON ↔ ABAP
TYPES: BEGIN OF ty_meteo, citta TYPE string, temperatura TYPE decfloat34, END OF ty_meteo.
DATA ls_meteo TYPE ty_meteo.
/ui2/cl_json=>deserialize( EXPORTING json        = lv_json
                                     pretty_name = /ui2/cl_json=>pretty_mode-camel_case
                           CHANGING  data        = ls_meteo ).
DATA(lv_out) = /ui2/cl_json=>serialize( data = ls_meteo ).
```

Alternative per JSON/XML: `CALL TRANSFORMATION id SOURCE ... RESULT XML ...` (anche per JSON con writer `cl_sxml_string_writer=>create( type = if_sxml=>co_xt_json )`), le trasformazioni XSLT e Simple Transformation (STRANS), e in ABAP Cloud la classe `xco_cp_json`.

**Fornire un servizio REST/HTTP**: una classe che implementa `IF_HTTP_EXTENSION` (metodo `handle_request`) registrata in **SICF**.

### OData con SEGW (Gateway)

**OData** è un protocollo REST standard (entità, collezioni, filtri `$filter`, `$top`, `$expand`), usato da tutte le app Fiori. Nel modello classico (SAP Gateway):

1. **SEGW**: crea un progetto, definisci le entità (es. Volo) importandole da una struttura DDIC, e gli entity set.
2. Genera le classi: **MPC** (_Model Provider_, il modello) e **DPC** (_Data Provider_). Il codice va nelle classi di estensione `..._MPC_EXT` e `..._DPC_EXT`.
3. Ridefinisci i metodi `<entityset>_GET_ENTITYSET` (lista), `_GET_ENTITY` (dettaglio), `_CREATE_ENTITY`, `_UPDATE_ENTITY`, `_DELETE_ENTITY`.
4. Registra il servizio in `/IWFND/MAINT_SERVICE` e provalo con `/IWFND/GW_CLIENT`.

```abap
METHOD voliset_get_entityset.
  SELECT carrid, connid, cityfrom, cityto FROM spfli
    INTO CORRESPONDING FIELDS OF TABLE @et_entityset.
ENDMETHOD.
```

Oggi per i nuovi servizi SAP raccomanda **RAP** (giorno 15), che genera l'OData automaticamente dalle CDS. SEGW resta diffusissimo nei sistemi esistenti.

## Ora 3 – Moduli di stampa ed e-mail

| Tecnologia                               | Caratteristiche                                                    | Transazione |
| ---------------------------------------- | ------------------------------------------------------------------ | ----------- |
| SAPscript                                | la più vecchia, finestre e paragrafi, programma di stampa separato | SE71        |
| SmartForms                               | grafica, genera un FM, ancora molto usata                          | SMARTFORMS  |
| Adobe Forms (Interactive Forms by Adobe) | PDF, layout con Adobe LiveCycle Designer, richiede ADS             | SFP         |
| Output management S/4HANA                | Adobe Forms con modelli gestiti da Fiori, BRF+ per le regole       | app Fiori   |

> [!TIP]
> Il modulo di stampa è lo stampo, il programma di stampa è chi versa l'impasto (i dati). Lo stesso stampo (modulo fattura) produce migliaia di fatture diverse.

### SmartForms: i passi

1. **SMARTFORMS** → crea `ZSF_ORDINE`.
2. **Interfaccia del modulo**: parametri di import (es. testata ordine) e tabelle (posizioni).
3. **Definizioni globali**: variabili, tipi, inizializzazione.
4. **Pagine e finestre**: finestra principale (`MAIN`, scorre su più pagine) e finestre secondarie (logo, indirizzo, piè di pagina).
5. **Nodi**: testi, grafici (logo caricato con SE78), tabelle, loop, condizioni.
6. **Stili** (SMARTSTYLES): caratteri, paragrafi.
7. **Attiva**: SAP genera un modulo funzione con un nome tecnico che cambia tra sistemi. Per questo il programma di stampa recupera il nome a runtime:

```abap
DATA lv_fm TYPE rs38l_fnam.
CALL FUNCTION 'SSF_FUNCTION_MODULE_NAME'
  EXPORTING formname = 'ZSF_ORDINE'
  IMPORTING fm_name  = lv_fm.

CALL FUNCTION lv_fm
  EXPORTING
    control_parameters = VALUE ssfctrlop( no_dialog = abap_true preview = abap_true )
    output_options     = VALUE ssfcompop( tddest = 'LP01' )
    is_testata         = ls_testata
  TABLES
    it_posizioni       = lt_posizioni
  EXCEPTIONS
    OTHERS             = 1.
```

### Adobe Forms: i passi

1. **SFP**: crea l'interfaccia (parametri, come per SmartForms) e il modulo (contesto: quali dati passano al layout).
2. Disegna il layout con Adobe LiveCycle Designer (integrato in SFP).
3. Nel programma: `FP_FUNCTION_MODULE_NAME` per il nome del FM, `FP_JOB_OPEN`, chiamata del FM, `FP_JOB_CLOSE`. Con `getpdf = abap_true` nei parametri ottieni il PDF come `xstring` (da salvare o inviare via mail).

### Inviare e-mail con CL_BCS

```abap
TRY.
    DATA(lo_send) = cl_bcs=>create_persistent( ).
    DATA(lt_testo) = VALUE soli_tab( ( line = 'Buongiorno,' )
                                     ( line = 'in allegato il report dei voli.' ) ).
    DATA(lo_doc) = cl_document_bcs=>create_document(
                     i_type = 'RAW' i_text = lt_testo i_subject = 'Report voli' ).

    " allegato PDF (lv_pdf = xstring)
    lo_doc->add_attachment( i_attachment_type    = 'PDF'
                            i_attachment_subject = 'voli.pdf'
                            i_att_content_hex    = cl_bcs_convert=>xstring_to_solix( lv_pdf ) ).

    lo_send->set_document( lo_doc ).
    lo_send->add_recipient( cl_cam_address_bcs=>create_internet_address( 'utente@example.com' ) ).
    lo_send->set_send_immediately( abap_true ).
    lo_send->send( ).
    COMMIT WORK.                       " senza COMMIT la mail non parte!
  CATCH cx_bcs INTO DATA(lx_bcs).
    MESSAGE lx_bcs->get_text( ) TYPE 'I'.
ENDTRY.
```

La coda di invio si controlla in **SOST**. Le versioni recenti offrono anche `cl_bcs_mail_message` (più semplice).

## Ora 4 – Tecniche di sistema

### Blocchi logici (ENQUEUE / DEQUEUE)

Ricordi gli oggetti di blocco del giorno 4? Ecco come si usano. Prima di modificare un record lo blocchi; se un altro utente lo ha già bloccato, ricevi un errore.

```abap
CALL FUNCTION 'ENQUEUE_EZORDINI_CORSO'     " generato dall'oggetto di blocco EZORDINI_CORSO
  EXPORTING
    mode_zordini_corso = 'E'               " E = esclusivo (scrittura), S = condiviso (lettura)
    mandt              = sy-mandt
    ordine             = lv_ordine
  EXCEPTIONS
    foreign_lock       = 1                 " bloccato da un altro utente (sy-msgv1 = utente)
    system_failure     = 2
    OTHERS             = 3.
IF sy-subrc <> 0.
  MESSAGE |Ordine bloccato da { sy-msgv1 }| TYPE 'E'.
ENDIF.

" ... leggi, modifica, salva ...

CALL FUNCTION 'DEQUEUE_EZORDINI_CORSO'
  EXPORTING mode_zordini_corso = 'E' mandt = sy-mandt ordine = lv_ordine.
```

> [!TIP]
> Il blocco è come il cartello "occupato" sulla porta del bagno: non chiude a chiave fisicamente il database (è un blocco logico), ma tutti i programmi ben educati lo leggono e aspettano.

I blocchi vengono rilasciati automaticamente alla fine del programma o, con `_scope = '2'`, alla fine dell'update task. Si vedono in **SM12**.

### Update task

I moduli funzione di aggiornamento (attributo "Modulo di aggiornamento") non vengono eseguiti subito, ma registrati e poi eseguiti tutti insieme al `COMMIT WORK` da un processo dedicato (V1 = urgente, V2 = statistiche). Così una transazione con più schermate scrive tutto in una LUW.

```abap
CALL FUNCTION 'Z_SALVA_ORDINE' IN UPDATE TASK
  EXPORTING is_ordine = ls_ordine.
" ... altre registrazioni ...
COMMIT WORK.       " ora vengono eseguiti tutti
```

Gli errori dell'update si vedono in **SM13**. Dentro un update FM non si fanno `COMMIT`, popup o messaggi di dialogo.

### Intervalli di numerazione

Per generare numeri progressivi univoci (es. numero ordine) si usa un **oggetto di intervallo di numerazione** (transazione **SNRO**) e il FM `NUMBER_GET_NEXT` (in ABAP Cloud: `cl_numberrange_runtime=>number_get`).

```abap
CALL FUNCTION 'NUMBER_GET_NEXT'
  EXPORTING  nr_range_nr = '01' object = 'ZORDINE'
  IMPORTING  number      = lv_numero
  EXCEPTIONS OTHERS      = 1.
```

> [!WARNING]
> Mai generare numeri con `SELECT MAX( ) + 1`: due utenti contemporanei otterrebbero lo stesso numero.

### Elaborazione parallela

Per elaborare milioni di record più in fretta si dividono in blocchi elaborati in parallelo da più processi:

- `CALL FUNCTION ... STARTING NEW TASK ... DESTINATION IN GROUP DEFAULT` con un metodo di ricezione dei risultati (`CALLING ... ON END OF TASK`, `RECEIVE RESULTS FROM FUNCTION`), e `WAIT FOR ASYNCHRONOUS TASKS UNTIL ...`;
- più job in background (`SUBMIT VIA JOB`);
- framework moderni: `cl_abap_parallel`, bgPF (_Background Processing Framework_) in ABAP Cloud.

### Testi lunghi e change document

- **Testi lunghi** (note sugli ordini, sui materiali): FM `READ_TEXT`, `SAVE_TEXT`, `CREATE_TEXT`; identificati da oggetto, ID, nome, lingua (li trovi con l'editor di testi: Vai a → Testata).
- **Change document**: registrano chi ha cambiato cosa e quando. Si definisce un oggetto in **SCDO**, che genera un FM `<oggetto>_WRITE_DOCUMENT`; i dati finiscono nelle tabelle `CDHDR`/`CDPOS` e si leggono con `CHANGEDOCUMENT_READ`.

### Strumenti di sistema da conoscere

| Transazione | Uso                                                   |
| ----------- | ----------------------------------------------------- |
| SM50 / SM66 | processi di lavoro attivi (locale / tutto il sistema) |
| SM21        | log di sistema                                        |
| SM04        | utenti collegati                                      |
| ST22        | dump                                                  |
| SM12 / SM13 | blocchi / update                                      |
| SM35        | sessioni batch input                                  |
| SM36 / SM37 | job                                                   |
| SM59        | destinazioni RFC/HTTP                                 |
| SOAMANAGER  | servizi web                                           |
| SICF        | servizi HTTP                                          |
| SLG1        | log applicativi                                       |
| SE03 / SE09 | strumenti di trasporto                                |
| SNOTE       | applicare note SAP (correzioni)                       |
| SPAU / SPDD | adattare modifiche e dizionario dopo un upgrade       |

## Esercizi

> [!IMPORTANT]
>
> 1. Trova con SE18 o con il debugger un BAdI richiamato durante il salvataggio di un ordine di vendita (VA01/VA02) o di un'anagrafica cliente. Leggi la documentazione dell'interfaccia.
> 2. Crea un tuo Enhancement Spot con un BAdI `ZBADI_SCONTO` (metodo `calcola` con parametro `CHANGING importo`), un'implementazione di fallback e due implementazioni filtrate per paese. Chiamalo da un report con `GET BADI` / `CALL BADI`.
> 3. Crea un'append structure su una tua tabella o su una tabella di test con un campo `ZZ` e verificane la presenza in SE11.
> 4. Registra con SHDB la modifica di un dato semplice e genera il programma. Studia la tabella `BDCDATA` prodotta.
> 5. Chiama un'API REST pubblica (se il tuo sistema ha accesso a Internet e una destinazione SM59) e deserializza il JSON con `/ui2/cl_json`.
> 6. Crea un oggetto di blocco per `ZORDINI_CORSO` e prova il blocco aprendo il programma in due sessioni contemporaneamente. Guarda SM12.
> 7. Crea uno SmartForm semplice con logo, indirizzo e tabella delle posizioni, e il relativo programma di stampa con anteprima.

## Quiz

1. Perché non si modificano gli oggetti standard SAP?
2. Differenza tra customer exit e BAdI?
3. Come si trova un BAdI usato da una transazione?
4. Che cos'è un IDoc e quali sono le sue tre parti?
5. Quando si usa il batch input?
6. Che cosa genera SEGW?
7. Perché si usa `SSF_FUNCTION_MODULE_NAME`?
8. Perché non usare `SELECT MAX( ) + 1` per i numeri progressivi?

## Soluzioni

1. Perché verrebbero sovrascritti o andrebbero adattati a ogni aggiornamento e SAP non garantirebbe il supporto; si usano i punti di estensione.
2. Il customer exit è un FM con include Z attivato tramite progetto CMOD, una sola implementazione; il BAdI è basato su interfaccia e classi, supporta filtri, implementazioni multiple ed è la tecnica moderna.
3. Breakpoint su `GET BADI`/`CALL BADI` (o su `CL_EXITHANDLER=>GET_INSTANCE` per i classici), oppure ricerca in SE18/SE84 per pacchetto.
4. Un documento elettronico strutturato per lo scambio asincrono: record di controllo, segmenti di dati, record di stato.
5. Quando non esiste una BAPI/API per caricare i dati e bisogna simulare l'input sulle schermate.
6. Le classi MPC (modello) e DPC (fornitura dati) di un servizio OData, con le relative classi `_EXT` da ridefinire.
7. Perché il nome del FM generato cambia da sistema a sistema.
8. Perché due utenti contemporanei potrebbero ottenere lo stesso numero; gli intervalli di numerazione lo evitano.

> [!NOTE]
> Oggi hai imparato: tutte le tecniche di estensione (exit, BTE, append, BAdI, enhancement), le interfacce (RFC, BAPI, IDoc/ALE, batch input, SOAP, REST/JSON, OData SEGW), i moduli di stampa (SAPscript, SmartForms, Adobe), le e-mail, i blocchi, l'update task, i numeri progressivi, l'elaborazione parallela e gli strumenti di sistema. Domani: SAP HANA e le CDS view.
