---
title: Test double e dependency injection
description: Isolare il codice sotto test dal database e dalle altre classi.
level: intermediate
---

Un [test unitario](./0105-abap-unit-basics.md) dovrebbe testare un solo pezzo di logica, velocemente, con lo stesso risultato ogni volta. Il codice reale però legge il database, chiama altre classi e dipende dalla data. Se il test usa tutto questo, diventa lento e si rompe ogni volta che cambiano i dati.

La soluzione è sostituire ogni **dipendenza** con un **test double**: un oggetto sostituto che restituisce esattamente i dati che servono al test. Per renderlo possibile, il codice deve ricevere le sue dipendenze dall'esterno invece di crearle da solo: è la **dependency injection**.

## Dependency injection tramite un'interfaccia

Metti l'accesso al database dietro un'interfaccia e fai ricevere alla classe un oggetto di quell'interfaccia nel costruttore.

```abap
INTERFACE zif_flight_dao PUBLIC.
  TYPES tt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
  METHODS get_flights
    IMPORTING iv_carrid         TYPE s_carr_id
    RETURNING VALUE(rt_flights) TYPE tt_flights.
ENDINTERFACE.
```

`ZCL_FLIGHT_DAO` implementa l'interfaccia con una `SELECT` su `SFLIGHT`. La classe di servizio la usa, ma solo attraverso l'interfaccia:

```abap
CLASS zcl_flight_service DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS constructor
      IMPORTING io_dao TYPE REF TO zif_flight_dao OPTIONAL.
    METHODS total_free_seats
      IMPORTING iv_carrid      TYPE s_carr_id
      RETURNING VALUE(rv_free) TYPE i.
  PRIVATE SECTION.
    DATA mo_dao TYPE REF TO zif_flight_dao.
ENDCLASS.

CLASS zcl_flight_service IMPLEMENTATION.
  METHOD constructor.
    IF io_dao IS BOUND.
      mo_dao = io_dao.                     " iniettato, per esempio da un test
    ELSE.
      mo_dao = NEW zcl_flight_dao( ).      " quello vero, in produzione
    ENDIF.
  ENDMETHOD.

  METHOD total_free_seats.
    rv_free = REDUCE i( INIT lv_sum = 0
                        FOR ls_flight IN mo_dao->get_flights( iv_carrid )
                        NEXT lv_sum = lv_sum + ls_flight-seatsmax - ls_flight-seatsocc ).
  ENDMETHOD.
ENDCLASS.
```

Il codice di produzione chiama `NEW zcl_flight_service( )` e ottiene il vero accesso al database. Un test passa un suo oggetto.

> [!TIP]
> Un test double è la controfigura di un film: stesso costume, stesso posto nella scena, ma fa solo quello che chiede il regista, e nessuno si fa male se la scena si gira cinquanta volte.

## Un test double scritto a mano

Il double più semplice è una classe locale nell'include di test che implementa l'interfaccia e restituisce dati preparati:

```abap
CLASS ltd_flight_dao DEFINITION FOR TESTING.
  PUBLIC SECTION.
    INTERFACES zif_flight_dao.
    DATA mt_flights TYPE zif_flight_dao=>tt_flights.
ENDCLASS.

CLASS ltd_flight_dao IMPLEMENTATION.
  METHOD zif_flight_dao~get_flights.
    rt_flights = mt_flights.
  ENDMETHOD.
ENDCLASS.

CLASS ltc_flight_service DEFINITION FINAL
  FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    METHODS total_free_seats FOR TESTING.
ENDCLASS.

CLASS ltc_flight_service IMPLEMENTATION.
  METHOD total_free_seats.
    DATA(lo_dao) = NEW ltd_flight_dao( ).
    lo_dao->mt_flights = VALUE #( ( carrid = 'LH' seatsmax = 100 seatsocc = 80 )
                                  ( carrid = 'LH' seatsmax = 200 seatsocc = 150 ) ).
    DATA(lo_cut) = NEW zcl_flight_service( lo_dao ).

    cl_abap_unit_assert=>assert_equals( act = lo_cut->total_free_seats( 'LH' )
                                        exp = 70 ).
  ENDMETHOD.
ENDCLASS.
```

## L'ABAP test double framework

Per interfacce con molti metodi, scrivere i double a mano diventa noioso. La classe `CL_ABAP_TESTDOUBLE` li crea a runtime:

