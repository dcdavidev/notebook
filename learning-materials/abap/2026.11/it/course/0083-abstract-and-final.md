---
title: Classi astratte e final
description: Classi che non puoi istanziare e classi che non puoi estendere.
level: intermediate
---

Con l'[ereditarietà](./0082-inheritance.md) qualsiasi classe si può istanziare e qualsiasi classe si può estendere. Due parole chiave cambiano le cose. `ABSTRACT` indica una classe che esiste solo per essere ereditata: non puoi crearne oggetti. `FINAL` indica una classe da cui nessuno può ereditare, o un metodo che nessuno può ridefinire. Insieme ti permettono di dire con precisione come vanno usate le tue classi.

## Classi e metodi astratti

Una **classe astratta** è un progetto incompleto. Può avere attributi, un costruttore e metodi normali, ma può anche dichiarare **metodi astratti**: metodi con una firma e senza implementazione. Ogni sottoclasse concreta li deve implementare con `REDEFINITION`.

```abap
REPORT zabstract_final.

CLASS lcl_fare DEFINITION ABSTRACT.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING iv_base TYPE s_price.
    METHODS get_price FINAL
      RETURNING VALUE(rv_price) TYPE s_price.
  PROTECTED SECTION.
    DATA mv_base TYPE s_price.
    METHODS get_factor ABSTRACT
      RETURNING VALUE(rv_factor) TYPE f.
ENDCLASS.

CLASS lcl_fare IMPLEMENTATION.
  METHOD constructor.
    mv_base = iv_base.
  ENDMETHOD.

  METHOD get_price.                      " stessi passi per ogni tariffa
    rv_price = mv_base * get_factor( ).
  ENDMETHOD.
  " qui non c'è METHOD get_factor: è astratto
ENDCLASS.

CLASS lcl_economy_fare DEFINITION INHERITING FROM lcl_fare FINAL.
  PROTECTED SECTION.
    METHODS get_factor REDEFINITION.
ENDCLASS.

CLASS lcl_economy_fare IMPLEMENTATION.
  METHOD get_factor.
    rv_factor = 1.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_first_fare DEFINITION INHERITING FROM lcl_fare FINAL.
  PROTECTED SECTION.
    METHODS get_factor REDEFINITION.
ENDCLASS.

CLASS lcl_first_fare IMPLEMENTATION.
  METHOD get_factor.
    rv_factor = '3.5'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lo_fare TYPE REF TO lcl_fare.     " un riferimento a una classe astratta va bene

  lo_fare = NEW lcl_first_fare( 400 ).
  WRITE / lo_fare->get_price( ).          " 1400.00

* lo_fare = NEW lcl_fare( 400 ).         " errore di sintassi: lcl_fare è astratta
```

Le regole:

- Una classe con almeno un metodo astratto va dichiarata `ABSTRACT`.
- Una classe astratta non si può istanziare con `NEW` o `CREATE OBJECT`, ma puoi dichiarare riferimenti del suo tipo e farli puntare a oggetti delle sue sottoclassi.
- Una sottoclasse concreta deve ridefinire ogni metodo astratto che eredita. Se non lo fa, deve essere astratta anche lei.
- Un metodo astratto non può essere privato, perché una sottoclasse non lo vedrebbe e non potrebbe ridefinirlo.
- I metodi statici non possono essere astratti.

> [!TIP]
> Una classe astratta è un modulo con i campi vuoti. L'ufficio stampa una volta sola l'impaginazione, le intestazioni e le istruzioni, ma il modulo non vale finché qualcuno non riempie gli spazi. Ogni sottoclasse è una copia compilata.

## Il pattern template method

L'esempio qui sopra segue uno schema comune: la superclasse astratta ha un metodo pubblico che fissa la sequenza dei passi (`get_price`) e lascia astratti uno o più passi (`get_factor`). Le sottoclassi completano solo i passi che cambiano. Questo schema si chiama **template method**, ed è il motivo principale per scrivere classi astratte. La lezione sui [design pattern](./0088-design-patterns.md) ne mostra altri.

## Classi e metodi final

`FINAL` chiude una classe o un metodo alle modifiche:

| Dove                            | Effetto                                 |
| ------------------------------- | --------------------------------------- |
| `CLASS lcl_x DEFINITION FINAL.` | nessuna classe può ereditare da `lcl_x` |
| `METHODS m FINAL.`              | nessuna sottoclasse può ridefinire `m`  |
| `METHODS m FINAL REDEFINITION.` | questa ridefinizione è l'ultima         |

Nell'esempio `get_price` è final: le sottoclassi decidono il fattore, ma non possono cambiare il modo in cui si calcola il prezzo. Le due tariffe concrete sono classi final, così nessuno può crearne una sottoclasse e cambiarne il comportamento di nascosto.

In una classe final tutti i metodi sono implicitamente final, quindi non li devi marcare uno per uno. `ABSTRACT` e `FINAL` insieme sulla stessa classe sono ammessi ma inutili, perché la classe non si potrebbe mai usare: l'unica eccezione è una classe con soli componenti statici.

> [!WARNING]
> Rendere final una classe è una scelta di progetto, non una formalità. Le classi final sono più sicure da modificare, perché nessuna sottoclasse nascosta dipende dai loro dettagli interni. Ma una classe final non si può sostituire con una sottoclasse di test: per le classi che vorrai sostituire nei test [ABAP Unit](./0105-abap-unit-basics.md), prima dai loro un'[interfaccia](./0084-interfaces.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi all'esempio una sottoclasse final `lcl_business_fare`, con fattore `2`.
> 2. In `START-OF-SELECTION` metti un oggetto per ogni tariffa in una tabella interna di tipo `STANDARD TABLE OF REF TO lcl_fare WITH EMPTY KEY` e stampa il prezzo di ognuna con un `LOOP AT`.
> 3. Prova a ridefinire `get_price` in `lcl_business_fare`. Leggi l'errore di sintassi, poi togli la ridefinizione.

### Soluzione

```abap
CLASS lcl_business_fare DEFINITION INHERITING FROM lcl_fare FINAL.
  PROTECTED SECTION.
    METHODS get_factor REDEFINITION.
ENDCLASS.

CLASS lcl_business_fare IMPLEMENTATION.
  METHOD get_factor.
    rv_factor = 2.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_fares TYPE STANDARD TABLE OF REF TO lcl_fare WITH EMPTY KEY.

  lt_fares = VALUE #( ( NEW lcl_economy_fare( 400 ) )
                      ( NEW lcl_business_fare( 400 ) )
                      ( NEW lcl_first_fare( 400 ) ) ).

  LOOP AT lt_fares INTO DATA(lo_fare).
    WRITE / lo_fare->get_price( ).       " 400.00, 800.00, 1400.00
  ENDLOOP.
```

La ridefinizione di `get_price` fallisce perché il metodo è final in `lcl_fare`.

> [!NOTE]
>
> - `ABSTRACT` su una classe vieta le istanze; `ABSTRACT` su un metodo lo dichiara senza implementazione.
> - Una classe con un metodo astratto deve essere astratta, e le sottoclassi concrete devono ridefinire ogni metodo astratto.
> - Puoi comunque dichiarare riferimenti di un tipo astratto e farli puntare a oggetti delle sottoclassi.
> - `FINAL` su una classe vieta le sottoclassi; su un metodo ne vieta la ridefinizione.
> - Le classi astratte sono la base del pattern template method: passi fissi nella superclasse, passi variabili nelle sottoclassi.
