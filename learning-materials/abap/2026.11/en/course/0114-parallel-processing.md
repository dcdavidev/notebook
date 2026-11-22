---
title: Parallel and background processing
description: Asynchronous RFC, bgRFC, and the background processing framework.
---

_Intermediate level_

A program normally does one thing after another in a single work process. When the work is big (millions of documents, one slow call per customer), you can split it into packages and run them **in parallel** in several work processes, or hand it to the system to run **in the background** after your transaction ends.

This lesson shows the three main tools: asynchronous RFC for parallel work you wait for, bgRFC for reliable background calls, and the background processing framework for modern code. To schedule whole programs as jobs, see [variants and background jobs](./0068-variants-and-background-jobs.md).

## Choose the right tool

| Tool                                   | Runs                                     | Your program      | Typical use                                   |
| -------------------------------------- | ---------------------------------------- | ----------------- | --------------------------------------------- |
| asynchronous RFC (aRFC)                | right away, in parallel dialog processes | waits for results | split a long calculation into packages        |
| background RFC (bgRFC)                 | after `COMMIT WORK`, exactly once        | doesn't wait      | reliable calls to the same or another system  |
| background processing framework (bgPF) | after `COMMIT WORK`, exactly once        | doesn't wait      | asynchronous steps in RAP and ABAP Cloud code |

> [!TIP]
> aRFC is a team leader who hands a stack of folders to five colleagues and waits at the desk until each one brings back the result. bgRFC and bgPF are the outgoing mail tray: you drop the envelope, go home, and the mail room makes sure it's delivered once.

## Asynchronous RFC

aRFC calls a **remote-enabled** function module (see [remote function calls](./0124-rfc.md)) in a new session, while your program goes on. `DESTINATION IN GROUP` sends each call to a free dialog work process of a server group (set up in `RZ12`; `DEFAULT` means all servers).

The function module, marked as **Remote-Enabled Module** in `SE37`:

```abap
FUNCTION z_flights_of_carrier.
*"  IMPORTING
*"     VALUE(IV_CARRID) TYPE S_CARR_ID
*"  EXPORTING
*"     VALUE(EV_SEATS_FREE) TYPE I
  SELECT SUM( seatsmax - seatsocc ) FROM sflight
    WHERE carrid = @iv_carrid
    INTO @ev_seats_free.
ENDFUNCTION.
```

The caller starts one task per airline, collects the results in a callback method, and waits:

```abap
CLASS lcl_collector DEFINITION.
  PUBLIC SECTION.
    DATA mv_done TYPE i.
    METHODS on_end IMPORTING p_task TYPE clike.   " exactly this signature
ENDCLASS.

CLASS lcl_collector IMPLEMENTATION.
  METHOD on_end.
    DATA lv_seats TYPE i.
    RECEIVE RESULTS FROM FUNCTION 'Z_FLIGHTS_OF_CARRIER'
      IMPORTING  ev_seats_free = lv_seats
      EXCEPTIONS system_failure = 1 communication_failure = 2 OTHERS = 3.
    IF sy-subrc = 0.
      WRITE: / p_task, lv_seats.
    ENDIF.
    mv_done += 1.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_collector) = NEW lcl_collector( ).
  DATA lv_started TYPE i.

  SELECT carrid FROM scarr INTO TABLE @DATA(lt_carriers).

  LOOP AT lt_carriers INTO DATA(ls_carrier).
    DATA(lv_task) = CONV char32( ls_carrier-carrid ).   " unique task name
    CALL FUNCTION 'Z_FLIGHTS_OF_CARRIER'
      STARTING NEW TASK lv_task
      DESTINATION IN GROUP DEFAULT
      CALLING lo_collector->on_end ON END OF TASK
      EXPORTING
        iv_carrid             = ls_carrier-carrid
      EXCEPTIONS
        system_failure        = 1
        communication_failure = 2
        resource_failure      = 3.          " no free work process right now
    IF sy-subrc = 0.
      lv_started += 1.
    ENDIF.
  ENDLOOP.

  WAIT FOR ASYNCHRONOUS TASKS UNTIL lo_collector->mv_done >= lv_started UP TO 600 SECONDS.
```

- The callback runs only while the caller is waiting (`WAIT`) or between dialog steps.
- `RECEIVE RESULTS` must be called inside the callback, for the same function module.
- With `resource_failure`, real programs wait a little and try again instead of skipping the package. The function module `SPBT_INITIALIZE` tells you how many work processes the group has free.

