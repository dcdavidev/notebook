---
title: I moduli funzione
description: Gruppi funzione, interfacce, eccezioni e SE37.
---

_Livello base_

Un **modulo funzione** è una procedura riutilizzabile, salvata centralmente nel sistema, con un'interfaccia tipizzata. Qualsiasi programma può chiamarlo con `CALL FUNCTION`. SAP ne fornisce decine di migliaia, e molte tecniche importanti funzionano solo con i moduli funzione: le chiamate remote ([RFC](./0124-rfc.it.md)), le [BAPI](./0071-bapis.it.md) e i [moduli di aggiornamento](./0113-update-task.it.md).

Chiamerai moduli funzione standard di continuo, e a volte ne scriverai di tuoi.

## I gruppi funzione

Ogni modulo funzione appartiene a un **gruppo funzione**: un programma contenitore (tipo `F`) che raccoglie moduli funzione correlati e i loro dati condivisi. Quando crei il gruppo funzione `ZFLIGHT`, il sistema crea il programma principale `SAPLZFLIGHT` e alcuni include:

| Include            | Contenuto                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `LZFLIGHTTOP`      | dati globali del gruppo, condivisi da tutti i suoi moduli funzione |
| `LZFLIGHTUXX`      | generato; include un `LZFLIGHTUnn` per ogni modulo funzione        |
| `LZFLIGHTU01`, ... | il codice sorgente di ogni modulo funzione                         |
| `LZFLIGHTF01`      | le tue subroutine o classi locali, se ti servono                   |

Crea un gruppo funzione in `SE80` (clic destro sul pacchetto > **Crea > Gruppo funzioni**) o in ADT (**New > ABAP Function Group**). Poi crea il modulo funzione in `SE37` o in ADT e assegnalo al gruppo.

> [!WARNING]
> I dati globali dell'include `TOP` restano in memoria per tutto il tempo in cui gira il programma chiamante. Se una chiamata imposta una variabile globale, la chiamata successiva di qualsiasi modulo funzione dello stesso gruppo vede quel valore. Può essere utile (un buffer), ma è anche una fonte frequente di bug difficili da trovare.

## L'interfaccia

In `SE37` l'interfaccia è divisa in schede: **Import**, **Export**, **Modifiche** (Changing), **Tabelle** ed **Eccezioni**. L'editor la mostra come commento in cima al codice sorgente:

```abap
FUNCTION z_flight_get_carrier.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_CARRID) TYPE  S_CARR_ID
*"  EXPORTING
*"     VALUE(ES_CARRIER) TYPE  SCARR
*"  EXCEPTIONS
*"      NOT_FOUND
*"----------------------------------------------------------------------
  SELECT SINGLE * FROM scarr
    WHERE carrid = @iv_carrid
    INTO @es_carrier.
  IF sy-subrc <> 0.
    RAISE not_found.
  ENDIF.
ENDFUNCTION.
```

| Tipo di parametro | Direzione (vista dal modulo funzione) | Note                                              |
| ----------------- | ------------------------------------- | ------------------------------------------------- |
| Importing         | in ingresso                           | può essere opzionale e avere un valore di default |
| Exporting         | in uscita                             | sempre opzionale per chi chiama                   |
| Changing          | in ingresso e in uscita               |                                                   |
| Tables            | in ingresso e in uscita               | tabelle interne; obsoleto, usa Changing           |
| Exceptions        | casi di errore                        | eccezioni classiche, sollevate con `RAISE`        |

**Passaggio per valore** (la checkbox nell'interfaccia, `VALUE(...)` nel commento) passa una copia. Senza, il parametro passa per riferimento. I moduli funzione RFC devono passare tutto per valore.

> [!TIP]
> Un modulo funzione è come il distributore automatico nel corridoio. Tutti nell'edificio possono usarlo, la fessura per le monete e lo sportello della bevanda sono uguali per tutti (l'interfaccia), e non ti serve sapere che cosa c'è dentro.

## Chiamare un modulo funzione

```abap
DATA ls_carrier TYPE scarr.

CALL FUNCTION 'Z_FLIGHT_GET_CARRIER'
  EXPORTING
    iv_carrid  = 'LH'
  IMPORTING
    es_carrier = ls_carrier
  EXCEPTIONS
    not_found  = 1
    OTHERS     = 2.

CASE sy-subrc.
  WHEN 0.
    WRITE: / ls_carrier-carrname.
  WHEN 1.
    WRITE: / 'Compagnia non trovata'.
  WHEN OTHERS.
    WRITE: / 'Errore imprevisto'.
ENDCASE.
```

