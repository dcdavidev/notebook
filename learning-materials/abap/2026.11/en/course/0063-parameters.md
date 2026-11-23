---
title: 'Selection screens: PARAMETERS'
description: Input fields, checkboxes, radio buttons, and list boxes.
level: basic
---

Most reports start by asking the user what to do: which airline, which date, show a list or a grid. The screen where they enter these values is the **selection screen**. In a report, you don't draw it: you declare its fields in the code, and the system builds the screen for you.

`PARAMETERS` declares a single input field. Its additions turn it into a mandatory field, a checkbox, a group of radio buttons, or a list box.

## Your first parameter

```abap
REPORT zparameters_demo.

PARAMETERS p_carr TYPE s_carr_id.

START-OF-SELECTION.
  WRITE: / 'You chose', p_carr.
```

Run the report: before `START-OF-SELECTION`, the system shows a selection screen with one field. When the user presses **Execute** (F8), the value is in `p_carr` and the program continues.

- A parameter is a global variable that the selection screen fills.
- Its name can have at most **8 characters**. The `p_` prefix is the usual convention.
- Typed with a data element such as `S_CARR_ID`, the field gets the F4 help, the F1 documentation, and, with a selection text, the label of the data element (see [Text symbols and translation](./0062-text-symbols-and-translation.md)).

> [!TIP]
> A selection screen is like the form at a hotel reception. Before you get your key, you fill in name, dates, and room type. The receptionist (the program) starts working only after you hand in the form.

## Useful additions

```abap
PARAMETERS:
  p_carr  TYPE s_carr_id OBLIGATORY DEFAULT 'LH',   " required, with a default
  p_date  TYPE s_date DEFAULT sy-datum,             " today's date
  p_max   TYPE i DEFAULT 100,
  p_city  TYPE s_city LOWER CASE,                   " keep lowercase letters
  p_conn  TYPE spfli-connid MEMORY ID con,          " SAP memory parameter
  p_carr2 TYPE spfli-carrid VALUE CHECK.            " checked against SCARR
```

| Addition        | Effect                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OBLIGATORY`    | the user can't execute the report with the field empty                                                                     |
| `DEFAULT val`   | the initial value; can be a literal or a system field such as `sy-datum`                                                   |
| `LOWER CASE`    | keeps lowercase letters; without it, input is converted to uppercase                                                       |
| `MEMORY ID pid` | proposes and stores the value in SAP memory under a parameter ID (see [SAP memory](./0072-calling-programs-and-memory.md)) |
| `VALUE CHECK`   | checks the input against the check table or fixed values of a Dictionary field                                             |
| `NO-DISPLAY`    | the field isn't shown; useful when another program fills it with `SUBMIT`                                                  |

`VALUE CHECK` works only when the type refers to a table field with a foreign key, such as `spfli-carrid`: the system then rejects an airline that isn't in `SCARR`.

> [!WARNING]
> Without `LOWER CASE`, everything the user types is converted to uppercase. That's what you want for codes such as `LH`, but it breaks searches on names or email addresses. Add `LOWER CASE` to free-text fields.

## Checkboxes

`AS CHECKBOX` turns a parameter into a checkbox. The parameter has type `c` of length 1: `'X'` (`abap_true`) when it's selected, blank when it isn't.

```abap
PARAMETERS p_test AS CHECKBOX DEFAULT 'X'.   " test run

START-OF-SELECTION.
  IF p_test = abap_true.
    WRITE: / 'Test run: nothing is saved'.
  ENDIF.
```

## Radio buttons

`RADIOBUTTON GROUP` creates a group of radio buttons: the user can select exactly one of them. All buttons of the group share the same group name, of at most 4 characters. The first one is selected unless you set `DEFAULT 'X'` on another.

```abap
PARAMETERS:
  p_list RADIOBUTTON GROUP out DEFAULT 'X',
  p_alv  RADIOBUTTON GROUP out,
  p_file RADIOBUTTON GROUP out.

START-OF-SELECTION.
  CASE abap_true.
    WHEN p_list. WRITE: / 'Output as a list'.
    WHEN p_alv.  WRITE: / 'Output as a grid'.
    WHEN p_file. WRITE: / 'Output to a file'.
  ENDCASE.
```

`CASE abap_true` with `WHEN p_...` is a common, readable way to find the selected button.

## List boxes

`AS LISTBOX VISIBLE LENGTH n` shows a drop-down list. If the parameter's type is a data element whose domain has fixed values, the list is filled from them automatically. Otherwise, you fill it with the function module `VRM_SET_VALUES` before the screen is displayed, in the event `AT SELECTION-SCREEN OUTPUT` (see [Report events](./0066-report-events.md)):

```abap
PARAMETERS p_class TYPE s_class AS LISTBOX VISIBLE LENGTH 15 DEFAULT 'Y'.

AT SELECTION-SCREEN OUTPUT.
  DATA(lt_values) = VALUE vrm_values( ( key = 'Y' text = 'Economy' )
                                      ( key = 'C' text = 'Business' )
                                      ( key = 'F' text = 'First' ) ).
  CALL FUNCTION 'VRM_SET_VALUES'
    EXPORTING
      id     = 'P_CLASS'                   " the parameter name, in uppercase
      values = lt_values.

START-OF-SELECTION.
  WRITE: / 'Class:', p_class.
```

The user sees the texts; the parameter receives the key. Blocks, frames, and other layout options are covered in [Selection screen layout](./0065-selection-screen-layout.md).

## Exercise

> [!IMPORTANT]
>
> 1. Write a report with a mandatory airline parameter (default `LH`), a parameter for the maximum number of rows (default 20), and a checkbox "only flights with free seats".
> 2. Read `SFLIGHT` with these values and print the result.

### Solution

```abap
REPORT zparameters_exercise.

PARAMETERS:
  p_carr TYPE s_carr_id OBLIGATORY DEFAULT 'LH',
  p_max  TYPE i DEFAULT 20,
  p_free AS CHECKBOX.

START-OF-SELECTION.
  SELECT connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid = @p_carr
    ORDER BY fldate
    INTO TABLE @DATA(lt_flights)
    UP TO @p_max ROWS.

  LOOP AT lt_flights INTO DATA(ls_flight).
    IF p_free = abap_true AND ls_flight-seatsocc >= ls_flight-seatsmax.
      CONTINUE.
    ENDIF.
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc, ls_flight-seatsmax.
  ENDLOOP.
```

Because the loop filters after the `SELECT`, fewer than `p_max` rows may appear. To avoid that, run a second `SELECT` with `AND seatsocc < seatsmax` in the `WHERE` when the checkbox is selected.

> [!NOTE]
>
> - `PARAMETERS` declares one input field on the selection screen; the name has at most 8 characters.
> - Type parameters with data elements to get F1, F4, and translated labels.
> - `OBLIGATORY`, `DEFAULT`, `LOWER CASE`, `MEMORY ID`, and `VALUE CHECK` control input and defaults.
> - `AS CHECKBOX` gives `'X'` or blank; `RADIOBUTTON GROUP` lets the user pick exactly one option.
> - `AS LISTBOX` uses domain fixed values or a list filled with `VRM_SET_VALUES`.