```abap
DATA(lo_dao) = CAST zif_flight_dao( cl_abap_testdouble=>create( 'ZIF_FLIGHT_DAO' ) ).

" Configura: la prossima chiamata con questi parametri restituisce lt_flights
cl_abap_testdouble=>configure_call( lo_dao )->returning( lt_flights ).
lo_dao->get_flights( 'LH' ).

DATA(lo_cut) = NEW zcl_flight_service( lo_dao ).
```

`configure_call` prepara la risposta, e la chiamata subito dopo dice per quali parametri. Altre opzioni sono `ignore_all_parameters( )` (la stessa risposta per qualsiasi input), `raise_exception( )` e `and_expect( )->is_called_once( )`, che alla fine verifichi con `cl_abap_testdouble=>verify_expectations( lo_dao )`.

## Double per il database

A volte vuoi testare proprio la `SELECT`, per esempio in `ZCL_FLIGHT_DAO`. L'**ABAP SQL test double framework** devia le istruzioni del test verso copie temporanee delle tabelle, riempite con i tuoi dati di test:

```abap
CLASS ltc_flight_dao DEFINITION FINAL
  FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    CLASS-DATA go_env TYPE REF TO if_osql_test_environment.
    CLASS-METHODS class_setup.
    CLASS-METHODS class_teardown.
    METHODS setup.
    METHODS reads_only_one_airline FOR TESTING.
ENDCLASS.

CLASS ltc_flight_dao IMPLEMENTATION.
  METHOD class_setup.
    go_env = cl_osql_test_environment=>create(
      i_dependency_list = VALUE #( ( 'SFLIGHT' ) ) ).
  ENDMETHOD.

  METHOD class_teardown.
    go_env->destroy( ).
  ENDMETHOD.

  METHOD setup.
    go_env->clear_doubles( ).
  ENDMETHOD.

  METHOD reads_only_one_airline.
    DATA lt_data TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
    lt_data = VALUE #( ( carrid = 'LH' connid = '0400' fldate = '20260101' )
                       ( carrid = 'AZ' connid = '0555' fldate = '20260101' ) ).
    go_env->insert_test_data( lt_data ).

    DATA(lt_result) = NEW zcl_flight_dao( )->zif_flight_dao~get_flights( 'LH' ).

    cl_abap_unit_assert=>assert_equals( act = lines( lt_result ) exp = 1 ).
  ENDMETHOD.
ENDCLASS.
```

La vera `SFLIGHT` non viene mai letta né modificata. Le viste CDS hanno un framework simile, `CL_CDS_TEST_ENVIRONMENT`.

> [!WARNING]
> Nel codice vecchio senza interfacce troverai i **test seam**: blocchi segnati con `TEST-SEAM nome ... END-TEST-SEAM` nel codice di produzione, sostituiti nei test con `TEST-INJECTION nome ... END-TEST-INJECTION`. Aiutano a mettere sotto test il codice legacy, ma mescolano logica di test nel codice di produzione. Nel codice nuovo usa la dependency injection.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea l'interfaccia `ZIF_FLIGHT_DAO`, la classe `ZCL_FLIGHT_DAO` e il servizio `ZCL_FLIGHT_SERVICE` della lezione.
> 2. Testa `total_free_seats` con un double creato da `CL_ABAP_TESTDOUBLE`, con tre voli.
> 3. Aggiungi un test che verifica che il risultato è 0 quando il double non restituisce voli.

### Soluzione

```abap
METHOD no_flights_no_seats.
  DATA(lo_dao) = CAST zif_flight_dao( cl_abap_testdouble=>create( 'ZIF_FLIGHT_DAO' ) ).
  cl_abap_testdouble=>configure_call( lo_dao
    )->ignore_all_parameters( )->returning( VALUE zif_flight_dao=>tt_flights( ) ).
  lo_dao->get_flights( 'XX' ).

  cl_abap_unit_assert=>assert_equals(
    act = NEW zcl_flight_service( lo_dao )->total_free_seats( 'XX' )
    exp = 0 ).
ENDMETHOD.
```

> [!NOTE]
>
> - Dependency injection: la classe riceve le sue dipendenze (tramite un'interfaccia) invece di crearle.
> - Un test double sostituisce una dipendenza e restituisce i dati che servono al test.
> - Scrivi a mano i double semplici, oppure creali con `CL_ABAP_TESTDOUBLE`.
> - `CL_OSQL_TEST_ENVIRONMENT` devia ABAP SQL verso copie di test delle tabelle.
> - I test seam esistono per il codice legacy; nel codice nuovo preferisci interfacce e injection.
