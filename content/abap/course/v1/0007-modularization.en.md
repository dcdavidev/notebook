---
title: 'Modularization: splitting code into blocks'
description: Includes, subroutines, function modules, BAPIs, SAP memory, and ABAP memory.
---

_Week 2 · Intermediate level · 4 hours_

### Today's schedule

| Block  | Content                                                                              |
| ------ | ------------------------------------------------------------------------------------ |
| Hour 1 | Why modularize; includes; macros; subroutines (FORM/PERFORM)                         |
| Hour 2 | Function modules: function groups, parameters, exceptions, SE37                      |
| Hour 3 | Calling standard function modules; BAPIs and BAPIRET2; RFC (overview)                |
| Hour 4 | Passing parameters by value and by reference; SAP and ABAP memory; visibility scopes |

## Hour 1 – Why modularize

**Modularizing** means splitting a program into smaller blocks, each with a precise job, that you can call whenever you need them.

> [!TIP]
> A professional kitchen doesn't have a single cook doing everything: someone makes the sauces, someone the pasta, someone the desserts. Each station has a job. If three dishes need the sauce, nobody makes it three times from scratch: they ask the sauce station. Modules are the stations of your kitchen.

Advantages: more readable code, no duplication (write once, use many times), errors that are easier to find, simpler tests.

ABAP has these modularization units:

| Tool                | Scope                                          | Status                               |
| ------------------- | ---------------------------------------------- | ------------------------------------ |
| Include             | splits a program into several files            | still used                           |
| Macro (`DEFINE`)    | repeats textual pieces of code                 | not recommended                      |
| Subroutine (`FORM`) | block inside a program                         | obsolete, but everywhere in old code |
| Function module     | global block, reusable anywhere, even remotely | widely used                          |
| Class method        | block in a class (day 10)                      | the modern way, to prefer            |

### Includes

An **include** is a piece of code saved separately and "pasted" into a program with the `INCLUDE` statement. It can't run on its own.

```abap
REPORT zbig_program.

INCLUDE zbig_program_top.   " global declarations
INCLUDE zbig_program_sel.   " selection screen
INCLUDE zbig_program_f01.   " subroutines
```

Typical naming conventions: `_TOP` (global data), `_SEL` (selection), `_F01` (forms), `_O01` (PBO modules), `_I01` (PAI modules), `_CL` (local classes).

### Macros

```abap
DEFINE write_line.
  WRITE: / &1, &2.
END-OF-DEFINITION.

write_line 'Name:' lv_name.
```

You can't debug macros line by line: avoid them. It's enough to recognize them.

### Subroutines: FORM and PERFORM

They are **obsolete** (SAP recommends methods), but you'll find them in thousands of existing programs, so you need to know them well.

```abap
REPORT zsubroutine.

DATA gv_result TYPE i.

START-OF-SELECTION.
  PERFORM add USING 5 7 CHANGING gv_result.
  WRITE gv_result.                   " 12

FORM add USING    iv_a     TYPE i
                  iv_b     TYPE i
         CHANGING cv_total TYPE i.
  cv_total = iv_a + iv_b.
ENDFORM.
```

- `USING`: input parameters (careful: they are passed **by reference**! See hour 4).
- `USING VALUE(p)`: by value.
- `CHANGING`: parameters that are changed and returned.
- `TABLES`: the old way to pass tables (obsolete).
- Variables declared inside the `FORM` are **local**; those declared at the top of the program are **global** and visible everywhere.

## Hour 2 – Function modules

A **function module** (FM) is a **global** block of code: you create it once in SE37, and any program in the system can call it (and, if enabled, external systems too).

> [!TIP]
> A function module is like a kitchen appliance: you don't know how the blender is built inside, you only know that you put the fruit in (import parameters), press the button, and get a smoothie (export parameters). If you put a stone in, it warns you there's a problem (an exception).

### Function groups

Every function module belongs to a **function group**, created in SE80 or SE37 (Goto → Function Groups). The group is a container program that shares **global data** (include `L<group>TOP`) among its modules. When you call an FM, the whole group is loaded into memory and stays there until the calling program ends: the group's global data "remembers" its values between calls.

