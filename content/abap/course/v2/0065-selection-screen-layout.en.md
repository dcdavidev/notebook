---
title: Selection screen layout
description: Blocks, frames, comments, and dynamic screen changes.
---

_Basic level_

With [`PARAMETERS`](./0063-parameters.en.md) and [`SELECT-OPTIONS`](./0064-select-options-and-ranges.en.md) you get working input fields, but the runtime stacks them one below the other. As soon as a report has more than three or four fields, the screen gets hard to read.

The `SELECTION-SCREEN` statement lets you arrange the fields: group them in framed blocks, add comments and empty lines, put several fields on one line, and show or hide fields while the user works.

## Blocks and frames

A **block** groups related fields. With `WITH FRAME` the block gets a border, and with `TITLE` the border gets a title, usually a [text symbol](./0062-text-symbols-and-translation.en.md).

```abap
REPORT zflight_selection.

DATA gv_carrid TYPE s_carr_id.
DATA gv_fldate TYPE s_date.

SELECTION-SCREEN BEGIN OF BLOCK b_sel WITH FRAME TITLE TEXT-t01.
  SELECT-OPTIONS s_carrid FOR gv_carrid.
  SELECT-OPTIONS s_fldate FOR gv_fldate.
SELECTION-SCREEN END OF BLOCK b_sel.

SELECTION-SCREEN BEGIN OF BLOCK b_out WITH FRAME TITLE TEXT-t02.
  PARAMETERS p_max TYPE i DEFAULT 100.
  PARAMETERS p_test AS CHECKBOX DEFAULT 'X'.
SELECTION-SCREEN END OF BLOCK b_out.
```

Create the text symbols `T01` ("Flight selection") and `T02` ("Output options") with **Goto > Text Elements > Text Symbols**. Blocks can be nested, and every `BEGIN OF BLOCK` needs a matching `END OF BLOCK` with the same name.

> [!TIP]
> Blocks work like the sections of a paper form: "Personal data", "Address", "Payment". Each box has a heading, and you find the field you need without reading the whole page.

## Comments, empty lines, and underlines

These additions add text and space between the fields:

| Statement                                                  | What it does                                              |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `SELECTION-SCREEN SKIP.`                                   | adds an empty line (`SKIP 2` adds two)                    |
| `SELECTION-SCREEN ULINE.`                                  | draws a horizontal line                                   |
| `SELECTION-SCREEN COMMENT /1(50) TEXT-c01.`                | writes a text on a new line, column 1, 50 characters wide |
| `SELECTION-SCREEN COMMENT 1(20) TEXT-c02 FOR FIELD p_max.` | writes a label linked to a field (F1 help works on it)    |

```abap
SELECTION-SCREEN BEGIN OF BLOCK b_info WITH FRAME.
  SELECTION-SCREEN COMMENT /1(60) TEXT-c01.   " "Leave the airline empty to read all airlines"
  SELECTION-SCREEN SKIP.
  SELECTION-SCREEN ULINE.
SELECTION-SCREEN END OF BLOCK b_info.
```

The position `/1(60)` means: new line (`/`), column 1, length 60.

## Several fields on one line

Between `BEGIN OF LINE` and `END OF LINE` all elements go on the same line. Inside a line, the selection text of a parameter isn't shown, so you add your own label with `COMMENT` and place the next element with `POSITION`.

```abap
SELECTION-SCREEN BEGIN OF LINE.
  SELECTION-SCREEN COMMENT 1(20) TEXT-c02 FOR FIELD p_from.
  PARAMETERS p_from TYPE s_from_cit.
  SELECTION-SCREEN COMMENT 40(5) TEXT-c03 FOR FIELD p_to.   " "to"
  SELECTION-SCREEN POSITION 46.
  PARAMETERS p_to TYPE s_to_city.
SELECTION-SCREEN END OF LINE.
```

> [!WARNING]
> Elements on the same line must not overlap. If a comment is wider than the space before the next field, the syntax check reports an error. Count the columns: `COMMENT 40(5)` ends at column 44, so the next field can start at 46.

## Show and hide fields at runtime

