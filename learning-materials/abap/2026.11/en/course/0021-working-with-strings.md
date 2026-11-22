---
title: Working with strings
description: Concatenate, split, measure, shift, and convert the case of text.
---

_Beginner level_

Names, cities, codes, messages, file lines: a lot of business data is text. ABAP gives you statements and built-in functions to join pieces of text, cut them apart, measure them, remove blanks, and change their case.

The examples work with both `c` fields and `string` variables, which you met in [Character types](./0013-character-types.md). Remember the main difference: a `c` field has a fixed length and ABAP ignores its **trailing blanks** in most operations; a `string` keeps exactly what you put in it.

## Joining text: && and CONCATENATE

The `&&` operator joins two pieces of text into a string:

```abap
REPORT zstrings_demo.

DATA lv_from TYPE string VALUE `ROME`.
DATA lv_to   TYPE string VALUE `FRANKFURT`.

DATA(lv_route) = lv_from && ` - ` && lv_to.
WRITE / lv_route.                           " ROME - FRANKFURT
```

The statement `CONCATENATE` does the same and can add a separator between the pieces:

```abap
DATA lv_result TYPE string.

CONCATENATE lv_from lv_to INTO lv_result SEPARATED BY ` / `.
WRITE / lv_result.                          " ROME / FRANKFURT
```

> [!WARNING]
> With `c` fields, `&&` and `CONCATENATE` drop the trailing blanks, so `'Hello '` joined with `'world'` gives `Helloworld`. Use string literals with backquotes (`` `Hello ` ``), `SEPARATED BY space`, or the addition `RESPECTING BLANKS` when you need the blanks.

For text with variables inside, [string templates](./0022-string-templates.md) are often more readable than `&&`.

## Splitting text: SPLIT

`SPLIT` cuts a text at every occurrence of a separator and puts the pieces into variables:

```abap
DATA lv_line TYPE string VALUE `LH;0400;FRANKFURT;NEW YORK`.

SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_connid)
                          DATA(lv_cityfrom) DATA(lv_cityto).

WRITE: / lv_carrid, / lv_connid, / lv_cityfrom, / lv_cityto.
```

If there are more pieces than variables, the last variable gets the rest of the text, separators included. `SPLIT ... INTO TABLE` puts the pieces into an [internal table](./0033-internal-tables-intro.md), one per row.

## Measuring and cutting

| Function / syntax                            | Result                                                              |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `strlen( lv_text )`                          | the length, without trailing blanks of `c`                          |
| `substring( val = lv_text off = o len = l )` | `l` characters starting at offset `o`                               |
| `lv_text+o(l)`                               | the same, with **offset and length** syntax                         |
| `condense( lv_text )`                        | removes leading and trailing blanks and reduces inner blanks to one |
| `CONDENSE lv_text NO-GAPS.`                  | removes all blanks (statement form)                                 |

The **offset** counts from 0: the first character has offset 0.

```abap
DATA lv_city TYPE string VALUE `  NEW    YORK `.

DATA(lv_len) = strlen( lv_city ).           " 14: a string keeps its blanks
DATA(lv_clean) = condense( lv_city ).       " `NEW YORK`
lv_len = strlen( lv_clean ).                " 8

DATA(lv_first) = substring( val = lv_clean off = 0 len = 3 ).   " `NEW`
DATA(lv_last)  = lv_clean+4(4).                                 " `YORK`
```

> [!CAUTION]
> An offset or length beyond the end of the text causes a runtime error. Check `strlen( )` before you cut text that comes from outside.

> [!TIP]
> Offset and length work like a ruler on a strip of paper: the offset is the mark where you put the scissors, the length is how far you cut. The ruler starts at 0, not at 1.

## Removing characters: SHIFT

`SHIFT` moves the content of a variable to the left or right. The most useful form removes leading characters, for example the leading zeros of a number:

```abap
DATA lv_conn TYPE c LENGTH 10 VALUE '0000000400'.

SHIFT lv_conn LEFT DELETING LEADING '0'.
WRITE / lv_conn.                            " 400

DATA lv_code TYPE c LENGTH 6 VALUE 'ABCDEF'.
SHIFT lv_code BY 2 PLACES.                  " CDEF: two characters removed on the left
SHIFT lv_code RIGHT DELETING TRAILING ' '.  " right-aligned
```

The functions `shift_left( )` and `shift_right( )` do the same without changing the original variable, for example `shift_left( val = lv_conn sub = '0' )`.

## Upper and lower case

```abap
DATA(lv_name) = `Lufthansa`.

DATA(lv_upper) = to_upper( lv_name ).       " LUFTHANSA
DATA(lv_lower) = to_lower( lv_name ).       " lufthansa

TRANSLATE lv_name TO UPPER CASE.            " the statement form changes lv_name
```

Converting the case is useful before comparing text that users type: `to_upper( lv_input ) = 'LH'` matches `lh`, `Lh`, and `LH`.

## Exercise

> [!IMPORTANT]
>
> You receive the line `` `  az;0555;rome;Frankfurt ` `` from a file.
>
> 1. Remove the blanks at the beginning and end, and convert it to upper case.
> 2. Split it into airline, flight number, departure city, and arrival city.
> 3. Print the route as `ROME -> FRANKFURT (AZ 0555)` and the length of the departure city.

### Solution

```abap
REPORT zstrings_exercise.

DATA(lv_line) = `  az;0555;rome;Frankfurt `.

lv_line = to_upper( condense( lv_line ) ).

SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_connid)
                          DATA(lv_cityfrom) DATA(lv_cityto).

DATA(lv_route) = lv_cityfrom && ` -> ` && lv_cityto &&
                 ` (` && lv_carrid && ` ` && lv_connid && `)`.

DATA(lv_len) = strlen( lv_cityfrom ).      " 4

WRITE: / lv_route, / lv_len.
```

> [!NOTE]
>
> - `&&` and `CONCATENATE` join text; `CONCATENATE ... SEPARATED BY` adds a separator.
> - Trailing blanks of `c` fields are ignored when you join them; strings keep their blanks.
> - `SPLIT ... AT ... INTO` cuts text into pieces.
> - `strlen( )`, `substring( )`, offset and length (`lv_text+o(l)`), and `condense( )` measure and clean text; offsets start at 0.
> - `SHIFT ... DELETING LEADING` removes leading characters; `to_upper( )` and `to_lower( )` change the case.
