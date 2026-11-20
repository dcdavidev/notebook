---
title: System fields
description: sy-subrc, sy-datum, sy-uname, and the other fields the runtime fills.
---

_Beginner level_

While your program runs, the ABAP runtime keeps a set of variables up to date for you: the current date and time, the user's name, the client, the result of the last statement, the current loop pass. These are the **system fields**, and every program can read them without declaring anything.

You'll use some of them, above all `sy-subrc`, in almost every program you write.

## Where system fields come from

All system fields are components of a structure called `sy` (its full name is `syst`, defined in the ABAP Dictionary). You read a field with the structure name, a hyphen, and the field name:

```abap
REPORT zsysfields_demo.

WRITE: / 'User:  ', sy-uname,
       / 'Date:  ', sy-datum,
       / 'Time:  ', sy-uzeit,
       / 'Client:', sy-mandt,
       / 'System:', sy-sysid.
```

Every program sees the same `sy` structure, filled with the values of its own session.

> [!TIP]
> System fields are the dashboard of a car: speed, fuel, the time, a warning light that turns on when something goes wrong. You don't build these instruments; you just look at them while you drive.

## `sy-subrc`: did it work?

Many ABAP statements set `sy-subrc` (**return code**) to tell you how they ended:

- `0` means success;
- any other value (usually `4` or `8`) means "not found", "not possible", or an error. The meaning depends on the statement.

The most typical case is reading from the database, which you'll learn in [SELECT SINGLE and UP TO n ROWS](./0053-select-single-and-up-to.en.md):

```abap
DATA lv_carrname TYPE scarr-carrname.

SELECT SINGLE carrname FROM scarr
  WHERE carrid = 'LH'
  INTO @lv_carrname.

IF sy-subrc = 0.
  WRITE: / 'Airline:', lv_carrname.
ELSE.
  WRITE: / 'Airline not found'.
ENDIF.
```

> [!WARNING]
> Check `sy-subrc` **right after** the statement that sets it. The next statement that sets it overwrites the value, and many statements do: it's easy to add one in between without noticing. If you need the value later, copy it into your own variable first.

## The most used system fields

| Field                  | Contents                                       |
| ---------------------- | ---------------------------------------------- |
| `sy-subrc`             | return code of the last statement that sets it |
| `sy-datum`, `sy-uzeit` | date and time of the application server        |
| `sy-datlo`, `sy-timlo` | date and time in the user's time zone          |
| `sy-uname`             | the user name                                  |
| `sy-mandt`             | the client you're logged on to                 |
| `sy-langu`             | the logon language                             |
| `sy-sysid`             | the system ID, for example `DEV`               |
| `sy-repid`             | the name of the current program                |
| `sy-tcode`             | the current transaction code                   |
| `sy-index`             | the current pass of a `DO` or `WHILE` loop     |
| `sy-tabix`             | the current row of an internal table           |
| `sy-dbcnt`             | the number of database rows read or changed    |
| `sy-fdpos`             | the offset found by some text comparisons      |
| `sy-batch`             | `X` when the program runs in the background    |

You'll meet `sy-index` in [DO and WHILE loops](./0026-do-and-while-loops.en.md), `sy-tabix` in [Looping over internal tables](./0038-looping-internal-tables.en.md), and `sy-dbcnt` with the database statements. To see all the fields, open the structure `SYST` in `SE11` or in ADT.

`sy-datum` comes from the server, not from the user's PC. If your users work in several time zones, use `sy-datlo` and `sy-timlo` for what they see on screen.

## Rules for using system fields

- **Read them, never write them.** The syntax check lets you assign a value to most system fields, but the runtime relies on them. Changing `sy-subrc` or `sy-datum` by hand only hides problems.
- **Copy what you need.** If you use a value several times, or after other statements, store it in a variable: `DATA(lv_rc) = sy-subrc.`
- **Don't pass them as parameters.** A procedure can change system fields while it runs; pass a copy instead.

> [!WARNING]
> In ABAP Cloud, many system fields aren't allowed. For example, instead of `sy-datum` and `sy-uname` you use the class `cl_abap_context_info`, as you'll see in [ABAP Cloud and clean core](./0148-abap-cloud.en.md).

You can also use a system field as a type: `DATA lv_date TYPE sy-datum.` declares a variable with the same type as the field.

## Exercise

> [!IMPORTANT]
>
> 1. Write a report that prints the user name, the client, the system ID, the program name, and the server date and time in user format.
> 2. Read the name of the airline `XX` from `SCARR` with `SELECT SINGLE`, store `sy-subrc` in a variable, and print a message that depends on it.

### Solution

```abap
REPORT zsysfields_exercise.

DATA lv_carrname TYPE scarr-carrname.

WRITE: / |User:    { sy-uname }|,
       / |Client:  { sy-mandt }|,
       / |System:  { sy-sysid }|,
       / |Program: { sy-repid }|,
       / |Now:     { sy-datum DATE = USER } { sy-uzeit TIME = USER }|.

SELECT SINGLE carrname FROM scarr
  WHERE carrid = 'XX'
  INTO @lv_carrname.
DATA(lv_rc) = sy-subrc.

IF lv_rc = 0.
  WRITE: / 'Found:', lv_carrname.
ELSE.
  WRITE: / |Not found, sy-subrc = { lv_rc }|.     " usually 4
ENDIF.
```

> [!NOTE]
>
> - System fields are components of the structure `sy` (`syst`), filled by the runtime.
> - `sy-subrc` is `0` after a successful statement; check it right after the statement that sets it.
> - `sy-datum` and `sy-uzeit` are server date and time; `sy-datlo` and `sy-timlo` follow the user's time zone.
> - `sy-index` counts loop passes, `sy-tabix` table rows, and `sy-dbcnt` database rows.
> - Read system fields, never change them, and copy the value when you need it later.
