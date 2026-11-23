---
title: I costruttori
description: Costruttori di istanza e statici.
level: intermediate
---

Creare un oggetto e poi valorizzarne gli attributi uno per uno, come in [classi e oggetti](./0076-classes-and-objects.md), è scomodo e rischioso: qualcuno può dimenticare un attributo e usare un oggetto costruito a metà. Un **costruttore** è un metodo speciale che gira automaticamente quando un oggetto viene creato, così ogni oggetto parte in uno stato valido.

ABAP ha due costruttori: il **costruttore di istanza**, che gira una volta per ogni nuovo oggetto, e il **costruttore statico**, che gira una volta per la classe.

## Il costruttore di istanza

Il costruttore di istanza è un metodo che si chiama `constructor`. Lo dichiari con `METHODS` come qualsiasi altro metodo, ma non lo chiami mai tu: lo chiama `NEW`, passandogli i parametri che indichi.

```abap
REPORT zflight_constructor.

CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_carrid TYPE s_carr_id
                iv_connid TYPE s_conn_id
                iv_fldate TYPE s_date.
    METHODS display.
  PRIVATE SECTION.
    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_fldate   TYPE s_date.
    DATA mv_seatsmax TYPE s_seatsmax.
    DATA mv_seatsocc TYPE s_seatsocc.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    mv_carrid = iv_carrid.
    mv_connid = iv_connid.
    mv_fldate = iv_fldate.
    SELECT SINGLE seatsmax, seatsocc FROM sflight
      WHERE carrid = @iv_carrid
        AND connid = @iv_connid
        AND fldate = @iv_fldate
      INTO (@mv_seatsmax, @mv_seatsocc).
  ENDMETHOD.

  METHOD display.
    WRITE: / mv_carrid, mv_connid, mv_fldate, mv_seatsocc, '/', mv_seatsmax.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SELECT SINGLE carrid, connid, fldate FROM sflight WHERE carrid = 'LH' INTO @DATA(ls_key).

  DATA(lo_flight) = NEW lcl_flight( iv_carrid = ls_key-carrid
                                    iv_connid = ls_key-connid
                                    iv_fldate = ls_key-fldate ).
  lo_flight->display( ).
```

Le regole del costruttore di istanza:

- Può avere solo parametri `IMPORTING` (obbligatori od opzionali) ed eccezioni. Niente `EXPORTING`, `CHANGING` o `RETURNING`: il risultato di `NEW` è l'oggetto stesso.
- Se ha parametri obbligatori, ogni `NEW` deve passarli. È così che garantisci che nessun oggetto venga creato senza la sua chiave.
- Gira dopo che gli attributi hanno ricevuto i loro valori iniziali `VALUE`, quindi puoi contarci dentro il costruttore.
- Una classe può avere un solo costruttore di istanza. Per offrire più modi di creare oggetti, usa parametri opzionali o metodi factory statici (vedi [i design pattern](./0088-design-patterns.md)).

Grazie al costruttore, ora gli attributi possono essere **privati**: nessuno da fuori può mettere l'oggetto in uno stato incoerente. Ne parliamo in [visibilità e incapsulamento](./0080-visibility-and-encapsulation.md).

> [!TIP]
> Un costruttore è la reception di un albergo. Non ricevi la chiave della camera senza mostrare un documento e il numero di prenotazione, e trovi la camera già pulita e pronta. Nessuno riceve la chiave di una camera che non è pronta.

## Quando il costruttore fallisce

Se il volo non esiste, il costruttore qui sopra crea un oggetto con zero posti. Un costruttore dovrebbe rifiutarsi di costruire un oggetto non valido. Lo fa sollevando un'eccezione: in quel caso `NEW` non crea l'oggetto, e la variabile di riferimento mantiene il valore che aveva prima.

```abap
METHODS constructor
  IMPORTING iv_carrid TYPE s_carr_id
            iv_connid TYPE s_conn_id
            iv_fldate TYPE s_date
  RAISING   zcx_flight_not_found.          " la tua classe di eccezione

METHOD constructor.
  " ... SELECT SINGLE come prima
  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE zcx_flight_not_found.
  ENDIF.
ENDMETHOD.
```

Chi chiama cattura l'eccezione con `TRY ... CATCH`. Imparerai entrambi i lati in [le eccezioni basate su classi](./0089-class-based-exceptions.md), e come creare una classe come `ZCX_FLIGHT_NOT_FOUND` in [classi di eccezione personalizzate](./0090-custom-exception-classes.md).

