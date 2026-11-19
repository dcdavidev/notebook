---
title: Exceptions, design patterns, and dynamic programming
description: Handle errors professionally and write code that adapts at runtime.
---

_Week 3 · Advanced level · 4 hours_

### Today's schedule

| Block  | Content                                                                               |
| ------ | ------------------------------------------------------------------------------------- |
| Hour 1 | Class-based exceptions: `TRY`, `CATCH`, `CLEANUP`, `RAISE`, `RETRY`, `RESUME`         |
| Hour 2 | Creating your own exceptions; messages in exceptions; the three categories            |
| Hour 3 | Design patterns: singleton, factory, strategy, observer, MVC; SOLID principles        |
| Hour 4 | Dynamic programming: data references, dynamic field symbols, RTTI/RTTS, dynamic calls |

## Hour 1 – Class-based exceptions

An **exception** is an abnormal event that interrupts the normal flow of the program: a file that doesn't exist, a division by zero, a customer not found. So far you've seen `sy-subrc` and the old `EXCEPTIONS` of function modules. The modern way is **class-based exceptions**.

> [!TIP]
> An exception is like a building's fire alarm. Whoever discovers the fire (the code that finds the error) doesn't need to know who will put it out: they press the button (`RAISE`). The alarm goes up floor by floor (the call stack) until someone in charge (`CATCH`) steps in. If nobody steps in, the building is evacuated (a dump).

### TRY ... CATCH ... ENDTRY

```abap
DATA lv_a TYPE i VALUE 10.
DATA lv_b TYPE i VALUE 0.

TRY.
    DATA(lv_r) = lv_a / lv_b.
    WRITE lv_r.                             " never runs
  CATCH cx_sy_zerodivide INTO DATA(lx_div).
    WRITE / |Error: { lx_div->get_text( ) }|.
ENDTRY.

WRITE / 'The program goes on'.
```

- The "risky" code goes in the `TRY` block.
- If an exception occurs, the rest of the `TRY` is skipped and control moves to the matching `CATCH`.
- `INTO` gives you the exception object, with methods such as `get_text( )` (readable text), `get_longtext( )`, `get_source_position( )`.
- The `previous` attribute holds the previous exception (for chains of errors).

### Several CATCHes and the hierarchy

Exceptions are classes organized in a hierarchy. A `CATCH` on a superclass also catches all its subclasses.

```abap
TRY.
    DATA(ls_flight) = lt_flights[ carrid = 'XX' ].
    DATA(lv_x) = CONV i( lv_text ).
  CATCH cx_sy_itab_line_not_found.
    WRITE 'Line not found'.
  CATCH cx_sy_conversion_no_number cx_sy_conversion_overflow.   " several classes together
    WRITE 'Conversion failed'.
  CATCH cx_root INTO DATA(lx_all).                              " everything else
    WRITE lx_all->get_text( ).
ENDTRY.
```

> [!WARNING]
> Order your `CATCH` blocks from the most specific to the most generic: the first one that matches wins. Catching `cx_root` everywhere "just in case" is bad practice: it hides errors you should know about.

### The main hierarchy

| Class              | Meaning                                                                                         | Compiler check                                      |
| ------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `CX_ROOT`          | root of all exceptions                                                                          |                                                     |
| `CX_STATIC_CHECK`  | expected errors the caller must handle (for example customer not found)                         | must be declared with `RAISING` (warning otherwise) |
| `CX_DYNAMIC_CHECK` | errors you can avoid with a check beforehand (for example division by zero, index out of range) | declaration required, checked at runtime            |
| `CX_NO_CHECK`      | serious system errors that can happen anywhere (for example memory exhausted)                   | no declaration needed                               |

### CLEANUP

The `CLEANUP` block runs when an exception **leaves** the `TRY` without being handled there: it "tidies up" (closes files, releases locks) before the exception moves up.

```abap
METHOD process_file.
  OPEN DATASET mv_file FOR INPUT IN TEXT MODE ENCODING DEFAULT.
  TRY.
      read_lines( ).            " can raise zcx_bad_format
    CLEANUP.
      CLOSE DATASET mv_file.    " runs only if the exception leaves the TRY
  ENDTRY.
  CLOSE DATASET mv_file.
ENDMETHOD.
```

### RETRY and RESUME

- `RETRY.` (in a `CATCH`) runs the `TRY` block again from the start: useful after you've fixed the cause (for example by reconnecting). Watch out for infinite loops.
- `RESUME.` continues execution right after the point where the exception was raised. It only works with exceptions raised with `RAISE RESUMABLE EXCEPTION` and caught with `CATCH BEFORE UNWIND`.

