---
title: Decisions, loops, and the debugger
description: How a program chooses what to do and how it repeats operations.
---

_Week 1 · Beginner level · 4 hours_

### Today's schedule

| Block  | Content                                                        |
| ------ | -------------------------------------------------------------- |
| Hour 1 | Conditions: IF, ELSEIF, ELSE, comparison and logical operators |
| Hour 2 | CASE, COND and SWITCH, predicates (IS INITIAL, BETWEEN, IN...) |
| Hour 3 | Loops: DO, WHILE, EXIT, CONTINUE, CHECK; processing blocks     |
| Hour 4 | The debugger: breakpoints, step-by-step execution, watchpoints |

## Hour 1 – Making decisions with IF

### The IF structure

```abap
IF condition.
  " statements if the condition is true
ELSEIF other_condition.
  " statements if the second one is true
ELSE.
  " statements if none is true
ENDIF.
```

> [!TIP]
> `IF` works like a traffic officer at a crossroads: they look at the situation (the condition) and send you left or right. **The first true condition** is executed, then the structure ends: the other branches are ignored.

```abap
DATA(lv_grade) = 27.

IF lv_grade >= 30.
  WRITE 'Excellent'.
ELSEIF lv_grade >= 24.
  WRITE 'Good'.           " this one is printed
ELSEIF lv_grade >= 18.
  WRITE 'Sufficient'.
ELSE.
  WRITE 'Insufficient'.
ENDIF.
```

### Comparison operators

| Symbol | Alternative | Meaning                  |
| ------ | ----------- | ------------------------ |
| `=`    | `EQ`        | equal                    |
| `<>`   | `NE`        | not equal                |
| `<`    | `LT`        | less than                |
| `>`    | `GT`        | greater than             |
| `<=`   | `LE`        | less than or equal to    |
| `>=`   | `GE`        | greater than or equal to |

The letter forms (`EQ`, `NE`...) are old but still valid; prefer the symbols.

### Logical operators: AND, OR, NOT

```abap
IF lv_age >= 18 AND lv_license = abap_true.
  WRITE 'Can drive'.
ENDIF.

IF lv_day = 'SAT' OR lv_day = 'SUN'.
  WRITE 'Weekend'.
ENDIF.

IF NOT lv_name IS INITIAL.      " better: IF lv_name IS NOT INITIAL.
  WRITE lv_name.
ENDIF.
```

Precedence: first `NOT`, then `AND`, then `OR`. Use parentheses (with spaces!) to be clear:

```abap
IF ( lv_a = 1 OR lv_b = 2 ) AND lv_c = 3.
```

### True and false in ABAP

ABAP has no real Boolean type. By convention, a single character is used:

- `abap_true` = `'X'`
- `abap_false` = `' '` (space)
- the type to use is `abap_bool`.

```abap
DATA lv_found TYPE abap_bool VALUE abap_false.

lv_found = abap_true.
IF lv_found = abap_true.
  WRITE 'Found!'.
ENDIF.

* xsdbool( ) turns a condition into abap_true/abap_false
DATA(lv_adult) = xsdbool( lv_age >= 18 ).
```

> [!WARNING]
> Never write `IF lv_found.` on its own: it is not valid ABAP. You must always compare: `IF lv_found = abap_true.`

## Hour 2 – CASE, COND, SWITCH, and predicates

### CASE

When you compare the same variable with many values, `CASE` is more readable than many `ELSEIF`s.

```abap
CASE lv_country.
  WHEN 'IT'.
    WRITE 'Italy'.
  WHEN 'DE' OR 'AT'.
    WRITE 'German-speaking country'.
  WHEN 'FR'.
    WRITE 'France'.
  WHEN OTHERS.
    WRITE 'Unknown country'.
ENDCASE.
```

> [!TIP]
> `CASE` is like a phone menu: "press 1 for support, 2 for sales, any other key for an operator" (`WHEN OTHERS`).

There is also `CASE TYPE OF` for objects (day 11).

### COND and SWITCH: decisions that return a value

