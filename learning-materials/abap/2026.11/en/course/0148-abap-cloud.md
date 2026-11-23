---
title: ABAP Cloud and clean core
description: Released APIs, language versions, the tier model, and the XCO library.
level: pro
---

For decades, custom ABAP code could read any SAP table, call any function module, and even change SAP's own programs. That freedom made upgrades slow and expensive: every new release could break something. **Clean core** is SAP's answer: keep the standard system unchanged and build extensions only on stable, documented interfaces. **ABAP Cloud** is the development model that enforces it, in the SAP BTP ABAP environment, in SAP S/4HANA Cloud, and, from release 2022, in SAP S/4HANA on premise too.

## Language versions

Every ABAP object has an **ABAP language version** that decides which statements and objects it may use. You see it in ADT in the **Properties** view of the object.

| Language version           | What it allows                                                                   | Where you meet it                 |
| -------------------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| Standard ABAP              | the whole language and every repository object                                   | classic development on premise    |
| ABAP for Cloud Development | a restricted language, and only released APIs and your own objects               | ABAP Cloud, everywhere            |
| ABAP for Key Users         | an even smaller language for business add-ins written by key users in a web tool | key user extensibility in S/4HANA |

With **ABAP for Cloud Development**, the syntax check rejects everything that isn't cloud-ready. These lines compile in Standard ABAP but are errors in ABAP Cloud:

```abap
SELECT * FROM mara INTO TABLE @DATA(lt_mara).   " MARA isn't released: use I_Product
WRITE / 'Hello'.                                " no classic lists
CALL TRANSACTION 'VA01'.                        " no SAP GUI transactions
DATA(lv_today) = sy-datum.                      " use cl_abap_context_info=>get_system_date( )
```

What's left is still a lot: classes, interfaces, internal tables, ABAP SQL, CDS, RAP, ABAP Unit, and modern expressions. Instead of reports, you write classes that implement `if_oo_adt_classrun` and run them with F9 in ADT, or you build services and Fiori apps.

## Released APIs

A **released API** is an SAP object (a CDS view, a class, an interface, a data element, a BAdI) that SAP promises to keep stable. Every released object has one or more **release contracts**:

| Contract | Meaning                                                            | Example                                  |
| -------- | ------------------------------------------------------------------ | ---------------------------------------- |
| C0       | you can extend it (add fields, implement it as an extension point) | an extension include, a released BAdI    |
| C1       | you can use it inside the same system, in ABAP Cloud code          | `I_Product`, `CL_ABAP_CONTEXT_INFO`      |
| C2       | you can call it from outside as a remote API                       | an OData or SOAP service for integration |

There are other contracts for special cases, such as configuration content and AMDP. To check an object in ADT, open it and look at the **API State** tab in the **Properties** view. The project explorer also has a **Released Objects** tree with everything that's released in your system. When an old object you used isn't released, look for its **successor**: SAP publishes the mapping in the Cloudification Repository on GitHub, and ADT shows it in the API state (for example, `MARA` points to `I_Product`).

## The tier model

On SAP S/4HANA on premise and private cloud, you can't move everything to ABAP Cloud overnight. The **3-tier model** organizes the code you have:

| Tier   | Language version           | What lives there                                                                            |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------- |
| Tier 1 | ABAP for Cloud Development | new extensions, using only released APIs: the target for all new code                       |
| Tier 2 | Standard ABAP              | **wrappers**: your classes that call an unreleased API and that you release (C1) for tier 1 |
| Tier 3 | Standard ABAP              | classic custom code: modifications, old reports, direct table access                        |

When tier 1 code needs something that SAP hasn't released yet, for example a BAPI, you write a small wrapper class in tier 2, release it for cloud development, and call it from tier 1. When SAP releases a proper API later, you replace the wrapper.

SAP has since refined this model into **clean core levels A to D**: level A is ABAP Cloud with released APIs only, level B allows stable classic APIs such as BAPIs, and levels C and D cover internal objects and modifications, which make upgrades risky. The idea is the same: move your code toward the top level, one object at a time. To find what isn't cloud-ready, run the ATC with a cloud readiness check variant (see [code quality](./0107-code-quality.md)).

> [!TIP]
> Clean core is like renting a furnished apartment. You can bring your own furniture and hang pictures on the hooks the owner put in the walls (released APIs), but you don't knock down walls. When the owner renovates the building (an upgrade), your things are still where you left them.

## The XCO library

The **XCO library** (Extension Components) is a set of released classes that cover common tasks in ABAP Cloud: system information, strings, time, the ABAP repository, and generation of objects. Everything starts from the class `xco_cp` or from a specialized class such as `xco_cp_abap_repository`, and you chain calls to get to the value you need:

```abap
CLASS zcl_cloud_demo DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_cloud_demo IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    " system information
    DATA(lv_user) = xco_cp=>sy->user( )->name.
    DATA(lv_date) = xco_cp=>sy->date( )->as( xco_cp_time=>format->iso_8601_extended )->value.
    out->write( |User { lv_user }, date { lv_date }| ).

    " strings
    DATA(lt_carriers) = xco_cp=>string( `LH,AA,UA` )->split( `,` )->value.
    out->write( lt_carriers ).

    " the ABAP repository
    IF xco_cp_abap_repository=>object->clas->for( 'ZCL_CLOUD_DEMO' )->exists( ).
      out->write( `The class exists` ).
    ENDIF.

    " a released CDS view instead of a classic table
    SELECT Currency, Decimals
      FROM I_Currency
      ORDER BY Currency
      INTO TABLE @DATA(lt_currencies)
      UP TO 5 ROWS.
    out->write( lt_currencies ).
  ENDMETHOD.
ENDCLASS.
```

XCO also reads and writes JSON (see [JSON and XML](./0127-json-and-xml.md)) and can generate tables, CDS views, and classes from code. Many classic APIs have a released alternative outside XCO too, such as `cl_abap_context_info` for the user and the date, and `cl_system_uuid` for UUIDs.

> [!WARNING]
> Not every class whose name starts with `CL_` or `XCO_` is released. Check the API state before you build on it. If a class works in Standard ABAP but not in your cloud object, the syntax check tells you exactly which object isn't released.

## Exercise

> [!IMPORTANT]
>
> 1. Create the class `ZCL_CLOUD_DEMO` with language version **ABAP for Cloud Development** and run it with F9.
> 2. Add `SELECT * FROM mara` and read the error message. Find the successor of `MARA` in the API state.
> 3. Replace the query with a read of five products from the successor.

### Solution

The successor of `MARA` is the released view `I_Product`:

```abap
SELECT Product, ProductType, BaseUnit
  FROM I_Product
  ORDER BY Product
  INTO TABLE @DATA(lt_products)
  UP TO 5 ROWS.
out->write( lt_products ).
```

> [!NOTE]
>
> - Clean core keeps the standard unchanged; ABAP Cloud enforces it with the language version **ABAP for Cloud Development**.
> - In ABAP Cloud you can use only released APIs (contracts C0, C1, C2) and your own objects; check the **API State** and look for successors.
> - The 3-tier model separates cloud-ready code (tier 1), released wrappers (tier 2), and classic code (tier 3); clean core levels A–D refine it.
> - The XCO library and classes such as `cl_abap_context_info` replace system fields and many classic APIs.
> - Write new code in tier 1, and move old code there step by step.
