---
title: L'ereditarietà
description: Sottoclassi, REDEFINITION e super.
level: intermediate
---

L'**ereditarietà** ti permette di costruire una nuova classe sopra una classe esistente. La nuova classe, la **sottoclasse**, riceve tutti i componenti della **superclasse** e può aggiungerne di nuovi o cambiare il comportamento dei metodi ereditati. Scrivi una volta sola il codice comune e metti nella sottoclasse solo le differenze.

## INHERITING FROM

Dichiari la superclasse con `INHERITING FROM` nella definizione della sottoclasse:

```abap
REPORT zinheritance.

CLASS lcl_ticket DEFINITION.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_connid TYPE s_conn_id
                iv_price  TYPE s_price.
    METHODS get_price
      RETURNING VALUE(rv_price) TYPE s_price.
    METHODS describe.
  PROTECTED SECTION.
    DATA mv_connid TYPE s_conn_id.
    DATA mv_price  TYPE s_price.
ENDCLASS.

CLASS lcl_ticket IMPLEMENTATION.
  METHOD constructor.
    mv_connid = iv_connid.
    mv_price  = iv_price.
  ENDMETHOD.

  METHOD get_price.
    rv_price = mv_price.
  ENDMETHOD.

  METHOD describe.
    WRITE: / 'Volo', mv_connid, 'prezzo', get_price( ).
  ENDMETHOD.
ENDCLASS.

CLASS lcl_business_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS get_price REDEFINITION.
    METHODS has_lounge
      RETURNING VALUE(rv_lounge) TYPE abap_bool.
ENDCLASS.

CLASS lcl_business_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = super->get_price( ) * 2.   " riusa la logica della superclasse
  ENDMETHOD.

  METHOD has_lounge.
    rv_lounge = abap_true.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_economy)  = NEW lcl_ticket( iv_connid = '0400' iv_price = 500 ).
  DATA(lo_business) = NEW lcl_business_ticket( iv_connid = '0400' iv_price = 500 ).

  lo_economy->describe( ).     " prezzo 500.00
  lo_business->describe( ).    " prezzo 1000.00
```

`lcl_business_ticket` non ha né un costruttore né un `describe` suo: li eredita entrambi. Aggiunge `has_lounge` e cambia `get_price`. Nota che il `describe` ereditato chiama `get_price( )`, e in un biglietto business quella è la versione ridefinita. Il metodo che viene eseguito dipende sempre dall'oggetto, non dalla classe in cui è scritta la chiamata.

> [!TIP]
> Una sottoclasse è come un nuovo modello di auto costruito su una piattaforma esistente. Motore, telaio e impianto elettrico vengono dalla piattaforma; gli ingegneri cambiano solo i sedili e il cruscotto. Quando migliorano i freni della piattaforma, tutti i modelli costruiti su di essa hanno freni migliori.

## Che cosa eredita una sottoclasse

| Sezione della superclasse | Visibile nella sottoclasse | Visibile all'esterno |
| ------------------------- | -------------------------- | -------------------- |
| `PUBLIC SECTION`          | sì                         | sì                   |
| `PROTECTED SECTION`       | sì                         | no                   |
| `PRIVATE SECTION`         | no (ma esiste comunque)    | no                   |

Per questo `mv_price` sta nella sezione protetta: alla sottoclasse può servire, al mondo esterno no. Le tre sezioni le hai viste in [visibilità e incapsulamento](./0080-visibility-and-encapsulation.md).

Altre regole:

- ABAP ha l'**ereditarietà singola**: una classe ha al massimo una superclasse diretta. Una superclasse può avere quante sottoclassi vuoi, e una sottoclasse può avere a sua volta delle sottoclassi.
- Ogni classe eredita, direttamente o indirettamente, dalla classe radice predefinita `OBJECT`.
- Una sottoclasse può aggiungere componenti, ma non può togliere quelli ereditati né cambiarne la visibilità.
- I nomi dei componenti devono essere unici lungo tutto il percorso: una sottoclasse non può dichiarare un nuovo attributo con lo stesso nome di uno pubblico o protetto ereditato.

## Ridefinire i metodi

`METHODS nome REDEFINITION` nella sottoclasse sostituisce l'implementazione di un metodo di istanza ereditato. Le regole:

