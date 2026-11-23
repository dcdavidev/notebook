---
title: Interactive lists
description: TOP-OF-PAGE, AT LINE-SELECTION, HIDE, and detail lists.
level: basic
---

The list you build with [`WRITE`](./0011-output-with-write.md) can do more than show text. It can have a page header that repeats on every page, and it can react when the user double-clicks a line, opening a **detail list** with more data about that line.

These are **classic lists**. New reports usually show data in an [ALV grid](./0099-alv-with-salv.md), but thousands of existing reports use the techniques in this lesson, and you'll need to read and maintain them.

## Page headers with TOP-OF-PAGE

The event `TOP-OF-PAGE` runs every time a new page of the list starts, just before the first line of the page is written. Use it for column headings.

```abap
REPORT zflight_carriers NO STANDARD PAGE HEADING LINE-SIZE 80.

START-OF-SELECTION.
  SELECT carrid, carrname, currcode
    FROM scarr
    ORDER BY carrid
    INTO TABLE @DATA(lt_carriers).

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    WRITE: / ls_carrier-carrid, ls_carrier-carrname, ls_carrier-currcode.
  ENDLOOP.

TOP-OF-PAGE.
  WRITE: / 'Airline', 10 'Name', 40 'Currency'.
  ULINE.
```

- `NO STANDARD PAGE HEADING` turns off the default header (the program title and page number), so only your header appears.
- `LINE-SIZE 80` sets the width of the list. With `LINE-COUNT n` you also set the number of lines per page; then `END-OF-PAGE` can write a footer.

## Reacting to a double-click: AT LINE-SELECTION

When the user double-clicks a line (or selects it and presses F2), the runtime triggers the event `AT LINE-SELECTION`. Everything you `WRITE` in that event goes to a new list, the **detail list**, which is shown on top of the basic list. With the Back button (F3) the user returns to the previous list.

The system field `sy-lsind` holds the number of the list being built: `0` for the basic list, `1` for the first detail list, and so on, up to `20`. `sy-lisel` contains the content of the line the user selected, as text.

> [!TIP]
> A classic list is like a stack of index cards. The basic list is the card on the table; each double-click puts a new, more detailed card on top. Back takes the top card away and shows the one underneath.

## Remembering the line with HIDE

The line in the list is only text. To know which airline the user clicked, you store the key with `HIDE` right after writing the line. `HIDE` saves the current content of a variable together with the line. When the user selects the line, the runtime puts the saved value back into the variable, before `AT LINE-SELECTION` runs.

```abap
REPORT zflight_drilldown NO STANDARD PAGE HEADING.

DATA gv_carrid TYPE s_carr_id.

START-OF-SELECTION.
  SELECT carrid, carrname FROM scarr ORDER BY carrid INTO TABLE @DATA(lt_carriers).

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    WRITE: / ls_carrier-carrid, ls_carrier-carrname.
    gv_carrid = ls_carrier-carrid.
    HIDE gv_carrid.                     " stored together with this line
  ENDLOOP.
  CLEAR gv_carrid.

AT LINE-SELECTION.
  CHECK gv_carrid IS NOT INITIAL.       " the user clicked a line without HIDE data
  SELECT connid, cityfrom, cityto FROM spfli
    WHERE carrid = @gv_carrid
    ORDER BY connid
    INTO TABLE @DATA(lt_connections).
  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-connid, ls_connection-cityfrom, ls_connection-cityto.
  ENDLOOP.
  CLEAR gv_carrid.

TOP-OF-PAGE.
  WRITE: / 'Airlines'.
  ULINE.

TOP-OF-PAGE DURING LINE-SELECTION.
  WRITE: / 'Connections of', gv_carrid.
  ULINE.
```

- `TOP-OF-PAGE DURING LINE-SELECTION` is the header of the detail lists. `TOP-OF-PAGE` alone is only for the basic list.
- The variable for `HIDE` must be global, because the event that reads it runs later.
- The lines of the detail list have no `HIDE` data, so a double-click there stops at `CHECK` and no new list opens. In reports with several levels, you decide what to show with `CASE sy-lsind`.

> [!WARNING]
> If the user clicks a line where you didn't call `HIDE`, such as a heading or an empty line, the variable keeps whatever value it had before. That's why the example clears `gv_carrid` after the loop and at the end of `AT LINE-SELECTION`, and checks it at the start. Without those `CLEAR` statements, a click on the header opens the details of the last airline.

## Other list events

| Event             | When it runs                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `END-OF-PAGE`     | at the end of each page, if the report has `LINE-COUNT`                                                         |
| `AT USER-COMMAND` | when the user picks a function of the list's own GUI status (see [GUI status](./0104-gui-status-and-popups.md)) |
| `AT PFnn`         | when the user presses function key Fnn (obsolete: use a GUI status instead)                                     |

Every detail list ends when the event block ends. The runtime then displays it.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that lists the connections of `SPFLI` with a page header.
> 2. On double-click, show a detail list with the flights of that connection from `SFLIGHT` (date, occupied seats, maximum seats).
> 3. Give the detail list its own header with the airline and the connection number.

### Solution

```abap
REPORT zflight_connections NO STANDARD PAGE HEADING.

DATA gv_carrid TYPE s_carr_id.
DATA gv_connid TYPE s_conn_id.

START-OF-SELECTION.
  SELECT carrid, connid, cityfrom, cityto FROM spfli
    ORDER BY carrid, connid
    INTO TABLE @DATA(lt_connections).

  LOOP AT lt_connections INTO DATA(ls_connection).
    WRITE: / ls_connection-carrid, ls_connection-connid,
             ls_connection-cityfrom, ls_connection-cityto.
    gv_carrid = ls_connection-carrid.
    gv_connid = ls_connection-connid.
    HIDE: gv_carrid, gv_connid.
  ENDLOOP.
  CLEAR: gv_carrid, gv_connid.

AT LINE-SELECTION.
  CHECK gv_carrid IS NOT INITIAL.
  SELECT fldate, seatsocc, seatsmax FROM sflight
    WHERE carrid = @gv_carrid
      AND connid = @gv_connid
    ORDER BY fldate
    INTO TABLE @DATA(lt_flights).
  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-fldate, ls_flight-seatsocc, ls_flight-seatsmax.
  ENDLOOP.
  CLEAR: gv_carrid, gv_connid.

TOP-OF-PAGE.
  WRITE: / 'Airline', 'Connection', 'From', 'To'.
  ULINE.

TOP-OF-PAGE DURING LINE-SELECTION.
  WRITE: / 'Flights of', gv_carrid, gv_connid.
  ULINE.
```

> [!NOTE]
>
> - `TOP-OF-PAGE` writes the header of the basic list; `TOP-OF-PAGE DURING LINE-SELECTION` writes the header of the detail lists.
> - `AT LINE-SELECTION` runs on double-click or F2 and builds a new detail list.
> - `sy-lsind` is the number of the current list (0 to 20); `sy-lisel` holds the selected line as text.
> - `HIDE` stores a global variable with the line and restores it when the user selects that line. Clear the variable to avoid stale values.
> - For new reports, prefer ALV; know classic lists to maintain old code.