### Create a function module

SE37 → name `Z_CALCULATE_VAT` → Create → function group `ZFG_COURSE`.

Tabs:

| Tab         | Content                                                 |
| ----------- | ------------------------------------------------------- |
| Attributes  | type: normal, remote-enabled (RFC), update              |
| Import      | input parameters (optional or mandatory, with defaults) |
| Export      | output parameters                                       |
| Changing    | input and output parameters                             |
| Tables      | tables (obsolete, but still required by RFCs/BAPIs)     |
| Exceptions  | errors the FM can report                                |
| Source code | the code                                                |

```abap
FUNCTION z_calculate_vat.
*"----------------------------------------------------------------------
*"  IMPORTING
*"     VALUE(IV_NET) TYPE NETWR
*"     VALUE(IV_RATE) TYPE P DEFAULT '22'
*"  EXPORTING
*"     VALUE(EV_VAT) TYPE NETWR
*"     VALUE(EV_GROSS) TYPE NETWR
*"  EXCEPTIONS
*"      NEGATIVE_AMOUNT
*"----------------------------------------------------------------------
  IF iv_net < 0.
    RAISE negative_amount.
  ENDIF.

  ev_vat   = iv_net * iv_rate / 100.
  ev_gross = iv_net + ev_vat.
ENDFUNCTION.
```

SAP generates the header with the asterisks: you define the parameters in the tabs. You can test the FM directly with F8 in SE37 (test environment).

### Call a function module

In SE38 or ADT, use the **Pattern** button (Ctrl+F6 in SAP GUI) to insert the call with all its parameters automatically.

```abap
DATA lv_vat   TYPE netwr.
DATA lv_gross TYPE netwr.

CALL FUNCTION 'Z_CALCULATE_VAT'
  EXPORTING
    iv_net          = '100.00'
  IMPORTING
    ev_vat          = lv_vat
    ev_gross        = lv_gross
  EXCEPTIONS
    negative_amount = 1
    OTHERS          = 2.

IF sy-subrc <> 0.
  WRITE 'Calculation error'.
ELSE.
  WRITE: / lv_vat, lv_gross.
ENDIF.
```

> [!WARNING]
> Mind the point of view: in the module, the parameters are called `IMPORTING` (what the module receives); in the call, you write `EXPORTING` (what the program sends). It's like a letter: you send it (`EXPORTING`), the recipient receives it (`IMPORTING`).

If you don't list the `EXCEPTIONS` in the call and the FM runs `RAISE`, the program dumps. Always list at least `OTHERS`.

FMs can also raise **class-based exceptions** (day 11), which you handle with `TRY...CATCH`.

### Messages from function modules

An FM can report an error with `MESSAGE ... RAISING exception`: it sets `sy-subrc` and fills the fields `sy-msgid`, `sy-msgno`, `sy-msgv1..4`, which the caller can display:

```abap
IF sy-subrc <> 0.
  MESSAGE ID sy-msgid TYPE 'I' NUMBER sy-msgno
          WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
ENDIF.
```

## Hour 3 – Standard modules, BAPIs, and RFC

### Useful standard function modules

SAP contains tens of thousands of FMs. Some you'll use often:

| Function module                           | What it is for                             |
| ----------------------------------------- | ------------------------------------------ |
| `CONVERSION_EXIT_ALPHA_INPUT` / `_OUTPUT` | add/remove leading zeros                   |
| `CONVERSION_EXIT_MATN1_INPUT`             | material number conversion                 |
| `POPUP_TO_CONFIRM`                        | Yes/No confirmation popup                  |
| `POPUP_GET_VALUES`                        | popup that asks for values                 |
| `GUI_UPLOAD` / `GUI_DOWNLOAD`             | read/write files on the user's PC (day 8)  |
| `READ_TEXT` / `SAVE_TEXT`                 | long texts (notes on orders, materials...) |
| `RP_CALC_DATE_IN_INTERVAL`                | add days/months/years to a date            |
| `CONVERT_TO_LOCAL_CURRENCY`               | currency conversion                        |
| `NUMBER_GET_NEXT`                         | next number from a number range (SNRO)     |
| `ENQUEUE_...` / `DEQUEUE_...`             | locks (generated)                          |
| `SO_NEW_DOCUMENT_ATT_SEND_API1`           | send email (old; today the `CL_BCS` class) |
| `JOB_OPEN` / `JOB_SUBMIT` / `JOB_CLOSE`   | schedule background jobs                   |

