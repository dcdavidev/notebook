---
title: 'Modularizzazione: dividere il codice in blocchi'
description: Include, subroutine, moduli funzione, BAPI, memoria SAP e ABAP.
---

_Settimana 2 · Livello intermedio · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                     |
| ------ | --------------------------------------------------------------------------------------------- |
| Ora 1  | Perché modularizzare; include; macro; subroutine (FORM/PERFORM)                               |
| Ora 2  | Moduli funzione: gruppi funzione, parametri, eccezioni, SE37                                  |
| Ora 3  | Chiamare moduli funzione standard; BAPI e BAPIRET2; RFC (cenni)                               |
| Ora 4  | Passaggio di parametri per valore e per riferimento; memoria SAP e ABAP; ambiti di visibilità |

## Ora 1 – Perché modularizzare

**Modularizzare** significa dividere un programma in blocchi più piccoli, ciascuno con un compito preciso, che si possono richiamare quando servono.

> [!TIP]
> Una cucina professionale non ha un unico cuoco che fa tutto: c'è chi prepara le salse, chi la pasta, chi i dolci. Ogni postazione ha un compito. Se la salsa serve in tre piatti, non la si prepara tre volte da zero: la si chiede alla postazione delle salse. I moduli sono le postazioni della tua cucina.

Vantaggi: codice più leggibile, nessuna duplicazione (scrivi una volta, usi tante volte), errori più facili da trovare, test più semplici.

In ABAP esistono queste unità di modularizzazione:

| Strumento           | Ambito                                             | Stato                                   |
| ------------------- | -------------------------------------------------- | --------------------------------------- |
| Include             | spezza un programma in più file                    | ancora usato                            |
| Macro (`DEFINE`)    | ripete pezzi di codice testuali                    | sconsigliato                            |
| Subroutine (`FORM`) | blocco interno a un programma                      | obsoleto, ma ovunque nel codice vecchio |
| Modulo funzione     | blocco globale, riusabile ovunque, anche da remoto | molto usato                             |
| Metodo di classe    | blocco in una classe (giorno 10)                   | il modo moderno, da preferire           |

### Include

Un **include** è un pezzo di codice salvato separatamente e "incollato" in un programma con l'istruzione `INCLUDE`. Non si può eseguire da solo.

```abap
REPORT zprogramma_grande.

INCLUDE zprogramma_grande_top.   " dichiarazioni globali
INCLUDE zprogramma_grande_sel.   " schermata di selezione
INCLUDE zprogramma_grande_f01.   " subroutine
```

Convenzioni di nome tipiche: `_TOP` (dati globali), `_SEL` (selezione), `_F01` (form), `_O01` (moduli PBO), `_I01` (moduli PAI), `_CL` (classi locali).

### Macro

```abap
DEFINE scrivi_riga.
  WRITE: / &1, &2.
END-OF-DEFINITION.

scrivi_riga 'Nome:' lv_nome.
```

Le macro non si possono debuggare riga per riga: evitale. Ti basta saperle riconoscere.

### Subroutine: FORM e PERFORM

Sono **obsolete** (SAP raccomanda i metodi), ma le troverai in migliaia di programmi esistenti, quindi devi conoscerle bene.

```abap
REPORT zsubroutine.

DATA gv_risultato TYPE i.

START-OF-SELECTION.
  PERFORM somma USING 5 7 CHANGING gv_risultato.
  WRITE gv_risultato.                " 12

FORM somma USING    iv_a   TYPE i
                    iv_b   TYPE i
           CHANGING cv_tot TYPE i.
  cv_tot = iv_a + iv_b.
ENDFORM.
```

- `USING`: parametri in ingresso (attenzione: sono passati **per riferimento**! vedi Ora 4).
- `USING VALUE(p)`: per valore.
- `CHANGING`: parametri che vengono modificati e restituiti.
- `TABLES`: vecchio modo di passare tabelle (obsoleto).
- Le variabili dichiarate dentro il `FORM` sono **locali**; quelle dichiarate in testa al programma sono **globali** e visibili ovunque.

