---
title: Your first program
description: Create, check, activate, and run a report that says hello.
---

_Beginner level_

Time to write code. Your first program is a **report**, also called an **executable program**: a program that you start directly and that shows its output on the screen. It says hello, and on the way you go through the cycle you'll repeat for every object you ever write in ABAP: **create, save, check, activate, run**.

You can follow the steps in ADT or in SAP GUI: both are shown below.

## Create the program in ADT

1. In the Project Explorer, right-click your package (`$TMP` or `$ZTRAINING`, from [Packages and transport requests](./0007-packages-and-transport-requests.md)) and choose **New > ABAP Program**.
2. Enter the name `ZHELLO_WORLD` and the description "My first program", then press **Next**.
3. For a local package there's no transport request to choose: press **Finish**.

ADT opens the editor with one line already in it:

```abap
REPORT zhello_world.
```

`REPORT` is the first statement of every executable program, followed by the program name. Now add the output:

```abap
REPORT zhello_world.

WRITE 'Hello, world!'.
```

## Create the program in SAP GUI

1. Open transaction `SE38` (the ABAP Editor).
2. Type `ZHELLO_WORLD` in the **Program** field and press **Create**.
3. In the **Attributes** dialog, enter the title "My first program" and choose the type **Executable program**. Press **Save**.
4. When the system asks for a package, enter `$TMP` or press **Local Object**.
5. The editor opens with the `REPORT` statement. Add the `WRITE` statement below it.

Both ways create the same object in the same system: you can create a program in SAP GUI and open it in ADT, or the other way round.

## Check, activate, and run

| Step     | ADT       | SAP GUI (`SE38`) | What it does                                            |
| -------- | --------- | ---------------- | ------------------------------------------------------- |
| Save     | `Ctrl+S`  | `Ctrl+S`         | stores the source as an inactive version                |
| Check    | `Ctrl+F2` | `Ctrl+F2`        | runs the syntax check and lists the errors              |
| Activate | `Ctrl+F3` | `Ctrl+F3`        | checks again and generates the active, runnable version |
| Run      | `F8`      | `F8`             | executes the active version                             |

When you run it, the program shows a **list** screen with one line:

```text
Hello, world!
```

Press `F3` to go back to the editor.

> [!TIP]
> Saving, checking, and activating are like writing a letter, proofreading it, and putting it in the mailbox. A saved draft stays on your desk; only the letter you post (the active version) reaches anyone else.

## When the check finds an error

Remove the period at the end of the `WRITE` statement and press `Ctrl+F2`. The check stops with an error like this:

```text
The last statement is not complete (period missing).
```

ADT shows it in the **Problems** view and marks the line with a red icon; in SAP GUI it appears at the bottom of the editor. Double-click the message to jump to the line. Put the period back, check again, and activate.

> [!WARNING]
> An object with syntax errors can be saved but not activated. If you leave it like that, the **active** version is still the old one, and that's what everybody else runs. The editor shows "inactive" next to the name until you activate successfully.

## On SAP BTP: a console class

In the SAP BTP ABAP environment and other ABAP Cloud systems there are no reports and no `WRITE` lists. The usual first program there is a class that writes to the **ABAP Console** in ADT. Create it with **New > ABAP Class**, name `ZCL_HELLO_WORLD`, and replace the generated code with:

```abap
CLASS zcl_hello_world DEFINITION
  PUBLIC FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_hello_world IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    out->write( 'Hello, world!' ).
  ENDMETHOD.
ENDCLASS.
```

Activate it with `Ctrl+F3` and run it with `F9`: the text appears in the ABAP Console view. Don't worry about `CLASS`, `METHOD`, and `INTERFACES` yet: classes start in [Classes and objects](./0076-classes-and-objects.md). Until then, the lessons use reports, and you can paste the same statements into the `main` method when a lesson's code doesn't use `WRITE`.

## Exercise

> [!IMPORTANT]
>
> 1. Create, activate, and run `ZHELLO_WORLD`.
> 2. Add a second `WRITE` statement with your name, activate, and run again.
> 3. Remove a quote from one of the texts, check the program, and read the error message.

### Solution

```abap
REPORT zhello_world.

WRITE 'Hello, world!'.
WRITE 'My name is Ada.'.
```

Both texts appear on the same line, separated by a space: `WRITE` continues on the current line until you ask for a new one, as you'll see in [Output with WRITE](./0011-output-with-write.md). Without the closing quote, the check reports an error like "Literals that take up more than one line are not permitted": the literal never ends.

> [!NOTE]
>
> - A report (executable program) starts with `REPORT name.` and runs with `F8`.
> - Create programs in ADT (**New > ABAP Program**) or in `SE38`; both work on the same object.
> - The cycle is always the same: save, check (`Ctrl+F2`), activate (`Ctrl+F3`), run.
> - An object with errors stays inactive; everyone else keeps running the old active version.
> - In ABAP Cloud, the first program is a class with `if_oo_adt_classrun`, run with `F9`.