You can change the screen just before it's displayed, in the event `AT SELECTION-SCREEN OUTPUT`. Give the fields you want to control a **modification group** with `MODIF ID`, then loop over the screen table `SCREEN` and change the attributes of the matching elements.

```abap
PARAMETERS p_list RADIOBUTTON GROUP out DEFAULT 'X' USER-COMMAND out_changed.
PARAMETERS p_file RADIOBUTTON GROUP out.
PARAMETERS p_path TYPE string LOWER CASE MODIF ID fil.

AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN INTO DATA(ls_screen).
    IF ls_screen-group1 = 'FIL'.
      IF p_file = abap_true.
        ls_screen-active = '1'.     " show the field
      ELSE.
        ls_screen-active = '0'.     " hide the field
      ENDIF.
      MODIFY SCREEN FROM ls_screen.
    ENDIF.
  ENDLOOP.
```

- `USER-COMMAND` makes the radio button group send a function code when the user clicks it: the screen is processed again and `AT SELECTION-SCREEN OUTPUT` runs, so the field appears or disappears at once.
- The modification group is stored in uppercase in `group1`, so compare with `'FIL'`.
- Other useful fields of `SCREEN`: `input` (`'0'` makes the field read-only), `required` (`'1'` makes it mandatory), `invisible`.

> [!WARNING]
> Changing `ls_screen` alone does nothing: you must write it back with `MODIFY SCREEN`. And the change works only in `AT SELECTION-SCREEN OUTPUT`; in other events the runtime rebuilds the screen and your change is lost.

The order in which the selection screen events run is covered in [report events](./0066-report-events.en.md).

## Exercise

> [!IMPORTANT]
>
> 1. Create a report with two framed blocks: "Flight selection" with `SELECT-OPTIONS` for airline and flight date, and "Output" with two radio buttons, "List" and "File".
> 2. Add a parameter for the file path that's visible only when "File" is selected.
> 3. Put a comment line at the top of the first block that explains what the report does.

### Solution

```abap
REPORT zflight_layout.

DATA gv_carrid TYPE s_carr_id.
DATA gv_fldate TYPE s_date.

SELECTION-SCREEN BEGIN OF BLOCK b_sel WITH FRAME TITLE TEXT-t01.
  SELECTION-SCREEN COMMENT /1(60) TEXT-c01.
  SELECTION-SCREEN SKIP.
  SELECT-OPTIONS s_carrid FOR gv_carrid.
  SELECT-OPTIONS s_fldate FOR gv_fldate.
SELECTION-SCREEN END OF BLOCK b_sel.

SELECTION-SCREEN BEGIN OF BLOCK b_out WITH FRAME TITLE TEXT-t02.
  PARAMETERS p_list RADIOBUTTON GROUP out DEFAULT 'X' USER-COMMAND out_changed.
  PARAMETERS p_file RADIOBUTTON GROUP out.
  PARAMETERS p_path TYPE string LOWER CASE MODIF ID fil.
SELECTION-SCREEN END OF BLOCK b_out.

AT SELECTION-SCREEN OUTPUT.
  LOOP AT SCREEN INTO DATA(ls_screen).
    IF ls_screen-group1 = 'FIL'.
      IF p_file = abap_true.
        ls_screen-active = '1'.
      ELSE.
        ls_screen-active = '0'.
      ENDIF.
      MODIFY SCREEN FROM ls_screen.
    ENDIF.
  ENDLOOP.

START-OF-SELECTION.
  WRITE / 'Selection done.'.
```

> [!NOTE]
>
> - `SELECTION-SCREEN BEGIN OF BLOCK ... WITH FRAME TITLE` groups fields in a framed box with a title.
> - `SKIP`, `ULINE`, and `COMMENT` add space, lines, and text; `/1(60)` means new line, column 1, length 60.
> - `BEGIN OF LINE` puts several elements on one line; add labels with `COMMENT ... FOR FIELD` and place fields with `POSITION`.
> - To show, hide, or lock fields, use `MODIF ID` and `LOOP AT SCREEN` with `MODIFY SCREEN` in `AT SELECTION-SCREEN OUTPUT`.
> - `USER-COMMAND` on radio buttons and checkboxes refreshes the screen as soon as the user clicks.
