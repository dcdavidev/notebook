---
title: ABAP Unit
description: Scrivere ed eseguire test automatici per le tue classi.
---

_Livello intermedio_

**ABAP Unit** è il framework di test integrato nel linguaggio ABAP. Scrivi delle **classi di test** accanto al tuo codice; ogni metodo di test chiama il codice, controlla il risultato e segnala un errore se è sbagliato. Li esegui tutti con un tasto, quante volte vuoi, in pochi secondi.

I test automatici ti permettono di cambiare il codice senza paura: se una modifica rompe qualcosa, un test diventa rosso prima che se ne accorga l'utente. Sono anche la migliore documentazione di che cosa deve fare un metodo.

## Il codice sotto test

Gli esempi testano questa piccola classe globale. Le classi globali si creano come visto in [le classi globali](./0087-global-classes.it.md).

```abap
CLASS zcl_flight_calculator DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS free_seats
      IMPORTING is_flight      TYPE sflight
      RETURNING VALUE(rv_free) TYPE i.

    METHODS occupancy
      IMPORTING is_flight         TYPE sflight
      RETURNING VALUE(rv_percent) TYPE decfloat16
      RAISING   cx_parameter_invalid_range.
ENDCLASS.

CLASS zcl_flight_calculator IMPLEMENTATION.
  METHOD free_seats.
    rv_free = is_flight-seatsmax - is_flight-seatsocc.
  ENDMETHOD.

  METHOD occupancy.
    IF is_flight-seatsmax <= 0.
      RAISE EXCEPTION NEW cx_parameter_invalid_range( parameter = 'SEATSMAX' ).
    ENDIF.
    rv_percent = is_flight-seatsocc * 100 / is_flight-seatsmax.
  ENDMETHOD.
ENDCLASS.
```

## Una classe di test

In ADT, apri la classe e passa alla scheda **Test Classes** in fondo all'editor. Tutto quello che scrivi lì vive nell'include di test della classe: viene trasportato con la classe, ma non viene mai eseguito in produzione.

```abap
CLASS ltc_flight_calculator DEFINITION FINAL
  FOR TESTING
  RISK LEVEL HARMLESS
  DURATION SHORT.

  PRIVATE SECTION.
    DATA mo_cut TYPE REF TO zcl_flight_calculator.   " classe sotto test

    METHODS setup.
    METHODS free_seats_half_full   FOR TESTING.
    METHODS occupancy_75_percent   FOR TESTING.
    METHODS occupancy_no_seats     FOR TESTING.
ENDCLASS.

CLASS ltc_flight_calculator IMPLEMENTATION.
  METHOD setup.
    mo_cut = NEW #( ).                   " un oggetto nuovo prima di ogni test
  ENDMETHOD.

  METHOD free_seats_half_full.
    " Dato
    DATA(ls_flight) = VALUE sflight( seatsmax = 200 seatsocc = 100 ).
    " Quando
    DATA(lv_free) = mo_cut->free_seats( ls_flight ).
    " Allora
    cl_abap_unit_assert=>assert_equals( act = lv_free
                                        exp = 100
                                        msg = 'Posti liberi sbagliati' ).
  ENDMETHOD.

  METHOD occupancy_75_percent.
    DATA(lv_percent) = mo_cut->occupancy( VALUE #( seatsmax = 200 seatsocc = 150 ) ).
    cl_abap_unit_assert=>assert_equals( act = lv_percent
                                        exp = CONV decfloat16( 75 ) ).
  ENDMETHOD.

  METHOD occupancy_no_seats.
    TRY.
        mo_cut->occupancy( VALUE #( seatsmax = 0 ) ).
        cl_abap_unit_assert=>fail( 'Eccezione attesa per SEATSMAX = 0' ).
      CATCH cx_parameter_invalid_range.
        " atteso: il test è superato
    ENDTRY.
  ENDMETHOD.
ENDCLASS.
```

- `FOR TESTING` contrassegna la classe e i suoi metodi di test. I metodi di test non hanno parametri.
- `RISK LEVEL` dice che cosa possono cambiare i test: `HARMLESS` (niente), `DANGEROUS` (dati), `CRITICAL` (impostazioni). I sistemi possono essere configurati per rifiutare i test pericolosi.
- `DURATION` è il tempo di esecuzione previsto: `SHORT`, `MEDIUM` o `LONG`.
- I commenti **dato, quando, allora** (_given, when, then_) dividono ogni test in preparazione, chiamata e controllo.

