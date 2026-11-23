---
title: Test doubles and dependency injection
description: Isolate the code under test from the database and other classes.
level: intermediate
---

A [unit test](./0105-abap-unit-basics.md) should test one piece of logic, quickly, with the same result every time. Real code, however, reads the database, calls other classes, and depends on the date. If the test uses all of that, it gets slow and breaks whenever the data changes.

The solution is to replace each **dependency** with a **test double**: a stand-in object that returns exactly the data the test needs. To make this possible, the code must receive its dependencies from outside instead of creating them itself: that's **dependency injection**.

## Dependency injection through an interface

Put the database access behind an interface, and let the class receive an object of that interface in its constructor.

```abap
INTERFACE zif_flight_dao PUBLIC.
  TYPES tt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
  METHODS get_flights
    IMPORTING iv_carrid         TYPE s_carr_id
    RETURNING VALUE(rt_flights) TYPE tt_flights.
ENDINTERFACE.
```

`ZCL_FLIGHT_DAO` implements the interface with a `SELECT` on `SFLIGHT`. The service class uses it, but only through the interface:

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
      mo_dao = io_dao.                     " injected, for example by a test
    ELSE.
      mo_dao = NEW zcl_flight_dao( ).      " the real one, in production
    ENDIF.
  ENDMETHOD.

  METHOD total_free_seats.
    rv_free = REDUCE i( INIT lv_sum = 0
                        FOR ls_flight IN mo_dao->get_flights( iv_carrid )
                        NEXT lv_sum = lv_sum + ls_flight-seatsmax - ls_flight-seatsocc ).
  ENDMETHOD.
ENDCLASS.
```

Production code calls `NEW zcl_flight_service( )` and gets the real database access. A test passes its own object.

> [!TIP]
> A test double is the stunt double of a film: same costume, same place in the scene, but it does only what the director asks, and nobody gets hurt if the scene is shot fifty times.

## A hand-written test double

The simplest double is a local class in the test include that implements the interface and returns prepared data:

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

## The ABAP test double framework

For interfaces with many methods, writing doubles by hand gets tedious. The class `CL_ABAP_TESTDOUBLE` creates them at runtime:

```abap
DATA(lo_dao) = CAST zif_flight_dao( cl_abap_testdouble=>create( 'ZIF_FLIGHT_DAO' ) ).

" Configure: the next call with these parameters returns lt_flights
cl_abap_testdouble=>configure_call( lo_dao )->returning( lt_flights ).
lo_dao->get_flights( 'LH' ).

DATA(lo_cut) = NEW zcl_flight_service( lo_dao ).
```

`configure_call` prepares the answer, and the call right after it says for which parameters. Other options are `ignore_all_parameters( )` (the same answer for any input), `raise_exception( )`, and `and_expect( )->is_called_once( )`, which you verify at the end with `cl_abap_testdouble=>verify_expectations( lo_dao )`.

## Doubles for the database

Sometimes you want to test the `SELECT` itself, for example in `ZCL_FLIGHT_DAO`. The **ABAP SQL test double framework** redirects the statements of the test to temporary copies of the tables, filled with your test data:

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

The real `SFLIGHT` is never read or changed. CDS views have a similar framework, `CL_CDS_TEST_ENVIRONMENT`.

> [!WARNING]
> In old code without interfaces you'll find **test seams**: blocks marked with `TEST-SEAM name ... END-TEST-SEAM` in the production code, replaced in tests with `TEST-INJECTION name ... END-TEST-INJECTION`. They help to put legacy code under test, but they mix test logic into production code. In new code, use dependency injection.

## Exercise

> [!IMPORTANT]
>
> 1. Create the interface `ZIF_FLIGHT_DAO`, the class `ZCL_FLIGHT_DAO`, and the service `ZCL_FLIGHT_SERVICE` from the lesson.
> 2. Test `total_free_seats` with a double created by `CL_ABAP_TESTDOUBLE`, with three flights.
> 3. Add a test that checks the result is 0 when the double returns no flights.

### Solution

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
> - Dependency injection: the class receives its dependencies (through an interface) instead of creating them.
> - A test double replaces a dependency and returns the data the test needs.
> - Write simple doubles by hand, or create them with `CL_ABAP_TESTDOUBLE`.
> - `CL_OSQL_TEST_ENVIRONMENT` redirects ABAP SQL to test copies of the tables.
> - Test seams exist for legacy code; prefer interfaces and injection in new code.
