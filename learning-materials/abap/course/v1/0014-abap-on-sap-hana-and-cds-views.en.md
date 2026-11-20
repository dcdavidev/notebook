---
title: ABAP on SAP HANA and CDS views
description: Code pushdown, Core Data Services, access control, AMDP, and performance analysis.
---

_Week 3 · Advanced level · 4 hours_

### Today's schedule

| Block  | Content                                                                                       |
| ------ | --------------------------------------------------------------------------------------------- |
| Hour 1 | SAP HANA and code pushdown; your first CDS view entity                                        |
| Hour 2 | Advanced CDS: joins, associations, expressions, parameters, annotations, view hierarchy (VDM) |
| Hour 3 | Access control (DCL), table functions and AMDP, analytical views (overview)                   |
| Hour 4 | Performance tools: ST05, SAT, SQLM, SWLT, ATC for HANA; golden rules                          |

## Hour 1 – SAP HANA and code pushdown

### What changes with HANA

**SAP HANA** is SAP's database, and S/4HANA must run on it. Its characteristics:

- **In-memory**: data lives in RAM, not only on disk: very fast reads.
- **Columnar**: data is stored by column, not by row. Summing a column over millions of rows is very fast, and the data compresses very well.
- **Parallel computing**: it uses all processors at the same time.

> [!TIP]
> Traditional database: a library whose books are on shelves in the basement; to compute a statistic, the librarian (the ABAP server) has every book brought up to the office and counts them one by one. HANA: the library itself has a hundred very fast assistants who count right there among the shelves and send you only the result.

### The "code pushdown" paradigm

Before: **"data to code"** – bring the data to the application server and process it in ABAP (loops, sums, filters). With HANA: **"code to data"** – push the calculation into the database and get only the result back.

