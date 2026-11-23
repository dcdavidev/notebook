---
title: IDoc e ALE
description: Scambiare documenti di business fra sistemi.
level: pro
---

Un **IDoc** (intermediate document) è il contenitore standard di SAP per i dati di business che viaggiano fra sistemi: un ordine d'acquisto inviato a un fornitore, un'anagrafica materiale copiata in un altro sistema SAP, una fattura ricevuta da un provider EDI. **ALE** (Application Link Enabling) è il framework che distribuisce gli IDoc fra sistemi SAP, in modo asincrono e affidabile. Molte piattaforme di integrazione (SAP Integration Suite, SAP PI/PO, strumenti EDI) parlano ancora IDoc, quindi li incontrerai in quasi ogni progetto.

## La struttura di un IDoc

| Termine        | Significato                                           | Esempio                        | Transazione |
| -------------- | ----------------------------------------------------- | ------------------------------ | ----------- |
| tipo messaggio | il significato di business dei dati                   | `ORDERS`, `MATMAS`, `DEBMAS`   | `WE81`      |
| tipo base      | la struttura tecnica: quali segmenti, in quale ordine | `ORDERS05`, `MATMAS05`         | `WE30`      |
| estensione     | i tuoi segmenti aggiuntivi su un tipo base            | `ZORDERS05_EXT`                | `WE30`      |
| segmento       | un gruppo di campi, come una struttura                | `E1EDK01` (testata), `E1MARAM` | `WE31`      |

Ogni IDoc nel database ha tre parti:

- un **record di controllo** (`EDIDC`): numero IDoc, tipo messaggio, tipo base, mittente, destinatario, direzione e stato attuale;
- molti **record di dati** (`EDID4`): ognuno contiene un nome di segmento e fino a 1000 caratteri di dati nel campo `SDATA`;
- molti **record di stato** (`EDIDS`): la storia, una riga per ogni cambio di stato.

> [!TIP]
> Un IDoc è un pacco da spedire. Il record di controllo è l'etichetta esterna (mittente, destinatario, tipo di merce). I record di dati sono gli oggetti dentro, ognuno nella sua busta etichettata (il segmento). I record di stato sono la cronologia del tracking: "affidato al corriere", "consegnato", "rifiutato alla porta".

## La configurazione ALE

Per inviare IDoc servono alcuni oggetti. Di solito li configurano il basis e i consulenti funzionali, ma devi conoscerli per testare e fare debug:

1. **Sistemi logici** (`BD54`, assegnati al mandante in `SCC4`): i nomi dei sistemi, come `S4DCLNT100`.
2. **Destinazione RFC** (`SM59`) e **porta** (`WE21`): come gli IDoc raggiungono il destinatario (una porta tRFC per i sistemi SAP, una porta file o XML HTTP per gli altri).
3. **Profilo partner** (`WE20`): per ogni partner e tipo messaggio, la porta in uscita e il tipo base, oppure il **codice di elaborazione** in entrata (`WE42`) che dice quale modulo funzione elabora l'IDoc. Dice anche se inviare/elaborare subito o raccogliere.
4. **Modello di distribuzione** (`BD64`): quali tipi messaggio vanno da quale mittente a quale destinatario, anche con filtri.

## Codici di stato e monitoraggio

| Stato | Direzione | Significato                                     |
| ----- | --------- | ----------------------------------------------- |
| `30`  | uscita    | IDoc pronto per l'invio (in attesa di partire)  |
| `03`  | uscita    | dati passati alla porta: inviato                |
| `02`  | uscita    | errore nel passaggio dei dati alla porta        |
| `64`  | entrata   | IDoc pronto per essere passato all'applicazione |
| `53`  | entrata   | documento applicativo registrato                |
| `51`  | entrata   | documento applicativo non registrato: errore    |

Transazioni utili:

- `WE02` / `WE05`: visualizzare gli IDoc, con i loro segmenti e la cronologia degli stati;
- `BD87`: rielaborare gli IDoc, per esempio quelli in stato `51` dopo aver corretto i dati anagrafici, o quelli in `30` per inviarli;
- `WE19`: strumento di test: copi un IDoc esistente, cambi dei campi e lo elabori in entrata o in uscita;
- `WE60`: documentazione dei tipi base e dei segmenti.

## Inviare un IDoc da ABAP