## Hour 2 – Creating your own exceptions

### The exception class

In ADT: New → ABAP Class, name `ZCX_FLIGHT_NOT_FOUND`, superclass `CX_STATIC_CHECK`. To use SE91 messages, you implement the interface `IF_T100_MESSAGE` (or `IF_T100_DYN_MSG`).

```abap
CLASS zcx_flight_not_found DEFINITION PUBLIC
  INHERITING FROM cx_static_check FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_t100_dyn_msg.
    DATA mv_carrid TYPE s_carr_id READ-ONLY.
    DATA mv_connid TYPE s_conn_id READ-ONLY.
    METHODS constructor
      IMPORTING textid    LIKE if_t100_message=>t100key OPTIONAL
                previous  LIKE previous OPTIONAL
                iv_carrid TYPE s_carr_id OPTIONAL
                iv_connid TYPE s_conn_id OPTIONAL.
ENDCLASS.

CLASS zcx_flight_not_found IMPLEMENTATION.
  METHOD constructor ##ADT_SUPPRESS_GENERATION.
    super->constructor( previous = previous ).
    mv_carrid = iv_carrid.
    mv_connid = iv_connid.
    CLEAR me->textid.
    if_t100_message~t100key = COND #( WHEN textid IS INITIAL
                                      THEN if_t100_message=>default_textid
                                      ELSE textid ).
  ENDMETHOD.
ENDCLASS.
```

With `IF_T100_DYN_MSG`, the simplest way to raise it is with a message:

```abap
METHOD get_flight.
  SELECT SINGLE * FROM spfli
    WHERE carrid = @iv_carrid AND connid = @iv_connid
    INTO @rs_flight.
  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE zcx_flight_not_found
      MESSAGE e001(zcourse) WITH iv_carrid iv_connid
      EXPORTING iv_carrid = iv_carrid iv_connid = iv_connid.
  ENDIF.
ENDMETHOD.
```

The method must declare the exception in its signature:

```abap
METHODS get_flight
  IMPORTING iv_carrid        TYPE s_carr_id
            iv_connid        TYPE s_conn_id
  RETURNING VALUE(rs_flight) TYPE spfli
  RAISING   zcx_flight_not_found.
```

And the caller handles it:

```abap
TRY.
    DATA(ls_flight) = lo_repo->get_flight( iv_carrid = 'LH' iv_connid = '9999' ).
  CATCH zcx_flight_not_found INTO DATA(lx).
    MESSAGE lx TYPE 'I' DISPLAY LIKE 'E'.   " a T100 exception can be shown directly
ENDTRY.
```

### Other forms of RAISE

```abap
RAISE EXCEPTION NEW zcx_flight_not_found( iv_carrid = 'LH' ).   " with an object

DATA(lv_val) = COND #( WHEN lv_ok = abap_true THEN 1
                       ELSE THROW zcx_error( ) ).               " inside an expression

RAISE EXCEPTION lx_existing.                                     " re-raise an object
```

### Propagate and wrap

A method can leave an exception unhandled and let it move up, declaring it in `RAISING`. Or it can catch it and turn it into an exception of its own level, passing the original one in `previous`:

```abap
TRY.
    lo_db->save( ls_order ).
  CATCH cx_sy_open_sql_db INTO DATA(lx_sql).
    RAISE EXCEPTION NEW zcx_order_error( previous = lx_sql ).
ENDTRY.
```

> [!TIP]
> It's like word of mouth between departments: the warehouse reports "empty shelf" to the sales office, which doesn't tell the customer "empty shelf" but "product not available" (an exception of its own level), while keeping the original message for anyone who wants to investigate.

### Classic and modern exceptions compared

| Aspect      | Classic (`EXCEPTIONS`)        | Class-based                                        |
| ----------- | ----------------------------- | -------------------------------------------------- |
| Where       | FMs, old methods              | everywhere, the modern standard                    |
| Information | only `sy-subrc` (+ `sy-msg*`) | an object with texts, attributes, `previous` chain |
| Propagation | no, it stops at the caller    | moves up the stack automatically                   |
| Handling    | `IF sy-subrc ...`             | `TRY ... CATCH`                                    |

A method can't use both techniques in the same signature.

### Assertions and checkpoints

- `ASSERT condition.` if the condition is false → `ASSERTION_FAILED` dump. You use it to check "impossible" assumptions during development.
- **Checkpoint groups** (transaction SAAB): let you turn assertions, breakpoints, and logs (`LOG-POINT`) on and off without changing the code.

