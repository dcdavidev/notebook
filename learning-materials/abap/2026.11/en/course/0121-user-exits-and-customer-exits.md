---
title: User exits and customer exits
description: The oldest extension techniques, still found in every system.
level: pro
---

Long before BAdIs, SAP left empty places in its programs where customers could add code. There are two kinds: **user exits**, empty subroutines in SAP includes, mostly in sales and distribution; and **customer exits**, calls to function modules whose body is a customer include. New code should use [BAdIs](./0122-badis.md) when one exists, but these exits are still in every ECC and S/4HANA system, and many are still the only hook in a given place.

For the big picture, see [extending standard SAP](./0120-extending-standard-sap.md).

## User exits

A **user exit** is a `FORM` routine with a name that starts with `USEREXIT_`, placed by SAP in an include that SAP delivers empty and never overwrites. The best known are in the sales order program `SAPMV45A`:

| Include    | Example routines                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| `MV45AFZZ` | `USEREXIT_SAVE_DOCUMENT_PREPARE`, `USEREXIT_SAVE_DOCUMENT`, `USEREXIT_MOVE_FIELD_TO_VBAK` |
| `MV45AFZB` | `USEREXIT_CHECK_VBAP`, `USEREXIT_FILL_VBAP_FROM_HVBAP`                                    |
| `RV60AFZZ` | billing document exits (program `SAPLV60A`)                                               |

The include belongs to the SAP namespace, so the first change asks for an **object key**, like a modification. After that, SAP doesn't overwrite your code at upgrades.

```abap
*---------------------------------------------------------------------*
*  Include MV45AFZZ
*---------------------------------------------------------------------*
FORM userexit_save_document_prepare.
  " Customer order type ZOR needs a customer reference
  IF vbak-auart = 'ZOR' AND vbak-bstnk IS INITIAL.
    MESSAGE 'Enter the customer reference before saving' TYPE 'E'.
  ENDIF.
ENDFORM.
```

User exits have no interface: they see the **global data** of the main program (`VBAK`, `VBAP`, `XVBAP`, and so on). That's powerful and dangerous: you can change any field, including ones SAP doesn't expect you to touch.

> [!WARNING]
> Read the SAP documentation of each user exit before you use it. Some are called many times per transaction (`USEREXIT_MOVE_FIELD_TO_VBAP` runs for every item and on every screen change), so slow code there slows down every user. `USEREXIT_SAVE_DOCUMENT` runs during the save: an error message there leaves the user stuck. Do checks in `USEREXIT_SAVE_DOCUMENT_PREPARE` instead.

## Customer exits

A **customer exit** is a planned enhancement with a clear interface. SAP groups exits into **enhancements** (transaction `SMOD`), each with one or more **components**:

- **function exits**: in the SAP program, `CALL CUSTOMER-FUNCTION '001'` calls the function module `EXIT_<program>_001`, whose body is a single `INCLUDE ZX...` statement. You write the code in that include;
- **screen exits**: a subscreen area where you put your own subscreen;
- **menu exits**: menu entries with function codes starting with `+`.

In the standard program the call looks like this, with an interface defined by SAP:

```abap
CALL CUSTOMER-FUNCTION '001'
  EXPORTING
    is_header = ls_header
  IMPORTING
    es_header = ls_header.
```

The exit function module is part of an SAP function group (`XUSR`, `XM06`, ...), and its source is:

```abap
FUNCTION exit_saplsusf_001.
*"  (interface defined by SAP)
  INCLUDE zxusru01.
ENDFUNCTION.
```

The code in the `Z` include runs **only** if the enhancement is assigned to an **active project** in `CMOD`.

> [!TIP]
> A customer exit is a wall socket with a plastic cover. SAP installed the wiring (the call and the interface). You plug in your device (the include) and flip the switch in the fuse box (activate the `CMOD` project). Without the switch, the socket stays dead even if something is plugged in.

## Implement a customer exit with CMOD

As an example, enhancement `SUSR0001` is called after every dialog logon (function module `EXIT_SAPLSUSF_001`, include `ZXUSRU01`).

1. `CMOD` > create project `ZLOGON`, with a short text.
2. **Enhancement assignments**: add `SUSR0001`.
3. **Components**: double-click `EXIT_SAPLSUSF_001`, then double-click the include `ZXUSRU01`. Confirm that you want to create it, and assign it to your package and transport request.
4. Write the code, and activate the include.
5. Back in `CMOD`, **Activate project**.

```abap
*---------------------------------------------------------------------*
*  Include ZXUSRU01   (EXIT_SAPLSUSF_001, enhancement SUSR0001)
*---------------------------------------------------------------------*
IF sy-sysid = 'PRD' AND sy-uname CP 'TEST*'.
  MESSAGE 'Test users should not work in production' TYPE 'I'.
ENDIF.
```

Inside the include you can use only the parameters of the exit function module and the global data of its function group. To see the interface, open `EXIT_SAPLSUSF_001` in `SE37`.

> [!CAUTION]
> One enhancement can be assigned to only one `CMOD` project. If a colleague's project already uses it, you must add your code to the same include, so coordinate. And an error in a logon exit can stop all users from logging on: test exits like this in development, with a second session open.

## Find exits for a transaction

- Search the main program for `CALL CUSTOMER-FUNCTION` (customer exits) and `PERFORM userexit` (user exits).
- In `SE80` or `SE84`, look under **Enhancements > Customer Exits** and filter by package. The package of the transaction (shown in `SE93`) is a good start.
- Table `MODSAP` lists the components of each enhancement, and `MODACT` shows which project contains which enhancement.
- `SPRO` often documents the exits under **System Modifications** or **Business Add-Ins** of each application area.

## Exercise

> [!IMPORTANT]
>
> 1. In `SMOD`, display enhancement `SUSR0001` and its component.
> 2. Create the `CMOD` project `ZLOGON`, implement `ZXUSRU01` with an information message for your own user only, and activate the project.
> 3. Log on again and check that the message appears. Then deactivate the project.

### Solution

```abap
* Include ZXUSRU01
IF sy-uname = 'DEVELOPER01'.          " your user
  MESSAGE 'Customer exit SUSR0001 is active' TYPE 'I'.
ENDIF.
```

The message appears right after logon. When you deactivate the project in `CMOD`, the include stays, but the exit isn't called anymore.

> [!NOTE]
>
> - User exits are `FORM USEREXIT_...` routines in SAP includes such as `MV45AFZZ`; they see all global data of the program.
> - Customer exits are function modules `EXIT_<program>_<nnn>` called with `CALL CUSTOMER-FUNCTION`; you write the code in a `ZX...` include.
> - `SMOD` shows enhancements and their components; `CMOD` projects assign and activate them.
> - An enhancement belongs to only one project, and its code runs only while the project is active.
> - Check how often an exit runs, and never commit or block the user inside it.
