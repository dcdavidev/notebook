---
title: Search helps
description: 'The F4 help: elementary and collective search helps.'
---

_Basic level_

When a user presses F4 on an input field, SAP shows a list of possible values. A **search help** is the Dictionary object that defines that list: where the values come from, which columns the user sees, and which value goes back into the field.

Good search helps save users from remembering codes. You build them once in the Dictionary, attach them to a data element or a table field, and every screen that uses that field gets the help for free.

## Where the F4 help comes from

The system looks for a value help in this order and uses the first one it finds:

1. A help programmed on the screen itself (`PROCESS ON VALUE-REQUEST`, covered with [Dynpro flow logic](./0102-dynpro-flow-logic.md)).
2. A search help attached to the screen field (for example `MATCHCODE OBJECT` on a selection screen).
3. A search help attached to the table or structure field.
4. The check table of the field (see [Foreign keys and check tables](./0047-foreign-keys-and-check-tables.md)), with its own search help if it has one.
5. A search help attached to the data element.
6. The fixed values of the domain.
7. A calendar for dates and a clock for times.

So even with no search help at all, a field with a check table or domain fixed values already shows something on F4.

> [!TIP]
> A search help is the index at the back of a cookbook. You don't remember the page of the lasagna recipe, so you look up "lasagna" and the index gives you the page number. The user doesn't remember the airline code, so F4 shows "Lufthansa" and puts `LH` in the field.

## Elementary search helps

An **elementary search help** reads one table or view. Create it in `SE11` under **Search help**. It has three main settings:

| Setting          | Meaning                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| Selection method | the table or view that provides the values, for example `SCARR`             |
| Dialog type      | show the values immediately, ask for restrictions first, or decide by count |
| Parameters       | the fields of the help, with their flags                                    |

Each parameter has these flags:

- **IMP** (import): the value already in the screen field is used to filter the list.
- **EXP** (export): the value goes back to the screen field when the user picks a row.
- **LPos**: the position of the column in the hit list.
- **SPos**: the position of the field in the restrictions dialog.

Here is the design of `ZSH_CARRID`, a search help for airline codes:

```text
Search help:       ZSH_CARRID
Selection method:  SCARR
Dialog type:       Display values immediately

Parameter   IMP  EXP  LPos  SPos
CARRID       X    X     1     1
CARRNAME                2     2
CURRCODE                3     0
```

The user sees code, name, and currency, can filter by code or name, and gets the code back in the field.

## Collective search helps

A **collective search help** groups several elementary ones. On F4, the user sees one tab per elementary help and can search in different ways: for example, find a customer by name, by city, or by sales area.

In `SE11`, create a search help, choose **Collective search help**, define the parameters it exchanges with the field, and list the elementary helps on the **Included search helps** tab. With **Param. assignment**, map each parameter of the collective help to a parameter of the included one.

Standard SAP has many collective search helps, such as `DEBI` for customers. You can add your own elementary help to a standard collective one with **Append search help**, without modifying it.

## Attaching a search help

A search help does nothing until you attach it. You have three main options:

- **To a data element**: in `SE11`, on the data element's **Further Characteristics** tab. Every field of that type gets the help.
- **To a table or structure field**: in the table, select the field and choose the **search help** button. This is more specific and wins over the data element.
- **To a selection screen parameter**, directly in the program:

```abap
REPORT zsearch_help_demo.

PARAMETERS p_carr TYPE s_carr_id MATCHCODE OBJECT zsh_carrid.

WRITE: / 'Selected airline:', p_carr.
```

You'll see `PARAMETERS` in detail in [Selection screens: PARAMETERS](./0063-parameters.md).

> [!WARNING]
> A search help only proposes values: it doesn't check them. The user can still type a value that's not in the list. To reject invalid values, use a check table with a foreign key, or check the input in the program.

For special needs, such as filtering the list by the user's authorizations, a **search help exit** is a function module that changes the help's behavior at runtime. Copy the template `F4IF_SHLP_EXIT_EXAMPLE` when you need one.

## Exercise

> [!IMPORTANT]
>
> 1. Create the elementary search help `ZSH_CARRID` on `SCARR` as shown, and test it with **F8** in `SE11`.
> 2. Write a report with a parameter that uses it through `MATCHCODE OBJECT`, and check that F4 returns the airline code.

### Solution

The search help is the one in the elementary section. The report:

```abap
REPORT zsearch_help_demo.

PARAMETERS p_carr TYPE s_carr_id MATCHCODE OBJECT zsh_carrid.

WRITE: / 'Selected airline:', p_carr.
```

Press F4 on `P_CARR`, pick a row, and the code appears in the field.

> [!NOTE]
>
> - A search help defines the F4 list: source, columns, and returned value.
> - An elementary search help reads one table or view; a collective one groups several elementary helps.
> - IMP parameters filter the list with the field's value; EXP parameters return the chosen value.
> - Attach the help to a data element, a table field, or a screen field; the most specific one wins.
> - A search help doesn't validate input: use check tables for that.