### The application log (SLG1)

For background programs and interfaces, errors are recorded in the **application log**: objects and subobjects defined in SLG0, displayed with SLG1, written with the FMs `BAL_LOG_CREATE`, `BAL_LOG_MSG_ADD`, `BAL_DB_SAVE` or, in ABAP Cloud, with `cl_bali_log`.

## Hour 3 – Design patterns and principles

**Design patterns** are proven solutions to recurring design problems.

### Singleton: a single object

```abap
CLASS lcl_config DEFINITION CREATE PRIVATE.   " nobody can call NEW from outside
  PUBLIC SECTION.
    CLASS-METHODS get_instance RETURNING VALUE(ro_inst) TYPE REF TO lcl_config.
    METHODS get_value IMPORTING iv_key TYPE string RETURNING VALUE(rv) TYPE string.
  PRIVATE SECTION.
    CLASS-DATA go_instance TYPE REF TO lcl_config.
ENDCLASS.

CLASS lcl_config IMPLEMENTATION.
  METHOD get_instance.
    IF go_instance IS NOT BOUND.
      go_instance = NEW #( ).
    ENDIF.
    ro_inst = go_instance.
  ENDMETHOD.

  METHOD get_value.
    rv = |value of { iv_key }|.
  ENDMETHOD.
ENDCLASS.

" usage
DATA(lv_v) = lcl_config=>get_instance( )->get_value( `COUNTRY` ).
```

> [!TIP]
> A singleton is like a country's head of state: there's only one, and anyone who looks for them always finds the same person.

### Factory: who creates the objects

```abap
CLASS lcl_shape_factory DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS create IMPORTING iv_type TYPE string iv_dim TYPE decfloat34
                         RETURNING VALUE(ro) TYPE REF TO lcl_shape.   " the abstract class from day 10
ENDCLASS.

CLASS lcl_shape_factory IMPLEMENTATION.
  METHOD create.
    ro = SWITCH #( iv_type
                   WHEN `CIRCLE` THEN NEW lcl_circle( iv_dim )
                   WHEN `SQUARE` THEN NEW lcl_square( iv_dim )
                   ELSE THROW cx_sy_create_object_error( ) ).
  ENDMETHOD.
ENDCLASS.
```

The caller doesn't know which concrete classes exist: it asks the factory. Adding a new shape touches a single spot.

### Strategy: interchangeable algorithms

An interface `lif_discount_calc` with implementations `lcl_discount_standard`, `lcl_discount_vip`, `lcl_discount_christmas`. The order object receives the right strategy and always calls `calculate( )`. It's exactly the polymorphism of day 10.

### Observer: notify whoever is interested

Implemented in ABAP with the events (`RAISE EVENT` / `SET HANDLER`) of day 10.

### MVC: separate data, logic, and presentation

- **Model**: data access and business rules (classes that read/write).
- **View**: the presentation (ALV, Dynpro, Fiori).
- **Controller**: coordinates, receives user actions, and calls the model.

A professional report has at least one class for the data and one for the output: if tomorrow you move from ALV to Fiori, you only change the view.

### The SOLID principles (in plain words)

