---
title: Polimorfismo e casting
description: Una chiamata, tanti comportamenti; up cast, down cast e IS INSTANCE OF.
---

_Livello intermedio_

**Polimorfismo** significa che la stessa chiamata di metodo fa cose diverse a seconda dell'oggetto che sta dietro al riferimento. L'hai già visto all'opera con l'[ereditarietà](./0082-inheritance.md) e le [interfacce](./0084-interfaces.md): un ciclo su una tabella di riferimenti chiamava `get_price( )`, e ogni oggetto rispondeva a modo suo. Questa lezione spiega le regole che stanno sotto, e come spostare un riferimento fra tipi generici e specifici con i **cast**.

## Tipo statico e tipo dinamico

Ogni variabile riferimento ha due tipi:

- Il **tipo statico** è il tipo della dichiarazione, per esempio `REF TO lcl_ticket`. È fisso, e decide quali componenti puoi scrivere dopo `->`: il controllo di sintassi usa questo.
- Il **tipo dinamico** è la classe dell'oggetto a cui il riferimento punta durante l'esecuzione, per esempio `lcl_business_ticket`. Può cambiare a ogni assegnazione, e decide quale implementazione di un metodo viene eseguita.

Il tipo dinamico è sempre il tipo statico stesso o una sua sottoclasse (oppure, per un'interfaccia, una classe che la implementa).

```abap
REPORT zpolymorphism.

CLASS lcl_ticket DEFINITION.
  PUBLIC SECTION.
    METHODS get_price RETURNING VALUE(rv_price) TYPE s_price.
ENDCLASS.

CLASS lcl_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = 500.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_business_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS get_price REDEFINITION.
    METHODS get_lounge RETURNING VALUE(rv_lounge) TYPE string.
ENDCLASS.

CLASS lcl_business_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = 1000.
  ENDMETHOD.

  METHOD get_lounge.
    rv_lounge = `Lounge B, gate 12`.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lo_ticket TYPE REF TO lcl_ticket.          " tipo statico: lcl_ticket

  lo_ticket = NEW lcl_business_ticket( ).          " tipo dinamico: lcl_business_ticket
  WRITE / lo_ticket->get_price( ).                 " 1000.00: gira la ridefinizione
* WRITE / lo_ticket->get_lounge( ).                " errore di sintassi: non è in lcl_ticket
```

> [!TIP]
> Tipo statico e tipo dinamico sono come una qualifica e la persona che la ricopre. Un ordine di servizio indirizzato al "responsabile di turno" può chiedere solo quello che sa fare qualsiasi responsabile di turno. Chi lo legge, e come lo esegue, dipende da chi è di turno stasera.

## Up cast

Un **up cast** (o cast di ampliamento) assegna un riferimento di un tipo più specifico a una variabile di un tipo più generico: da sottoclasse a superclasse, o da classe a interfaccia. È sempre sicuro, quindi ABAP lo fa in modo implicito con un'assegnazione normale:

```abap
DATA(lo_business) = NEW lcl_business_ticket( ).
DATA lo_general TYPE REF TO lcl_ticket.
DATA lo_any     TYPE REF TO object.

lo_general = lo_business.     " up cast: da sottoclasse a superclasse
lo_any     = lo_business.     " up cast verso la classe radice OBJECT
```

Gli up cast sono ciò che rende possibile il codice polimorfico: un metodo con un parametro di importazione `TYPE REF TO lcl_ticket` accetta qualsiasi biglietto, e una tabella di `REF TO lif_priceable` contiene insieme voli e camere d'albergo.

## Down cast

Un **down cast** (o cast di restrizione) va nella direzione opposta: da un tipo statico generico di nuovo a uno specifico, così puoi usare i componenti che ha solo la sottoclasse. Il compilatore non può sapere se funzionerà, quindi lo devi chiedere in modo esplicito con l'**operatore di casting** `?=`:

```abap
DATA lo_specific TYPE REF TO lcl_business_ticket.

lo_general = NEW lcl_business_ticket( ).
lo_specific ?= lo_general.                 " down cast, controllato a runtime
WRITE / lo_specific->get_lounge( ).
```

Il runtime controlla il tipo dinamico. Se l'oggetto non è un `lcl_business_ticket` (o una sua sottoclasse), il down cast solleva l'eccezione `CX_SY_MOVE_CAST_ERROR`, e il programma va in dump se non la catturi. Imparerai a catturare le eccezioni nella lezione sulle [eccezioni basate su classi](./0089-class-based-exceptions.md). Nel codice moderno puoi scrivere il down cast anche come espressione, `CAST lcl_business_ticket( lo_general )`, che vedrai nelle [espressioni costruttore](./0091-constructor-expressions.md).

> [!WARNING]
> Non fare mai un down cast alla cieca. Se non sei sicuro del tipo dinamico, controllalo prima con `IS INSTANCE OF`. E se ti ritrovi a scrivere molti down cast, di solito al progetto manca un metodo nella superclasse o nell'interfaccia.

## IS INSTANCE OF e CASE TYPE OF

Da ABAP 7.50 il predicato `IS INSTANCE OF` ti dice se un down cast andrebbe a buon fine:

```abap
DATA lt_tickets TYPE STANDARD TABLE OF REF TO lcl_ticket WITH EMPTY KEY.

lt_tickets = VALUE #( ( NEW lcl_ticket( ) ) ( NEW lcl_business_ticket( ) ) ).

LOOP AT lt_tickets INTO DATA(lo_item).
  WRITE / lo_item->get_price( ).
  IF lo_item IS INSTANCE OF lcl_business_ticket.
    lo_specific ?= lo_item.                 " ora è sicuro
    WRITE lo_specific->get_lounge( ).
  ENDIF.
ENDLOOP.
```

Quando le classi possibili sono diverse, `CASE TYPE OF` le controlla in ordine e può fare il down cast al posto tuo con `INTO`:

```abap
LOOP AT lt_tickets INTO lo_item.
  CASE TYPE OF lo_item.
    WHEN TYPE lcl_business_ticket INTO DATA(lo_biz).
      WRITE: / 'Business:', lo_biz->get_lounge( ).
    WHEN TYPE lcl_ticket.
      WRITE: / 'Economy'.
    WHEN OTHERS.
      WRITE: / 'Sconosciuto'.
  ENDCASE.
ENDLOOP.
```

Metti per prime le classi più specifiche: un biglietto business è anche un `lcl_ticket`, quindi l'ordine conta, come con `IF`... `ELSEIF`.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un metodo `print_ticket` in una classe locale `lcl_printer`, con un parametro di importazione `io_ticket TYPE REF TO lcl_ticket`. Stampa il prezzo e, solo per i biglietti business, la lounge.
> 2. Chiamalo una volta con un `lcl_ticket` e una volta con un `lcl_business_ticket`.
> 3. Togli il controllo `IS INSTANCE OF` e chiamalo di nuovo con un `lcl_ticket`. Guarda il dump in `ST22`.

### Soluzione

```abap
CLASS lcl_printer DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS print_ticket
      IMPORTING io_ticket TYPE REF TO lcl_ticket.
ENDCLASS.

CLASS lcl_printer IMPLEMENTATION.
  METHOD print_ticket.
    DATA lo_business TYPE REF TO lcl_business_ticket.
    WRITE / io_ticket->get_price( ).
    IF io_ticket IS INSTANCE OF lcl_business_ticket.
      lo_business ?= io_ticket.
      WRITE lo_business->get_lounge( ).
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  lcl_printer=>print_ticket( NEW lcl_ticket( ) ).
  lcl_printer=>print_ticket( NEW lcl_business_ticket( ) ).
```

Senza il controllo, la prima chiamata va in dump con `MOVE_CAST_ERROR` (eccezione `CX_SY_MOVE_CAST_ERROR`).

> [!NOTE]
>
> - Il tipo statico di un riferimento decide che cosa puoi chiamare; il tipo dinamico decide quale implementazione viene eseguita.
> - Un up cast (da specifico a generico) è implicito e sempre sicuro.
> - Un down cast (da generico a specifico) richiede `?=` o `CAST`, e fallisce a runtime con `CX_SY_MOVE_CAST_ERROR` se l'oggetto è della classe sbagliata.
> - `IS INSTANCE OF` e `CASE TYPE OF` controllano il tipo dinamico prima del down cast.
> - Molti down cast sono un campanello d'allarme: preferisci un metodo che ogni sottoclasse ridefinisce.
