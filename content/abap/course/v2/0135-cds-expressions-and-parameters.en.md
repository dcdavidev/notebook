---
title: CDS expressions, functions, and parameters
description: CASE, casts, built-in functions, aggregates, and input parameters.
---

_Pro level_

A CDS view does more than rename columns. Its elements can be **calculated**: arithmetic, conditions, type conversions, string and date functions, currency conversion, aggregates. All of it runs in the database, so it's real [code pushdown](./0131-code-pushdown.en.md). With **input parameters**, the caller can pass values into the view, like arguments to a method.

The syntax is close to [ABAP SQL expressions](./0097-modern-abap-sql.en.md), with a few CDS-specific details.

## Calculated elements and CASE

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flights with calculated elements'
define view entity ZI_FlightCalc
  as select from sflight
{
  key carrid                                         as CarrierId,
  key connid                                         as ConnectionId,
  key fldate                                         as FlightDate,
      seatsmax - seatsocc                            as FreeSeats,
      division( seatsocc * 100, seatsmax, 2 )        as OccupancyPercent,
      case
        when seatsocc >= seatsmax then 'F'           // full
        when seatsocc = 0         then 'E'           // empty
        else                           'O'           // open
      end                                            as OccupancyStatus,
      case carrid
        when 'LH' then 'X'
        when 'UA' then 'X'
        else           ' '
      end                                            as IsStarAlliance,
      concat_with_space( carrid, connid, 1 )         as FlightCode,
      cast( seatsocc as abap.fltp )                  as SeatsOccupiedFloat,
      dats_days_between( $session.system_date, fldate ) as DaysToDeparture
}
where
  seatsmax > 0                                       // no division by zero
```

- Arithmetic uses `+`, `-`, `*`. For integer division, use `div( a, b )` (integer result) or `division( a, b, decimals )` (rounded decimal result). The `/` operator works only with floating point and decimal types.
- A **searched CASE** (`case when condition then ...`) tests conditions; a **simple CASE** (`case element when value then ...`) compares one element with values.
- `cast( operand as type )` converts to a built-in type (`abap.char( 10 )`, `abap.dec( 15, 2 )`, `abap.fltp`, `abap.int8`) or to a data element.
- **Session variables** give the context of the current request: `$session.system_date`, `$session.user`, `$session.system_language`, `$session.client`.

## Built-in functions

| Group     | Functions                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Numeric   | `abs`, `ceil`, `floor`, `round`, `div`, `mod`, `division`                                                                            |
| String    | `concat`, `concat_with_space`, `substring`, `length`, `left`, `right`, `upper`, `lower`, `replace`, `lpad`, `rpad`, `ltrim`, `rtrim` |
| Date/time | `dats_is_valid`, `dats_days_between`, `dats_add_days`, `dats_add_months`, `tstmp_current_utctimestamp`, `tstmp_to_dats`              |
| Null      | `coalesce( a, b )`: the first value that isn't null                                                                                  |
| Units     | `currency_conversion`, `unit_conversion`                                                                                             |

> [!WARNING]
> A path through an association with `LEFT OUTER JOIN` returns **null** when there's no target row. In ABAP, null becomes the initial value, but inside the view an expression with null is null too: `concat( null, 'X' )` is null, not `'X'`. Wrap such values in `coalesce( value, '' )` when you combine them.

## Aggregates and GROUP BY

Aggregate functions work like in ABAP SQL. Every element that isn't aggregated must be in the `group by` clause:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Occupied seats per airline'
define view entity ZI_CarrierLoad
  as select from sflight
{
  key carrid                              as CarrierId,
      count( * )                          as FlightCount,
      sum( seatsocc )                     as SeatsOccupied,
      max( fldate )                       as LastFlightDate,
      avg( seatsocc as abap.dec( 10, 1 ) ) as AvgSeatsOccupied
}
group by
  carrid
having
  count( * ) > 10
```

`avg` needs a target type with `as`, because the average of integers isn't an integer. `having` filters the groups after the aggregation, like in [aggregates in ABAP SQL](./0056-aggregates-and-group-by.en.md).

## Input parameters

A view with **parameters** gets values from the caller. Here the caller chooses a target currency, and the view converts the prices:

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flight prices in a target currency'
define view entity ZI_FlightPrice
  with parameters
    p_currency : s_currcode,
    @Environment.systemField: #SYSTEM_DATE
    p_date     : abap.dats
  as select from sflight
{
  key carrid                 as CarrierId,
  key connid                 as ConnectionId,
  key fldate                 as FlightDate,
      @Semantics.amount.currencyCode: 'TargetCurrency'
      currency_conversion( amount             => price,
                           source_currency    => currency,
                           target_currency    => $parameters.p_currency,
                           exchange_rate_date => $parameters.p_date,
                           error_handling     => 'SET_TO_NULL' ) as PriceConverted,
      $parameters.p_currency as TargetCurrency
}
where
  fldate >= $parameters.p_date
```

- Parameters are declared with `with parameters`, typed with a built-in type or a data element, and used as `$parameters.name`.
- `@Environment.systemField: #SYSTEM_DATE` fills the parameter with the system date when ABAP SQL doesn't pass it. Other values are `#USER`, `#SYSTEM_LANGUAGE`, and `#CLIENT`.
- `currency_conversion` uses the exchange rates in table `TCURR`. Without `error_handling => 'SET_TO_NULL'`, a missing rate stops the query with an error.

ABAP SQL passes parameters in parentheses after the name, with `=`; another CDS view passes them with `:`.

```abap
SELECT FROM zi_flightprice( p_currency = 'EUR' )   " p_date: the system date
  FIELDS CarrierId, ConnectionId, FlightDate, PriceConverted, TargetCurrency
  INTO TABLE @DATA(lt_prices).
```

```abap
  as select from ZI_FlightPrice( p_currency: 'EUR', p_date: $session.system_date )
```

## Exercise

> [!IMPORTANT]
>
> 1. Create `ZI_FlightCalc` and check `FreeSeats`, `OccupancyStatus`, and `DaysToDeparture` in the data preview.
> 2. Create a view `ZI_ConnectionsFrom` on `SPFLI` with a parameter `p_city` (type `s_from_cit`) that returns the connections from that city and an element `Route` with `CityFrom` and `CityTo` separated by a hyphen.
> 3. Read it from ABAP for `'FRANKFURT'`.

### Solution

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Connections from a city'
define view entity ZI_ConnectionsFrom
  with parameters
    p_city : s_from_cit
  as select from spfli
{
  key carrid                                  as CarrierId,
  key connid                                  as ConnectionId,
      concat( concat( cityfrom, '-' ), cityto ) as Route
}
where
  cityfrom = $parameters.p_city
```

```abap
SELECT FROM zi_connectionsfrom( p_city = 'FRANKFURT' )
  FIELDS *
  INTO TABLE @DATA(lt_routes).
```

`concat` drops trailing blanks of its arguments, so the result is `FRANKFURT-NEW YORK`.

> [!NOTE]
>
> - Elements can be calculated with arithmetic, `CASE`, `cast`, and built-in functions; everything runs in the database.
> - Use `div` or `division` for integers; `/` works only with floating point and decimal types.
> - `$session` variables give the system date, user, language, and client.
> - Aggregates need `group by` for every non-aggregated element; `having` filters the groups.
> - Parameters: `with parameters`, `$parameters.name` inside, `( name = value )` in ABAP SQL and `( name: value )` in CDS.
