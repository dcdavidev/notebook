---
title: Attributi e metodi
description: Dati e comportamento di un oggetto, e l'autoriferimento me.
level: intermediate
---

Un oggetto ha due tipi di componenti: gli **attributi**, che contengono i suoi dati, e i **metodi**, che contengono il suo comportamento. I metodi lavorano sugli attributi dell'oggetto su cui vengono chiamati, quindi ogni oggetto si comporta in base ai propri dati.

Questa lezione mostra come dichiarare entrambi, come i metodi raggiungono gli attributi e a che cosa serve l'autoriferimento `me`.

## Gli attributi

Un **attributo di istanza** si dichiara con `DATA` nella definizione della classe. Ogni oggetto ne ha una copia propria. Puoi dargli un valore iniziale con `VALUE`, e dentro la classe puoi dichiarare anche tipi e costanti:

```abap
CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    TYPES ty_status TYPE c LENGTH 1.                  " un tipo che appartiene alla classe
    CONSTANTS gc_open   TYPE ty_status VALUE 'O'.
    CONSTANTS gc_closed TYPE ty_status VALUE 'C'.

    DATA mv_carrid   TYPE s_carr_id.
    DATA mv_connid   TYPE s_conn_id.
    DATA mv_seatsmax TYPE s_seatsmax VALUE 10.        " valore iniziale di ogni nuovo oggetto
    DATA mv_seatsocc TYPE s_seatsocc.
    DATA mv_status   TYPE ty_status VALUE gc_open.

    METHODS book_seat.
    METHODS display.
ENDCLASS.
```

- Le costanti esistono una sola volta per la classe, non per ogni oggetto. Fuori dalla classe le indichi con il nome della classe e `=>`: `lcl_flight=>gc_open`. I componenti statici in generale sono trattati in [i componenti statici](./0081-static-components.md).
- I tipi dichiarati nella classe si possono usare anche fuori, come `lcl_flight=>ty_status`, se stanno nella sezione pubblica.
- Il prefisso `mv_` (_member variable_) indica gli attributi di istanza, così li distingui dalle variabili locali (`lv_`).

## I metodi

Un metodo si dichiara con `METHODS` nella definizione e si implementa tra `METHOD` ed `ENDMETHOD`. Dentro un metodo puoi usare direttamente per nome gli attributi dell'oggetto, dichiarare variabili locali con `DATA` e chiamare gli altri metodi della stessa classe:

```abap
CLASS lcl_flight IMPLEMENTATION.
  METHOD book_seat.
    IF mv_status = gc_closed.
      RETURN.                                          " esce dal metodo
    ENDIF.
    mv_seatsocc = mv_seatsocc + 1.
    IF mv_seatsocc >= mv_seatsmax.
      mv_status = gc_closed.
    ENDIF.
    display( ).                                        " chiama un altro metodo di questo oggetto
  ENDMETHOD.

  METHOD display.
    DATA lv_free TYPE i.                               " locale: esiste solo durante la chiamata
    lv_free = mv_seatsmax - mv_seatsocc.
    WRITE: / mv_carrid, mv_connid, 'posti liberi:', lv_free, 'stato:', mv_status.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_flight) = NEW lcl_flight( ).
  lo_flight->mv_carrid = 'LH'.
  lo_flight->mv_connid = '0400'.
  DO 11 TIMES.
    lo_flight->book_seat( ).                           " l'undicesima chiamata non cambia nulla
  ENDDO.
```

- I dati locali di un metodo vengono creati a ogni chiamata e spariscono quando il metodo termina. Gli attributi mantengono il loro valore per tutta la vita dell'oggetto.
- `RETURN` esce subito dal metodo.
- Di quale oggetto modifica gli attributi `book_seat`? Di quello su cui è stato chiamato: `lo_flight->book_seat( )` lavora su `lo_flight`.