> [!WARNING]
> Every task takes a dialog work process. Start too many and the users can't work. Limit the number of parallel tasks, and agree on a server group with your basis team.

## Background RFC (bgRFC)

**bgRFC** records the calls in the database and runs them after `COMMIT WORK`, exactly once. With **queues** (qRFC) the calls of a queue also run in order. It replaces the old `CALL FUNCTION ... IN BACKGROUND TASK` (tRFC), which you'll still find in old code.

```abap
TRY.
    DATA(lo_destination) = cl_bgrfc_destination_outbound=>create( 'ZFLIGHT_BGRFC' ).
    DATA(lo_unit) = lo_destination->create_trfc_unit( ).

    CALL FUNCTION 'Z_FLIGHTS_OF_CARRIER'
      IN BACKGROUND UNIT lo_unit
      EXPORTING
        iv_carrid = 'LH'.

    COMMIT WORK.                       " the unit is saved and then executed
  CATCH cx_bgrfc_invalid_destination INTO DATA(lx_error).
    WRITE / lx_error->get_text( ).
ENDTRY.
```

The destination name is an inbound or outbound bgRFC destination defined in `SBGRFCCONF`. You watch units in `SBGRFCMON`. Exporting parameters are ignored: nobody waits for the result.

## The background processing framework

The **background processing framework (bgPF)** is the modern, class-based way to run code asynchronously after the commit. It's built on bgRFC and is released for ABAP Cloud. You write an operation class and hand an instance to a process:

```abap
CLASS zcl_flight_recalc DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_bgmc_op_single_tx_uncontr.
    METHODS constructor IMPORTING iv_carrid TYPE s_carr_id.
  PRIVATE SECTION.
    DATA mv_carrid TYPE s_carr_id.
ENDCLASS.

CLASS zcl_flight_recalc IMPLEMENTATION.
  METHOD constructor.
    mv_carrid = iv_carrid.
  ENDMETHOD.

  METHOD if_bgmc_op_single_tx_uncontr~execute.
    " runs later, in the background, in its own LUW
    UPDATE sflight SET seatsocc = 0 WHERE carrid = @mv_carrid AND fldate < @sy-datum.
  ENDMETHOD.
ENDCLASS.
```

```abap
TRY.
    DATA(lo_process) = cl_bgmc_process_factory=>get_default( )->create( ).
    lo_process->set_name( 'Recalculate flights' ).
    lo_process->set_operation_tx_uncontrolled( NEW zcl_flight_recalc( 'LH' ) ).
    lo_process->save_for_execution( ).
    COMMIT WORK.                      " the process starts after the commit
  CATCH cx_bgmc INTO DATA(lx_bgmc).
    WRITE / lx_bgmc->get_text( ).
ENDTRY.
```

The object is serialized, so its attributes must be serializable. There's also a **controlled** variant (`IF_BGMC_OP_SINGLE`) that follows the RAP transactional phases. The framework is available from ABAP 7.58 (SAP S/4HANA 2023) and in SAP BTP; on older releases, use bgRFC.

## Exercise

> [!IMPORTANT]
>
> 1. Create the remote-enabled function module `Z_FLIGHTS_OF_CARRIER`.
> 2. Write the aRFC report and run it. Compare the run time with a simple loop that calls the function module synchronously.
> 3. Set `UP TO 1 SECONDS` in the `WAIT` and see what happens to the results that arrive late.

### Solution

The synchronous version calls `CALL FUNCTION 'Z_FLIGHTS_OF_CARRIER' EXPORTING iv_carrid = ls_carrier-carrid IMPORTING ev_seats_free = lv_seats.` inside the loop. With few, small airlines the parallel version may even be slower: starting a task has a cost, so parallel processing pays off only with large packages. With a short `WAIT`, the program goes on before all the callbacks have run, and the late results are lost.

> [!NOTE]
>
> - aRFC (`STARTING NEW TASK`) runs remote-enabled function modules in parallel; you collect results with a callback and `WAIT FOR ASYNCHRONOUS TASKS`.
> - Always handle `resource_failure` and limit the number of parallel tasks.
> - bgRFC (`IN BACKGROUND UNIT`) runs calls after `COMMIT WORK`, exactly once, optionally in order; configure it in `SBGRFCCONF`, monitor it in `SBGRFCMON`.
> - The background processing framework wraps bgRFC in classes: an operation class plus `CL_BGMC_PROCESS_FACTORY`.
> - Parallel processing pays off only when each package has enough work.
