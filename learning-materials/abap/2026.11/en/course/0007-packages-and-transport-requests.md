---
title: Packages and transport requests
description: Where your objects live and how they travel from development to production.
level: beginner
---

Every object you create in an SAP system (a program, a class, a table) belongs to a **package**, and every change you make to it in a real project is recorded in a **transport request**. The package says where the object lives; the transport request carries the change from development to quality and production, along the landscape you saw in [System landscape and clients](./0004-system-landscape-and-clients.md).

The system asks for both the first time you save a new object, so you need to know what to answer.

## Packages

A **package** groups development objects that belong together, for example everything for one application or one interface. In old systems and documents it's called a **development class**.

A package has a few important properties:

- **Software component**: the larger unit the package belongs to. Custom packages are usually in `HOME` (or a company-specific component).
- **Transport layer**: decides where the objects of the package are transported, for example from `DEV` to `QAS` and `PRD`.
- **Superpackage**: packages form a tree. A large application has a main package with subpackages for its parts.

You create packages in ADT (**File > New > Other > ABAP Package**) or in `SE80` / `SE21`.

## Names: Z, Y, and $

SAP reserves most names for its own objects. Your objects must use the **customer namespace**:

| Prefix     | Meaning                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| `Z` or `Y` | customer objects: `ZFLIGHT_REPORT`, `ZCL_FLIGHT_SERVICE`                       |
| `/ABC/`    | a reserved namespace registered with SAP, used by partners and large companies |
| `$`        | local packages: `$TMP` and packages such as `$ZTRAINING`                       |

Objects in a package that starts with `$` are **local objects**. They exist only in the system where you created them and are never transported. `$TMP` is the personal local package that every developer has.

> [!TIP]
> `$TMP` is your scratch paper. Use it for experiments and exercises; when a piece of code is meant for real users, move it into a proper package so it can travel with a transport.

## Transport requests

A **transport request** is a list of changed objects that travel together from one system to the next. Its number starts with the system ID of the source system, then `K`, then six digits: for example `DEVK900123`.

There are two main types:

| Type        | What it carries                                              | Where you see it |
| ----------- | ------------------------------------------------------------ | ---------------- |
| Workbench   | repository objects: programs, classes, tables (cross-client) | `SE09`           |
| Customizing | configuration settings (client-specific)                     | `SE10`           |

A request contains one **task** for each developer who works on it. When you change an object, the system records it in your task and **locks** the object for that request, so nobody can change it in another request at the same time.

## The life of a change

1. You create or change an object. The system asks for a request; you choose an existing one or create a new one.
2. You work and activate. Every changed object is recorded in your task.
3. When you're done, you **release your task** in `SE09` (or in the Transport Organizer view in ADT).
4. When all tasks are released, the request owner **releases the request**. The system exports the objects to files in the transport directory.
5. The basis team, or an automated process, **imports** the request into the quality system with `STMS`. After testing, the same request is imported into production.

> [!WARNING]
> Releasing a request is a point of no return: you can't add objects to a released request or take it back. Check that all your objects are activated and that nothing is missing before you release. If you forget something, you need a new request.

> [!CAUTION]
> Transports are imported in order. If request B depends on an object that's in request A, and B reaches production first, the import can fail or leave production with inconsistent code. Keep related changes in the same request when you can, and tell the people who import which requests belong together.

## Exercise

> [!IMPORTANT]
>
> 1. In ADT, create a local package `$ZTRAINING` with the description "Training exercises".
> 2. Open `SE09`, show your own requests, and look at the structure of one of them (request, tasks, objects).

### Solution

1. **File > New > Other > ABAP Package**, name `$ZTRAINING`, description "Training exercises", package type **Development**. Because the name starts with `$`, ADT doesn't ask for a software component or a transport request. Add it to your favorite packages.
2. In `SE09`, select **Workbench requests** and **Modifiable** and **Released**, and press **Display**. The tree shows each request, under it the tasks with the developers' user names, and under each task the objects, for example `R3TR PROG ZFLIGHT_REPORT`.

> [!NOTE]
>
> - Every object belongs to a package; a package has a software component and a transport layer.
> - Customer objects start with `Z` or `Y`; packages that start with `$` are local and never transported.
> - A transport request has one task per developer and records every changed object.
> - Workbench requests carry repository objects; customizing requests carry settings.
> - Release your task, then the request; imports into quality and production happen with `STMS`.
