---
title: Extending standard SAP
description: Modifications, exits, BAdIs, and the enhancement framework at a glance.
level: pro
---

Every company needs SAP to do something slightly different from the standard: one more check when a sales order is saved, an extra field on a screen, a different rounding rule. SAP offers many ways to plug your code into standard programs, from the oldest user exits to the enhancement framework and the extensibility of SAP S/4HANA Cloud. This lesson gives you the map; the next lessons cover each technique in detail.

## From least to most invasive

Before writing code, check whether you need code at all:

1. **Customizing** (`SPRO`): many "changes" are settings. Ask a functional consultant first.
2. **Personalization**: screen variants, layouts, and user parameters change what users see, without development.
3. **Enhancements**: SAP-planned or framework-supported hooks where you add your own code. They survive upgrades.
4. **Modifications**: changes to SAP's own source code. They're your last resort.

> [!TIP]
> Think of a rented flat. Customizing is moving the furniture. Enhancements are the hooks and sockets the owner already put in the walls. A modification is knocking down a wall: possible, but you must ask, and at every renovation (upgrade) the owner may rebuild it and you'll have to knock it down again.

## The techniques at a glance

| Technique               | Since    | Where you write code                            | Find it with                        | Lesson                                                                   |
| ----------------------- | -------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| user exit               | R/2, R/3 | `FORM USEREXIT_...` in SAP includes (SD mostly) | the include, for example `MV45AFZZ` | [user exits and customer exits](./0121-user-exits-and-customer-exits.md) |
| customer exit           | R/3 3.0  | function module includes `ZX...`, via `CMOD`    | `SMOD`, `CALL CUSTOMER-FUNCTION`    | [user exits and customer exits](./0121-user-exits-and-customer-exits.md) |
| classic BAdI            | 4.6      | a class implementing `IF_EX_...`, via `SE19`    | `SE18`, `CL_EXITHANDLER`            | [BAdIs](./0122-badis.md)                                                 |
| new (kernel) BAdI       | 7.0      | a class in an enhancement implementation        | `SE18`, `GET BADI`, `CALL BADI`     | [BAdIs](./0122-badis.md)                                                 |
| explicit enhancement    | 7.0      | `ENHANCEMENT-POINT` / `ENHANCEMENT-SECTION`     | the source code, `SE84`             | [implicit and explicit enhancements](./0123-enhancement-points.md)       |
| implicit enhancement    | 7.0      | start and end of almost any routine             | the source code                     | [implicit and explicit enhancements](./0123-enhancement-points.md)       |
| modification            | always   | SAP's source code itself                        | the Modification Assistant          | this lesson                                                              |
| developer extensibility | S/4HANA  | released BAdIs and APIs, in ABAP Cloud          | released objects in ADT             | [ABAP Cloud and clean core](./0148-abap-cloud.md)                        |

BAdIs, enhancement points, and enhancement sections all belong to the **enhancement framework**, introduced with SAP NetWeaver 7.0. They're grouped in **enhancement spots**, and your code goes into **enhancement implementations**, which are transportable objects of your package.

## How to choose

Pick the first option that solves the problem:

1. A **BAdI** at the right place. BAdIs are designed interfaces: SAP tells you what you get and what you may change, and they keep working after upgrades.
2. A **customer exit** or **user exit**, if the process (often SD, MM, or FI) offers one there.
3. An **explicit enhancement point or section** placed by SAP.
4. An **implicit enhancement** at the start or end of a routine.
5. A **modification**, only if nothing else works.

In SAP S/4HANA, also ask whether the code belongs in the standard at all. With the **clean core** approach, you prefer released BAdIs and APIs, and build bigger additions as separate apps (on-stack in ABAP Cloud, or side-by-side on SAP BTP).

> [!WARNING]
> Exits and enhancements run inside SAP's LUW. Don't call `COMMIT WORK`, `ROLLBACK WORK`, `CALL TRANSACTION`, or `SUBMIT ... AND RETURN` there, and don't show popups in code that may also run in background or through an API. A single wrong statement breaks the standard transaction for every user.

## Modifications

A **modification** is a change to an SAP object: source code, screens, Dictionary objects. To make one, you need:

- a **developer key** for your user and an **object key** (access key) for the object, both registered in SAP for Me (formerly `SSCR`);
- the **Modification Assistant**, which records your change as an insertion, replacement, or deletion block, so it can be compared and reapplied later.

At every upgrade or support package, transactions `SPDD` (Dictionary objects) and `SPAU` (programs and other repository objects) show the modified objects. For each one, someone must decide whether to keep the change, adapt it, or go back to the standard. `SPAU_ENH` does the same for enhancements.

```text
SE38 > program SAPMV45A > Change
  -> "Enter access key" popup         (object key registered in SAP for Me)
  -> Modification Assistant active     (Edit > Modification Operations > Insert)
```

> [!CAUTION]
> Every modification is technical debt that you pay at each upgrade. SAP support may also ask you to reproduce a problem without it. Document every modification (why, who, which incident or requirement), and review the list regularly: many can be replaced by a BAdI that appeared in a later release.

## Exercise

> [!IMPORTANT]
> Pick a standard transaction you know, for example `VA01` (create sales order) or `ME21N` (create purchase order).
>
> 1. In `SE93`, find the program behind the transaction.
> 2. In that program, search for `CALL CUSTOMER-FUNCTION`, `CL_EXITHANDLER`, `GET BADI`, and `ENHANCEMENT-POINT`.
> 3. For each hit, write down which technique it is.

### Solution

For `VA01`, `SE93` shows program `SAPMV45A`. In the main program and its includes you'll find the user exit includes `MV45AFZZ`, `MV45AFZB`, and others; calls of `CALL CUSTOMER-FUNCTION` for customer exits; `GET BADI` and `CL_EXITHANDLER=>GET_INSTANCE` calls for new and classic BAdIs; and many `ENHANCEMENT-POINT` statements. Use **Find in main program** (`Ctrl+F` and the "In main program" option) to search all includes at once.

> [!NOTE]
>
> - Try Customizing and personalization first; write code only when settings aren't enough.
> - The techniques, from oldest to newest: user exits, customer exits, classic BAdIs, the enhancement framework (new BAdIs, explicit and implicit enhancements).
> - Prefer BAdIs, then exits, then explicit enhancements, then implicit ones; modify only as a last resort.
> - Never commit, roll back, or show popups inside exits and enhancements.
> - Modifications need an object key and the Modification Assistant, and must be reviewed in `SPDD` and `SPAU` at every upgrade.