Per gli oggetti standard, SAP crea gli IDoc da sola (tramite la determinazione dell'output, i change pointer o programmi come `BD10` per i materiali). Per un tipo messaggio personalizzato, riempi il record di controllo e i record di dati e chiami `MASTER_IDOC_DISTRIBUTE`:

```abap
" Z1FLIGHT: segmento personalizzato con i campi CARRID, CONNID, FLDATE, PRICE (tutti carattere)
DATA ls_segment TYPE z1flight.
DATA lt_data    TYPE STANDARD TABLE OF edidd WITH EMPTY KEY.
DATA lt_comm    TYPE STANDARD TABLE OF edidc WITH EMPTY KEY.

SELECT SINGLE carrid, connid, fldate, price FROM sflight
  WHERE carrid = 'LH' AND connid = '0400'
  INTO @DATA(ls_flight).

ls_segment = VALUE #( carrid = ls_flight-carrid
                      connid = ls_flight-connid
                      fldate = ls_flight-fldate
                      price  = |{ ls_flight-price }| ).
APPEND VALUE #( segnam = 'Z1FLIGHT' sdata = ls_segment ) TO lt_data.

DATA(ls_control) = VALUE edidc( mestyp = 'ZFLIGHT'       " tipo messaggio
                                idoctp = 'ZFLIGHT01'     " tipo base
                                rcvprt = 'LS'            " destinatario: sistema logico
                                rcvprn = 'S4QCLNT100' ).

CALL FUNCTION 'MASTER_IDOC_DISTRIBUTE'
  EXPORTING
    master_idoc_control            = ls_control
  TABLES
    communication_idoc_control     = lt_comm
    master_idoc_data               = lt_data
  EXCEPTIONS
    error_in_idoc_control          = 1
    error_writing_idoc_status      = 2
    error_in_idoc_data             = 3
    sending_logical_system_unknown = 4
    OTHERS                         = 5.

IF sy-subrc = 0.
  COMMIT WORK.                       " gli IDoc vengono salvati e inviati solo ora
  LOOP AT lt_comm INTO DATA(ls_comm).
    WRITE / |IDoc { ls_comm-docnum } creato|.
  ENDLOOP.
ENDIF.
```

`lt_comm` restituisce un record di controllo per ogni destinatario del modello di distribuzione: una sola chiamata può creare più IDoc. I campi dei segmenti sono sempre campi carattere, quindi converti tu numeri e importi in testo.

> [!WARNING]
> `MASTER_IDOC_DISTRIBUTE` non fa commit. Senza `COMMIT WORK` non viene salvato nessun IDoc. Dentro un processo standard (una exit o una BAdI) non fare commit di tua iniziativa: l'IDoc viene salvato con il commit standard.

## Elaborare un IDoc in entrata

Gli IDoc in entrata sono elaborati da un modulo funzione con un'interfaccia standard, collegato al tipo messaggio tramite un codice di elaborazione (`WE42`) e il profilo partner. Copia l'interfaccia di uno standard come `IDOC_INPUT_ORDERS`: riceve `IDOC_CONTRL` e `IDOC_DATA` e restituisce `IDOC_STATUS` e `WORKFLOW_RESULT`. Il cuore della logica legge i segmenti:

```abap
DATA ls_segment TYPE z1flight.

LOOP AT idoc_contrl INTO DATA(ls_control).
  LOOP AT idoc_data INTO DATA(ls_data)
       WHERE docnum = ls_control-docnum AND segnam = 'Z1FLIGHT'.
    ls_segment = ls_data-sdata.             " dati carattere di nuovo nel segmento
    " ... controlla e registra i dati, per esempio con una BAPI ...
  ENDLOOP.

  APPEND VALUE #( docnum = ls_control-docnum
                  status = '53'              " registrato
                  msgty  = 'S'
                  msgid  = 'ZFLIGHT'
                  msgno  = '001'
                  msgv1  = ls_segment-carrid ) TO idoc_status.
ENDLOOP.
```

In caso di errore, aggiungi invece lo stato `51` con il messaggio, e imposta `workflow_result` in modo che parta il workflow di errore.

> [!CAUTION]
> Rielaborare un IDoc in `BD87` registra di nuovo il documento. Se un modulo funzione in entrata ha registrato una parte dei dati prima di fallire, la rielaborazione può creare duplicati. Rendi l'elaborazione in entrata tutto-o-niente (una sola LUW, rollback in caso di errore) e controlla se il documento esiste già prima di registrarlo.

## Esercizio

> [!IMPORTANT]
>
> 1. In `WE02` visualizza gli IDoc più recenti del tuo sistema e aprine uno con stato `51` o `53`.
> 2. Guarda il suo record di controllo, i suoi segmenti in `WE60` e la cronologia degli stati.
> 3. In `WE19` copia l'IDoc ed eseguilo con l'elaborazione in entrata nel debugger.

### Soluzione

`WE02` elenca gli IDoc per direzione e stato. Il record di controllo mostra tipo messaggio, tipo base e partner; ogni record di dati mostra un segmento con i suoi campi; i record di stato mostrano ogni passo. In `WE19`, **Entrata standard** esegue il modulo funzione del profilo partner, mentre **Modulo funzione in entrata** ti permette di sceglierlo e avviarlo in modalità debug.

> [!NOTE]
>
> - Un IDoc ha un record di controllo (`EDIDC`), record di dati con i segmenti (`EDID4`) e record di stato (`EDIDS`).
> - Il tipo messaggio è il significato, il tipo base la struttura; le estensioni aggiungono i tuoi segmenti.
> - ALE richiede sistemi logici, porte, profili partner (`WE20`) e un modello di distribuzione (`BD64`).
> - Monitora in `WE02` e `WE05`, rielabora in `BD87`, testa in `WE19`.
> - In uscita: `MASTER_IDOC_DISTRIBUTE` più `COMMIT WORK`; in entrata: un modulo funzione con l'interfaccia standard che imposta lo stato `53` o `51`.