To find an FM: SE37 with `*word*` + F4, or the Repository Information System (SE84).

### BAPIs

**BAPIs** (_Business Application Programming Interfaces_) are special, official function modules through which SAP lets you create and change business objects (orders, invoices, materials...) while running **all the standard checks**. They are remote-enabled and documented. You find them with transaction **BAPI** (BAPI Explorer).

| BAPI                                    | Object                      |
| --------------------------------------- | --------------------------- |
| `BAPI_SALESORDER_CREATEFROMDAT2`        | create a sales order        |
| `BAPI_PO_CREATE1`                       | create a purchase order     |
| `BAPI_MATERIAL_SAVEDATA`                | create/change a material    |
| `BAPI_ACC_DOCUMENT_POST`                | post an accounting document |
| `BAPI_GOODSMVT_CREATE`                  | goods movement              |
| `BAPI_USER_GET_DETAIL`                  | a user's data               |
| `BAPI_TRANSACTION_COMMIT` / `_ROLLBACK` | confirm / undo the BAPIs    |

Rules for using BAPIs:

1. **BAPIs don't `COMMIT` on their own**: you must call `BAPI_TRANSACTION_COMMIT` (with `WAIT = 'X'`) if everything went well, or `BAPI_TRANSACTION_ROLLBACK`.
2. **Errors don't come as exceptions** but in the `RETURN` table (structure `BAPIRET2`): you must check whether it has rows with `TYPE = 'E'` (error) or `'A'` (abort).
3. Structures with an **X** suffix (for example `ORDER_HEADER_INX`) say which fields you're passing or changing: put `'X'` in the corresponding fields.

```abap
DATA lt_return TYPE STANDARD TABLE OF bapiret2.
DATA ls_header TYPE bapisdhd1.
DATA ls_headx  TYPE bapisdhd1x.
DATA lt_items  TYPE STANDARD TABLE OF bapisditm.
DATA lt_partn  TYPE STANDARD TABLE OF bapiparnr.
DATA lv_vbeln  TYPE vbeln_va.

ls_header = VALUE #( doc_type = 'TA' sales_org = '1000' distr_chan = '10' division = '00' ).
ls_headx  = VALUE #( doc_type = 'X'  sales_org = 'X'    distr_chan = 'X'  division = 'X' ).
lt_partn  = VALUE #( ( partn_role = 'AG' partn_numb = '0000001000' ) ).
lt_items  = VALUE #( ( itm_number = '000010' material = 'MAT001' target_qty = 5 ) ).

CALL FUNCTION 'BAPI_SALESORDER_CREATEFROMDAT2'
  EXPORTING
    order_header_in  = ls_header
    order_header_inx = ls_headx
  IMPORTING
    salesdocument    = lv_vbeln
  TABLES
    return           = lt_return
    order_items_in   = lt_items
    order_partners   = lt_partn.

IF line_exists( lt_return[ type = 'E' ] ) OR line_exists( lt_return[ type = 'A' ] ).
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
  LOOP AT lt_return INTO DATA(ls_ret) WHERE type CA 'EA'.
    WRITE / ls_ret-message.
  ENDLOOP.
ELSE.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT' EXPORTING wait = abap_true.
  WRITE / |Order created: { lv_vbeln }|.
ENDIF.
```

