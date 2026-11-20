---
title: GUI status, titles, and popups
description: Menus, toolbars, function keys, and confirmation dialogs.
---

_Intermediate level_

A screen without a **GUI status** has gray Back and Exit buttons and no menu: the user is stuck. The GUI status defines the menu bar, the toolbars, and the function keys of a screen, and links each of them to a function code that arrives in the [OK code](./0102-dynpro-flow-logic.en.md). The **title** is the text in the window's title bar.

This lesson shows how to build both with the **Menu Painter**, and how to ask the user for a confirmation with a standard popup.

## The parts of a GUI status

You create a GUI status in the Menu Painter (transaction `SE41`, or in `SE80` with a right click on the program, **Create > GUI Status**). It has these parts:

| Part                | Content                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| Menu bar            | up to six menus with entries, for example Flight, Edit, Goto             |
| Standard toolbar    | the fixed icons at the top: Enter, Save, Back, Exit, Cancel, Print, Find |
| Application toolbar | your own buttons, with text and icon, under the title                    |
| Function keys       | the keys `F1`–`F12`, `Shift+F1`–`Shift+F12`, `Ctrl+...` and their codes  |

Every button and menu entry is a **function code** (up to 20 characters, usually in uppercase): the same code can appear in a menu, a toolbar, and a function key at once. The usual codes for the standard toolbar are:

| Icon   | Key        | Function code | Function type        |
| ------ | ---------- | ------------- | -------------------- |
| Save   | `Ctrl+S`   | `SAVE`        | normal               |
| Back   | `F3`       | `BACK`        | normal or `E` (exit) |
| Exit   | `Shift+F3` | `EXIT`        | `E` (exit command)   |
| Cancel | `F12`      | `CANCEL`      | `E` (exit command)   |

Give the function type `E` to the codes that must work even when the input is wrong, and handle them in a module `AT EXIT-COMMAND` (see [input checks](./0103-dynpro-input-checks.en.md)).

> [!TIP]
> The GUI status is the dashboard of a car: the same command, like turning on the lights, can sit on a lever, a button, and a voice command. Whatever the driver uses, the car receives the same signal.

## Setting the status and the title

Set both in a PBO module. The status stays active until you set another one.

```abap
MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.
  SET TITLEBAR 'TITLE_0100' WITH scarr-carrid.   " &1 in the title text
ENDMODULE.
```

You create the title in `SE80` (**Create > GUI Title**) or with a double click on its name. Placeholders `&1`–`&9` in the text are replaced by the values after `WITH`, for example "Airline &1".

To deactivate some functions on a screen, exclude them at runtime:

```abap
DATA lt_excluded TYPE STANDARD TABLE OF sy-ucomm WITH EMPTY KEY.

IF gv_display_only = abap_true.
  lt_excluded = VALUE #( ( 'SAVE' ) ( 'DELETE' ) ).
ENDIF.
SET PF-STATUS 'STATUS_0100' EXCLUDING lt_excluded.
```

Excluded functions are grayed out or hidden. Use this instead of creating a second status that differs by one button.

Reports can use their own status too: `SET PF-STATUS` in `START-OF-SELECTION` changes the toolbar of the list, and the function codes arrive in `AT USER-COMMAND`.

## Confirmation popups

The function module `POPUP_TO_CONFIRM` shows a standard dialog with a question and two or three buttons.

```abap
DATA lv_answer TYPE c LENGTH 1.

CALL FUNCTION 'POPUP_TO_CONFIRM'
  EXPORTING
    titlebar              = 'Leave the transaction'
    text_question         = 'Your changes will be lost. Do you want to save them?'
    text_button_1         = 'Save'
    icon_button_1         = 'ICON_SYSTEM_SAVE'
    text_button_2         = 'Discard'
    default_button        = '1'
    display_cancel_button = abap_true
  IMPORTING
    answer                = lv_answer
  EXCEPTIONS
    text_not_found        = 1
    OTHERS                = 2.

CASE lv_answer.
  WHEN '1'.                      " Save
    go_app->save( ).             " your save logic
    LEAVE TO SCREEN 0.
  WHEN '2'.                      " Discard
    LEAVE TO SCREEN 0.
  WHEN 'A'.                      " Cancel: stay on the screen
ENDCASE.
```

Call the popup only when there are unsaved changes: a popup that always appears soon gets clicked away without reading.

> [!WARNING]
> Popups need a user in front of SAP GUI. In a background job or an RFC call without a GUI, a popup makes the program fail. Never call one from code that can run in the background.

## Your own dialog box

When the standard popups aren't enough, draw a screen with the type **Modal dialog box** and call it with a position and a size:

```abap
CALL SCREEN 200 STARTING AT 10 5 ENDING AT 70 12.
```

Give it a GUI status of type **Dialog box**, which has only an application toolbar at the bottom, and leave it with `LEAVE TO SCREEN 0`.

## Exercise

> [!IMPORTANT]
>
> 1. Create the GUI status `STATUS_0100` for `SAPMZFLIGHT` with Save (`SAVE`), Back (`BACK`), Exit (`EXIT`, type `E`), and Cancel (`CANCEL`, type `E`), and a title `TITLE_0100` with the text "Airline &1".
> 2. Set both in the PBO of screen `0100`.
> 3. On `BACK`, ask with `POPUP_TO_CONFIRM` whether the user really wants to leave; leave only if the answer is `'1'`.

### Solution

```abap
MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.
  SET TITLEBAR 'TITLE_0100' WITH scarr-carrid.
ENDMODULE.

MODULE user_command_0100 INPUT.
  gv_save_ok = ok_code.
  CLEAR ok_code.
  CASE gv_save_ok.
    WHEN 'BACK'.
      CALL FUNCTION 'POPUP_TO_CONFIRM'
        EXPORTING
          text_question         = 'Do you really want to leave?'
          display_cancel_button = abap_false
        IMPORTING
          answer                = gv_answer          " global, TYPE c LENGTH 1
        EXCEPTIONS
          OTHERS                = 1.
      IF gv_answer = '1'.
        LEAVE TO SCREEN 0.
      ENDIF.
  ENDCASE.
ENDMODULE.
```

> [!NOTE]
>
> - A GUI status (`SE41`) defines the menu bar, the standard and application toolbars, and the function keys.
> - Every element triggers a function code; give type `E` to the codes that must bypass the input checks.
> - Set status and title in PBO with `SET PF-STATUS` and `SET TITLEBAR ... WITH`; hide functions with `EXCLUDING`.
> - `POPUP_TO_CONFIRM` asks a question and returns `'1'`, `'2'`, or `'A'` (cancel).
> - Never show popups in code that can run in the background.
