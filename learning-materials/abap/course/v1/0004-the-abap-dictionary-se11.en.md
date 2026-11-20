---
title: The ABAP Dictionary (SE11)
description: Domains, data elements, tables, structures, views, and search helps.
---

_Week 1 · Beginner level · 4 hours_

### Today's schedule

| Block  | Content                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| Hour 1 | What the ABAP Dictionary is; domains and data elements                                         |
| Hour 2 | Transparent tables: fields, keys, technical settings, currency and quantity fields             |
| Hour 3 | Structures, table types, foreign keys, check tables, search helps                              |
| Hour 4 | Views, indexes, lock objects (overview), important standard tables, maintenance dialogs (SM30) |

## Hour 1 – What the ABAP Dictionary is

The **ABAP Dictionary** (DDIC) is the central place where all SAP data is described: database tables, shared data types, structures. You open it with transaction **SE11** (or in ADT).

> [!TIP]
> The ABAP Dictionary is like a city's land registry. It doesn't contain the houses (the data), but it describes every building: how many floors it has, what it's made of, what it's connected to. If you want to build something, you register it first, and everyone knows what it looks like.

Why it matters so much:

- When you create a table in SE11, SAP automatically creates the real table in the database.
- Types defined in the DDIC can be used in every program.
- Field descriptions (the labels the user sees on screen) and search helps (F4) come from the DDIC: define them once, and they work everywhere.
- If you change a type in the DDIC, every program that uses it adapts.

### The chain: domain → data element → field

SAP describes every field on two levels:

| Object       | What it describes                                          | Example           |
| ------------ | ---------------------------------------------------------- | ----------------- |
| Domain       | the technical side: type, length, decimals, allowed values | CHAR 10           |
| Data element | the meaning: labels, documentation, search help            | "Customer number" |
| Table field  | the actual use in a table                                  | `KNA1-KUNNR`      |

> [!TIP]
> The domain is the material ("20 cm brick"), the data element is the role ("brick for the kitchen's load-bearing wall"). The same kind of brick (domain) can have many different roles (data elements): "customer number" and "vendor number" can share the same CHAR 10 domain but have different labels and meanings.

### Create a domain

In SE11 choose "Domain", name `ZD_ORDER_STATUS`:

- **Definition**: data type CHAR, length 1.
- **Value range** (fixed values): `N` = New, `P` = In progress, `C` = Closed.
- Save and activate.

Fixed values are checked automatically on screens and offered with F4.

### Dictionary data types

The DDIC has its own types, which are mapped to ABAP types:

| DDIC type                 | Meaning                              | ABAP type                |
| ------------------------- | ------------------------------------ | ------------------------ |
| CHAR                      | fixed text                           | `c`                      |
| NUMC                      | numeric text                         | `n`                      |
| INT1 / INT2 / INT4 / INT8 | integers                             | `b` / `s` / `i` / `int8` |
| DEC                       | packed decimal                       | `p`                      |
| CURR                      | amount (tied to a currency)          | `p`                      |
| QUAN                      | quantity (tied to a unit of measure) | `p`                      |
| CUKY                      | currency code (EUR, USD)             | `c LENGTH 5`             |
| UNIT                      | unit of measure (KG, PC)             | `c LENGTH 3`             |
| DATS                      | date                                 | `d`                      |
| TIMS                      | time                                 | `t`                      |
| LANG                      | language                             | `c LENGTH 1`             |
| CLNT                      | client                               | `c LENGTH 3`             |
| STRING / RAWSTRING        | variable text / binary               | `string` / `xstring`     |
| RAW                       | fixed binary                         | `x`                      |
| FLTP                      | floating point                       | `f`                      |
| DATN / TIMN / UTCLONG     | new date/time types (HANA)           | `d` / `t` / `utclong`    |

### Create a data element

In SE11 choose "Data type" → "Data element", name `ZE_ORDER_STATUS`:

- **Data type** tab: domain `ZD_ORDER_STATUS`.
- **Field label** tab: short (10), medium (20), long (40), and heading texts. These are the labels that appear on screens and in ALVs.
- Optional: documentation (F1) and parameter ID (SET/GET, to propose values across transactions).

You can also create a data element with a **predefined type** (without a domain): convenient, but less reusable.

