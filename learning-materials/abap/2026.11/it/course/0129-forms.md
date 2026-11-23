---
title: Smart Forms e Adobe Forms
description: Stampare fatture, etichette e altri documenti.
level: pro
---

Prima o poi ogni progetto SAP deve stampare qualcosa: una fattura, una bolla di consegna, un'etichetta di spedizione, una carta d'imbarco. SAP offre tre tecnologie di moduli di stampa. Qui vedi che cosa è ognuna, come un **programma di stampa** chiama un modulo e come ottenere un PDF invece di una stampa.

Il layout si disegna in editor grafici, quindi la lezione si concentra sul lato ABAP: l'interfaccia del modulo e le chiamate che la riempiono.

## Tre tecnologie di stampa

| Tecnologia                                   | Editor       | Output                          | Stato                                                            |
| -------------------------------------------- | ------------ | ------------------------------- | ---------------------------------------------------------------- |
| SAPscript                                    | `SE71`       | OTF, spool                      | obsoleto; c'è ancora dietro molti moduli standard                |
| Smart Forms                                  | `SMARTFORMS` | OTF, spool, PDF con conversione | ancora molto usato in ECC e S/4HANA                              |
| Adobe Forms (SAP Interactive Forms by Adobe) | `SFP`        | PDF                             | la scelta strategica; richiede gli Adobe Document Services (ADS) |

Tutte e tre seguono la stessa idea: il modulo definisce il **layout**, e un programma di stampa legge i dati e li passa al modulo. Il modulo non seleziona dati dal database per conto suo (potrebbe, ma non dovrebbe).

> [!TIP]
> Un modulo è come un modello prestampato in tipografia: tu porti testi e numeri, la tipografia li mette nelle caselle giuste. Il programma di stampa sei tu, che raccogli il contenuto prima di entrare.

In S/4HANA i documenti standard, come le fatture, usano l'**output management** con Adobe Forms e regole BRF+ che decidono quale modulo va a chi. In ABAP Cloud usi il servizio Adobe Forms tramite API rilasciate. Entrambi si basano sugli stessi concetti Adobe che vedi sotto.

## Smart Forms

Nella transazione `SMARTFORMS` crei un modulo, per esempio `ZSF_FLIGHT_LIST`. Le parti principali sono:

- **Interfaccia del modulo**: i parametri di import, per esempio `IS_CARRIER` (una struttura di tipo `SCARR`) e `IT_FLIGHTS` (un tipo tabella di righe `SFLIGHT`).
- **Definizioni globali**: variabili, tipi e codice di inizializzazione usati dentro il modulo.
- **Pagine e finestre**: una **finestra principale** (_main window_) che scorre su più pagine (l'elenco delle posizioni) e **finestre secondarie** in posizione fissa (logo, indirizzo, piè di pagina).
- **Nodi**: testi, grafiche, indirizzi e nodi **tabella** che scorrono una tabella interna riga per riga.

Quando attivi il modulo, il sistema genera un modulo funzione con un nome tecnico come `/1BCDWB/SF00000042`. Il nome cambia da sistema a sistema, quindi non scriverlo mai nel codice: chiedilo a `SSF_FUNCTION_MODULE_NAME`.

```abap
DATA lv_fm_name TYPE rs38l_fnam.
DATA ls_control TYPE ssfctrlop.     " parametri di controllo
DATA ls_options TYPE ssfcompop.     " opzioni di output

SELECT SINGLE * FROM scarr WHERE carrid = 'LH' INTO @DATA(ls_carrier).
SELECT * FROM sflight WHERE carrid = 'LH' INTO TABLE @DATA(lt_flights).

CALL FUNCTION 'SSF_FUNCTION_MODULE_NAME'
  EXPORTING
    formname           = 'ZSF_FLIGHT_LIST'
  IMPORTING
    fm_name            = lv_fm_name
  EXCEPTIONS
    no_form            = 1
    no_function_module = 2
    OTHERS             = 3.
IF sy-subrc <> 0.
  MESSAGE 'Modulo ZSF_FLIGHT_LIST non trovato' TYPE 'E'.
ENDIF.

ls_control-no_dialog = abap_true.   " nessuna finestra di stampa
ls_control-preview   = abap_true.   " mostra l'anteprima di stampa
ls_options-tddest    = 'LP01'.      " dispositivo di output

CALL FUNCTION lv_fm_name
  EXPORTING
    control_parameters = ls_control
    output_options     = ls_options
    user_settings      = space
    is_carrier         = ls_carrier  " interfaccia del modulo
    it_flights         = lt_flights  " interfaccia del modulo
  EXCEPTIONS
    formatting_error   = 1
    internal_error     = 2
    send_error         = 3
    user_canceled      = 4
    OTHERS             = 5.
```

Per ottenere un PDF invece di una stampa, imposta `ls_control-getotf = abap_true`, leggi il parametro `job_output_info` (tipo `SSFCRESCL`) e converti la sua tabella `otfdata` con il modulo funzione `CONVERT_OTF` e il formato `'PDF'`. È il modo classico per allegare uno Smart Form a una [email](./0119-sending-email.md).

## Adobe Forms

Nella transazione `SFP` crei due oggetti:

1. Un'**interfaccia** con i parametri di import, come l'interfaccia degli Smart Forms. Scegli il tipo basato sul Dizionario ABAP.
2. Un **modulo** che usa l'interfaccia. Il suo **contesto** decide quali dati dell'interfaccia arrivano al layout, e il **layout** si disegna in Adobe LiveCycle Designer, che si apre da `SFP`.

Il PDF vero e proprio lo produce **Adobe Document Services (ADS)**, un componente separato che il team Basis deve configurare. Senza ADS la chiamata fallisce a runtime.

Il programma di stampa segue sempre gli stessi quattro passi: apri un job di stampa, ottieni il nome del modulo funzione generato, chiamalo, chiudi il job.

```abap
DATA ls_outparams  TYPE sfpoutputparams.
DATA ls_docparams  TYPE sfpdocparams.
DATA ls_formoutput TYPE fpformoutput.
DATA lv_fm_name    TYPE funcname.

ls_outparams-nodialog = abap_true.
ls_outparams-getpdf   = abap_true.   " restituisce il PDF invece di stampare

CALL FUNCTION 'FP_JOB_OPEN'
  CHANGING
    ie_outputparams = ls_outparams
  EXCEPTIONS
    cancel          = 1
    usage_error     = 2
    system_error    = 3
    internal_error  = 4
    OTHERS          = 5.

TRY.
    CALL FUNCTION 'FP_FUNCTION_MODULE_NAME'
      EXPORTING
        i_name     = 'ZAF_FLIGHT_LIST'
      IMPORTING
        e_funcname = lv_fm_name.
  CATCH cx_fp_api_repository cx_fp_api_usage cx_fp_api_internal INTO DATA(lx_fp).
    MESSAGE lx_fp->get_text( ) TYPE 'E'.
ENDTRY.

ls_docparams-langu = sy-langu.

CALL FUNCTION lv_fm_name
  EXPORTING
    /1bcdwb/docparams  = ls_docparams
    is_carrier         = ls_carrier
    it_flights         = lt_flights
  IMPORTING
    /1bcdwb/formoutput = ls_formoutput
  EXCEPTIONS
    usage_error        = 1
    system_error       = 2
    internal_error     = 3
    OTHERS             = 4.

CALL FUNCTION 'FP_JOB_CLOSE'
  EXCEPTIONS
    usage_error    = 1
    system_error   = 2
    internal_error = 3
    OTHERS         = 4.

" ls_formoutput-pdf è un xstring con il documento PDF
```

Con `getpdf` disattivato e `ls_outparams-dest` impostato su una stampante, lo stesso codice manda il documento nello spool.

> [!WARNING]
> Tieni la selezione dei dati nel programma di stampa, non nel modulo. Il codice nascosto nei nodi del modulo è difficile da trovare, difficile da testare e gira di nuovo ogni volta che il modulo viene prodotto.

## Esercizio

> [!IMPORTANT]
>
> 1. In `SMARTFORMS` crea `ZSF_FLIGHT_LIST` con l'interfaccia `IS_CARRIER` e `IT_FLIGHTS`, una finestra secondaria con il nome della compagnia e un nodo tabella con data, prezzo e valuta di ogni volo.
> 2. Scrivi un report che legge la compagnia `LH` e i suoi voli e mostra il modulo in anteprima di stampa.
> 3. Modifica il report perché restituisca i dati OTF. Quale campo di `SSFCTRLOP` imposti?

### Soluzione

Usa il programma di stampa Smart Forms visto sopra. Per il passo 3 imposta `ls_control-getotf = abap_true`, aggiungi `IMPORTING job_output_info = ls_job_info` (tipo `SSFCRESCL`) alla chiamata e passa `ls_job_info-otfdata` a `CONVERT_OTF` con `format = 'PDF'`.

> [!NOTE]
>
> - SAPscript (`SE71`) è obsoleto, Smart Forms (`SMARTFORMS`) è ancora diffuso, Adobe Forms (`SFP`) è la scelta strategica.
> - Il programma di stampa seleziona i dati e li passa al modulo tramite l'interfaccia.
> - Non scrivere mai nel codice il nome del modulo funzione generato: usa `SSF_FUNCTION_MODULE_NAME` o `FP_FUNCTION_MODULE_NAME`.
> - Gli Adobe Forms richiedono `FP_JOB_OPEN` e `FP_JOB_CLOSE` intorno alla chiamata, e gli Adobe Document Services per produrre il PDF.
> - Imposta `getotf` (Smart Forms) o `getpdf` (Adobe Forms) per ricevere il documento invece di stamparlo.
