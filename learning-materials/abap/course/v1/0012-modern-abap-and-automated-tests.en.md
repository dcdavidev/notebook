---
title: Modern ABAP and automated tests
description: 7.4/7.5x expressions, grouping, ABAP Unit, test doubles, and code quality.
---

_Week 3 · Advanced level · 4 hours_

### Today's schedule

| Block  | Content                                                                                       |
| ------ | --------------------------------------------------------------------------------------------- |
| Hour 1 | Constructor operators: `VALUE`, `NEW`, `CONV`, `CAST`, `REF`, `EXACT`, `CORRESPONDING`, `LET` |
| Hour 2 | Iterations in expressions: `FOR`, `REDUCE`, `FILTER`; `LOOP AT GROUP BY`; meshes (overview)   |
| Hour 3 | ABAP Unit: test classes, assertions, fixtures, coverage                                       |
| Hour 4 | Test doubles (dependency injection, test seams, OSQL/CDS frameworks), ATC, and Code Inspector |

## Hour 1 – Constructor operators

Since release 7.40, ABAP has become far more expressive: many operations that used to take 5–10 lines now fit in a single expression. You've already seen some of them; here we line them all up.

> [!TIP]
> Old ABAP was like assembling furniture screw by screw following the manual. Constructor operators are like receiving the furniture already assembled: you say what you want and you get it ready.

| Operator          | What it builds                                        |
| ----------------- | ----------------------------------------------------- |
| `VALUE`           | structures and tables with values                     |
| `NEW`             | objects and anonymous data (with a reference)         |
| `REF`             | a reference to existing data                          |
| `CONV`            | a value converted to another type                     |
| `EXACT`           | like `CONV`, but with an error if information is lost |
| `CAST`            | a converted reference (down-cast)                     |
| `CORRESPONDING`   | a structure/table copied by field name                |
| `COND` / `SWITCH` | a value chosen according to conditions                |
| `FILTER`          | a filtered table                                      |
| `REDUCE`          | a single value calculated by iterating                |

The `#` symbol means "infer the type from the context" (from the target variable or the parameter).

### VALUE in all its forms

```abap
TYPES: BEGIN OF ty_pers, name TYPE string, age TYPE i, city TYPE string, END OF ty_pers.
TYPES tt_pers TYPE STANDARD TABLE OF ty_pers WITH EMPTY KEY.

DATA(ls_p) = VALUE ty_pers( name = `Anna` age = 30 city = `Rome` ).

* Shared values "factored out"
DATA(lt_p) = VALUE tt_pers( city = `Milan`
                            ( name = `Luca`  age = 25 )
                            ( name = `Marta` age = 41 )
                            city = `Turin`
                            ( name = `Gino`  age = 33 ) ).

* Copy a structure, changing only some fields
DATA(ls_p2) = VALUE #( BASE ls_p age = 31 ).

* Range table
DATA(lr_age) = VALUE range_of_i( ( sign = 'I' option = 'BT' low = 18 high = 65 ) ).
```

(`range_of_i` is an example: define your own type with `TYPES ty_r TYPE RANGE OF i.`)

### CORRESPONDING

Copies the fields **with the same name** from one structure/table to another of a different type.

```abap
TYPES: BEGIN OF ty_short, name TYPE string, city TYPE string, END OF ty_short.
DATA lt_short TYPE STANDARD TABLE OF ty_short WITH EMPTY KEY.

lt_short = CORRESPONDING #( lt_p ).                       " copies name and city
lt_short = CORRESPONDING #( lt_p MAPPING city = name ).   " maps fields with different names
lt_short = CORRESPONDING #( lt_p EXCEPT city ).           " excludes fields
ls_p     = CORRESPONDING #( BASE ( ls_p ) ls_other ).     " keeps the values not overwritten

* With a lookup table (7.51+): fills fields by looking them up in another table
lt_orders = CORRESPONDING #( lt_orders FROM lt_customers USING kunnr = kunnr
                             MAPPING customer_name = name1 ).
```

The equivalent classic statement is `MOVE-CORRESPONDING a TO b.` (with `EXPANDING NESTED TABLES` and `KEEPING TARGET LINES` for tables).

### LET: local variables in an expression