## Hour 2 – Transparent tables

A **transparent table** in the DDIC corresponds exactly to a table in the database ("transparent" because the relationship is 1 to 1). It's the kind of table you'll use almost always.

### Let's create a table: ZORDERS_COURSE

In SE11 → Database table → `ZORDERS_COURSE` → Create.

**Delivery and Maintenance** tab:

- Short description: "Sample orders for the course".
- **Delivery class**: `A` = application table (master and transaction data). Others: `C` = customizing, `L` = temporary, `G`, `E`, `S`, `W` = system.
- **Data browser/table view maintenance**: "Allowed" if you want to be able to change it with SE16/SM30.

**Fields** tab:

| Field        | Key | Data element            | Notes                  |
| ------------ | --- | ----------------------- | ---------------------- |
| `MANDT`      | yes | `MANDT`                 | client, always first   |
| `ORDER_NO`   | yes | `ZE_ORDER_NO` (NUMC 10) | order number           |
| `CUSTOMER`   |     | `KUNNR`                 | SAP standard customer  |
| `ORDER_DATE` |     | `DATUM`                 | order date             |
| `AMOUNT`     |     | `ZE_AMOUNT` (CURR 15,2) | amount                 |
| `CURRENCY`   |     | `WAERS`                 | currency (CUKY)        |
| `QUANTITY`   |     | `ZE_QTY` (QUAN 13,3)    | quantity               |
| `UOM`        |     | `MEINS`                 | unit of measure (UNIT) |
| `STATUS`     |     | `ZE_ORDER_STATUS`       | our data element       |

### The primary key

The fields with the **Key** checkbox form the **primary key**: the combination of their values identifies one and only one row. Two rows can't have the same key.

> [!TIP]
> The primary key is like a tax ID number: no two people have the same one. If you try to insert a second row with the same key, the database rejects it.

Rules:

- Key fields must be at the beginning of the table, one after the other.
- The first field of a client-dependent table is `MANDT`.
- If `MANDT` is missing, the table is **client-independent** (the same data in every client): rare, used for technical data.

### Amount and quantity fields: the reference field

A **CURR** field (amount) must have a **reference field** of type CUKY (currency), and a **QUAN** field must have a UNIT reference. You set it on the **Currency/Quantity Fields** tab: for `AMOUNT`, reference table `ZORDERS_COURSE`, field `CURRENCY`.

Why? Because 100 means nothing on its own: 100 EUR and 100 JPY are very different amounts, and some currencies have no decimals. SAP uses the reference to display the amount correctly.

### Technical settings

The **Technical Settings** button (required to activate):

- **Data class**: `APPL0` = master data (changes rarely), `APPL1` = transaction data (changes often), `APPL2` = customizing.
- **Size category**: an estimate of the number of rows (0 = few).
- **Buffering**: SAP can keep a copy of the table in memory on the application server, to read faster. Use it for tables that are **small, read often, and rarely changed** (for example configuration tables). Types: full, generic, single record.
- **Log data changes**: records who changes what (table `DBTABLOG`).

Finally, in the Extras menu → **Enhancement category**, you state whether the table can be extended (for example choose "Can be enhanced (character-like or numeric)"). Then activate.

### Viewing and entering data

- **SE16 / SE16N**: display (and, if allowed, enter) data.
- **SE16H**: like SE16N with grouping and totals (recent systems).
- From a program: with Open SQL (day 6).

### DDIC table types

| Type                         | Description                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transparent table            | 1:1 with the database, the normal case                                                                                                               |
| Pooled / cluster table       | old ECC types: several logical tables in one physical table (for example `BSEG` was a cluster). In S/4HANA they were converted to transparent tables |
| Global temporary table (GTT) | data that lives only until the `COMMIT`, for intermediate processing                                                                                 |

### Changing an existing table

Adding a field to a table that already contains data is normal: on activation, SAP adjusts the database. Changing a type or removing key fields, instead, may require a **conversion** (transaction **SE14**, _Database Utility_), which can be long and risky for large tables.

> [!WARNING]
> You never change SAP standard tables. To add fields to a standard table, you use **append structures** or customer includes (`CI_` includes), which we'll see on day 13.

## Hour 3 – Structures, table types, foreign keys, search helps

### Structures