They are **expressions**: instead of running statements, they produce a value to assign.

```abap
* COND: like IF, but returns a value
DATA(lv_rating) = COND string(
  WHEN lv_grade >= 30 THEN `Excellent`
  WHEN lv_grade >= 24 THEN `Good`
  WHEN lv_grade >= 18 THEN `Sufficient`
  ELSE `Insufficient` ).

* SWITCH: like CASE, but returns a value
DATA(lv_country_name) = SWITCH string( lv_country
  WHEN 'IT' THEN `Italy`
  WHEN 'FR' THEN `France`
  ELSE `Other` ).
```

`COND string(...)` means "the result is of type string". With `#`, the type is inferred from the target variable: `lv_x = COND #( ... ).`

### Predicates (special conditions)

| Predicate                    | Meaning                                  |
| ---------------------------- | ---------------------------------------- |
| `x IS INITIAL`               | `x` has its initial value (0, empty...)  |
| `x IS NOT INITIAL`           | `x` has a value                          |
| `x BETWEEN a AND b`          | `a <= x <= b`                            |
| `x IN range`                 | `x` is in a range/select-option (day 8)  |
| `ref IS BOUND`               | a reference points to something (day 10) |
| `<fs> IS ASSIGNED`           | a field symbol is assigned (day 5)       |
| `obj IS INSTANCE OF cl`      | an object belongs to a given class       |
| `param IS SUPPLIED`          | an optional parameter was passed         |
| `line_exists( itab[ ... ] )` | a row exists in an internal table        |

```abap
IF lv_amount BETWEEN 100 AND 500.
  WRITE 'Medium amount'.
ENDIF.

IF lv_customer IS INITIAL.
  WRITE 'Customer is required!'.
  RETURN.                       " leaves the current block
ENDIF.
```

## Hour 3 – Repeating: loops

### DO: repeat a number of times

```abap
DO 5 TIMES.
  WRITE / |Pass number { sy-index }|.
ENDDO.
```

`sy-index` holds the number of the current pass (1, 2, 3...).

Without `TIMES`, `DO` repeats forever until you leave with `EXIT`:

```abap
DATA(lv_n) = 1.
DO.
  lv_n = lv_n * 2.
  IF lv_n > 1000.
    EXIT.              " leaves the loop
  ENDIF.
ENDDO.
WRITE lv_n.            " 1024
```

> [!WARNING]
> A `DO` without `TIMES` and without `EXIT` is an **infinite loop**: the program hangs until the maximum time runs out (usually 10 minutes in dialog, then a `TIME_OUT` dump). You can stop it from SM50 or from the SAP GUI menu.

### WHILE: repeat as long as the condition is true

```abap
DATA(lv_balance) = 1000.
DATA(lv_years)   = 0.

WHILE lv_balance < 2000.
  lv_balance = lv_balance * '1.05'.   " 5% interest per year
  lv_years += 1.
ENDWHILE.

WRITE |Doubled in { lv_years } years|.
```

> [!TIP]
> `DO 5 TIMES` is like "swim 5 lengths of the pool". `WHILE` is like "swim until you're tired": you don't know in advance how many lengths you'll swim.

### Controlling the loop: EXIT, CONTINUE, CHECK

| Statement    | Effect inside a loop                                                       |
| ------------ | -------------------------------------------------------------------------- |
| `EXIT`       | leaves the loop completely                                                 |
| `CONTINUE`   | jumps to the next pass                                                     |
| `CHECK cond` | if `cond` is false, jumps to the next pass (like `IF NOT cond. CONTINUE.`) |

```abap
DO 10 TIMES.
  IF sy-index MOD 2 = 0.   " skip the even numbers
    CONTINUE.
  ENDIF.
  WRITE / sy-index.        " prints 1 3 5 7 9
ENDDO.

DO 10 TIMES.
  CHECK sy-index > 7.
  WRITE / sy-index.        " only 8, 9, 10
ENDDO.
```

