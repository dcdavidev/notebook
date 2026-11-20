---
title: CDS access control
description: Restrict rows with DCL roles and authorization objects.
---

_Pro level_

A classic report checks authorizations with [`AUTHORITY-CHECK`](./0110-authorization-checks.en.md) and then filters the rows itself. A CDS view is read by many consumers, from ABAP SQL to Fiori apps and analytics tools, so the check belongs to the view. **CDS access control** does exactly that: a **CDS role**, written in the Data Control Language (**DCL**), adds a filter to every ABAP SQL read of the view, based on the user's authorizations.

The user simply sees fewer rows. No error, no extra code in the consumer.

> [!TIP]
> Think of a hotel key card. Every guest uses the same elevator and the same corridors, but the card opens only the doors of their own room. The CDS role is the card system: one building, a different set of doors for each guest.

## Switching the check on

The view declares whether it expects access control with `@AccessControl.authorizationCheck`:

| Value              | Meaning                                                 |
| ------------------ | ------------------------------------------------------- |
| `#CHECK`           | a role is expected; without one, the syntax check warns |
| `#NOT_REQUIRED`    | no role is needed, but one is applied if it exists      |
| `#NOT_ALLOWED`     | roles are never applied                                 |
| `#PRIVILEGED_ONLY` | the view may be read only with privileged access        |

```abap
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Flights'
define view entity ZI_Flight
  as select from sflight
  // ... associations and elements as in the previous lessons
```

## Writing a role

A role is an object of its own: in ADT, **New > Other ABAP Repository Object > Core Data Services > Access Control**. Give it the same name as the view.

```abap
@EndUserText.label: 'Access control for ZI_Flight'
@MappingRole: true
define role ZI_FLIGHT {
  grant select on ZI_Flight
    where ( CarrierId ) = aspect pfcg_auth( S_CARRID, CARRID, ACTVT = '03' );
}
```

- `grant select on` names the protected entity.
- The `where` clause is the **access condition**. Here it's a **PFCG condition**: the element `CarrierId` is compared with the field `CARRID` of the authorization object `S_CARRID`, for the roles assigned to the user with activity `03` (display).
- `@MappingRole: true` means the role is assigned to all users automatically. What each user sees still depends on their PFCG roles.

At runtime, ABAP SQL adds the condition to the `WHERE` clause. A user whose PFCG role allows `S_CARRID` with `CARRID = LH` and `UA` reads only Lufthansa and United flights; a user with `*` sees everything; a user without `S_CARRID` sees nothing.

## Other kinds of conditions

You can combine conditions with `and` and `or`, and use several kinds. This role protects a booking view `ZI_Booking` on `SBOOK` and hides cancelled bookings:

```abap
@EndUserText.label: 'Access control for ZI_Booking'
@MappingRole: true
define role ZI_BOOKING {
  grant select on ZI_Booking
    where ( CarrierId ) = aspect pfcg_auth( S_CARRID, CARRID, ACTVT = '03' )
      and Cancelled <> 'X';                             // literal condition
}
```

| Condition | Example                                                | Effect                                                |
| --------- | ------------------------------------------------------ | ----------------------------------------------------- |
| PFCG      | `( CarrierId ) = aspect pfcg_auth( S_CARRID, CARRID )` | values from the user's authorizations                 |
| Literal   | `Cancelled <> 'X'`                                     | a fixed filter                                        |
| User      | `CreatedBy ?= aspect user`                             | the current user name; `?=` also accepts empty values |
| Inherited | `inheriting conditions from entity ZI_Flight`          | reuses the conditions of the role of another entity   |

Inheritance is the usual way to protect a consumption view: `grant select on ZC_FlightList where inheriting conditions from entity ZI_Flight;`. If the conditions of `ZI_Flight` change, the consumption view follows.

> [!WARNING]
> Access control works only for **ABAP SQL reads of the CDS entity**. A `SELECT` on the table `SFLIGHT` directly, a CDS view on top that has `#NOT_ALLOWED`, or native SQL in an AMDP bypass it. Make the protected view the only way your apps read the data.

## Privileged access and testing

Sometimes a program must read all rows regardless of the user, for example a background job that computes totals. Then it asks for privileged access explicitly, and the roles are not applied:

```abap
SELECT FROM zi_flight WITH PRIVILEGED ACCESS
  FIELDS CarrierId, COUNT( * ) AS flights
  GROUP BY CarrierId
  INTO TABLE @DATA(lt_all).
```

In RAP, the `PRIVILEGED` addition of [EML](./0143-eml.en.md) plays a similar role for the authorization checks of a business object. Use privileged access on purpose and document why.

To test a role, log on with a user that has a limited `S_CARRID` authorization and run the data preview: it applies the roles of the current user. In ADT, **Open With > Access Control** on the view shows which roles apply to it.

## Exercise

> [!IMPORTANT]
>
> 1. Set `@AccessControl.authorizationCheck: #CHECK` on `ZI_Flight` and create the role `ZI_FLIGHT` with the PFCG condition on `S_CARRID`.
> 2. Run the data preview with your user, then ask for a test user whose PFCG role allows only `CARRID = LH`. Compare the results.
> 3. Create `ZC_FlightList` on top of `ZI_Flight` and protect it with an inherited condition.

### Solution

```abap
@EndUserText.label: 'Access control for ZC_FlightList'
@MappingRole: true
define role ZC_FLIGHTLIST {
  grant select on ZC_FlightList
    where inheriting conditions from entity ZI_Flight;
}
```

The test user sees only `LH` flights in both views, with no error message. If you see no rows at all, the user has no `S_CARRID` authorization with activity `03`.

> [!NOTE]
>
> - CDS access control filters rows on every ABAP SQL read of a CDS entity, based on the user's authorizations.
> - `@AccessControl.authorizationCheck: #CHECK` on the view, and a role `define role ... grant select on ... where ...` in DCL.
> - PFCG conditions map elements to authorization object fields; literal, user, and inherited conditions are also available.
> - Reading the table directly bypasses the role: make the view the only access path.
> - `WITH PRIVILEGED ACCESS` skips the roles on purpose; use it only where it's justified.