A **structure** in the DDIC has fields like a table, but it **contains no data** and doesn't exist in the database. It serves as a type for variables, parameters, and screens.

```abap
DATA ls_address TYPE zs_address.      " DDIC structure created in SE11
DATA ls_order   TYPE zorders_course.  " a table can be used as a structure!
```

> [!TIP]
> A DDIC table is a wardrobe with full drawers; a structure is the wardrobe's blueprint. With the blueprint you can build wardrobes (variables) in your programs, but the blueprint itself holds no clothes.

Structures can include other structures (`.INCLUDE`) and contain fields that are themselves structures or tables ("deep" structures).

### Table types

A **table type** describes an internal table (day 5): what its rows are made of, what kind of access it has (standard, sorted, hashed), and what key it has. It is used mostly for the parameters of global functions and methods.

```abap
DATA lt_orders TYPE ztt_orders.   " table type created in SE11 with row ZORDERS_COURSE
```

### Foreign keys and check tables

A **foreign key** links a field to a **check table**: only the values in that table are allowed.

Example: the `CUSTOMER` field of `ZORDERS_COURSE` has `KNA1` (customer master) as its check table. On screens, SAP automatically checks that the customer exists, and F4 offers the customers.

You create it by selecting the field and pressing the button with the key icon (_Foreign Keys_). SAP proposes the check table if the domain has a "value table".

> [!TIP]
> A foreign key is like a bouncer at a club with the guest list (the check table): only people on the list get in.

> [!WARNING]
> The foreign key check happens **on screens**, not in the database. An ABAP program that writes with `INSERT` can insert invalid values: it's up to you to check them in the code.

### Fixed values vs check table

| Tool                       | When to use it                                                              |
| -------------------------- | --------------------------------------------------------------------------- |
| Fixed values in the domain | few, stable values decided by the developer (for example status N/P/C)      |
| Check table                | values that grow or are managed by users (for example customers, countries) |

### Text tables

To handle descriptions in several languages, you create a separate **text table**, whose key is the main table's key plus a language field (`SPRAS`). Standard examples: `T005` (countries) and `T005T` (country names in every language); `MARA` (materials) and `MAKT` (material descriptions).

### Search helps (F4)

A **search help** defines the window that appears when you press F4: which table to read, which fields to show, which ones to use as filters.

- **Elementary**: a single data source (table or view).
- **Collective**: groups several elementary search helps in tabs (for example find a customer by name, by city, by VAT number).

You can assign it to a data element, a table field, a structure, or directly to a screen parameter (`MATCHCODE OBJECT`).

## Hour 4 – Views, indexes, and standard tables

### Views

A **view** combines fields from one or more tables, without duplicating the data.

| View type        | What it is for                                                             |
| ---------------- | -------------------------------------------------------------------------- |
| Database view    | joins of tables, readable with `SELECT` (it really exists in the database) |
| Projection view  | shows only some fields of a table                                          |
| Maintenance view | creates maintenance dialogs (SM30) over several linked tables              |
| Help view        | for search helps with an outer join                                        |

Today, instead of classic database views, you use **CDS views** (day 14), which are far more powerful.

### Indexes

An **index** is a sorted copy of some fields that lets the database find rows quickly. The primary index on the key always exists. You can create **secondary indexes** on fields you often use in `WHERE` clauses.

> [!TIP]
> An index is like the index at the back of a book: instead of leafing through every page, you look up the word and immediately find the page number.

Don't overdo it: every index slows down inserts and takes up space. On SAP HANA (an in-memory columnar database), secondary indexes are needed much less.

### Lock objects

When two users change the same data at the same time, changes can be lost. SAP uses **logical locks**: you define them in SE11 as lock objects (names starting with `EZ`), and SAP generates two function modules, `ENQUEUE_EZ...` (lock) and `DEQUEUE_EZ...` (unlock). Active locks are shown in **SM12**. We'll use them on day 13.

### Table maintenance: SM30

To let users insert/change rows of a Z table (typically a configuration table), you generate a **maintenance dialog**: in SE11 → Utilities → Table Maintenance Generator (transaction **SE54**). You choose a function group and the screen type (one or two steps). Then the user runs **SM30** with the table name. You can also create a dedicated transaction (SE93, a parameter transaction that calls SM30).

### SAP standard tables to know

