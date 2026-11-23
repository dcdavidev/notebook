---
title: I parametri dei metodi
description: IMPORTING, EXPORTING, CHANGING, RETURNING e chiamate funzionali.
level: intermediate
---

I metodi scambiano dati con chi li chiama tramite i **parametri**. Il tipo di parametro dice in quale direzione scorrono i dati, e il modo in cui viene passato decide se il metodo lavora sull'originale o su una copia.

Questa lezione tratta i quattro tipi di parametri, i parametri opzionali e i diversi modi di chiamare un metodo, comprese le **chiamate funzionali** dentro le espressioni.

## I quattro tipi di parametri

| Tipo        | Direzione                | Dentro il metodo                                             | Quanti         |
| ----------- | ------------------------ | ------------------------------------------------------------ | -------------- |
| `IMPORTING` | chiamante → metodo       | solo lettura (quando passato per riferimento)                | quanti vuoi    |
| `EXPORTING` | metodo → chiamante       | scrivi il risultato                                          | quanti vuoi    |
| `CHANGING`  | in entrambe le direzioni | leggi e modifichi il valore del chiamante                    | quanti vuoi    |
| `RETURNING` | metodo → chiamante       | l'unico risultato di un metodo funzionale; sempre per valore | al massimo uno |

```abap
CLASS lcl_flight_calc DEFINITION.
  PUBLIC SECTION.
    METHODS get_free_seats
      IMPORTING iv_seatsmax    TYPE s_seatsmax
                iv_seatsocc    TYPE s_seatsocc
      RETURNING VALUE(rv_free) TYPE i.

    METHODS split_name
      IMPORTING iv_fullname TYPE string
      EXPORTING ev_first    TYPE string
                ev_last     TYPE string.

    METHODS add_tax
      IMPORTING iv_rate  TYPE i
      CHANGING  cv_price TYPE s_price.
ENDCLASS.

CLASS lcl_flight_calc IMPLEMENTATION.
  METHOD get_free_seats.
    rv_free = iv_seatsmax - iv_seatsocc.
  ENDMETHOD.

  METHOD split_name.
    SPLIT iv_fullname AT space INTO ev_first ev_last.
  ENDMETHOD.

  METHOD add_tax.
    cv_price = cv_price * ( 1 + iv_rate / 100 ).
  ENDMETHOD.
ENDCLASS.
```

- I parametri possono avere anche un **tipo generico**, come `any`, `data`, `clike`, `csequence`, `numeric` o `any table`: allora accettano qualsiasi parametro attuale di quella famiglia. Usali solo quando un metodo deve davvero accettare più tipi.
- Scrivere in un parametro `IMPORTING` passato per riferimento è un errore di sintassi. È proprio questo lo scopo: il valore del chiamante è al sicuro.

## Per riferimento o per valore

Per default, i parametri `IMPORTING`, `EXPORTING` e `CHANGING` passano **per riferimento**: il metodo lavora direttamente sulla variabile del chiamante. Con `VALUE( )` il metodo riceve una **copia**.

| Dichiarazione                  | Comportamento                                                                |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `IMPORTING iv_x TYPE i`        | riferimento; solo lettura                                                    |
| `IMPORTING VALUE(iv_x) TYPE i` | copia; il metodo può modificarla senza toccare il chiamante                  |
| `EXPORTING ev_x TYPE i`        | riferimento; parte con il valore attuale del chiamante                       |
| `EXPORTING VALUE(ev_x) TYPE i` | copia; parte iniziale e viene ricopiata quando il metodo termina normalmente |
| `CHANGING VALUE(cv_x) TYPE i`  | copia; ricopiata quando il metodo termina normalmente                        |
| `RETURNING VALUE(rv_x) TYPE i` | sempre una copia; parte iniziale                                             |

> [!WARNING]
> Un parametro `EXPORTING` passato per riferimento non viene svuotato all'inizio del metodo: contiene ancora quello che il chiamante aveva nella variabile. Se il metodo lo valorizza solo in alcuni casi, il chiamante può ricevere un valore vecchio. Fai `CLEAR` dei parametri exporting all'inizio del metodo, oppure usa `RETURNING`.

## Parametri opzionali e default

I parametri `IMPORTING` e `CHANGING` sono obbligatori, a meno che non li segni `OPTIONAL` o non dia loro un `DEFAULT`. I parametri `EXPORTING` sono sempre opzionali per il chiamante. Dentro il metodo, `IS SUPPLIED` ti dice se il chiamante ha passato un parametro:

```abap
METHODS get_flights
  IMPORTING iv_carrid    TYPE s_carr_id
            iv_max_rows  TYPE i DEFAULT 100
            iv_from_date TYPE s_date OPTIONAL
  EXPORTING et_flights   TYPE ty_flights      " un tipo tabella dichiarato nella classe
            ev_count     TYPE i.

" nell'implementazione
IF ev_count IS SUPPLIED.
  ev_count = lines( et_flights ).
ENDIF.
```

## Chiamare i metodi

