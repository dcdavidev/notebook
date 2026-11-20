---
title: RAP, ABAP Cloud, and your future as a developer
description: Build a complete Fiori app with the RESTful Application Programming Model.
---

_Week 3 · Advanced level · 4 hours_

### Today's schedule

| Block  | Content                                                                                |
| ------ | -------------------------------------------------------------------------------------- |
| Hour 1 | ABAP Cloud, Clean Core, released APIs, the 3-tier extensibility model                  |
| Hour 2 | RAP step by step: tables, CDS, behavior definition, projection, service, Fiori preview |
| Hour 3 | RAP business logic: validations, determinations, actions, draft, EML                   |
| Hour 4 | Tools (abapGit, gCTS), final project, certification, and study plan                    |

## Hour 1 – ABAP Cloud and Clean Core

### The problem it solves

For decades, companies changed and extended SAP in every corner: implicit enhancements, direct reads of internal tables, modifications. The result: every upgrade became an expensive project, because the custom code broke.

**Clean Core** is SAP's strategy for keeping the core "clean": extensions use only stable, official interfaces, so upgrades don't break anything.

> [!TIP]
> It's the difference between hanging pictures on the nails the landlord provided (released APIs) and gluing them straight onto the heating pipes (internal objects). In the first case, if the landlord redoes the plumbing, the pictures stay up; in the second, they all fall down.

### What ABAP Cloud is

**ABAP Cloud** is SAP's modern development model, with four pillars:

| Pillar                      | Meaning                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ABAP language for the cloud | a restricted version of ABAP: no obsolete statements or statements tied to SAP GUI (`WRITE`, Dynpro, `SUBMIT`, `CALL TRANSACTION`, direct file system access...) |
| Released APIs only          | you can use only "released" SAP objects (with a C1 stability contract): standard CDS views such as `I_Customer`, classes such as `XCO_CP_*`, released BAdIs      |
| Eclipse ADT                 | the only development environment                                                                                                                                 |
| RAP                         | the model for services, Fiori apps, and APIs                                                                                                                     |

ABAP Cloud is used in:

- **SAP BTP, ABAP Environment** (nicknamed "Steampunk"): ABAP as a cloud service;
- **SAP S/4HANA Cloud Public Edition** (developer extensibility, nicknamed "Embedded Steampunk");
- **SAP S/4HANA Cloud Private Edition and recent on-premise releases**: you can choose the language version "ABAP for Cloud Development" for each package.

### The 3-tier extensibility model (on-premise / private)

| Tier                    | What it contains                                                                          | Rules                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Tier 1 – ABAP Cloud     | new custom development                                                                    | cloud language, released APIs only: the default choice |
| Tier 2 – API enablement | "wrappers": classic ABAP classes that wrap an unreleased object and release it for tier 1 | only when a released API is missing                    |
| Tier 3 – Classic ABAP   | existing code and cases with no alternative                                               | to be reduced over time                                |

How to know whether an object is released: in ADT, in the object's **Properties → API State** view; or in the "Released Objects" app/repository and the ATC Cloud Readiness checks. For unreleased classic objects, SAP often names a released **successor**.

### Modern APIs to know (ABAP Cloud)

| Need                         | API                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Console output               | `if_oo_adt_classrun`                                                           |
| Date and time                | `cl_abap_context_info`, `utclong_current( )`, `xco_cp=>sy`                     |
| Strings, JSON, tables, Excel | the XCO library (`xco_cp`, `xco_cp_json`, `xco_cp_xlsx`)                       |
| Sequential numbers           | `cl_numberrange_runtime`                                                       |
| Application log              | `cl_bali_log`                                                                  |
| HTTP client                  | `cl_web_http_client_manager` + destinations via `cl_http_destination_provider` |
| Background work              | Application Jobs (`if_apj_dt_exec_object`, `if_apj_rt_exec_object`), bgPF      |
| Email                        | `cl_bcs_mail_message`                                                          |
| Master data and documents    | released `I_*` CDS views and released RAP business objects via EML             |

## Hour 2 – RAP step by step

**RAP** (_ABAP RESTful Application Programming Model_) is the standard model for building OData services, Fiori apps, and transactional APIs. Instead of hand-writing screens, checks, locks, and saving logic, you **declare** them and the framework does the rest.

> [!TIP]
> With Dynpros you built the house brick by brick: wiring, plumbing, doors. With RAP you pick the house from a modular plan: you declare how many rooms you want and what should happen when a door opens; the utilities, locks, and connections (OData, locks, transactions, UI) are already included.

