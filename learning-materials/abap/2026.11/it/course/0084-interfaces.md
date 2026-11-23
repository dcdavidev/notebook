---
title: Le interfacce
description: Contratti che classi non correlate possono implementare.
level: intermediate
---

L'[ereditarietà](./0082-inheritance.md) funziona quando le classi sono imparentate: un biglietto business è un biglietto. Ma un volo e una camera d'albergo non hanno nulla in comune, a parte il fatto che entrambi hanno un prezzo. Un'**interfaccia** descrive che cosa sa fare una classe, senza dire come. Qualsiasi classe la può implementare, qualunque sia la sua superclasse, e una classe può implementare tutte le interfacce che le servono.

## Dichiarare un'interfaccia

Un'interfaccia contiene solo dichiarazioni: metodi, costanti, tipi, attributi ed eventi. Non ha implementazione né sezioni di visibilità, perché tutti i suoi componenti sono pubblici.

```abap
REPORT zinterfaces.

INTERFACE lif_priceable.
  CONSTANTS c_currency TYPE s_currcode VALUE 'EUR'.
  METHODS get_price
    RETURNING VALUE(rv_price) TYPE s_price.
  METHODS get_label
    RETURNING VALUE(rv_label) TYPE string.
ENDINTERFACE.
```

> [!TIP]
> Un'interfaccia è come lo standard di una presa elettrica. Alla presa non importa se ci colleghi una lampada, il caricatore del portatile o un bollitore: sono apparecchi completamente diversi, ma hanno tutti la stessa spina. L'interfaccia è la forma della spina; ogni classe è un apparecchio costruito per entrarci.

## Implementare un'interfaccia

Una classe elenca le interfacce che implementa con `INTERFACES` nella sezione pubblica. Poi deve implementare ogni metodo dell'interfaccia. Dentro la classe, un componente dell'interfaccia si chiama `interfaccia~componente`; `~` è il **selettore di componente di interfaccia**.

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_priceable.
    METHODS constructor
      IMPORTING is_flight TYPE sflight.
  PRIVATE SECTION.
    DATA ms_flight TYPE sflight.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    ms_flight = is_flight.
  ENDMETHOD.

  METHOD lif_priceable~get_price.
    rv_price = ms_flight-price.
  ENDMETHOD.

  METHOD lif_priceable~get_label.
    rv_label = |Volo { ms_flight-carrid } { ms_flight-connid }|.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_hotel_room DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_priceable.
ENDCLASS.

CLASS lcl_hotel_room IMPLEMENTATION.
  METHOD lif_priceable~get_price.
    rv_price = 120.
  ENDMETHOD.

  METHOD lif_priceable~get_label.
    rv_label = `Camera d'albergo`.
  ENDMETHOD.
ENDCLASS.
```

Le due classi non hanno una superclasse comune, ma rispettano entrambe lo stesso contratto.

## I riferimenti a interfaccia

La vera forza sta nei **riferimenti a interfaccia**: una variabile di tipo `REF TO lif_priceable` può puntare a un oggetto di qualsiasi classe che implementa l'interfaccia. Attraverso di essa raggiungi solo i componenti dell'interfaccia.

```abap
START-OF-SELECTION.
  DATA lt_items TYPE STANDARD TABLE OF REF TO lif_priceable WITH EMPTY KEY.
  DATA lv_total TYPE s_price.

  SELECT SINGLE * FROM sflight INTO @DATA(ls_flight).

  lt_items = VALUE #( ( NEW lcl_flight( ls_flight ) )
                      ( NEW lcl_hotel_room( ) ) ).

  LOOP AT lt_items INTO DATA(lo_item).
    WRITE: / lo_item->get_label( ), lo_item->get_price( ).
    lv_total = lv_total + lo_item->get_price( ).
  ENDLOOP.

  WRITE: / 'Totale:', lv_total, lif_priceable=>c_currency.
```

Dall'esterno della classe puoi chiamare un metodo dell'interfaccia anche attraverso un riferimento alla classe, con il nome completo: `lo_flight->lif_priceable~get_price( )`. Le costanti dell'interfaccia si leggono con `=>`, come qualsiasi componente statico.

Non puoi creare un oggetto di un'interfaccia: `NEW lif_priceable( )` è un errore di sintassi. Il codice che lavora con `REF TO lif_priceable` non ha bisogno di sapere quale classe c'è dietro, ed è proprio quello che userai nel [polimorfismo](./0085-polymorphism-and-casting.md) e nei [test double](./0106-test-doubles.md).

## Alias e interfacce composte

I nomi con `~` sono lunghi. `ALIASES` dà a un componente dell'interfaccia un nome breve nella classe:

```abap
CLASS lcl_seat DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_priceable.
    ALIASES get_price FOR lif_priceable~get_price.
