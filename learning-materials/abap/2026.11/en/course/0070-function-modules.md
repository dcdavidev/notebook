---
title: Function modules
description: Function groups, interfaces, exceptions, and SE37.
---

_Basic level_

A **function module** is a reusable procedure stored centrally in the system, with a typed interface. Any program can call it with `CALL FUNCTION`. SAP delivers tens of thousands of them, and many important techniques work only with function modules: remote calls ([RFC](./0124-rfc.md)), [BAPIs](./0071-bapis.md), and [update modules](./0113-update-task.md).

You'll call standard function modules all the time, and sometimes write your own.

## Function groups

Every function module belongs to a **function group**: a container program (type `F`) that holds related function modules and their shared data. When you create the function group `ZFLIGHT`, the system creates the main program `SAPLZFLIGHT` and some includes:

| Include            | Content                                                      |
| ------------------ | ------------------------------------------------------------ |
| `LZFLIGHTTOP`      | global data of the group, shared by all its function modules |
| `LZFLIGHTUXX`      | generated; includes one `LZFLIGHTUnn` per function module    |
| `LZFLIGHTU01`, ... | the source code of each function module                      |
| `LZFLIGHTF01`      | your subroutines or local classes, if you need them          |

Create a function group in `SE80` (right-click the package > **Create > Function Group**) or in ADT (**New > ABAP Function Group**). Then create the function module in `SE37` or ADT and assign it to the group.

> [!WARNING]
> The global data in the `TOP` include stays in memory for as long as the calling program runs. If one call sets a global variable, the next call of any function module in the same group sees that value. This can be useful (a buffer), but it's also a common source of hard-to-find bugs.

## The interface

In `SE37`, the interface is spread over tabs: **Import**, **Export**, **Changing**, **Tables**, and **Exceptions**. The editor shows it as a comment at the top of the source code:

```abap
FUNCTION z_flight_get_carrier.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_CARRID) TYPE  S_CARR_ID
*"  EXPORTING
*"     VALUE(ES_CARRIER) TYPE  SCARR
*"  EXCEPTIONS
*"      NOT_FOUND
*"----------------------------------------------------------------------
  SELECT SINGLE * FROM scarr
    WHERE carrid = @iv_carrid
    INTO @es_carrier.
  IF sy-subrc <> 0.
    RAISE not_found.
  ENDIF.
ENDFUNCTION.
```

| Parameter kind | Direction (seen from the function module) | Notes                                           |
| -------------- | ----------------------------------------- | ----------------------------------------------- |
| Importing      | in                                        | can be optional and have a default value        |
| Exporting      | out                                       | always optional for the caller                  |
| Changing       | in and out                                |                                                 |
| Tables         | in and out                                | internal tables; obsolete, use Changing instead |
| Exceptions     | error cases                               | classic exceptions, raised with `RAISE`         |

**Pass Value** (the checkbox in the interface, `VALUE(...)` in the comment) passes a copy. Without it, the parameter is passed by reference. RFC function modules must pass everything by value.

> [!TIP]
> A function module is like a vending machine in the hallway. Everyone in the building can use it, the slot for coins and the tray for the drink are the same for everyone (the interface), and you don't need to know what's inside.

## Calling a function module

```abap
DATA ls_carrier TYPE scarr.

CALL FUNCTION 'Z_FLIGHT_GET_CARRIER'
  EXPORTING
    iv_carrid  = 'LH'
  IMPORTING
    es_carrier = ls_carrier
  EXCEPTIONS
    not_found  = 1
    OTHERS     = 2.

CASE sy-subrc.
  WHEN 0.
    WRITE: / ls_carrier-carrname.
  WHEN 1.
    WRITE: / 'Airline not found'.
  WHEN OTHERS.
    WRITE: / 'Unexpected error'.
ENDCASE.
```

- The directions are swapped on the caller's side: you pass the function module's importing parameters after `EXPORTING`, and receive its exporting parameters after `IMPORTING`.
- The name is a text literal in uppercase. If it's wrong, the syntax check doesn't notice and the program dumps with `CALL_FUNCTION_NOT_FOUND`.
- Each exception gets a number. When the function module raises it, the call ends and `sy-subrc` gets that number. `OTHERS` catches the exceptions you didn't list.
- Don't type the call by hand: in `SE38` use the **Pattern** button (Ctrl+F6), in ADT type the name and press Ctrl+Space. The editor inserts the full call with all parameters.

> [!WARNING]
> If a function module raises a classic exception that isn't listed after `EXCEPTIONS` (and there's no `OTHERS`), the program ends with a runtime error. Always list the exceptions, or at least `OTHERS`, and check `sy-subrc`.

Instead of `RAISE not_found`, a function module can use `MESSAGE e001(zflight) RAISING not_found`: the caller gets `sy-subrc` and the message fields `sy-msgid`, `sy-msgno`, `sy-msgv1` ... `sy-msgv4`. Newer function modules can also raise [class-based exceptions](./0089-class-based-exceptions.md), declared with the **Exception Classes** checkbox.

## Testing in SE37

In `SE37`, enter the name and press **Test/Execute** (F8). The test screen lets you enter the importing parameters, runs the function module, and shows the exporting parameters, the exception raised, and the runtime. It's the fastest way to find out what a standard function module does before you call it in your code.

## Exercise

> [!IMPORTANT]
>
> 1. Create a function group `ZFLIGHT` and a function module `Z_FLIGHT_GET_CONNECTIONS` with an importing parameter for the airline, a changing parameter of type table of `SPFLI`, and an exception `NO_DATA`.
> 2. Test it in `SE37` with `LH` and with an airline that doesn't exist.
> 3. Call it from a report and handle the exception.

### Solution

```abap
FUNCTION z_flight_get_connections.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_CARRID) TYPE  S_CARR_ID
*"  CHANGING
*"     VALUE(CT_CONNECTIONS) TYPE  SPFLI_TAB
*"  EXCEPTIONS
*"      NO_DATA
*"----------------------------------------------------------------------
  SELECT * FROM spfli
    WHERE carrid = @iv_carrid
    INTO TABLE @ct_connections.
  IF sy-subrc <> 0.
    RAISE no_data.
  ENDIF.
ENDFUNCTION.
```

```abap
REPORT zflight_call_fm.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.

START-OF-SELECTION.
  DATA lt_connections TYPE spfli_tab.

  CALL FUNCTION 'Z_FLIGHT_GET_CONNECTIONS'
    EXPORTING
      iv_carrid      = p_carrid
    CHANGING
      ct_connections = lt_connections
    EXCEPTIONS
      no_data        = 1
      OTHERS         = 2.
  IF sy-subrc <> 0.
    WRITE: / 'No connections for', p_carrid.
    RETURN.
  ENDIF.

  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
```

`SPFLI_TAB` is a table type of `SPFLI` in the Dictionary. If your system doesn't have it, create your own [table type](./0048-ddic-structures-and-table-types.md).

> [!NOTE]
>
> - A function module is a global procedure with a typed interface; it lives in a function group, which also holds shared global data.
> - Parameters: Importing, Exporting, Changing, Tables (obsolete), and Exceptions; Pass Value means a copy.
> - On the caller's side the directions are swapped: `EXPORTING` sends values, `IMPORTING` receives them.
> - List the exceptions with numbers (and `OTHERS`) after `EXCEPTIONS`, and check `sy-subrc`.
> - Use the Pattern button to insert calls, and `SE37` to test function modules before you use them.