## Ora 2 – I moduli funzione

Un **modulo funzione** (_function module_, FM) è un blocco di codice **globale**: si crea una volta in SE37 e lo può chiamare qualsiasi programma del sistema (e, se abilitato, anche sistemi esterni).

> [!TIP]
> Un modulo funzione è come un elettrodomestico: il frullatore non sai come è fatto dentro, sai solo che metti la frutta (parametri di import), premi il pulsante e ottieni il frullato (parametri di export). Se metti dentro un sasso, ti avvisa che c'è un problema (eccezione).

### Gruppo funzioni

Ogni modulo funzione appartiene a un **gruppo funzioni** (_function group_), creato in SE80 o SE37 (Vai a → Gestione gruppi funzioni). Il gruppo è un programma contenitore che condivide **dati globali** (include `L<gruppo>TOP`) tra i suoi moduli. Quando chiami un FM, tutto il gruppo viene caricato in memoria e resta lì fino alla fine del programma chiamante: i dati globali del gruppo "ricordano" i valori tra una chiamata e l'altra.

### Creare un modulo funzione

SE37 → nome `Z_CALCOLA_IVA` → Crea → gruppo funzioni `ZFG_CORSO`.

Schede:

| Scheda          | Contenuto                                                       |
| --------------- | --------------------------------------------------------------- |
| Attributi       | tipo: normale, abilitato a RFC (remoto), aggiornamento (update) |
| Import          | parametri in ingresso (facoltativi o obbligatori, con default)  |
| Export          | parametri in uscita                                             |
| Changing        | parametri in ingresso e uscita                                  |
| Tables          | tabelle (obsoleto, ma ancora richiesto dagli RFC/BAPI)          |
| Eccezioni       | errori che il FM può segnalare                                  |
| Codice sorgente | il codice                                                       |

```abap
FUNCTION z_calcola_iva.
*"----------------------------------------------------------------------
*"  IMPORTING
*"     VALUE(IV_NETTO) TYPE NETWR
*"     VALUE(IV_ALIQUOTA) TYPE P DEFAULT '22'
*"  EXPORTING
*"     VALUE(EV_IVA) TYPE NETWR
*"     VALUE(EV_LORDO) TYPE NETWR
*"  EXCEPTIONS
*"      IMPORTO_NEGATIVO
*"----------------------------------------------------------------------
  IF iv_netto < 0.
    RAISE importo_negativo.
  ENDIF.

  ev_iva   = iv_netto * iv_aliquota / 100.
  ev_lordo = iv_netto + ev_iva.
ENDFUNCTION.
```

L'intestazione con gli asterischi è generata da SAP: i parametri si definiscono nelle schede. Puoi provare il FM direttamente con F8 in SE37 (ambiente di test).

### Chiamare un modulo funzione

In SE38 o ADT usa il pulsante **Modello** (_Pattern_, Ctrl+F6 in SAP GUI) per inserire automaticamente la chiamata con tutti i parametri.

```abap
DATA lv_iva   TYPE netwr.
DATA lv_lordo TYPE netwr.

CALL FUNCTION 'Z_CALCOLA_IVA'
  EXPORTING
    iv_netto         = '100.00'
  IMPORTING
    ev_iva           = lv_iva
    ev_lordo         = lv_lordo
  EXCEPTIONS
    importo_negativo = 1
    OTHERS           = 2.

IF sy-subrc <> 0.
  WRITE 'Errore nel calcolo'.
ELSE.
  WRITE: / lv_iva, lv_lordo.
ENDIF.
```

> [!WARNING]
> Attenzione alla prospettiva: nel modulo i parametri si chiamano `IMPORTING` (ciò che il modulo riceve); nella chiamata si scrive `EXPORTING` (ciò che il programma invia). È come una lettera: tu la spedisci (`EXPORTING`), il destinatario la riceve (`IMPORTING`).

Se non elenchi le `EXCEPTIONS` nella chiamata e il FM esegue `RAISE`, il programma va in dump. Elenca sempre almeno `OTHERS`.

