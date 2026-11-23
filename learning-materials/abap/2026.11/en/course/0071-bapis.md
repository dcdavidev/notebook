---
title: BAPIs
description: Call standard business APIs and handle BAPIRET2.
level: basic
---

When your program has to create a sales order, post an invoice, or book a flight, you shouldn't write directly into SAP's tables: the standard transactions do many checks and updates that you'd miss. Instead, you call a **BAPI** (Business Application Programming Interface): a standard [function module](./0070-function-modules.md) that performs a business operation with all the checks of the transaction.

BAPIs follow strict rules, and once you know them you can use any BAPI in the same way.

## What makes a function module a BAPI

A BAPI is a remote-enabled function module that implements a method of a business object, such as `SalesOrder.CreateFromData` or `Flight.GetList`. Every BAPI follows the same conventions:

- The name is `BAPI_<object>_<method>`, for example `BAPI_FLIGHT_GETLIST`.
- It has no classic exceptions. Errors and other messages come back in a parameter called `RETURN`, of type `BAPIRET2` (a structure or a table).
- It doesn't show screens or popups, so it also works in the background and over [RFC](./0124-rfc.md).
- It **doesn't commit**. The caller decides when to save, with `BAPI_TRANSACTION_COMMIT`, or to discard, with `BAPI_TRANSACTION_ROLLBACK`.

Use transaction `BAPI` (the BAPI Explorer) to browse the business objects by application area and see their BAPIs, with documentation and parameters. Then test them in `SE37`.

> [!TIP]
> A BAPI is like the counter of a bank. You don't walk into the vault to move money yourself: you fill in a form, the clerk checks it, and gives you back a receipt that says "done" or "rejected, because...". The receipt is `RETURN`.

## The BAPIRET2 structure

| Field                         | Content                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `TYPE`                        | message type: `S` success, `I` info, `W` warning, `E` error, `A` abort |
| `ID`, `NUMBER`                | message class and message number                                       |
| `MESSAGE`                     | the message text, already filled in                                    |
| `MESSAGE_V1` ... `MESSAGE_V4` | the message variables                                                  |
| `PARAMETER`, `ROW`, `FIELD`   | which parameter, row, and field the message refers to                  |

The BAPI failed if `RETURN` contains at least one message of type `E` or `A`. An empty `RETURN` usually means success, but some BAPIs also return an `S` message to confirm.

> [!WARNING]
> `sy-subrc` after a BAPI call is almost always `0`, even when the BAPI failed: there are no exceptions to set it. Always check the `RETURN` parameter.

## Reading data with a BAPI

The flight model has its own BAPIs, so you can try them on any system with flight data:

```abap
REPORT zflight_bapi_list.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  DATA lt_flights TYPE STANDARD TABLE OF bapisfldat WITH EMPTY KEY.
  DATA lt_return  TYPE STANDARD TABLE OF bapiret2 WITH EMPTY KEY.

  CALL FUNCTION 'BAPI_FLIGHT_GETLIST'
    EXPORTING
      airline     = p_carrid
      max_rows    = 20
    TABLES
      flight_list = lt_flights
      return      = lt_return.

  LOOP AT lt_return INTO DATA(ls_return) WHERE type CA 'EA'.
    WRITE: / ls_return-message.
    RETURN.
  ENDLOOP.

  LOOP AT lt_flights INTO DATA(ls_flight).
    WRITE: / ls_flight-airlineid, ls_flight-connectid, ls_flight-flightdate,
             ls_flight-cityfrom, ls_flight-cityto.
  ENDLOOP.
```

Note that BAPI parameters use English field names (`AIRLINEID`, `CONNECTID`) instead of the technical names of the tables (`CARRID`, `CONNID`). Many older BAPIs still use `TABLES` parameters, as here.

## Changing data: commit or roll back

A BAPI that creates or changes data prepares the changes, but nothing is saved until you commit. Check `RETURN` first, then decide:

```abap
REPORT zflight_bapi_booking.

START-OF-SELECTION.
  " Take any flight, customer, and travel agency from the flight data
  SELECT SINGLE carrid, connid, fldate FROM sflight WHERE carrid = 'LH' INTO @DATA(ls_flight).
  SELECT SINGLE id FROM scustom INTO @DATA(lv_customer).
  SELECT SINGLE agencynum FROM stravelag INTO @DATA(lv_agency).

  DATA ls_booking TYPE bapisbonew.
  ls_booking-airlineid  = ls_flight-carrid.
  ls_booking-connectid  = ls_flight-connid.
  ls_booking-flightdate = ls_flight-fldate.
  ls_booking-customerid = lv_customer.
  ls_booking-agencynum  = lv_agency.
  ls_booking-class      = 'Y'.                 " economy
  ls_booking-passname   = 'Mario Rossi'.

  DATA lv_booking_id TYPE bapisbokey-bookingid.
  DATA lt_return     TYPE STANDARD TABLE OF bapiret2 WITH EMPTY KEY.

  CALL FUNCTION 'BAPI_FLBOOKING_CREATEFROMDATA'
    EXPORTING
      booking_data  = ls_booking
    IMPORTING
      bookingnumber = lv_booking_id
    TABLES
      return        = lt_return.

  DATA(lv_error) = abap_false.
  LOOP AT lt_return INTO DATA(ls_return) WHERE type CA 'EA'.
    lv_error = abap_true.
    WRITE: / ls_return-message.
  ENDLOOP.

  IF lv_error = abap_true.
    CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
  ELSE.
    DATA ls_commit_return TYPE bapiret2.
    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
      EXPORTING
        wait   = abap_true                    " wait until the update is done
      IMPORTING
        return = ls_commit_return.
    WRITE: / 'Booking created:', lv_booking_id.
  ENDIF.
```

- `WAIT = abap_true` makes the commit wait until the database update has finished. Use it when the next statement reads the data you just saved, or calls another BAPI that needs it.
- `BAPI_TRANSACTION_COMMIT` and `BAPI_TRANSACTION_ROLLBACK` end the [SAP LUW](./0060-luw-commit-and-rollback.md): all BAPI calls since the last commit are saved or discarded together.

> [!CAUTION]
> Never call `COMMIT WORK` or a commit BAPI after a BAPI that returned an error. Some BAPIs leave partial changes in the update buffer, and a commit would save inconsistent data. Roll back instead.

To test a changing BAPI in `SE37`, use **Function Module > Test > Test Sequences**: enter the BAPI and then `BAPI_TRANSACTION_COMMIT`, so both run in the same session. A single test of the BAPI alone doesn't save anything.

## Exercise

> [!IMPORTANT]
>
> 1. Find the business object for flight bookings in transaction `BAPI` and list its BAPIs.
> 2. Write a report that creates a booking with `BAPI_FLBOOKING_CREATEFROMDATA`, with the flight given on the selection screen.
> 3. Print all messages of `RETURN`, commit only if there's no error, and check the new booking in `SBOOK` with `SE16`.

### Solution

1. In `BAPI`, switch to the **Alphabetical** tab and open `FlightBooking`: among its methods you'll find `CreateFromData`, `GetList`, `GetDetail`, and `Cancel`. Click a method to see the function module behind it, such as `BAPI_FLBOOKING_CREATEFROMDATA`.
2. Start from the booking report above and replace the `SELECT SINGLE` on `SFLIGHT` with parameters `p_carrid`, `p_connid`, and `p_fldate`.
3. Change the loop to `LOOP AT lt_return INTO DATA(ls_return).` so it prints every message, and keep the `WHERE type CA 'EA'` check in a separate loop or with an `IF` inside. After the commit, the booking number appears in `SBOOK` with your customer ID.

> [!NOTE]
>
> - A BAPI is a remote-enabled function module that performs a business operation with all standard checks.
> - Errors don't raise exceptions: check the `RETURN` parameter (`BAPIRET2`) for messages of type `E` or `A`.
> - BAPIs don't commit: call `BAPI_TRANSACTION_COMMIT` (with `WAIT`) on success, `BAPI_TRANSACTION_ROLLBACK` on error.
> - Use transaction `BAPI` to find BAPIs and `SE37` test sequences to try changing BAPIs.
> - BAPI field names are often in English (`AIRLINEID`), not the table field names (`CARRID`).