```abap
DATA(lv_txt) = COND string(
  LET total = ls_ord-qty * ls_ord-price
      vat   = total * '0.22' IN
  WHEN total > 1000 THEN |Large: { total + vat }|
  ELSE |Small: { total + vat }| ).
```

### EXACT, CONV, CAST, REF, NEW

```abap
DATA lv_p TYPE p LENGTH 5 DECIMALS 2.
TRY.
    lv_p = EXACT #( '1.234' ).   " CX_SY_CONVERSION_ROUNDING exception: a decimal would be lost
  CATCH cx_sy_conversion_error.
ENDTRY.

DATA(lo_col) = CAST cl_salv_column_table( lo_cols->get_column( 'X' ) ).
DATA(lr_row) = REF #( lt_p[ 1 ] ).
DATA(lo_obj) = NEW zcl_account( `Mario` ).
DATA(lr_int) = NEW i( 5 ).
```

## Hour 2 – FOR, REDUCE, FILTER, and GROUP BY

### FOR: build a table from another

```abap
* Transform every row
DATA(lt_names) = VALUE string_table( FOR ls IN lt_p ( ls-name ) ).

* With a condition
DATA(lt_adults) = VALUE tt_pers( FOR ls IN lt_p WHERE ( age >= 18 ) ( ls ) ).

* With calculations and an index
DATA(lt_desc) = VALUE string_table( FOR ls IN lt_p INDEX INTO i
                                    ( |{ i }. { ls-name } ({ ls-age })| ) ).

* Like a counter loop
DATA(lt_squares) = VALUE int4_table( FOR n = 1 UNTIL n > 10 ( n * n ) ).

* Nested FORs (product of two tables)
DATA(lt_comb) = VALUE string_table( FOR a IN lt_colors FOR b IN lt_sizes ( |{ a }-{ b }| ) ).
```

> [!TIP]
> `FOR` is like an assembly line: rows come in on one side, each is processed the same way, and a new table comes out on the other side.

### REDUCE: reduce a table to a value

```abap
* Sum of ages
DATA(lv_sum) = REDUCE i( INIT s = 0 FOR ls IN lt_p NEXT s = s + ls-age ).

* Several values accumulated together
DATA(lv_info) = REDUCE string(
  INIT txt = `` sep = ``
  FOR ls IN lt_p
  NEXT txt = txt && sep && ls-name
       sep = `, ` ).                 " "Luca, Marta, Gino"

* Maximum
DATA(lv_max) = REDUCE i( INIT m = 0 FOR ls IN lt_p NEXT m = nmax( val1 = m val2 = ls-age ) ).
```

### FILTER

Returns the rows that meet a condition on the key (you need a `SORTED`/`HASHED` table or a secondary key):

```abap
DATA lt_s TYPE SORTED TABLE OF ty_pers WITH NON-UNIQUE KEY city.
lt_s = lt_p.
DATA(lt_milan)  = FILTER #( lt_s WHERE city = `Milan` ).
DATA(lt_others) = FILTER #( lt_s EXCEPT WHERE city = `Milan` ).

* With a filter table
DATA lt_cities_ok TYPE SORTED TABLE OF string WITH UNIQUE KEY table_line.
lt_cities_ok = VALUE #( ( `Rome` ) ( `Turin` ) ).
DATA(lt_sel) = FILTER #( lt_s IN lt_cities_ok WHERE city = table_line ).
```

### LOOP AT ... GROUP BY

