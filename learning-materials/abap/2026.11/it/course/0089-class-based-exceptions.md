---
title: Le eccezioni basate su classi
description: TRY, CATCH, CLEANUP, RAISE EXCEPTION e la gerarchia delle eccezioni.
---

_Livello intermedio_

Quando qualcosa va storto a runtime, come una divisione per zero, una riga di tabella che non c'è o un testo che non è un numero, ABAP solleva un'**eccezione**. Se nessuno la gestisce, il programma si ferma con un dump, come hai visto negli [errori di runtime](./0030-runtime-errors.md). Un'**eccezione basata su classi** è un oggetto di una classe di eccezione: porta con sé le informazioni sull'errore, risale lo stack delle chiamate finché qualcuno non la cattura, e permette al tuo codice di reagire invece di bloccarsi.

## TRY e CATCH

Metti il codice che può fallire in un blocco `TRY` e gestisci ogni eccezione in un blocco `CATCH`:

```abap
REPORT zexceptions.

DATA lv_seatsmax TYPE i VALUE 0.
DATA lv_seatsocc TYPE i VALUE 150.

TRY.
    DATA(lv_load) = lv_seatsocc * 100 / lv_seatsmax.
    WRITE: / 'Riempimento:', lv_load.
  CATCH cx_sy_zerodivide INTO DATA(lx_zero).
    WRITE: / 'Errore:', lx_zero->get_text( ).
ENDTRY.
WRITE / 'Il programma prosegue'.
```

Quando la divisione fallisce, il resto del blocco `TRY` viene saltato, gira il `CATCH` corrispondente e il programma prosegue dopo `ENDTRY`. Se non si verifica nessuna eccezione, i blocchi `CATCH` vengono saltati.

`INTO` salva un riferimento all'oggetto eccezione. I suoi metodi più utili:

| Metodo                   | Restituisce                                                |
| ------------------------ | ---------------------------------------------------------- |
| `get_text( )`            | il testo breve dell'errore                                 |
| `get_longtext( )`        | il testo lungo, se la classe ne ha uno                     |
| `get_source_position( )` | il programma, l'include e la riga in cui è stata sollevata |

L'attributo `previous` contiene l'eccezione che ha causato questa, se c'è.

> [!TIP]
> Le eccezioni sono come la rete di sicurezza sotto il trapezio. L'acrobata (il tuo codice) tenta un salto. Se sbaglia, non si schianta a terra (il dump): cade nella rete, scende e lo spettacolo continua. Ogni rete è montata sotto salti precisi, e la caduta la ferma la rete più vicina.

## Più blocchi CATCH

Un `TRY` può avere più blocchi `CATCH`, e un solo `CATCH` può elencare più classi. Il runtime sceglie il **primo** blocco che corrisponde alla classe dell'eccezione o a una sua superclasse, quindi metti per prime le classi specifiche:

```abap
DATA lt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
DATA lx_error   TYPE REF TO cx_root.

TRY.
    DATA(ls_flight) = lt_flights[ carrid = 'LH' ].        " tabella vuota: nessuna riga
    DATA(lv_ratio) = ls_flight-seatsocc / ls_flight-seatsmax.
  CATCH cx_sy_itab_line_not_found INTO lx_error.
    WRITE: / 'Riga non trovata'.
  CATCH cx_sy_zerodivide cx_sy_arithmetic_overflow INTO lx_error.
    WRITE: / 'Errore di calcolo:', lx_error->get_text( ).
  CATCH cx_root INTO lx_error.                             " qualsiasi altra cosa
    WRITE: / 'Imprevisto:', lx_error->get_text( ).
ENDTRY.
```

Le classi di eccezione formano un albero di ereditarietà. `cx_sy_zerodivide` è una sottoclasse di `cx_sy_arithmetic_error`, quindi `CATCH cx_sy_arithmetic_error` cattura anche una divisione per zero.

> [!WARNING]
> In ABAP zero diviso zero dà `0` e non solleva nulla. Solo un numero diverso da zero diviso per zero solleva `cx_sy_zerodivide`. Non affidarti all'eccezione per scoprire i dati vuoti: quando zero è un valore normale, controlla prima il divisore.

## La gerarchia delle eccezioni

Tutte le classi di eccezione ereditano da `CX_ROOT`, attraverso una di tre classi astratte. Si distinguono per quanto il controllo di sintassi ti obbliga a dichiararle:

| Superclasse        | Va dichiarata in `RAISING`?                    | Uso tipico                                                                    |
| ------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `CX_STATIC_CHECK`  | sì, altrimenti il controllo di sintassi avvisa | errori che il chiamante deve aspettarsi e gestire                             |
| `CX_DYNAMIC_CHECK` | no; si controlla solo a runtime                | errori che il chiamante può evitare con un controllo, come `cx_sy_zerodivide` |
| `CX_NO_CHECK`      | no, mai                                        | errori che nessuno può ragionevolmente gestire, come la mancanza di risorse   |

