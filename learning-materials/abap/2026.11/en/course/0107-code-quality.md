---
title: 'Code quality: ATC and Clean ABAP'
description: Static checks, the ABAP Test Cockpit, and the Clean ABAP style guide.
---

_Intermediate level_

Code that compiles isn't necessarily good code. It can have unused variables, a `SELECT` inside a loop, a missing authorization check, or a method so long that nobody dares to touch it. **Static checks** find many of these problems by reading the source code, without running it. The **ABAP Test Cockpit** (ATC) runs them all together, and the **Clean ABAP** style guide covers what tools can't check: readable names and simple design.

## The static checks

SAP offers several layers of checks, each one broader than the previous:

| Check                  | Transaction | What it finds                                                                          |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------- |
| Syntax check           | `Ctrl+F2`   | errors that prevent activation, and warnings                                           |
| Extended program check | `SLIN`      | unused variables, unreachable code, wrong message calls, missing texts                 |
| Code Inspector         | `SCI`       | performance, security, and naming problems, configurable in check variants             |
| ABAP Test Cockpit      | `ATC`       | runs Code Inspector checks and unit tests, with central rules, exemptions, and reports |

In practice you use the ATC: it includes the others and is what your team and the transport process look at.

## Running the ATC

In ADT, right-click a program, class, or package and choose **Run As > ABAP Test Cockpit** (`Ctrl+Shift+F2`). In SAP GUI, open the object in `SE80` and choose **Check > ABAP Test Cockpit (ATC)**.

The ATC Problems view lists the **findings**, each with a priority:

| Priority | Meaning                          | Typical example                  |
| -------- | -------------------------------- | -------------------------------- |
| 1        | error: must be fixed             | dynamic SQL open to injection    |
| 2        | warning: should be fixed         | `SELECT` inside a loop           |
| 3        | information: fix it when you can | variable declared but never used |

A double click on a finding opens the line of code; the details explain the problem and often suggest a fix. Many systems run the ATC automatically when you release a transport request and block it if there are priority 1 or 2 findings.

The **check variant** decides which checks run. Your quality team maintains it centrally (transaction `ATC`, ATC administration), so everybody is measured with the same rules.

> [!TIP]
> The ATC is the inspection at the end of the assembly line in a car factory. The car drives (the code compiles), but the inspector still checks the brakes, the lights, and the paint before it leaves the plant.

## False positives: pseudo comments, pragmas, and exemptions

Sometimes a finding is wrong for your case. You can silence a single finding in the code:

```abap
" Pragma: hides a warning of the syntax check or SLIN
DATA lv_unused TYPE i ##NEEDED.

" Pseudo comment: hides a Code Inspector finding (older form, still common)
SELECT * FROM sflight INTO TABLE @DATA(lt_all).   "#EC CI_NOWHERE
```

Pragmas start with `##` and stand before the period; pseudo comments start with `"#EC` and stand at the end of the line. Each check documents which one it accepts.

For findings you can't silence in the code, request an **exemption** in the ATC result. A quality manager approves or rejects it.

> [!WARNING]
> Silencing a finding isn't fixing it. Use pragmas and exemptions only when you can explain why the finding doesn't apply, and add a comment with the reason. A program full of `##NEEDED` is a program nobody checks anymore.

## Clean ABAP

**Clean ABAP** is SAP's style guide for ABAP, published as open source on GitHub (`SAP/styleguides`). It adapts the ideas of the book _Clean Code_ to ABAP. Some of its rules:

- Use descriptive names: `calculate_free_seats` instead of `calc_fs`.
- Prefer object orientation to procedural code, and functional calls to `CALL METHOD`.
- Keep methods small, doing one thing, with few parameters; split a method instead of adding `OPTIONAL` parameters.
- Prefer `RETURNING` to `EXPORTING`, and exceptions to return codes.
- Use modern syntax: inline declarations, constructor expressions, `xsdbool( )`.
- Don't comment what the code does; make the code say it, and comment why.

```abap
" Not clean
CALL METHOD lo_calc->calc_fs
  EXPORTING is_f = ls_f
  IMPORTING ev_r = lv_r.

" Clean
DATA(lv_free_seats) = lo_calculator->calculate_free_seats( ls_flight ).
```

Clean ABAP advises against prefixes like `lv_` and `lt_`, while many teams and this course use them. Follow the conventions of your team, and be consistent: a mix of styles is worse than either style. The open-source tools **abaplint** (for Git repositories) and **code pal for ABAP** (extra ATC checks) can check many Clean ABAP rules automatically.

## Exercise

> [!IMPORTANT]
>
> 1. Write a small report with an unused variable, a `SELECT` on `SFLIGHT` without `WHERE`, and a `SELECT SINGLE` on `SCARR` inside a `LOOP`.
> 2. Run the ATC on it and read the findings.
> 3. Fix the code until the ATC reports no priority 1 or 2 findings.

### Solution

```abap
REPORT zatc_demo.

PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  " One SELECT with a join and a WHERE instead of SELECT in LOOP
  SELECT FROM sflight AS f
    INNER JOIN scarr AS c ON c~carrid = f~carrid
    FIELDS f~carrid, c~carrname, f~connid, f~fldate
    WHERE f~carrid = @p_carrid
    INTO TABLE @DATA(lt_flights).

  cl_demo_output=>display( lt_flights ).
```

> [!NOTE]
>
> - Static checks read the code without running it: syntax check, `SLIN`, Code Inspector (`SCI`), and ATC.
> - Run the ATC with `Ctrl+Shift+F2` in ADT; findings have priority 1 (error), 2 (warning), or 3 (information).
> - The check variant is defined centrally, and the ATC can block the release of transports.
> - Pragmas (`##`), pseudo comments (`"#EC`), and exemptions silence false positives: always explain why.
> - Clean ABAP is SAP's style guide: clear names, small methods, modern syntax, and consistent conventions.