> [!WARNING]
> Outside a loop, `EXIT` and `CHECK` leave the whole processing block (method, event...). In modern code, use `RETURN` to leave a method: it's clearer.

### Nested loops

```abap
DO 3 TIMES.                       " multiplication table
  DATA(lv_row) = sy-index.
  NEW-LINE.
  DO 3 TIMES.
    WRITE |{ lv_row * sy-index WIDTH = 4 }|.
  ENDDO.
ENDDO.
```

Careful: inside the inner loop, `sy-index` refers to the inner loop. That's why we save the outer value in `lv_row`.

Tables have a dedicated loop, `LOOP AT`, which we see on day 5.

### The processing blocks of a report

An ABAP report doesn't run "top to bottom" like any other text: it is split into **blocks** that SAP calls in a certain order (events). The most important one is `START-OF-SELECTION`: if you don't write it, all the "loose" code implicitly ends up inside it.

```abap
REPORT zexample_events.

DATA gv_counter TYPE i.          " global declarations

INITIALIZATION.                  " before the screen opens
  gv_counter = 0.

START-OF-SELECTION.              " the main body
  gv_counter += 1.
  WRITE gv_counter.
```

We'll see all the events on day 8. From today on, always write `START-OF-SELECTION.` in your reports: it's a good habit.

## Hour 4 – The debugger

The **debugger** lets you stop the program at a point, run it one line at a time, and look at the contents of the variables. It's the tool you'll use most in your career.

> [!TIP]
> The debugger is like the slow-motion replay of a match: you can freeze the action, look at the position of every player (variable), and understand exactly where the mistake started.

### How to start it

| Method                      | How                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Session breakpoint          | in the editor, click the left margin of the line (or Ctrl+Shift+F12). Valid while you're logged on |
| External (user) breakpoint  | for programs called from outside (for example Fiori, RFC). In ADT it's the default type            |
| `/h` in the command field   | turns on debugging: the next action on the screen starts in the debugger                           |
| `BREAK-POINT.` statement    | always stops, for everyone. Never leave it in the code!                                            |
| `BREAK username.` statement | stops only for that user. Still, remove it before the transport                                    |

### The main commands

| Key (SAP GUI) | Key (ADT) | Action                                               |
| ------------- | --------- | ---------------------------------------------------- |
| F5            | F5        | _Single step_: runs the line and steps into calls    |
| F6            | F6        | _Execute_: runs the line without stepping into calls |
| F7            | F7        | _Return_: leaves the current routine                 |
| F8            | F8        | Continue to the next breakpoint                      |
| Shift+F12     | Ctrl+R    | Go to line (jump directly)                           |

### What you can do

- **Look at variables**: double-click the name (SAP GUI) or hover over it (ADT).
- **Change the value** of a variable on the fly (pencil icon), to try other scenarios.
- **Look at internal tables** row by row.
- **Watchpoint**: stops the program when a variable changes or takes a certain value. Very useful when you don't know where a variable is changed.
- **Breakpoint on a statement**: stops at every `SELECT`, every `MESSAGE`, every `CALL FUNCTION`... Very useful to understand standard programs.
- **Call stack**: shows the path that led to the current point.

### An example to debug

```abap
REPORT zdebug_test.

START-OF-SELECTION.
  DATA(lv_sum) = 0.
  DO 10 TIMES.
    lv_sum = lv_sum + sy-index * 2.
  ENDDO.
  " I expect 110: is it true? Set a breakpoint above and check
  WRITE lv_sum.
```

Set a breakpoint on the `DO` line, run with F8, and press F5 several times while watching `lv_sum` and `sy-index`. Then set a watchpoint on `lv_sum` with the condition `lv_sum > 50`.

> [!WARNING]
> In production you usually can't change variables in the debugger (and you shouldn't: you'd alter real data). Every change made in the debugger is recorded in the system log.

## Exercises

