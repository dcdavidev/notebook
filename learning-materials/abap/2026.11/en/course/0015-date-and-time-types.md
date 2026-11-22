---
title: Date and time types
description: Dates, times, time stamps, and calculations with them.
---

_Beginner level_

Flight dates, booking times, due dates, deadlines: business data is full of dates and times. ABAP has a type for dates (`d`), a type for times (`t`), and **time stamps** that combine both and work across time zones. You can calculate with dates directly: add days, count the days between two dates, and much more.

## Types d and t

| Type | Format     | Length | Initial value | Example                        |
| ---- | ---------- | ------ | ------------- | ------------------------------ |
| `d`  | `YYYYMMDD` | 8      | `'00000000'`  | `'20261231'`: 31 December 2026 |
| `t`  | `HHMMSS`   | 6      | `'000000'`    | `'143000'`: 2:30 p.m.          |

Both are stored as digits in a fixed format, whatever the user's settings. Only the output with `WRITE` uses the user's date format, as you saw in [Output with WRITE](./0011-output-with-write.md).

```abap
REPORT zdate_demo.

DATA lv_flight_date TYPE d VALUE '20261224'.
DATA lv_departure   TYPE t VALUE '093000'.

WRITE: / lv_flight_date,      " 24.12.2026 or 12/24/2026, depending on the user
       / lv_departure.        " 09:30:00
```

The current date and time come from **system fields**: `sy-datum` and `sy-uzeit` are the date and time of the application server; `sy-datlo` and `sy-timlo` are the date and time in the user's time zone. More system fields are in [System fields](./0023-system-fields.md).

## Calculating with dates

In calculations a date counts as a number of days, so you can add and subtract days directly:

```abap
DATA lv_today    TYPE d.
DATA lv_due_date TYPE d.
DATA lv_days     TYPE i.

lv_today = sy-datum.
lv_due_date = lv_today + 30.              " 30 days from today
lv_days = lv_due_date - lv_today.         " 30: difference in days
WRITE: / lv_due_date, / lv_days.
```

Month and year changes, leap years included, are handled for you: `'20280228' + 1` is `'20280229'`, because 2028 is a leap year.

Because a date is also text, you can read or change its parts with **offset and length**: `+4(2)` means "start after 4 characters, take 2".

```abap
DATA lv_date  TYPE d VALUE '20261117'.
DATA lv_first TYPE d.
DATA lv_last  TYPE d.

WRITE: / lv_date+0(4), lv_date+4(2), lv_date+6(2).   " 2026 11 17

lv_first = lv_date.
lv_first+6(2) = '01'.             " first day of the month: 20261101

lv_last = lv_first + 31.          " a day in the next month
lv_last+6(2) = '01'.              " first day of the next month: 20261201
lv_last = lv_last - 1.            " last day of this month: 20261130
```

> [!WARNING]
> ABAP doesn't check that a `d` field holds a valid date. `'20260231'` (31 February) can be stored without any error, but calculations with it give wrong results. When a date comes from outside (a file, an interface, user input in your own fields), check it before you use it, for example with the function module `DATE_CHECK_PLAUSIBILITY`.

## Calculating with times

Times count as seconds since midnight:

```abap
DATA lv_start  TYPE t VALUE '223000'.
DATA lv_end    TYPE t.
DATA lv_secs   TYPE i.

lv_end = lv_start + 7200.          " two hours later: 003000, past midnight
lv_secs = lv_end - lv_start.       " -79200: the date isn't part of a time
WRITE: / lv_end, / lv_secs.
```

The result of a time calculation is always a time of day: it wraps around at midnight. A type `t` field knows nothing about the date, so durations that cross midnight need dates too, or a time stamp.

> [!TIP]
> A `t` field is a wall clock: after 23:59:59 it shows 00:00:00 again, and it can't tell you which day it is. A time stamp is a clock with a calendar, set to a reference time zone.

## Time stamps

A **time stamp** is a date and a time together, always in **UTC** (Coordinated Universal Time). Time stamps are how you record when something happened, independently of where the user or the server is.

The classic time stamps are packed numbers in the format `YYYYMMDDhhmmss`:

| Dictionary type | Format                   | Precision       |
| --------------- | ------------------------ | --------------- |
| `TIMESTAMP`     | `YYYYMMDDhhmmss`         | seconds         |
| `TIMESTAMPL`    | `YYYYMMDDhhmmss.sssssss` | 100 nanoseconds |

```abap
DATA lv_stamp TYPE timestamp.
DATA lv_date  TYPE d.
DATA lv_time  TYPE t.

GET TIME STAMP FIELD lv_stamp.                     " now, in UTC

CONVERT TIME STAMP lv_stamp TIME ZONE sy-zonlo     " to the user's time zone
        INTO DATE lv_date TIME lv_time.
WRITE: / lv_stamp, / lv_date, lv_time.
```

`CONVERT DATE lv_date TIME lv_time INTO TIME STAMP lv_stamp TIME ZONE sy-zonlo` does the opposite. Don't add numbers to a classic time stamp: `20261231235959 + 1` isn't a valid time. Use the class `CL_ABAP_TSTMP`, for example `cl_abap_tstmp=>add( )`.

Since release 7.54 there's also a built-in time stamp type, `utclong`, with functions to calculate with it:

```abap
DATA lv_now   TYPE utclong.
DATA lv_later TYPE utclong.

lv_now   = utclong_current( ).                      " now, in UTC
lv_later = utclong_add( val = lv_now days = 1 ).    " same time tomorrow
WRITE: / lv_now, / lv_later.
```

On older releases, use `TIMESTAMP` or `TIMESTAMPL`.

## Exercise

> [!IMPORTANT]
>
> 1. A flight departs on 28 February 2028 at 22:45 and lands 3 hours and 30 minutes later. Calculate the arrival date and time.
> 2. Calculate how many days are left from today until 31 December of the current year.

### Solution

```abap
REPORT zflight_arrival.

DATA: lv_dep_date TYPE d VALUE '20280228',
      lv_dep_time TYPE t VALUE '224500',
      lv_arr_date TYPE d,
      lv_arr_time TYPE t,
      lv_year_end TYPE d,
      lv_days     TYPE i.

lv_arr_time = lv_dep_time + 12600.               " 3 h 30 min = 12600 seconds: 021500
lv_arr_date = lv_dep_date.
IF lv_arr_time < lv_dep_time.                    " the clock wrapped: next day
  lv_arr_date = lv_arr_date + 1.                 " 20280229, a leap year
ENDIF.
WRITE: / 'Arrival:', lv_arr_date, lv_arr_time.

lv_year_end = sy-datum.
lv_year_end+4(4) = '1231'.
lv_days = lv_year_end - sy-datum.
WRITE: / 'Days to the end of the year:', lv_days.
```

The `IF` statement is covered in [IF and logical expressions](./0024-if-and-logical-expressions.md): here it adds a day when the arrival time is earlier than the departure time.

> [!NOTE]
>
> - `d` is a date (`YYYYMMDD`), `t` is a time (`HHMMSS`); both are stored as digits, formatted only on output.
> - Date plus number gives a date; date minus date gives days. Time calculations are in seconds and wrap at midnight.
> - Offset and length (`+6(2)`) read and change parts of a date.
> - ABAP doesn't validate `d` fields: check dates that come from outside.
> - Time stamps (`TIMESTAMP`, `TIMESTAMPL`, and `utclong` since 7.54) are in UTC; convert them with `CONVERT TIME STAMP`.
