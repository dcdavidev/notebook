---
title: I componenti statici
description: CLASS-DATA, CLASS-METHODS e l'operatore =>.
---

_Livello intermedio_

Finora ogni attributo e ogni metodo che hai scritto apparteneva a un oggetto: ogni istanza aveva la sua copia dei dati e per chiamare un metodo ti serviva un riferimento. I **componenti statici** appartengono invece alla classe stessa. Di un attributo statico esiste una sola copia, condivisa da tutte le istanze, e un metodo statico lo puoi chiamare senza creare nessun oggetto.

Li userai per contatori, cache, costanti, metodi di utilità e per i metodi factory che incontrerai nei [design pattern](./0088-design-patterns.it.md).

## Di istanza o statici

| Componente | Di istanza              | Statico                   |
| ---------- | ----------------------- | ------------------------- |
| Attributo  | `DATA`                  | `CLASS-DATA`              |
| Metodo     | `METHODS`               | `CLASS-METHODS`           |
| Evento     | `EVENTS`                | `CLASS-EVENTS`            |
| Accesso    | `lo_object->componente` | `nome_classe=>componente` |
| Durata     | quanto l'oggetto        | quanto il programma       |
| Copie      | una per oggetto         | una per classe            |

Le `CONSTANTS` sono sempre statiche: le leggi con `=>`, per esempio `lcl_flight=>c_max_seats`.

> [!TIP]
> Pensa a un condominio. Ogni appartamento ha la sua cucina (attributi di istanza): quello che cucini tu non cambia la cucina del vicino. La bacheca nell'atrio invece è condivisa (attributo statico): chi ci appende un avviso lo cambia per tutti, e la bacheca c'è anche quando gli appartamenti sono vuoti.

## Dichiarare e usare i componenti statici

Il **selettore di componente di classe** `=>` legge un attributo statico o chiama un metodo statico attraverso il nome della classe. Il **selettore di componente di oggetto** `->` funziona solo attraverso un riferimento.

```abap
REPORT zstatic_components.

CLASS lcl_booking DEFINITION.
  PUBLIC SECTION.
    CONSTANTS c_max_per_customer TYPE i VALUE 5.

    CLASS-DATA gv_count TYPE i READ-ONLY.     " condiviso da tutte le prenotazioni

    CLASS-METHODS get_count
      RETURNING VALUE(rv_count) TYPE i.

    METHODS constructor
      IMPORTING iv_customer TYPE s_customer.

  PRIVATE SECTION.
    DATA mv_customer TYPE s_customer.          " uno per prenotazione
ENDCLASS.

CLASS lcl_booking IMPLEMENTATION.
  METHOD constructor.
    mv_customer = iv_customer.
    gv_count = gv_count + 1.                  " dentro la classe non serve il prefisso
  ENDMETHOD.

  METHOD get_count.
    rv_count = gv_count.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE: / 'Prima:', lcl_booking=>get_count( ).    " funziona senza oggetti

  DATA(lo_first)  = NEW lcl_booking( '00000001' ).
  DATA(lo_second) = NEW lcl_booking( '00000002' ).

  WRITE: / 'Dopo:', lcl_booking=>gv_count.         " 2
  WRITE: / 'Limite:', lcl_booking=>c_max_per_customer.
```

Nei metodi della classe stessa puoi scrivere direttamente `gv_count`, oppure `lcl_booking=>gv_count` se vuoi rendere evidente che è statico. Fuori dalla classe ti serve sempre il nome della classe.

L'attributo statico viene inizializzato una volta sola, la prima volta che il programma usa la classe. Se ti serve del codice per prepararlo, mettilo nel costruttore statico `class_constructor`, che hai visto nella lezione sui [costruttori](./0079-constructors.it.md).

## Che cosa non può fare un metodo statico

Un metodo statico gira senza un oggetto, quindi al suo interno non esiste `me`. Non può leggere gli attributi di istanza né chiamare direttamente i metodi di istanza della sua classe:

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid TYPE s_carr_id.
    CLASS-METHODS describe.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD describe.
    WRITE mv_carrid.     " errore di sintassi: qui non c'è nessuna istanza
  ENDMETHOD.