### The parts of a RAP application

| Layer      | Object                                                            | Role                                                  |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Data       | database table (+ draft table)                                    | where the data is stored                              |
| Model      | "root" CDS view entity (`R_` or `I_`) with compositions           | the business object (BO)                              |
| Behavior   | Behavior Definition (BDEF) + Behavior Pool class                  | which operations are allowed and with which logic     |
| Projection | CDS projection view (`C_`) + projection BDEF + metadata extension | what to expose to a specific app, with UI annotations |
| Service    | Service Definition                                                | which entities to publish                             |
| Protocol   | Service Binding (OData V4 – UI)                                   | how to publish them                                   |
| Interface  | Fiori Elements preview / Fiori app                                | the user                                              |

### The fastest way: the generator

In ADT: right-click the table → **Generate ABAP Repository Objects** → "OData UI Service" (or "Generate RAP BO"). The wizard creates all the objects in the diagram, with draft. It's a great way to start: then you study and customize every piece. Below we build the objects by hand to understand them.

### 1. The table

```sql
@EndUserText.label : 'Trips'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table ztrip {
  key client            : abap.clnt not null;
  key trip_uuid         : sysuuid_x16 not null;
  trip_id               : abap.numc(8);
  customer_id           : abap.numc(6);
  begin_date            : abap.dats;
  end_date              : abap.dats;
  @Semantics.amount.currencyCode : 'ztrip.currency'
  price                 : abap.curr(16,2);
  currency              : abap.cuky;
  description           : abap.char(256);
  status                : abap.char(1);
  created_by            : abp_creation_user;
  created_at            : abp_creation_tstmpl;
  last_changed_by       : abp_locinst_lastchange_user;
  local_last_changed_at : abp_locinst_lastchange_tstmpl;
  last_changed_at       : abp_lastchange_tstmpl;
}
```

(In ADT, tables are defined with this text syntax; in SE11 you see the same object in graphical form.) RAP uses the administrative fields (created by/at, changed by/at) for concurrency control (ETag), and fills them automatically.

### 2. The root CDS view

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Trip - BO'
define root view entity ZR_Trip
  as select from ztrip
{
  key trip_uuid             as TripUuid,
      trip_id               as TripId,
      customer_id           as CustomerId,
      begin_date            as BeginDate,
      end_date              as EndDate,
      @Semantics.amount.currencyCode: 'Currency'
      price                 as Price,
      currency              as Currency,
      description           as Description,
      status                as Status,
      @Semantics.user.createdBy: true
      created_by            as CreatedBy,
      @Semantics.systemDateTime.createdAt: true
      created_at            as CreatedAt,
      @Semantics.user.localInstanceLastChangedBy: true
      last_changed_by       as LastChangedBy,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      local_last_changed_at as LocalLastChangedAt,
      @Semantics.systemDateTime.lastChangedAt: true
      last_changed_at       as LastChangedAt
}
```

`root` means it's the root of the business object. Child entities (for example the trip's bookings) are linked with `composition [0..*] of ZR_Booking as _Bookings` in the root and `association to parent ZR_Trip as _Trip` in the child.

### 3. The Behavior Definition (BDEF)

```text
managed implementation in class zbp_r_trip unique;
strict ( 2 );
with draft;

