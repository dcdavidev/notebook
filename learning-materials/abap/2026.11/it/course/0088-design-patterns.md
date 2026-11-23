---
title: I design pattern
description: Singleton, factory e strategy in ABAP.
level: intermediate
---

Un **design pattern** è una soluzione collaudata a un problema di progettazione che si ripresenta di continuo. Non è una libreria da installare: è un modo di disporre classi, interfacce e riferimenti. Questa lezione mostra tre pattern che incontrerai in quasi ogni base di codice ABAP, costruiti con gli strumenti delle lezioni precedenti: i [componenti statici](./0081-static-components.md), le [interfacce](./0084-interfaces.md) e il [polimorfismo](./0085-polymorphism-and-casting.md).

| Pattern   | Problema che risolve                                             | Strumento chiave                                 |
| --------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| Singleton | di una classe deve esistere esattamente un'istanza               | `CREATE PRIVATE` e un attributo statico          |
| Factory   | non deve essere il chiamante a scegliere quale classe istanziare | un metodo statico che restituisce un'interfaccia |
| Strategy  | un algoritmo deve essere sostituibile a runtime                  | un'interfaccia con più implementazioni           |

## Singleton

Un **singleton** è una classe con una sola istanza per tutto il programma, per esempio una configurazione che si legge una volta dal database. `CREATE PRIVATE` impedisce a chiunque fuori dalla classe di usare `NEW`, quindi l'unico modo per ottenere un oggetto è un metodo statico che lo crea la prima volta e poi restituisce sempre lo stesso.

```abap
REPORT zdesign_patterns.

CLASS lcl_config DEFINITION FINAL CREATE PRIVATE.
  PUBLIC SECTION.
    CLASS-METHODS get_instance
      RETURNING VALUE(ro_instance) TYPE REF TO lcl_config.
    METHODS constructor.
    METHODS get_max_seats
      RETURNING VALUE(rv_max) TYPE i.
  PRIVATE SECTION.
    CLASS-DATA go_instance TYPE REF TO lcl_config.
    DATA mv_max_seats TYPE i.
ENDCLASS.

CLASS lcl_config IMPLEMENTATION.
  METHOD get_instance.
    IF go_instance IS NOT BOUND.
      go_instance = NEW #( ).
    ENDIF.
    ro_instance = go_instance.
  ENDMETHOD.

  METHOD constructor.
    mv_max_seats = 9.            " nel codice reale: lettura da una tabella di customizing
  ENDMETHOD.

  METHOD get_max_seats.
    rv_max = mv_max_seats.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE / lcl_config=>get_instance( )->get_max_seats( ).
* DATA(lo_config) = NEW lcl_config( ).   " errore di sintassi: CREATE PRIVATE
```

> [!WARNING]
> Un singleton è stato globale con un bel nome. Ha gli stessi problemi di qualsiasi [attributo statico](./0081-static-components.md): è difficile da sostituire nei test e nasconde le dipendenze. Usalo per le cose che esistono davvero una volta sola, come un buffer o un logger, non come scorciatoia per non passare parametri.

## Factory

Un **metodo factory** crea gli oggetti al posto del chiamante. Il chiamante chiede "una tariffa per questa classe di prenotazione" e riceve un riferimento a interfaccia; non nomina mai la classe concreta. Quando aggiungi una nuova tariffa, cambi solo la factory.

```abap
INTERFACE lif_fare.
  METHODS get_price
    IMPORTING iv_base         TYPE s_price
    RETURNING VALUE(rv_price) TYPE s_price.
ENDINTERFACE.

CLASS lcl_economy_fare DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_fare.
ENDCLASS.

CLASS lcl_economy_fare IMPLEMENTATION.
  METHOD lif_fare~get_price.
    rv_price = iv_base.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_business_fare DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_fare.
ENDCLASS.

CLASS lcl_business_fare IMPLEMENTATION.
  METHOD lif_fare~get_price.
    rv_price = iv_base * 2.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_fare_factory DEFINITION FINAL.
  PUBLIC SECTION.
    CLASS-METHODS create
      IMPORTING iv_class       TYPE s_class      " Y, C o F
      RETURNING VALUE(ro_fare) TYPE REF TO lif_fare.
ENDCLASS.

CLASS lcl_fare_factory IMPLEMENTATION.
  METHOD create.
    CASE iv_class.
      WHEN 'C' OR 'F'.
        ro_fare = NEW lcl_business_fare( ).
      WHEN OTHERS.
        ro_fare = NEW lcl_economy_fare( ).
    ENDCASE.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_fare) = lcl_fare_factory=>create( 'C' ).
  WRITE / lo_fare->get_price( 300 ).                 " 600.00
```

