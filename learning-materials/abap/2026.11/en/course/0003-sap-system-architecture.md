---
title: The architecture of an SAP system
description: Presentation, application, and database layers, work processes, and instances.
---

_Beginner level_

An SAP system isn't one program on one computer. It's a set of cooperating processes, usually spread over several servers, that share one database. Knowing how they fit together explains a lot of what you'll see as a developer: why a program "times out", why a background job runs somewhere else, or why the code you write never runs on your PC.

## Three layers

An SAP system is built in three layers, a **three-tier architecture**:

| Layer        | What runs there                                | Examples                                      |
| ------------ | ---------------------------------------------- | --------------------------------------------- |
| Presentation | the user interface: shows screens, sends input | SAP GUI, a web browser with SAP Fiori         |
| Application  | the ABAP runtime: runs your programs           | the ABAP application server (AS ABAP)         |
| Database     | stores all data and all code                   | SAP HANA (S/4HANA), or Oracle, Db2, ... (ECC) |

- The **presentation layer** has no business logic. SAP GUI is a "thin client": it draws what the server tells it to draw.
- The **application layer** runs all ABAP code. It can be scaled out: a big system has many application servers working side by side.
- The **database layer** is one database per system. It holds the business data (orders, invoices), the configuration, and the repository with every program and class.

> [!TIP]
> Think of a restaurant again. The dining room is the presentation layer: waiters take orders and bring dishes, but they don't cook. The kitchen is the application layer: the cooks do the real work, and in a busy restaurant there are many of them. The pantry is the database: there's only one, and every cook takes ingredients from it.

## Instances and work processes

An application server runs one or more **instances**. An instance is a group of processes started together, with its own memory, identified by an **instance number** (two digits, for example `00`).

Inside each instance:

- The **dispatcher** receives user requests and puts them in a queue.
- **Work processes** take requests from the queue and execute them. Each work process is a separate operating-system process with its own connection to the database.

There are several types of work process:

| Type | Name       | What it does                                                     |
| ---- | ---------- | ---------------------------------------------------------------- |
| DIA  | Dialog     | runs interactive requests from users                             |
| BTC  | Background | runs background jobs, without a user waiting                     |
| UPD  | Update     | writes changes to the database asynchronously (update task)      |
| UP2  | Update 2   | runs low-priority updates, such as statistics                    |
| ENQ  | Enqueue    | manages SAP locks (in modern systems, a separate enqueue server) |
| SPO  | Spool      | sends output to printers                                         |

A system also has central services: the **message server**, which knows all instances and balances users across them, and the **enqueue server**, which holds the lock table. The **ICM** (Internet Communication Manager) handles HTTP traffic, for example Fiori apps and web services.

## A dialog step

When you press Enter on a screen, this is what happens:

1. SAP GUI sends your input to the dispatcher of your instance.
2. The dispatcher puts the request in the queue.
3. A free dialog work process takes it, loads your program's context, and runs the ABAP code.
4. The code reads and writes the database through the work process's connection.
5. The result goes back to SAP GUI, and the work process becomes free for the next user.

One such round trip is a **dialog step**. A work process serves you only during a dialog step, then serves somebody else. That's how a few dozen work processes can serve hundreds of users.

> [!WARNING]
> Dialog work processes have a time limit (parameter `rdisp/max_wprun_time`, often 10 to 60 minutes depending on the release and the system settings). A program that runs longer in dialog is stopped with the runtime error `TIME_OUT`. Long-running programs belong in the background, as you'll see in [Variants and background jobs](./0068-variants-and-background-jobs.md).

## Where to see it

A few transactions show the architecture of a running system. You'll learn how to open transactions in [SAP GUI and transaction codes](./0005-sap-gui-and-transaction-codes.md).

| Transaction | What it shows                                               |
| ----------- | ----------------------------------------------------------- |
| `SM51`      | the application server instances of the system              |
| `SM50`      | the work processes of the current instance and what they do |
| `SM66`      | the work processes of all instances                         |
| `SM04`      | the users logged on to the current instance                 |

## Exercise

> [!IMPORTANT]
>
> 1. Open transaction `SM51` and count the instances of your system.
> 2. Open `SM50` and count the dialog (`DIA`) and background (`BTC`) work processes. Find yours: it's the one running your own user name.

### Solution

1. Each row in `SM51` is one instance, with the host name, the system ID, and the instance number (for example `sapdev_DEV_00`). Small training systems often have only one.
2. In `SM50`, the **Type** column shows `DIA`, `BTC`, `UPD`, and so on. While you look at the list, one dialog work process is busy with your request: its **User** column shows your user name and its **Report** column shows the program that builds the list.

> [!NOTE]
>
> - An SAP system has three layers: presentation, application, and database.
> - All ABAP code runs on the application server; SAP GUI only shows screens.
> - An instance has a dispatcher and several work processes: dialog, background, update, enqueue, and spool.
> - A work process serves a user for one dialog step at a time.
> - `SM51`, `SM50`, and `SM66` show the instances and work processes of a running system.
