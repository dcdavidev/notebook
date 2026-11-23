---
title: I file sull'application server
description: OPEN DATASET, TRANSFER, READ DATASET e AL11.
level: basic
---

Le interfacce con altri sistemi si scambiano spesso dei file: un job notturno scrive un file di prenotazioni, e un altro sistema lo preleva da una cartella condivisa. Questi file stanno sull'**application server**, la macchina su cui girano i programmi ABAP, non sul PC dell'utente.

A differenza dei [file sul PC dell'utente](./0073-files-on-the-presentation-server.md), i file dell'application server non hanno bisogno di SAP GUI, quindi funzionano nei [job in background](./0068-variants-and-background-jobs.md). ABAP li gestisce con le istruzioni sui **dataset**: `OPEN DATASET`, `TRANSFER`, `READ DATASET`, `CLOSE DATASET` e `DELETE DATASET`.

## Guardare il file system: AL11

La transazione `AL11` elenca le directory dell'application server note a SAP, come `DIR_TEMP` o `DIR_HOME`, con i loro percorsi reali (per esempio `/usr/sap/<SID>/D00/work` su Linux). Fai doppio clic su una directory per vederne i file, e su un file per vederne il contenuto.

Chiedi al team Basis quale directory puoi usare per le tue interfacce. Scrivere altrove può fallire per mancanza di permessi del sistema operativo.

## Scrivere un file

```abap
REPORT zflight_write_file.

PARAMETERS p_file TYPE string LOWER CASE DEFAULT '/tmp/zflight_carriers.csv'.

START-OF-SELECTION.
  SELECT carrid, carrname, currcode FROM scarr INTO TABLE @DATA(lt_carriers).

  OPEN DATASET p_file FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
  IF sy-subrc <> 0.
    MESSAGE |Impossibile aprire il file { p_file }| TYPE 'S' DISPLAY LIKE 'E'.
    RETURN.
  ENDIF.

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    DATA(lv_line) = |{ ls_carrier-carrid };{ ls_carrier-carrname };{ ls_carrier-currcode }|.
    TRANSFER lv_line TO p_file.
  ENDLOOP.

  CLOSE DATASET p_file.
  MESSAGE |{ lines( lt_carriers ) } righe scritte| TYPE 'S'.
```

- Il file è identificato dal suo nome: tutte le istruzioni sui dataset usano lo stesso percorso.
- `TRANSFER` scrive un record. In modalità testo aggiunge il carattere di fine riga.
- `CLOSE DATASET` rilascia il file. Il runtime chiude i file aperti alla fine del programma, ma chiudili tu, soprattutto prima che un altro programma li legga.

> [!CAUTION]
> `FOR OUTPUT` crea il file, oppure lo **sovrascrive** se esiste già, senza chiedere nulla. Usa `FOR APPENDING` per aggiungere righe in fondo a un file esistente.

## Le modalità di apertura

| Aggiunta        | Effetto                                               |
| --------------- | ----------------------------------------------------- |
| `FOR INPUT`     | legge un file esistente; `sy-subrc = 8` se non esiste |
| `FOR OUTPUT`    | crea un nuovo file o sovrascrive quello esistente     |
| `FOR APPENDING` | scrive in fondo al file; lo crea se non esiste        |
| `FOR UPDATE`    | legge e modifica un file esistente                    |

| Modalità                      | Quando usarla                                    |
| ----------------------------- | ------------------------------------------------ |
| `IN TEXT MODE ENCODING UTF-8` | file di testo, riga per riga; la scelta abituale |
| `IN BINARY MODE`              | byte invariati: PDF, immagini o formati fissi    |
| `IN LEGACY TEXT MODE`         | vecchi file in una code page non Unicode         |

L'aggiunta `MESSAGE lv_msg` mette in `lv_msg` il testo di errore del sistema operativo quando `OPEN DATASET` fallisce, e aiuta molto a trovarne la causa.

## Leggere un file

`READ DATASET` legge una riga a ogni chiamata. Mettilo in un loop `DO` e fermati quando `sy-subrc` non è `0`, cioè alla fine del file:

```abap
REPORT zflight_read_file.

PARAMETERS p_file TYPE string LOWER CASE DEFAULT '/tmp/zflight_carriers.csv'.

START-OF-SELECTION.
  DATA lv_msg  TYPE string.
  DATA lv_line TYPE string.

  OPEN DATASET p_file FOR INPUT IN TEXT MODE ENCODING UTF-8 MESSAGE lv_msg.
  IF sy-subrc <> 0.
    WRITE: / 'Errore:', lv_msg.
    RETURN.
  ENDIF.

  DO.
    READ DATASET p_file INTO lv_line.
    IF sy-subrc <> 0.
      EXIT.                                   " fine del file
    ENDIF.
    SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_carrname) DATA(lv_currcode).
    WRITE: / lv_carrid, lv_carrname, lv_currcode.
  ENDDO.

  CLOSE DATASET p_file.
```

`DELETE DATASET p_file` cancella un file, per esempio dopo averlo elaborato.

> [!TIP]
> Le istruzioni sui dataset funzionano come un quaderno su uno scaffale condiviso. Lo prendi dallo scaffale (`OPEN`), scrivi o leggi una riga alla volta (`TRANSFER`, `READ`) e lo rimetti a posto (`CLOSE`) perché possa usarlo il prossimo.

## Sicurezza e portabilità

- `OPEN DATASET` controlla l'oggetto di autorizzazione `S_DATASET`. Se l'utente (o l'utente dello step del job) non ce l'ha, l'istruzione solleva un'eccezione e il programma va in dump. Puoi controllare prima con il modulo funzione `AUTHORITY_CHECK_DATASET`.
- Non costruire mai un percorso dall'input dell'utente senza controllarlo: un valore come `../../` potrebbe raggiungere file fuori dalla tua directory. Usa i **nomi file logici**, definiti nella transazione `FILE` e convertiti in un percorso fisico con il modulo funzione `FILE_GET_NAME`, così il percorso è gestito centralmente e può essere diverso tra sviluppo e produzione.
- Se il sistema ha più application server, un file in una directory locale esiste solo sul server dove è stato scritto. Le interfacce di solito usano una directory condivisa da tutti i server.

Gli errori in apertura di un file, come un'autorizzazione mancante, sollevano eccezioni basate su classi come `CX_SY_FILE_OPEN` e `CX_SY_FILE_AUTHORITY`. Imparerai a catturarle in [le eccezioni basate su classi](./0089-class-based-exceptions.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che scrive tutti i voli di una compagnia presi da `SFLIGHT` (collegamento, data, posti occupati) in un file di testo, in una directory che vedi in `AL11`.
> 2. Controlla il file in `AL11`.
> 3. Scrivi un secondo report che rilegge il file e somma i posti occupati.

### Soluzione

```abap
REPORT zflight_export.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.
PARAMETERS p_file   TYPE string LOWER CASE DEFAULT '/tmp/zflight_flights.txt'.

START-OF-SELECTION.
  SELECT connid, fldate, seatsocc FROM sflight
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).

  OPEN DATASET p_file FOR OUTPUT IN TEXT MODE ENCODING UTF-8.
  CHECK sy-subrc = 0.
  LOOP AT lt_flights INTO DATA(ls_flight).
    DATA(lv_line) = |{ ls_flight-connid };{ ls_flight-fldate };{ ls_flight-seatsocc }|.
    TRANSFER lv_line TO p_file.
  ENDLOOP.
  CLOSE DATASET p_file.
```

```abap
REPORT zflight_import.

PARAMETERS p_file TYPE string LOWER CASE DEFAULT '/tmp/zflight_flights.txt'.

START-OF-SELECTION.
  DATA lv_line  TYPE string.
  DATA lv_total TYPE i.

  OPEN DATASET p_file FOR INPUT IN TEXT MODE ENCODING UTF-8.
  CHECK sy-subrc = 0.
  DO.
    READ DATASET p_file INTO lv_line.
    IF sy-subrc <> 0.
      EXIT.
    ENDIF.
    SPLIT lv_line AT ';' INTO DATA(lv_connid) DATA(lv_fldate) DATA(lv_seats).
    lv_total = lv_total + lv_seats.
  ENDDO.
  CLOSE DATASET p_file.

  WRITE: / 'Posti occupati:', lv_total.
```

> [!NOTE]
>
> - I file dell'application server si leggono e si scrivono con `OPEN DATASET`, `TRANSFER`, `READ DATASET` e `CLOSE DATASET`; funzionano nei job in background.
> - Usa `IN TEXT MODE ENCODING UTF-8` per i file di testo e `IN BINARY MODE` per i dati binari.
> - `FOR OUTPUT` sovrascrive i file esistenti; `FOR APPENDING` aggiunge in fondo.
> - Leggi in un loop `DO` ed esci quando `sy-subrc` non è `0`, e controlla sempre `sy-subrc` dopo `OPEN DATASET`.
> - Sfoglia le directory con `AL11`; usa i nomi file logici (`FILE`, `FILE_GET_NAME`) e l'autorizzazione `S_DATASET` per percorsi sicuri.