Nelle classi globali spesso si combina la factory con `CREATE PRIVATE` sulle classi concrete, e si rende la factory loro friend (vedi [visibilità e incapsulamento](./0080-visibility-and-encapsulation.md)): così la factory è l'unico modo per ottenere un oggetto.

> [!TIP]
> Una factory è il banco di un autonoleggio. Chiedi "un'utilitaria per tre giorni"; l'impiegato decide quale modello è libero e ti dà le chiavi. La guidi allo stesso modo qualunque modello ti capiti, e l'autonoleggio può cambiare il parco auto senza avvisarti.

## Strategy

Con il pattern **strategy** una classe affida una parte del suo lavoro a un oggetto che implementa un'interfaccia. Le passi un oggetto diverso, e il comportamento cambia senza toccare la classe. Qui una prenotazione calcola il totale con una strategia di sconto scelta dal chiamante:

```abap
INTERFACE lif_discount.
  METHODS apply
    IMPORTING iv_amount        TYPE s_price
    RETURNING VALUE(rv_amount) TYPE s_price.
ENDINTERFACE.

CLASS lcl_no_discount DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_discount.
ENDCLASS.

CLASS lcl_no_discount IMPLEMENTATION.
  METHOD lif_discount~apply.
    rv_amount = iv_amount.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_loyalty_discount DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_discount.
ENDCLASS.

CLASS lcl_loyalty_discount IMPLEMENTATION.
  METHOD lif_discount~apply.
    rv_amount = iv_amount * '0.85'.                  " 15% di sconto
  ENDMETHOD.
ENDCLASS.

CLASS lcl_booking DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING io_discount TYPE REF TO lif_discount.
    METHODS get_total
      IMPORTING iv_amount       TYPE s_price
      RETURNING VALUE(rv_total) TYPE s_price.
  PRIVATE SECTION.
    DATA mo_discount TYPE REF TO lif_discount.
ENDCLASS.

CLASS lcl_booking IMPLEMENTATION.
  METHOD constructor.
    mo_discount = io_discount.
  ENDMETHOD.

  METHOD get_total.
    rv_total = mo_discount->apply( iv_amount ).
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_regular) = NEW lcl_booking( NEW lcl_no_discount( ) ).
  DATA(lo_member)  = NEW lcl_booking( NEW lcl_loyalty_discount( ) ).
  WRITE: / lo_regular->get_total( 400 ), lo_member->get_total( 400 ).   " 400.00 340.00
```

Passare la strategia nel costruttore è una forma di **dependency injection**. È anche ciò che rende le classi testabili: in un test inietti un'implementazione finta, come vedrai nei [test double](./0106-test-doubles.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi una strategia `lcl_child_discount` che dimezza l'importo, e usala con `lcl_booking`.
> 2. Estendi `lcl_fare_factory=>create` in modo che tenga in cache gli oggetti che crea: chiamandola due volte con la stessa classe di prenotazione restituisce la stessa istanza. Usa una tabella hashed statica privata.

### Soluzione

```abap
CLASS lcl_child_discount DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_discount.
ENDCLASS.

CLASS lcl_child_discount IMPLEMENTATION.
  METHOD lif_discount~apply.
    rv_amount = iv_amount / 2.
  ENDMETHOD.
ENDCLASS.

" In lcl_fare_factory, sezione privata:
    TYPES: BEGIN OF ty_cache,
             class TYPE s_class,
             fare  TYPE REF TO lif_fare,
           END OF ty_cache.
    CLASS-DATA gt_cache TYPE HASHED TABLE OF ty_cache WITH UNIQUE KEY class.

" Nuova implementazione di create:
  METHOD create.
    READ TABLE gt_cache INTO DATA(ls_cache) WITH TABLE KEY class = iv_class.
    IF sy-subrc = 0.
      ro_fare = ls_cache-fare.
      RETURN.
    ENDIF.
    CASE iv_class.
      WHEN 'C' OR 'F'.
        ro_fare = NEW lcl_business_fare( ).
      WHEN OTHERS.
        ro_fare = NEW lcl_economy_fare( ).
    ENDCASE.
    INSERT VALUE #( class = iv_class fare = ro_fare ) INTO TABLE gt_cache.
  ENDMETHOD.
```

> [!NOTE]
>
> - Un singleton usa `CREATE PRIVATE`, un riferimento statico privato e un metodo statico `get_instance`. Usalo con parsimonia.
> - Un metodo factory restituisce un riferimento a interfaccia e nasconde quale classe concreta crea.
> - Una strategy è un'interfaccia le cui implementazioni sostituisci per cambiare una parte del comportamento di una classe.
> - Iniettare le strategie attraverso il costruttore disaccoppia le classi e le rende testabili.
> - I pattern sono strumenti, non obiettivi: usane uno solo quando risolve un problema che hai davvero.