define behavior for ZR_Trip alias Trip
persistent table ztrip
draft table ztrip_d
etag master LocalLastChangedAt
lock master total etag LastChangedAt
authorization master ( global )
{
  field ( readonly, numbering : managed ) TripUuid;
  field ( readonly ) TripId, Status, CreatedBy, CreatedAt, LastChangedBy, LastChangedAt, LocalLastChangedAt;
  field ( mandatory ) CustomerId, BeginDate, EndDate;

  create;
  update;
  delete;

  action ( features : instance ) accept result [1] $self;
  action ( features : instance ) reject result [1] $self;

  determination setTripNumber on save { create; }
  determination setInitialStatus on modify { create; }
  validation validateDates on save { create; field BeginDate, EndDate; }
  validation validateCustomer on save { create; field CustomerId; }

  draft action Edit;
  draft action Activate optimized;
  draft action Discard;
  draft action Resume;
  draft determine action Prepare { validation validateDates; validation validateCustomer; }

  mapping for ztrip corresponding
  {
    TripUuid           = trip_uuid;
    TripId             = trip_id;
    CustomerId         = customer_id;
    BeginDate          = begin_date;
    EndDate            = end_date;
    Price              = price;
    Currency           = currency;
    Description        = description;
    Status             = status;
    CreatedBy          = created_by;
    CreatedAt          = created_at;
    LastChangedBy      = last_changed_by;
    LocalLastChangedAt = local_last_changed_at;
    LastChangedAt      = last_changed_at;
  }
}
```

The main keywords:

| Element                                                | Meaning                                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `managed`                                              | the framework handles create/update/delete and saving (alternative: `unmanaged`, when the saving logic already exists, for example a BAPI) |
| `with draft`                                           | data being edited is saved as a draft (the user can stop and resume)                                                                       |
| `persistent table` / `draft table`                     | the real table and the draft table (which a quick fix can generate)                                                                        |
| `etag` / `lock master`                                 | concurrency control and locks                                                                                                              |
| `authorization master`                                 | authorization checks (`global` = per operation, `instance` = per single record)                                                            |
| `field ( readonly / mandatory / numbering : managed )` | field properties                                                                                                                           |
| `action`                                               | a custom operation (a button in the app)                                                                                                   |
| `determination`                                        | an automatic calculation when something happens (`on modify` / `on save`)                                                                  |
| `validation`                                           | a check run on save, which can block it                                                                                                    |
| `features : instance`                                  | enable/disable an action or a field dynamically                                                                                            |

### 4. Projection, service, binding

```sql
@EndUserText.label: 'Trip - projection'
@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@Search.searchable: true
define root view entity ZC_Trip
  provider contract transactional_query
  as projection on ZR_Trip
{
  key TripUuid,
      @Search.defaultSearchElement: true
      TripId,
      CustomerId,
      BeginDate,
      EndDate,
      Price,
      Currency,
      Description,
      Status,
      LocalLastChangedAt
}
```

```text
projection;
strict ( 2 );
use draft;

