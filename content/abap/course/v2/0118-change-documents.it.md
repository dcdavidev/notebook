---
title: I documenti di modifica
description: Registrare chi ha cambiato che cosa e quando, con SCDO.
---

_Livello intermedio_

Revisori, key user e team di supporto fanno sempre la stessa domanda: chi ha cambiato questo prezzo, e quando? SAP risponde con i **documenti di modifica** (change document): un registro delle modifiche ai campi, con valore vecchio, valore nuovo, utente, data, ora e transazione. Gli oggetti standard come materiali, clienti e ordini di vendita li scrivono già. Con la transazione `SCDO` puoi fare lo stesso per le tue tabelle.

## Come sono salvati i documenti di modifica

Ogni modifica crea una testata e una posizione per ogni campo modificato:

| Tabella | Contenuto                                                                                           |
| ------- | --------------------------------------------------------------------------------------------------- |
| `CDHDR` | testata: classe oggetto, ID oggetto, numero di modifica, utente, data, ora, transazione             |
| `CDPOS` | posizioni: nome tabella, chiave tabella, nome campo, tipo di modifica, valore vecchio, valore nuovo |

- La **classe oggetto** raggruppa le tabelle che appartengono a un oggetto di business (per esempio `MATERIAL`).
- L'**ID oggetto** identifica un'istanza, per esempio un numero materiale, o la chiave di un volo.
- L'**indicatore di modifica** è `I` (inserimento), `U` (modifica), `D` (cancellazione) o `E` (cancellazione di un singolo campo).

Vengono registrati solo i campi il cui **elemento dati** ha il flag **Documento di modifica** attivo (in `SE11`, scheda **Ulteriori caratteristiche**). Vedi [gli elementi dati](./0045-data-elements.it.md).

> [!TIP]
> Un documento di modifica è la funzione "revisioni" di un programma di videoscrittura applicata a una tabella del database: il testo attuale resta pulito, ma accanto c'è traccia di ogni intervento, con il nome dell'autore e l'ora.

## Creare un oggetto documento di modifica

Supponi di avere una tabella `ZFLIGHT_PRICE` con chiave `CARRID`, `CONNID`, `FLDATE` e un campo `PRICE` il cui elemento dati ha il flag del documento di modifica.

1. Apri `SCDO` e crea la classe oggetto `ZFLIGHTPRC`.
2. Aggiungi la tabella `ZFLIGHT_PRICE`. Lascia vuoto **Caso multiplo** per una tabella a riga singola (passi una struttura vecchia e una nuova); attivalo se passerai tabelle interne di righe.
3. Scegli **Genera**: indica un gruppo funzione (per esempio `ZFLIGHTPRC_CD`) e un package.

Il generatore crea:

- il modulo funzione di aggiornamento `ZFLIGHTPRC_WRITE_DOCUMENT`;
- gli include con le dichiarazioni dei dati e con una chiamata di esempio (il generatore propone nomi come `FZFLIGHTPRCCDT` e `FZFLIGHTPRCCDC`).

Apri il modulo funzione generato per vedere i nomi esatti dei parametri: seguono lo schema `N_<tabella>` (valori nuovi), `O_<tabella>` (valori vecchi) e `UPD_<tabella>` (indicatore di modifica).

Nei rilasci recenti di SAP S/4HANA, `SCDO` può generare anche una classe con un metodo `WRITE` al posto del modulo funzione. L'idea e le tabelle restano le stesse.

## Scrivere un documento di modifica

Leggi la riga vecchia prima di modificarla, scrivi la riga nuova, poi chiama il modulo generato nella stessa LUW. È un [modulo funzione di aggiornamento](./0113-update-task.it.md), quindi lo chiami `IN UPDATE TASK`:

