---
title: Strutture e tipi tabella nel Dizionario
description: Tipi globali che ogni programma può riutilizzare.
level: basic
---

Una **struttura del Dizionario** è un gruppo di campi, come le [strutture](./0031-structures.md) che dichiari con `TYPES BEGIN OF`, ma definita una sola volta nel Dizionario ABAP. Un **tipo tabella** è la versione del Dizionario di un tipo di tabella interna: fissa il tipo di riga, la [categoria di tabella](./0034-table-categories.md) e la [chiave](./0035-table-keys.md).

Nessuno dei due contiene dati o esiste nel database. Sono **tipi globali**: qualsiasi programma, classe o modulo funzione li può usare, e questo conta soprattutto per i parametri delle classi globali e dei moduli funzione.

## Le strutture del Dizionario

Una struttura ha delle componenti, ognuna con il tipo di un elemento dati o un tipo predefinito, proprio come i campi di una tabella. In ADT scegli **New** > **Other ABAP Repository Object** > **Structure**:

```abap
@EndUserText.label : 'Volo con nome della compagnia'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
define structure zs_flight_info {

  carrid   : s_carr_id;
  carrname : s_carrname;
  connid   : s_conn_id;
  fldate   : s_date;
  @Semantics.amount.currencyCode : 'zs_flight_info.currency'
  price    : s_price;
  currency : s_currcode;

}
```

In `SE11` scegli **Tipo dati** > **Struttura** e inserisci le stesse componenti nella scheda **Componenti**. Come per i campi di tabella, una componente `CURR` richiede un riferimento a una componente `CUKY`.

Una struttura può includere un'altra struttura con `.INCLUDE` in `SE11` o `include` in ADT, la versione del Dizionario di `INCLUDE TYPE` vista in [strutture annidate e include](./0032-nested-structures.md). Una componente può essere a sua volta una struttura o un tipo tabella; in quel caso la struttura è **profonda**.

## I tipi tabella

Un tipo tabella descrive una tabella interna. In `SE11` (**Tipo dati** > **Tipo tabella**) o in ADT imposti:

| Scheda o attributo  | Che cosa scegli                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| tipo riga           | la riga: una struttura, un elemento dati, una tabella o un tipo predefinito                     |
| accesso (categoria) | standard, sorted, hashed o generico (tabella indice, non specificato)                           |
| chiave primaria     | chiave standard (di default), tipo riga, componenti chiave o non specificata; unica o non unica |
| chiavi secondarie   | chiavi aggiuntive facoltative, come in [chiavi primarie e secondarie](./0035-table-keys.md)     |

Per la struttura qui sopra potresti creare `ZTT_FLIGHT_INFO`: tipo riga `ZS_FLIGHT_INFO`, accesso tabella standard, componenti chiave `CARRID`, `CONNID`, `FLDATE`, non unica.

Il sistema ha già molti tipi tabella che puoi riusare, come `STRING_TABLE` (una tabella standard di `string`) e `BAPIRET2_T` (una tabella di messaggi `BAPIRET2`, usata dalle [BAPI](./0071-bapis.md)).

> [!TIP]
> Una struttura nel Dizionario è il modello ufficiale di un modulo, depositato in comune: chiunque abbia bisogno di quel modulo usa lo stesso modello. Un tipo tabella è il modello di un raccoglitore di quei moduli, con la regola su come vanno archiviati dentro.

## Usarli in ABAP

Usi i tipi globali dopo `TYPE` come qualsiasi altro tipo:

```abap
REPORT zflight_info_demo.

DATA ls_info  TYPE zs_flight_info.                 " una riga
DATA lt_infos TYPE ztt_flight_info.                " una tabella di righe

ls_info = VALUE #( carrid = 'LH' carrname = 'Lufthansa' connid = '0400'
                   fldate = '20260301' price = 650 currency = 'EUR' ).
APPEND ls_info TO lt_infos.

LOOP AT lt_infos INTO ls_info.
  WRITE: / ls_info-carrid, ls_info-carrname, ls_info-connid,
           ls_info-price CURRENCY ls_info-currency, ls_info-currency.
ENDLOOP.
```

Quando usare un tipo globale e quando uno locale:

| Usa un tipo del Dizionario quando...                                      | Usa un `TYPES` locale quando...                   |
| ------------------------------------------------------------------------- | ------------------------------------------------- |
| è un parametro di un metodo di una classe globale o di un modulo funzione | si usa solo dentro un programma o una classe      |
| più programmi hanno bisogno esattamente dello stesso tipo                 | è un piccolo tipo di appoggio per un solo calcolo |
| serve a una schermata, a un ALV o a un'interfaccia RFC                    | può cambiare spesso senza toccare gli altri       |

Anche una tabella del database si può usare come tipo struttura (`TYPE sflight`), ma non usare una tabella come tipo solo perché i suoi campi vanno bene per caso: se qualcuno aggiunge un campo alla tabella, cambia anche il tuo tipo. Crea una struttura quando il tipo ha un significato proprio.

> [!WARNING]
> Un tipo globale è condiviso. Togliere o rinominare una componente, o cambiarne il tipo, può rompere tutti i programmi che lo usano, e cambiare una struttura usata in una tabella del database cambia anche quella tabella. Controlla la lista delle occorrenze prima di modificare una struttura o un tipo tabella globale.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la struttura `ZS_FLIGHT_INFO` e il tipo tabella `ZTT_FLIGHT_INFO` descritti in questa lezione, e attivali.
> 2. Scrivi un report che riempie una tabella `ZTT_FLIGHT_INFO` con due righe usando `VALUE` e le stampa.

### Soluzione

1. Crea la struttura con il sorgente ADT qui sopra, o in `SE11`. Poi crea il tipo tabella con tipo riga `ZS_FLIGHT_INFO`, accesso standard e chiave non unica `CARRID CONNID FLDATE`. Attivali entrambi.
2. Report:

```abap
REPORT zflight_info_table.

DATA(lt_infos) = VALUE ztt_flight_info(
  ( carrid = 'LH' carrname = 'Lufthansa' connid = '0400'
    fldate = '20260301' price = 650 currency = 'EUR' )
  ( carrid = 'AZ' carrname = 'Alitalia'  connid = '0555'
    fldate = '20260302' price = 180 currency = 'EUR' ) ).

LOOP AT lt_infos INTO DATA(ls_info).
  WRITE: / ls_info-carrid, ls_info-carrname, ls_info-connid, ls_info-fldate.
ENDLOOP.
```

> [!NOTE]
>
> - Una struttura del Dizionario è un gruppo globale di campi; non contiene dati e non è una tabella del database.
> - Un tipo tabella è un tipo globale di tabella interna, con tipo riga, categoria e chiavi.
> - Li usi con `TYPE` in qualsiasi programma; sono indispensabili per i parametri delle classi globali e dei moduli funzione.
> - Riusa i tipi tabella standard come `STRING_TABLE` e `BAPIRET2_T` quando vanno bene.
> - Modificare un tipo globale ha effetto su tutti i programmi che lo usano: controlla prima la lista delle occorrenze.
