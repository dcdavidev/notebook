---
title: The ABAP Dictionary
description: The central catalog of types and database objects.
level: basic
---

The **ABAP Dictionary** (often called **DDIC**) is the central catalog of an SAP system. It describes the database tables, the types that every program can share, and many other objects such as views, search helps, and lock objects. When you create a table in the Dictionary, the system creates it in the database for you.

Up to now you defined types with `TYPES` inside a program. Types in the Dictionary are **global**: every program, class, and function module in the system can use them, and a change in one place reaches all of them.

## What the Dictionary contains

| Object         | What it describes                                                  | Lesson                                                                  |
| -------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| domain         | technical type, length, and allowed values                         | [domains](./0044-domains.md)                                            |
| data element   | the business meaning of a field: labels and documentation          | [data elements](./0045-data-elements.md)                                |
| database table | a table in the database, with fields, keys, and technical settings | [database tables](./0046-database-tables.md)                            |
| structure      | a group of fields, used as a type; holds no data                   | [structures and table types](./0048-ddic-structures-and-table-types.md) |
| table type     | the type of an internal table                                      | [structures and table types](./0048-ddic-structures-and-table-types.md) |
| view           | a combination of fields from one or more tables                    | [views and table maintenance](./0049-views-and-table-maintenance.md)    |
| search help    | the list of values that appears with F4                            | [search helps](./0050-search-helps.md)                                  |
| lock object    | a logical lock on rows, to stop two users changing the same data   | [lock objects](./0051-lock-objects.md)                                  |

On SAP S/4HANA, new views are usually CDS view entities, which you'll meet in [CDS view entities](./0132-cds-view-entities.md). They're defined in ADT but are part of the same Dictionary.

## From domain to field

The Dictionary describes a table field on three levels. Take the field `CARRID` of the table `SFLIGHT`:

| Level        | Object           | What it says                                         |
| ------------ | ---------------- | ---------------------------------------------------- |
| domain       | `S_CARR_ID`      | 3 characters (`CHAR 3`)                              |
| data element | `S_CARR_ID`      | "Airline Code", with short, medium, and long labels  |
| table field  | `SFLIGHT-CARRID` | the airline of this flight, a key field of `SFLIGHT` |

The domain is the technical side, the data element is the meaning, and the field is where they're used. Many data elements can share one domain, and many fields can share one data element.

> [!TIP]
> Think of a building plan. The domain is the kind of brick: size and material. The data element is the role of the brick: "kitchen wall". The table field is the actual wall in a given house. The same brick can be used in many roles, and the same role can appear in many houses.

## Using Dictionary types in ABAP

Any Dictionary type can be used after `TYPE`, exactly like a local type:

```abap
DATA lv_carrid  TYPE s_carr_id.                 " data element
DATA ls_flight  TYPE sflight.                   " a table used as a structure type
DATA lt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY.
DATA lv_city    TYPE spfli-cityfrom.            " the type of one table field
DATA lt_texts   TYPE string_table.              " a Dictionary table type
```

Using Dictionary types instead of `c LENGTH 3` has real advantages:

- the variable has exactly the same type as the database field, so there are no conversion problems;
- if the domain changes, the program follows it at the next activation;
- screens, selection screens, and ALV lists take labels, F4 help, and checks from the data element automatically.

## Where you work with the Dictionary

| Tool             | Use                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `SE11`           | the classic ABAP Dictionary transaction in SAP GUI: display, create, and change objects    |
| ADT (Eclipse)    | the modern editor; tables and structures are edited as source code, CDS entities only here |
| `SE16N` / `SE16` | display the content of a table                                                             |
| `SE14`           | database utility: adjust a table in the database after a change                            |

Every Dictionary object, like a program, must be **activated** before you can use it. Activation checks the object and creates the runtime version; for a table, it also creates or changes the table in the database. Use the **where-used list** (`Ctrl+Shift+G` in ADT, the where-used button in `SE11`) before you change an object, to see who depends on it.

> [!WARNING]
> Never change a standard SAP Dictionary object, such as `SFLIGHT` or a standard domain. Create your own objects in the customer namespace (starting with `Z` or `Y`), and extend standard tables only with the techniques SAP provides, such as append structures.

## Exercise

> [!IMPORTANT]
>
> 1. Open the table `SFLIGHT` in `SE11` or ADT. Find its key fields, and the data element and the domain of the field `PRICE`.
> 2. Write a small report that declares a variable with the type of `SFLIGHT-PLANETYPE` and a table of `SCARR` rows, and prints the length of the variable with `strlen( )` after you fill it.

### Solution

1. The key of `SFLIGHT` is `MANDT`, `CARRID`, `CONNID`, `FLDATE`. The field `PRICE` has the data element `S_PRICE` and the domain `S_PRICE` (type `CURR`, length 15, 2 decimals).
2. One possible report:

```abap
REPORT zddic_types.

DATA lv_planetype TYPE sflight-planetype.
DATA lt_airlines  TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.

lv_planetype = 'A320-200'.
DATA(lv_len) = strlen( lv_planetype ).
WRITE: / lv_planetype, lv_len.
```

> [!NOTE]
>
> - The ABAP Dictionary is the central catalog of global types and database objects of an SAP system.
> - A field is described by a domain (technical type), a data element (meaning), and the table that uses it.
> - Dictionary types are used in ABAP with `TYPE`, like local types, and keep programs consistent with the database.
> - Work with the Dictionary in `SE11` or ADT; every object must be activated before use.
> - Create your own objects in the `Z` or `Y` namespace and don't change standard objects.
