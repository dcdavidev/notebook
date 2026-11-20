---
title: BAdIs
description: Find, implement, and filter Business Add-Ins.
---

_Pro level_

A **BAdI** (Business Add-In) is an object-oriented extension point. SAP defines an [interface](./0084-interfaces.en.md) and calls its methods at a planned place in the standard code; you write a class that implements the interface, and SAP calls your class. BAdIs are the preferred way to extend standard SAP: the interface tells you exactly what you get and what you may change, and your code survives upgrades.

There are two generations: **classic BAdIs** (from release 4.6) and **new BAdIs**, also called kernel BAdIs, part of the enhancement framework since 7.0. You implement both, but you'll define only new ones.

## The parts of a BAdI

| Part                       | What it is                                                     |
| -------------------------- | -------------------------------------------------------------- |
| enhancement spot           | container of one or more BAdI definitions (new BAdIs only)     |
| BAdI definition            | the BAdI itself: interface, settings, filters (`SE18`)         |
| BAdI interface             | the methods SAP calls, for example `IF_EX_BADI_MATERIAL_CHECK` |
| enhancement implementation | your container, with one or more BAdI implementations (`SE19`) |
| BAdI implementation        | your class plus its filter values; can be active or inactive   |
| fallback class             | the class that runs when no implementation fits (optional)     |

Important settings of a BAdI definition:

- **multiple use**: all active implementations run, one after the other. Their methods may only have importing and changing parameters, because several implementations can't all return a result. A **single-use** BAdI runs exactly one implementation, so its methods can also have exporting and returning parameters.
- **filter**: implementations declare the values they're for (a company code, a country, an order type), and SAP calls only those that match.

> [!TIP]
> A BAdI is a job advert. SAP writes the job description (the interface) and says where the person will sit (the call). You send in your candidate (the implementation class). With a filter, the advert says "for the Milan office only", and the candidate states which offices they cover.

## Find a BAdI

- **In the code**: search the program for `GET BADI` (new BAdIs) and `CL_EXITHANDLER=>GET_INSTANCE` (classic BAdIs). The variable's type, or the `exit_name` parameter, gives the BAdI name.
- **With the debugger**: set a breakpoint on the **statement** `GET BADI` (and one on the method `CL_EXITHANDLER=>GET_INSTANCE`), run the transaction, and note each BAdI the debugger stops on.
- **In `SPRO`**: many application areas have a **Business Add-Ins (BAdIs)** node with documentation.
- **By package**: in `SE84`, **Enhancements > Business Add-Ins > Definitions**, filtered by the package of the transaction.

Always read the documentation in `SE18` before you implement: it says when the BAdI is called and what you may do in it.

## Implement a new BAdI

1. In `SE19` (or in ADT: **New > BAdI Implementation**), create an enhancement implementation for the enhancement spot, for example `ZEI_FLIGHT_PRICE`.
2. Inside it, create the BAdI implementation and its class, for example `ZCL_FLIGHT_PRICE_LH`.
3. Enter the filter values, if the BAdI has filters.
4. Implement the methods, activate the class, and activate the enhancement implementation.

Your class implements the BAdI interface, which itself includes the tag interface `IF_BADI_INTERFACE`:

```abap
CLASS zcl_flight_price_lh DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES zif_badi_flight_price.
ENDCLASS.

CLASS zcl_flight_price_lh IMPLEMENTATION.
  METHOD zif_badi_flight_price~adjust_price.
    " 10% discount on Lufthansa flights in economy class
    IF iv_class = 'Y'.
      cv_price = cv_price * '0.9'.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

## Call a BAdI: GET BADI and CALL BADI

This is the code on the calling side, as SAP writes it in the standard, or as you write it for your own BAdI (`ZBADI_FLIGHT_PRICE` in the spot `ZES_FLIGHT`, with a filter `CARRID`):

```abap
DATA lo_badi  TYPE REF TO zbadi_flight_price.   " the BAdI name is the type
DATA lv_price TYPE s_price VALUE '500.00'.

