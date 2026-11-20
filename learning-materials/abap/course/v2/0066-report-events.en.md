---
title: Report events
description: INITIALIZATION, AT SELECTION-SCREEN, START-OF-SELECTION, and more.
---

_Basic level_

A report isn't run from top to bottom like a script. The runtime calls it at fixed moments, called **events**: before the selection screen appears, when the user presses Enter, when the user presses Execute, and so on. You write an **event block** for each moment you want to react to.

Knowing the order of the events tells you where to put defaults, input checks, and the main logic of a report.

## The order of the events

When you run a report with a selection screen, the runtime goes through these events:

| Event                                        | When it runs                                             | Typical use                                 |
| -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| `LOAD-OF-PROGRAM`                            | once, when the program is loaded                         | rarely used in reports                      |
| `INITIALIZATION`                             | once, before the selection screen appears the first time | compute default values                      |
| `AT SELECTION-SCREEN OUTPUT`                 | every time just before the selection screen is shown     | change the screen (show, hide, lock fields) |
| `AT SELECTION-SCREEN ON VALUE-REQUEST FOR p` | when the user presses F4 on field `p`                    | your own input help                         |
| `AT SELECTION-SCREEN ON p`                   | after the user's input, for the single field `p`         | check one field                             |
| `AT SELECTION-SCREEN`                        | after the user's input, for the whole screen             | check several fields together               |
| `START-OF-SELECTION`                         | after the user presses Execute (F8) and all checks pass  | read data, process, output                  |
| `END-OF-SELECTION`                           | after `START-OF-SELECTION`                               | final output (mostly in old code)           |

After the list is displayed, list events such as `TOP-OF-PAGE` and `AT LINE-SELECTION` take over: they're covered in [interactive lists](./0067-interactive-lists.en.md).

> [!TIP]
> Think of a restaurant. `INITIALIZATION` is setting the table before the guest arrives. `AT SELECTION-SCREEN` is the waiter reading the order back and saying "sorry, we're out of that". `START-OF-SELECTION` is the kitchen cooking once the order is confirmed.

## Default values in INITIALIZATION

`DEFAULT` on a parameter accepts only a constant. When the default must be computed, fill the field in `INITIALIZATION`:

```abap
REPORT zflight_events.

DATA gv_fldate TYPE s_date.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.
SELECT-OPTIONS s_fldate FOR gv_fldate.

INITIALIZATION.
  " Default interval: from today to 30 days from now
  APPEND VALUE #( sign = 'I' option = 'BT' low = sy-datum high = sy-datum + 30 ) TO s_fldate.
```

`s_fldate` is a selection table, as explained in [SELECT-OPTIONS and ranges](./0064-select-options-and-ranges.en.md): each row you append is one interval the user sees on the screen.

## Input checks in AT SELECTION-SCREEN

If you send an error message (type `E`) in `AT SELECTION-SCREEN`, the runtime shows the message and **keeps the selection screen open**: the user can correct the input and try again. With `ON p_carrid`, only that field stays ready for input; the others are locked until the error is fixed.

```abap
AT SELECTION-SCREEN ON p_carrid.
  SELECT SINGLE @abap_true
    FROM scarr
    WHERE carrid = @p_carrid
    INTO @DATA(lv_exists).
  IF sy-subrc <> 0.
    MESSAGE e001(zflight) WITH p_carrid.   " Airline &1 doesn't exist
  ENDIF.

AT SELECTION-SCREEN.
  IF s_fldate[] IS INITIAL.                 " [] means the table, not the header line
    MESSAGE w002(zflight).                 " No date given: all flights are read
  ENDIF.
```

The message class `ZFLIGHT` and its messages are your own: see [messages](./0061-messages.en.md).

> [!WARNING]
> `AT SELECTION-SCREEN` also runs when the user presses Enter or clicks a radio button with `USER-COMMAND`, not only on Execute. Keep the checks there quick, and don't read large amounts of data: that belongs in `START-OF-SELECTION`.

## The main logic in START-OF-SELECTION

`START-OF-SELECTION` runs once the input is valid. It's the place for reading the database and writing the output.

```abap
START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    WHERE carrid = @p_carrid
      AND fldate IN @s_fldate
    INTO TABLE @DATA(lt_flights).

  IF lt_flights IS INITIAL.
    MESSAGE s003(zflight) DISPLAY LIKE 'E'.   " No flights found
    RETURN.
  ENDIF.

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-carrid, ls_flight-connid, ls_flight-fldate,
             ls_flight-seatsocc, '/', ls_flight-seatsmax.
  ENDLOOP.
```

- Statements that aren't inside any event block belong to `START-OF-SELECTION` automatically. Write the keyword anyway: it makes the program easier to read.
- An event block ends where the next event keyword starts. There's no `END-OF-...` statement to close it.
- A `MESSAGE` of type `E` in `START-OF-SELECTION` ends the program instead of returning to the screen. That's why the example uses type `S` with `DISPLAY LIKE 'E'` and `RETURN`.

> [!WARNING]
> Data declared with `DATA` in `INITIALIZATION`, `START-OF-SELECTION`, and most other event blocks is **global**, not local to the block: a variable declared inline in `START-OF-SELECTION`, such as `lt_flights`, is visible in the rest of the program. The exception is `AT SELECTION-SCREEN` (all its variants): the runtime implements it as a procedure, so its data is local. Keep event blocks short and move real logic into [methods](./0076-classes-and-objects.en.md) as soon as you know them.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report with a parameter for the airline and `SELECT-OPTIONS` for the flight date.
> 2. In `INITIALIZATION`, set the date interval to the current month.
> 3. In `AT SELECTION-SCREEN ON`, reject an airline that isn't in `SCARR`. In `START-OF-SELECTION`, list the matching flights from `SFLIGHT`.

### Solution

```abap
REPORT zflight_month.

DATA gv_fldate TYPE s_date.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.
SELECT-OPTIONS s_fldate FOR gv_fldate.

INITIALIZATION.
  DATA lv_first TYPE d.
  DATA lv_last  TYPE d.
  lv_first = sy-datum.
  lv_first+6(2) = '01'.                          " first day of the month
  lv_last = lv_first + 31.                       " a day in the next month
  lv_last+6(2) = '01'.
  lv_last = lv_last - 1.                         " last day of the month
  APPEND VALUE #( sign = 'I' option = 'BT' low = lv_first high = lv_last ) TO s_fldate.

AT SELECTION-SCREEN ON p_carrid.
  SELECT SINGLE @abap_true FROM scarr
    WHERE carrid = @p_carrid
    INTO @DATA(lv_exists).
  IF sy-subrc <> 0.
    MESSAGE |Airline { p_carrid } doesn't exist| TYPE 'E'.
  ENDIF.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsocc
    FROM sflight
    WHERE carrid = @p_carrid
      AND fldate IN @s_fldate
    ORDER BY fldate
    INTO TABLE @DATA(lt_flights).

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc.
  ENDLOOP.
```

> [!NOTE]
>
> - A report is a set of event blocks that the runtime calls in a fixed order.
> - `INITIALIZATION` runs once before the selection screen: use it for computed defaults.
> - `AT SELECTION-SCREEN OUTPUT` changes the screen; `AT SELECTION-SCREEN` and `AT SELECTION-SCREEN ON` check the input, and an `E` message keeps the screen open.
> - `START-OF-SELECTION` holds the main logic; code outside any event block belongs to it.
> - Data declared in event blocks is global, except in `AT SELECTION-SCREEN`, where it's local.
