---
title: Domains
description: Technical type, length, value ranges, and conversion routines.
---

_Basic level_

A **domain** describes the technical side of a field: its Dictionary type, its length, the number of decimal places, and optionally the values it may take and how it's converted for display. It says nothing about the meaning of the field; that's the job of the [data element](./0045-data-elements.en.md).

Domains are the lowest level of the [ABAP Dictionary](./0043-abap-dictionary-intro.en.md). One domain is usually shared by many data elements, so a technical rule defined once applies to every field built on it.

## Technical attributes

The **Definition** tab of a domain in `SE11` (or the domain editor in ADT) holds these attributes:

| Attribute            | Meaning                                                                                   | Example |
| -------------------- | ----------------------------------------------------------------------------------------- | ------- |
| data type            | the Dictionary type: `CHAR`, `NUMC`, `DEC`, `CURR`, `DATS`, `INT4`...                     | `CHAR`  |
| number of characters | the length                                                                                | `3`     |
| decimal places       | only for numeric types such as `DEC`, `CURR`, `QUAN`                                      | `2`     |
| output length        | the width used on screens and lists                                                       | `3`     |
| conversion routine   | the conversion between internal and display format                                        | `ALPHA` |
| sign                 | whether negative values are allowed (numeric types)                                       | off     |
| lowercase            | whether lowercase letters are kept (`CHAR`); otherwise screens convert input to uppercase | off     |

The Dictionary types map to ABAP types:

| Dictionary type                | ABAP type             | Use                                 |
| ------------------------------ | --------------------- | ----------------------------------- |
| `CHAR`                         | `c`                   | text of fixed length                |
| `NUMC`                         | `n`                   | digits only, with leading zeros     |
| `DEC`, `CURR`, `QUAN`          | `p`                   | packed numbers, amounts, quantities |
| `INT1`, `INT2`, `INT4`, `INT8` | `b`, `s`, `i`, `int8` | integers                            |
| `DATS`, `TIMS`                 | `d`, `t`              | date and time                       |
| `CUKY`, `UNIT`                 | `c`                   | currency key, unit of measure       |
| `STRING`, `RAWSTRING`          | `string`, `xstring`   | text and bytes of any length        |

For example, the standard domain `S_CARR_ID` is `CHAR 3`, and `S_PRICE` is `CURR 15` with 2 decimals.

## Value ranges

The **Value Range** tab restricts the values a field may take. There are three options:

- **Fixed values**: a short list of single values, each with a description. Good for codes that only developers change, like a status.
- **Intervals**: ranges of allowed values, for example `1` to `9`.
- **Value table**: a table that holds the allowed values, for example `SCARR` for the domain `S_CARR_ID`. It's only a proposal: the real check comes from a foreign key, see [foreign keys and check tables](./0047-foreign-keys-and-check-tables.en.md).

A domain for the status of a flight could look like this:

```text
Domain:          ZD_FLIGHT_STATUS
Short text:      Flight status
Data type:       CHAR
No. characters:  1
Lowercase:       off

Fixed values:
  S   Scheduled
  D   Delayed
  C   Cancelled
```

Screens and selection screens check the input against the fixed values and show them as F4 help, with no code at all. The descriptions are stored in the tables `DD07L` and `DD07T`, and can be translated.

> [!WARNING]
> Fixed values are checked only on screens. ABAP code can put any value into the field, and an `INSERT` writes it to the database without complaint. If a value comes from a program or an interface, check it in your code.

## Conversion routines

A **conversion routine** turns a value from its internal format (how it's stored) into its display format (how the user sees it), and back. It's a pair of function modules named `CONVERSION_EXIT_xxxxx_INPUT` and `CONVERSION_EXIT_xxxxx_OUTPUT`, where `xxxxx` is the five-character name in the domain.

The most common one is **`ALPHA`**: numbers in a `CHAR` field are stored with leading zeros, and shown without them. The customer number `KUNNR` uses it: the user types `4711`, the database holds `0000004711`.

When you fill such a field in code, you must use the internal format yourself. String templates have an `ALPHA` option for that:

```abap
DATA lv_kunnr TYPE kunnr VALUE '4711'.

lv_kunnr = |{ lv_kunnr ALPHA = IN }|.     " internal format: 0000004711
WRITE / lv_kunnr.                         " WRITE uses the output routine: 4711

DATA(lv_display) = |{ lv_kunnr ALPHA = OUT }|.  " 4711 as text
```

You can also call the function module directly (function modules are explained in [function modules](./0070-function-modules.en.md)):

```abap
CALL FUNCTION 'CONVERSION_EXIT_ALPHA_INPUT'
  EXPORTING
    input  = lv_kunnr
  IMPORTING
    output = lv_kunnr.
```

> [!TIP]
> A conversion routine is like a phone number. You dial `555 1234`, but the phone company stores it as `+1 212 555 1234`. The person and the system see two forms of the same number.

> [!CAUTION]
> Changing the type or length of a domain that's already used changes every table field built on it. For tables that contain data, the database table must be converted, which can take long and, with a shorter length, cut values. Check the where-used list first, and plan such changes with care.

## Exercise

> [!IMPORTANT]
>
> 1. Create the domain `ZD_FLIGHT_STATUS` (`CHAR 1`) with the fixed values `S` Scheduled, `D` Delayed, and `C` Cancelled, and activate it.
> 2. Open the domain of the field `SPFLI-CARRID` and find its value table.
> 3. Write a few lines of ABAP that convert the customer number `123` to its internal format with `ALPHA = IN` and print it.

### Solution

1. In `SE11` choose **Domain**, enter `ZD_FLIGHT_STATUS`, set data type `CHAR` and length 1, enter the three fixed values in the **Value Range** tab, save in your package, and activate.
2. `SPFLI-CARRID` uses the domain `S_CARR_ID`, whose value table is `SCARR`.
3. Code:

```abap
DATA lv_kunnr TYPE kunnr VALUE '123'.
lv_kunnr = |{ lv_kunnr ALPHA = IN }|.
WRITE / |Internal format: { lv_kunnr ALPHA = RAW }|.   " 0000000123
```

> [!NOTE]
>
> - A domain defines the technical type: Dictionary type, length, decimals, output length, sign, and lowercase.
> - Value ranges can be fixed values, intervals, or a value table; they're checked on screens, not in ABAP code.
> - A conversion routine (`CONVERSION_EXIT_xxxxx_INPUT` / `_OUTPUT`) switches between internal and display format.
> - `ALPHA` adds leading zeros internally; use `ALPHA = IN` in string templates when you fill such fields in code.
> - Changing a domain affects every field that uses it: check the where-used list first.
