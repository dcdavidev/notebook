---
title: Implicit and explicit enhancements
description: Add code at enhancement points and sections of standard programs.
---

_Pro level_

When there's no [BAdI](./0122-badis.en.md) or exit where you need one, the enhancement framework still lets you add code to standard programs without modifying them. **Explicit enhancements** are places that SAP marked in the code on purpose. **Implicit enhancements** exist automatically at the start and end of almost every routine. Your code lives in an **enhancement implementation**, a separate object of your package, so SAP's source stays untouched.

## Explicit enhancement points and sections

SAP places two statements in its code, each belonging to an **enhancement spot**:

```abap
" An enhancement point: your code is ADDED here
ENHANCEMENT-POINT ep_check_item SPOTS es_sapmzflight.

" An enhancement section: your code REPLACES the code between the two statements
ENHANCEMENT-SECTION es_price_calc SPOTS es_sapmzflight.
  lv_price = ls_flight-price.
END-ENHANCEMENT-SECTION.
```

- At an **enhancement point**, your implementation runs in addition to the standard code. Several implementations can exist for the same point.
- At an **enhancement section**, your implementation runs **instead of** the standard code between `ENHANCEMENT-SECTION` and `END-ENHANCEMENT-SECTION`. Only one implementation can be active.
- `STATIC` points are meant for declarations (`DATA`, `TYPES`) and are always active; dynamic points (the default) can be switched off by the Switch Framework.

> [!TIP]
> Explicit enhancements are the dotted lines on a printed form: "add your notes here". An enhancement section is a box that says "cross out and rewrite if needed". Implicit enhancements are the margins at the top and bottom of every page: always there, even if nobody planned to write in them.

## Implicit enhancement options

Without any marking by SAP, an implicit enhancement option exists:

- at the **start and end** of every `FORM`, function module, and method (in function modules and methods: right after the signature and before the end statement);
- at the **end** of every include and of the main program;
- at the **end of the declaration part** of structures defined with `BEGIN OF ... END OF`, to add components;
- for function modules, as **additional parameters** in the interface;
- for global class methods, as **pre-methods**, **post-methods**, and **overwrite methods**, and as extra attributes and methods of the class.

Implicit enhancement options aren't available in code that SAP has marked as not enhanceable, and not in some core basis programs.

## Create an implementation in the source code

In SAP GUI (`SE38`, `SE37`, or `SE80`):

1. Open the standard program in display mode.
2. Choose **Enhance** (`Shift+F4`, the spiral icon).
3. For implicit options, choose **Edit > Enhancement Operations > Show Implicit Enhancement Options**. They appear as lines marked with `"""""""""`.
4. Right-click the point or the option, and choose **Enhancement Implementation > Create Implementation**.
5. Enter the name of an enhancement implementation (for example `ZEI_FLIGHT_BOOKING`), a short text, your package, and a transport request.
6. Write the code between `ENHANCEMENT` and `ENDENHANCEMENT`, then activate (**Enhancements > Activate**).

Recent ADT releases also support source code enhancements, but the menu paths depend on the release, so the steps above use SAP GUI.

The result in the source looks like this. For example, at the end of a standard function module:

```abap
  " ... last statements of the standard function module ...

ENHANCEMENT 1  ZEI_FLIGHT_BOOKING.    "active version
  " Block bookings in first class for one test customer
  IF is_booking-class = 'F' AND is_booking-customid = '00004711'.
    RAISE booking_not_allowed.        " exception of the function module interface
  ENDIF.
ENDENHANCEMENT.
ENDFUNCTION.
```

The enhancement sees all the data visible at that point: parameters, local variables, and global data of the program.

## Method enhancements

For methods of global classes, open the class in `SE24` or `SE80` and choose **Class > Enhance**. Then, on the method:

| Option           | Runs                                      | Can access                                                   |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------ |
| pre-method       | before the original method                | the method's importing and changing parameters               |
| post-method      | after the original method                 | the importing, exporting, changing, and returning parameters |
| overwrite method | instead of the original method (only one) | all parameters                                               |

The framework generates a local class (`LCL_<enhancement>`) with methods `IPR_<method>` (pre), `IPO_<method>` (post), or `IOW_<method>` (overwrite). The attribute `core_object` references the enhanced object; through it you reach public attributes, and private ones if the enhancement is declared with access to them.

> [!WARNING]
> Implicit enhancements depend on code you don't control. A support package can move, rename, or remove the variable your enhancement reads, and your code stops compiling or, worse, keeps compiling with a different meaning. After every upgrade, `SPAU_ENH` lists the enhancements to check: test each one again.

> [!CAUTION]
> A syntax error in an enhancement breaks the standard program for every user, because your code is compiled with it. Always run the syntax check before you activate, and transport enhancements together with all the objects they use.

## Find existing enhancements

- `SE84` > **Enhancements > Enhancement Implementations**, filtered by your packages.
- In the standard source, active implementations are shown inline between `ENHANCEMENT` and `ENDENHANCEMENT`. Use **Edit > Enhancement Operations > Show Implementations** to see their names.
- The table `ENHINCINX` maps enhancement implementations to the programs and includes they're in.

## Exercise

> [!IMPORTANT]
>
> 1. Create a function module `Z_FLIGHT_GET_PRICE` (importing `IV_CARRID`, `IV_CONNID`, `IV_FLDATE`, exporting `EV_PRICE`) that reads the price from `SFLIGHT`. Pretend it's a standard object that you can't change.
> 2. Add an implicit enhancement at its end, in enhancement implementation `ZEI_FLIGHT_PRICE_ROUND`, that rounds `EV_PRICE` up to a whole number.
> 3. Call the function module from a report and check the result. Then deactivate the enhancement and call it again.

### Solution

```abap
ENHANCEMENT 1  ZEI_FLIGHT_PRICE_ROUND.    "active version
  ev_price = ceil( ev_price ).
ENDENHANCEMENT.
```

With the enhancement active, a price of `488.53` becomes `489.00`. When you deactivate the enhancement implementation, the function module returns `488.53` again, and its own source never changed.

> [!NOTE]
>
> - Explicit enhancements are `ENHANCEMENT-POINT` (add code) and `ENHANCEMENT-SECTION` (replace code), placed by SAP in enhancement spots.
> - Implicit enhancement options exist at the start and end of routines, at the end of includes and structures, and as pre, post, and overwrite methods.
> - Your code lives between `ENHANCEMENT` and `ENDENHANCEMENT` in an enhancement implementation of your package.
> - Enhancements see the data visible at that point, so they break easily when SAP changes the code around them.
> - Check every enhancement in `SPAU_ENH` after upgrades, and prefer BAdIs and exits when they exist.
