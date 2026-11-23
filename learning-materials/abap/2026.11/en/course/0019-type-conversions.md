---
title: Type conversions
description: What happens when you assign a value to a variable of another type.
level: beginner
---

In many languages, assigning a text to a number variable is an error. ABAP is more tolerant: when source and target have different types, it **converts** the value automatically, following a fixed set of **conversion rules**. Most of the time the result is what you expect. Sometimes the value is truncated, rounded, or padded, and sometimes the program stops with a runtime error.

Knowing the most common rules saves you from bugs that are hard to see, because the code looks perfectly fine.

## Compatible and convertible types

- Two types are **compatible** when they're technically identical: same type, same length, same decimals. The value is copied as it is.
- Otherwise, ABAP looks for a conversion rule. If one exists, the types are **convertible** and the value is converted. If none exists (for example from a date to a time), you get a syntax error.

> [!TIP]
> A conversion is like pouring a drink into a different glass. Into an identical glass, nothing changes. Into a smaller glass, it overflows; into a wider one, there's empty space; into a glass of the wrong shape, it might not work at all.

## Text to text: truncation and padding

Between `c` fields, the value is aligned to the left. If the target is shorter, the rest is cut off; if it's longer, it's padded with blanks.

```abap
REPORT zconv_demo.

DATA lv_long  TYPE c LENGTH 10 VALUE 'FRANKFURT'.
DATA lv_short TYPE c LENGTH 5.

lv_short = lv_long.
WRITE: / lv_short.          " FRANK
```

Into an `n` field (numeric text), only the **digits** are taken, aligned to the right and padded with zeros. If there are too many digits, the leftmost ones are lost.

```abap
DATA lv_conn TYPE n LENGTH 4.

lv_conn = '17'.             " 0017
lv_conn = 'LH 400'.         " 0400: letters and blanks are dropped
lv_conn = '123456'.         " 3456: the first digits are lost
```

## Text to number

When you assign a `c` or `string` value to a number (`i`, `p`), ABAP reads the text as a number. The text can contain blanks, a sign, and a period as the decimal separator.

```abap
DATA lv_int   TYPE i.
DATA lv_price TYPE p LENGTH 8 DECIMALS 2.

lv_int   = '  42 '.         " 42
lv_int   = '-7'.            " -7
lv_price = '199.95'.        " 199.95
lv_int   = '2.5'.           " 3: rounded to an integer
```

If the text isn't a valid number, the program stops with the runtime error `CONVT_NO_NUMBER`:

```abap
lv_int = 'ABC'.             " runtime error CONVT_NO_NUMBER
lv_int = '1,000'.           " runtime error too: the comma isn't allowed
```

> [!WARNING]
> Values that come from users, files, or other systems are text. Never assume they contain a valid number: check them first (you'll see how with `CO` in [IF and logical expressions](./0024-if-and-logical-expressions.md)), or catch the error with the techniques in [Class-based exceptions](./0089-class-based-exceptions.md).

## Number to number and number to text

Between numeric types, the value is **rounded** commercially when the target has fewer decimals:

```abap
DATA lv_p3 TYPE p LENGTH 8 DECIMALS 3 VALUE '12.345'.
DATA lv_p2 TYPE p LENGTH 8 DECIMALS 2.

lv_p2  = lv_p3.             " 12.35
lv_int = lv_p3.             " 12
lv_int = '-2.5'.            " -3: halves are rounded away from zero
```

If the value doesn't fit into the target, for example 5 billion into an `i`, you get the runtime error `CONVT_OVERFLOW`.

A number assigned to a `c` field is written **right-aligned**, and the last position is kept for the sign: a minus **after** the digits, or a blank for positive numbers.

```abap
DATA lv_text TYPE c LENGTH 8.

lv_text = 42.               " '     42 '
lv_text = -42.              " '     42-'
```

When the number has more digits than the field, ABAP cuts the leftmost ones and puts an asterisk in the first position. To build readable text from numbers, use [string templates](./0022-string-templates.md) instead: with `lv_int = -42`, the template `|{ lv_int }|` gives `-42`.

## Dates and times

A date (`d`) is stored as the text `YYYYMMDD`. Assigned to a number, it becomes the number of days since 01.01.0001; that's why you can calculate with dates, as you saw in [Date and time types](./0015-date-and-time-types.md).

```abap
DATA lv_date TYPE d.

lv_date = '20261231'.       " a valid date
lv_date = '20261340'.       " accepted without error, but it isn't a real date!
```

> [!CAUTION]
> Assigning text to a date field doesn't check the date. An invalid value such as `20261340` passes silently and causes wrong results later, for example when you save it to the database. Validate dates that come from outside before you use them.

## Exercise

> [!IMPORTANT]
>
> Predict the result of each assignment, then run the program and check:
>
> 1. `'LH0400X'` into an `n` field of length 4.
> 2. `'7.5'` into an `i` field.
> 3. `-3` into a `c` field of length 4.

### Solution

```abap
REPORT zconv_exercise.

DATA lv_n    TYPE n LENGTH 4.
DATA lv_i    TYPE i.
DATA lv_text TYPE c LENGTH 4.

lv_n    = 'LH0400X'.        " 0400: only the digits 0400 are kept
lv_i    = '7.5'.            " 8: rounded commercially
lv_text = -3.               " '  3-': right-aligned, sign at the end

WRITE: / lv_n, / lv_i, / lv_text.
```

> [!NOTE]
>
> - When types differ, ABAP converts the value automatically with fixed rules.
> - `c` to `c`: left-aligned, truncated or padded with blanks. To `n`: only digits, right-aligned, padded with zeros.
> - Text to number: the text must be a valid number, otherwise you get the runtime error `CONVT_NO_NUMBER`.
> - Numbers are rounded commercially when the target has fewer decimals; values that don't fit cause `CONVT_OVERFLOW`.
> - Text assigned to a date isn't validated: check dates yourself.
