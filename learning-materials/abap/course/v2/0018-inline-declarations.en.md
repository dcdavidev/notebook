---
title: Inline declarations
description: 'DATA(...) and FINAL(...): declare a variable where you first fill it.'
---

_Beginner level_

With `DATA` at the top of the program, you declare a variable in one place and fill it somewhere else, often many lines below. An **inline declaration** does both in one step: you declare the variable at the exact point where it gets its first value, and ABAP derives its type from that value.

Inline declarations are everywhere in modern ABAP. They make code shorter, but you need to know which type the variable gets, or you'll be surprised.

## DATA(...) in an assignment

Write `DATA(name)` on the left side of an assignment. The variable is declared with the type of the right side:

```abap
REPORT zinline_demo.

DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '250.00'.
DATA lv_seats TYPE i VALUE 3.

DATA(lv_total) = lv_price * lv_seats.   " type p, like the calculation
DATA(lv_copy)  = lv_price.              " type p LENGTH 8 DECIMALS 2
DATA(lv_today) = sy-datum.              " type d

WRITE: / lv_total, lv_copy, lv_today.
```

The two statements below are equivalent; the second one is the inline form:

```abap
DATA lv_name TYPE string.
lv_name = `Lufthansa`.

DATA(lv_name2) = `Lufthansa`.
```

After the declaration, `lv_total` is an ordinary variable: you can read it and change it like any other.

## Which type does the variable get?

The type comes from the right side, and with **literals** that's where surprises happen:

| Right side       | Type of the new variable       |
| ---------------- | ------------------------------ |
| `'Rome'`         | `c` with length 4              |
| `` `Rome` ``     | `string`                       |
| `42`             | `i`                            |
| `'3.14'`         | `c` with length 4 (it's text!) |
| another variable | the type of that variable      |
| `sy-datum`       | `d`                            |

```abap
DATA(lv_city) = 'Rome'.       " c LENGTH 4
lv_city = 'Frankfurt'.        " truncated: 'Fran'

DATA(lv_city2) = `Rome`.      " string
lv_city2 = `Frankfurt`.       " fine: a string grows as needed
```

> [!WARNING]
> `DATA(lv_x) = 'ABC'.` gives you a `c` field exactly 3 characters long. If you later assign a longer text, it's cut off silently. For text variables, use a string literal with backquotes, or declare the variable with `DATA ... TYPE` first.

When the type matters (amounts, Dictionary types), declare the variable the classic way, or assign a variable that already has the right type.

> [!TIP]
> An inline declaration is like a label maker that prints the label to the size of the first thing you stick it on. Perfect if you know what goes inside; a bad fit if bigger things will arrive later.

## Where you can use inline declarations

`DATA(...)` works in many statements that write into a variable, not only in assignments. You'll meet these in later lessons:

```abap
SPLIT `LH,0400` AT ',' INTO DATA(lv_carrid) DATA(lv_connid).   " both string

SELECT SINGLE carrname FROM scarr
  WHERE carrid = 'LH'
  INTO @DATA(lv_carrname).                                     " type of the column
```

- `SPLIT` and `CONCATENATE` declare `string` variables: see [Working with strings](./0021-working-with-strings.en.md).
- `SELECT ... INTO @DATA(...)` takes the types from the database: see [Reading data with SELECT](./0052-select-basics.en.md).
- `LOOP AT ... INTO DATA(...)` declares a row variable: see [Looping over internal tables](./0038-looping-internal-tables.en.md).

## Where the variable is visible

An inline declaration is visible **from the statement where it appears to the end of the program or method**, not just inside the `IF` or the loop where you wrote it.

```abap
IF lv_seats > 0.
  DATA(lv_message) = `Seats available`.
ENDIF.

WRITE / lv_message.     " valid, but confusing: may be empty
```

You also can't declare the same name twice in the same program or method: the second `DATA(lv_message)` is a syntax error. Declare a variable inline only where its first value really belongs, and don't rely on it outside that block.

## FINAL(...): a variable you can't change

`FINAL(name)` works like `DATA(name)`, but the variable is **immutable**: after the first assignment, any statement that tries to change it is a syntax error.

```abap
FINAL(lv_max_seats) = 220.
FINAL(lv_user)      = sy-uname.

lv_max_seats = 300.     " syntax error: lv_max_seats is final
```

Use `FINAL` for values you calculate once and only read afterwards. It documents your intention and the syntax check protects it.

> [!WARNING]
> `FINAL(...)` exists from ABAP release 7.57 (SAP S/4HANA 2022 and SAP BTP ABAP Environment). On older systems it's a syntax error: use `DATA(...)` there.

## Exercise

> [!IMPORTANT]
>
> 1. Declare inline `lv_seats_max` with the value `220` and `lv_seats_occ` with `185`, then declare inline `lv_free` as their difference. Print it.
> 2. Declare inline `lv_carrier = 'LH'` and then assign `'Lufthansa'` to it. Print it and explain the result.
> 3. If your system supports it, declare `lv_seats_max` with `FINAL` instead and try to change it.

### Solution

```abap
REPORT zinline_exercise.

DATA(lv_seats_max) = 220.             " i
DATA(lv_seats_occ) = 185.             " i
DATA(lv_free) = lv_seats_max - lv_seats_occ.
WRITE: / 'Free seats:', lv_free.      " 35

DATA(lv_carrier) = 'LH'.              " c LENGTH 2
lv_carrier = 'Lufthansa'.
WRITE: / lv_carrier.                  " 'Lu': the field is only 2 characters
```

With `FINAL(lv_seats_max) = 220.`, the line `lv_seats_max = 300.` doesn't pass the syntax check.

> [!NOTE]
>
> - `DATA(name) = value.` declares a variable and fills it in one statement.
> - The type comes from the right side: `'abc'` gives `c` with that length, backquotes give `string`, `42` gives `i`.
> - Inline declarations also work in `SPLIT`, `SELECT ... INTO @DATA(...)`, `LOOP AT ... INTO DATA(...)`, and other statements.
> - The variable is visible from its declaration to the end of the program or method.
> - `FINAL(name)` declares a variable you can't change afterwards (release 7.57 and later).
