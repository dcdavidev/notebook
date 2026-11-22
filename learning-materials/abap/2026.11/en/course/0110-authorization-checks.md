---
title: Authorization checks
description: Authorization objects, AUTHORITY-CHECK, and roles.
---

_Intermediate level_

In an SAP system, logging on doesn't mean you can do everything. Every user has **authorizations** that say which data they may display, change, or delete: a clerk in Rome may change the bookings of Alitalia but only display those of Lufthansa. Standard transactions check these authorizations everywhere.

Your own programs must do the same. ABAP SQL doesn't check authorizations: a `SELECT` reads every row, whoever runs it. The check is your job, with the statement `AUTHORITY-CHECK`.

## Authorization objects

An **authorization object** describes a type of protected action. It has up to 10 **fields**, usually one or more organizational fields and the field `ACTVT` (activity). You find the objects in transaction `SU21`, grouped into object classes.

The flight model has its own object, `S_CARRID`:

| Field    | Meaning  | Example values                                      |
| -------- | -------- | --------------------------------------------------- |
| `CARRID` | airline  | `LH`, `AZ`, `*`                                     |
| `ACTVT`  | activity | `01` create, `02` change, `03` display, `06` delete |

An **authorization** is an instance of the object with values for its fields, for example "`CARRID` = `AZ`, `ACTVT` = `01`, `02`, `03`". Authorizations are collected in **roles**, maintained with transaction `PFCG`, and roles are assigned to users in `SU01`. You write the check; the security team decides who gets which role.

> [!TIP]
> An authorization object is the kind of key, like "office door key". An authorization is a specific key cut for some doors. The role is the key ring handed to an employee, and `AUTHORITY-CHECK` is the lock on the door.

## AUTHORITY-CHECK

`AUTHORITY-CHECK` asks: does the current user have an authorization for this object with these values?

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  AUTHORITY-CHECK OBJECT 'S_CARRID'
    ID 'CARRID' FIELD p_carrid
    ID 'ACTVT'  FIELD '03'.                " display

  IF sy-subrc <> 0.
    MESSAGE |You are not authorized to display airline { p_carrid }| TYPE 'E'.
  ENDIF.

  SELECT FROM sflight
    FIELDS carrid, connid, fldate, price
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).
```

The result is in `sy-subrc`:

| `sy-subrc` | Meaning                                                                |
| ---------- | ---------------------------------------------------------------------- |
| 0          | authorized                                                             |
| 4          | the user has the object, but not with these values                     |
| 12         | the user has no authorization at all for this object                   |
| other      | the check itself is wrong, for example a field name that doesn't exist |

Name every field of the object. For a field you don't want to check, write `ID 'field' DUMMY`: it means "any value". Leaving a field out isn't allowed.

> [!WARNING]
> Always check `sy-subrc` right after `AUTHORITY-CHECK`. A check whose result is ignored protects nothing, and it is one of the findings the security checks of the [ATC](./0107-code-quality.md) report.

## Checking every row

When a report reads data for many organizational values, check each value, not only the input. Remove the rows the user may not see:

```abap
SELECT FROM sflight
  FIELDS carrid, connid, fldate, price
  INTO TABLE @DATA(lt_flights).

DATA lt_denied TYPE RANGE OF s_carr_id.

LOOP AT lt_flights INTO DATA(ls_flight)
     GROUP BY ls_flight-carrid INTO DATA(lv_carrid).
  AUTHORITY-CHECK OBJECT 'S_CARRID'
    ID 'CARRID' FIELD lv_carrid
    ID 'ACTVT'  FIELD '03'.
  IF sy-subrc <> 0.
    lt_denied = VALUE #( BASE lt_denied ( sign = 'I' option = 'EQ' low = lv_carrid ) ).
  ENDIF.
ENDLOOP.

IF lt_denied IS NOT INITIAL.                 " an empty range would match every row
  DELETE lt_flights WHERE carrid IN lt_denied.
ENDIF.
```

The [grouping](./0095-grouping-internal-tables.md) runs the check once per airline instead of once per row. In CDS views, the same row-level protection is declared with [access control](./0136-cds-access-control.md) and applied automatically.

## Your own objects and other checks

For your own data, create an object in `SU21`, for example `ZFLIGHT` with the fields `CARRID` and `ACTVT`, and check it like a standard one. Some other checks you'll use often:

- **Transactions**: starting a transaction checks the object `S_TCODE`. If your program calls another transaction, use `CALL TRANSACTION 'ZFLIGHT' WITH AUTHORITY-CHECK`, or the function module `AUTHORITY_CHECK_TCODE`.
- **Reports**: assign an authorization group to the program in its attributes; the object `S_PROGRAM` protects it.
- **Tables in SM30**: the object `S_TABU_DIS` checks the authorization group of the table.

To find a missing authorization, the user runs `SU53` right after the error: it shows the last failed check. For a full picture, record all checks of a session with the authorization trace (`STAUTHTRACE`).

## Exercise

> [!IMPORTANT]
>
> 1. Write a report with a parameter for the airline that checks `S_CARRID` for display before reading `SFLIGHT`.
> 2. Add a checkbox "Change mode" that checks activity `02` instead of `03`.
> 3. Run it with an airline you aren't authorized for, then check the failed authorization in `SU53`.

### Solution

```abap
REPORT zflight_auth.

PARAMETERS: p_carrid TYPE s_carr_id DEFAULT 'LH',
            p_change AS CHECKBOX.

START-OF-SELECTION.
  DATA(lv_actvt) = COND activ_auth( WHEN p_change = abap_true THEN '02' ELSE '03' ).

  AUTHORITY-CHECK OBJECT 'S_CARRID'
    ID 'CARRID' FIELD p_carrid
    ID 'ACTVT'  FIELD lv_actvt.
  IF sy-subrc <> 0.
    MESSAGE |No authorization for airline { p_carrid }, activity { lv_actvt }| TYPE 'E'.
  ENDIF.

  SELECT FROM sflight FIELDS * WHERE carrid = @p_carrid INTO TABLE @DATA(lt_flights).
  cl_demo_output=>display( lt_flights ).
```

> [!NOTE]
>
> - ABAP SQL doesn't check authorizations: your program must call `AUTHORITY-CHECK`.
> - An authorization object (`SU21`) has fields such as `CARRID` and `ACTVT`; roles (`PFCG`) give users authorizations for it.
> - Name every field of the object, with `DUMMY` for the ones you don't check, and always test `sy-subrc`.
> - Check every organizational value you read, not only the user's input.
> - `SU53` shows the last failed check; `STAUTHTRACE` records all of them.