ENDCLASS.
```

Ora chi chiama può scrivere `lo_seat->get_price( )`. L'implementazione resta `METHOD lif_priceable~get_price`.

Un'interfaccia può includere altre interfacce. Il risultato è un'**interfaccia composta**, e una classe che la implementa implementa anche tutte quelle incluse:

```abap
INTERFACE lif_bookable.
  INTERFACES lif_priceable.
  METHODS book
    IMPORTING iv_customer TYPE s_customer.
ENDINTERFACE.
```

Una classe con `INTERFACES lif_bookable` deve implementare `lif_bookable~book`, `lif_priceable~get_price` e `lif_priceable~get_label`.

> [!WARNING]
> Aggiungere un metodo a un'interfaccia rompe tutte le classi che la implementano: non compilano più finché non implementano il nuovo metodo. Tieni le interfacce piccole e mirate. Da ABAP 7.51 puoi dichiarare un metodo di interfaccia con `DEFAULT IGNORE` o `DEFAULT FAIL`: le classi possono allora non implementarlo, e una chiamata non fa nulla oppure solleva un'eccezione. Usalo per i metodi opzionali, non per abitudine.

## Interfacce o classi astratte

| Domanda                                      | Interfaccia | Classe astratta |
| -------------------------------------------- | ----------- | --------------- |
| La possono condividere classi non correlate? | sì          | no              |
| Quante ne può usare una classe?              | molte       | una             |
| Può contenere codice implementato?           | no          | sì              |
| Può avere componenti protetti o privati?     | no          | sì              |

Un progetto frequente le combina: un'interfaccia definisce il contratto, e una classe astratta facoltativa la implementa con codice comune che le sottoclassi possono riusare.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un'interfaccia `lif_printable` con un solo metodo `print`.
> 2. Implementala in due classi non correlate: `lcl_carrier`, che contiene una riga di `SCARR` e ne stampa il nome, e `lcl_connection`, che contiene una riga di `SPFLI` e stampa la tratta da `cityfrom` a `cityto`.
> 3. Leggi una riga da ciascuna tabella, metti i due oggetti in una tabella di `REF TO lif_printable` e chiama `print( )` in un ciclo.

### Soluzione

```abap
INTERFACE lif_printable.
  METHODS print.
ENDINTERFACE.

CLASS lcl_carrier DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_printable.
    DATA ms_carrier TYPE scarr.
ENDCLASS.

CLASS lcl_carrier IMPLEMENTATION.
  METHOD lif_printable~print.
    WRITE / ms_carrier-carrname.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_connection DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_printable.
    DATA ms_connection TYPE spfli.
ENDCLASS.

CLASS lcl_connection IMPLEMENTATION.
  METHOD lif_printable~print.
    WRITE: / ms_connection-cityfrom, '->', ms_connection-cityto.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_printables TYPE STANDARD TABLE OF REF TO lif_printable WITH EMPTY KEY.

  DATA(lo_carrier) = NEW lcl_carrier( ).
  SELECT SINGLE * FROM scarr INTO @lo_carrier->ms_carrier.
  DATA(lo_connection) = NEW lcl_connection( ).
  SELECT SINGLE * FROM spfli INTO @lo_connection->ms_connection.

  lt_printables = VALUE #( ( lo_carrier ) ( lo_connection ) ).
  LOOP AT lt_printables INTO DATA(lo_printable).
    lo_printable->print( ).
  ENDLOOP.
```

> [!NOTE]
>
> - Un'interfaccia dichiara metodi, costanti e altri componenti senza implementarli. Tutti i suoi componenti sono pubblici.
> - Una classe la implementa con `INTERFACES` nella sezione pubblica e `METHOD interfaccia~metodo` nell'implementazione.
> - Una variabile `REF TO interfaccia` può puntare a un oggetto di qualsiasi classe che implementa l'interfaccia.
> - `ALIASES` dà nomi brevi ai componenti dell'interfaccia; le interfacce possono includere altre interfacce.
> - Una classe può implementare molte interfacce ma ereditare da una sola superclasse.