> [!WARNING]
> Tieni corti i costruttori. Leggere una riga per validare la chiave va bene; leggere migliaia di righe o chiamare sistemi remoti in un costruttore rende lento ogni `NEW` e difficile da testare. Carica i dati pesanti quando servono, in un metodo.

## Il costruttore statico

Il **costruttore statico** è un metodo che si chiama `class_constructor`, dichiarato con `CLASS-METHODS`. Non ha parametri, e il runtime lo chiama **una volta per esecuzione del programma**, subito prima che la classe venga usata la prima volta: prima che venga creato il primo oggetto, o prima del primo accesso a un componente statico.

```abap
CLASS lcl_carrier_names DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS class_constructor.
    METHODS get_name
      IMPORTING iv_carrid      TYPE s_carr_id
      RETURNING VALUE(rv_name) TYPE s_carrname.
  PRIVATE SECTION.
    CLASS-DATA gt_carriers TYPE HASHED TABLE OF scarr WITH UNIQUE KEY carrid.
ENDCLASS.

CLASS lcl_carrier_names IMPLEMENTATION.
  METHOD class_constructor.
    SELECT * FROM scarr INTO TABLE @gt_carriers.   " gira una volta, condiviso da tutti gli oggetti
  ENDMETHOD.

  METHOD get_name.
    IF line_exists( gt_carriers[ carrid = iv_carrid ] ).
      rv_name = gt_carriers[ carrid = iv_carrid ]-carrname.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

`CLASS-DATA` dichiara un attributo statico, condiviso da tutti gli oggetti della classe. Attributi e metodi statici sono spiegati in [i componenti statici](./0081-static-components.md).

|                | Costruttore di istanza         | Costruttore statico                         |
| -------------- | ------------------------------ | ------------------------------------------- |
| Nome           | `constructor`                  | `class_constructor`                         |
| Dichiarato con | `METHODS`                      | `CLASS-METHODS`                             |
| Gira           | a ogni `NEW`                   | una volta, prima del primo uso della classe |
| Parametri      | solo `IMPORTING`               | nessuno                                     |
| Può accedere a | attributi di istanza e statici | solo attributi statici                      |

Quando le classi ereditano l'una dall'altra, il costruttore di una sottoclasse deve chiamare quello della superclasse con `super->constructor( )`: vedi [l'ereditarietà](./0082-inheritance.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi una classe `lcl_connection` il cui costruttore riceve la compagnia e il numero di collegamento, legge la riga da `SPFLI` e salva le città di partenza e di arrivo in attributi privati.
> 2. Aggiungi un metodo `display`.
> 3. Aggiungi un costruttore statico che scrive "classe caricata" con `WRITE`, crea tre oggetti e controlla che il testo compaia una sola volta.

### Soluzione

```abap
REPORT zflight_connection_ctor.

CLASS lcl_connection DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS class_constructor.
    METHODS constructor
      IMPORTING iv_carrid TYPE s_carr_id
                iv_connid TYPE s_conn_id.
    METHODS display.
  PRIVATE SECTION.
    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_cityfrom TYPE s_from_cit.
    DATA mv_cityto   TYPE s_to_city.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD class_constructor.
    WRITE / 'classe caricata'.
  ENDMETHOD.

  METHOD constructor.
    mv_carrid = iv_carrid.
    mv_connid = iv_connid.
    SELECT SINGLE cityfrom, cityto FROM spfli
      WHERE carrid = @iv_carrid AND connid = @iv_connid
      INTO (@mv_cityfrom, @mv_cityto).
  ENDMETHOD.

  METHOD display.
    WRITE: / mv_carrid, mv_connid, mv_cityfrom, mv_cityto.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SELECT carrid, connid FROM spfli INTO TABLE @DATA(lt_keys) UP TO 3 ROWS.

  LOOP AT lt_keys INTO DATA(ls_key).
    NEW lcl_connection( iv_carrid = ls_key-carrid iv_connid = ls_key-connid )->display( ).
  ENDLOOP.
```

`NEW lcl_connection( ... )->display( )` crea un oggetto e ne chiama un metodo in un'unica istruzione, senza variabile di riferimento.

> [!NOTE]
>
> - Il costruttore di istanza (`METHODS constructor`) gira a ogni `NEW` e riceve solo parametri `IMPORTING`.
> - I parametri obbligatori del costruttore garantiscono che nessun oggetto venga creato senza i suoi dati essenziali.
> - Un costruttore che solleva un'eccezione impedisce la creazione dell'oggetto.
> - Il costruttore statico (`CLASS-METHODS class_constructor`) non ha parametri e gira una volta, prima del primo uso della classe.
> - Tieni veloci i costruttori; sposta il lavoro pesante in metodi chiamati quando serve.
