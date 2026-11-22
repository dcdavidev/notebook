---
title: Variants and background jobs
description: Save input values and schedule programs with SM36 and SM37.
---

_Basic level_

Users often run the same report with the same input every day. A **variant** saves the values of a selection screen under a name, so nobody has to type them again. Variants are also what makes **background jobs** possible: a job runs a report without a user in front of the screen, so it needs its input values from a variant.

This lesson shows how to create variants, how to schedule a job in `SM36`, how to monitor it in `SM37`, and what changes in your code when it runs in the background.

## Create and use a variant

1. Run your report (for example from `SE38`) and fill the selection screen.
2. Choose **Goto > Variants > Save as Variant** (or press the Save button).
3. Enter a name, such as `DAILY_LH`, and a description.
4. Set the attributes you need, then save.

To use it, choose **Goto > Variants > Get** on the selection screen, or click **Execute with Variant** in `SE38`.

The most useful attributes:

| Attribute                      | Effect                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| Only for background processing | the variant can be used only in jobs                       |
| Protect variant                | only the user who created it can change it                 |
| Protect field                  | the user can't change that field after loading the variant |
| Hide field                     | the field doesn't appear when the variant is loaded        |
| Selection variable             | the value is computed at runtime instead of being fixed    |

Selection variables solve a common problem: a variant saved with the date `2026-01-15` would read the same day forever. With the type **D** (dynamic date calculation) you choose a rule such as "current date" or "current date - 1", and the date moves with the calendar. With the type **T**, the value comes from a table of variables maintained in transaction `STVARV`.

> [!TIP]
> A variant is like a saved search in an online shop: "size M, color blue, under 50 euros". You set the filters once and click the saved search every time, instead of setting them again.

> [!WARNING]
> Variants are stored per client and aren't transported automatically. If a job in production needs a variant, create it there, or add it to a transport request from the variant maintenance (**Utilities > Transport Request**).

## Schedule a job in SM36

A **background job** is a sequence of one or more **steps**, each one a program run with a variant.

1. Open `SM36` and enter a **job name**, such as `ZFLIGHT_DAILY`, and a **job class** (`C` is the normal priority; `A` and `B` are higher).
2. Click **Step**, enter the program name and the variant, and save the step.
3. Click **Start Condition** and choose when the job runs: **Immediate**, **Date/Time**, **After Job**, or **After Event**. Check **Periodic Job** and choose a period (daily, weekly, ...) for a job that repeats.
4. Save the job. It's now **released** and waits for its start time.

You can also start a report in the background straight from its selection screen with **Program > Execute in Background** (F9).

## Monitor jobs in SM37

`SM37` lists the jobs that match a job name, a user, a date range, and a status. The status tells you where the job is:

| Status    | Meaning                                                  |
| --------- | -------------------------------------------------------- |
| Scheduled | defined, but not released yet: it won't start            |
| Released  | waiting for its start condition                          |
| Ready     | the start time has come; waiting for a free work process |
| Active    | running now                                              |
| Finished  | ended without errors                                     |
| Canceled  | ended with an error or a runtime error                   |

Select a job and click **Job Log** to see its messages, or **Spool** to see the list it wrote. The output of `WRITE` in a job becomes a **spool request**, which you can also find in `SP01`.

## Code that runs in the background

In a job nobody can answer a popup or look at the screen. The system field `sy-batch` is `abap_true` when the program runs in the background, so you can adapt the behavior:

```abap
REPORT zflight_daily.

PARAMETERS p_carrid TYPE s_carr_id OBLIGATORY.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsocc
    FROM sflight
    WHERE carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).

  IF sy-batch = abap_true.
    " In a job: the message goes to the job log
    MESSAGE |{ lines( lt_flights ) } flights read for { p_carrid }| TYPE 'S'.
  ENDIF.

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-connid, ls_flight-fldate, ls_flight-seatsocc.   " goes to the spool
  ENDLOOP.
```

- Messages of type `S`, `I`, and `W` are written to the job log, and the job goes on.
- A message of type `E` or `A`, or a runtime error, ends the job with status **Canceled**.
- Anything that needs SAP GUI doesn't work: no popups and no [files on the user's PC](./0073-files-on-the-presentation-server.md). Write files on the [application server](./0074-files-on-the-application-server.md) instead.

You can also schedule jobs from code, with `SUBMIT ... VIA JOB` and the job function modules: see [calling programs](./0072-calling-programs-and-memory.md) and [parallel and background processing](./0114-parallel-processing.md).

## Exercise

> [!IMPORTANT]
>
> 1. Create a variant for a flight report of yours, with the airline `LH` and a flight date that's always "current date" (a selection variable of type D).
> 2. Schedule the report with that variant in `SM36` as a job that starts immediately.
> 3. In `SM37`, find the job, open its job log, and open its spool.

### Solution

1. On the selection screen, enter `LH`, choose **Goto > Variants > Save as Variant**, and for the date field set **Selection variable** to `D` with the rule "Current date".
2. In `SM36`: job name `ZFLIGHT_TEST`, **Step** with your program and the variant, **Start Condition > Immediate**, then save.
3. In `SM37`, enter `ZFLIGHT_TEST` and your user, run the selection, select the job, and click **Job Log** and **Spool**. The status should be **Finished**.

> [!NOTE]
>
> - A variant saves the values of a selection screen under a name; attributes protect, hide, or make fields dynamic.
> - Use selection variables (type D for dates, type T for `STVARV` values) so a variant doesn't freeze a date.
> - `SM36` creates jobs from steps (program + variant) and a start condition; `SM37` monitors them.
> - Job output goes to the spool (`SP01`); messages go to the job log; `E` and `A` messages cancel the job.
> - Check `sy-batch` and avoid anything that needs SAP GUI in programs that run in the background.
