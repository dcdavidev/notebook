---
title: Constructor expressions
description: VALUE, NEW, CONV, CAST, REF, EXACT, and LET.
---

_Intermediate level_

A **constructor expression** creates a value of a given type right where you need it: in an assignment, as a method argument, or inside another expression. It replaces the helper variables and multi-line blocks of older ABAP with a single expression. You've already used two of them, `VALUE` for [filling internal tables](./0036-filling-internal-tables.en.md) and `NEW` for [creating objects](./0076-classes-and-objects.en.md). This lesson covers the whole family of basic constructors.

## The general form

Every constructor expression has the same shape:

```text
OPERATOR type( arguments )
```

| Operator | Creates                                                        |
| -------- | -------------------------------------------------------------- |
| `VALUE`  | a structure or an internal table                               |
| `NEW`    | an object or an anonymous data object, and returns a reference |
| `CONV`   | a value converted to another type                              |
| `EXACT`  | a converted value, but only if nothing is lost                 |
| `CAST`   | a reference with another static type                           |
| `REF`    | a data reference to an existing data object                    |

The type can be a type name, or `#` to let ABAP infer it from the operand position, for example from the target of the assignment or from the method parameter. With an inline declaration `DATA(...)` there's nothing to infer from, so you must name the type.

The other constructor operators have their own lessons: [`COND` and `SWITCH`](./0092-cond-and-switch.en.md), [`FOR` and `REDUCE`](./0093-for-and-reduce.en.md), and [`FILTER` and `CORRESPONDING`](./0094-filter-and-corresponding.en.md).

> [!TIP]
> Constructor expressions are like ordering a ready-made dish instead of cooking it yourself. You say what you want ("a converted value", "a table with these rows"), and it arrives on the plate in one step. You don't have to get out the pan, the knife, and the cutting board as separate statements.

## VALUE

`VALUE` builds structures and tables. For a structure, list the components; for a table, put each row in its own parentheses:

```abap
REPORT zconstructor_expressions.

TYPES tt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.

DATA(ls_carrier) = VALUE scarr( carrid = 'LH' carrname = 'Lufthansa' currcode = 'EUR' ).

DATA(lt_carriers) = VALUE tt_carriers(
  ( carrid = 'AZ' carrname = 'ITA Airways' currcode = 'EUR' )
  ( ls_carrier )
  ( carrid = 'AA' carrname = 'American Airlines' currcode = 'USD' ) ).

lt_carriers = VALUE #( BASE lt_carriers ( carrid = 'UA' ) ).   " keep the old rows
ls_carrier = VALUE #( ).                                       " initial value
```

A value repeated on many rows can go before the rows: `VALUE #( currcode = 'EUR' ( carrid = 'AZ' ) ( carrid = 'LH' ) )` sets the currency on both.

## NEW

`NEW` creates an object and returns a reference to it. With a data type, it creates an **anonymous data object**, which exists only through the reference:

```abap
DATA(lo_ticket) = NEW lcl_ticket( iv_connid = '0400' iv_price = 500 ).

DATA(lr_count)  = NEW i( 42 ).                             " REF TO i
DATA(lr_flight) = NEW sflight( carrid = 'LH' connid = '0400' ).
WRITE: / lr_count->*, lr_flight->carrid.
```

You met data references and the dereference operator `->*` in [data references](./0042-data-references.en.md).

## CONV and EXACT

`CONV` converts a value to a type, following the normal [conversion rules](./0019-type-conversions.en.md). Use it where a method parameter or a function needs a type you don't have, instead of declaring a helper variable:

```abap
DATA lv_text TYPE c LENGTH 10 VALUE '12.5'.

DATA(lv_amount) = CONV decfloat34( lv_text ).              " 12.5
DATA(lv_digits) = strlen( CONV string( lv_text ) ).        " 4: trailing blanks aren't kept
```

`EXACT` converts too, but raises an exception if the conversion would round a number or lose data. Use it when a silent loss would be a bug:

```abap
TRY.
    DATA(lv_seats) = EXACT i( '3.5' ).                     " would round to 4
  CATCH cx_sy_conversion_error INTO DATA(lx_conversion).
    WRITE / lx_conversion->get_text( ).
ENDTRY.
```