(The organizational codes `'1000'`, `'10'`, `'TA'` are examples: they depend on your system's customizing.)

> [!TIP]
> A BAPI is the bank's official counter: you fill in the form, the clerk checks everything and gives you a receipt (`RETURN`) with the outcome. Writing directly into the tables would be like walking into the vault and moving the money by hand.

### RFC: calling functions in another system

An FM with the **"Remote-Enabled"** attribute can be called from another SAP or external system. Destinations are configured in **SM59**.

```abap
CALL FUNCTION 'Z_MY_REMOTE_FM'
  DESTINATION 'ERP_PRD_100'
  EXPORTING  iv_param = lv_val
  IMPORTING  ev_result = lv_res
  EXCEPTIONS system_failure        = 1 MESSAGE lv_msg
             communication_failure = 2 MESSAGE lv_msg
             OTHERS                = 3.
```

Variants: synchronous (waits for the answer), `STARTING NEW TASK` (asynchronous, in parallel), `IN BACKGROUND TASK` (transactional tRFC/qRFC, run at `COMMIT`). We'll look at interfaces in depth on day 13.

In RFC modules, parameters must be passed **by value** and typed with DDIC types.

## Hour 4 – Parameters, visibility, and memory

### By value or by reference

| Mode                | What happens                                                                          | Syntax                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| By reference        | the module works on the original: changes are visible outside right away              | default for `FORM USING` and for method `IMPORTING` parameters (which are read-only, though) |
| By value            | the module works on a copy                                                            | `VALUE(param)`                                                                               |
| By value and result | works on a copy, which is copied back to the original only at the end, without errors | `CHANGING VALUE(param)`                                                                      |

> [!TIP]
> By reference is like lending a friend your original notebook: if they write in it, you find it written. By value is like giving them a photocopy: whatever they do on the photocopy doesn't touch your notebook.

Passing by reference is faster with large data (tables); passing by value is safer.

### Visibility scopes

- **Program globals**: declared at the top of the report (or in the TOP include), visible everywhere in the program. Keep them to a minimum.
- **Locals**: declared in a `FORM`, FM, or method; they exist only there.
- **Function group globals**: visible to all the FMs of the same group; they keep their value between calls.
- **Class attributes**: day 10.

> [!WARNING]
> Inline `DATA(...)` declarations in a report outside `FORM`s/methods are **global**, even when written inside an `IF` or a `LOOP`. ABAP has no "block" variables like other languages.

### SAP memory and ABAP memory

They are used to pass data between programs or transactions.

| Memory                                | Lifetime                                                          | Statements                                                              | Typical use                                                       |
| ------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| SAP memory (user-global)              | the whole user session, across all windows                        | `SET PARAMETER` / `GET PARAMETER ID`                                    | propose values in fields (for example the last order viewed)      |
| ABAP memory                           | within the same call chain (a program that calls another program) | `EXPORT ... TO MEMORY ID` / `IMPORT ... FROM MEMORY ID` / `FREE MEMORY` | pass data to a program called with `SUBMIT` or `CALL TRANSACTION` |
| Shared memory (shared objects/buffer) | across different users, on the server                             | `EXPORT TO SHARED BUFFER`, shared objects classes                       | cache of common data                                              |
| INDX database tables                  | permanent                                                         | `EXPORT ... TO DATABASE`                                                | store complex data                                                |

```abap
* SAP memory: the parameter IDs (for example AUN = sales order) are in table TPARA
SET PARAMETER ID 'AUN' FIELD lv_vbeln.
CALL TRANSACTION 'VA03' AND SKIP FIRST SCREEN.   " opens the order directly

* ABAP memory
EXPORT lt_data = lt_flights TO MEMORY ID 'ZFLIGHTS'.
SUBMIT zchild_program AND RETURN.
" in the child program:
IMPORT lt_data = lt_flights FROM MEMORY ID 'ZFLIGHTS'.
```

### Calling other programs and transactions

```abap
SUBMIT zother_report WITH p_date = sy-datum AND RETURN.  " runs a report, then comes back
SUBMIT zother_report VIA SELECTION-SCREEN AND RETURN.    " shows its screen
CALL TRANSACTION 'SE16N'.                                " opens a transaction and comes back
LEAVE TO TRANSACTION 'SE38'.                             " goes to the transaction and doesn't come back
```

Before `CALL TRANSACTION`, it's a good idea to check the user's authorization (`CALL TRANSACTION ... WITH AUTHORITY-CHECK`, day 8).

## Exercises

> [!IMPORTANT]
>
> 1. Write a report with a subroutine `calculate_area` that receives width and height and returns the area of a rectangle with `CHANGING`.
> 2. Show the difference between `USING` by reference and `USING VALUE`: change the parameter inside the `FORM` and print the original variable after the call.
> 3. Create the function group `ZFG_COURSE` and the FM `Z_CALCULATE_VAT` with the exception `NEGATIVE_AMOUNT`. Test it in SE37 and call it from a report, handling the exception.
> 4. Create the FM `Z_GET_AIRLINE_FLIGHTS` that receives an airline code and returns the table of its flights (use a DDIC table type as the `EXPORTING` parameter). If the airline doesn't exist, raise an exception.
> 5. Call `POPUP_TO_CONFIRM` and print the user's answer.
> 6. Explore transaction BAPI: find the BAPI that reads a user's details and call it for your own user, printing first and last name (`BAPI_USER_GET_DETAIL`, parameter `ADDRESS`).

## Quiz

1. What is the difference between an include and a function module?
2. Why, when calling an FM, do you write `EXPORTING` for the parameters the FM defines as `IMPORTING`?
3. What happens if an FM runs `RAISE` and the caller didn't list `EXCEPTIONS`?
4. Do BAPIs `COMMIT` on their own? Where do you read the errors?
5. What does passing a parameter by value mean?
6. What is the difference between SAP memory and ABAP memory?

## Solutions

```abap
REPORT zes07_solutions.

START-OF-SELECTION.
* Ex. 1
  DATA lv_area TYPE p LENGTH 8 DECIMALS 2.
  PERFORM calculate_area USING '3.5' 2 CHANGING lv_area.
  WRITE / |Area: { lv_area }|.

* Ex. 2
  DATA(lv_x) = 10.
  PERFORM by_reference USING lv_x.
  WRITE / |After by reference: { lv_x }|.   " 99
  lv_x = 10.
  PERFORM by_value USING lv_x.
  WRITE / |After by value: { lv_x }|.       " 10

* Ex. 5
  DATA lv_answer TYPE c LENGTH 1.
  CALL FUNCTION 'POPUP_TO_CONFIRM'
    EXPORTING
      titlebar      = 'Confirm'
      text_question = 'Do you want to continue?'
    IMPORTING
      answer        = lv_answer
    EXCEPTIONS
      OTHERS        = 1.
  WRITE / |Answer: { lv_answer }|.          " 1 = Yes, 2 = No, A = Cancel

* Ex. 6
  DATA ls_address TYPE bapiaddr3.
  DATA lt_ret     TYPE STANDARD TABLE OF bapiret2.
  CALL FUNCTION 'BAPI_USER_GET_DETAIL'
    EXPORTING username = sy-uname
    IMPORTING address  = ls_address
    TABLES    return   = lt_ret.
  WRITE / |{ ls_address-firstname } { ls_address-lastname }|.

FORM calculate_area USING iv_width TYPE p iv_height TYPE i CHANGING cv_area TYPE p.
  cv_area = iv_width * iv_height.
ENDFORM.

FORM by_reference USING cv_val TYPE i.
  cv_val = 99.
ENDFORM.

FORM by_value USING VALUE(iv_val) TYPE i.
  iv_val = 99.
ENDFORM.
```

Quiz:

1. An include is just a piece of text pasted into a program; an FM is a global block with an interface that any program can run.
2. Because the point of view is the caller's: the caller exports, the module imports.
3. The program dumps.
4. No: you need `BAPI_TRANSACTION_COMMIT`; errors are in the `RETURN` table (`BAPIRET2`) with `TYPE` E or A.
5. The module receives a copy: changes don't touch the original.
6. SAP memory lasts the whole user session (`SET`/`GET PARAMETER`); ABAP memory lasts only within the chain of called programs (`EXPORT`/`IMPORT MEMORY ID`).

> [!NOTE]
> Today you learned: includes, macros, subroutines, function modules with parameters and exceptions, BAPIs with `BAPIRET2` and `COMMIT`, RFC, passing by value/reference, visibility scopes, SAP/ABAP memory, `SUBMIT`, and `CALL TRANSACTION`. Tomorrow: complete reports with selection screens, messages, and files.