> [!TIP]
> Un test è come la checklist che il pilota legge prima del decollo: le stesse brevi domande, ogni volta, nello stesso ordine. È noioso, ed è proprio per questo che trova gli errori che le persone saltano.

## Fixture e asserzioni

I **metodi di fixture** preparano e ripuliscono attorno ai test. I loro nomi sono fissi:

| Metodo           | Tipo    | Quando viene eseguito           |
| ---------------- | ------- | ------------------------------- |
| `class_setup`    | statico | una volta, prima del primo test |
| `setup`          | istanza | prima di ogni metodo di test    |
| `teardown`       | istanza | dopo ogni metodo di test        |
| `class_teardown` | statico | una volta, dopo l'ultimo test   |

La classe `CL_ABAP_UNIT_ASSERT` ha un metodo statico per ogni tipo di controllo. Quando un controllo fallisce, il test è segnato come fallito e il metodo si ferma.

| Metodo                                       | Controlla che                                            |
| -------------------------------------------- | -------------------------------------------------------- |
| `assert_equals( act exp )`                   | i due valori sono uguali                                 |
| `assert_differs( act exp )`                  | i due valori sono diversi                                |
| `assert_true( )`, `assert_false( )`          | un valore booleano è vero o falso                        |
| `assert_initial( )`, `assert_not_initial( )` | un valore è (o non è) iniziale                           |
| `assert_bound( )`, `assert_not_bound( )`     | un riferimento è (o non è) valorizzato                   |
| `assert_subrc( exp )`                        | `sy-subrc` ha il valore atteso                           |
| `assert_table_contains( line table )`        | una riga è in una tabella interna                        |
| `fail( )`                                    | fallisce sempre, per codice che non deve essere eseguito |

Per testare i metodi privati, la classe sotto test deve concedere l'amicizia alla classe di test: metti `CLASS zcl_flight_calculator DEFINITION LOCAL FRIENDS ltc_flight_calculator.` all'inizio dell'include di test. Preferisci però i test attraverso l'interfaccia pubblica: sopravvivono al refactoring.

## Eseguire i test

| Strumento        | Come                                                               |
| ---------------- | ------------------------------------------------------------------ |
| ADT              | `Ctrl+Shift+F10`, oppure clic destro > **Run As > ABAP Unit Test** |
| Copertura in ADT | `Ctrl+Shift+F11`: mostra quali righe hanno eseguito i test         |
| SE24 / SE80      | **Classe > Esegui > Unit test** (`Ctrl+Shift+F10`)                 |
| Un package       | clic destro sul package in ADT > **Run As > ABAP Unit Test**       |

La vista ABAP Unit elenca ogni metodo di test in verde o in rosso, con il messaggio e la riga dell'asserzione fallita. I test girano in una sessione separata e ABAP Unit annulla alla fine le modifiche al database, ma non contarci: i test non dovrebbero scrivere su tabelle reali. I [test double](./0106-test-doubles.it.md) mostrano come evitarlo.

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi a `ZCL_FLIGHT_CALCULATOR` un metodo `is_full` che restituisce `abap_true` quando `seatsocc >= seatsmax`.
> 2. Scrivi due test: uno per un volo pieno, uno per un volo con posti liberi.
> 3. Esegui i test e controlla la copertura del nuovo metodo.

### Soluzione

```abap
METHOD is_full.                     " RETURNING VALUE(rv_full) TYPE abap_bool
  rv_full = xsdbool( is_flight-seatsocc >= is_flight-seatsmax ).
ENDMETHOD.
```

```abap
METHOD is_full_when_no_seats_left.  " FOR TESTING
  cl_abap_unit_assert=>assert_true(
    mo_cut->is_full( VALUE #( seatsmax = 100 seatsocc = 100 ) ) ).
ENDMETHOD.

METHOD not_full_with_free_seats.    " FOR TESTING
  cl_abap_unit_assert=>assert_false(
    mo_cut->is_full( VALUE #( seatsmax = 100 seatsocc = 99 ) ) ).
ENDMETHOD.
```

> [!NOTE]
>
> - Le classi di test sono classi locali con `FOR TESTING`, `RISK LEVEL` e `DURATION`, nell'include di test della classe.
> - I metodi di test hanno `FOR TESTING` e nessun parametro; strutturali come dato, quando, allora.
> - `setup`, `teardown`, `class_setup` e `class_teardown` preparano e ripuliscono la fixture.
> - `CL_ABAP_UNIT_ASSERT` controlla i risultati; `fail( )` segnala codice che non deve essere raggiunto.
> - In ADT esegui i test con `Ctrl+Shift+F10` e la copertura con `Ctrl+Shift+F11`.