The exceptions are subclasses of `CX_SY_CONVERSION_ERROR`, for example `CX_SY_CONVERSION_ROUNDING` and `CX_SY_CONVERSION_DATA_LOSS`.

## CAST and REF

`CAST` is the expression form of the down cast `?=` that you saw in [polymorphism and casting](./0085-polymorphism-and-casting.en.md). It works for object and data references, and it lets you use the result directly:

```abap
DATA(lo_struct) = CAST cl_abap_structdescr(
                    cl_abap_typedescr=>describe_by_name( 'SFLIGHT' ) ).
WRITE / lines( lo_struct->components ).                    " number of fields

DATA lo_any TYPE REF TO lcl_ticket.
lo_any = NEW lcl_business_ticket( ).
WRITE / CAST lcl_business_ticket( lo_any )->get_lounge( ).
```

Like `?=`, a wrong cast raises `CX_SY_MOVE_CAST_ERROR`. The classes in the first example are from [RTTS](./0115-rtts.en.md); `lcl_ticket` and `lcl_business_ticket` are the classes from the polymorphism lesson.

`REF` returns a data reference to an existing data object, like `GET REFERENCE OF`, but as an expression:

```abap
DATA lv_price TYPE s_price VALUE 500.
DATA(lr_price) = REF #( lv_price ).
lr_price->* = 600.                                         " lv_price is now 600
```

## LET

`LET` declares local helper variables inside a constructor expression. They exist only in that expression, and they let you compute a value once and use it several times:

```abap
DATA(ls_summary) = VALUE ty_summary(
  LET lv_free = ls_flight-seatsmax - ls_flight-seatsocc
      lv_rate = ls_flight-price IN
  carrid     = ls_flight-carrid
  free_seats = lv_free
  revenue    = lv_rate * ls_flight-seatsocc
  can_book   = xsdbool( lv_free > 0 ) ).
```

Here `ty_summary` is a structure type with those four fields. `LET` is allowed in every constructor expression, not just `VALUE`.

> [!WARNING]
> Constructor expressions can be nested without limit, and that's the trap. A twenty-line expression with three levels of `VALUE`, `LET`, and `CONV` is harder to read and debug than a few plain statements. In the debugger you can't stop in the middle of an expression. If it doesn't fit on a few lines, split it.

## Exercise

> [!IMPORTANT]
>
> 1. Read one row of `SFLIGHT` into `ls_flight`. With one `VALUE` and a `LET`, build a structure with `carrid`, `connid`, and `occupancy` (type `p LENGTH 5 DECIMALS 1`), the percentage of occupied seats.
> 2. Pass `ls_flight-price` to a method that expects `string`, using `CONV`.
> 3. Try `EXACT i( ls_flight-price )` and catch `cx_sy_conversion_error` when the price has decimals.

### Solution

```abap
TYPES: BEGIN OF ty_load,
         carrid    TYPE s_carr_id,
         connid    TYPE s_conn_id,
         occupancy TYPE p LENGTH 5 DECIMALS 1,
       END OF ty_load.

SELECT SINGLE * FROM sflight INTO @DATA(ls_flight).

DATA(ls_load) = VALUE ty_load(
  LET lv_max = nmax( val1 = ls_flight-seatsmax val2 = 1 ) IN
  carrid    = ls_flight-carrid
  connid    = ls_flight-connid
  occupancy = ls_flight-seatsocc * 100 / lv_max ).

DATA(lv_text) = condense( CONV string( ls_flight-price ) ).

TRY.
    DATA(lv_whole) = EXACT i( ls_flight-price ).
  CATCH cx_sy_conversion_error.
    WRITE / 'Price has decimals'.
ENDTRY.
```

> [!NOTE]
>
> - Constructor expressions have the form `OPERATOR type( ... )`; `#` infers the type from the context.
> - `VALUE` builds structures and tables; `NEW` creates objects and anonymous data objects.
> - `CONV` converts; `EXACT` converts only without loss and raises `CX_SY_CONVERSION_ERROR` subclasses otherwise.
> - `CAST` is the expression form of `?=`; `REF` returns a data reference to an existing variable.
> - `LET` defines local helper variables inside any constructor expression. Keep expressions short enough to read.
