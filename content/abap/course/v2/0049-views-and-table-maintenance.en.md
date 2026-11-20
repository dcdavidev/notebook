---
title: Views and table maintenance
description: Database views, maintenance views, and SM30.
---

_Basic level_

A **view** is a Dictionary object that shows data from one or more tables without storing it again. It picks the fields you need and, when it combines tables, joins them. Programs read a view as if it were a table.

Many custom tables hold configuration that key users must keep up to date: codes, texts, limits. You don't write a program for each of them: you generate a **table maintenance dialog** and the users edit the rows in transaction `SM30`.

## The four kinds of Dictionary view

In `SE11`, under **View**, you can create four kinds of view:

| Kind             | What it does                                                 | Typical use                             |
| ---------------- | ------------------------------------------------------------ | --------------------------------------- |
| Database view    | an inner join of one or more tables, created on the database | read joined data with a single `SELECT` |
| Projection view  | a subset of the fields of **one** table                      | hide fields you don't need              |
| Maintenance view | joins tables linked by foreign keys, for `SM30`              | maintain related tables in one dialog   |
| Help view        | an outer join used only as the source of a search help       | F4 help that spans several tables       |

Only database views exist on the database. Projection, maintenance, and help views live only in the ABAP layer.

> [!TIP]
> A view is like a window onto a room: you see only part of what's inside, and from the angle you chose, but the furniture is still in the room. Move a chair, and everyone looking through the window sees it moved.

## Database views

A database view has three parts:

1. **Tables and join conditions**: for example `SCARR` and `SPFLI`, joined on `SCARR-CARRID = SPFLI-CARRID`. The join is always an inner join.
2. **View fields**: the columns of the view, each one taken from a table field.
3. **Selection conditions**: an optional fixed `WHERE`, for example `SPFLI-COUNTRYFR = 'DE'`.

After activation, you read it like a table. Suppose you created the view `ZV_CARR_CONN` with the fields `CARRID`, `CARRNAME`, `CONNID`, `CITYFROM`, and `CITYTO`:

```abap
SELECT carrid, carrname, connid, cityfrom, cityto
  FROM zv_carr_conn
  INTO TABLE @DATA(lt_connections).
```

You'll learn `SELECT` in [Reading data with SELECT](./0052-select-basics.en.md). A database view on several tables is read-only. A view on a single table can be changed if you set **Access** to "read and change" in the maintenance status.

> [!WARNING]
> On SAP S/4HANA, Dictionary database views are obsolete for new development. Create a [CDS view entity](./0132-cds-view-entities.en.md) instead. You'll still find database views in every system, so learn to read them.

## The table maintenance generator

To let users edit a custom table in `SM30`, follow these steps for a table such as `ZSCARR` (a copy of `SCARR` built as in [Database tables](./0046-database-tables.en.md)):

1. In `SE11`, on the **Delivery and Maintenance** tab, set **Data Browser/Table View Editing** to "Display/Maintenance Allowed".
2. Choose **Utilities > Table Maintenance Generator**.
3. Fill in the fields:
   - **Authorization group**: `&NC&` means "no group"; a real group lets you restrict who can edit (see [Authorization checks](./0110-authorization-checks.en.md)).
   - **Function group**: a new Z function group that will hold the generated code, for example `ZSCARR_MAINT`.
   - **Maintenance type**: **one step** (a single list where you edit the rows) or **two step** (a list, then a detail screen for each row).
   - **Screen numbers**: use **Find Scr. Number(s)** to let the system propose them.
   - **Recording routine**: "standard recording routine" asks for a transport request when the user saves, so the entries can travel to other systems.
4. Choose **Create** and save into a package and a transport request.

```text
SE11 > Table ZSCARR > Change
  Utilities > Table Maintenance Generator
    Authorization group:  &NC&
    Function group:       ZSCARR_MAINT
    Maintenance type:     One step
    Overview screen:      0001
    Recording routine:    Standard recording routine
```

> [!CAUTION]
> If you change the table's fields after generating, the generated screens no longer match. Open the generator again and choose **Change** to regenerate, or the users will get errors or miss the new fields.

## SM30 and custom transactions

Open `SM30`, enter `ZSCARR` in **Table/View**, and choose **Maintain**. You get a list where you can add, change, copy, and delete rows. The changes reach the database when you save.

Users shouldn't have to know table names. Create a **parameter transaction** in `SE93`:

```text
SE93 > Transaction code ZSCARR > Create > Transaction with parameters
  Default values for transaction:  SM30
  Skip initial screen:             selected
  Default values:
    VIEWNAME   ZSCARR
    UPDATE     X
```

Now the transaction `ZSCARR` opens the maintenance dialog directly.

For a group of related tables, such as a header table and its items, a **view cluster** (transaction `SE54`, maintained with `SM34`) puts several maintenance dialogs under one navigation tree.

## Exercise

> [!IMPORTANT]
>
> 1. Create the database view `ZV_CARR_CONN` on `SCARR` and `SPFLI` with the fields from this lesson, and display its contents with **Utilities > Contents**.
> 2. Generate a one-step maintenance dialog for your table `ZSCARR`, add two airlines in `SM30`, and create the parameter transaction `ZSCARR`.

### Solution

For the view, in `SE11` create a database view, enter the tables `SCARR` and `SPFLI`, and choose **Relationships** to let the system propose the join condition `SPFLI-CARRID = SCARR-CARRID` from the foreign key. On the **View fields** tab, add `CARRID`, `CARRNAME` from `SCARR` and `CONNID`, `CITYFROM`, `CITYTO` from `SPFLI`. Activate it.

For the maintenance, follow the steps in the generator section, then `SE93` with `SM30`, `VIEWNAME = ZSCARR`, and `UPDATE = X`.

> [!NOTE]
>
> - A view shows data from one or more tables without copying it.
> - A database view is an inner join created on the database; on S/4HANA use CDS view entities for new work.
> - The table maintenance generator creates the `SM30` dialog in a function group of your choice.
> - Regenerate the dialog every time you change the table's structure.
> - A parameter transaction in `SE93` opens `SM30` directly on your table.