> [!TIP]
> Gli attributi sono ciò che una persona sa (nome, età, indirizzo); i metodi sono ciò che una persona sa fare (camminare, parlare, firmare un modulo). Quando chiedi ad Anna di firmare, firma con il suo nome, non con quello di un altro: un metodo lavora sempre sui dati del proprio oggetto.

## L'autoriferimento me

Dentro un metodo, `me` è un riferimento all'oggetto su cui il metodo sta girando. Di solito non ti serve, perché `mv_seatsocc` significa già "l'attributo di questo oggetto". Ti serve `me` in due casi:

1. **Un nome locale nasconde un attributo.** Se un parametro o una variabile locale ha lo stesso nome di un attributo, il nome semplice si riferisce a quello locale. `me->` raggiunge l'attributo.
2. **Passi l'oggetto stesso** a un altro metodo o lo salvi da qualche parte, per esempio `lo_list->add( me )`.

```abap
CLASS lcl_customer DEFINITION.
  PUBLIC SECTION.
    DATA name TYPE s_custname.
    METHODS set_name IMPORTING name TYPE s_custname.
ENDCLASS.

CLASS lcl_customer IMPLEMENTATION.
  METHOD set_name.
    me->name = name.     " attributo = parametro
  ENDMETHOD.
ENDCLASS.
```

`IMPORTING` dichiara un parametro di input: i parametri dei metodi sono l'argomento di [i parametri dei metodi](./0078-method-parameters.md).

> [!WARNING]
> Senza `me->`, la riga `name = name.` assegna il parametro a sé stesso e l'attributo resta vuoto. Non c'è nessun errore di sintassi, solo un bug silenzioso. Le convenzioni di nome (`mv_` per gli attributi, `iv_` per i parametri) evitano del tutto il conflitto.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi una classe `lcl_booking_counter` con attributi per una compagnia aerea, un contatore di prenotazioni e un massimo (valore iniziale 3).
> 2. Aggiungi un metodo `add_booking` che aumenta il contatore solo se il massimo non è raggiunto, e un metodo `display` che scrive la compagnia e il contatore. `add_booking` deve chiamare `display`.
> 3. Crea due oggetti per due compagnie, chiama `add_booking` un numero diverso di volte su ciascuno e controlla che ognuno mantenga il proprio contatore.

### Soluzione

```abap
REPORT zflight_counter.

CLASS lcl_booking_counter DEFINITION.
  PUBLIC SECTION.
    DATA mv_carrid TYPE s_carr_id.
    DATA mv_count  TYPE i.
    DATA mv_max    TYPE i VALUE 3.
    METHODS add_booking.
    METHODS display.
ENDCLASS.

CLASS lcl_booking_counter IMPLEMENTATION.
  METHOD add_booking.
    IF mv_count < mv_max.
      mv_count = mv_count + 1.
    ENDIF.
    display( ).
  ENDMETHOD.

  METHOD display.
    WRITE: / mv_carrid, mv_count, '/', mv_max.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_lh) = NEW lcl_booking_counter( ).
  lo_lh->mv_carrid = 'LH'.
  DATA(lo_az) = NEW lcl_booking_counter( ).
  lo_az->mv_carrid = 'AZ'.

  DO 4 TIMES.
    lo_lh->add_booking( ).          " si ferma a 3
  ENDDO.
  lo_az->add_booking( ).            " AZ ne ha 1
```

> [!NOTE]
>
> - Gli attributi (`DATA`) contengono i dati di ogni oggetto; `VALUE` ne imposta il valore iniziale. Le classi possono dichiarare anche `TYPES` e `CONSTANTS`.
> - I metodi si dichiarano con `METHODS` e si implementano in `METHOD ... ENDMETHOD`; possono avere dati locali.
> - Dentro un metodo, i nomi degli attributi si riferiscono agli attributi dell'oggetto su cui il metodo è stato chiamato.
> - `me` è il riferimento all'oggetto corrente: usalo quando un nome locale nasconde un attributo, o per passare l'oggetto ad altri.
> - Prefissi chiari (`mv_`, `lv_`, `iv_`) evitano i conflitti di nome tra attributi e dati locali.
