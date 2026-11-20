---
title: 'Flow logic: PBO and PAI'
description: Modules, OK codes, and the round trip between screen and program.
---

_Intermediate level_

A [dynpro](./0101-dynpro-basics.en.md) doesn't run ABAP directly. It has its own small language, the **flow logic**, which calls ABAP **modules** at two moments: before the screen is shown and after the user acts. Understanding this round trip is the key to every classic screen.

## The two events

The flow logic of a screen has two blocks:

- **PBO** (Process Before Output) runs before the screen is sent to the user. Here you set the GUI status and the title, fill fields, and change field attributes.
- **PAI** (Process After Input) runs when the user presses Enter, a button, a menu entry, or a function key. Here you read the input and decide what happens next.

```abap
PROCESS BEFORE OUTPUT.
  MODULE status_0100.
  MODULE fill_fields_0100.

PROCESS AFTER INPUT.
  MODULE user_command_0100.
```

The flow logic isn't ABAP: it knows only a few statements such as `MODULE`, `FIELD`, `CHAIN`, `LOOP`, and `CALL SUBSCREEN`. You write it in the Flow Logic tab of the Screen Painter. Double-click a module name that doesn't exist yet, and the system offers to create it in the right include.

## Modules

A module is a block of ABAP code that the flow logic calls. `OUTPUT` modules are for PBO, `INPUT` modules for PAI.

```abap
MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.
  SET TITLEBAR 'TITLE_0100'.
ENDMODULE.

MODULE fill_fields_0100 OUTPUT.
  IF scarr-carrid IS INITIAL.
    scarr-carrid = 'LH'.                   " default value
  ENDIF.
ENDMODULE.
```

Modules have no parameters and no local data: a `DATA` statement inside a module declares a **global** variable. Keep modules short and call methods of a class for the real work.

> [!WARNING]
> Don't use inline declarations like `DATA(lv_x)` inside modules. They look local but they are global variables of the program, visible and still filled in every other module.

## The OK code and the PAI module

When the user triggers a function, the system writes its **function code** into the OK code field of the screen. During the data transport it reaches the program variable with the same name, `ok_code`. The usual pattern copies it and clears it at once, so an old value never triggers a function again:

```abap
" TOP include
DATA ok_code    TYPE sy-ucomm.
DATA gv_save_ok TYPE sy-ucomm.

" PAI include
MODULE user_command_0100 INPUT.
  gv_save_ok = ok_code.
  CLEAR ok_code.

  CASE gv_save_ok.
    WHEN 'BACK' OR 'EXIT' OR 'CANCEL'.
      LEAVE TO SCREEN 0.                   " back to where CALL SCREEN was
    WHEN 'READ'.
      SELECT SINGLE * FROM scarr
        WHERE carrid = @scarr-carrid
        INTO @scarr.
      IF sy-subrc <> 0.
        MESSAGE 'Airline not found' TYPE 'S' DISPLAY LIKE 'E'.
      ENDIF.
    WHEN 'DETAIL'.
      CALL SCREEN 200.                     " a new screen on top of this one
    WHEN OTHERS.
      " Enter: nothing to do, the screen is shown again
  ENDCASE.
ENDMODULE.
```

Pressing Enter sends an empty function code, unless you assign a code to Enter in the GUI status. The system field `sy-ucomm` also holds the function code, but read it only through the OK code field: `sy-ucomm` isn't reliable in every situation.

## The round trip

```text
CALL SCREEN 100
  PBO modules run
  data transport: program fields -> screen fields
  the screen is shown, the user enters data and presses a key
  data transport: screen fields -> program fields (and the OK code)
  PAI modules run
  next screen:
    100 -> PBO of screen 100 again
    200 -> PBO of screen 200
    0   -> back to the statement after CALL SCREEN
```

> [!TIP]
> It's a tennis rally. PBO is the program serving the ball to the user; PAI is the user hitting it back. The rally goes on until someone sets the next screen to 0.

Where the program goes after PAI depends on the **next screen**. It is a static attribute of the screen (by default the screen itself), and you can change it at runtime:

| Statement              | Effect                                                   |
| ---------------------- | -------------------------------------------------------- |
| `SET SCREEN 200.`      | sets the next screen; the current PAI module continues   |
| `LEAVE SCREEN.`        | ends the current screen and goes to the next screen      |
| `LEAVE TO SCREEN 200.` | the two above in one statement                           |
| `LEAVE TO SCREEN 0.`   | ends the screen sequence and returns after `CALL SCREEN` |
| `CALL SCREEN 200.`     | starts a new screen sequence on top of the current one   |
| `LEAVE PROGRAM.`       | ends the whole program                                   |

Every `CALL SCREEN` opens a new level, and `LEAVE TO SCREEN 0` closes it. If you keep calling screens without leaving them, the levels pile up until the program stops with a runtime error.

## Exercise

> [!IMPORTANT]
>
> 1. In the module pool `SAPMZFLIGHT` from the previous lesson, add two pushbuttons to screen `0100`: "Read" with function code `READ` and "Exit" with function code `EXIT`.
> 2. Write the PBO module that proposes `LH` as airline, and the PAI module that reads the airline from `SCARR` on `READ` and leaves on `EXIT`.

### Solution

```abap
" Flow logic of screen 0100
PROCESS BEFORE OUTPUT.
  MODULE fill_fields_0100.

PROCESS AFTER INPUT.
  MODULE user_command_0100.
```

```abap
MODULE fill_fields_0100 OUTPUT.
  IF scarr-carrid IS INITIAL.
    scarr-carrid = 'LH'.
  ENDIF.
ENDMODULE.

MODULE user_command_0100 INPUT.
  gv_save_ok = ok_code.
  CLEAR ok_code.
  CASE gv_save_ok.
    WHEN 'EXIT'.
      LEAVE PROGRAM.
    WHEN 'READ'.
      SELECT SINGLE * FROM scarr WHERE carrid = @scarr-carrid INTO @scarr.
      IF sy-subrc <> 0.
        CLEAR: scarr-carrname, scarr-currcode.
        MESSAGE 'Airline not found' TYPE 'S' DISPLAY LIKE 'E'.
      ENDIF.
  ENDCASE.
ENDMODULE.
```

> [!NOTE]
>
> - PBO runs before the screen is shown, PAI after the user's action; the flow logic calls `OUTPUT` and `INPUT` modules.
> - Fields with the same name are copied from program to screen after PBO and from screen to program before PAI.
> - Copy the OK code into a save variable and clear it at the start of the PAI module.
> - Modules have no local data: everything you declare in them is global.
> - Control the next screen with `SET SCREEN`, `LEAVE TO SCREEN`, `CALL SCREEN`, and return with `LEAVE TO SCREEN 0`.
