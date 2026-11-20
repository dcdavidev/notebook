---
title: Classic screens (Dynpro)
description: Screen Painter, dialog programs, and transaction codes.
---

_Intermediate level_

A **dynpro** (dynamic program) is a classic SAP GUI screen: the fields, buttons, and controls the user sees, plus a small piece of code that tells the system what to do before and after the screen is shown. Selection screens and ALV lists are dynpros too, generated for you. When you need a screen with your own layout, such as an entry form with several tabs, you draw it yourself.

Thousands of standard and custom transactions are built this way, so you'll meet dynpros in almost every on-premise system. New applications use Fiori, but you still need to read, fix, and extend classic screens.

## The parts of a screen

Every screen belongs to a program and has a four-digit number, for example `0100`. You edit it with the **Screen Painter** (transaction `SE51`, or from `SE80`). It has four parts:

| Part         | Content                                                                               |
| ------------ | ------------------------------------------------------------------------------------- |
| Attributes   | short description, screen type, next screen, cursor position                          |
| Layout       | the screen elements, drawn with the graphical Layout Editor                           |
| Element list | all elements with name, type, length, and properties; here you name the OK code field |
| Flow logic   | the code that runs before the screen is shown and after the user acts                 |

The screen type sets how it's used:

| Screen type      | Use                                               |
| ---------------- | ------------------------------------------------- |
| Normal           | a full screen                                     |
| Subscreen        | a part of a screen, shown inside a subscreen area |
| Modal dialog box | a popup window                                    |

> [!WARNING]
> ADT in Eclipse can't edit screens. When you open a screen from ADT, it starts the Screen Painter in an embedded SAP GUI. Keep SAP GUI installed if you work on dynpros.

## Dialog programs

Screens can belong to an executable program (report), a function group, or a **module pool**: a program of type M that you can't start with `F8`, only through a transaction code. A module pool with its screens is called a **dialog program**. By convention its name is `SAPMZ...` or `SAPMY...`, for example `SAPMZFLIGHT`.

When you create a module pool in `SE80` with a TOP include, the system creates the main program and its includes:

```abap
*&---------------------------------------------------------------------*
*& Module pool  SAPMZFLIGHT
*&---------------------------------------------------------------------*
INCLUDE mzflighttop.   " global data
INCLUDE mzflighto01.   " PBO modules
INCLUDE mzflighti01.   " PAI modules
INCLUDE mzflightf01.   " other code
```

The TOP include starts with `PROGRAM` instead of `REPORT` and holds the global data:

```abap
PROGRAM sapmzflight.

TABLES scarr.                  " work area for the screen fields SCARR-...

DATA ok_code TYPE sy-ucomm.    " function code of the button the user pressed
DATA gs_flight TYPE sflight.   " alternative: screen fields GS_FLIGHT-...
```

`TABLES` is obsolete everywhere except here: it declares a work area with the same name as a Dictionary structure, so screen fields that you take from the Dictionary match a program variable. A global structure declared with `DATA`, like `gs_flight`, works the same way.

## Drawing the layout

Create the screen with a right click on the program in `SE80`, then **Create > Screen**, number `0100`, type Normal. In the Layout Editor:

1. Click **Dictionary/Program Fields** (`F6`), enter `SCARR`, and pick the fields `CARRID`, `CARRNAME`, and `CURRCODE`. The editor places a label and an input field for each one.
2. Add a pushbutton with the text "Save" and the function code `SAVE`.
3. In the element list, give the last element, of type OK, the name `OK_CODE`.
4. Save and activate.

| Element                | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| Text field             | a fixed label                                     |
| Input/output field     | a field the program fills and the user can change |
| Checkbox, radio button | a choice                                          |
| Pushbutton             | triggers a function code                          |
| Box                    | a frame that groups elements                      |
| Subscreen area         | a place for a subscreen                           |
| Table control          | a scrollable table of input fields                |
| Custom control         | a place for a GUI control such as an ALV grid     |

The link between the screen and the program is the **name**: at runtime the system copies the value of the program variable `SCARR-CARRID` into the screen field `SCARR-CARRID` before display, and back after the user's input. How and when this happens is the topic of [flow logic](./0102-dynpro-flow-logic.en.md).

> [!TIP]
> The screen is a paper form and the program is the clerk. The form has boxes with labels; the clerk has drawers with the same labels. Before handing over the form, the clerk copies each drawer into its box; when the form comes back, the clerk copies each box back into its drawer.

## Starting the screen

From any program you call a screen with `CALL SCREEN`:

```abap
START-OF-SELECTION.
  CALL SCREEN 100.
```

To start a module pool, create a **dialog transaction** in `SE93`:

```text
SE93 > Transaction code: ZFLIGHT > Create
  Start object: Program and screen (dialog transaction)
  Program: SAPMZFLIGHT
  Screen number: 0100
  GUI support: SAP GUI for Windows (and HTML, Java if you need them)
```

Now the user types `ZFLIGHT` in the command field and the screen opens.

## Exercise

> [!IMPORTANT]
>
> 1. Create the module pool `SAPMZFLIGHT` with a TOP include and the global data shown above.
> 2. Create screen `0100` with the fields `SCARR-CARRID`, `SCARR-CARRNAME`, `SCARR-CURRCODE`, a "Save" button, and the OK code field `OK_CODE`.
> 3. Create the dialog transaction `ZFLIGHT` that starts screen `0100`, and run it.

### Solution

The objects are created in `SE80` and `SE93` as described in the lesson. The screen opens with three empty fields and a button. Pressing the button does nothing yet, and you leave with `/n` in the command field: the [flow logic](./0102-dynpro-flow-logic.en.md) and the [GUI status](./0104-gui-status-and-popups.en.md) add the behavior.

> [!NOTE]
>
> - A dynpro is a screen with attributes, layout, element list, and flow logic, edited in the Screen Painter (`SE51`/`SE80`).
> - A module pool (type M) is started only through a transaction code; with its screens it is a dialog program.
> - Screen fields and program variables are linked by name; `TABLES` is still used for Dictionary fields on screens.
> - Name the OK code field in the element list and declare a variable of type `sy-ucomm` for it.
> - Call a screen with `CALL SCREEN nnnn`, or create a dialog transaction in `SE93`.
