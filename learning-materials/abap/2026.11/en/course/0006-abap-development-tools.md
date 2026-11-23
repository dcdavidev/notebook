---
title: ABAP Development Tools in Eclipse
description: Install ADT, connect to a system, and find your way around the IDE.
level: beginner
---

The **ABAP Development Tools** (ADT) are a set of plug-ins that turn the Eclipse IDE into an ABAP editor. They're SAP's recommended tool for ABAP development, and for some objects the only one: CDS views, behavior definitions, and everything in ABAP Cloud can be edited only in ADT.

You'll still use SAP GUI, as you saw in [SAP GUI and transaction codes](./0005-sap-gui-and-transaction-codes.md), but most of the code in this course is easier to write in Eclipse.

## Installing ADT

ADT is free. You need:

1. **Eclipse**: download a current release of the Eclipse IDE from eclipse.org (the package "Eclipse IDE for Java Developers" is a good choice). Check the SAP Development Tools page for the Eclipse versions that ADT supports.
2. **The ADT plug-ins**: in Eclipse, choose **Help > Install New Software**, enter the update site `https://tools.hana.ondemand.com/latest`, select **ABAP Development Tools**, and follow the wizard. Restart Eclipse when it asks.
3. **SAP GUI** (optional but useful): ADT uses it to open screens that exist only in SAP GUI, embedded in an Eclipse editor. On Windows, install SAP GUI for Windows; on macOS and Linux, SAP GUI for Java.

After the restart, switch to the **ABAP perspective**: **Window > Perspective > Open Perspective > Other > ABAP**. A **perspective** is a saved arrangement of views and editors for one kind of work.

## Connecting to a system

In ADT, each connection to a system is an **ABAP project**:

- **On-premise system**: **File > New > ABAP Project**. Choose the system from your SAP Logon list, then enter client, user, password, and language, just like on the SAP GUI logon screen.
- **SAP BTP ABAP environment**: **File > New > ABAP Cloud Project**, and log on with the service key or the URL your administrator gives you.

The project appears in the **Project Explorer**. Each project shows your **Favorite Packages**, starting with `$TMP` (your local objects) and the **System Library** with every package of the system. Add the packages you work on to the favorites; packages are explained in [Packages and transport requests](./0007-packages-and-transport-requests.md).

> [!TIP]
> An ABAP project is like a bookmark that also logs you in. The code doesn't live in the project folder on your PC: it stays in the SAP system, and ADT opens a window on it.

## Finding your way around

The ABAP perspective has a few views you'll use all the time:

| View                | What it shows                                                       |
| ------------------- | ------------------------------------------------------------------- |
| Project Explorer    | your projects, packages, and objects                                |
| Editor              | the source code of the object you opened                            |
| Outline             | the structure of the current object: types, data, methods           |
| Problems            | syntax errors and warnings of the last check                        |
| Properties          | package, author, language version, and other settings of the object |
| Transport Organizer | your transport requests                                             |
| ABAP Console        | the output of a class run as a console application                  |

To open any object, you don't need to browse the tree: press `Ctrl+Shift+A` (**Open ABAP Development Object**) and type part of its name, for example `SCARR` or `CL_SALV_TABLE`.

## Keyboard shortcuts

These shortcuts cover most of your daily work:

| Shortcut        | What it does                                                         |
| --------------- | -------------------------------------------------------------------- |
| `Ctrl+Shift+A`  | open a development object by name                                    |
| `Ctrl+Space`    | code completion                                                      |
| `Ctrl+1`        | quick fix: let ADT create a missing method or variable               |
| `F2`            | show the documentation and signature of the element under the cursor |
| `F3`            | navigate to the definition of the element under the cursor           |
| `Ctrl+F2`       | check the syntax                                                     |
| `Ctrl+F3`       | activate the current object                                          |
| `Ctrl+Shift+F3` | activate all inactive objects                                        |
| `Shift+F1`      | format the source code (the pretty printer)                          |
| `F8`            | run a report in the embedded SAP GUI                                 |
| `F9`            | run a class in the ABAP Console                                      |
| `F1`            | ABAP keyword documentation for the word under the cursor             |

`F1` is especially useful: the **ABAP keyword documentation** is the official reference of the language, and it opens right in the IDE.

> [!WARNING]
> Saving isn't activating. `Ctrl+S` saves an **inactive** version, and the system keeps running the old active version until you activate. Activate with `Ctrl+F3` when you want your change to count. You'll practice this in [Your first program](./0008-hello-world.md).

## Exercise

> [!IMPORTANT]
>
> 1. Install Eclipse and ADT, and create an ABAP project for your system.
> 2. Press `Ctrl+Shift+A`, open the database table `SCARR`, and look at its fields.
> 3. Put the cursor on the word `SELECT` in any program and press `F1`.

### Solution

1. **File > New > ABAP Project** (or **ABAP Cloud Project** on SAP BTP). After logon, the project appears in the Project Explorer with `$TMP` among the favorite packages.
2. ADT opens `SCARR` in a source-code editor: in recent releases the table definition is shown as text, with `mandt`, `carrid`, `carrname`, `currcode`, and `url`.
3. The ABAP keyword documentation opens on the `SELECT` statement, with its syntax, its additions, and examples.

> [!NOTE]
>
> - ADT is a set of Eclipse plug-ins for ABAP, installed from `https://tools.hana.ondemand.com/latest`.
> - An ABAP project is a connection to one system and client; the code stays in the system.
> - `Ctrl+Shift+A` opens any object, `F2` and `F3` explain and navigate, `F1` opens the keyword documentation.
> - `Ctrl+F2` checks, `Ctrl+F3` activates: saving alone doesn't activate.
> - CDS, RAP, and ABAP Cloud objects can be edited only in ADT.