I FM possono anche sollevare **eccezioni basate su classi** (giorno 11), che si gestiscono con `TRY...CATCH`.

### Messaggi dai moduli funzione

Un FM può segnalare un errore con `MESSAGE ... RAISING eccezione`: imposta `sy-subrc` e riempie i campi `sy-msgid`, `sy-msgno`, `sy-msgv1..4` che il chiamante può mostrare:

```abap
IF sy-subrc <> 0.
  MESSAGE ID sy-msgid TYPE 'I' NUMBER sy-msgno
          WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
ENDIF.
```

## Ora 3 – Moduli standard, BAPI e RFC

### Moduli funzione standard utili

SAP contiene decine di migliaia di FM. Alcuni che userai spesso:

| Modulo funzione                           | A cosa serve                                           |
| ----------------------------------------- | ------------------------------------------------------ |
| `CONVERSION_EXIT_ALPHA_INPUT` / `_OUTPUT` | aggiungere/togliere zeri iniziali                      |
| `CONVERSION_EXIT_MATN1_INPUT`             | conversione numero materiale                           |
| `POPUP_TO_CONFIRM`                        | finestra di conferma Sì/No                             |
| `POPUP_GET_VALUES`                        | finestra per chiedere valori                           |
| `GUI_UPLOAD` / `GUI_DOWNLOAD`             | leggere/scrivere file sul PC dell'utente (giorno 8)    |
| `READ_TEXT` / `SAVE_TEXT`                 | testi lunghi (note su ordini, materiali...)            |
| `RP_CALC_DATE_IN_INTERVAL`                | aggiungere giorni/mesi/anni a una data                 |
| `CONVERT_TO_LOCAL_CURRENCY`               | conversione valuta                                     |
| `NUMBER_GET_NEXT`                         | prossimo numero da un intervallo di numerazione (SNRO) |
| `ENQUEUE_...` / `DEQUEUE_...`             | blocchi (generati)                                     |
| `SO_NEW_DOCUMENT_ATT_SEND_API1`           | invio e-mail (vecchio; oggi classe `CL_BCS`)           |
| `JOB_OPEN` / `JOB_SUBMIT` / `JOB_CLOSE`   | programmare job in background                          |

Per cercare un FM: SE37 con `*parola*` + F4, oppure il Repository Information System (SE84).

### Le BAPI

Le **BAPI** (_Business Application Programming Interface_) sono moduli funzione speciali e ufficiali con cui SAP permette di creare e modificare oggetti di business (ordini, fatture, materiali...) eseguendo **tutti i controlli dello standard**. Sono abilitate a RFC e documentate. Si cercano con la transazione **BAPI** (BAPI Explorer).

| BAPI                                    | Oggetto                           |
| --------------------------------------- | --------------------------------- |
| `BAPI_SALESORDER_CREATEFROMDAT2`        | creare un ordine di vendita       |
| `BAPI_PO_CREATE1`                       | creare un ordine d'acquisto       |
| `BAPI_MATERIAL_SAVEDATA`                | creare/modificare un materiale    |
| `BAPI_ACC_DOCUMENT_POST`                | registrare un documento contabile |
| `BAPI_GOODSMVT_CREATE`                  | movimento merci                   |
| `BAPI_USER_GET_DETAIL`                  | dati di un utente                 |
| `BAPI_TRANSACTION_COMMIT` / `_ROLLBACK` | confermare / annullare le BAPI    |

Regole d'uso delle BAPI:

1. **Le BAPI non fanno `COMMIT` da sole**: devi chiamare `BAPI_TRANSACTION_COMMIT` (con `WAIT = 'X'`) se è andato tutto bene, oppure `BAPI_TRANSACTION_ROLLBACK`.
2. **Gli errori non arrivano come eccezioni** ma nella tabella `RETURN` (struttura `BAPIRET2`): devi controllare se contiene righe con `TYPE = 'E'` (errore) o `'A'` (abort).
3. Le strutture con suffisso **X** (es. `ORDER_HEADER_INX`) indicano quali campi stai passando o modificando: metti `'X'` nei campi corrispondenti.