ENDCLASS.
```

Il contrario invece funziona: un metodo di istanza può usare liberamente gli attributi statici e chiamare i metodi statici. Se a un metodo statico servono dati di istanza, deve ricevere un riferimento a un oggetto come parametro, oppure crearne uno.

## Le classi di utilità

Una classe con soli metodi statici è una **classe di utilità**: un gruppo di funzioni con un nome, che non hanno bisogno di uno stato. Le puoi chiamare in posizione funzionale come qualsiasi altro metodo.

```abap
CLASS lcl_price_utils DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS add_vat
      IMPORTING iv_net          TYPE s_price
                iv_rate         TYPE p
      RETURNING VALUE(rv_gross) TYPE s_price.
ENDCLASS.

CLASS lcl_price_utils IMPLEMENTATION.
  METHOD add_vat.
    rv_gross = iv_net * ( 1 + iv_rate / 100 ).
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lv_gross) = lcl_price_utils=>add_vat( iv_net = 100 iv_rate = 22 ).
  WRITE / lv_gross.                                 " 122.00
```

`FINAL` significa che nessuno può ereditare dalla classe; vedrai perché nella lezione su [classi astratte e final](./0083-abstract-and-final.it.md).

> [!WARNING]
> Gli attributi statici sono stato globale. Ogni parte del programma li vede e li può cambiare (a meno che siano `READ-ONLY` o privati), e mantengono il valore per tutta l'esecuzione. Così i bug diventano difficili da seguire e gli unit test difficili da isolare, perché un test può lasciare dati sporchi per quello successivo. Usa gli attributi statici per costanti, contatori e cache, non come un posto nascosto in cui passare dati fra metodi.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi una classe locale `lcl_flight_cache` con una tabella statica privata `gt_carriers` di tipo `STANDARD TABLE OF scarr WITH EMPTY KEY`.
> 2. Aggiungi un metodo statico pubblico `get_name` che riceve un `carrid` e restituisce il `carrname`. Alla prima chiamata riempie `gt_carriers` con una `SELECT` su `SCARR`; dopo legge solo dalla tabella.
> 3. Chiamalo due volte da `START-OF-SELECTION` e controlla nel [debugger](./0028-debugger-basics.it.md) che la `SELECT` venga eseguita una volta sola.

### Soluzione

```abap
CLASS lcl_flight_cache DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS get_name
      IMPORTING iv_carrid      TYPE s_carr_id
      RETURNING VALUE(rv_name) TYPE s_carrname.
  PRIVATE SECTION.
    CLASS-DATA gt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.
ENDCLASS.

CLASS lcl_flight_cache IMPLEMENTATION.
  METHOD get_name.
    IF gt_carriers IS INITIAL.
      SELECT * FROM scarr INTO TABLE @gt_carriers.
    ENDIF.
    READ TABLE gt_carriers INTO DATA(ls_carrier) WITH KEY carrid = iv_carrid.
    IF sy-subrc = 0.
      rv_name = ls_carrier-carrname.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE / lcl_flight_cache=>get_name( 'LH' ).
  WRITE / lcl_flight_cache=>get_name( 'AA' ).
```

> [!NOTE]
>
> - `CLASS-DATA`, `CLASS-METHODS` e `CLASS-EVENTS` dichiarano componenti che appartengono alla classe, non a un oggetto.
> - Usa `nome_classe=>componente` per i componenti statici e `riferimento->componente` per quelli di istanza. Le costanti sono sempre statiche.
> - Di un attributo statico esiste una sola copia, condivisa da tutte le istanze, che vive per tutto il programma.
> - Un metodo statico non ha `me`: non può usare direttamente gli attributi e i metodi di istanza della sua classe.
> - Usa gli attributi statici con moderazione: sono stato globale e rendono più difficili i test.
