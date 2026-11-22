---
title: Database tables
description: Create a transparent table with fields, keys, and technical settings.
---

_Basic level_

A **transparent table** is a Dictionary table that matches exactly one table in the database, with the same name and the same fields. When you activate it, the system creates the table in the database; from then on, your programs read and write it with ABAP SQL.

Here you build the table `ZFLIGHT_STATUS`, which stores a status for each flight of `SFLIGHT`. It uses the domain from [domains](./0044-domains.md) and the data element from [data elements](./0045-data-elements.md).

## Fields and key

| Field        | Key | Data element       | Meaning                     |
| ------------ | --- | ------------------ | --------------------------- |
| `CLIENT`     | yes | `MANDT`            | the client                  |
| `CARRID`     | yes | `S_CARR_ID`        | airline                     |
| `CONNID`     | yes | `S_CONN_ID`        | connection number           |
| `FLDATE`     | yes | `S_DATE`           | flight date                 |
| `STATUS`     |     | `ZE_FLIGHT_STATUS` | status of the flight        |
| `CHANGED_BY` |     | `SYUNAME`          | user who changed the status |
| `CHANGED_ON` |     | `SYDATUM`          | date of the change          |

The fields marked as key form the **primary key**: no two rows can have the same values in all of them. Rules for the key:

- Key fields come first, one after the other.
- A **client-dependent** table has a client field of type `MANDT` (or `CLNT`) as the first key field. Most tables are client-dependent: each client sees only its own rows, and ABAP SQL adds the client condition for you.
- Without a client field, the table is **client-independent**: the same rows in every client. That's rare, mostly for technical data.

> [!TIP]
> The primary key is like the seat number on a flight: carrier, flight number, date, and seat together point to exactly one seat. Two passengers can't hold the same combination.

## Create it in ADT

In ADT, choose **New** > **Other ABAP Repository Object** > **Database Table**, enter the name and a description, and write the definition as source code:

```abap
@EndUserText.label : 'Status of a flight'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zflight_status {

  key client : mandt not null;
  key carrid : s_carr_id not null;
  key connid : s_conn_id not null;
  key fldate : s_date not null;
  status     : ze_flight_status;
  changed_by : syuname;
  changed_on : sydatum;

}
```

In `SE11` you enter the same information in tabs: **Delivery and Maintenance**, **Fields**, and **Technical Settings**. Both editors create the same object.

## Table attributes

The annotations at the top match the attributes you find in `SE11`:

| Attribute            | Common values                                                                           |
| -------------------- | --------------------------------------------------------------------------------------- |
| delivery class       | `A` application data (master and transaction data), `C` customizing, `L` temporary data |
| data maintenance     | whether users may display and change the rows with `SE16N` or a maintenance view        |
| enhancement category | whether the table can be extended later with append structures                          |

Amount and quantity fields need a **reference field**. A field of type `CURR` must point to a `CUKY` field with the currency, and a `QUAN` field to a `UNIT` field. In `SFLIGHT`, `PRICE` refers to `CURRENCY`, because 100 means very different things in EUR and in JPY. In ADT you write the reference as an annotation on the amount field. For a table `ZFLIGHT_PRICE` with a price and its currency:

```abap
  @Semantics.amount.currencyCode : 'zflight_price.currency'
  price    : s_price;
  currency : s_currcode;
```

## Technical settings

The **technical settings** tell the database how to handle the table. In `SE11` they're behind the **Technical Settings** button; in ADT they have their own editor, opened from the table.

| Setting       | Meaning                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| data class    | the kind of data: `APPL0` master data, `APPL1` transaction data, `APPL2` customizing                        |
| size category | the expected number of rows, from 0 (few) upward                                                            |
| buffering     | keep a copy of the table in the application server's memory, for small tables read often and changed rarely |
| log changes   | record every change to the rows in the table `DBTABLOG`                                                     |

For `ZFLIGHT_STATUS`, choose data class `APPL1`, size category 0, and buffering not allowed: the status changes often.

After saving, **activate** the table. The system creates it in the database, and you can look at its content with `SE16N`. Reading and writing rows from ABAP is covered in [reading data with SELECT](./0052-select-basics.md) and [writing data](./0059-writing-to-the-database.md).

> [!CAUTION]
> Adding a field to a table is safe. Changing the type or length of a field, removing a field, or changing the key of a table that already has data needs a **conversion** in the database (`SE14`), which can be slow on big tables and can lose data if values don't fit the new type. Deleting a table deletes all its rows. Do such changes only after checking the where-used list and the data.

## Exercise

> [!IMPORTANT]
>
> 1. Create and activate the table `ZFLIGHT_STATUS` as described, with delivery class `A` and data class `APPL1`.
> 2. Open it in `SE16N` and check that it exists and is empty.
> 3. Open `SFLIGHT` in `SE11` or ADT and find the reference field of `PAYMENTSUM`.

### Solution

1. Use the ADT source above, or enter the same fields in `SE11`, then set the technical settings and activate.
2. `SE16N` with table `ZFLIGHT_STATUS` shows the fields and "No values found".
3. `PAYMENTSUM` is a `CURR` field that refers to `SFLIGHT-CURRENCY`.

> [!NOTE]
>
> - A transparent table is a Dictionary table with exactly one matching table in the database.
> - Key fields come first; client-dependent tables start with a `MANDT` field.
> - Delivery class, data maintenance, and enhancement category describe how the table is used and extended.
> - `CURR` and `QUAN` fields need a reference field with the currency or the unit.
> - Technical settings (data class, size category, buffering, logging) are required before activation; changing a table with data can need a conversion.
