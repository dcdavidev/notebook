---
title: Change documents
description: Record who changed what and when, with SCDO.
---

_Intermediate level_

Auditors, key users, and support teams keep asking the same question: who changed this price, and when? SAP answers it with **change documents**: a log of field changes, with old value, new value, user, date, time, and transaction. Standard objects such as materials, customers, and sales orders write them already. With transaction `SCDO` you can do the same for your own tables.

## How change documents are stored

Every change creates one header and one item per changed field:

| Table   | Contents                                                                      |
| ------- | ----------------------------------------------------------------------------- |
| `CDHDR` | header: object class, object ID, change number, user, date, time, transaction |
| `CDPOS` | items: table name, table key, field name, change type, old value, new value   |

- The **object class** groups the tables that belong to one business object (for example `MATERIAL`).
- The **object ID** identifies one instance, for example a material number, or the key of a flight.
- The **change indicator** is `I` (insert), `U` (update), `D` (delete), or `E` (single-field delete).

Only fields whose **data element** has the **Change document** flag set (in `SE11`, tab **Further Characteristics**) are logged. See [data elements](./0045-data-elements.en.md).

> [!TIP]
> A change document is the "track changes" feature of a word processor applied to a database table: the current text stays clean, but next to it there's a record of every edit, with the author's name and the time.

## Create a change document object

Suppose you have a table `ZFLIGHT_PRICE` with key `CARRID`, `CONNID`, `FLDATE` and a field `PRICE` whose data element has the change document flag.

1. Open `SCDO` and create the object class `ZFLIGHTPRC`.
2. Add the table `ZFLIGHT_PRICE`. Leave **Multiple case** empty for a single-row table (you pass one old and one new structure); set it if you'll pass internal tables of rows.
3. Choose **Generate**: give a function group (for example `ZFLIGHTPRC_CD`) and a package.

The generator creates:

- the update function module `ZFLIGHTPRC_WRITE_DOCUMENT`;
- includes with the data declarations and with a sample call (the generator proposes names such as `FZFLIGHTPRCCDT` and `FZFLIGHTPRCCDC`).

Open the generated function module to see the exact parameter names: they follow the pattern `N_<table>` (new values), `O_<table>` (old values), and `UPD_<table>` (change indicator).

On recent SAP S/4HANA releases, `SCDO` can also generate a class with a `WRITE` method instead of the function module. The idea and the tables stay the same.

## Write a change document

Read the old row before you change it, write the new row, then call the generated module in the same LUW. It's an [update function module](./0113-update-task.en.md), so you call it `IN UPDATE TASK`:

```abap
PARAMETERS: p_carrid TYPE s_carr_id DEFAULT 'LH',
            p_connid TYPE s_conn_id DEFAULT '0400',
            p_fldate TYPE s_date    DEFAULT '20261215',
            p_price  TYPE s_price   DEFAULT '799.00'.

START-OF-SELECTION.
  SELECT SINGLE * FROM zflight_price
    WHERE carrid = @p_carrid AND connid = @p_connid AND fldate = @p_fldate
    INTO @DATA(ls_old).
  IF sy-subrc <> 0.
    WRITE / 'Flight price not found'.
    RETURN.
  ENDIF.

  DATA(ls_new) = ls_old.
  ls_new-price = p_price.

  UPDATE zflight_price FROM @ls_new.

  CALL FUNCTION 'ZFLIGHTPRC_WRITE_DOCUMENT' IN UPDATE TASK
    EXPORTING
      objectid                = CONV cdobjectv( |{ ls_new-carrid }{ ls_new-connid }{ ls_new-fldate }| )
      tcode                   = sy-tcode
      utime                   = sy-uzeit
      udate                   = sy-datum
      username                = sy-uname
      object_change_indicator = 'U'
      n_zflight_price         = ls_new
      o_zflight_price         = ls_old
      upd_zflight_price       = 'U'.

  COMMIT WORK.
```

The module compares the old and the new structure and writes a `CDPOS` row only for the logged fields that really changed.

> [!WARNING]
> The change document is only as good as the old values you pass. If you read the "old" row after you changed it, or forget to fill it, you'll log a wrong old value or nothing at all. Read it once, before the change, and keep it untouched.

## Read change documents

You can display change documents with report `RSSCD100`, or read them with the function module `CHANGEDOCUMENT_READ`. In SAP S/4HANA, `CDPOS` is a transparent table, so you can also join it:

```abap
DATA(lv_objectid) = CONV cdobjectv( |{ p_carrid }{ p_connid }{ p_fldate }| ).

SELECT h~udate, h~utime, h~username, p~fname, p~chngind, p~value_old, p~value_new
  FROM cdhdr AS h
  INNER JOIN cdpos AS p
    ON  p~objectclas = h~objectclas
    AND p~objectid   = h~objectid
    AND p~changenr   = h~changenr
  WHERE h~objectclas = 'ZFLIGHTPRC'
    AND h~objectid   = @lv_objectid
  ORDER BY h~udate DESCENDING, h~utime DESCENDING
  INTO TABLE @DATA(lt_changes).

cl_demo_output=>display( lt_changes ).
```

In SAP ECC, `CDPOS` is a cluster table and can't be joined: read `CDHDR` first, then `CDPOS` with the keys you found, or use `CHANGEDOCUMENT_READ`.

> [!CAUTION]
> Change documents grow fast on busy tables. Log only the fields that matter for audits, and agree on an archiving plan (archiving object `CHANGEDOCU`) with your basis team before the tables reach hundreds of millions of rows.

## Exercise

> [!IMPORTANT]
>
> 1. Create the table `ZFLIGHT_PRICE` and set the change document flag on the data element of `PRICE`.
> 2. Create and generate the change document object `ZFLIGHTPRC` in `SCDO`.
> 3. Change a price twice with the report above, then list the changes with the `SELECT` on `CDHDR` and `CDPOS`.

### Solution

After the two runs, the `SELECT` returns two rows with `FNAME = 'PRICE'` and `CHNGIND = 'U'`: the newest one has the second price as `VALUE_NEW` and the first price as `VALUE_OLD`. If a run doesn't change the price (same value), the module writes no item for it.

> [!NOTE]
>
> - Change documents log old value, new value, user, date, time, and transaction in `CDHDR` and `CDPOS`.
> - Only fields whose data element has the change document flag are logged.
> - `SCDO` generates an update function module `<object>_WRITE_DOCUMENT` for your tables.
> - Pass the old and the new values, and call the module `IN UPDATE TASK` in the same LUW as the change.
> - Read them with `RSSCD100`, `CHANGEDOCUMENT_READ`, or (in S/4HANA) a join on `CDHDR` and `CDPOS`.
