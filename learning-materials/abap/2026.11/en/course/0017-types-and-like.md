---
title: Defining types with TYPES and LIKE
description: Your own types, references to Dictionary types, and LIKE.
level: beginner
---

So far you've declared variables with the predefined types: `c`, `n`, `i`, `p`, `d`, and the others. Real programs repeat the same technical details many times: "a customer name is 25 characters", "an amount is a packed number with 2 decimals". If you write those details in every `DATA` statement, a change means editing dozens of lines.

The `TYPES` statement lets you define a **type** once, give it a name, and reuse it. With `TYPE` you can also point to types that already exist in the ABAP Dictionary, and with `LIKE` you can copy the type of another variable.

## Types and data objects

A **type** is a description: it says how a value looks (kind, length, decimals) but takes no memory. A **data object** (a variable or a constant) is a concrete piece of memory that has a type and holds a value.

| Statement   | Creates    | Takes memory | Holds a value |
| ----------- | ---------- | ------------ | ------------- |
| `TYPES`     | a type     | no           | no            |
| `DATA`      | a variable | yes          | yes           |
| `CONSTANTS` | a constant | yes          | yes, fixed    |

> [!TIP]
> A type is a cookie cutter; a data object is a cookie. The cutter says what shape the cookie has, but you can't eat it. With one cutter you can make as many cookies as you want, all with the same shape.

## Your own types with TYPES

`TYPES` uses the same additions as `DATA` (`TYPE`, `LENGTH`, `DECIMALS`), but without `VALUE`, because a type holds no value.

```abap
REPORT ztypes_demo.

TYPES ty_name   TYPE c LENGTH 25.               " a name: 25 characters
TYPES ty_amount TYPE p LENGTH 8 DECIMALS 2.     " an amount with 2 decimals
TYPES ty_code   TYPE n LENGTH 4.                " a 4-digit code

DATA lv_customer TYPE ty_name.
DATA lv_supplier TYPE ty_name.
DATA lv_price    TYPE ty_amount VALUE '199.90'.
DATA lv_flight   TYPE ty_code VALUE '0400'.

lv_customer = 'Rossi'.
WRITE: / lv_customer, lv_price, lv_flight.
```

Now if names must become 40 characters long, you change one line: `ty_name`. Every variable based on it follows.

By convention, local type names start with `ty_`. You can also chain several types with a colon, as with `DATA`:

```abap
TYPES: ty_city    TYPE c LENGTH 20,
       ty_country TYPE c LENGTH 3.
```

`TYPES` can also describe more complex things: a group of fields (a structure type, with `BEGIN OF ... END OF`) and a list of rows (a table type). You'll see them in [Structures](./0031-structures.md) and in [What is an internal table](./0033-internal-tables-intro.md).

## Types from the ABAP Dictionary

The **ABAP Dictionary** is the central catalog of types that every program in the system can use. You'll learn it properly in [The ABAP Dictionary](./0043-abap-dictionary-intro.md); for now, know that you can use its types directly after `TYPE`.

```abap
DATA lv_carrid   TYPE s_carr_id.      " data element: airline code
DATA lv_connid   TYPE s_conn_id.      " data element: flight number
DATA lv_cityfrom TYPE spfli-cityfrom. " the type of a field of table SPFLI
DATA lv_carrname TYPE scarr-carrname. " the type of a field of table SCARR

lv_carrid = 'LH'.
lv_connid = '0400'.
WRITE: / lv_carrid, lv_connid.
```

- `s_carr_id` is a **data element**: a reusable type with a business meaning ("airline code") and field labels.
- `spfli-cityfrom` is the type of the field `CITYFROM` of the database table `SPFLI`. If the table changes, your variable changes with it.

Prefer Dictionary types whenever your variable holds a value that also lives in the database: the length and the type always match.

> [!WARNING]
> Don't copy the technical details by hand (`TYPE c LENGTH 3` for an airline code). If the Dictionary definition changes, your copy doesn't, and values get truncated without any error.

## LIKE: the type of another data object

`LIKE` takes the type of an existing **data object**, not of a type:

```abap
DATA lv_total TYPE p LENGTH 10 DECIMALS 2.
DATA lv_tax   LIKE lv_total.          " same type as lv_total
DATA lv_net   LIKE lv_total.

CONSTANTS lc_max_seats TYPE i VALUE 300.
DATA lv_free_seats LIKE lc_max_seats. " type i
```

The rule is simple:

- `TYPE` is followed by a **type**: a predefined type, a `TYPES` type, or a Dictionary type.
- `LIKE` is followed by a **data object**: a variable or a constant.

```abap
DATA lv_a TYPE ty_name.    " correct: ty_name is a type
DATA lv_b LIKE lv_a.       " correct: lv_a is a variable
DATA lv_c LIKE ty_name.    " syntax error: ty_name isn't a data object
```

Use `LIKE` when a helper variable must always match another one, for example a backup copy of a value. When a named type exists, `TYPE` is usually clearer.

> [!WARNING]
> In old code you'll find `LIKE` followed by a Dictionary table field, for example `DATA lv_city LIKE spfli-cityfrom`. It's obsolete and forbidden in classes: with Dictionary types, always use `TYPE`.

## Exercise

> [!IMPORTANT]
>
> 1. In a new report, define a type `ty_seats` of type `i` and a type `ty_city` of type `c` with length 20.
> 2. Declare `lv_max` and `lv_booked` with `ty_seats`, and `lv_free` with `LIKE lv_max`. Calculate the free seats and print them.
> 3. Declare `lv_from` with the type of the field `CITYFROM` of `SPFLI`, fill it, and print it.

### Solution

```abap
REPORT zseats.

TYPES ty_seats TYPE i.
TYPES ty_city  TYPE c LENGTH 20.

DATA lv_max    TYPE ty_seats VALUE 220.
DATA lv_booked TYPE ty_seats VALUE 185.
DATA lv_free   LIKE lv_max.
DATA lv_from   TYPE spfli-cityfrom.

lv_free = lv_max - lv_booked.
lv_from = 'FRANKFURT'.

WRITE: / 'Free seats:', lv_free.
WRITE: / 'From:', lv_from.
```

> [!NOTE]
>
> - A type describes values and takes no memory; a data object holds a value.
> - `TYPES` defines a named type that you reuse with `TYPE`; change it once and every variable follows.
> - After `TYPE` you can use Dictionary data elements (`s_carr_id`) and table fields (`spfli-cityfrom`).
> - `LIKE` copies the type of an existing data object; `TYPE` refers to a type.
> - Prefer Dictionary types for values that also live in the database.
