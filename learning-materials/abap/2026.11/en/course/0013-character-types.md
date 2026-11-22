---
title: 'Character types: c, n, string'
description: Fixed-length text, numeric text, and strings of any length.
---

_Beginner level_

Most business data is text: names, cities, airline codes, document numbers. ABAP has three types for it, and choosing the right one matters more than in other languages, because the type decides the length, the start value, and how blanks and digits are treated.

| Type     | What it holds  | Length                    | Initial value    |
| -------- | -------------- | ------------------------- | ---------------- |
| `c`      | any characters | fixed, 1 to 262,143       | blanks           |
| `n`      | digits only    | fixed, 1 to 262,143       | zeros (`'0000'`) |
| `string` | any characters | variable, grows as needed | empty (length 0) |

## Type c: fixed-length text

A variable of type `c` (character) always has exactly the length you declare. Shorter values are padded with blanks on the right; longer values are cut on the right:

```abap
REPORT zchar_demo.

DATA lv_city TYPE c LENGTH 10.

lv_city = 'Rome'.             " stored as "Rome      " (4 letters + 6 blanks)
lv_city = 'San Francisco'.    " stored as "San Franci": cut to 10 characters
WRITE / lv_city.
```

**Trailing blanks** in a `c` field are ignored in most operations: comparisons, concatenations, and the length function `strlen( )` all treat `'Rome      '` as `'Rome'`. Leading blanks, on the other hand, count.

Without `LENGTH`, a `c` variable has length 1. You'll often see the old short form with the length in parentheses:

```abap
DATA lv_flag(1) TYPE c.    " old form: same as TYPE c LENGTH 1
DATA lv_code.              " old form: no type at all means TYPE c LENGTH 1
```

Recognize these forms in old code, but write `TYPE c LENGTH n`.

> [!WARNING]
> Cutting is silent. If you assign a 40-character name to a `c` field of length 20, the last 20 characters are lost without any error. Make `c` fields long enough, or take the length from a Dictionary type, as in [Defining types with TYPES and LIKE](./0017-types-and-like.md).

## Type n: numeric text

Type `n` (numeric text) holds **digits only**, with a fixed length. It's text, not a number: you use it for codes made of digits, such as flight numbers, postal codes, or document numbers, which you never add or multiply.

```abap
DATA lv_connid TYPE n LENGTH 4.

lv_connid = '17'.         " stored as "0017": right-aligned, padded with zeros
lv_connid = 'LH 400'.     " stored as "0400": only the digits are kept
lv_connid = 123456.       " stored as "3456": cut on the LEFT
WRITE / lv_connid.
```

Assignments to `n` keep only the digits, right-align them, and fill the rest with leading zeros. If there are too many digits, the leftmost ones are lost. The full rules are in [Type conversions](./0019-type-conversions.md).

The flight number `CONNID` in table `SPFLI` is a good example: in the Dictionary it's `NUMC` of length 4, so flight 17 is stored as `0017`.

> [!TIP]
> A type `n` field is like a mileage counter in an old car: it always shows the same number of digits, fills the unused ones with zeros, and when it overflows the leftmost digits simply disappear.

## Type string: text of any length

A `string` has no fixed length: it grows and shrinks with its content. Its initial value is the empty string, with length 0. Strings are the natural choice for free text, messages, file contents, and anything whose length you don't know in advance.

```abap
DATA lv_text TYPE string.

lv_text = `Flight LH 400 from Frankfurt to New York`.
WRITE / lv_text.        " nothing is cut
```

Unlike `c`, a string keeps its trailing blanks: `` `Rome ` `` has length 5.

> [!WARNING]
> A text field literal (`'...'`) loses its trailing blanks when you assign it to a string. `lv_text = 'Rome '.` stores `Rome`, length 4. If you need the blank, use a string literal with backquotes: ``lv_text = `Rome `.``

```abap
DATA lv_a TYPE string.
DATA lv_b TYPE string.
DATA lv_len TYPE i.

lv_a = 'Rome '.          " text field literal: trailing blank dropped
lv_b = `Rome `.          " string literal: trailing blank kept
lv_len = strlen( lv_a ).
WRITE / lv_len.          " 4
lv_len = strlen( lv_b ).
WRITE / lv_len.          " 5
```

`strlen( )` is a **built-in function**: it returns the length of a text. You'll meet it again, with many other string functions, in [Working with strings](./0021-working-with-strings.md).

## Which one to use

- **`string`** for free text and most new code: no cutting, no wasted space.
- **`c`** for short codes with a fixed length (an airline code, a status flag) and whenever a Dictionary field is `CHAR`.
- **`n`** for digit-only codes that keep their leading zeros, and whenever a Dictionary field is `NUMC`.

In practice you'll rarely write `c` or `n` with a length by hand: you'll type variables like the database fields they hold, for example `TYPE s_carr_id` or `TYPE spfli-connid`.

ABAP also has two byte types, `x` and `xstring`, for binary data such as file contents; they're used in the lessons on files.

## Exercise

> [!IMPORTANT]
>
> 1. Declare a `c` field of length 5, an `n` field of length 5, and a string. Assign `'AZ 12'` to all three and print them. Predict the output first.
> 2. Assign `'Lufthansa'` to the `c` field and print it again.

### Solution

```abap
REPORT zchar_exercise.

DATA: lv_char TYPE c LENGTH 5,
      lv_numc TYPE n LENGTH 5,
      lv_str  TYPE string.

lv_char = 'AZ 12'.
lv_numc = 'AZ 12'.
lv_str  = 'AZ 12'.
WRITE: / lv_char, / lv_numc, / lv_str.   " AZ 12 / 00012 / AZ 12

lv_char = 'Lufthansa'.
WRITE / lv_char.                         " Lufth: cut to 5 characters
```

> [!NOTE]
>
> - `c` has a fixed length, starts blank, pads with blanks, and cuts on the right; trailing blanks are ignored.
> - `n` holds digits only, starts with zeros, is right-aligned, and cuts on the left.
> - `string` has a variable length, starts empty, and keeps trailing blanks.
> - `'...'` is a `c` literal and loses trailing blanks; `` `...` `` is a `string` literal and keeps them.
> - Use `string` for free text, `c` and `n` for fixed codes; prefer Dictionary types for database fields.
