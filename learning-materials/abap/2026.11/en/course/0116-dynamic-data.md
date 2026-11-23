---
title: Dynamic data objects
description: CREATE DATA, ASSIGN COMPONENT, and generic types.
level: intermediate
---

A **dynamic data object** is a variable whose type is decided while the program runs. You create it with `CREATE DATA`, reach it through a data reference, and work on it with field symbols of a **generic type**. Together with [RTTS](./0115-rtts.md), this is how you write code that handles any table or any structure: generic exports, uploads, and comparison tools.

You need [field symbols](./0041-field-symbols.md) and [data references](./0042-data-references.md) for this lesson.

## Generic types

A generic type leaves part of the type open. You can use it for field symbols and for parameters of methods and function modules, but not for `DATA`.

| Generic type     | Accepts                                                      |
| ---------------- | ------------------------------------------------------------ |
| `any` / `data`   | any data object                                              |
| `simple`         | any elementary type, and flat character-like structures      |
| `clike`          | `c`, `n`, `d`, `t`, `string`, flat character-like structures |
| `csequence`      | `c` and `string`                                             |
| `numeric`        | `i`, `int8`, `p`, `decfloat16`, `decfloat34`, `f`            |
| `any table`      | any internal table                                           |
| `index table`    | standard and sorted tables                                   |
| `standard table` | standard tables only                                         |
| `REF TO data`    | a reference to any data object                               |

The more specific the type, the more you can do with it. With `any table` you can loop and insert by key, but not access by index; with `index table` you can.

## Create data at runtime

`CREATE DATA` creates an anonymous data object and puts a reference to it in a variable of type `REF TO data`. The type can be static, a name in parentheses, or an RTTS descriptor:

```abap
DATA lr_data TYPE REF TO data.

CREATE DATA lr_data TYPE i.                          " static type
CREATE DATA lr_data TYPE ('SCARR').                  " type name known at runtime
CREATE DATA lr_data TYPE STANDARD TABLE OF ('SPFLI') " table of a runtime type
                    WITH EMPTY KEY.
CREATE DATA lr_data TYPE HANDLE lo_type.             " RTTS descriptor (REF TO cl_abap_datadescr)
```

To use the object, dereference it into a field symbol:

```abap
FIELD-SYMBOLS <lt_table> TYPE STANDARD TABLE.

DATA(lv_name) = `SPFLI`.
CREATE DATA lr_data TYPE STANDARD TABLE OF (lv_name) WITH EMPTY KEY.
ASSIGN lr_data->* TO <lt_table>.

SELECT * FROM (lv_name) INTO TABLE @<lt_table> UP TO 10 ROWS.
WRITE / |{ lines( <lt_table> ) } rows read from { lv_name }|.
```

The dynamic `FROM (lv_name)` is explained in [dynamic SQL and dynamic calls](./0117-dynamic-sql-and-calls.md).

> [!WARNING]
> If the type name doesn't exist, `CREATE DATA` raises `CX_SY_CREATE_DATA_ERROR`. When the name comes from the user, wrap the statement in `TRY ... CATCH cx_sy_create_data_error`.

> [!TIP]
> `CREATE DATA` is like ordering a box from a warehouse by item code. You don't know the shape in advance, so you get a delivery note (the reference). To open the box and work on its contents, you go to the shelf where it's stored (the field symbol).

## ASSIGN COMPONENT

When you don't know the structure of a row, `ASSIGN COMPONENT` reaches one component by **name** or by **position**:

```abap
FIELD-SYMBOLS <ls_row>   TYPE any.
FIELD-SYMBOLS <lv_value> TYPE any.

LOOP AT <lt_table> ASSIGNING <ls_row>.
  ASSIGN COMPONENT 'CITYFROM' OF STRUCTURE <ls_row> TO <lv_value>.   " by name
  IF sy-subrc = 0.
    WRITE / <lv_value>.
  ENDIF.
ENDLOOP.
```

With a number instead of a name you get the n-th component. A `DO` loop that stops when `sy-subrc` isn't 0 walks through all the components of any structure:

```abap
DO.
  ASSIGN COMPONENT sy-index OF STRUCTURE <ls_row> TO <lv_value>.
  IF sy-subrc <> 0.
    EXIT.                         " no more components
  ENDIF.
  WRITE <lv_value>.
ENDDO.
```

Always check `sy-subrc` (or `IS ASSIGNED`) after a dynamic `ASSIGN`. If it fails, the field symbol keeps its previous assignment, or stays unassigned, and using an unassigned field symbol is a short dump.

## A generic method

Generic parameters let one method serve any table:

```abap
CLASS lcl_table_printer DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS print IMPORTING it_table TYPE ANY TABLE.
ENDCLASS.

CLASS lcl_table_printer IMPLEMENTATION.
  METHOD print.
    FIELD-SYMBOLS <ls_row>   TYPE any.
    FIELD-SYMBOLS <lv_value> TYPE any.

    LOOP AT it_table ASSIGNING <ls_row>.
      NEW-LINE.
      DO.
        ASSIGN COMPONENT sy-index OF STRUCTURE <ls_row> TO <lv_value>.
        IF sy-subrc <> 0.
          EXIT.
        ENDIF.
        WRITE <lv_value>.
      ENDDO.
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SELECT * FROM scarr INTO TABLE @DATA(lt_carriers) UP TO 5 ROWS.
  lcl_table_printer=>print( lt_carriers ).
```

## Exercise

> [!IMPORTANT]
> Write a report with a parameter `p_tab TYPE tabname DEFAULT 'SCARR'` and a parameter `p_field TYPE fieldname DEFAULT 'CARRNAME'`. Read the first 20 rows of the table into a dynamically created internal table and print only the requested field. Show a message if the table or the field doesn't exist.

### Solution

```abap
REPORT zdynamic_field.

PARAMETERS: p_tab   TYPE tabname   DEFAULT 'SCARR',
            p_field TYPE fieldname DEFAULT 'CARRNAME'.

START-OF-SELECTION.
  DATA lr_table TYPE REF TO data.
  FIELD-SYMBOLS: <lt_table> TYPE STANDARD TABLE,
                 <ls_row>   TYPE any,
                 <lv_value> TYPE any.

  TRY.
      CREATE DATA lr_table TYPE STANDARD TABLE OF (p_tab) WITH EMPTY KEY.
    CATCH cx_sy_create_data_error.
      WRITE / |Unknown table { p_tab }|.
      RETURN.
  ENDTRY.
  ASSIGN lr_table->* TO <lt_table>.

  SELECT * FROM (p_tab) INTO TABLE @<lt_table> UP TO 20 ROWS.

  LOOP AT <lt_table> ASSIGNING <ls_row>.
    ASSIGN COMPONENT p_field OF STRUCTURE <ls_row> TO <lv_value>.
    IF sy-subrc <> 0.
      WRITE / |Unknown field { p_field }|.
      RETURN.
    ENDIF.
    WRITE / <lv_value>.
  ENDLOOP.
```

> [!NOTE]
>
> - Generic types (`any`, `data`, `any table`, `index table`, `clike`, ...) work for field symbols and parameters, not for `DATA`.
> - `CREATE DATA` creates a data object of a static, named, or RTTS type and returns a `REF TO data`.
> - Dereference with `ASSIGN lr_data->* TO <fs>` to work on it.
> - `ASSIGN COMPONENT name_or_index OF STRUCTURE` reaches a component you know only at runtime.
> - Always check `sy-subrc` after a dynamic `ASSIGN`, and catch `CX_SY_CREATE_DATA_ERROR`.
