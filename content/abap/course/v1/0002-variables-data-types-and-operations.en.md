---
title: Variables, data types, and operations
description: How ABAP stores numbers, texts, and dates, and how it transforms them.
---

_Week 1 · Beginner level · 4 hours_

### Today's schedule

| Block  | Content                                                                 |
| ------ | ----------------------------------------------------------------------- |
| Hour 1 | Variables, constants, built-in types (C, N, I, P, D, T, STRING...)      |
| Hour 2 | TYPES, inline declarations, initial values, conversions, CONV           |
| Hour 3 | Arithmetic operations and numeric functions, dates and times            |
| Hour 4 | Working with texts: concatenate, split, find, replace, string templates |

## Hour 1 – Variables and data types

### What a variable is

A **variable** is a named container where the program keeps a value that can change. Every variable has a **type**, which says what it can hold (numbers, text, dates...) and how much space it takes.

> [!TIP]
> A variable is like a labeled jar in the kitchen. The label is the name (`lv_sugar`), the shape of the jar is the type (a jar for liquids is no good for spaghetti), and the content is the value. You can empty it and refill it as often as you like.

You declare it with `DATA`:

```abap
DATA lv_age    TYPE i.                      " integer
DATA lv_name   TYPE string.                 " text of any length
DATA lv_amount TYPE p LENGTH 10 DECIMALS 2 VALUE '125.50'.

lv_age  = 35.
lv_name = `Giulia`.
WRITE: / lv_name, lv_age, lv_amount.
```

- `TYPE` sets the type.
- `VALUE` sets an initial value.
- `=` assigns a value (the value on the right goes into the variable on the left).

### Naming conventions

They aren't mandatory, but almost every company uses them. The prefix tells you "what kind" of object it is:

| Prefix                        | Meaning                                                 | Example             |
| ----------------------------- | ------------------------------------------------------- | ------------------- |
| `lv_`                         | local variable                                          | `lv_total`          |
| `gv_`                         | global variable                                         | `gv_counter`        |
| `ls_` / `gs_`                 | structure (one row)                                     | `ls_customer`       |
| `lt_` / `gt_`                 | internal table                                          | `lt_orders`         |
| `lc_` / `gc_`                 | constant                                                | `lc_vat`            |
| `lr_` / `lo_`                 | reference / object                                      | `lo_alv`            |
| `iv_` / `ev_` / `cv_` / `rv_` | importing / exporting / changing / returning parameters | `iv_matnr`          |
| `ty_`                         | type                                                    | `ty_row`            |
| `p_` / `s_`                   | parameter / select-option on the screen                 | `p_date`, `s_kunnr` |

> [!WARNING]
> Modern guidelines (Clean ABAP) suggest using fewer prefixes and more descriptive names. Many companies still use prefixes, though: learn them, you'll read them everywhere. Names can be at most 30 characters long and can contain letters, digits, and underscores.

### The built-in types

| Type                        | What it holds               | Length                        | Initial value | Example                         |
| --------------------------- | --------------------------- | ----------------------------- | ------------- | ------------------------------- |
| `c`                         | Fixed-length text           | 1–262143 characters           | spaces        | `'ROME'`                        |
| `n`                         | Numeric text (digits only)  | fixed                         | `'000...'`    | `'00012'` (postal codes, codes) |
| `string`                    | Variable-length text        | any                           | empty         | `` `Hello everyone` ``          |
| `i`                         | Integer                     | 4 bytes (±2.1 billion)        | 0             | `42`                            |
| `int8`                      | Big integer                 | 8 bytes                       | 0             | `9000000000`                    |
| `p`                         | Packed decimal number       | 1–16 bytes, up to 14 decimals | 0             | `1234.56`                       |
| `decfloat16` / `decfloat34` | Decimal floating point      | 8 / 16 bytes                  | 0             | precise scientific calculations |
| `f`                         | Binary floating point       | 8 bytes                       | 0             | avoid it for amounts            |
| `d`                         | Date YYYYMMDD               | 8 characters                  | `'00000000'`  | `'20261113'`                    |
| `t`                         | Time HHMMSS                 | 6 characters                  | `'000000'`    | `'153000'`                      |
| `x`                         | Hexadecimal bytes, fixed    | fixed                         | `X'00'`       | binary data                     |
| `xstring`                   | Hexadecimal bytes, variable | any                           | empty         | files, images                   |
| `utclong`                   | UTC timestamp               | 8 bytes                       | empty         | precise date and time           |