```abap
PARAMETERS: p_carrid TYPE s_carr_id DEFAULT 'LH',
            p_connid TYPE s_conn_id DEFAULT '0400',
            p_fldate TYPE s_date    DEFAULT '20261215',
            p_price  TYPE s_price   DEFAULT '799.00'.

START-OF-SELECTION.
  SELECT SINGLE * FROM zflight_price
    WHERE carrid = @p_carrid AND connid = @p_connid AND fldate = @p_fldate
    INTO @DATA(ls_old).
  IF sy-subrc <> 0.
    WRITE / 'Prezzo del volo non trovato'.
    RETURN.
  ENDIF.

  DATA(ls_new) = ls_old.
  ls_new-price = p_price.

  UPDATE zflight_price FROM @ls_new.

  CALL FUNCTION 'ZFLIGHTPRC_WRITE_DOCUMENT' IN UPDATE TASK
    EXPORTING
      objectid                = CONV cdobjectv( |{ ls_new-carrid }{ ls_new-connid }{ ls_new-fldate }| )
      tcode                   = sy-tcode
      utime                   = sy-uzeit
      udate                   = sy-datum
      username                = sy-uname
      object_change_indicator = 'U'
      n_zflight_price         = ls_new
      o_zflight_price         = ls_old
      upd_zflight_price       = 'U'.

  COMMIT WORK.
```

Il modulo confronta la struttura vecchia e quella nuova e scrive una riga in `CDPOS` solo per i campi registrati che sono cambiati davvero.

> [!WARNING]
> Il documento di modifica vale quanto i valori vecchi che passi. Se leggi la riga "vecchia" dopo averla modificata, o ti dimentichi di riempirla, registri un valore vecchio sbagliato o niente del tutto. Leggila una volta, prima della modifica, e non toccarla più.

## Leggere i documenti di modifica

Puoi visualizzare i documenti di modifica con il report `RSSCD100`, oppure leggerli con il modulo funzione `CHANGEDOCUMENT_READ`. In SAP S/4HANA `CDPOS` è una tabella trasparente, quindi puoi anche farci un join:

```abap
DATA(lv_objectid) = CONV cdobjectv( |{ p_carrid }{ p_connid }{ p_fldate }| ).

SELECT h~udate, h~utime, h~username, p~fname, p~chngind, p~value_old, p~value_new
  FROM cdhdr AS h
  INNER JOIN cdpos AS p
    ON  p~objectclas = h~objectclas
    AND p~objectid   = h~objectid
    AND p~changenr   = h~changenr
  WHERE h~objectclas = 'ZFLIGHTPRC'
    AND h~objectid   = @lv_objectid
  ORDER BY h~udate DESCENDING, h~utime DESCENDING
  INTO TABLE @DATA(lt_changes).

cl_demo_output=>display( lt_changes ).
```

In SAP ECC `CDPOS` è una tabella cluster e non si può usare in un join: leggi prima `CDHDR`, poi `CDPOS` con le chiavi trovate, oppure usa `CHANGEDOCUMENT_READ`.

> [!CAUTION]
> I documenti di modifica crescono in fretta sulle tabelle molto usate. Registra solo i campi che contano per le revisioni, e concorda un piano di archiviazione (oggetto di archiviazione `CHANGEDOCU`) con il team basis prima che le tabelle arrivino a centinaia di milioni di righe.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la tabella `ZFLIGHT_PRICE` e attiva il flag del documento di modifica sull'elemento dati di `PRICE`.
> 2. Crea e genera l'oggetto documento di modifica `ZFLIGHTPRC` in `SCDO`.
> 3. Cambia un prezzo due volte con il report qui sopra, poi elenca le modifiche con la `SELECT` su `CDHDR` e `CDPOS`.

### Soluzione

Dopo le due esecuzioni, la `SELECT` restituisce due righe con `FNAME = 'PRICE'` e `CHNGIND = 'U'`: la più recente ha il secondo prezzo come `VALUE_NEW` e il primo come `VALUE_OLD`. Se un'esecuzione non cambia il prezzo (stesso valore), il modulo non scrive nessuna posizione.

> [!NOTE]
>
> - I documenti di modifica registrano valore vecchio, valore nuovo, utente, data, ora e transazione in `CDHDR` e `CDPOS`.
> - Vengono registrati solo i campi il cui elemento dati ha il flag del documento di modifica.
> - `SCDO` genera per le tue tabelle un modulo funzione di aggiornamento `<oggetto>_WRITE_DOCUMENT`.
> - Passa i valori vecchi e nuovi e chiama il modulo `IN UPDATE TASK` nella stessa LUW della modifica.
> - Leggili con `RSSCD100`, `CHANGEDOCUMENT_READ` o (in S/4HANA) con un join su `CDHDR` e `CDPOS`.
