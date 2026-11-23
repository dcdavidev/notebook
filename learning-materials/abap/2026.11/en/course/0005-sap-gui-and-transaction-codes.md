---
title: SAP GUI and transaction codes
description: Log on, move around, and open the transactions a developer uses every day.
level: beginner
---

**SAP GUI** is the classic desktop client for SAP systems. Even if you write most of your code in Eclipse, you'll use SAP GUI every day: to run programs, look at data, read dumps, and open the many tools that exist only there.

Everything in SAP GUI is reached through **transaction codes**: short names such as `SE38` or `SE11` that open one specific application. Learning to move with transaction codes is the fastest way to find your way around a system.

## Logging on

SAP GUI starts with **SAP Logon**, a small window with the list of systems you can connect to. Your administrator gives you the connection data (or a ready-made list). Double-click a system to open the logon screen, and fill in:

| Field    | Meaning                                             |
| -------- | --------------------------------------------------- |
| Client   | the three-digit client number, for example `100`    |
| User     | your user name in that system                       |
| Password | your password (you'll change it at the first logon) |
| Language | the logon language, for example `EN` or `IT`        |

The logon language decides the language of menus, texts, and messages. You can log on to the same system in different languages and see the same programs with different texts. You met clients in [System landscape and clients](./0004-system-landscape-and-clients.md).

## The SAP GUI window

After logon you see the **SAP Easy Access** menu. Every SAP GUI screen has the same parts:

```text
+----------------------------------------------------------------+
| Menu bar             Menu, Edit, Favorites, Extras, System     |
| Standard toolbar     [command field] [Save] [Back] [Exit] ...  |
| Title bar            the name of the current screen            |
| Application toolbar  buttons of the current application        |
|                                                                |
| Screen area          fields, lists, and trees                  |
|                                                                |
| Status bar           messages and system information           |
+----------------------------------------------------------------+
```

- The **command field** is the input field at the top left of the standard toolbar. You type transaction codes there.
- The **status bar** at the bottom shows messages: green for success, yellow for warnings, red for errors. Read it whenever something doesn't work.
- **System > Status** shows where you are: the transaction, the program, the screen number, the client, and the release.

A few function keys work almost everywhere:

| Key        | What it does                          |
| ---------- | ------------------------------------- |
| `Enter`    | confirm the input                     |
| `F1`       | help on the field where the cursor is |
| `F3`       | back to the previous screen           |
| `Shift+F3` | exit the current application          |
| `F12`      | cancel without saving                 |
| `F4`       | list of possible values for the field |
| `F8`       | execute (run a report, for example)   |
| `Ctrl+S`   | save                                  |

## Transaction codes

A **transaction code** is the name of an entry point into an application. You type it in the command field and press Enter. The command field also accepts a few prefixes:

| Input    | What it does                                           |
| -------- | ------------------------------------------------------ |
| `SE38`   | opens `SE38`, only from the Easy Access menu           |
| `/nSE38` | ends the current transaction and opens `SE38`          |
| `/oSE38` | opens `SE38` in a new window (a new **session**)       |
| `/n`     | ends the current transaction and goes back to the menu |
| `/i`     | closes the current session                             |
| `/nend`  | logs off, after asking for confirmation                |

You can keep several sessions open at the same time (six by default), for example the editor in one and the data browser in another.

> [!WARNING]
> `/n` ends the current transaction **without saving**. If you have unsaved changes in an editor, they're lost. Save first, or open the new transaction in another session with `/o`.

> [!TIP]
> Transaction codes are like the speed dial on a phone. You can always browse the contacts (the Easy Access menu tree), but once you know the number, one short code takes you straight there.

## Transactions for developers

These are the transactions you'll use most as an ABAP developer. Add the ones you use often to your **Favorites** (right-click **Favorites > Insert transaction**).

| Transaction | What it opens                                                   |
| ----------- | --------------------------------------------------------------- |
| `SE80`      | Object Navigator: the whole ABAP Workbench in one tree          |
| `SE38`      | ABAP Editor: create and run programs                            |
| `SE11`      | ABAP Dictionary: tables, data elements, domains, types          |
| `SE24`      | Class Builder: global classes and interfaces                    |
| `SE37`      | Function Builder: function modules                              |
| `SE91`      | message classes                                                 |
| `SE93`      | transaction codes: display or create them                       |
| `SE16N`     | data browser: look at the contents of a table                   |
| `SE09`      | Transport Organizer: your transport requests                    |
| `ST22`      | runtime errors (short dumps)                                    |
| `SU3`       | your own user settings: date format, decimal notation, defaults |

To find out which transaction opens a screen, look at **System > Status**. To see the transaction codes in the Easy Access menu tree, turn on **Extras > Settings > Display technical names**.

## Exercise

> [!IMPORTANT]
>
> 1. Log on to your system and turn on the display of technical names in the Easy Access menu.
> 2. Open `SE38` with `/nSE38`, then open `SE11` in a second session with `/oSE11`.
> 3. Add `SE38`, `SE11`, and `SE80` to your Favorites.

### Solution

1. **Extras > Settings**, check **Display technical names**, and confirm: each menu entry now shows its transaction code.
2. `/nSE38` replaces the current screen with the ABAP Editor; `/oSE11` opens a new SAP GUI window with the ABAP Dictionary, while the first window stays on `SE38`.
3. Right-click **Favorites**, choose **Insert transaction**, type the transaction code, and confirm. Repeat for each one.

> [!NOTE]
>
> - SAP GUI is the classic client: SAP Logon lists the systems, the logon screen asks for client, user, password, and language.
> - The command field accepts transaction codes, with `/n` (same session) and `/o` (new session).
> - The status bar shows messages; **System > Status** shows where you are.
> - `SE80`, `SE38`, `SE11`, `SE24`, `SE37`, `SE16N`, and `ST22` are the developer's everyday transactions.
> - Save before you use `/n`: it leaves the transaction without saving.