TRY.
    GET BADI lo_badi
      FILTERS
        carrid = 'LH'.

    CALL BADI lo_badi->adjust_price
      EXPORTING
        iv_class = 'Y'
      CHANGING
        cv_price = lv_price.

  CATCH cx_badi_not_implemented.
    " single-use BAdI without active implementation and without fallback class
ENDTRY.

WRITE / lv_price.          " 450.00 with the implementation above
```

- `GET BADI` selects the active implementations that match the filter. For a multiple-use BAdI without implementations, nothing happens and `CALL BADI` does nothing.
- `cl_badi_query=>number_of_implementations( lo_badi )` tells you how many were found.
- The BAdI object is cheap: when nothing is implemented, the call costs almost nothing.

## Classic BAdIs

Classic BAdIs have no enhancement spot and no `GET BADI`. You recognize them by this pattern:

```abap
DATA lo_exit TYPE REF TO if_ex_badi_material_check.

CALL METHOD cl_exithandler=>get_instance
  EXPORTING
    exit_name = 'BADI_MATERIAL_CHECK'
  CHANGING
    instance  = lo_exit.

IF lo_exit IS BOUND.
  " call the interface methods here, such as lo_exit->check_data( ),
  " with the parameters the interface defines
ENDIF.
```

You implement them in `SE19` too (**Classic BAdI**, implementation name, class `ZCL_IM_...`). A filter-dependent classic BAdI has an extra `flt_val` parameter in every method.

> [!WARNING]
> BAdI methods run inside the standard LUW. Don't `COMMIT WORK`, don't send `MESSAGE ... TYPE 'E'` unless the documentation allows it, and return errors in the way the interface provides (a changing parameter, a return table, or an exception declared in the method).

> [!CAUTION]
> A deactivated implementation still exists in every system it was transported to. Inactive enhancement implementations sometimes get activated by mistake in a later transport. Delete implementations you no longer need, and keep the filter values tight so your code runs only where it should.

## Exercise

> [!IMPORTANT]
>
> 1. In ADT, create the enhancement spot `ZES_FLIGHT` with the BAdI `ZBADI_FLIGHT_PRICE` (multiple use, filter `CARRID` of type `S_CARR_ID`) and the interface `ZIF_BADI_FLIGHT_PRICE` with the method `ADJUST_PRICE` (importing `IV_CLASS TYPE S_CLASS`, changing `CV_PRICE TYPE S_PRICE`).
> 2. Create an implementation for `CARRID = 'LH'` with the discount above.
> 3. Write a report that calls the BAdI for `LH` and for `AZ` and prints the two prices.

### Solution

```abap
REPORT zbadi_flight_price_test.

START-OF-SELECTION.
  DATA lo_badi TYPE REF TO zbadi_flight_price.
  DATA lt_carriers TYPE STANDARD TABLE OF s_carr_id WITH EMPTY KEY.

  lt_carriers = VALUE #( ( 'LH' ) ( 'AZ' ) ).
  LOOP AT lt_carriers INTO DATA(lv_carrid).
    DATA(lv_price) = CONV s_price( '500.00' ).
    GET BADI lo_badi FILTERS carrid = lv_carrid.
    CALL BADI lo_badi->adjust_price
      EXPORTING iv_class = 'Y'
      CHANGING  cv_price = lv_price.
    WRITE: / lv_carrid, lv_price.
  ENDLOOP.
```

`LH` prints 450.00 and `AZ` prints 500.00: for `AZ` no implementation matches the filter, and a multiple-use BAdI simply does nothing.

> [!NOTE]
>
> - A BAdI is an interface that SAP calls; you implement it with a class in an enhancement implementation.
> - New BAdIs: `GET BADI` and `CALL BADI`, organized in enhancement spots; classic BAdIs: `CL_EXITHANDLER=>GET_INSTANCE`.
> - Find BAdIs in the code, with a breakpoint on the `GET BADI` statement, in `SPRO`, or in `SE18`.
> - Multiple-use BAdIs run all matching implementations; filters choose which implementations apply.
> - Read the BAdI documentation, return errors as the interface intends, and never commit inside a BAdI.