| Table                                   | Content                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| `T001`                                  | Company codes                                                        |
| `T001W`                                 | Plants                                                               |
| `KNA1` / `KNB1` / `KNVV`                | Customers: general / company code / sales data                       |
| `LFA1` / `LFB1`                         | Vendors: general / company code data                                 |
| `MARA` / `MARC` / `MARD` / `MAKT`       | Materials: general / per plant / per storage location / descriptions |
| `VBAK` / `VBAP`                         | Sales orders: header / items                                         |
| `LIKP` / `LIPS`                         | Deliveries: header / items                                           |
| `VBRK` / `VBRP`                         | Invoices (billing documents): header / items                         |
| `EKKO` / `EKPO`                         | Purchase orders: header / items                                      |
| `BKPF` / `BSEG`                         | Accounting documents: header / line items                            |
| `ACDOCA`                                | Universal Journal (S/4HANA): all accounting line items               |
| `MATDOC`                                | Material documents (S/4HANA)                                         |
| `BUT000`                                | Business Partner (S/4HANA)                                           |
| `USR02`                                 | Users                                                                |
| `TSTC`                                  | Transactions                                                         |
| `DD02L` / `DD03L`                       | Tables and fields of the dictionary itself                           |
| `SCARR` / `SPFLI` / `SFLIGHT` / `SBOOK` | The flight training model (for practice)                             |

The flight model is available in almost every system: if its tables are empty, run the report `SAPBC_DATA_GENERATOR` to fill them. ABAP Cloud systems have the equivalent tables `/DMO/FLIGHT`, `/DMO/CARRIER`, `/DMO/CONNECTION`, `/DMO/BOOKING`, and so on (package `/DMO/FLIGHT_LEGACY`, which you can fill with the class `/DMO/CL_FLIGHT_DATA_GENERATOR`).

> [!WARNING]
> A trick to find out which table stores a field you see on screen: put the cursor on the field, press F1, then "Technical Information". Careful, though: the screen often shows a **structure**, not the database table. In that case, use the SQL trace (ST05, day 14) or search the forums for the right table.

## Exercises

> [!IMPORTANT]
>
> 1. Create the domain `ZD_ORDER_STATUS` with 3 fixed values and the data element `ZE_ORDER_STATUS` with its labels.
> 2. Create the table `ZORDERS_COURSE` as described, with the amount/currency and quantity/unit fields correctly linked. Activate it.
> 3. Add a foreign key on the `CUSTOMER` field pointing to `KNA1`.
> 4. Generate the maintenance dialog and enter 5 orders with SM30. Check them with SE16N.
> 5. Create the structure `ZS_ADDRESS` (street, city, postal code, country) and the table type `ZTT_ORDERS` with row type `ZORDERS_COURSE`.
> 6. In SE11, open the table `VBAK` and find: the primary key, the delivery class, the amount field, and its currency reference field.
> 7. Use F1 → Technical Information on a field of transaction VA03 (display sales order) and write down its technical name.

## Quiz

1. What is the difference between a domain and a data element?
2. Why is `MANDT` the first field of tables?
3. What happens if a CURR field has no currency reference field?
4. What is the difference between a table and a structure in the DDIC?
5. What is a check table for?
6. When is it worth turning on buffering?
7. In which transaction does the user change a table with a maintenance dialog?
8. Where do you see the active locks?

## Solutions

Exercise 6: the key of `VBAK` = `MANDT` + `VBELN` (sales document number); delivery class A; the amount field `NETWR` (net value) refers to the currency `WAERK`.

Quiz:

1. The domain describes the technical side (type, length, values); the data element describes the meaning (labels, documentation).
2. Because data is separated by client, and Open SQL automatically filters on that field.
3. The table doesn't activate: it's an error.
4. The table exists in the database and holds data; the structure is only a description used as a type.
5. To restrict the allowed values of a field to those in another table (check and F4 on screens).
6. For tables that are small, read very often, and rarely changed.
7. SM30.
8. SM12.

> [!NOTE]
> Today you learned: the ABAP Dictionary, domains, data elements, transparent tables with keys and technical settings, structures, table types, foreign keys, search helps, views, indexes, SM30, and the main SAP tables. Tomorrow: internal tables, the most used tool in ABAP.