| Principle             | In plain words                                                                        |
| --------------------- | ------------------------------------------------------------------------------------- |
| Single responsibility | a class does one thing only                                                           |
| Open/closed           | open to extension (new classes), closed to modification (don't rewrite what works)    |
| Liskov substitution   | a subclass must be able to replace its superclass without surprises                   |
| Interface segregation | many small interfaces are better than one giant one                                   |
| Dependency inversion  | depend on interfaces, not on concrete classes (so you can swap them in tests, day 12) |

Recommended reference: the open source **Clean ABAP** guide (SAP repository on GitHub), with rules on names, short methods, comments, exceptions, and tests.

## Hour 4 – Dynamic programming

Sometimes, while you write the code, you don't know which table, field, or class you'll use: you find out only at runtime (for example, a program that shows any table the user picks). For that, ABAP offers dynamic tools.

> [!TIP]
> Static programming is like a recipe with exact ingredients. Dynamic programming is like a cook who opens the fridge, looks at what's inside, and decides on the spot what to cook.

### Data references

```abap
DATA lr_num TYPE REF TO i.
lr_num = NEW #( 42 ).          " creates an anonymous integer in memory
lr_num->* = lr_num->* + 1.     " ->* = the content pointed to (dereferencing)

DATA lv_x TYPE i VALUE 5.
DATA(lr_x) = REF #( lv_x ).    " reference to an existing variable
lr_x->* = 10.                  " now lv_x is 10

* Generic reference: can point to anything
DATA lr_any TYPE REF TO data.
CREATE DATA lr_any TYPE string.
CREATE DATA lr_any TYPE ('SFLIGHT').                   " type decided at runtime
CREATE DATA lr_any TYPE STANDARD TABLE OF ('SPFLI').   " table of a dynamic type
```

### Dynamic field symbols

```abap
FIELD-SYMBOLS <lt_tab>   TYPE STANDARD TABLE.
FIELD-SYMBOLS <ls_row>   TYPE any.
FIELD-SYMBOLS <lv_field> TYPE any.

DATA(lv_table) = `SCARR`.      " chosen at runtime (for example by the user)

DATA lr_tab TYPE REF TO data.
CREATE DATA lr_tab TYPE STANDARD TABLE OF (lv_table).
ASSIGN lr_tab->* TO <lt_tab>.

SELECT * FROM (lv_table) INTO TABLE @<lt_tab> UP TO 10 ROWS.   " dynamic SQL

LOOP AT <lt_tab> ASSIGNING <ls_row>.
  ASSIGN COMPONENT 'CARRNAME' OF STRUCTURE <ls_row> TO <lv_field>.   " field by name
  IF sy-subrc = 0.
    WRITE / <lv_field>.
  ENDIF.
ENDLOOP.

* Modern form of dynamic component access
ASSIGN <ls_row>-('CARRID') TO <lv_field>.
```

The other parts of a `SELECT` can be dynamic too: `SELECT (lv_fields) FROM (lv_tab) WHERE (lv_where)`.

> [!WARNING]
> Dynamic SQL with text entered by the user is dangerous (**SQL injection**). Always validate names with the `cl_abap_dyn_prg` class (for example `check_table_name_str`, `check_column_name`, `quote`) before using them.

### RTTI and RTTS: inspect and create types at runtime

**RTTI** (_Run Time Type Information_) tells you what a piece of data looks like. **RTTS** (_Run Time Type Services_) also lets you create new types at runtime. The classes are `cl_abap_typedescr` and its subclasses (`cl_abap_elemdescr`, `cl_abap_structdescr`, `cl_abap_tabledescr`, `cl_abap_classdescr`, `cl_abap_refdescr`).

```abap
* What type is it?
DATA(lo_type) = cl_abap_typedescr=>describe_by_data( lv_x ).
WRITE: / lo_type->type_kind, lo_type->length.

* Which fields does a structure have?
DATA(lo_struct) = CAST cl_abap_structdescr(
                    cl_abap_typedescr=>describe_by_name( 'SCARR' ) ).
LOOP AT lo_struct->components INTO DATA(ls_comp).
  WRITE: / ls_comp-name, ls_comp-type_kind, ls_comp-length.
ENDLOOP.

* Fields with DDIC descriptions
DATA(lt_ddic) = lo_struct->get_ddic_field_list( p_langu = sy-langu ).

* Create at runtime a structure with two fields and a table of that type
DATA(lo_new_struct) = cl_abap_structdescr=>get( VALUE #(
  ( name = 'CODE'  type = cl_abap_elemdescr=>get_c( 10 ) )
  ( name = 'VALUE' type = cl_abap_elemdescr=>get_p( p_length = 8 p_decimals = 2 ) ) ) ).
DATA(lo_new_table) = cl_abap_tabledescr=>get( lo_new_struct ).
DATA lr_dyn TYPE REF TO data.
CREATE DATA lr_dyn TYPE HANDLE lo_new_table.
```

### Dynamic calls

```abap
DATA(lv_class)  = `ZCL_ACCOUNT`.
DATA(lv_method) = `GET_BALANCE`.
DATA lo_obj TYPE REF TO object.

CREATE OBJECT lo_obj TYPE (lv_class).
CALL METHOD lo_obj->(lv_method).                   " dynamic method

DATA(lt_par) = VALUE abap_parmbind_tab(
  ( name = 'RV_BALANCE' kind = cl_abap_objectdescr=>receiving value = REF #( lv_balance ) ) ).
CALL METHOD lo_obj->(lv_method) PARAMETER-TABLE lt_par.

CALL FUNCTION lv_fm_name EXPORTING ...             " dynamic function module
PERFORM (lv_form) IN PROGRAM (lv_prog).            " dynamic subroutine
SUBMIT (lv_report) AND RETURN.                     " dynamic report
```

Typical exceptions in dynamic programming: `CX_SY_DYNAMIC_OSQL_ERROR`, `CX_SY_CREATE_DATA_ERROR`, `CX_SY_DYN_CALL_ERROR`, `CX_SY_ASSIGN_CAST_ERROR`. Always handle them.

### Code generation (overview)

`GENERATE SUBROUTINE POOL` and `INSERT REPORT` create code at runtime. They're extreme tools, forbidden in ABAP Cloud, and best avoided in normal projects.

## Exercises

> [!IMPORTANT]
>
> 1. Write a method that divides two numbers and handles division by zero with `TRY`/`CATCH`, returning a readable message.
> 2. Create the exception class `ZCX_FLIGHT_NOT_FOUND` linked to message 001 of `ZCOURSE`. Create the class `ZCL_FLIGHT_REPO` with the method `get_flight` that raises it. Call it from a report and show the message.
> 3. Implement a singleton `ZCL_LOGGER` with the methods `add( iv_msg )` and `display( )` (shows the collected messages in an ALV).
> 4. Create a factory that, given a customer type (`'STD'`, `'VIP'`), returns a discount strategy (an interface with a `calculate` method).
> 5. Write the report `ZES11_SHOW_TABLE` with a "table name" parameter: check the name with `cl_abap_dyn_prg`, read the first 100 rows dynamically, and show them in `CL_SALV_TABLE`.
> 6. With RTTI, print the name, type, and length of every field of table `SFLIGHT`.

## Quiz

1. What is the difference between `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK`, and `CX_NO_CHECK`?
2. When does `CLEANUP` run?
3. Why must `CATCH` blocks go from the most specific to the most generic?
4. What is the `previous` attribute for?
5. What does a singleton guarantee? How do you prevent `NEW` from outside?
6. What does `lr_ref->*` mean?
7. What does `ASSIGN COMPONENT ... OF STRUCTURE` do?
8. What risk does dynamic SQL bring, and how do you avoid it?

## Solutions

```abap
REPORT zes11_show_table.

PARAMETERS p_tab TYPE tabname OBLIGATORY DEFAULT 'SCARR'.

START-OF-SELECTION.
  TRY.
      DATA(lv_tab) = cl_abap_dyn_prg=>check_table_name_str(
                       val      = to_upper( p_tab )
                       packages = '' ).

      DATA lr_data TYPE REF TO data.
      CREATE DATA lr_data TYPE STANDARD TABLE OF (lv_tab).
      ASSIGN lr_data->* TO FIELD-SYMBOL(<lt_data>).

      SELECT * FROM (lv_tab) INTO TABLE @<lt_data> UP TO 100 ROWS.

      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = <lt_data> ).
      lo_alv->get_functions( )->set_all( ).
      lo_alv->display( ).

    CATCH cx_abap_not_a_table cx_abap_not_in_package.
      MESSAGE 'Invalid table name' TYPE 'S' DISPLAY LIKE 'E'.
    CATCH cx_sy_create_data_error cx_sy_dynamic_osql_error cx_salv_msg INTO DATA(lx).
      MESSAGE lx->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
  ENDTRY.
```

Note: `packages = ''` turns off the package filter; in a real system, limit the list to the allowed packages and add an `AUTHORITY-CHECK` on `S_TABU_NAM` for the requested table.

Quiz:

1. STATIC: expected errors that must be declared and handled (the compiler checks); DYNAMIC: avoidable with checks beforehand, verified at runtime; NO_CHECK: system errors that can happen anywhere, with no declaration.
2. When an exception leaves the `TRY` without being handled in that `TRY`.
3. Because the first compatible `CATCH` wins: a generic `CATCH` at the top would "steal" every exception.
4. To link the original exception to the new one (the chain of causes).
5. That only one instance exists; with `CREATE PRIVATE` and a static `get_instance` method.
6. The data the reference points to.
7. It assigns a field symbol to a structure field given by name (or position) at runtime.
8. SQL injection: you validate names and values with `cl_abap_dyn_prg` and check authorizations.

> [!NOTE]
> Today you learned: class-based exceptions (`TRY`, `CATCH`, `CLEANUP`, `RETRY`, `RESUME`, `RAISE`, `THROW`), exception classes with T100 messages, the application log, design patterns (singleton, factory, strategy, observer, MVC), SOLID and Clean ABAP, and dynamic programming with references, field symbols, RTTI/RTTS, and dynamic calls. Tomorrow: modern ABAP and automated tests.
