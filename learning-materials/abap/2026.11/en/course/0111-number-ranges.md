---
title: Number ranges
description: Generate unique document numbers with SNRO.
level: intermediate
---

Every sales order, invoice, and booking in SAP has a unique number. Many users create documents at the same time, so the number can't come from "the highest number in the table plus one": two users would read the same maximum and get the same number. SAP solves this with **number ranges**: a central counter that hands out each number exactly once.

Your own applications use the same mechanism. You define a **number range object** in transaction `SNRO`, and your program asks it for the next number.

## Number range objects and intervals

A **number range object** is the counter for one kind of document. It has:

- a name of up to 10 characters, for example `ZFLBOOK`;
- a **number length domain**, which sets the length of the numbers, for example `NUM10` for 10 digits;
- one or more **intervals**.

An **interval** is a range of numbers with its own counter:

| Field         | Meaning                                                         | Example      |
| ------------- | --------------------------------------------------------------- | ------------ |
| No.           | the interval number (number range number)                       | `01`         |
| From number   | the first number                                                | `0000000001` |
| To number     | the last number                                                 | `0999999999` |
| Number status | the last number handed out                                      | `0000004711` |
| Ext           | external: the user enters the number, the system only checks it | off          |

Different intervals let you separate kinds of documents: for example `01` for bookings on the web and `02` for bookings at the counter. If the object has a **subobject** (such as the company code), each subobject value has its own intervals.

> [!TIP]
> A number range is the ticket machine at a deli counter. Each customer pulls a ticket and gets a different number, even if ten people pull at the same moment. Nobody counts the people in the queue to find their number.

## Creating the object in SNRO

```text
SNRO > Object: ZFLBOOK > Create
  Short text:            Flight bookings
  Long text:             Booking numbers for custom flight bookings
  Number length domain:  NUM10
  Warning %:             10.0      (warn when 10% of the interval is left)
  Main memory buffer:    No. of numbers in buffer: 10
Save, then: Intervals > Change > Insert interval
  No. 01   From 0000000001   To 0999999999
```

Interval maintenance is also available in transaction `SNUM` or through the class `CL_NUMBERRANGE_INTERVALS`.

> [!CAUTION]
> Intervals are client-dependent, and their number status changes in every system. Don't transport intervals into a production system that already uses them: the transport overwrites the number status, and the system hands out numbers that already exist. Create the intervals directly in each system, or transport them only once, before go-live.

## Getting the next number

The classic function module is `NUMBER_GET_NEXT`:

```abap
DATA lv_booking_no TYPE n LENGTH 10.
DATA lv_returncode TYPE inri-returncode.

CALL FUNCTION 'NUMBER_GET_NEXT'
  EXPORTING
    nr_range_nr             = '01'
    object                  = 'ZFLBOOK'
  IMPORTING
    number                  = lv_booking_no
    returncode              = lv_returncode
  EXCEPTIONS
    interval_not_found      = 1
    number_range_not_intern = 2
    object_not_found        = 3
    quantity_is_0           = 4
    quantity_is_not_1       = 5
    interval_overflow       = 6
    buffer_overflow         = 7
    OTHERS                  = 8.

IF sy-subrc <> 0.
  MESSAGE ID sy-msgid TYPE 'E' NUMBER sy-msgno
          WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
ENDIF.

CASE lv_returncode.
  WHEN '1'.
    MESSAGE 'The number range is almost exhausted' TYPE 'W'.
  WHEN '2'.
    MESSAGE 'This was the last number of the interval' TYPE 'W'.
ENDCASE.
```

The return code is empty when everything is fine, `1` when the number is in the warning zone set in `SNRO`, and `2` when it was the last number. With the parameter `quantity` you can request a block of numbers at once.

In S/4HANA and ABAP Cloud, use the class `CL_NUMBERRANGE_RUNTIME`, which raises class-based exceptions:

```abap
TRY.
    cl_numberrange_runtime=>number_get(
      EXPORTING nr_range_nr = '01'
                object      = 'ZFLBOOK'
      IMPORTING number      = DATA(lv_number)
                returncode  = DATA(lv_rc) ).
    lv_booking_no = lv_number.             " the number comes back with 20 digits
  CATCH cx_nr_object_not_found cx_number_ranges INTO DATA(lx_nr).
    MESSAGE lx_nr TYPE 'E'.
ENDTRY.
```

## Buffering and gaps

Reading the counter from the database for every number would create a bottleneck, so number ranges are usually **buffered**:

| Buffering          | Effect                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| No buffering       | every number is read from the database: no gaps, but slow under load                      |
| Main memory        | each application server keeps a block of numbers: fast, but gaps and numbers out of order |
| Parallel buffering | like main memory, but per work process, with fewer lock waits                             |

With main memory buffering, numbers left in the buffer when a server restarts are lost, and two servers hand out numbers that aren't in time order. That's fine for bookings. If the law requires numbers without gaps, as for invoices in many countries, switch the buffer off for that object.

> [!WARNING]
> Draw the number as late as possible, right before you save the document. A number drawn for a document that is then cancelled is gone: the counter never goes back, and with buffering a rollback doesn't return it.

## Exercise

> [!IMPORTANT]
>
> 1. Create the number range object `ZFLBOOK` in `SNRO` with the domain `NUM10` and an interval `01` from `1` to `999999999`.
> 2. Write a report that draws five numbers in a loop and prints them.
> 3. Change the interval's number status in `SNRO` and run the report again.

### Solution

```abap
REPORT zflbook_numbers.

DATA lv_number TYPE n LENGTH 10.

START-OF-SELECTION.
  DO 5 TIMES.
    CALL FUNCTION 'NUMBER_GET_NEXT'
      EXPORTING
        nr_range_nr = '01'
        object      = 'ZFLBOOK'
      IMPORTING
        number      = lv_number
      EXCEPTIONS
        OTHERS      = 1.
    IF sy-subrc <> 0.
      MESSAGE 'No number available' TYPE 'E'.
    ENDIF.
    WRITE: / lv_number.
  ENDDO.
```

> [!NOTE]
>
> - Number ranges hand out unique numbers even when many users create documents at once.
> - Define the object in `SNRO` with a number length domain and intervals; each interval has its own number status.
> - Draw numbers with `NUMBER_GET_NEXT` or `CL_NUMBERRANGE_RUNTIME=>NUMBER_GET` and check the return code.
> - Buffering makes number ranges fast but allows gaps; switch it off when the law requires gapless numbers.
> - Don't transport intervals over a system that uses them, and draw the number just before you save.
