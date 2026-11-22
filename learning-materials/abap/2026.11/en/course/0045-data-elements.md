---
title: Data elements
description: Business meaning, field labels, and documentation of a field.
---

_Basic level_

A **data element** gives a field its business meaning. It says what the field is ("airline code", "flight status"), which labels the user sees, and which documentation appears with F1. For the technical type, it usually refers to a [domain](./0044-domains.md).

Data elements are the types you use most in ABAP: almost every field of a database table and almost every variable that holds business data is typed with one.

## The type of a data element

In `SE11` (**Data type** > **Data element**) or in ADT, the **Data Type** tab offers three choices:

| Choice          | Meaning                                                          | Example                             |
| --------------- | ---------------------------------------------------------------- | ----------------------------------- |
| domain          | the type, length, and value range come from a domain             | `S_CARR_ID` uses domain `S_CARR_ID` |
| predefined type | a Dictionary type and length, entered directly, without a domain | `CHAR 30`                           |
| reference type  | a reference to a class, an interface, or a type                  | `REF TO cl_abap_typedescr`          |

A domain is the best choice when the same technical rules apply to many fields, or when you need fixed values or a conversion routine. A predefined type is fine for a one-off field with no rules.

## Field labels

The **Field Label** tab holds the texts that screens, selection screens, and ALV lists show for any field typed with the data element:

| Label   | Max. length | Used for                 |
| ------- | ----------- | ------------------------ |
| short   | 10          | narrow columns           |
| medium  | 20          | field labels on screens  |
| long    | 40          | wider labels             |
| heading | 55          | column headings in lists |

For the data element `ZE_FLIGHT_STATUS` the labels could be:

```text
Data element:  ZE_FLIGHT_STATUS
Short text:    Flight status
Domain:        ZD_FLIGHT_STATUS

Field labels:  Length  Text
  Short        10      Status
  Medium       20      Flight status
  Long         40      Status of the flight
  Heading      15      Flight status
```

Labels are translated with the rest of the system texts (transaction `SE63`), so a user who logs on in Italian sees Italian labels with no change to the program.

> [!TIP]
> A domain is the size and shape of a jar; a data element is the label you stick on it: "sugar", "salt". Two jars can be identical and still mean very different things, and the label is what tells the cook which one to use.

## Documentation and other attributes

Beyond labels, a data element can carry:

- **Documentation**: the text the user sees when pressing F1 on the field. Write it in the **Documentation** button of the data element.
- **Search help**: the F4 help to offer for the field, see [search helps](./0050-search-helps.md).
- **Parameter ID**: a key in SAP memory used to prefill the field across transactions, such as `MAT` for the material number. See [calling programs, SAP memory, and ABAP memory](./0072-calling-programs-and-memory.md).
- **Default component name**: a suggested field name for tables and structures that use the data element.
- **Change document**: a flag that makes changes to the field appear in [change documents](./0118-change-documents.md).

## Using data elements in ABAP

You use a data element after `TYPE` like any other type. The variable then has exactly the type of every database field built on the same data element:

```abap
REPORT zflight_status_demo.

PARAMETERS p_carrid TYPE s_carr_id.          " label and F4 from the Dictionary
PARAMETERS p_status TYPE ze_flight_status VALUE CHECK. " fixed values from the domain

START-OF-SELECTION.
  DATA lv_status TYPE ze_flight_status.
  lv_status = p_status.
  WRITE: / p_carrid, lv_status.
```

On the selection screen, the input field for `p_status` offers the fixed values of the domain with F4, and `VALUE CHECK` rejects any other value (selection screens are covered in [selection screens: PARAMETERS](./0063-parameters.md)). To show the Dictionary label instead of the parameter name, set the **Dictionary reference** flag in the selection texts of the program (see [text symbols and translation](./0062-text-symbols-and-translation.md)).

> [!WARNING]
> Don't create a new data element for every field "just in case". Check first whether a standard one exists with the right meaning (`S_CARR_ID`, `S_DATE`, `SYUNAME`...). Reusing the right data element gives you labels, help, and F4 for free. Reusing one with a wrong meaning gives the user wrong labels.

## Exercise

> [!IMPORTANT]
>
> 1. Create the data element `ZE_FLIGHT_STATUS` with the domain `ZD_FLIGHT_STATUS` from [domains](./0044-domains.md), fill the four field labels, and activate it.
> 2. Write a report with `PARAMETERS p_status TYPE ze_flight_status VALUE CHECK`, run it, and press F4 on the field. Then try to enter `X`.

### Solution

1. In `SE11` choose **Data type**, enter `ZE_FLIGHT_STATUS`, choose **Data element**, enter the domain `ZD_FLIGHT_STATUS` in the **Data Type** tab, fill the labels in the **Field Label** tab, save, and activate.
2. F4 shows the three fixed values with their descriptions. With `X`, the screen shows an error and doesn't let you continue, because `X` isn't a fixed value of the domain.

> [!NOTE]
>
> - A data element gives a field its meaning; its technical type usually comes from a domain.
> - The field labels (short, medium, long, heading) appear on screens and lists and are translatable.
> - A data element can also carry F1 documentation, a search help, and a parameter ID.
> - Type your variables and parameters with data elements to get the same type as the database fields.
> - Reuse a standard data element only when its meaning really fits.
