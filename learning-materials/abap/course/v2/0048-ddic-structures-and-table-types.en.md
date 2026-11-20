---
title: Structures and table types in the Dictionary
description: Global types that every program can reuse.
---

_Basic level_

A **Dictionary structure** is a group of fields, like the [structures](./0031-structures.en.md) you declare with `TYPES BEGIN OF`, but defined once in the ABAP Dictionary. A **table type** is the Dictionary version of an internal table type: it fixes the row type, the [table category](./0034-table-categories.en.md), and the [key](./0035-table-keys.en.md).

Neither of them holds data or exists in the database. They're **global types**: any program, class, or function module can use them, which matters most for the parameters of global classes and function modules.

## Dictionary structures

A structure has components, each typed with a data element or a predefined type, just like the fields of a table. In ADT, choose **New** > **Other ABAP Repository Object** > **Structure**:

```abap
@EndUserText.label : 'Flight with airline name'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
define structure zs_flight_info {

  carrid   : s_carr_id;
  carrname : s_carrname;
  connid   : s_conn_id;
  fldate   : s_date;
  @Semantics.amount.currencyCode : 'zs_flight_info.currency'
  price    : s_price;
  currency : s_currcode;

}
```

In `SE11`, choose **Data type** > **Structure** and enter the same components in the **Components** tab. Like table fields, a `CURR` component needs a reference to a `CUKY` component.

A structure can include another structure with `.INCLUDE` in `SE11` or `include` in ADT, the Dictionary version of `INCLUDE TYPE` from [nested structures and includes](./0032-nested-structures.en.md). A component can also be a structure or a table type itself; the structure is then **deep**.

## Table types

A table type describes an internal table. In `SE11` (**Data type** > **Table type**) or in ADT you set:

| Tab or attribute  | What you choose                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| line type         | the row: a structure, a data element, a table, or a predefined type                      |
| access (category) | standard, sorted, hashed, or generic (index table, not specified)                        |
| primary key       | standard (default) key, row type, key components, or not specified; unique or non-unique |
| secondary keys    | optional extra keys, as in [primary and secondary table keys](./0035-table-keys.en.md)   |

For the structure above you could create `ZTT_FLIGHT_INFO`: line type `ZS_FLIGHT_INFO`, access standard table, key components `CARRID`, `CONNID`, `FLDATE`, non-unique.

The system already has many table types you can reuse, such as `STRING_TABLE` (a standard table of `string`) and `BAPIRET2_T` (a table of `BAPIRET2` messages, used by [BAPIs](./0071-bapis.en.md)).

> [!TIP]
> A structure in the Dictionary is the official blueprint of a form, filed at the town hall: everyone who needs that form uses the same blueprint. A table type is the blueprint of a binder of those forms, with the rule for how they're filed inside.

## Using them in ABAP

Use the global types after `TYPE` like any other type:

```abap
REPORT zflight_info_demo.

DATA ls_info  TYPE zs_flight_info.                 " one row
DATA lt_infos TYPE ztt_flight_info.                " a table of rows

ls_info = VALUE #( carrid = 'LH' carrname = 'Lufthansa' connid = '0400'
                   fldate = '20260301' price = 650 currency = 'EUR' ).
APPEND ls_info TO lt_infos.

LOOP AT lt_infos INTO ls_info.
  WRITE: / ls_info-carrid, ls_info-carrname, ls_info-connid,
           ls_info-price CURRENCY ls_info-currency, ls_info-currency.
ENDLOOP.
```

When to use a global type and when a local one:

| Use a Dictionary type when...                                | Use a local `TYPES` when...                  |
| ------------------------------------------------------------ | -------------------------------------------- |
| it's a parameter of a global class method or function module | it's used only inside one program or class   |
| several programs need exactly the same type                  | it's a short helper type for one calculation |
| a screen, an ALV, or an RFC interface needs it               | it may change often without affecting others |

A database table can also be used as a structure type (`TYPE sflight`), but don't use a table as a type just because its fields happen to fit: if someone adds a field to the table, your type changes too. Create a structure when the type has its own meaning.

> [!WARNING]
> A global type is shared. Removing or renaming a component, or changing its type, can break every program that uses it, and changing a structure used in a database table changes that table too. Check the where-used list before changing a global structure or table type.

## Exercise

> [!IMPORTANT]
>
> 1. Create the structure `ZS_FLIGHT_INFO` and the table type `ZTT_FLIGHT_INFO` described in this lesson, and activate them.
> 2. Write a report that fills a `ZTT_FLIGHT_INFO` table with two rows using `VALUE` and prints them.

### Solution

1. Create the structure with the ADT source above, or in `SE11`. Then create the table type with line type `ZS_FLIGHT_INFO`, access standard, and non-unique key `CARRID CONNID FLDATE`. Activate both.
2. Report:

```abap
REPORT zflight_info_table.

DATA(lt_infos) = VALUE ztt_flight_info(
  ( carrid = 'LH' carrname = 'Lufthansa' connid = '0400'
    fldate = '20260301' price = 650 currency = 'EUR' )
  ( carrid = 'AZ' carrname = 'Alitalia'  connid = '0555'
    fldate = '20260302' price = 180 currency = 'EUR' ) ).

LOOP AT lt_infos INTO DATA(ls_info).
  WRITE: / ls_info-carrid, ls_info-carrname, ls_info-connid, ls_info-fldate.
ENDLOOP.
```

> [!NOTE]
>
> - A Dictionary structure is a global group of fields; it holds no data and isn't a database table.
> - A table type is a global internal table type, with line type, category, and keys.
> - Use them with `TYPE` in any program; they're essential for parameters of global classes and function modules.
> - Reuse standard table types such as `STRING_TABLE` and `BAPIRET2_T` when they fit.
> - Changing a global type affects every program that uses it: check the where-used list first.