- Dal lato di chi chiama le direzioni sono invertite: passi i parametri importing del modulo funzione dopo `EXPORTING`, e ricevi i suoi parametri exporting dopo `IMPORTING`.
- Il nome è un letterale di testo in maiuscolo. Se è sbagliato, il controllo di sintassi non se ne accorge e il programma va in dump con `CALL_FUNCTION_NOT_FOUND`.
- Ogni eccezione riceve un numero. Quando il modulo funzione la solleva, la chiamata termina e `sy-subrc` prende quel numero. `OTHERS` cattura le eccezioni che non hai elencato.
- Non scrivere la chiamata a mano: in `SE38` usa il pulsante **Modello** (Ctrl+F6), in ADT scrivi il nome e premi Ctrl+Spazio. L'editor inserisce la chiamata completa con tutti i parametri.

> [!WARNING]
> Se un modulo funzione solleva un'eccezione classica che non è elencata dopo `EXCEPTIONS` (e non c'è `OTHERS`), il programma termina con un runtime error. Elenca sempre le eccezioni, o almeno `OTHERS`, e controlla `sy-subrc`.

Al posto di `RAISE not_found`, un modulo funzione può usare `MESSAGE e001(zflight) RAISING not_found`: chi chiama riceve `sy-subrc` e i campi del messaggio `sy-msgid`, `sy-msgno`, `sy-msgv1` ... `sy-msgv4`. I moduli funzione più recenti possono sollevare anche [eccezioni basate su classi](./0089-class-based-exceptions.it.md), dichiarate con la checkbox **Classi di eccezione**.

## Testare in SE37

In `SE37` inserisci il nome e premi **Test/Esegui** (F8). La schermata di test ti fa inserire i parametri importing, esegue il modulo funzione e mostra i parametri exporting, l'eccezione sollevata e il tempo di esecuzione. È il modo più veloce per scoprire che cosa fa un modulo funzione standard prima di chiamarlo nel tuo codice.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea un gruppo funzione `ZFLIGHT` e un modulo funzione `Z_FLIGHT_GET_CONNECTIONS` con un parametro importing per la compagnia, un parametro changing di tipo tabella di `SPFLI` e un'eccezione `NO_DATA`.
> 2. Testalo in `SE37` con `LH` e con una compagnia che non esiste.
> 3. Chiamalo da un report e gestisci l'eccezione.

### Soluzione

```abap
FUNCTION z_flight_get_connections.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_CARRID) TYPE  S_CARR_ID
*"  CHANGING
*"     VALUE(CT_CONNECTIONS) TYPE  SPFLI_TAB
*"  EXCEPTIONS
*"      NO_DATA
*"----------------------------------------------------------------------
  SELECT * FROM spfli
    WHERE carrid = @iv_carrid
    INTO TABLE @ct_connections.
  IF sy-subrc <> 0.
    RAISE no_data.
  ENDIF.
ENDFUNCTION.
```

```abap
REPORT zflight_call_fm.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.

START-OF-SELECTION.
  DATA lt_connections TYPE spfli_tab.

  CALL FUNCTION 'Z_FLIGHT_GET_CONNECTIONS'
    EXPORTING
      iv_carrid      = p_carrid
    CHANGING
      ct_connections = lt_connections
    EXCEPTIONS
      no_data        = 1
      OTHERS         = 2.
  IF sy-subrc <> 0.
    WRITE: / 'Nessun collegamento per', p_carrid.
    RETURN.
  ENDIF.

  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
```

`SPFLI_TAB` è un tipo tabella di `SPFLI` nel Dizionario. Se il tuo sistema non ce l'ha, crea un tuo [tipo tabella](./0048-ddic-structures-and-table-types.it.md).

> [!NOTE]
>
> - Un modulo funzione è una procedura globale con un'interfaccia tipizzata; vive in un gruppo funzione, che contiene anche dati globali condivisi.
> - Parametri: Importing, Exporting, Changing, Tables (obsoleto) ed Exceptions; il passaggio per valore crea una copia.
> - Dal lato di chi chiama le direzioni sono invertite: `EXPORTING` invia i valori, `IMPORTING` li riceve.
> - Elenca le eccezioni con i numeri (e `OTHERS`) dopo `EXCEPTIONS`, e controlla `sy-subrc`.
> - Usa il pulsante Modello per inserire le chiamate, e `SE37` per testare i moduli funzione prima di usarli.
