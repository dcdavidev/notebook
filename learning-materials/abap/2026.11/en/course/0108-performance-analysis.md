---
title: Performance analysis
description: SQL trace (ST05) and runtime analysis (SAT).
---

_Intermediate level_

When a program is slow, don't guess where the time goes: measure it. Two standard tools answer the question in minutes. The **SQL trace** (`ST05`) records every database access, and the **runtime analysis** (`SAT`) measures how long every statement and method takes in ABAP.

This lesson shows how to use both. The rules for making the code faster come in [writing fast ABAP](./0109-performance-best-practices.md).

## The program to analyze

The examples analyze this report. It works, but it reads the customer name once per booking:

```abap
REPORT zslow_flights.

START-OF-SELECTION.
  SELECT * FROM sbook INTO TABLE @DATA(lt_bookings) UP TO 2000 ROWS.

  LOOP AT lt_bookings INTO DATA(ls_booking).
    SELECT SINGLE name FROM scustom
      WHERE id = @ls_booking-customid
      INTO @DATA(lv_name).                       " one database call per row
    WRITE: / ls_booking-carrid, ls_booking-connid, ls_booking-bookid, lv_name.
  ENDLOOP.
```

## The SQL trace (ST05)

`ST05` records the SQL statements that reach the database, with their duration and the number of rows.

1. Start `ST05` and choose **Activate Trace with Filter**. Restrict it to your user and, if you want, to the program name. Leave SQL Trace selected.
2. Run the program in another session.
3. Back in `ST05`, choose **Deactivate Trace**, then **Display Trace**.

The trace list shows one row per database operation:

| Column      | Meaning                                       |
| ----------- | --------------------------------------------- |
| Duration    | time on the database, in microseconds         |
| Records     | rows returned or changed                      |
| Object name | the table or view                             |
| Statement   | the SQL statement as the database received it |

Two evaluations show the real problems at a glance:

- **Statement summary** groups the statements by text and shows how often each ran and how long it took in total. For the report above, the `SELECT` on `SCUSTOM` appears with up to 2,000 executions.
- **Value-identical statements** lists statements run several times with exactly the same values: pure repetition that a buffer or a join would remove.

Reads served by the [table buffer](./0046-database-tables.md) don't reach the database, so they don't appear in the SQL trace; activate the buffer trace to see them.

Select a statement and choose **Explain** to see the execution plan the database chose: whether it used an index or read the whole table.

> [!TIP]
> The SQL trace is the itemized phone bill. The total says you spent too much; the list of calls shows that you phoned the same number three thousand times.

`ST05` can also record other traces: table buffer accesses, RFC calls, enqueue (lock) operations, and HTTP calls. Select them in the same screen when you need them.

> [!WARNING]
> The trace records everything that happens on the application server for the users you select. Always set a filter, keep the trace short, and deactivate it when you're done: an active trace without a filter slows down the system and fills the trace files.

## The runtime analysis (SAT)

`SAT` measures the ABAP side: how much time goes to each method, function module, loop, and statement.

1. Start `SAT`. Enter the program or the transaction in the **In Dialog** tab.
2. Keep the default measurement variant, or create one with **aggregation per call position** off if you need the full call hierarchy.
3. Choose **Execute**. The program runs; when it ends, `SAT` shows the evaluation.

The evaluation has several tools:

| Tool              | What it shows                                                    |
| ----------------- | ---------------------------------------------------------------- |
| Hit list          | every statement or call with its count, gross time, and net time |
| DB tables         | the tables accessed and the time spent on each                   |
| Profile           | the time split by package, program, or component                 |
| Call hierarchy    | who called what, in order                                        |
| Processing blocks | the time per method, function, form, and event                   |

**Gross time** includes everything called from a statement; **net time** is the time of the statement alone. Sort the hit list by net time to find the code that is slow itself, and by gross time to find the call that starts the slow part.

At the top, `SAT` shows how the total splits into ABAP, database, and system time. Mostly database time points to `ST05`; mostly ABAP time points to loops and internal tables.

In ADT the same measurement is the **ABAP Profiler**: right-click the program and choose **Profile As > ABAP Application**, then open the trace in the ABAP Traces view.

## Measuring a single block

To compare two versions of a small piece of code, measure it in the program with a high-resolution timer:

```abap
DATA(lo_timer) = cl_abap_runtime=>create_hr_timer( ).

DATA(lv_start) = lo_timer->get_runtime( ).
" ... the code to measure ...
DATA(lv_end) = lo_timer->get_runtime( ).

WRITE: / |Runtime: { lv_end - lv_start } microseconds|.
```

Run each version several times: the first run is often slower because the buffers are still empty.

## Exercise

> [!IMPORTANT]
>
> 1. Create the report `ZSLOW_FLIGHTS` from the lesson and trace it with `ST05`. How many times does the `SELECT` on `SCUSTOM` run?
> 2. Measure it with `SAT` and note the split between ABAP and database time.
> 3. Replace the `SELECT SINGLE` in the loop with a join, trace again, and compare.

### Solution

The statement summary shows the `SELECT` on `SCUSTOM` once per booking, and most of the time is database time. With a join there is a single statement:

```abap
SELECT FROM sbook AS b
  INNER JOIN scustom AS c ON c~id = b~customid
  FIELDS b~carrid, b~connid, b~bookid, c~name
  INTO TABLE @DATA(lt_bookings)
  UP TO 2000 ROWS.
```

> [!NOTE]
>
> - Measure before you optimize: `ST05` for the database, `SAT` for ABAP.
> - In `ST05`, activate the trace with a filter, run the program, deactivate, and display.
> - The statement summary and the value-identical statements reveal repeated database calls; Explain shows the execution plan.
> - In `SAT`, the hit list shows gross and net time per statement; the profile shows ABAP versus database time.
> - In ADT, use the ABAP Profiler; for a single block, use `cl_abap_runtime=>create_hr_timer( )`.
