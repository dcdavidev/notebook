---
title: Classi e oggetti
description: Classi locali, DEFINITION e IMPLEMENTATION, NEW e riferimenti.
---

_Livello intermedio_

Una **classe** è un tipo che raggruppa dati e codice. Prima di usarla la dichiari e la implementi. Poi ne crei degli **oggetti** e lavori con loro tramite i **riferimenti a oggetti**.

Questa lezione tratta le **classi locali**: classi definite dentro un programma e visibili solo lì. Sono perfette per imparare e per strutturare un report. Le classi riutilizzabili da tutto il sistema sono le [classi globali](./0087-global-classes.md), costruite allo stesso modo.

## Definizione e implementazione

Una classe ha due parti:

- la **definizione** (`CLASS ... DEFINITION`) dichiara i componenti: attributi, metodi e altro. Dice _che cosa_ offre la classe.
- l'**implementazione** (`CLASS ... IMPLEMENTATION`) contiene il codice di ogni metodo dichiarato nella definizione. Dice _come_.

```abap
REPORT zflight_classes.

CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid TYPE s_carr_id.
    DATA mv_connid TYPE s_conn_id.
    METHODS display.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD display.
    WRITE: / 'Volo', mv_carrid, mv_connid.
  ENDMETHOD.
ENDCLASS.
```

- `PUBLIC SECTION` rende i componenti visibili fuori dalla classe. Le altre sezioni, `PROTECTED` e `PRIVATE`, arrivano in [visibilità e incapsulamento](./0080-visibility-and-encapsulation.md).
- Ogni metodo dichiarato con `METHODS` deve avere un blocco `METHOD ... ENDMETHOD` nell'implementazione, altrimenti il controllo di sintassi fallisce. Una classe senza metodi non ha bisogno della parte di implementazione.
- Metti la definizione prima del codice che usa la classe. In un report, una disposizione comune è: definizioni, implementazioni, poi `START-OF-SELECTION`.

## Creare oggetti con NEW

Una classe è solo una descrizione. Per usarla crei un oggetto, detto anche **istanza**, con l'operatore `NEW`. Restituisce un riferimento al nuovo oggetto, che salvi in una **variabile di riferimento** dichiarata con `TYPE REF TO`:

```abap
START-OF-SELECTION.
  DATA lo_flight TYPE REF TO lcl_flight.   " una variabile di riferimento, ancora vuota
  lo_flight = NEW #( ).                     " crea un oggetto; # = il tipo di lo_flight

  lo_flight->mv_carrid = 'LH'.               " -> accede a un componente dell'oggetto
  lo_flight->mv_connid = '0400'.
  lo_flight->display( ).                     " chiama un metodo

  DATA(lo_other) = NEW lcl_flight( ).        " inline: il tipo si indica dopo NEW
  lo_other->mv_carrid = 'AZ'.
  lo_other->display( ).
```

- Il **selettore di componente dell'oggetto** `->` raggiunge un attributo o un metodo tramite un riferimento.
- Ogni `NEW` crea un oggetto distinto con i suoi attributi: modificare `lo_other` non tocca `lo_flight`.
- Nel codice vecchio troverai `CREATE OBJECT lo_flight.`, che fa lo stesso di `lo_flight = NEW #( ).`, e `CALL METHOD lo_flight->display.` per chiamare un metodo. Funzionano ancora, ma usa le forme moderne.

> [!TIP]
> L'oggetto è un'auto parcheggiata in un garage; la variabile di riferimento è lo scontrino del parcheggio. Lo scontrino non è l'auto, ma con lui trovi l'auto e la guidi. Due scontrini possono indicare la stessa auto.

## Riferimenti, non copie

Assegnare una variabile di riferimento a un'altra copia il **riferimento**, non l'oggetto. A quel punto entrambe le variabili puntano allo stesso oggetto:

