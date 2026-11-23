---
title: Foreign keys and check tables
description: Link tables and check input values against them.
level: basic
---

A **foreign key** links a field of one table to the primary key of another table, the **check table**. It says: "a value in this field is valid only if it exists in the check table". The Dictionary uses foreign keys to check user input on screens, to offer F4 help, and to describe how tables relate to each other.

In the flight model, every airline code in `SPFLI` and `SFLIGHT` must exist in `SCARR`, and every flight in `SFLIGHT` must belong to a connection in `SPFLI`. Those rules are foreign keys.

## The parts of a foreign key

| Term              | Meaning                                                                        | Example                                                |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| foreign key table | the table that holds the field to check                                        | `SFLIGHT`                                              |
| check field       | the field whose values are checked                                             | `SFLIGHT-CARRID`                                       |
| check table       | the table that holds the valid values                                          | `SCARR`                                                |
| field assignment  | which field of the foreign key table matches each key field of the check table | `MANDT` = `SFLIGHT-MANDT`, `CARRID` = `SFLIGHT-CARRID` |

Every key field of the check table must be assigned a field of the foreign key table (or, more rarely, a constant). For `SFLIGHT-CONNID`, the check table is `SPFLI`, whose key is `MANDT`, `CARRID`, `CONNID`: all three fields are assigned, so a connection number is valid only for its airline.

> [!TIP]
> A foreign key is like the guest list at a party entrance. The check field is the name you give at the door, the check table is the list. If your name isn't on the list, you don't get in.

## Define a foreign key

In ADT, the foreign key is part of the table source. Here `ZFLIGHT_STATUS` from [database tables](./0046-database-tables.md) gets foreign keys to `SCARR` and `SFLIGHT`:

```abap
define table zflight_status {

  key client : mandt not null;
  @AbapCatalog.foreignKey.keyType : #KEY
  @AbapCatalog.foreignKey.screenCheck : true
  key carrid : s_carr_id not null
    with foreign key [0..*,1] scarr
      where mandt = zflight_status.client
        and carrid = zflight_status.carrid;
  @AbapCatalog.foreignKey.keyType : #KEY
  @AbapCatalog.foreignKey.screenCheck : true
  key connid : s_conn_id not null
    with foreign key [0..*,1] sflight
      where mandt = zflight_status.client
        and carrid = zflight_status.carrid
        and connid = zflight_status.connid
        and fldate = zflight_status.fldate;
  key fldate : s_date not null;
  status     : ze_flight_status;
  changed_by : syuname;
  changed_on : sydatum;

}
```

The annotations at the top of the table are left out here; they stay as before.

In `SE11`, select the field in the **Fields** tab and press the **Foreign Keys** button (the key icon). If the domain of the field has a **value table**, the system proposes it as the check table and fills the field assignment for you. That's why `S_CARR_ID` has `SCARR` as its value table: see [domains](./0044-domains.md).

## Cardinality and foreign key field type

Two more attributes describe the relationship:

- **Cardinality** (`[0..*,1]` in ADT, `1:CN` in `SE11`): for each row of the check table there can be any number of rows in the foreign key table, and each row of the foreign key table points to exactly one row of the check table.
- **Foreign key field type**: whether the check field is a key field of its table (`#KEY`), a non-key field (`#NON_KEY`), or the key of a text table (`#TEXT_KEY`).

A **text table** is a special case: it holds language-dependent texts for another table, with the same key plus a language field. For example, `T005T` holds the country names for the countries in `T005`. A text table is linked to its main table with a foreign key of type "key fields of a text table", and F4 help then shows the texts in the logon language.

## Where the check happens

The check runs **on screens**: classic Dynpro screens, selection screens with `VALUE CHECK`, and table maintenance with `SM30`. If the user enters an airline that isn't in `SCARR`, the screen shows an error and F4 offers the valid values.

> [!WARNING]
> The database doesn't enforce Dictionary foreign keys. An ABAP SQL `INSERT` or `UPDATE` writes any value, valid or not. When your program writes data that didn't come from a checked screen, check it yourself first.

A simple check in code uses a `SELECT SINGLE` on the check table (you'll learn `SELECT` in [reading data with SELECT](./0052-select-basics.md)):

```abap
DATA lv_carrid TYPE s_carr_id VALUE 'XX'.

SELECT SINGLE @abap_true
  FROM scarr
  WHERE carrid = @lv_carrid
  INTO @DATA(lv_exists).

IF lv_exists = abap_false.
  WRITE / |Airline { lv_carrid } does not exist|.
ENDIF.
```

| Tool                      | When to use it                                                          |
| ------------------------- | ----------------------------------------------------------------------- |
| fixed values of a domain  | a few stable values decided by developers, such as a status             |
| check table (foreign key) | values that users maintain and that grow, such as airlines or customers |

## Exercise

> [!IMPORTANT]
>
> 1. Add a foreign key from `ZFLIGHT_STATUS-CARRID` to `SCARR` and activate the table.
> 2. Open `SFLIGHT` and look at the foreign key of the field `CONNID`: which check table and which field assignment does it use?
> 3. Write a report with `PARAMETERS p_carrid TYPE zflight_status-carrid VALUE CHECK`, run it, and enter an airline code that doesn't exist.

### Solution

1. Use the ADT source above for `carrid`, or the **Foreign Keys** button in `SE11`, accept the proposal with `SCARR`, and activate.
2. `SFLIGHT-CONNID` has the check table `SPFLI`, with `MANDT` = `SFLIGHT-MANDT`, `CARRID` = `SFLIGHT-CARRID`, and `CONNID` = `SFLIGHT-CONNID`.
3. The selection screen shows an error message for an airline that isn't in `SCARR`, and F4 lists the airlines that are.

> [!NOTE]
>
> - A foreign key links a check field to the primary key of a check table.
> - Every key field of the check table gets a field (or a constant) of the foreign key table.
> - The value table of a domain is the proposed check table.
> - Cardinality and foreign key field type describe the relationship; text tables hold translated texts.
> - The check runs on screens, not in the database: check values in code before writing them.
