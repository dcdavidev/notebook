---
title: Input checks on screens
description: FIELD, CHAIN, error messages, and exit commands.
---

_Intermediate level_

A screen must not accept wrong data. Dynpros check input in two ways: some checks run **automatically** before PAI, and the others you write in PAI modules with the flow logic statements `FIELD` and `CHAIN`. Both send an error message and keep the user on the screen until the input is right, with only the wrong fields open for correction.

This lesson builds on [flow logic](./0102-dynpro-flow-logic.en.md). The same ideas apply to selection screens, where you check input in `AT SELECTION-SCREEN` (see [report events](./0066-report-events.en.md)).

## Automatic checks

Before the first PAI module runs, the system checks:

- **Required fields**: fields with the attribute Required (shown with a check mark) must be filled.
- **Format**: a date field must contain a valid date, a numeric field a number.
- **Dictionary checks** for fields taken from the Dictionary: the value must exist in the check table of the [foreign key](./0047-foreign-keys-and-check-tables.en.md) or in the fixed values of the domain.

You write no code for these checks. If one fails, the system shows an error message and the screen again, before any of your modules run.

## FIELD: check one field

Without `FIELD`, all screen fields are copied to the program at the start of PAI. With `FIELD`, a field is copied only when the flow logic reaches its `FIELD` statement, and the module after it can check it:

```abap
PROCESS AFTER INPUT.
  FIELD scarr-carrid MODULE check_carrid.
  MODULE user_command_0100.
```

```abap
MODULE check_carrid INPUT.
  SELECT SINGLE carrname FROM scarr
    WHERE carrid = @scarr-carrid
    INTO @scarr-carrname.
  IF sy-subrc <> 0.
    MESSAGE |Airline { scarr-carrid } doesn't exist| TYPE 'E'.
  ENDIF.
ENDMODULE.
```

An error message (type `E`) in a module called by `FIELD` stops PAI and shows the screen again: all fields are closed except `SCARR-CARRID`, with the cursor on it. When the user corrects the value and presses Enter, PAI starts again from the beginning.

| Message type | Effect in a PAI check                                   |
| ------------ | ------------------------------------------------------- |
| `E` error    | PAI stops; only the checked fields are open for input   |
| `W` warning  | like `E`, but Enter accepts the value and PAI continues |
| `I` info     | a popup; PAI continues                                  |
| `S` success  | a message in the status bar; PAI continues              |

Two additions limit when the module runs:

- `FIELD f MODULE m ON INPUT.` runs `m` only if the field isn't initial.
- `FIELD f MODULE m ON REQUEST.` runs `m` only if the user typed something into the field in this round trip.

> [!WARNING]
> Never send an error message from a PAI module that isn't under `FIELD` or `CHAIN`. The screen comes back with **all** fields closed, and the user can only leave the transaction.

## CHAIN: check several fields together

When a check involves more than one field, put them in a `CHAIN` block. If the module sends an error, all the fields in the chain are open again.

```abap
PROCESS AFTER INPUT.
  FIELD scarr-carrid MODULE check_carrid.

  CHAIN.
    FIELD: gv_date_from, gv_date_to.
    MODULE check_dates ON CHAIN-REQUEST.
  ENDCHAIN.

  MODULE user_command_0100.
```

```abap
MODULE check_dates INPUT.
  IF gv_date_to < gv_date_from.
    MESSAGE 'The end date is before the start date' TYPE 'E'.
  ENDIF.
ENDMODULE.
```

`ON CHAIN-REQUEST` runs the module if the user changed at least one field of the chain; `ON CHAIN-INPUT` if at least one isn't initial. Without an addition, the module always runs.

> [!TIP]
> `CHAIN` is like a cashier who checks the date and the amount on a check together. If they don't fit, you get back the whole check to fix, not just one box.

## Exit commands

The automatic checks have a downside: if a required field is empty, the user can't even cancel. To let them leave, give the cancel functions the **function type** `E` (exit command), in the GUI status or in the attributes of a pushbutton, and handle them in a module with `AT EXIT-COMMAND`:

```abap
PROCESS AFTER INPUT.
  MODULE exit_0100 AT EXIT-COMMAND.        " always first
  FIELD scarr-carrid MODULE check_carrid.
  MODULE user_command_0100.
```

```abap
MODULE exit_0100 INPUT.
  CASE ok_code.
    WHEN 'CANCEL' OR 'EXIT'.
      CLEAR ok_code.
      LEAVE TO SCREEN 0.
  ENDCASE.
ENDMODULE.
```

The `AT EXIT-COMMAND` module runs **before** the automatic checks and before the data transport: only the OK code reaches the program, and the other fields still have their old values. If the module doesn't leave the screen, PAI continues normally with the checks.

## Exercise

> [!IMPORTANT]
>
> 1. On screen `0100` of `SAPMZFLIGHT`, add the required field `SCARR-CARRID` and two date fields `GV_DATE_FROM` and `GV_DATE_TO` (declared in the TOP include with type `d`).
> 2. Check the airline with `FIELD` and the dates with `CHAIN`.
> 3. Add a "Cancel" button with function code `CANCEL` and function type `E` that leaves the screen even when the fields are empty.

### Solution

```abap
PROCESS BEFORE OUTPUT.
  MODULE fill_fields_0100.

PROCESS AFTER INPUT.
  MODULE exit_0100 AT EXIT-COMMAND.

  FIELD scarr-carrid MODULE check_carrid.

  CHAIN.
    FIELD: gv_date_from, gv_date_to.
    MODULE check_dates ON CHAIN-REQUEST.
  ENDCHAIN.

  MODULE user_command_0100.
```

The modules `exit_0100`, `check_carrid`, and `check_dates` are the ones shown in the lesson.

> [!NOTE]
>
> - Required fields, formats, check tables, and fixed values are checked automatically before PAI.
> - `FIELD f MODULE m` copies the field late and checks it; an error reopens only that field.
> - `CHAIN ... ENDCHAIN` groups fields for a common check; an error reopens them all.
> - Send `E` and `W` messages only from modules under `FIELD` or `CHAIN`.
> - Exit commands (function type `E`) with `MODULE ... AT EXIT-COMMAND` let the user leave before any check runs.