Important details:

- `c` has a **fixed length**: if you declare `TYPE c LENGTH 10` and write `'ROME'`, the rest is filled with spaces. If the text is longer, it is **truncated** without any error.
- `n` is for "numbers you don't add up": postal codes, document numbers, codes. The digits are right-aligned with leading zeros.
- `p` is the right type for **money and quantities**: it calculates in exact decimals, without the rounding errors of `f`.
- `d` and `t` are really texts of 8 and 6 characters, but ABAP can calculate with them (days and seconds).
- `string` and `xstring` grow and shrink by themselves.

> [!TIP]
> Type `c` is like a paper form with 10 boxes: if you write a short name, some boxes stay empty; if it's too long, the last letters don't fit. Type `string` is like a blank sheet: you write as much as you want.

```abap
DATA lv_city  TYPE c LENGTH 5.
DATA lv_zip   TYPE n LENGTH 5.
DATA lv_today TYPE d.
DATA lv_time  TYPE t.

lv_city  = 'FLORENCE'.  " becomes 'FLORE' (truncated!)
lv_zip   = 123.         " becomes '00123'
lv_today = sy-datum.    " system date
lv_time  = sy-uzeit.    " system time

WRITE: / lv_city, / lv_zip, / lv_today, / lv_time.
```

### Constants

A **constant** is a value that cannot change. You declare it with `CONSTANTS`, and `VALUE` is mandatory.

```abap
CONSTANTS lc_vat_rate TYPE p LENGTH 3 DECIMALS 2 VALUE '22.00'.
CONSTANTS lc_country  TYPE c LENGTH 2 VALUE 'IT'.

* lc_country = 'DE'.  " SYNTAX ERROR: a constant cannot be changed
```

Use constants instead of "magic numbers" scattered through the code: if the rate changes, you change it in one place only.

### Structures (a first look)

A **structure** groups several fields into a single variable, like a row in an Excel sheet.

```abap
DATA: BEGIN OF ls_person,
        first_name TYPE string,
        last_name  TYPE string,
        age        TYPE i,
      END OF ls_person.

ls_person-first_name = `Luca`.
ls_person-last_name  = `Bianchi`.
ls_person-age        = 40.
WRITE: / ls_person-first_name, ls_person-last_name, ls_person-age.
```

The hyphen `-` separates the structure from the field: `ls_person-first_name` reads as "the first_name field of the ls_person structure". Structures are everywhere in ABAP: we come back to them on days 4 and 5.

## Hour 2 – TYPES, inline declarations, conversions

### Define your own types with TYPES

`TYPES` creates a **type** (a mold), not a variable. Then you use the mold to create as many variables as you want.

> [!TIP]
> `TYPES` is the cookie cutter, `DATA` is the cookie. With one cutter you make many identical cookies.

```abap
TYPES ty_amount TYPE p LENGTH 13 DECIMALS 2.

TYPES: BEGIN OF ty_item,
         code        TYPE c LENGTH 10,
         description TYPE string,
         price       TYPE ty_amount,
       END OF ty_item.

DATA ls_item1 TYPE ty_item.
DATA ls_item2 TYPE ty_item.
DATA lv_total TYPE ty_amount.
```

### TYPE and LIKE

- `TYPE` refers to a type: `DATA a TYPE i.`
- `LIKE` refers to another variable: `DATA b LIKE a.` (`b` gets the same type as `a`).

