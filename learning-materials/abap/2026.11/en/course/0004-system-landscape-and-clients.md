---
title: System landscape and clients
description: Development, quality, and production systems, and what a client is.
---

_Beginner level_

A company never has just one SAP system. It has a chain of systems, and code moves along that chain from the place where you write it to the place where people use it. Inside each system, data is further split into separate **clients**.

These two ideas decide where you work, where you test, and which data your programs see.

## The three-system landscape

The set of SAP systems that belong together is the **system landscape**. The classic landscape has three systems:

| System      | Typical ID | Who uses it                | What happens there                     |
| ----------- | ---------- | -------------------------- | -------------------------------------- |
| Development | `DEV`      | developers and consultants | you write code and set up customizing  |
| Quality     | `QAS`      | testers and key users      | changes are tested with realistic data |
| Production  | `PRD`      | the whole company          | real business: real orders, real money |

Each system has a **system ID** (SID): three characters, such as `DEV` or `S4D`. Changes travel from development to quality to production through **transport requests**, as you'll see in [Packages and transport requests](./0007-packages-and-transport-requests.md).

Some companies add more systems, for example a sandbox to try things out, a training system, or a pre-production system that's a copy of production.

> [!CAUTION]
> Never develop or test in production. In most landscapes production is locked against changes, and that's on purpose: a wrong `DELETE` or an endless loop there hits real business data and real users. Write and test in development, test again in quality, and let the transport bring your code to production.

## What a client is

A **client** (in German _Mandant_) is a self-contained unit inside one SAP system, with its own business data, its own users, and its own customizing. The client is identified by a three-digit number, such as `100`. You choose it on the logon screen, together with your user and password.

One system can have several clients. In development, for example, client `100` might hold the customizing and client `200` some test data. Users of one client don't see the business data of another client.

Some clients exist in every system:

| Client | Purpose                                                               |
| ------ | --------------------------------------------------------------------- |
| `000`  | SAP's reference client, delivered with the system                     |
| `001`  | a copy of `000`, in older systems often a starting point              |
| `066`  | the EarlyWatch client for SAP support (no longer used, often deleted) |

Transaction `SCC4` lists the clients of a system and their settings, for example whether changes are allowed.

> [!TIP]
> A system is an apartment building, and the clients are the apartments. Everybody shares the same structure, the same plumbing, and the same elevator (the programs and the table definitions). But each apartment has its own furniture and its own residents (the data and the users), and you need a key to the right door to get in.

## Client-specific and cross-client

Not everything is separated by client. Each object is either:

- **client-specific**: it exists separately in each client. Business data (orders, customers, flights) and most customizing are client-specific.
- **cross-client** (client-independent): it's the same in every client of the system. All **repository objects** are cross-client: programs, classes, table definitions, function modules.

That's why a program you write in client `100` is immediately available in client `200` of the same system, while the data you create in client `100` isn't.

Technically, a database table is client-specific when its first key field is the client, a field usually named `MANDT` of type `CLNT`. The flight table `SCARR`, for example, starts with `MANDT`.

```abap
SELECT carrid, carrname
  FROM scarr
  INTO TABLE @DATA(lt_carriers).   " reads only the rows of your logon client
```

You don't write `MANDT` in the query: ABAP SQL adds the condition on the current client for you. This **automatic client handling** keeps each client's data apart.

> [!WARNING]
> ABAP SQL has an addition to read other clients (`USING CLIENT`, or the obsolete `CLIENT SPECIFIED`), but you'll rarely need it. If you think you do, ask first: reading or changing another client's data is almost always a mistake.

## Exercise

> [!IMPORTANT]
>
> 1. On the logon screen of your system, note the client you log on to.
> 2. Open transaction `SE11`, display the database table `SCARR`, and check its first field.
> 3. If you're allowed, open `SCC4` and list the clients of your system.

### Solution

1. The client is the three-digit number above the user field, for example `001` or `100`.
2. The first field of `SCARR` is `MANDT`, a key field of type `CLNT`: the table is client-specific.
3. `SCC4` shows one row per client, with its name, city, and role (for example customizing, test, or production).

> [!NOTE]
>
> - A landscape usually has a development, a quality, and a production system, each with a three-character system ID.
> - Code moves from development to production through transport requests; you never develop in production.
> - A client is a separate unit inside a system with its own data, users, and customizing.
> - Repository objects are cross-client; business data is client-specific, with `MANDT` as the first key field.
> - ABAP SQL filters on your logon client automatically.
