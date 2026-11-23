---
title: Dynamic SQL and dynamic calls
description: Build queries and call methods whose names you know only at runtime.
level: intermediate
---

In ABAP SQL, almost every clause can be a **dynamic token**: a character string in parentheses that the runtime parses when the statement runs. The same idea works for calls: the name of a class, a method, or a function module can come from a variable. This is how frameworks read configuration tables and decide at runtime what to select and which code to run.

The data side (creating the target table) is in [dynamic data objects](./0116-dynamic-data.md).

## Dynamic tokens in SELECT

| Clause      | Dynamic form          | Example content            |
| ----------- | --------------------- | -------------------------- |
| field list  | `SELECT (lv_fields)`  | `carrid, connid, cityfrom` |
| data source | `FROM (lv_table)`     | `SPFLI`                    |
| condition   | `WHERE (lv_where)`    | `carrid = @p_carrid`       |
| sort        | `ORDER BY (lv_order)` | `cityfrom DESCENDING`      |
| grouping    | `GROUP BY (lv_group)` | `carrid`                   |

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  DATA(lv_fields) = `carrid, connid, cityfrom, cityto`.
  DATA(lv_table)  = `SPFLI`.
  DATA(lv_where)  = `carrid = @p_carrid`.     " host variable inside the token
  DATA(lv_order)  = `cityfrom`.

  DATA lt_result TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.

  TRY.
      SELECT (lv_fields)
        FROM (lv_table)
        WHERE (lv_where)
        ORDER BY (lv_order)
        INTO CORRESPONDING FIELDS OF TABLE @lt_result.
    CATCH cx_sy_dynamic_osql_error INTO DATA(lx_sql).
      WRITE / lx_sql->get_text( ).
  ENDTRY.
```

- A host variable named in a dynamic token (`@p_carrid`) must be visible where the `SELECT` runs.
- Errors in the token (an unknown column, a typo) aren't found by the syntax check. At runtime they raise exceptions of `CX_SY_DYNAMIC_OSQL_ERROR`, such as `CX_SY_DYNAMIC_OSQL_SEMANTICS`. Always catch them.
- A dynamic `WHERE` can also be an internal table of character lines, which the runtime joins.

## SQL injection

Never build a token by pasting user input into it. A value like `LH' OR carrid <> '` turns your filter into "every row".

```abap
" WRONG: the user controls the SQL
DATA(lv_bad_where) = |carrid = '{ p_carrid }'|.

" RIGHT: the value travels as a host variable
DATA(lv_good_where) = `carrid = @p_carrid`.

" If you must build a literal, escape it
DATA(lv_quoted_where) = |carrid = { cl_abap_dyn_prg=>quote( p_carrid ) }|.
```

For names (tables, columns), check them against a list of allowed values before you use them:

```abap
DATA(lt_allowed) = VALUE string_table( ( `SCARR` ) ( `SPFLI` ) ( `SFLIGHT` ) ).
IF NOT line_exists( lt_allowed[ table_line = lv_table ] ).
  WRITE / 'Table not allowed'.
  RETURN.
ENDIF.
```

`CL_ABAP_DYN_PRG` has more helpers, such as `escape_quotes`, `check_column_name`, and `check_table_name_str`.

> [!CAUTION]
> A dynamic `UPDATE` or `DELETE` with an injected `WHERE` can change every row of a table, in every client if you also use `CLIENT SPECIFIED` or `USING ALL CLIENTS`. Treat every dynamic write as a security review item, and run the ATC security checks on it.

## Dynamic method calls and object creation

The name of the class or of the method goes in parentheses. Parameters can be passed normally, or in a **parameter table** of type `ABAP_PARMBIND_TAB` when you don't know them at compile time either.

```abap
DATA lo_object TYPE REF TO object.
DATA(lv_class)  = `ZCL_FLIGHT_EXPORT_CSV`.     " for example read from a Customizing table
DATA(lv_method) = `EXPORT`.