You can also type a variable by referring to the **ABAP Dictionary** (day 4): `DATA lv_customer TYPE kunnr.`, or to a table field: `DATA lv_name TYPE kna1-name1.` This is the most common way in real programs, because the field already has the right length, descriptions, and search helps.

### Inline declarations (ABAP 7.40 and later)

Instead of declaring everything at the top, you can declare a variable **where you use it** with `DATA(...)`. The type is inferred from the value on the right.

```abap
DATA(lv_number) = 10.        " type i
DATA(lv_text)   = `Hello`.   " type string (backticks)
DATA(lv_c)      = 'Hello'.   " type c LENGTH 5 (single quotes)
DATA(lv_today)  = sy-datum.  " type d
```

There is also `FINAL(...)` (since release 7.57): like an inline `DATA`, but the value can no longer change.

> [!WARNING]
> Single quotes `'...'` create a text of type `c` (trailing spaces are ignored). Backticks `` `...` `` create a `string` (trailing spaces count). With inline declarations, the difference becomes important.

### Initial value, CLEAR, and IS INITIAL

Every type has an **initial value** (0 for numbers, spaces for `c`, empty for `string`, `'00000000'` for `d`).

- `CLEAR lv_x.` resets the variable to its initial value.
- `IF lv_x IS INITIAL.` checks whether the variable has its initial value.
- `FREE lv_x.` works like `CLEAR` but also frees the memory (useful for large tables).

### Automatic conversions

If you assign a value of one type to a variable of another type, ABAP **converts it automatically** following some rules:

```abap
DATA lv_i TYPE i.
DATA lv_c TYPE c LENGTH 10.
DATA lv_p TYPE p LENGTH 8 DECIMALS 2.

lv_c = '123'.
lv_i = lv_c.    " 123: text converted to a number
lv_p = '7.55'.
lv_i = lv_p.    " 8: rounded (commercially)
lv_c = 'ABC'.
* lv_i = lv_c.  " DUMP CX_SY_CONVERSION_NO_NUMBER: 'ABC' is not a number
```

> [!TIP]
> Automatic conversion is like a simultaneous interpreter: it almost always understands, but if you give it a meaningless sentence ("ABC" as a number) it gets stuck.

### The CONV operator

`CONV` explicitly converts a value to a type, inside an expression:

```abap
DATA(lv_text)    = CONV string( 42 ).
DATA(lv_decimal) = CONV decfloat34( 10 / 3 ).
```

### Leading zeros: ALPHA

In SAP many codes (customer, material) are stored with leading zeros: customer "4711" is `0000004711` in the database. To convert:

```abap
DATA lv_kunnr TYPE kunnr VALUE '4711'.

lv_kunnr = |{ lv_kunnr ALPHA = IN }|.            " '0000004711'
DATA(lv_display) = |{ lv_kunnr ALPHA = OUT }|.   " '4711'
```

Alternatively there are the function modules `CONVERSION_EXIT_ALPHA_INPUT` and `CONVERSION_EXIT_ALPHA_OUTPUT`, which you will often see in older code.

> [!WARNING]
> Forgetting the leading zeros is one of the most common mistakes: a `SELECT` with `'4711'` finds nothing, because the database contains `'0000004711'`.

## Hour 3 – Calculations, dates, and times

### Arithmetic operators

| Operator | Meaning          | Example   | Result                                          |
| -------- | ---------------- | --------- | ----------------------------------------------- |
| `+`      | addition         | `7 + 2`   | 9                                               |
| `-`      | subtraction      | `7 - 2`   | 5                                               |
| `*`      | multiplication   | `7 * 2`   | 14                                              |
| `/`      | division         | `7 / 2`   | 3.5 (with `p`) or 4 (in an integer: it rounds!) |
| `DIV`    | integer division | `7 DIV 2` | 3                                               |
| `MOD`    | remainder        | `7 MOD 2` | 1                                               |
| `**`     | power            | `2 ** 3`  | 8                                               |