Le eccezioni di runtime predefinite iniziano con `CX_SY_`. Per i tuoi errori scriverai le tue classi, di solito ereditando da `CX_STATIC_CHECK`, nella lezione sulle [classi di eccezione personalizzate](./0090-custom-exception-classes.md).

## RAISING e RAISE EXCEPTION

Un metodo che lascia uscire un'eccezione la dichiara con `RAISING`. L'eccezione si **propaga** allora al chiamante, e su per lo stack delle chiamate, finché un `CATCH` non la gestisce:

```abap
CLASS lcl_flight_reader DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS get_load
      IMPORTING is_flight      TYPE sflight
      RETURNING VALUE(rv_load) TYPE i
      RAISING   cx_sy_zerodivide.
ENDCLASS.

CLASS lcl_flight_reader IMPLEMENTATION.
  METHOD get_load.
    IF is_flight-seatsmax = 0.
      RAISE EXCEPTION TYPE cx_sy_zerodivide.      " la sollevi tu
    ENDIF.
    rv_load = is_flight-seatsocc * 100 / is_flight-seatsmax.
  ENDMETHOD.
ENDCLASS.
```

`RAISE EXCEPTION` ha tre forme:

```abap
RAISE EXCEPTION TYPE cx_sy_zerodivide.            " crea e solleva un oggetto della classe
RAISE EXCEPTION NEW cx_sy_zerodivide( ).          " lo stesso, con NEW (da ABAP 7.52)
RAISE EXCEPTION lx_error.                         " solleva un oggetto che hai già
```

La terza forma serve dopo un `CATCH` per passare oltre l'eccezione. Se invece la vuoi avvolgere in un'altra eccezione, passala come `previous`, così la causa originale non va persa.

## CLEANUP

Un blocco `CLEANUP` gira quando un'eccezione esce dal blocco `TRY` **senza** esservi catturata, subito prima che l'eccezione prosegua verso l'alto. Usalo per ripristinare uno stato coerente:

```abap
METHOD process_bookings.
  TRY.
      mv_in_progress = abap_true.
      update_seats( ).                            " può sollevare un'eccezione
      mv_in_progress = abap_false.
    CLEANUP.
      mv_in_progress = abap_false.                " azzera il flag, poi la lascia propagare
  ENDTRY.
ENDMETHOD.
```

`CLEANUP` non gestisce l'eccezione: qualcuno più in alto la deve comunque catturare. Non gira se un `CATCH` locale gestisce l'eccezione.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi fino a 20 righe da `SFLIGHT` in una tabella interna e aggiungi una riga con `seatsmax = 0`.
> 2. Cicla sulla tabella e chiama `lcl_flight_reader=>get_load( )` per ogni riga dentro un `TRY`. Stampa il riempimento, oppure `Nessun posto` quando viene sollevata `cx_sy_zerodivide`.
> 3. Dopo il ciclo, leggi la riga della compagnia `XX` con un'espressione tabella e cattura `cx_sy_itab_line_not_found`.

### Soluzione

```abap
START-OF-SELECTION.
  SELECT * FROM sflight INTO TABLE @DATA(lt_flights) UP TO 20 ROWS.
  APPEND VALUE #( carrid = 'ZZ' connid = '0001' seatsmax = 0 ) TO lt_flights.

  LOOP AT lt_flights INTO DATA(ls_flight).
    TRY.
        WRITE: / ls_flight-carrid, ls_flight-connid,
                 lcl_flight_reader=>get_load( ls_flight ).
      CATCH cx_sy_zerodivide.
        WRITE: / ls_flight-carrid, ls_flight-connid, 'Nessun posto'.
    ENDTRY.
  ENDLOOP.

  TRY.
      DATA(ls_missing) = lt_flights[ carrid = 'XX' ].
    CATCH cx_sy_itab_line_not_found.
      WRITE / 'Nessun volo per XX'.
  ENDTRY.
```

> [!NOTE]
>
> - `TRY ... CATCH ... ENDTRY` gestisce le eccezioni; gira il primo `CATCH` che corrisponde alla classe o a una superclasse.
> - `CATCH ... INTO` ti dà l'oggetto eccezione, con `get_text( )` e `previous`.
> - Tutte le eccezioni ereditano da `CX_ROOT` attraverso `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK` o `CX_NO_CHECK`.
> - `RAISING` dichiara le eccezioni che un metodo lascia propagare; `RAISE EXCEPTION` ne solleva una.
> - `CLEANUP` gira quando un'eccezione non catturata esce dal blocco `TRY`, per ripristinare uno stato coerente.
