---
title: ABAP Unit
description: Write and run automated tests for your classes.
level: intermediate
---

**ABAP Unit** is the test framework built into the ABAP language. You write **test classes** next to your code; each test method calls the code, checks the result, and reports a failure if it's wrong. You run all of them with one key, as often as you like, in seconds.

Automated tests let you change code without fear: if a change breaks something, a test turns red before the user notices. They are also the best documentation of what a method is supposed to do.

## The code under test

The examples test this small global class. You create global classes as shown in [global classes](./0087-global-classes.md).

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

## A test class

In ADT, open the class and switch to the **Test Classes** tab at the bottom of the editor. Everything you write there lives in the test include of the class: it's transported with the class but never runs in production.

```abap
CLASS ltc_flight_calculator DEFINITION FINAL
  FOR TESTING
  RISK LEVEL HARMLESS
  DURATION SHORT.

  PRIVATE SECTION.
    DATA mo_cut TYPE REF TO zcl_flight_calculator.   " class under test

    METHODS setup.
    METHODS free_seats_half_full   FOR TESTING.
    METHODS occupancy_75_percent   FOR TESTING.
    METHODS occupancy_no_seats     FOR TESTING.
ENDCLASS.

CLASS ltc_flight_calculator IMPLEMENTATION.
  METHOD setup.
    mo_cut = NEW #( ).                   " a fresh object before every test
  ENDMETHOD.

  METHOD free_seats_half_full.
    " Given
    DATA(ls_flight) = VALUE sflight( seatsmax = 200 seatsocc = 100 ).
    " When
    DATA(lv_free) = mo_cut->free_seats( ls_flight ).
    " Then
    cl_abap_unit_assert=>assert_equals( act = lv_free
                                        exp = 100
                                        msg = 'Free seats are wrong' ).
  ENDMETHOD.

  METHOD occupancy_75_percent.
    DATA(lv_percent) = mo_cut->occupancy( VALUE #( seatsmax = 200 seatsocc = 150 ) ).
    cl_abap_unit_assert=>assert_equals( act = lv_percent
                                        exp = CONV decfloat16( 75 ) ).
  ENDMETHOD.

  METHOD occupancy_no_seats.
    TRY.
        mo_cut->occupancy( VALUE #( seatsmax = 0 ) ).
        cl_abap_unit_assert=>fail( 'Exception expected for SEATSMAX = 0' ).
      CATCH cx_parameter_invalid_range.
        " expected: the test passes
    ENDTRY.
  ENDMETHOD.
ENDCLASS.
```

- `FOR TESTING` marks the class and its test methods. Test methods have no parameters.
- `RISK LEVEL` says what the tests can change: `HARMLESS` (nothing), `DANGEROUS` (data), `CRITICAL` (settings). Systems can be configured to refuse dangerous tests.
- `DURATION` is the expected run time: `SHORT`, `MEDIUM`, or `LONG`.
- The **given, when, then** comments split each test into preparation, call, and check.

> [!TIP]
> A test is like the checklist a pilot reads before take-off: the same short questions, every time, in the same order. It's boring, and that's why it catches the mistakes that people skip.

## Fixtures and assertions

The **fixture methods** prepare and clean up around the tests. Their names are fixed:

| Method           | Kind     | Runs                        |
| ---------------- | -------- | --------------------------- |
| `class_setup`    | static   | once, before the first test |
| `setup`          | instance | before every test method    |
| `teardown`       | instance | after every test method     |
| `class_teardown` | static   | once, after the last test   |

The class `CL_ABAP_UNIT_ASSERT` has a static method for every kind of check. When a check fails, the test is marked as failed and the method stops.

| Method                                       | Checks that                             |
| -------------------------------------------- | --------------------------------------- |
| `assert_equals( act exp )`                   | the two values are equal                |
| `assert_differs( act exp )`                  | the two values differ                   |
| `assert_true( )`, `assert_false( )`          | a Boolean value is true or false        |
| `assert_initial( )`, `assert_not_initial( )` | a value is (not) initial                |
| `assert_bound( )`, `assert_not_bound( )`     | a reference is (not) bound              |
| `assert_subrc( exp )`                        | `sy-subrc` has the expected value       |
| `assert_table_contains( line table )`        | a row is in an internal table           |
| `fail( )`                                    | always fails, for code that mustn't run |

To test private methods, the class under test must grant friendship to the test class: put `CLASS zcl_flight_calculator DEFINITION LOCAL FRIENDS ltc_flight_calculator.` at the top of the test include. Prefer tests through the public interface, though: they survive refactoring.

## Running the tests

| Tool         | How                                                             |
| ------------ | --------------------------------------------------------------- |
| ADT          | `Ctrl+Shift+F10`, or right click > **Run As > ABAP Unit Test**  |
| ADT coverage | `Ctrl+Shift+F11`: shows which lines the tests executed          |
| SE24 / SE80  | **Class > Execute > Unit Tests** (`Ctrl+Shift+F10`)             |
| A package    | right click on the package in ADT > **Run As > ABAP Unit Test** |

The ABAP Unit view lists every test method in green or red, with the message and the line of the failed assertion. Tests run in a separate session, and ABAP Unit rolls back database changes at the end, but don't rely on that: tests shouldn't write to real tables. [Test doubles](./0106-test-doubles.md) show how to avoid it.

## Exercise

> [!IMPORTANT]
>
> 1. Add to `ZCL_FLIGHT_CALCULATOR` a method `is_full` that returns `abap_true` when `seatsocc >= seatsmax`.
> 2. Write two tests for it: one for a full flight, one for a flight with free seats.
> 3. Run the tests and check the coverage of the new method.

### Solution

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
> - Test classes are local classes with `FOR TESTING`, `RISK LEVEL`, and `DURATION`, in the test include of the class.
> - Test methods have `FOR TESTING` and no parameters; structure them as given, when, then.
> - `setup`, `teardown`, `class_setup`, and `class_teardown` prepare and clean up the fixture.
> - `CL_ABAP_UNIT_ASSERT` checks the results; `fail( )` marks code that mustn't be reached.
> - Run the tests with `Ctrl+Shift+F10` and the coverage with `Ctrl+Shift+F11` in ADT.