```abap
DATA lv_a TYPE i VALUE 7.
DATA lv_b TYPE i VALUE 2.
DATA lv_r TYPE p LENGTH 8 DECIMALS 2.

lv_r = lv_a / lv_b.             " 3.50
DATA(lv_int) = lv_a DIV lv_b.   " 3
DATA(lv_mod) = lv_a MOD lv_b.   " 1

* shorthand assignment operators
lv_a += 1.   " lv_a = lv_a + 1
lv_a -= 2.
lv_a *= 3.
lv_a /= 2.
```

> [!WARNING]
> Remember the spaces: `lv_a = lv_b + 1.` is correct; `lv_a=lv_b+1.` is a syntax error. Parentheses need a space inside: `( a + b ) * c`.

### Numeric functions

| Function              | What it does      | Example                                 |
| --------------------- | ----------------- | --------------------------------------- |
| `abs( )`              | absolute value    | `abs( -5 )` = 5                         |
| `sign( )`             | sign (-1, 0, 1)   | `sign( -5 )` = -1                       |
| `ceil( )`             | rounds up         | `ceil( '2.1' )` = 3                     |
| `floor( )`            | rounds down       | `floor( '2.9' )` = 2                    |
| `trunc( )`            | integer part      | `trunc( '2.9' )` = 2                    |
| `frac( )`             | decimal part      | `frac( '2.9' )` = 0.9                   |
| `round( )`            | rounds            | `round( val = '2.456' dec = 2 )` = 2.46 |
| `sqrt( )`             | square root       | `sqrt( 16 )` = 4                        |
| `ipow( )`             | integer power     | `ipow( base = 2 exp = 10 )` = 1024      |
| `nmax( )` / `nmin( )` | maximum / minimum | `nmax( val1 = 3 val2 = 8 )` = 8         |

### Fixed point arithmetic

In the attributes of every program there is the **"Fixed point arithmetic"** checkbox. It must **always be on**: without it, numbers of type `p` ignore the decimal point in calculations and you get results that are wrong by factors of 100 or 1000.

### Working with dates

A date (type `d`) can be added to and subtracted from integers: the unit is the **day**.

```abap
DATA lv_today   TYPE d.
DATA lv_due     TYPE d.
DATA lv_days    TYPE i.

lv_today = sy-datum.
lv_due   = lv_today + 30.          " in 30 days
lv_days  = lv_due - lv_today.      " 30

* Access parts of the date with offset and length
DATA(lv_year)  = lv_today(4).      " first 4 characters: YYYY
DATA(lv_month) = lv_today+4(2).    " from position 4, 2 characters: MM
DATA(lv_day)   = lv_today+6(2).    " DD

* First day of the current month
DATA(lv_first) = lv_today.
lv_first+6(2) = '01'.

* Last day of the previous month
DATA(lv_last_prev) = lv_first - 1.
```

> [!TIP]
> Offsets work like seats in a theater: `+4(2)` means "skip the first 4 seats and take the next 2". Positions start at 0.

The **display format** (13.11.2026 or 11/13/2026) depends on the user's settings (transaction SU3). In the database, the date is always YYYYMMDD.

```abap
WRITE / lv_today.                          " formatted for the user
DATA(lv_txt) = |{ lv_today DATE = USER }|. " the same, in a text
DATA(lv_iso) = |{ lv_today DATE = ISO }|.  " 2026-11-13
```

### Times and timestamps

```abap
DATA lv_time TYPE t VALUE '083000'.
lv_time = lv_time + 3600.            " one hour later: 093000 (unit = seconds)

* Timestamp: date + time in a single value (UTC)
GET TIME STAMP FIELD DATA(lv_ts).    " type timestamp, format YYYYMMDDhhmmss
CONVERT TIME STAMP lv_ts TIME ZONE 'CET'
        INTO DATE DATA(lv_d) TIME DATA(lv_t).

* Modern: utclong
DATA(lv_utc) = utclong_current( ).
```