```abap
DATA(lo_a) = NEW lcl_flight( ).
lo_a->mv_carrid = 'LH'.

DATA(lo_b) = lo_a.            " stesso oggetto, due riferimenti
lo_b->mv_carrid = 'UA'.

WRITE: / lo_a->mv_carrid.     " UA: la modifica si vede da entrambi
```

Un oggetto vive finché almeno un riferimento punta a lui. Quando non resta nessun riferimento (per esempio dopo `CLEAR lo_a` e `CLEAR lo_b`), il **garbage collector** lo toglie dalla memoria. Non cancelli mai gli oggetti tu.

## Riferimenti iniziali

Una variabile di riferimento che non punta a nessun oggetto è **iniziale**. Accedere a un componente tramite lei è un errore di runtime (`CX_SY_REF_IS_INITIAL`, mostrato in `ST22` come `OBJECTS_OBJREF_NOT_ASSIGNED`). Controllala con `IS BOUND`:

```abap
DATA lo_flight TYPE REF TO lcl_flight.

IF lo_flight IS NOT BOUND.
  lo_flight = NEW #( ).
ENDIF.
lo_flight->display( ).
```

> [!WARNING]
> Dichiarare `DATA lo_flight TYPE REF TO lcl_flight` non crea un oggetto: crea uno scontrino vuoto. Dimenticare `NEW` è la causa più comune dei dump `OBJECTS_OBJREF_NOT_ASSIGNED`.

Se due classi locali si riferiscono l'una all'altra, la prima deve sapere che la seconda esiste prima della sua definizione. Dichiarala in anticipo con `CLASS lcl_booking DEFINITION DEFERRED.`

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi una classe locale `lcl_connection` con attributi pubblici per compagnia, numero di collegamento, città di partenza e città di arrivo, e un metodo `display` che li scrive su una riga.
> 2. In `START-OF-SELECTION`, leggi da `SPFLI` i collegamenti di `LH`, crea un oggetto per ogni riga e salva i riferimenti in una tabella interna di tipo `TABLE OF REF TO lcl_connection`.
> 3. Scorri la tabella e chiama `display` per ogni oggetto.

### Soluzione

```abap
REPORT zflight_objects.

CLASS lcl_connection DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_cityfrom TYPE s_from_cit.
    DATA mv_cityto   TYPE s_to_city.
    METHODS display.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD display.
    WRITE: / mv_carrid, mv_connid, mv_cityfrom, mv_cityto.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_objects TYPE STANDARD TABLE OF REF TO lcl_connection WITH EMPTY KEY.

  SELECT carrid, connid, cityfrom, cityto FROM spfli
    WHERE carrid = 'LH'
    INTO TABLE @DATA(lt_connections).

  LOOP AT lt_connections INTO DATA(ls_connection).
    DATA(lo_connection) = NEW lcl_connection( ).
    lo_connection->mv_carrid   = ls_connection-carrid.
    lo_connection->mv_connid   = ls_connection-connid.
    lo_connection->mv_cityfrom = ls_connection-cityfrom.
    lo_connection->mv_cityto   = ls_connection-cityto.
    APPEND lo_connection TO lt_objects.
  ENDLOOP.

  LOOP AT lt_objects INTO DATA(lo_object).
    lo_object->display( ).
  ENDLOOP.
```

Valorizzare gli attributi uno per uno è scomodo: i [costruttori](./0079-constructors.md) ti permettono di passare i valori direttamente a `NEW`.

> [!NOTE]
>
> - Una classe ha una definizione (che cosa offre) e un'implementazione (il codice dei suoi metodi).
> - `NEW` crea un oggetto e restituisce un riferimento; salvalo in una variabile `TYPE REF TO` la classe.
> - Usa `->` per accedere agli attributi e chiamare i metodi tramite un riferimento.
> - Assegnare un riferimento copia il riferimento, non l'oggetto; gli oggetti senza riferimenti vengono rimossi dal garbage collector.
> - Controlla `IS BOUND` prima di usare un riferimento che potrebbe essere iniziale.