```abap
DATA lt_return TYPE STANDARD TABLE OF bapiret2.
DATA ls_header TYPE bapisdhd1.
DATA ls_headx  TYPE bapisdhd1x.
DATA lt_items  TYPE STANDARD TABLE OF bapisditm.
DATA lt_partn  TYPE STANDARD TABLE OF bapiparnr.
DATA lv_vbeln  TYPE vbeln_va.

ls_header = VALUE #( doc_type = 'TA' sales_org = '1000' distr_chan = '10' division = '00' ).
ls_headx  = VALUE #( doc_type = 'X'  sales_org = 'X'    distr_chan = 'X'  division = 'X' ).
lt_partn  = VALUE #( ( partn_role = 'AG' partn_numb = '0000001000' ) ).
lt_items  = VALUE #( ( itm_number = '000010' material = 'MAT001' target_qty = 5 ) ).

CALL FUNCTION 'BAPI_SALESORDER_CREATEFROMDAT2'
  EXPORTING
    order_header_in  = ls_header
    order_header_inx = ls_headx
  IMPORTING
    salesdocument    = lv_vbeln
  TABLES
    return           = lt_return
    order_items_in   = lt_items
    order_partners   = lt_partn.

IF line_exists( lt_return[ type = 'E' ] ) OR line_exists( lt_return[ type = 'A' ] ).
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
  LOOP AT lt_return INTO DATA(ls_ret) WHERE type CA 'EA'.
    WRITE / ls_ret-message.
  ENDLOOP.
ELSE.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT' EXPORTING wait = abap_true.
  WRITE / |Ordine creato: { lv_vbeln }|.
ENDIF.
```

(I codici organizzativi `'1000'`, `'10'`, `'TA'` sono di esempio: dipendono dal customizing del tuo sistema.)

> [!TIP]
> La BAPI è lo sportello ufficiale della banca: compili il modulo, l'impiegato controlla tutto e ti dà una ricevuta (`RETURN`) con l'esito. Scrivere direttamente nelle tabelle sarebbe come entrare nel caveau e spostare i soldi a mano.

### RFC: chiamare funzioni in un altro sistema

Un FM con attributo **"Abilitato a RFC"** (_Remote-Enabled_) può essere chiamato da un altro sistema SAP o esterno. Le destinazioni si configurano in **SM59**.

```abap
CALL FUNCTION 'Z_MIO_FM_REMOTO'
  DESTINATION 'ERP_PRD_100'
  EXPORTING  iv_param = lv_val
  IMPORTING  ev_result = lv_res
  EXCEPTIONS system_failure        = 1 MESSAGE lv_msg
             communication_failure = 2 MESSAGE lv_msg
             OTHERS                = 3.
```

Varianti: sincrono (aspetta la risposta), `STARTING NEW TASK` (asincrono, in parallelo), `IN BACKGROUND TASK` (transazionale tRFC/qRFC, eseguito al `COMMIT`). Approfondiremo le interfacce nel giorno 13.

Nei moduli RFC i parametri devono essere **per valore** e tipizzati con tipi del DDIC.

## Ora 4 – Parametri, visibilità e memoria

### Per valore o per riferimento

| Modo                   | Che cosa succede                                                                    | Sintassi                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Per riferimento        | il modulo lavora sull'originale: le modifiche si vedono subito fuori                | default di `FORM USING`, dei metodi `IMPORTING` (che però sono in sola lettura) |
| Per valore             | il modulo lavora su una copia                                                       | `VALUE(param)`                                                                  |
| Per valore e risultato | lavora su una copia, che viene ricopiata nell'originale solo alla fine senza errori | `CHANGING VALUE(param)`                                                         |

> [!TIP]
> Per riferimento è come prestare a un amico il tuo quaderno originale: se ci scrive sopra, lo ritrovi scritto. Per valore è come dargli una fotocopia: quello che fa sulla fotocopia non tocca il tuo quaderno.