| Pushdown level | Tool                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| Basic          | modern ABAP SQL: expressions, aggregations, `JOIN`s, CTEs (day 6)       |
| Medium         | CDS views: reusable data models defined in ABAP but run in the database |
| Advanced       | AMDP: procedures written in SQLScript (HANA's language) managed by ABAP |

Rule: use the simplest level that solves the problem. CDS is the standard choice.

### Core Data Services (CDS)

**CDS** is a language for defining "smart" data models: views that, besides fields, contain relationships, calculations, texts, access rules, and metadata for user interfaces. They're the foundation of all of S/4HANA: Fiori apps, analytics, RAP, APIs.

> [!TIP]
> A table is a raw ingredient. A CDS view is a ready-made dish: chosen ingredients, combined, seasoned with calculations, and with a label saying what it's for and who may eat it. Anyone (ABAP, Fiori, analytics) can serve it without cooking it again.

There are two generations:

| Type                                   | Syntax                                                                         | Status                            |
| -------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------- |
| DDIC-based CDS view (`define view`)    | also generates an SQL view in the DDIC (annotation `@AbapCatalog.sqlViewName`) | obsolete since 7.56               |
| CDS view entity (`define view entity`) | no extra SQL view, faster activation, stricter checks                          | always use it for new development |

You can create CDS objects only in Eclipse **ADT** (New → Other ABAP Repository Object → Core Data Services → Data Definition).

### Your first view entity

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flights - basic view'
define view entity ZI_Flight
  as select from sflight
{
  key carrid   as AirlineId,
  key connid   as ConnectionId,
  key fldate   as FlightDate,
      @Semantics.amount.currencyCode: 'Currency'
      price    as Price,
      currency as Currency,
      seatsmax as TotalSeats,
      seatsocc as OccupiedSeats
}
```

- The name follows the **VDM** (_Virtual Data Model_) conventions: `I_` (interface, reusable basic view), `C_` (consumption, for a specific app), `R_` (restricted, RAP), `P_` (private). Yours will have a Z prefix: `ZI_`, `ZC_`, `ZR_`.
- `key` marks the key fields of the view.
- `as` assigns readable aliases (CamelCase).
- Lines starting with `@` are **annotations**: metadata for the compiler, for Fiori, for analytics.

Using it from ABAP is like reading a table:

```abap
SELECT AirlineId, ConnectionId, FlightDate, Price, Currency
  FROM zi_flight
  WHERE AirlineId = 'LH'
  INTO TABLE @DATA(lt_flights).
```

In ADT you can see the data with **F8** (Data Preview) directly on the CDS view.

## Hour 2 – Advanced CDS

### Expressions and functions

```sql
define view entity ZI_FlightCalculated
  as select from sflight
{
  key carrid,
  key connid,
  key fldate,
      seatsmax - seatsocc                                   as FreeSeats,
      cast( seatsocc as abap.dec(15,2) ) * 100
        / cast( seatsmax as abap.dec(15,2) )                as OccupancyPercent,
      case
        when seatsocc >= seatsmax then 'FULL'
        when seatsocc = 0         then 'EMPTY'
        else 'AVAILABLE'
      end                                                   as Status,
      concat_with_space( carrid, connid, 1 )                as FlightCode,
      dats_days_between( $session.system_date, fldate )     as DaysToDeparture,
      @Semantics.amount.currencyCode: 'currency'
      price,
      currency
}
where fldate >= $session.system_date
```

Session variables: `$session.user`, `$session.client`, `$session.system_date`, `$session.system_language`, `$session.user_timezone`.

### JOINs and associations

CDS supports classic `JOIN`s, but the typical tool is the **association**: a declared relationship that the database runs only when needed ("lazy" joins).

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Flight connections'
define view entity ZI_Connection
  as select from spfli
  association [1..1] to ZI_Airline as _Airline on $projection.AirlineId = _Airline.AirlineId
  association [0..*] to ZI_Flight  as _Flights on  $projection.AirlineId    = _Flights.AirlineId
                                               and $projection.ConnectionId = _Flights.ConnectionId
{
  key carrid   as AirlineId,
  key connid   as ConnectionId,
      cityfrom as DepartureCity,
      cityto   as ArrivalCity,
      _Airline.AirlineName,   // field taken by navigating the association (becomes a join)
      _Airline,               // "exposed" association: whoever uses the view can navigate it
      _Flights
}
```

- The **cardinality** `[1..1]`, `[0..1]`, `[0..*]`, `[1..*]` describes how many rows match.
- By convention, association names start with an underscore `_`.
- `$projection` refers to the fields (with aliases) of the view itself.
- An exposed association can be navigated by other CDS views or from ABAP SQL with **path expressions**:

```abap
SELECT FROM zi_connection
  FIELDS AirlineId, ConnectionId, \_Airline-AirlineName AS Name
  INTO TABLE @DATA(lt_res).
```

> [!TIP]
> A `JOIN` is like booking a taxi in advance for every trip you might make during the day. An association is like having the taxi app: you call one only when you actually need to go somewhere.

There are also **compositions** (`composition of` / `association to parent`) that describe parent-child relationships (header-items): they're the foundation of RAP (day 15).

### Aggregations

```sql
define view entity ZI_AirlineStats
  as select from sflight
{
  key carrid                         as AirlineId,
      count( * )                     as NumberOfFlights,
      sum( seatsocc )                as SeatsSold,
      avg( price as abap.dec(15,2) ) as AveragePrice,
      max( fldate )                  as LastFlight
}
group by carrid
having count( * ) > 0
```

### Parameters

```sql
define view entity ZI_FlightsInPeriod
  with parameters
    p_from : abap.dats,
    p_to   : abap.dats
  as select from sflight
{
  key carrid,
  key connid,
  key fldate,
      price,
      currency
}
where fldate between $parameters.p_from and $parameters.p_to
```

```abap
SELECT * FROM zi_flightsinperiod( p_from = @lv_from, p_to = @lv_to ) INTO TABLE @DATA(lt_res).
```

### Important annotations

| Annotation                                                                 | What it is for                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `@AccessControl.authorizationCheck`                                        | `#CHECK`, `#NOT_REQUIRED`, `#MANDATORY`: access control with DCL       |
| `@EndUserText.label`                                                       | readable description                                                   |
| `@Semantics.amount.currencyCode` / `@Semantics.quantity.unitOfMeasure`     | links amounts to currencies and quantities to units                    |
| `@ObjectModel.text.element`                                                | which field holds the descriptive text of a code                       |
| `@ObjectModel.representativeKey`                                           | representative key                                                     |
| `@Consumption.valueHelpDefinition`                                         | value help for Fiori                                                   |
| `@UI.lineItem` / `@UI.selectionField` / `@UI.identification` / `@UI.facet` | how to show fields in Fiori Elements apps (day 15)                     |
| `@Analytics.dataCategory`                                                  | `#DIMENSION`, `#FACT`, `#CUBE` for analytics                           |
| `@Search.searchable` / `@Search.defaultSearchElement`                      | free-text search                                                       |
| `@VDM.viewType`                                                            | `#BASIC`, `#COMPOSITE`, `#CONSUMPTION`                                 |
| `@Metadata.allowExtensions`                                                | lets you move UI annotations into a separate file (Metadata Extension) |

### Other CDS artifacts

| Artifact                                                    | Use                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| Projection view (`define view entity ... as projection on`) | consumption layer for RAP                            |
| Abstract entity                                             | structure for RAP action parameters                  |
| Custom entity                                               | data provided by an ABAP class (not by the database) |
| Table function                                              | data calculated by an AMDP                           |
| Metadata extension (DDLX)                                   | UI annotations kept apart from the view              |
| Access control (DCL)                                        | authorization rules                                  |
| Extend view                                                 | add fields to standard CDS views                     |
| Hierarchy                                                   | parent-child hierarchies                             |
| CDS tables (`define table entity`)                          | in recent releases: tables defined in CDS            |

### The Virtual Data Model (VDM)

Views are organized in layers:

1. **Basic** (`I_`): one per table, readable names, associations.
2. **Composite** (`I_`): combine basic views.
3. **Consumption** (`C_`): for a specific app or report, with UI annotations.

SAP delivers thousands of released standard views (for example `I_Customer`, `I_Product`, `I_SalesOrder`, `I_JournalEntryItem`): in S/4HANA you read these instead of the tables, especially in ABAP Cloud, where standard tables aren't directly accessible.

## Hour 3 – Access control, table functions, AMDP

### CDS access control (DCL)

With `@AccessControl.authorizationCheck: #CHECK`, on every `SELECT` on the view SAP automatically applies the rules defined in an **Access Control** (DCL):

```sql
@EndUserText.label: 'Flight access by airline'
@MappingRole: true
define role ZI_Flight_Role {
  grant select on ZI_Flight
    where ( AirlineId ) = aspect pfcg_auth( S_CARRID, CARRID, ACTVT = '03' );
}
```

Users see only the rows of airlines for which they have the `S_CARRID` authorization. You no longer need to write `AUTHORITY-CHECK` in the code: the filter is added to the query automatically.

> [!TIP]
> A DCL is like a filter on each user's glasses: two people look at the same view, but each one sees only the rows they're authorized to see.

From ABAP SQL you can bypass it with `WITH PRIVILEGED ACCESS` (only when justified).

### AMDP: ABAP Managed Database Procedures

When the logic is too complex for CDS and ABAP SQL (iterative calculations, HANA-specific functions, predictive algorithms), you write a method in **SQLScript** that runs in the database but is managed (transported, versioned) like ABAP code.

```abap
CLASS zcl_amdp_flights DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_amdp_marker_hdb.        " mandatory marker
    TYPES: BEGIN OF ty_res,
             carrid  TYPE s_carr_id,
             revenue TYPE s_price,
           END OF ty_res,
           tt_res TYPE STANDARD TABLE OF ty_res WITH EMPTY KEY.
    METHODS get_revenue
      IMPORTING VALUE(iv_mandt) TYPE mandt
      EXPORTING VALUE(et_res)   TYPE tt_res.
ENDCLASS.

CLASS zcl_amdp_flights IMPLEMENTATION.
  METHOD get_revenue BY DATABASE PROCEDURE FOR HDB
                     LANGUAGE SQLSCRIPT
                     OPTIONS READ-ONLY
                     USING sflight.
    et_res = SELECT carrid, SUM( price * seatsocc ) AS revenue
               FROM sflight
               WHERE mandt = :iv_mandt
               GROUP BY carrid;
  ENDMETHOD.
ENDCLASS.
```

Differences to remember:

- The code inside the method is **SQLScript, not ABAP**: a semicolon at the end, and variables prefixed with `:` when read.
- The **client isn't handled automatically**: you have to filter it yourself (or use `USING` with client-dependent CDS views and the `CDS SESSION CLIENT` option).
- Every table/view used must be listed in `USING`.
- Parameters by value only, elementary types or tables.
- You can debug it with the AMDP debugger in ADT.

### Table functions

A **CDS table function** exposes the result of an AMDP as if it were a view, usable in `SELECT`s and in other CDS views:

```sql
@EndUserText.label: 'Revenue by airline'
@ClientHandling.type: #CLIENT_DEPENDENT
define table function ZTF_Revenue
  with parameters @Environment.systemField: #CLIENT p_mandt : abap.clnt
  returns {
    mandt   : abap.clnt;
    carrid  : s_carr_id;
    revenue : s_price;
  }
  implemented by method zcl_tf_revenue=>get_data;
```

The class implements the `get_data` method with `BY DATABASE FUNCTION FOR HDB LANGUAGE SQLSCRIPT` and returns with `RETURN SELECT ...;`.

### Analytics (overview)

With the annotation `@Analytics.dataCategory: #CUBE` (facts + dimensions) and a query view (`@Analytics.query: true` or the new `define transient view entity ... provider contract analytical_query`), CDS views become sources for multidimensional analytical reports (the Fiori app "Query Browser", SAP Analytics Cloud, Excel with Analysis). Dimensions (`#DIMENSION`) describe master data, facts (`#FACT`) the measures.

## Hour 4 – Performance analysis

### The tools

| Transaction                                                             | What it does                                                                                             | When to use it                                        |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| ST05                                                                    | SQL trace (and buffer, RFC, HTTP, locks): shows every statement sent to the database, its time, its rows | understand which queries are slow or repeated         |
| SAT                                                                     | Runtime Analysis: where the program spends its time (ABAP vs database), calls, hierarchy                 | find the bottlenecks                                  |
| ST12                                                                    | combines SAT and ST05 (if installed)                                                                     | complete analysis                                     |
| SQLM                                                                    | SQL Monitor: collects statistics on all queries in production over days                                  | find the real critical points                         |
| SWLT                                                                    | SQL Performance Tuning Worklist: crosses SQLM with Code Inspector results                                | prioritize the work                                   |
| SRTCM                                                                   | Runtime Check Monitor: runtime checks for the migration to HANA                                          | prepare the migration                                 |
| ATC with a HANA variant (for example `FUNCTIONAL_DB`, `PERFORMANCE_DB`) | static checks for HANA: implicit sorting, `SELECT`s in loops, use of pool/cluster tables                 | before migrating to S/4HANA and for every development |
| ST04 / DBACOCKPIT                                                       | database statistics                                                                                      | with the Basis team                                   |

### How to read an ST05 trace

1. ST05 → Activate trace (for your user).
2. Run the program in another session.
3. Deactivate the trace and display it.
4. Look for: identical statements repeated (`SELECT` in a loop!), statements with many rows or a high time, accesses without an index (execution plan: "Explain").
5. Use "Structure-identical statements" to see how many times a query ran with different values.

> [!TIP]
> ST05 is like the camera at a highway toll booth: it records every car (query) that passes, how long it takes, and what it carries. If you see the same car pass a thousand times, you've found the problem.

### The golden rules for HANA

1. **Reduce data transfer**: only the columns and rows you need.
2. **Reduce the number of accesses**: no `SELECT`s in loops; use `JOIN`s/CDS/`FOR ALL ENTRIES`.
3. **Let the database calculate**: aggregations and calculations in SQL/CDS.
4. **Don't trust implicit sorting**: on HANA, results without `ORDER BY` can arrive in any order; if you then use `BINARY SEARCH` or `AT NEW` on that data, add `ORDER BY` or `SORT`.
5. **Reading all columns costs more on HANA** than on a row database (every column has to be reassembled): list only the fields you need.
6. **Use released standard CDS views** instead of rebuilding complex joins.
7. **Always measure before and after** (SAT, ST05): don't optimize "by feel".

### Migrating to S/4HANA: what to check in custom code

- Tables removed or replaced (for example FI/CO and MM-IM aggregate tables: replaced by `ACDOCA`, `MATDOC`; customers/vendors → Business Partner).
- Longer fields (for example the material number at 40 characters).
- Implicit sorting no longer guaranteed.
- Pool/cluster tables converted to transparent ones.
- Simplification Items and Custom Code Migration (Fiori app / ATC with the `S4HANA_READINESS` variant).

## Exercises

> [!IMPORTANT]
>
> 1. In ADT, create the view entity `ZI_Airline` on `SCARR` (AirlineId, AirlineName, Currency, Url) and `ZI_Flight` on `SFLIGHT`. Display the data with F8.
> 2. Create `ZI_Connection` on `SPFLI` with associations to `ZI_Airline` and `ZI_Flight`. Read it from ABAP with a path expression.
> 3. Create `ZI_AirlineStats` with the number of flights, seats sold, total revenue (price × occupied seats), and average price per airline. Show it in an ALV from a report.
> 4. Add a "year" parameter to a view and filter the flights of that year.
> 5. Create a DCL for `ZI_Flight` based on `S_CARRID` and check its effect (with a test user or with SU53).
> 6. Write an AMDP that finds, for every airline, the flight with the highest revenue, and expose it through a table function.
> 7. Take the report from day 6 or 8 that has a `SELECT` in a loop, measure it with ST05 and SAT, rewrite it with a `JOIN` or CDS, and measure again.

## Quiz

1. What does "code pushdown" mean?
2. What is the difference between a DDIC-based CDS view and a view entity?
3. What advantage does an association have over a `JOIN`?
4. What is a DCL for?
5. Why must you filter the client in an AMDP?
6. What does ST05 show? And SAT?
7. Why is it dangerous on HANA to rely on the order of results without `ORDER BY`?

## Solutions

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Airlines'
define view entity ZI_Airline
  as select from scarr
{
  key carrid   as AirlineId,
      carrname as AirlineName,
      currcode as Currency,
      url      as Url
}
```

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Statistics by airline'
define view entity ZI_AirlineStats
  as select from sflight
  association [1..1] to ZI_Airline as _Airline on $projection.AirlineId = _Airline.AirlineId
{
  key carrid                                            as AirlineId,
      _Airline.AirlineName                              as AirlineName,
      count( * )                                        as NumberOfFlights,
      sum( seatsocc )                                   as SeatsSold,
      sum( cast( price as abap.dec(15,2) ) * seatsocc ) as Revenue,
      avg( price as abap.dec(15,2) )                    as AveragePrice,
      _Airline
}
group by carrid, _Airline.AirlineName
```

Note: the revenue adds up prices in different currencies if an airline's flights use different currencies; in a real case, also group by currency or convert with `currency_conversion( )`.

Quiz:

1. Moving calculations from the application server to the database, which returns only the result.
2. The DDIC-based view also generates an SQL view in the dictionary and is obsolete; the view entity doesn't, it's faster and stricter, and it's the standard.
3. It runs only if a field of the association is actually requested (lazy), and it can be exposed and navigated by other views.
4. To define access rules applied automatically to every `SELECT` on the view.
5. Because SQLScript doesn't add the client filter automatically the way ABAP SQL does.
6. ST05 shows the statements sent to the database with times and rows; SAT shows where the program spends its time (ABAP, database, calls).
7. Because HANA processes in parallel and the order isn't guaranteed: `BINARY SEARCH`, `AT NEW`, and `DELETE ADJACENT DUPLICATES` would give wrong results.

> [!NOTE]
> Today you learned: HANA and code pushdown; CDS view entities with expressions, associations, aggregations, parameters, and annotations; the VDM; DCL; AMDP and table functions; analytics; performance tools; and the checks for migrating to S/4HANA. Tomorrow, the last day: RAP, ABAP Cloud, and your future path.