define behavior for ZC_Trip alias Trip
{
  use create;
  use update;
  use delete;

  use action accept;
  use action reject;

  use action Edit;
  use action Activate;
  use action Discard;
  use action Resume;
  use action Prepare;
}
```

Metadata extension (UI annotations, DDLX file):

```sql
@Metadata.layer: #CORE
@UI.headerInfo: { typeName: 'Trip', typeNamePlural: 'Trips',
                  title: { type: #STANDARD, value: 'TripId' } }
annotate entity ZC_Trip with
{
  @UI.facet: [ { id: 'General', purpose: #STANDARD, type: #IDENTIFICATION_REFERENCE,
                 label: 'General data', position: 10 } ]

  @UI.hidden: true
  TripUuid;

  @UI: { lineItem: [ { position: 10 } ], identification: [ { position: 10 } ],
         selectionField: [ { position: 10 } ] }
  TripId;

  @UI: { lineItem: [ { position: 20 } ], identification: [ { position: 20 } ],
         selectionField: [ { position: 20 } ] }
  CustomerId;

  @UI: { lineItem: [ { position: 30 } ], identification: [ { position: 30 } ] }
  BeginDate;

  @UI: { lineItem: [ { position: 40 } ], identification: [ { position: 40 } ] }
  EndDate;

  @UI: { lineItem: [ { position: 50 } ], identification: [ { position: 50 } ] }
  Price;

  @UI: { lineItem: [ { position: 60 },
                     { type: #FOR_ACTION, dataAction: 'accept', label: 'Accept' },
                     { type: #FOR_ACTION, dataAction: 'reject', label: 'Reject' } ],
         identification: [ { position: 60 },
                           { type: #FOR_ACTION, dataAction: 'accept', label: 'Accept' },
                           { type: #FOR_ACTION, dataAction: 'reject', label: 'Reject' } ] }
  Status;
}
```

Service definition and binding:

```sql
@EndUserText.label: 'Trip service'
define service ZUI_TRIP {
  expose ZC_Trip as Trip;
}
```

Then: right-click the service definition → **New Service Binding** → type **OData V4 – UI** → activate → **Publish** → select the entity → **Preview**. A complete Fiori Elements app opens in the browser: a list with filters, a detail page, create, edit, delete, drafts, and action buttons. Without writing a single line of user interface.

## Hour 3 – RAP business logic

### The Behavior Pool class

From the BDEF, with a quick fix (Ctrl+1), ADT generates the class `ZBP_R_TRIP` with a local handler class (`lhc_trip`) that contains one method for every validation, determination, and action. You write the code with **EML**.

### EML: Entity Manipulation Language

**EML** is the ABAP extension for reading and changing RAP business objects. You use it both inside the behavior pool (`IN LOCAL MODE`, which skips authorization and feature checks) and from outside.

```abap
" Read
READ ENTITIES OF zr_trip IN LOCAL MODE
  ENTITY Trip
    FIELDS ( BeginDate EndDate ) WITH CORRESPONDING #( keys )
  RESULT DATA(lt_trips).

" Change
MODIFY ENTITIES OF zr_trip IN LOCAL MODE
  ENTITY Trip
    UPDATE FIELDS ( Status )
    WITH VALUE #( FOR t IN lt_trips ( %tky = t-%tky Status = 'A' ) ).

" From an external program: create and save
MODIFY ENTITIES OF zr_trip
  ENTITY Trip
    CREATE FIELDS ( CustomerId BeginDate EndDate Price Currency )
    WITH VALUE #( ( %cid = 'T1' CustomerId = '000001' BeginDate = '20261201'
                    EndDate = '20261210' Price = 1500 Currency = 'EUR' ) )
  MAPPED DATA(ls_mapped)
  FAILED DATA(ls_failed)
  REPORTED DATA(ls_reported).

COMMIT ENTITIES.        " save (outside RAP; inside RAP the framework does it)
```

Special components with `%`: `%tky` (transactional key, includes the draft indicator), `%key`, `%cid` (temporary ID for new instances), `%control`, `%msg`, `%element`, `%is_draft`, `%param`. The `failed`, `reported`, and `mapped` structures return errors, messages, and assigned keys.

### A validation

```abap
METHOD validateDates.
  READ ENTITIES OF zr_trip IN LOCAL MODE
    ENTITY Trip FIELDS ( BeginDate EndDate ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_trips).

  LOOP AT lt_trips INTO DATA(ls_t).
    APPEND VALUE #( %tky = ls_t-%tky %state_area = 'VALIDATE_DATES' ) TO reported-trip.

    IF ls_t-EndDate < ls_t-BeginDate.
      APPEND VALUE #( %tky = ls_t-%tky ) TO failed-trip.
      APPEND VALUE #( %tky        = ls_t-%tky
                      %state_area = 'VALIDATE_DATES'
                      %msg        = new_message_with_text(
                                      severity = if_abap_behv_message=>severity-error
                                      text     = 'The end date is before the begin date' )
                      %element-EndDate = if_abap_behv=>mk-on ) TO reported-trip.
    ENDIF.
  ENDLOOP.
ENDMETHOD.
```

Putting the key in `failed` blocks the save; the message in `reported` appears to the user next to the field named in `%element`. In a real project, the texts come from a message class (an exception that implements `IF_ABAP_BEHV_MESSAGE`).

### A determination

```abap
METHOD setInitialStatus.
  READ ENTITIES OF zr_trip IN LOCAL MODE
    ENTITY Trip FIELDS ( Status ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_trips).
  DELETE lt_trips WHERE Status IS NOT INITIAL.
  CHECK lt_trips IS NOT INITIAL.

  MODIFY ENTITIES OF zr_trip IN LOCAL MODE
    ENTITY Trip UPDATE FIELDS ( Status )
    WITH VALUE #( FOR t IN lt_trips ( %tky = t-%tky Status = 'O' ) ).   " O = open
ENDMETHOD.
```

### An action and dynamic feature control

```abap
METHOD accept.
  MODIFY ENTITIES OF zr_trip IN LOCAL MODE
    ENTITY Trip UPDATE FIELDS ( Status )
    WITH VALUE #( FOR k IN keys ( %tky = k-%tky Status = 'A' ) ).

  READ ENTITIES OF zr_trip IN LOCAL MODE
    ENTITY Trip ALL FIELDS WITH CORRESPONDING #( keys )
    RESULT DATA(lt_trips).

  result = VALUE #( FOR t IN lt_trips ( %tky = t-%tky %param = t ) ).
ENDMETHOD.

METHOD get_instance_features.
  READ ENTITIES OF zr_trip IN LOCAL MODE
    ENTITY Trip FIELDS ( Status ) WITH CORRESPONDING #( keys )
    RESULT DATA(lt_trips).

  result = VALUE #( FOR t IN lt_trips
    ( %tky           = t-%tky
      %action-accept = COND #( WHEN t-Status = 'A' THEN if_abap_behv=>fc-o-disabled
                                                   ELSE if_abap_behv=>fc-o-enabled )
      %action-reject = COND #( WHEN t-Status = 'X' THEN if_abap_behv=>fc-o-disabled
                                                   ELSE if_abap_behv=>fc-o-enabled ) ) ).
ENDMETHOD.
```

### The life cycle of a RAP transaction

1. **Interaction phase**: the user creates/changes data (in draft or directly); "on modify" determinations and actions run.
2. **Save sequence**: `finalize` (on save determinations) → `check_before_save` (validations) → if everything is fine, `adjust_numbers` (late numbering) → `save` → `cleanup`.

In an **unmanaged** scenario or with **additional save**, you write the save sequence code yourself in a saver class (`lsc_...`), for example by calling a BAPI.

> [!WARNING]
> In the behavior pool you don't use `COMMIT WORK`, `ROLLBACK WORK`, `CALL TRANSACTION`, `SUBMIT`, `MESSAGE` statements, or popups: the framework controls the transaction, and messages go through `reported`.

### Other RAP topics to explore

- **Business events** (`event` in the BDEF, `RAISE ENTITY EVENT`) for asynchronous integration.
- **Web API services** (OData V4 – Web API binding) for integrations without a UI.
- **Side effects**, value help (`@Consumption.valueHelpDefinition`), search.
- **Extensibility of RAP BOs** (`extend behavior`) and released standard BOs (for example `I_SalesOrderTP`) that you can change with EML.
- **Tests**: `cl_botd_txbufdbl_bo_test_env` and `cl_botd_mockemlapi_bo_test_env` for BO test doubles.

## Hour 4 – Tools, final project, career

### abapGit and gCTS

- **abapGit** is an open source Git client written in ABAP: it stores code in Git repositories (GitHub, GitLab...). Its ADT version is integrated in Eclipse and available on BTP. You use it to share code, make backups, and use open source projects (for example abap2xlsx) and SAP sample projects.
- **gCTS** (_git-enabled Change and Transport System_) connects the SAP transport system to Git.

### The course's final project

Build the **"Leave request management"** application using everything you've learned:

1. **Dictionary**: tables `ZLEAVE_REQ` (request) and `ZLEAVE_TYPE` (types: vacation, permit, sick leave) with data elements and domains with fixed values for the status (N new, A approved, R rejected).
2. **CDS**: `ZR_LeaveRequest` (root) with an association to the type and a calculated field "days requested" (`dats_days_between`).
3. **Managed RAP with draft**: validations (end date ≥ begin date, at most 20 days, no overlap with the same employee's other requests), a determination (initial status N, employee = current user), and "Approve" and "Reject" actions enabled only when the status is N.
4. **Access**: a DCL that shows each user only their own requests.
5. **UI**: a metadata extension with a list, filters, and a detail page; Fiori Elements preview.
6. **Tests**: an ABAP Unit class for the validation logic (extract the calculations into a separate class and test it).
7. **Classic report** (tier 3, as practice): an ALV report for the HR office with statistics by type and month (CDS with aggregations + `CL_SALV_TABLE`).
8. **Quality**: ATC with no errors, consistent names, formatted code.

### Certification

The most relevant certification for new developers is **SAP Certified Associate – Back-End Developer – ABAP Cloud** (exam code `C_ABAPD`; the suffix changes with releases: for example `_2309`, `_2507`). It covers CDS and data modeling, RAP, modern ABAP syntax, object-oriented programming, ABAP SQL, and extensibility. Always check on SAP Learning ([learning.sap.com](https://learning.sap.com)) the current code, content, duration, and prerequisites, and the recommended free learning path ("Learning Journey"). SAP certifications must be kept up to date with periodic assessments ("Stay certified").

### Resources to keep going

| Resource                                                  | What it is for                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| ABAP keyword documentation (F1 in ADT/SE80, help.sap.com) | the official source for every statement, with examples                                       |
| SAP Learning (learning.sap.com)                           | free learning paths on ABAP Cloud, RAP, CDS                                                  |
| SAP Community (community.sap.com)                         | blogs, questions and answers                                                                 |
| Clean ABAP (GitHub SAP/styleguides)                       | style guide                                                                                  |
| SAP-samples GitHub repositories                           | official RAP and ABAP Cloud samples (for example the ABAP Flight Reference Scenario `/DMO/`) |
| Demo programs in the system                               | `DEMO_*`, `SALV_DEMO_*`, `BCALV_*`, `CL_DEMO_*` classes (transaction ABAPDOCU)               |
| SAP BTP trial                                             | a free environment to practice ABAP Cloud                                                    |

### Your plan after the course

| Period     | Goal                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Weeks 4–5  | Redo all the exercises without looking at the solutions; complete the final project                         |
| Weeks 6–8  | Study the official ABAP Cloud Learning Journey and the `/DMO/` sample projects                              |
| Months 3–4 | Read real code: SAP standard programs in the debugger, the Z programs in your system; try the certification |
| Ongoing    | One topic per week in depth (for example IDocs, Adobe Forms, AMDP), always with a small hands-on project    |

> [!TIP]
> Learning ABAP is like learning to drive: after the course you have your license, but you become a good driver only by putting in the miles. Every bug you fix, every dump you read, every standard program you debug is another mile.

## Exercises

> [!IMPORTANT]
>
> 1. Create an SAP BTP trial account with ABAP Environment (or use your recent S/4HANA system) and create the Hello World console class in ABAP Cloud.
> 2. In a package with the language version "ABAP for Cloud Development", try to use `SELECT * FROM mara` and `WRITE`: read the errors and find the released successor (for example `I_Product`).
> 3. Create the table `ZTRIP` and use the "OData UI Service" generator to create the whole app. Start the Fiori preview and create 3 trips.
> 4. Add the date validation, the status determination, and the Accept/Reject actions with dynamic feature control.
> 5. Write a console class that creates a trip with EML (`MODIFY ENTITIES` + `COMMIT ENTITIES`) and prints the outcome by reading `failed`/`reported`.
> 6. Complete the final project "Leave request management".

## Quiz

1. What is the Clean Core?
2. What are the four pillars of ABAP Cloud?
3. What are tiers 1, 2, and 3?
4. Which objects make up a RAP app, from the database to the UI?
5. What is the difference between managed and unmanaged?
6. What is the difference between a validation and a determination?
7. What are `failed` and `reported` for?
8. Why don't you write `COMMIT WORK` in the behavior pool?

## Solutions

```abap
CLASS zcl_create_trip DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_create_trip IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    MODIFY ENTITIES OF zr_trip
      ENTITY Trip
        CREATE FIELDS ( CustomerId BeginDate EndDate Price Currency Description )
        WITH VALUE #( ( %cid = 'T1' CustomerId = '000001'
                        BeginDate = '20261201' EndDate = '20261210'
                        Price = 1500 Currency = 'EUR' Description = 'Test trip' ) )
      MAPPED DATA(ls_mapped)
      FAILED DATA(ls_failed)
      REPORTED DATA(ls_reported).

    IF ls_failed IS NOT INITIAL.
      out->write( 'Creation failed' ).
      RETURN.
    ENDIF.

    COMMIT ENTITIES RESPONSE OF zr_trip
      FAILED DATA(ls_commit_failed)
      REPORTED DATA(ls_commit_reported).

    IF ls_commit_failed IS INITIAL.
      out->write( 'Trip created and saved' ).
    ELSE.
      LOOP AT ls_commit_reported-trip INTO DATA(ls_rep).
        out->write( ls_rep-%msg->if_message~get_text( ) ).
      ENDLOOP.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

Quiz:

1. The strategy of keeping the SAP core unmodified and extending it only through stable, released interfaces, so upgrades don't break custom code.
2. ABAP language for the cloud, released APIs only, Eclipse ADT, RAP.
3. Tier 1: ABAP Cloud development; tier 2: wrappers that release classic objects for tier 1; tier 3: existing classic ABAP.
4. Table → root CDS view (and children) → behavior definition + behavior pool → CDS projection + projection BDEF + metadata extension → service definition → service binding → Fiori Elements app.
5. Managed: the framework handles standard operations and saving; unmanaged: you implement them (for example by reusing existing BAPIs).
6. A validation checks and can block the save; a determination calculates or sets values automatically.
7. `failed` marks the instances for which the operation failed; `reported` holds the messages to show.
8. Because the RAP framework manages the transaction: it runs the save sequence and the commit at the right moment.

> [!NOTE]
> Congratulations: you've completed the ABAP intensive course! In 15 days you went from your first `WRITE` all the way to RAP and ABAP Cloud: the SAP system, syntax, types, internal tables, the ABAP Dictionary, SQL, modularization, reports, ALV, Dynpro, objects, exceptions, modern ABAP, tests, enhancements, interfaces, print forms, CDS, HANA, and RAP. Now it's time to drive: good luck!