Il passaggio per riferimento è più veloce con dati grandi (tabelle), quello per valore è più sicuro.

### Ambiti di visibilità (scope)

- **Globali del programma**: dichiarate in testa al report (o nell'include TOP), visibili ovunque nel programma. Da limitare al minimo.
- **Locali**: dichiarate in un `FORM`, FM o metodo, esistono solo lì.
- **Globali del gruppo funzioni**: visibili da tutti i FM dello stesso gruppo; mantengono il valore tra chiamate.
- **Attributi di classe**: giorno 10.

> [!WARNING]
> Le dichiarazioni inline `DATA(...)` in un report fuori da `FORM`/metodi sono **globali**, anche se scritte dentro un `IF` o un `LOOP`. ABAP non ha variabili "di blocco" come altri linguaggi.

### Memoria SAP e memoria ABAP

Servono per passare dati tra programmi o transazioni.

| Memoria                                   | Durata                                                                        | Istruzioni                                                              | Uso tipico                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Memoria SAP (globale utente)              | per tutta la sessione dell'utente, tra tutte le finestre                      | `SET PARAMETER` / `GET PARAMETER ID`                                    | proporre valori nei campi (es. ultimo ordine visto)                    |
| Memoria ABAP                              | dentro la stessa catena di chiamate (programma che chiama un altro programma) | `EXPORT ... TO MEMORY ID` / `IMPORT ... FROM MEMORY ID` / `FREE MEMORY` | passare dati a un programma chiamato con `SUBMIT` o `CALL TRANSACTION` |
| Memoria condivisa (shared objects/buffer) | tra utenti diversi, sul server                                                | `EXPORT TO SHARED BUFFER`, classi shared objects                        | cache di dati comuni                                                   |
| Tabelle di database INDX                  | permanente                                                                    | `EXPORT ... TO DATABASE`                                                | salvare dati complessi                                                 |

```abap
* Memoria SAP: gli ID parametro (es. AUN = ordine di vendita) sono in tabella TPARA
SET PARAMETER ID 'AUN' FIELD lv_vbeln.
CALL TRANSACTION 'VA03' AND SKIP FIRST SCREEN.   " apre l'ordine direttamente

* Memoria ABAP
EXPORT lt_dati = lt_voli TO MEMORY ID 'ZVOLI'.
SUBMIT zprogramma_figlio AND RETURN.
" nel programma figlio:
IMPORT lt_dati = lt_voli FROM MEMORY ID 'ZVOLI'.
```

### Chiamare altri programmi e transazioni

```abap
SUBMIT zreport_altro WITH p_data = sy-datum AND RETURN.  " esegue un report, poi torna
SUBMIT zreport_altro VIA SELECTION-SCREEN AND RETURN.    " mostra la sua schermata
CALL TRANSACTION 'SE16N'.                                " apre una transazione e torna
LEAVE TO TRANSACTION 'SE38'.                             " va alla transazione e non torna
```

Prima di `CALL TRANSACTION` conviene controllare l'autorizzazione dell'utente (`CALL TRANSACTION ... WITH AUTHORITY-CHECK`, giorno 8).

## Esercizi

> [!IMPORTANT]
>
> 1. Scrivi un report con una subroutine `calcola_area` che riceve base e altezza e restituisce l'area di un rettangolo con `CHANGING`.
> 2. Dimostra la differenza tra `USING` per riferimento e `USING VALUE`: modifica il parametro dentro il `FORM` e stampa la variabile originale dopo la chiamata.
> 3. Crea il gruppo funzioni `ZFG_CORSO` e il FM `Z_CALCOLA_IVA` con l'eccezione `IMPORTO_NEGATIVO`. Testalo in SE37 e chiamalo da un report gestendo l'eccezione.
> 4. Crea il FM `Z_GET_VOLI_COMPAGNIA` che riceve un codice compagnia e restituisce la tabella dei suoi voli (usa un tipo tabella del DDIC come parametro `EXPORTING`). Se la compagnia non esiste solleva un'eccezione.
> 5. Chiama `POPUP_TO_CONFIRM` e stampa la risposta dell'utente.
> 6. Esplora la transazione BAPI: trova la BAPI per leggere i dettagli di un utente e chiamala per il tuo utente, stampando nome e cognome (`BAPI_USER_GET_DETAIL`, parametro `ADDRESS`).

## Quiz

1. Che differenza c'è tra un include e un modulo funzione?
2. Perché nella chiamata di un FM si scrive `EXPORTING` per i parametri che il FM definisce come `IMPORTING`?
3. Che cosa succede se un FM esegue `RAISE` e il chiamante non ha elencato `EXCEPTIONS`?
4. Le BAPI fanno `COMMIT` da sole? Dove si leggono gli errori?
5. Che cosa significa passare un parametro per valore?
6. Differenza tra memoria SAP e memoria ABAP?

## Soluzioni

```abap
REPORT zes07_soluzioni.

START-OF-SELECTION.
* Es. 1
  DATA lv_area TYPE p LENGTH 8 DECIMALS 2.
  PERFORM calcola_area USING '3.5' 2 CHANGING lv_area.
  WRITE / |Area: { lv_area }|.

* Es. 2
  DATA(lv_x) = 10.
  PERFORM per_riferimento USING lv_x.
  WRITE / |Dopo riferimento: { lv_x }|.   " 99
  lv_x = 10.
  PERFORM per_valore USING lv_x.
  WRITE / |Dopo valore: { lv_x }|.        " 10

* Es. 5
  DATA lv_risposta TYPE c LENGTH 1.
  CALL FUNCTION 'POPUP_TO_CONFIRM'
    EXPORTING
      titlebar      = 'Conferma'
      text_question = 'Vuoi continuare?'
    IMPORTING
      answer        = lv_risposta
    EXCEPTIONS
      OTHERS        = 1.
  WRITE / |Risposta: { lv_risposta }|.     " 1 = Sì, 2 = No, A = Annulla

* Es. 6
  DATA ls_address TYPE bapiaddr3.
  DATA lt_ret     TYPE STANDARD TABLE OF bapiret2.
  CALL FUNCTION 'BAPI_USER_GET_DETAIL'
    EXPORTING username = sy-uname
    IMPORTING address  = ls_address
    TABLES    return   = lt_ret.
  WRITE / |{ ls_address-firstname } { ls_address-lastname }|.

FORM calcola_area USING iv_base TYPE p iv_alt TYPE i CHANGING cv_area TYPE p.
  cv_area = iv_base * iv_alt.
ENDFORM.

FORM per_riferimento USING cv_val TYPE i.
  cv_val = 99.
ENDFORM.

FORM per_valore USING VALUE(iv_val) TYPE i.
  iv_val = 99.
ENDFORM.
```

Quiz:

1. L'include è solo un pezzo di testo incollato in un programma; il FM è un blocco globale con interfaccia, eseguibile da qualsiasi programma.
2. Perché la prospettiva è del chiamante: lui esporta, il modulo importa.
3. Il programma va in dump.
4. No: serve `BAPI_TRANSACTION_COMMIT`; gli errori sono nella tabella `RETURN` (`BAPIRET2`) con `TYPE` E o A.
5. Il modulo riceve una copia: le modifiche non toccano l'originale.
6. La memoria SAP vale per tutta la sessione utente (`SET`/`GET PARAMETER`); la memoria ABAP solo nella catena di programmi chiamati (`EXPORT`/`IMPORT MEMORY ID`).

> [!NOTE]
> Oggi hai imparato: include, macro, subroutine, moduli funzione con parametri ed eccezioni, BAPI con `BAPIRET2` e `COMMIT`, RFC, passaggio per valore/riferimento, ambiti di visibilità, memoria SAP/ABAP, `SUBMIT` e `CALL TRANSACTION`. Domani: report completi con schermate di selezione, messaggi e file.