Useful function modules for dates (you'll recognize them in real code): `RP_CALC_DATE_IN_INTERVAL` (add months/years), `DATE_GET_WEEK` (week), `HR_JP_MONTH_BEGIN_END_DATE` (start/end of month), `DAY_ATTRIBUTES_GET` (day of the week and holidays). Modern systems also have the `cl_abap_datfm` class and the date functions of CDS.

### System fields (SY)

The `sy` (or `syst`) structure holds information about the system and is always available:

| Field                   | Content                                           |
| ----------------------- | ------------------------------------------------- |
| `sy-datum`              | today's date (on the server)                      |
| `sy-uzeit`              | current time (on the server)                      |
| `sy-datlo` / `sy-timlo` | date and time in the user's time zone             |
| `sy-uname`              | logged-on user                                    |
| `sy-mandt`              | client                                            |
| `sy-sysid`              | system name (for example DEV)                     |
| `sy-langu`              | logon language                                    |
| `sy-subrc`              | return code of the last statement (0 = all good)  |
| `sy-tabix`              | index of the current row in an internal table     |
| `sy-index`              | number of the current loop pass in `DO` / `WHILE` |
| `sy-dbcnt`              | number of rows read/changed in the database       |
| `sy-repid`              | name of the current program                       |
| `sy-tcode`              | current transaction                               |

`sy-subrc` is the most important one: almost every statement sets it. **0 means success**; any other value means something didn't work (for example, row not found). You will learn to always check it.

> [!WARNING]
> Never assign values to system fields: by convention they are read-only, and changing them causes unpredictable behavior.

## Hour 4 – Working with texts

### Concatenate

```abap
DATA(lv_first) = `Anna`.
DATA(lv_last)  = `Verdi`.

* Classic way
DATA lv_full TYPE string.
CONCATENATE lv_first lv_last INTO lv_full SEPARATED BY space.

* The && operator
lv_full = lv_first && ` ` && lv_last.

* String template (the modern, more convenient way)
lv_full = |{ lv_first } { lv_last }|.
```

### String templates in detail

The text goes between vertical bars `| ... |`. The parts between braces `{ ... }` are expressions that are evaluated and inserted.

```abap
DATA(lv_qty)   = 3.
DATA(lv_price) = CONV decfloat34( '19.90' ).
DATA(lv_msg)   = |You bought { lv_qty } items for { lv_qty * lv_price } euros.|.

* Formatting options
DATA(a) = |{ lv_price DECIMALS = 1 }|.                  " 19.9
DATA(b) = |{ 42 WIDTH = 8 ALIGN = RIGHT PAD = '0' }|.   " 00000042
DATA(c) = |{ `hello` CASE = UPPER }|.                   " HELLO
DATA(d) = |{ 1234567 NUMBER = USER }|.                  " 1,234,567 (user format)
DATA(e) = |Line 1\nLine 2\twith a tab|.                 " \n new line, \t tab
```

> [!TIP]
> A string template is like a preprinted form, "Dear {name}, your order no. {number} is ready": you write the form once and ABAP fills in the blanks between the braces.

### Text functions

| Function                           | What it does                             | Example                                                   | Result     |
| ---------------------------------- | ---------------------------------------- | --------------------------------------------------------- | ---------- |
| `strlen( )`                        | length (without trailing spaces for `c`) | ``strlen( `Rome` )``                                      | 4          |
| `to_upper( )` / `to_lower( )`      | uppercase / lowercase                    | ``to_upper( `hello` )``                                   | HELLO      |
| `condense( )`                      | removes double and surrounding spaces    | ``condense( ` a  b ` )``                                  | `a b`      |
| `substring( )`                     | extracts a part                          | ``substring( val = `ABCDEF` off = 2 len = 3 )``           | CDE        |
| `substring_after( )`               | part after a text                        | ``substring_after( val = `a=b` sub = `=` )``              | b          |
| `substring_before( )`              | part before a text                       | ``substring_before( val = `a=b` sub = `=` )``             | a          |
| `find( )`                          | position of a text (-1 if missing)       | ``find( val = `Rome` sub = `m` )``                        | 2          |
| `replace( )`                       | replaces                                 | ``replace( val = `a-b-c` sub = `-` with = `/` occ = 0 )`` | a/b/c      |
| `shift_left( )` / `shift_right( )` | shifts / removes characters              | ``shift_left( val = `0012` sub = `0` )``                  | 12         |
| `reverse( )`                       | reverses                                 | ``reverse( `abc` )``                                      | cba        |
| `repeat( )`                        | repeats                                  | ``repeat( val = `-` occ = 5 )``                           | -----      |
| `segment( )`                       | n-th piece separated by a character      | ``segment( val = `a;b;c` index = 2 sep = `;` )``          | b          |
| `contains( )`                      | contains? (true/false)                   | ``contains( val = `Rome` sub = `om` )``                   | true       |
| `matches( )`                       | matches a regex pattern?                 | ``matches( val = lv_zip pcre = `\d{5}` )``                | true/false |

`occ = 0` means "all occurrences".

### Classic text statements

In existing code you will often find these forms:

```abap
DATA lv_line TYPE string VALUE `Rossi;Mario;Rome`.
DATA: lv_last TYPE string, lv_first TYPE string, lv_city TYPE string.

SPLIT lv_line AT ';' INTO lv_last lv_first lv_city.

DATA lt_parts TYPE TABLE OF string.          " table of texts (day 5)
SPLIT lv_line AT ';' INTO TABLE lt_parts.

FIND 'Mario' IN lv_line.                     " sy-subrc = 0 if found
FIND ALL OCCURRENCES OF ';' IN lv_line MATCH COUNT DATA(lv_count).
REPLACE ALL OCCURRENCES OF ';' IN lv_line WITH ','.
TRANSLATE lv_line TO UPPER CASE.
CONDENSE lv_line NO-GAPS.                    " removes ALL spaces
SHIFT lv_line LEFT DELETING LEADING '0'.
```

### Comparison operators for texts

| Operator | Meaning                                                      |
| -------- | ------------------------------------------------------------ |
| `CO`     | _Contains Only_: contains only the given characters          |
| `CN`     | _Contains Not only_: the opposite of `CO`                    |
| `CA`     | _Contains Any_: contains at least one of the characters      |
| `NA`     | _contains Not Any_                                           |
| `CS`     | _Contains String_: contains the substring (case-insensitive) |
| `NS`     | _contains No String_                                         |
| `CP`     | _Covers Pattern_: matches the pattern with `*` and `+`       |
| `NP`     | _No Pattern_                                                 |

```abap
IF lv_zip CO '0123456789'.
  WRITE 'Valid postal code (digits only)'.
ENDIF.

IF lv_mail CP '*@*.*'.
  WRITE 'Looks like an email address'.
ENDIF.
```

### Regular expressions (a quick look)

ABAP supports PCRE regular expressions (`pcre =`), useful to validate complex formats:

```abap
DATA(lv_mail) = `mario.rossi@example.com`.
IF matches( val = lv_mail pcre = `^[\w.+-]+@[\w-]+\.[\w.]+$` ).
  WRITE 'Valid email address'.
ENDIF.
```

## Exercises

> [!IMPORTANT]
>
> 1. Declare two integers and calculate their sum, difference, product, division (in a type `p` with 2 decimals), integer division, and remainder. Print each result with a description using string templates.
> 2. Calculate how many days are left until December 31 of the current year (build the date with an offset: year of `sy-datum` + `'1231'`).
> 3. Given the string `` ` sap  abap   course ` ``, produce `SAP ABAP COURSE` (remove double spaces, uppercase).
> 4. Given `'Rossi;Mario;Rome;00184'`, extract the four values with `SPLIT` and then with `segment( )`. Check with `CO` that the postal code contains only digits.
> 5. Convert the customer number `'123'` to the internal format with `ALPHA = IN` and print it, then convert it back.
> 6. Calculate the price including VAT (22%) of an item costing €49.90, using a constant for the rate, and round it to 2 decimals.

## Quiz

1. Which type would you use for an amount in euros? And for a postal code?
2. What is the difference between `'text'` and `` `text` ``?
3. What does a freshly declared variable of type `i` contain?
4. What is the difference between `TYPES` and `DATA`?
5. What happens if you assign `'MILANO'` to a variable `TYPE c LENGTH 3`?
6. What value does `sy-subrc` have when a statement succeeds?
7. What does `lv_date+4(2)` extract from a date?
8. Why must the "fixed point arithmetic" checkbox always be on?

## Solutions

```abap
REPORT zes02_solutions.

CONSTANTS lc_vat TYPE p LENGTH 3 DECIMALS 2 VALUE '0.22'.

START-OF-SELECTION.
* Ex. 1
  DATA(lv_a) = 17.
  DATA(lv_b) = 5.
  DATA lv_div TYPE p LENGTH 8 DECIMALS 2.
  lv_div = lv_a / lv_b.
  WRITE: / |Sum: { lv_a + lv_b }|,
         / |Difference: { lv_a - lv_b }|,
         / |Product: { lv_a * lv_b }|,
         / |Division: { lv_div }|,
         / |Integer division: { lv_a DIV lv_b }|,
         / |Remainder: { lv_a MOD lv_b }|.

* Ex. 2
  DATA lv_end TYPE d.
  lv_end = sy-datum(4) && '1231'.
  WRITE / |Days to the end of the year: { lv_end - sy-datum }|.

* Ex. 3
  DATA(lv_s) = ` sap  abap   course `.
  WRITE / to_upper( condense( lv_s ) ).

* Ex. 4
  DATA(lv_line) = `Rossi;Mario;Rome;00184`.
  SPLIT lv_line AT ';' INTO DATA(lv_last) DATA(lv_first) DATA(lv_city) DATA(lv_zip).
  DATA(lv_zip2) = segment( val = lv_line index = 4 sep = `;` ).
  IF lv_zip CO '0123456789'.
    WRITE / |Postal code { lv_zip } is valid|.
  ENDIF.

* Ex. 5
  DATA lv_kunnr TYPE c LENGTH 10 VALUE '123'.
  lv_kunnr = |{ lv_kunnr ALPHA = IN }|.
  WRITE / lv_kunnr.                     " 0000000123
  WRITE / |{ lv_kunnr ALPHA = OUT }|.   " 123

* Ex. 6
  DATA lv_net   TYPE p LENGTH 8 DECIMALS 2 VALUE '49.90'.
  DATA lv_gross TYPE p LENGTH 8 DECIMALS 2.
  lv_gross = round( val = lv_net * ( 1 + lc_vat ) dec = 2 ).
  WRITE / |Price including VAT: { lv_gross }|.   " 60.88
```

Quiz:

1. Type `p` (or a dictionary data element such as `wrbtr`); for the postal code, type `n LENGTH 5` or `c`.
2. Single quotes = fixed-length type `c`, trailing spaces ignored; backticks = `string`, spaces count.
3. 0.
4. `TYPES` defines a mold, `DATA` creates a real variable.
5. It is truncated to `'MIL'`.
6. 0.
7. The month.
8. Because without it, calculations with type `p` ignore the decimals and give wrong results.

> [!NOTE]
> Today you learned: variables, constants, built-in types, `TYPES`, inline declarations, conversions, calculations, dates, times, system fields, and text handling. Tomorrow: decisions, loops, and the debugger.
