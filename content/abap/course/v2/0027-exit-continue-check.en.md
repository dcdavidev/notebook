---
title: EXIT, CONTINUE, and CHECK
description: Leave a loop or skip to the next pass.
---

_Beginner level_

Sometimes a loop shouldn't run all its passes: you've found what you were looking for, or the current pass has nothing to do. ABAP has three statements to control a loop from the inside: `EXIT` leaves the loop, `CONTINUE` skips to the next pass, and `CHECK` skips to the next pass when a condition is false.

They work in every loop: `DO`, `WHILE`, and the `LOOP AT` you'll learn in [Looping over internal tables](./0038-looping-internal-tables.en.md).

## EXIT: leave the loop

`EXIT` ends the loop immediately. The program continues with the first statement after `ENDDO`, `ENDWHILE`, or `ENDLOOP`.

```abap
REPORT zexit_demo.

DATA lv_seats_free TYPE i VALUE 0.

DO 10 TIMES.
  lv_seats_free = sy-index * 3.
  IF lv_seats_free > 10.
    WRITE: / 'Enough seats found in pass', sy-index.
    EXIT.
  ENDIF.
ENDDO.

WRITE / 'After the loop'.
```

The loop stops in pass 4, when `lv_seats_free` is 12. `EXIT` is also how you end a `DO` without `TIMES`, as you saw in [DO and WHILE loops](./0026-do-and-while-loops.en.md).

In nested loops, `EXIT` leaves only the **innermost** loop; the outer loop goes on with its next pass.

## CONTINUE: skip to the next pass

`CONTINUE` ends the **current pass** and starts the next one. The statements after it in the block are skipped for this pass only.

```abap
DO 10 TIMES.
  IF sy-index MOD 2 = 0.
    CONTINUE.             " skip the even numbers
  ENDIF.
  WRITE / sy-index.       " 1, 3, 5, 7, 9
ENDDO.
```

> [!TIP]
> You're reading a pile of letters. `CONTINUE` is "this one's an ad: throw it away and open the next letter". `EXIT` is "I found the letter I was waiting for: stop opening the rest".

## CHECK: continue only if a condition is true

`CHECK condition.` is a short form: if the condition is **true**, nothing happens; if it's **false**, the pass ends as with `CONTINUE`.

```abap
DO 10 TIMES.
  CHECK sy-index MOD 2 = 1.   " keep only the odd numbers
  WRITE / sy-index.           " 1, 3, 5, 7, 9
ENDDO.
```

The two loops in this lesson do exactly the same thing. Note that the conditions are opposite: with `CONTINUE` you write when to **skip**, with `CHECK` you write when to **keep going**.

| Statement         | Inside a loop                                   |
| ----------------- | ----------------------------------------------- |
| `EXIT`            | ends the whole loop                             |
| `CONTINUE`        | ends the current pass                           |
| `CHECK condition` | ends the current pass if the condition is false |

> [!WARNING]
> Many developers find `CHECK` harder to read, because the condition is reversed. In loops, `IF ... CONTINUE` is usually clearer; style guides such as Clean ABAP recommend it.

## Outside a loop

All three statements also work outside a loop, but then they don't affect a loop: they leave the current **processing block**, for example a method or an event block of a report.

```abap
DATA lv_carrid TYPE s_carr_id.

CHECK lv_carrid IS NOT INITIAL.   " outside a loop: leaves the processing block
WRITE / 'This line runs only with an airline'.
```

> [!CAUTION]
> Outside loops, `EXIT` and `CHECK` behave differently depending on the processing block, and in a report they can end the program before it shows any output. To leave a method, use `RETURN`, which you'll see with [Attributes and methods](./0077-attributes-and-methods.en.md). Keep `EXIT`, `CONTINUE`, and `CHECK` for loops.

## Exercise

> [!IMPORTANT]
>
> With a `DO 20 TIMES` loop:
>
> 1. Skip the multiples of 3 with `CONTINUE`.
> 2. Print the other numbers and add them to a total.
> 3. Leave the loop with `EXIT` as soon as the total is greater than 50. Print the total after the loop.

### Solution

```abap
REPORT zexit_exercise.

DATA lv_total TYPE i.

DO 20 TIMES.
  IF sy-index MOD 3 = 0.
    CONTINUE.
  ENDIF.

  WRITE / sy-index.
  lv_total += sy-index.

  IF lv_total > 50.
    EXIT.
  ENDIF.
ENDDO.

WRITE: / 'Total:', lv_total.      " 1+2+4+5+7+8+10+11+13 = 61
```

> [!NOTE]
>
> - `EXIT` leaves the loop; in nested loops, only the innermost one.
> - `CONTINUE` skips the rest of the current pass and starts the next one.
> - `CHECK condition` ends the current pass when the condition is false.
> - Prefer `IF ... CONTINUE` to `CHECK` in loops: the condition is easier to read.
> - Outside loops these statements leave the processing block; use `RETURN` to leave a method.