TRY.
    CREATE OBJECT lo_object TYPE (lv_class).

    DATA(lt_params) = VALUE abap_parmbind_tab(
      ( name  = 'IV_CARRID'
        kind  = cl_abap_objectdescr=>exporting     " seen from the caller
        value = REF #( p_carrid ) ) ).

    CALL METHOD lo_object->(lv_method) PARAMETER-TABLE lt_params.

  CATCH cx_sy_create_object_error cx_sy_dyn_call_error INTO DATA(lx_call).
    WRITE / lx_call->get_text( ).
ENDTRY.
```

- `kind` is seen from the **caller**: a method's `IMPORTING` parameter is passed with `cl_abap_objectdescr=>exporting`, and its `RETURNING` parameter with `cl_abap_objectdescr=>receiving`.
- Static methods: `CALL METHOD (lv_class)=>(lv_method)`.
- Wrong names or parameters raise subclasses of `CX_SY_DYN_CALL_ERROR`, such as `CX_SY_DYN_CALL_ILLEGAL_METHOD` and `CX_SY_DYN_CALL_PARAM_MISSING`.

Most of the time you don't need a dynamic method call at all. Create the object dynamically, cast it to an [interface](./0084-interfaces.md), and call the method statically: the syntax check then validates the call.

```abap
DATA lo_exporter TYPE REF TO zif_flight_exporter.
CREATE OBJECT lo_exporter TYPE (lv_class).     " the class must implement the interface
lo_exporter->export( iv_carrid = p_carrid ).
```

> [!TIP]
> A dynamic call is a phone number written on a sticky note: it works only if someone answers. An interface is a contract with a switchboard that only connects you to people who can do the job.

## Dynamic function calls

For function modules, the name is always a data object, so a variable works directly. For unknown parameters there's `PARAMETER-TABLE` of type `ABAP_FUNC_PARMBIND_TAB` and `EXCEPTION-TABLE` of type `ABAP_FUNC_EXCPBIND_TAB`.

```abap
DATA(lv_function) = `Z_FLIGHTS_OF_CARRIER`.
DATA lv_seats TYPE i.

CALL FUNCTION lv_function
  EXPORTING
    iv_carrid     = p_carrid
  IMPORTING
    ev_seats_free = lv_seats
  EXCEPTIONS
    OTHERS        = 1.
```

## Exercise

> [!IMPORTANT]
> Write a report with parameters `p_table` (one of `SCARR`, `SPFLI`, `SFLIGHT`) and `p_carrid`. Read the first 10 rows of that table for the airline, with a dynamic `FROM` and a dynamic `WHERE` that uses a host variable. Reject any other table name.

### Solution

```abap
REPORT zdynamic_select.

PARAMETERS: p_table  TYPE tabname   DEFAULT 'SFLIGHT',
            p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  DATA(lt_allowed) = VALUE string_table( ( `SCARR` ) ( `SPFLI` ) ( `SFLIGHT` ) ).
  IF NOT line_exists( lt_allowed[ table_line = CONV string( p_table ) ] ).
    WRITE / 'Table not allowed'.
    RETURN.
  ENDIF.

  DATA lr_table TYPE REF TO data.
  FIELD-SYMBOLS <lt_table> TYPE STANDARD TABLE.
  CREATE DATA lr_table TYPE STANDARD TABLE OF (p_table) WITH EMPTY KEY.
  ASSIGN lr_table->* TO <lt_table>.

  DATA(lv_where) = `carrid = @p_carrid`.
  TRY.
      SELECT * FROM (p_table)
        WHERE (lv_where)
        INTO TABLE @<lt_table>
        UP TO 10 ROWS.
    CATCH cx_sy_dynamic_osql_error INTO DATA(lx_sql).
      WRITE / lx_sql->get_text( ).
      RETURN.
  ENDTRY.

  WRITE / |{ lines( <lt_table> ) } rows from { p_table }|.
```

> [!NOTE]
>
> - Field list, `FROM`, `WHERE`, `ORDER BY`, and `GROUP BY` accept dynamic tokens in parentheses.
> - Errors in tokens show up only at runtime: catch `CX_SY_DYNAMIC_OSQL_ERROR`.
> - Pass values as host variables inside the token, or escape them with `CL_ABAP_DYN_PRG`; check names against an allowed list.
> - `CREATE OBJECT ... TYPE (name)` and `CALL METHOD obj->(name)` call code by name; parameter tables cover unknown signatures.
> - Prefer dynamic creation plus a static call through an interface over fully dynamic calls.
