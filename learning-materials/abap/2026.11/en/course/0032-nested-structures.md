---
title: Nested structures and includes
description: Structures inside structures, and INCLUDE TYPE.
level: basic
---

A booking has its own data (airline, flight, date, booking number) and data about the customer (number, name, city). You could put all these fields side by side in one [structure](./0031-structures.md), but the customer data forms a group of its own, and you'll want to reuse it elsewhere.

ABAP gives you two ways to build bigger structures from smaller ones: **nesting**, where a component is itself a structure, and **including**, where the components of one structure are copied into another at the same level.

## Nested structures

A component of a structure can have a structure type. The result is a **nested structure**:

```abap
REPORT znested_demo.

TYPES: BEGIN OF ty_customer,
         id   TYPE scustom-id,
         name TYPE scustom-name,
         city TYPE scustom-city,
       END OF ty_customer.

TYPES: BEGIN OF ty_booking,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         fldate   TYPE s_date,
         bookid   TYPE s_book_id,
         customer TYPE ty_customer,      " a structure inside the structure
       END OF ty_booking.

DATA ls_booking TYPE ty_booking.
```

To reach a component inside the inner structure, chain the selectors:

```abap
ls_booking-carrid        = 'LH'.
ls_booking-connid        = '0400'.
ls_booking-customer-id   = '00000042'.
ls_booking-customer-name = 'Rossi'.
ls_booking-customer-city = 'ROME'.

WRITE: / ls_booking-carrid, ls_booking-connid, ls_booking-customer-name.
```

The inner structure is also a component you can use as a whole, for example to copy it or clear it:

```abap
DATA ls_customer TYPE ty_customer.

ls_customer = ls_booking-customer.      " copy the inner structure
CLEAR ls_booking-customer.              " clear only the customer part
```

With `VALUE`, nest one `VALUE #( )` inside another; the inner one takes its type from the component:

```abap
ls_booking = VALUE #( carrid   = 'AZ'
                      connid   = '0555'
                      customer = VALUE #( id = '00000007' name = 'Bianchi' ) ).
```

You can also define the inner structure directly inside the outer one, with a second `BEGIN OF ... END OF`. A named type like `ty_customer` is better when you need it again.

> [!TIP]
> A nested structure is a folder with a smaller envelope inside. The folder has its own labels (flight, date), and the envelope labeled "customer" holds its own sheets. You can take the envelope out and hand it to someone without opening it.

## Including a structure: INCLUDE TYPE

Sometimes you don't want a group: you want the same fields **at the same level**, for example a flight structure plus a few extra fields. `INCLUDE TYPE` copies the components of a structure type into the one you're defining.

`INCLUDE` is a statement of its own, so it can't be part of a chain with a colon. Write each `TYPES` separately:

```abap
TYPES: BEGIN OF ty_route,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_route.

TYPES BEGIN OF ty_route_ext.
INCLUDE TYPE ty_route.
TYPES fltime TYPE s_fltime.
TYPES note   TYPE string.
TYPES END OF ty_route_ext.

DATA ls_route TYPE ty_route_ext.

ls_route-carrid = 'LH'.         " no extra level: carrid is a direct component
ls_route-fltime = 444.
```

`ty_route_ext` has six components at the same level: the four of `ty_route`, then `fltime` and `note`. If `ty_route` changes, `ty_route_ext` changes with it. For Dictionary structures, old code often uses `INCLUDE STRUCTURE`, which works the same way.

### AS and RENAMING WITH SUFFIX

Two additions make included components easier to handle:

- `AS name` gives the included components a group name, so you can also address them all together, like a nested structure.
- `RENAMING WITH SUFFIX suffix` adds a suffix to every included name. You need it when you include the same type twice, because two components can't have the same name.

```abap
TYPES: BEGIN OF ty_address,
         city    TYPE s_city,
         country TYPE s_country,
       END OF ty_address.

TYPES BEGIN OF ty_trip.
INCLUDE TYPE ty_address AS origin RENAMING WITH SUFFIX _from.
INCLUDE TYPE ty_address AS dest   RENAMING WITH SUFFIX _to.
TYPES END OF ty_trip.

DATA ls_trip TYPE ty_trip.

ls_trip-city_from = 'ROME'.         " the component name with its suffix
ls_trip-dest-city = 'NEW YORK'.     " same as ls_trip-city_to, through the group name
```

## Nesting or including?

| Question                                                  | Choose    |
| --------------------------------------------------------- | --------- |
| Is the group a thing of its own that you pass around?     | nesting   |
| Do you just want the same fields plus a few more, flat?   | `INCLUDE` |
| Must the structure match a flat database table or a file? | `INCLUDE` |

Database tables can't contain nested structures, so the Dictionary uses includes: many standard tables contain `.INCLUDE` lines, and customers add their own fields to standard tables with **append structures**, which work like includes. You'll see them in [Database tables](./0046-database-tables.md) and [Structures and table types in the Dictionary](./0048-ddic-structures-and-table-types.md).

> [!WARNING]
> A structure that contains a `string`, an internal table, or a reference is **deep**; one with only fixed-length fields is **flat**. Deep structures can't be used everywhere flat ones can, for example as a whole in some text operations or in old file interfaces. Keep structures that you write to files or pass to legacy code flat.

## Exercise

> [!IMPORTANT]
>
> 1. Define a type `ty_price` with `price` (`s_price`) and `currency` (`s_currcode`), and a type `ty_flight` with `carrid`, `connid`, `fldate`, and a nested component `fare` of type `ty_price`.
> 2. Fill a structure of type `ty_flight` with `VALUE` for LH 0400 on 15 December 2026, 650.00 EUR, and print the price and the currency.
> 3. Define `ty_flight_flat` with `INCLUDE TYPE ty_price AS fare` plus `carrid` and `connid`, and set the currency in two ways: directly and through the group name.

### Solution

```abap
REPORT znested_exercise.

TYPES: BEGIN OF ty_price,
         price    TYPE s_price,
         currency TYPE s_currcode,
       END OF ty_price.

TYPES: BEGIN OF ty_flight,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
         fldate TYPE s_date,
         fare   TYPE ty_price,
       END OF ty_flight.

TYPES BEGIN OF ty_flight_flat.
TYPES carrid TYPE s_carr_id.
TYPES connid TYPE s_conn_id.
INCLUDE TYPE ty_price AS fare.
TYPES END OF ty_flight_flat.

DATA(ls_flight) = VALUE ty_flight( carrid = 'LH' connid = '0400' fldate = '20261215'
                                   fare   = VALUE #( price = '650.00' currency = 'EUR' ) ).

WRITE: / ls_flight-fare-price, ls_flight-fare-currency.

DATA ls_flat TYPE ty_flight_flat.
ls_flat-currency      = 'EUR'.      " directly
ls_flat-fare-currency = 'USD'.      " through the group name: the same field
```

> [!NOTE]
>
> - A component with a structure type makes a nested structure; reach inner fields with chained selectors like `ls_booking-customer-name`.
> - Nested `VALUE #( )` expressions fill nested structures in one statement.
> - `INCLUDE TYPE` copies the components of a structure into another at the same level; it can't be part of a chained `TYPES`.
> - `AS name` adds a group name; `RENAMING WITH SUFFIX` avoids name clashes when you include a type twice.
> - Database tables use includes and append structures, never nested structures.