The modern way to group, instead of `AT NEW`/`COLLECT` (the table doesn't need to be sorted):

```abap
LOOP AT lt_p INTO DATA(ls_pers)
     GROUP BY ( city  = ls_pers-city
                count = GROUP SIZE )
     ASCENDING
     INTO DATA(ls_group).

  WRITE / |{ ls_group-city }: { ls_group-count } people|.

  LOOP AT GROUP ls_group INTO DATA(ls_member).   " the members of the group
    WRITE /5 ls_member-name.
  ENDLOOP.
ENDLOOP.

* Group and sum in a single expression
TYPES: BEGIN OF ty_tot, city TYPE string, age_tot TYPE i, END OF ty_tot.
TYPES tt_tot TYPE STANDARD TABLE OF ty_tot WITH EMPTY KEY.
DATA(lt_tot) = VALUE tt_tot(
  FOR GROUPS g OF ls IN lt_p GROUP BY ls-city
  ( city    = g
    age_tot = REDUCE i( INIT s = 0 FOR m IN GROUP g NEXT s = s + m-age ) ) ).
```

### Other useful additions

| Feature                          | Example                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| Table expressions with a default | `VALUE #( itab[ 1 ] OPTIONAL )`                                                        |
| `line_exists` predicate          | `IF line_exists( itab[ name = 'X' ] ).`                                                |
| Assignment operators             | `x += 1. x *= 2. s &&= 'x'.`                                                           |
| `FINAL` declarations             | `FINAL(lv) = 5.` (can't be changed)                                                    |
| Boolean operator                 | `xsdbool( cond )`                                                                      |
| Enumerations                     | `TYPES: BEGIN OF ENUM ty_status, new, open, closed, END OF ENUM ty_status.`            |
| String functions                 | `to_mixed`, `from_mixed`, `escape`, `condense`, `matches`                              |
| Modern SQL                       | expressions, CTEs, `@DATA`, CDS (day 14)                                               |
| Mesh tables                      | structures of tables linked by associations, navigable with `\_assoc[ ]` (rarely used) |

> [!WARNING]
> **Readability first.** Expressions are powerful, but a `REDUCE` with three `LET`s and two nested `FOR`s can become unreadable. Clean ABAP rule: use the expression when it makes the code clearer; if you need a comment to understand it, a normal `LOOP` may be better.

## Hour 3 – ABAP Unit: automated tests

A **unit test** is a piece of code that automatically checks that another piece of code (a method) does the right thing. ABAP has a built-in framework: **ABAP Unit**.

> [!TIP]
> Automated tests are like the warning lights on a car's dashboard: they constantly check that everything works. When you change the code (work on the engine), one click tells you whether you broke something, instead of finding out when the car stops on the highway (in production).

Why write them:

- you find errors right away, not in acceptance testing or in production;
- you can change the code (refactor) with confidence;
- they document the expected behavior;
- many projects require them, and so does ABAP Cloud.

### The test class

Tests are special local classes, in the **Test Classes** tab of a global class (in ADT) or at the bottom of the report.

```abap
" Code under test (global class ZCL_VAT_CALCULATOR)
CLASS zcl_vat_calculator DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS gross IMPORTING iv_net  TYPE decfloat34
                            iv_rate TYPE decfloat34 DEFAULT 22
                  RETURNING VALUE(rv) TYPE decfloat34
                  RAISING   cx_parameter_invalid_range.
ENDCLASS.

CLASS zcl_vat_calculator IMPLEMENTATION.
  METHOD gross.
    IF iv_net < 0.
      RAISE EXCEPTION NEW cx_parameter_invalid_range( parameter = 'IV_NET' ).
    ENDIF.
    rv = round( val = iv_net * ( 1 + iv_rate / 100 ) dec = 2 ).
  ENDMETHOD.
ENDCLASS.
```

```abap
" Test Classes tab
CLASS ltc_calculator DEFINITION FINAL
  FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    DATA mo_cut TYPE REF TO zcl_vat_calculator.   " cut = class under test
    METHODS setup.
    METHODS gross_with_vat_22      FOR TESTING RAISING cx_static_check.
    METHODS gross_zero_rate        FOR TESTING RAISING cx_static_check.
    METHODS negative_net_is_error  FOR TESTING.
ENDCLASS.

CLASS ltc_calculator IMPLEMENTATION.
  METHOD setup.                 " runs before EVERY test
    mo_cut = NEW #( ).
  ENDMETHOD.

  METHOD gross_with_vat_22.
    " Given / When / Then
    DATA(lv_result) = mo_cut->gross( 100 ).
    cl_abap_unit_assert=>assert_equals( exp = 122 act = lv_result
                                        msg = '22% VAT on 100 must give 122' ).
  ENDMETHOD.

  METHOD gross_zero_rate.
    cl_abap_unit_assert=>assert_equals( exp = 50 act = mo_cut->gross( iv_net = 50 iv_rate = 0 ) ).
  ENDMETHOD.

  METHOD negative_net_is_error.
    TRY.
        mo_cut->gross( -1 ).
        cl_abap_unit_assert=>fail( 'It should have raised an exception' ).
      CATCH cx_parameter_invalid_range.
        " ok: expected behavior
    ENDTRY.
  ENDMETHOD.
ENDCLASS.
```

How to run them: in ADT **Ctrl+Shift+F10** (Run As → ABAP Unit Test); in SE80/SE24, menu Class → Unit Test (Ctrl+Shift+F10). The results show which tests passed (green) and which failed (red), with the message.

### The parts of a test class

| Element                          | Meaning                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `FOR TESTING`                    | it's a test class/method                                                                                                              |
| `RISK LEVEL`                     | `HARMLESS` (changes nothing), `DANGEROUS` (can change data), `CRITICAL` (changes configuration). Systems can forbid the higher levels |
| `DURATION`                       | `SHORT`, `MEDIUM`, `LONG`: the test fails if it takes longer than expected                                                            |
| `class_setup` / `class_teardown` | once per class, before/after all the tests (static)                                                                                   |
| `setup` / `teardown`             | before/after every single test                                                                                                        |

### The main assertions (CL_ABAP_UNIT_ASSERT)

| Method                                         | Checks that                                                  |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `assert_equals( exp act )`                     | the two values are equal (tables and structures too)         |
| `assert_differs( exp act )`                    | they are different                                           |
| `assert_true` / `assert_false( act )`          | the value is `abap_true` / `abap_false`                      |
| `assert_initial` / `assert_not_initial( act )` | the value is (or isn't) initial                              |
| `assert_bound` / `assert_not_bound( act )`     | the reference is (or isn't) bound                            |
| `assert_subrc( exp act )`                      | `sy-subrc` has the expected value                            |
| `assert_char_cp( exp act )`                    | the text matches the pattern                                 |
| `assert_table_contains( line table )`          | the table contains the row                                   |
| `assert_number_between( lower upper number )`  | the number is within the range                               |
| `fail( msg )`                                  | always fail (used for branches that should never be reached) |

### Test-Driven Development (TDD)

A widespread technique: first you write the test (which fails, red), then the minimum code to make it pass (green), then you improve the code (refactoring) while keeping the tests green. "**Red – Green – Refactor**".

### Code coverage

In ADT: Run As → ABAP Unit Test With → Coverage. It shows which lines the tests ran (green) and which they didn't (red). A realistic goal: cover all the important business logic.

## Hour 4 – Test doubles and code quality

### The problem: dependencies

A method that reads from the database, calls a BAPI, or uses the system date is hard to test: the data changes, and the BAPI really writes. The solution is to replace the dependencies with **stand-ins** (_test doubles_) during the test.

> [!TIP]
> In a film, the stunt double shoots the dangerous scenes, not the actor. In tests, instead of the real database or the real BAPI, you use a "stunt double" that behaves predictably and does no damage.

### Dependency injection

The code doesn't create its dependencies itself: it **receives** them (through the constructor). That way, in the test, you can pass a fake one.

```abap
INTERFACE zif_flights_dao.
  METHODS get_flights IMPORTING iv_carrid TYPE s_carr_id
                      RETURNING VALUE(rt) TYPE ztt_sflight.
ENDINTERFACE.

CLASS zcl_flight_analysis DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS constructor IMPORTING io_dao TYPE REF TO zif_flights_dao OPTIONAL.
    METHODS free_seats IMPORTING iv_carrid TYPE s_carr_id RETURNING VALUE(rv) TYPE i.
  PRIVATE SECTION.
    DATA mo_dao TYPE REF TO zif_flights_dao.
ENDCLASS.

CLASS zcl_flight_analysis IMPLEMENTATION.
  METHOD constructor.
    mo_dao = COND #( WHEN io_dao IS BOUND THEN io_dao ELSE NEW zcl_flights_dao_db( ) ).
  ENDMETHOD.

  METHOD free_seats.
    rv = REDUCE i( INIT s = 0 FOR f IN mo_dao->get_flights( iv_carrid )
                   NEXT s = s + f-seatsmax - f-seatsocc ).
  ENDMETHOD.
ENDCLASS.

" In the test: a fake class that implements the same interface
CLASS ltd_fake_dao DEFINITION FOR TESTING.
  PUBLIC SECTION.
    INTERFACES zif_flights_dao.
ENDCLASS.

CLASS ltd_fake_dao IMPLEMENTATION.
  METHOD zif_flights_dao~get_flights.
    rt = VALUE #( ( carrid = 'LH' seatsmax = 100 seatsocc = 90 )
                  ( carrid = 'LH' seatsmax = 200 seatsocc = 150 ) ).
  ENDMETHOD.
ENDCLASS.

CLASS ltc_analysis DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    METHODS count_seats FOR TESTING.
ENDCLASS.

CLASS ltc_analysis IMPLEMENTATION.
  METHOD count_seats.
    DATA(lo_cut) = NEW zcl_flight_analysis( io_dao = NEW ltd_fake_dao( ) ).
    cl_abap_unit_assert=>assert_equals( exp = 60 act = lo_cut->free_seats( 'LH' ) ).
  ENDMETHOD.
ENDCLASS.
```

### SAP's test double frameworks

| Framework                                                    | What it replaces                                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| ABAP OO Test Double Framework (`cl_abap_testdouble`)         | automatically creates stand-ins for interfaces, with configurable return values and call verification |
| ABAP SQL Test Double Framework (`cl_osql_test_environment`)  | the database tables the code reads: the `SELECT`s read test data                                      |
| CDS Test Double Framework (`cl_cds_test_environment`)        | CDS views and their sources (day 14)                                                                  |
| Function module test double (`cl_function_test_environment`) | function modules                                                                                      |
| Test seams (`TEST-SEAM` / `TEST-INJECTION`)                  | pieces of legacy code that can be replaced in tests without refactoring                               |

```abap
" Example: replace table SFLIGHT
CLASS ltc_sql DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    CLASS-DATA go_env TYPE REF TO if_osql_test_environment.
    CLASS-METHODS class_setup.
    CLASS-METHODS class_teardown.
    METHODS test_read FOR TESTING.
ENDCLASS.

CLASS ltc_sql IMPLEMENTATION.
  METHOD class_setup.
    go_env = cl_osql_test_environment=>create( i_dependency_list = VALUE #( ( 'SFLIGHT' ) ) ).
  ENDMETHOD.

  METHOD class_teardown.
    go_env->destroy( ).
  ENDMETHOD.

  METHOD test_read.
    DATA lt_data TYPE STANDARD TABLE OF sflight.
    lt_data = VALUE #( ( carrid = 'LH' connid = '0400' seatsmax = 10 seatsocc = 5 ) ).
    go_env->insert_test_data( lt_data ).
    DATA(lo_cut) = NEW zcl_flights_dao_db( ).
    cl_abap_unit_assert=>assert_equals( exp = 1 act = lines( lo_cut->zif_flights_dao~get_flights( 'LH' ) ) ).
  ENDMETHOD.
ENDCLASS.
```

### Static checks: Code Inspector and ATC

- **Extended program check** (SLIN): warnings about suspicious code.
- **Code Inspector** (SCI): configurable checks (performance, security, naming conventions, robustness).
- **ABAP Test Cockpit** (ATC): the platform that runs Code Inspector, ABAP Unit, and security checks centrally; often mandatory before releasing a transport. In ADT: right-click → Run As → ABAP Test Cockpit (Ctrl+Shift+F2).
- **Pragmas and pseudo-comments**: `##NEEDED`, `##NO_TEXT`, `"#EC CI_NOWHERE` suppress specific warnings when they're justified. Use them sparingly and only with a reason.

Typical checks: `SELECT`s in loops, `SELECT` without `WHERE`, missing `AUTHORITY-CHECK`, texts that can't be translated, unused variables, unhandled exceptions, SQL injection, use of unreleased APIs (in ABAP Cloud).

## Exercises

> [!IMPORTANT]
>
> 1. Rewrite with modern expressions: a table of the numbers from 1 to 20, the table of the even ones only, their sum (`REDUCE`), and a string with all the numbers separated by commas.
> 2. Given a sales table (region, product, amount), use `LOOP AT GROUP BY` to print the total and the list of products for every region.
> 3. With `CORRESPONDING`, copy an `SFLIGHT` table into a table with only `carrid`, `connid`, `fldate`, and a `ticket_price` field mapped from `price`.
> 4. Write the class `ZCL_VAT_CALCULATOR` with unit tests: 4 normal cases + 1 error case. Use TDD: write the tests first.
> 5. Apply dependency injection to the flight analysis class and write one test with a fake class and one with `cl_abap_testdouble`.
> 6. Run the ATC on one of your programs from the previous days and fix at least 3 findings.

## Quiz

1. What does the `#` symbol mean in `VALUE #( )`?
2. What is the difference between `CONV` and `EXACT`?
3. What does `REDUCE` do?
4. What does `FILTER` require of the source table?
5. What advantage does `LOOP AT GROUP BY` have over `AT NEW`?
6. What are `setup` and `teardown`?
7. What are test doubles for?
8. What is the ATC?

## Solutions

```abap
REPORT zes12_modern.

TYPES: BEGIN OF ty_sale, region TYPE string, product TYPE string, amount TYPE i, END OF ty_sale.
TYPES tt_sale TYPE STANDARD TABLE OF ty_sale WITH EMPTY KEY.

START-OF-SELECTION.
* Ex. 1
  DATA(lt_num)  = VALUE int4_table( FOR n = 1 UNTIL n > 20 ( n ) ).
  DATA(lt_even) = VALUE int4_table( FOR n = 2 THEN n + 2 UNTIL n > 20 ( n ) ).
  DATA(lv_sum)  = REDUCE i( INIT s = 0 FOR x IN lt_even NEXT s = s + x ).
  DATA(lv_list) = REDUCE string( INIT t = `` sep = `` FOR x IN lt_num
                                 NEXT t = |{ t }{ sep }{ x }| sep = `, ` ).
  WRITE: / lv_sum, / lv_list.

* Ex. 2
  DATA(lt_s) = VALUE tt_sale( ( region = `North` product = `A` amount = 10 )
                              ( region = `South` product = `B` amount = 20 )
                              ( region = `North` product = `C` amount = 30 ) ).
  LOOP AT lt_s INTO DATA(ls_s) GROUP BY ls_s-region INTO DATA(lv_reg).
    DATA(lv_tot) = REDUCE i( INIT s = 0 FOR m IN GROUP lv_reg NEXT s = s + m-amount ).
    WRITE / |{ lv_reg }: { lv_tot }|.
    LOOP AT GROUP lv_reg INTO DATA(ls_m).
      WRITE /5 ls_m-product.
    ENDLOOP.
  ENDLOOP.

* Ex. 3
  TYPES: BEGIN OF ty_f, carrid TYPE s_carr_id, connid TYPE s_conn_id,
                        fldate TYPE s_date,    ticket_price TYPE s_price, END OF ty_f.
  DATA lt_f TYPE STANDARD TABLE OF ty_f WITH EMPTY KEY.
  SELECT * FROM sflight INTO TABLE @DATA(lt_sfl) UP TO 50 ROWS.
  lt_f = CORRESPONDING #( lt_sfl MAPPING ticket_price = price ).
```

Note on ex. 1: the `WHERE` of a `FOR` accepts only comparisons on fields, not calculations such as `MOD`; for the even numbers, a counter `FOR` with step 2 (`THEN n + 2`) is simpler.

Quiz:

1. "Infer the type from the context".
2. `CONV` converts with the standard rules (rounding if needed); `EXACT` raises an exception if the conversion loses information.
3. It calculates a single value (sum, string, maximum...) by iterating over a table.
4. It must have a sorted or hashed key (primary or secondary) on the fields of the condition.
5. It doesn't need a sorted table or fields in first position, it allows calculated keys, and it gives access to the members of the group.
6. Methods run before and after every test method, to prepare and clean up.
7. To replace dependencies (database, BAPIs, other classes) with predictable stand-ins during tests.
8. ABAP Test Cockpit: the central tool for static checks, tests, and security.

> [!NOTE]
> Today you learned: all the constructor operators, `FOR`, `REDUCE`, `FILTER`, `GROUP BY`, `LET`, `CORRESPONDING`; ABAP Unit with assertions and fixtures, TDD, coverage, test doubles, dependency injection, Code Inspector, and ATC. Tomorrow: enhancements, interfaces, print forms, and system techniques.