```abap
DATA(lo_calc) = NEW lcl_flight_calc( ).
DATA lv_price TYPE s_price VALUE '100.00'.

" Più parametri IMPORTING: nome = valore
DATA(lv_free) = lo_calc->get_free_seats( iv_seatsmax = 200 iv_seatsocc = 150 ).

" EXPORTING e CHANGING: indica i tipi di parametro, visti dal chiamante
lo_calc->split_name(
  EXPORTING iv_fullname = `Mario Rossi`
  IMPORTING ev_first    = DATA(lv_first)       " dichiarazione inline nella chiamata
            ev_last     = DATA(lv_last) ).

lo_calc->add_tax( EXPORTING iv_rate = 22 CHANGING cv_price = lv_price ).
```

- Con un solo parametro `IMPORTING` (o un solo parametro obbligatorio, o uno segnato `PREFERRED PARAMETER`) puoi omettere il nome: `lo->method( valore )`.
- Quando un metodo ha solo parametri importing, puoi omettere `EXPORTING`. Appena ci sono altri tipi, scrivi esplicitamente `EXPORTING`, `IMPORTING` e `CHANGING`. Come per i moduli funzione, le direzioni sono viste dal lato del chiamante.
- La forma obsoleta `CALL METHOD lo_calc->split_name EXPORTING ...` funziona ancora; non usarla nel codice nuovo.

## Le chiamate funzionali

Un metodo con un parametro `RETURNING` è un **metodo funzionale**: puoi chiamarlo ovunque serva un valore, in assegnazioni, condizioni e altre espressioni.

```abap
IF lo_calc->get_free_seats( iv_seatsmax = 200 iv_seatsocc = 200 ) = 0.
  WRITE / 'Volo pieno'.
ENDIF.

WRITE / |Posti liberi: { lo_calc->get_free_seats( iv_seatsmax = 200 iv_seatsocc = 120 ) }|.
```

Un metodo funzionale che restituisce `abap_bool` si può usare anche come **chiamata predicativa**, senza confronto: `IF lo_flight->is_full( ).` è vero quando il risultato non è iniziale.

> [!TIP]
> `RETURNING` è una domanda con una sola risposta: "quanti posti sono liberi?". `EXPORTING` è un modulo che il metodo compila in più caselle. `CHANGING` è un documento che consegni per le correzioni e che ti torna indietro modificato.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi una classe con un metodo funzionale `get_occupancy` che riceve i posti massimi e quelli occupati e restituisce l'occupazione in percentuale (tipo `p LENGTH 5 DECIMALS 2`). Restituisci `0` se il massimo è `0`.
> 2. Aggiungi un metodo `is_full` che restituisce `abap_bool`.
> 3. Leggi da `SFLIGHT` i voli di `LH` e, in un loop, scrivi l'occupazione di ogni volo e "PIENO" per quelli pieni, usando entrambi i metodi dentro le espressioni.

### Soluzione

```abap
REPORT zflight_occupancy.

CLASS lcl_occupancy DEFINITION.
  PUBLIC SECTION.
    TYPES ty_percent TYPE p LENGTH 5 DECIMALS 2.
    METHODS get_occupancy
      IMPORTING iv_seatsmax       TYPE s_seatsmax
                iv_seatsocc       TYPE s_seatsocc
      RETURNING VALUE(rv_percent) TYPE ty_percent.
    METHODS is_full
      IMPORTING iv_seatsmax    TYPE s_seatsmax
                iv_seatsocc    TYPE s_seatsocc
      RETURNING VALUE(rv_full) TYPE abap_bool.
ENDCLASS.

CLASS lcl_occupancy IMPLEMENTATION.
  METHOD get_occupancy.
    IF iv_seatsmax = 0.
      RETURN.                                   " rv_percent resta 0
    ENDIF.
    rv_percent = iv_seatsocc * 100 / iv_seatsmax.
  ENDMETHOD.

  METHOD is_full.
    rv_full = xsdbool( iv_seatsocc >= iv_seatsmax ).
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_occupancy) = NEW lcl_occupancy( ).

  SELECT connid, fldate, seatsmax, seatsocc FROM sflight
    WHERE carrid = 'LH'
    INTO TABLE @DATA(lt_flights).

  LOOP AT lt_flights INTO DATA(ls_flight).
    DATA(lv_percent) = lo_occupancy->get_occupancy( iv_seatsmax = ls_flight-seatsmax
                                                    iv_seatsocc = ls_flight-seatsocc ).
    WRITE: / ls_flight-connid, ls_flight-fldate, lv_percent.
    IF lo_occupancy->is_full( iv_seatsmax = ls_flight-seatsmax
                              iv_seatsocc = ls_flight-seatsocc ).
      WRITE 'PIENO'.
    ENDIF.
  ENDLOOP.
```

> [!NOTE]
>
> - `IMPORTING` porta i dati dentro, `EXPORTING` manda fuori i risultati, `CHANGING` fa entrambe le cose e `RETURNING` restituisce un valore per valore.
> - I parametri passano per riferimento se non scrivi `VALUE( )`; i riferimenti importing sono di sola lettura, e i riferimenti exporting non vengono svuotati all'ingresso.
> - `OPTIONAL` e `DEFAULT` rendono opzionali i parametri; `IS SUPPLIED` controlla se ne è stato passato uno.
> - Nella chiamata indica i tipi dal lato del chiamante: `EXPORTING`, `IMPORTING`, `CHANGING`; le dichiarazioni inline funzionano per i parametri di output.
> - I metodi funzionali si usano in qualsiasi espressione; i metodi che restituiscono `abap_bool` funzionano come predicati negli `IF`.