> [!IMPORTANT]
>
> 1. Write a program that, given a number, says whether it's even or odd (use `MOD`).
> 2. Given an age, print "Child" (0-12), "Teenager" (13-17), "Adult" (18-64), "Senior" (65+), first with `IF`/`ELSEIF`, then with `COND`.
> 3. Given a day code from 1 to 7, print the name of the day with `CASE` and then with `SWITCH`.
> 4. Print the 7 times table with `DO`. Then print only the multiples of 3 between 1 and 50 using `CONTINUE`.
> 5. FizzBuzz: for the numbers from 1 to 30, print "Fizz" if divisible by 3, "Buzz" if divisible by 5, "FizzBuzz" if divisible by both, otherwise the number.
> 6. With `WHILE`, calculate the factorial of 10. Then debug the program with a watchpoint that stops when the result exceeds 100000.

## Quiz

1. What does an `IF` print when several `ELSEIF`s are true at the same time?
2. How do you represent "true" in ABAP?
3. What is the difference between `DO` and `WHILE`?
4. What is the difference between `EXIT` and `CONTINUE` in a loop?
5. What does `sy-index` contain?
6. Which debugger key runs a line without stepping into subroutines?
7. Why must you not leave `BREAK-POINT` statements in the code?

## Solutions

```abap
REPORT zes03_solutions.

PARAMETERS p_num TYPE i DEFAULT 17.   " input field (day 8)

START-OF-SELECTION.
* Ex. 1
  WRITE / COND string( WHEN p_num MOD 2 = 0 THEN `Even` ELSE `Odd` ).

* Ex. 2
  DATA(lv_age) = 40.
  WRITE / COND string( WHEN lv_age <= 12 THEN `Child`
                       WHEN lv_age <= 17 THEN `Teenager`
                       WHEN lv_age <= 64 THEN `Adult`
                       ELSE `Senior` ).

* Ex. 3
  DATA(lv_d) = 3.
  WRITE / SWITCH string( lv_d WHEN 1 THEN `Monday`    WHEN 2 THEN `Tuesday`
                              WHEN 3 THEN `Wednesday` WHEN 4 THEN `Thursday`
                              WHEN 5 THEN `Friday`    WHEN 6 THEN `Saturday`
                              WHEN 7 THEN `Sunday`    ELSE `Error` ).

* Ex. 4
  DO 10 TIMES.
    WRITE / |7 x { sy-index } = { 7 * sy-index }|.
  ENDDO.
  DO 50 TIMES.
    IF sy-index MOD 3 <> 0.
      CONTINUE.
    ENDIF.
    WRITE sy-index.
  ENDDO.

* Ex. 5
  DO 30 TIMES.
    DATA(lv_out) = COND string(
      WHEN sy-index MOD 15 = 0 THEN `FizzBuzz`
      WHEN sy-index MOD 3 = 0  THEN `Fizz`
      WHEN sy-index MOD 5 = 0  THEN `Buzz`
      ELSE |{ sy-index }| ).
    WRITE / lv_out.
  ENDDO.

* Ex. 6
  DATA lv_fact TYPE int8 VALUE 1.
  DATA lv_i    TYPE i VALUE 1.
  WHILE lv_i <= 10.
    lv_fact = lv_fact * lv_i.
    lv_i += 1.
  ENDWHILE.
  WRITE / |10! = { lv_fact }|.   " 3628800
```

Quiz:

1. Only the branch of the **first** true condition.
2. With `abap_true` (`'X'`), type `abap_bool`.
3. `DO` repeats a fixed number of times (or forever until `EXIT`); `WHILE` repeats as long as a condition is true, checked at the start of every pass.
4. `EXIT` leaves the loop; `CONTINUE` jumps to the next pass.
5. The number of the current pass of `DO`/`WHILE`.
6. F6.
7. They would stop the program for every user, even in production (and background jobs would fail).

> [!NOTE]
> Today you learned: `IF`, `CASE`, `COND`, `SWITCH`, logical operators and predicates, the `DO` and `WHILE` loops with `EXIT`/`CONTINUE`/`CHECK`, the blocks of a report, and how to use the debugger. Tomorrow: the ABAP Dictionary, the heart of SAP data.