- La firma resta identica: stessi parametri, stessi tipi. Non la ripeti.
- Ridefinisci il metodo nella stessa sezione in cui l'ha dichiarato la superclasse.
- I metodi statici e i costruttori non si possono ridefinire. Ogni classe ha il suo costruttore (vedi sotto).
- Un metodo dichiarato `FINAL` non si può ridefinire; trovi i dettagli in [classi astratte e final](./0083-abstract-and-final.md).

Dentro la ridefinizione, `super->metodo( )` chiama l'implementazione della superclasse. Usalo quando vuoi estendere il comportamento ereditato, non sostituirlo del tutto. `super->` funziona solo nella ridefinizione di quello stesso metodo.

## I costruttori nelle sottoclassi

Se una sottoclasse non dichiara un costruttore, usa quello della superclasse, con i suoi parametri. Se invece lo dichiara, il costruttore della sottoclasse **deve chiamare** `super->constructor( )` prima di usare qualsiasi componente di istanza:

```abap
CLASS lcl_group_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_connid     TYPE s_conn_id
                iv_price      TYPE s_price
                iv_passengers TYPE i.
    METHODS get_price REDEFINITION.
  PRIVATE SECTION.
    DATA mv_passengers TYPE i.
ENDCLASS.

CLASS lcl_group_ticket IMPLEMENTATION.
  METHOD constructor.
    super->constructor( iv_connid = iv_connid iv_price = iv_price ).
    mv_passengers = iv_passengers.
  ENDMETHOD.

  METHOD get_price.
    rv_price = super->get_price( ) * mv_passengers * '0.9'.   " sconto gruppi del 10%
  ENDMETHOD.
ENDCLASS.
```

Il costruttore della sottoclasse può avere una firma diversa da quello della superclasse. Il suo compito è ricevere quello che serve alla sottoclasse e passare il resto verso l'alto.

> [!WARNING]
> L'ereditarietà lega strettamente la sottoclasse alla superclasse: una modifica nella superclasse può rompere tutte le sottoclassi. Usala quando la sottoclasse **è davvero un** tipo particolare della superclasse (un biglietto business è un biglietto). Quando una classe si limita a **usarne** un'altra, dalle piuttosto un attributo con un riferimento, oppure condividi un contratto con un'[interfaccia](./0084-interfaces.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Copia `lcl_ticket` e aggiungi una sottoclasse `lcl_child_ticket` che ridefinisce `get_price` per restituire metà del prezzo della superclasse.
> 2. Ridefinisci `describe` in `lcl_child_ticket` in modo che chiami `super->describe( )` e poi scriva `Tariffa bambino` sulla stessa riga.
> 3. Crea un biglietto per ciascuna classe e chiama `describe( )` su ognuno.

### Soluzione

```abap
CLASS lcl_child_ticket DEFINITION INHERITING FROM lcl_ticket.
  PUBLIC SECTION.
    METHODS get_price REDEFINITION.
    METHODS describe REDEFINITION.
ENDCLASS.

CLASS lcl_child_ticket IMPLEMENTATION.
  METHOD get_price.
    rv_price = super->get_price( ) / 2.
  ENDMETHOD.

  METHOD describe.
    super->describe( ).
    WRITE 'Tariffa bambino'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  NEW lcl_ticket( iv_connid = '0400' iv_price = 500 )->describe( ).
  NEW lcl_child_ticket( iv_connid = '0400' iv_price = 500 )->describe( ).   " 250.00 Tariffa bambino
```

> [!NOTE]
>
> - `INHERITING FROM` rende una classe sottoclasse: riceve tutti i componenti pubblici e protetti della superclasse.
> - ABAP ha l'ereditarietà singola, e ogni classe discende da `OBJECT`.
> - `METHODS nome REDEFINITION` sostituisce un metodo di istanza ereditato senza cambiarne la firma; `super->nome( )` chiama l'originale.
> - Il costruttore di una sottoclasse deve chiamare `super->constructor( )` prima di usare i componenti di istanza.
> - Usa l'ereditarietà solo per relazioni "è un" reali; negli altri casi preferisci la composizione o le interfacce.
