---
title: Enhancements, interfaces, forms, and system techniques
description: Extend the SAP standard, exchange data with other systems, and produce documents.
---

_Week 3 · Advanced level · 4 hours_

### Today's schedule

| Block  | Content                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Hour 1 | Extending SAP: modifications, user exits, customer exits, BTEs, appends, classic and new BAdIs, implicit/explicit enhancements |
| Hour 2 | Interfaces: RFC/BAPI, IDoc and ALE, batch input (BDC), SOAP and REST web services, OData with SEGW                             |
| Hour 3 | Print forms: SAPscript, SmartForms, Adobe Forms; email with `CL_BCS`                                                           |
| Hour 4 | Locks (`ENQUEUE`), update task, number ranges, parallel processing, long texts, change documents                               |

## Hour 1 – Extending the SAP standard

Companies almost always need to adapt SAP: an extra check when an order is saved, an additional field, a different calculation. **You don't change SAP's code** (it would be overwritten by upgrades): you use the **extension points** SAP provides.

> [!TIP]
> SAP is like a furnished rental apartment. You can't knock down walls (change the standard), but the landlord has provided hooks and sockets (extension points) where you can hang your own pictures and plug in your own appliances. When the landlord renovates the apartment (an upgrade), your pictures stay where they are.

### The ladder of techniques (from oldest to most modern)

| Technique                                                              | How it works                                                                      | Where you find it                        |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------- |
| Modification                                                           | you change SAP code with an access key (SSCR)                                     | Modification Assistant; to avoid         |
| User exit                                                              | empty `FORM`s `USEREXIT_...` in SAP includes you may change (mostly SD)           | for example `MV45AFZZ` for sales orders  |
| Customer exit                                                          | FMs `EXIT_<prog>_<nnn>` that call an include `ZX...`; activated through a project | SMOD (explore), CMOD (project)           |
| Business Transaction Event (BTE)                                       | FMs called at specific points in FI                                               | FIBF                                     |
| Append structure / Customizing include                                 | additional fields in standard tables and structures                               | SE11                                     |
| Classic BAdI                                                           | interface + implementing class                                                    | SE18 (definition), SE19 (implementation) |
| Enhancement Framework: new BAdI (kernel BAdI)                          | like the classic one but faster, integrated                                       | SE18/SE19, `GET BADI` / `CALL BADI`      |
| Explicit enhancement point/section                                     | points SAP placed in the code where you can insert code                           | SE80/ADT: Enhance                        |
| Implicit enhancement                                                   | at the start and end of every `FORM`, FM, method, include, structure              | SE80/ADT                                 |
| Key user extensibility / Developer extensibility (S/4HANA, ABAP Cloud) | custom fields and logic through Fiori apps or released BAdIs                      | "Custom Fields", "Custom Logic" apps     |

### Customer exit: an example

1. **SMOD**: find the enhancement (for example `V45A0002` for orders, or filter by the transaction's package).
2. **CMOD**: create a project `ZPROJECT` and assign the enhancement.
3. Double-click the component (for example `EXIT_SAPMV45A_002`): inside there's `INCLUDE ZXVVAU...`. Double-click and create the include.
4. Write the code using the FM's parameters.
5. **Activate the project** (without activation, the code doesn't run).

### BAdIs: the modern standard way

A **BAdI** (_Business Add-In_) is an object-oriented extension point: SAP defines an interface and calls its methods at a certain point in the program; you create an implementing class. It's day 10's polymorphism applied to extensions.

How to find the right BAdI:

- In SE18, search by the transaction's name/package.
- Set a breakpoint in the `GET_INSTANCE` method of class `CL_EXITHANDLER` (classic BAdIs) or on the `GET BADI` / `CALL BADI` statement (new ones), then run the transaction.
- Search documentation sites and SAP Notes.

Implementing a new BAdI:

1. SE19 → "Create Implementation" → Enhancement Spot (for example `BADI_SD_SALES`) → enhancement implementation name `ZEI_ORDERS`.
2. Create the BAdI implementation (`ZBI_ORDERS`) and the class (`ZCL_BI_ORDERS`).
3. Implement the interface methods.
4. If the BAdI has a filter (for example country, company code), set the values for which the implementation must fire.
5. Activate.

```abap
" The BAdI in SAP code (caller side)
DATA lo_badi TYPE REF TO zbadi_price_check.
GET BADI lo_badi FILTERS land1 = ls_customer-land1.
CALL BADI lo_badi->check EXPORTING is_order    = ls_order
                         CHANGING  ct_messages = lt_msg.

" Your implementation
CLASS zcl_bi_price_check IMPLEMENTATION.
  METHOD zif_badi_price_check~check.
    IF is_order-netwr > 100000.
      APPEND VALUE #( type = 'W' message = 'Order above 100,000: please check' ) TO ct_messages.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

You can also define your own BAdIs to make your programs extensible (Enhancement Spot + BAdI definition + interface). A BAdI can be single-use or multiple-use (several active implementations), and it can have a fallback implementation.

### Implicit and explicit enhancements

In SE80 or ADT, open a standard object and choose **Enhance** (spiral icon, Shift+F4). The hook points appear:

```abap
ENHANCEMENT 1 ZEI_MY_CHECK.    "active version
  IF vbak-auart = 'ZOR' AND vbak-kunnr IS INITIAL.
    MESSAGE e010(zcourse).
  ENDIF.
ENDENHANCEMENT.
```

> [!WARNING]
> Implicit enhancements are very powerful but fragile: they depend on internal variables of the SAP program that can change with an upgrade. Always prefer, in this order: **BAdI → explicit enhancement → customer/user exit → implicit → modification**.

### Add fields to standard tables

- **Append structure**: in SE11 open the standard table (for example `VBAK`) → Append Structure → create `ZAVBAK` with fields starting with `ZZ` (for example `ZZPROJECT`). The field is added to the table without modifying it.
- **Customizing include** (`CI_...`): includes SAP provides in certain structures, for you to fill with your own fields.

## Hour 2 – Interfaces with other systems

| Technology         | Type                                    | Typical use                                                                                  |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| RFC / BAPI         | synchronous (or tRFC/qRFC asynchronous) | SAP ↔ SAP, SAP ↔ systems with connectors (Java, .NET, Python)                                |
| IDoc / ALE         | asynchronous, structured documents      | exchanging documents (orders, invoices, master data) with partners or other SAP systems; EDI |
| Batch input (BDC)  | simulates the user on the screens       | migrations and loads where no BAPI exists                                                    |
| Files (CSV, XML)   | asynchronous                            | simple exchanges, legacy systems                                                             |
| SOAP web service   | synchronous                             | enterprise integrations, SAP PI/PO                                                           |
| REST / HTTP / JSON | synchronous                             | modern APIs, cloud systems                                                                   |
| OData              | standardized REST                       | Fiori apps, modern integrations                                                              |

### IDoc and ALE

An **IDoc** (_Intermediate Document_) is an electronic document structured in segments (header, items...), with a unique number and a status.

> [!TIP]
> An IDoc is like a standard parcel: it has the sender and recipient label (control record), the content packed into numbered boxes (segments), and the tracking code with the shipment status (status records).

Concepts and transactions:

| Concept                                                          | Transaction                       |
| ---------------------------------------------------------------- | --------------------------------- |
| IDoc basic type (structure, for example `ORDERS05`) and segments | WE30 / WE31                       |
| Extension of an IDoc type (Z segments)                           | WE30                              |
| Message type (for example `ORDERS`)                              | WE81 / WE82                       |
| Ports (file, tRFC, XML)                                          | WE21                              |
| Partner profiles (who receives what, and how)                    | WE20                              |
| IDoc monitor                                                     | WE02 / WE05 / BD87 (reprocessing) |
| ALE distribution model                                           | BD64                              |
| Process codes (which FM processes an inbound IDoc)               | WE42                              |

Important statuses: outbound **03** (passed to the port), 12, 02/29 (errors); inbound **64** (ready), **53** (processed successfully), **51** (application error).

For an outbound IDoc from a program, you use the FM `MASTER_IDOC_DISTRIBUTE`; for inbound, you write an FM with the standard interface (template `IDOC_INPUT_ORDERS`) and register it with a process code.

### Batch input (BDC)

**Batch input** simulates a user filling in the screens of a transaction. You record a session with **SHDB** (the transaction recorder), which also generates a sample program.

```abap
DATA lt_bdc TYPE STANDARD TABLE OF bdcdata WITH EMPTY KEY.
DATA lt_msg TYPE STANDARD TABLE OF bdcmsgcoll WITH EMPTY KEY.

lt_bdc = VALUE #(
  ( program = 'SAPMF02D' dynpro = '0101' dynbegin = 'X' )
  ( fnam = 'RF02D-KUNNR' fval = '0000001000' )
  ( fnam = 'BDC_OKCODE'  fval = '/00' )
  " ... other screens and fields recorded with SHDB
).

CALL TRANSACTION 'XD02' WITH AUTHORITY-CHECK USING lt_bdc
     OPTIONS FROM VALUE ctu_params( dismode = 'N' updmode = 'S' )   " N = no screens, A = all screens, E = errors only
     MESSAGES INTO lt_msg.
```

Alternatively, you create a session (FMs `BDC_OPEN_GROUP`, `BDC_INSERT`, `BDC_CLOSE_GROUP`) that is then processed in SM35. Batch input is fragile (it depends on the screen layout) and doesn't work with modern controls: use it only if there's no BAPI or API. In S/4HANA, migrations use the **Migration Cockpit** (LTMC/Fiori app); the old LSMW is still available in ECC.

### Web services and REST

**Provide a SOAP service**: from an RFC-enabled FM or a class, you generate a web service (Enterprise Service, SE80 → Service Provider), configured in **SOAMANAGER**.

**Consume a SOAP service**: you generate a client proxy from a WSDL (SE80/ADT → Service Consumer), then configure the logical port in SOAMANAGER.

**Call a REST API** (class `cl_http_client`, or in ABAP Cloud `cl_web_http_client_manager`):

```abap
cl_http_client=>create_by_destination(
  EXPORTING destination = 'Z_WEATHER_API'        " HTTP destination in SM59 (type G)
  IMPORTING client      = DATA(lo_http) ).

lo_http->request->set_method( 'GET' ).
cl_http_utility=>set_request_uri( request = lo_http->request
                                  uri     = '/v1/forecast?city=Rome' ).
lo_http->send( ).
lo_http->receive( ).
lo_http->response->get_status( IMPORTING code = DATA(lv_code) ).
DATA(lv_json) = lo_http->response->get_cdata( ).
lo_http->close( ).

" Convert JSON ↔ ABAP
TYPES: BEGIN OF ty_weather, city TYPE string, temperature TYPE decfloat34, END OF ty_weather.
DATA ls_weather TYPE ty_weather.
/ui2/cl_json=>deserialize( EXPORTING json        = lv_json
                                     pretty_name = /ui2/cl_json=>pretty_mode-camel_case
                           CHANGING  data        = ls_weather ).
DATA(lv_out) = /ui2/cl_json=>serialize( data = ls_weather ).
```

Alternatives for JSON/XML: `CALL TRANSFORMATION id SOURCE ... RESULT XML ...` (for JSON too, with the writer `cl_sxml_string_writer=>create( type = if_sxml=>co_xt_json )`), XSLT and Simple Transformations (STRANS), and in ABAP Cloud the class `xco_cp_json`.

**Provide a REST/HTTP service**: a class that implements `IF_HTTP_EXTENSION` (method `handle_request`), registered in **SICF**.

### OData with SEGW (Gateway)

**OData** is a standard REST protocol (entities, collections, filters `$filter`, `$top`, `$expand`), used by every Fiori app. In the classic model (SAP Gateway):

1. **SEGW**: create a project, define the entities (for example Flight) by importing them from a DDIC structure, and the entity sets.
2. Generate the classes: **MPC** (_Model Provider_, the model) and **DPC** (_Data Provider_). Your code goes in the extension classes `..._MPC_EXT` and `..._DPC_EXT`.
3. Redefine the methods `<entityset>_GET_ENTITYSET` (list), `_GET_ENTITY` (detail), `_CREATE_ENTITY`, `_UPDATE_ENTITY`, `_DELETE_ENTITY`.
4. Register the service in `/IWFND/MAINT_SERVICE` and test it with `/IWFND/GW_CLIENT`.

```abap
METHOD flightset_get_entityset.
  SELECT carrid, connid, cityfrom, cityto FROM spfli
    INTO CORRESPONDING FIELDS OF TABLE @et_entityset.
ENDMETHOD.
```

Today, for new services, SAP recommends **RAP** (day 15), which generates OData automatically from CDS. SEGW is still extremely common in existing systems.

## Hour 3 – Print forms and email

| Technology                               | Characteristics                                                 | Transaction |
| ---------------------------------------- | --------------------------------------------------------------- | ----------- |
| SAPscript                                | the oldest, windows and paragraphs, separate print program      | SE71        |
| SmartForms                               | graphical, generates an FM, still widely used                   | SMARTFORMS  |
| Adobe Forms (Interactive Forms by Adobe) | PDF, layout with Adobe LiveCycle Designer, requires ADS         | SFP         |
| S/4HANA output management                | Adobe Forms with templates managed in Fiori, BRF+ for the rules | Fiori apps  |

> [!TIP]
> The form is the mold; the print program is the one pouring the batter (the data). The same mold (the invoice form) produces thousands of different invoices.

### SmartForms: the steps

1. **SMARTFORMS** → create `ZSF_ORDER`.
2. **Form interface**: import parameters (for example the order header) and tables (items).
3. **Global definitions**: variables, types, initialization.
4. **Pages and windows**: main window (`MAIN`, flows over several pages) and secondary windows (logo, address, footer).
5. **Nodes**: texts, graphics (logo uploaded with SE78), tables, loops, conditions.
6. **Styles** (SMARTSTYLES): fonts, paragraphs.
7. **Activate**: SAP generates a function module with a technical name that changes between systems. That's why the print program gets the name at runtime:

```abap
DATA lv_fm TYPE rs38l_fnam.
CALL FUNCTION 'SSF_FUNCTION_MODULE_NAME'
  EXPORTING formname = 'ZSF_ORDER'
  IMPORTING fm_name  = lv_fm.

CALL FUNCTION lv_fm
  EXPORTING
    control_parameters = VALUE ssfctrlop( no_dialog = abap_true preview = abap_true )
    output_options     = VALUE ssfcompop( tddest = 'LP01' )
    is_header          = ls_header
  TABLES
    it_items           = lt_items
  EXCEPTIONS
    OTHERS             = 1.
```

### Adobe Forms: the steps

1. **SFP**: create the interface (parameters, as with SmartForms) and the form (context: which data goes to the layout).
2. Design the layout with Adobe LiveCycle Designer (integrated in SFP).
3. In the program: `FP_FUNCTION_MODULE_NAME` for the FM name, `FP_JOB_OPEN`, the FM call, `FP_JOB_CLOSE`. With `getpdf = abap_true` in the parameters, you get the PDF as an `xstring` (to save or send by email).

### Send email with CL_BCS

```abap
TRY.
    DATA(lo_send) = cl_bcs=>create_persistent( ).
    DATA(lt_text) = VALUE soli_tab( ( line = 'Good morning,' )
                                    ( line = 'please find the flight report attached.' ) ).
    DATA(lo_doc) = cl_document_bcs=>create_document(
                     i_type = 'RAW' i_text = lt_text i_subject = 'Flight report' ).

    " PDF attachment (lv_pdf = xstring)
    lo_doc->add_attachment( i_attachment_type    = 'PDF'
                            i_attachment_subject = 'flights.pdf'
                            i_att_content_hex    = cl_bcs_convert=>xstring_to_solix( lv_pdf ) ).

    lo_send->set_document( lo_doc ).
    lo_send->add_recipient( cl_cam_address_bcs=>create_internet_address( 'user@example.com' ) ).
    lo_send->set_send_immediately( abap_true ).
    lo_send->send( ).
    COMMIT WORK.                       " without COMMIT the email doesn't leave!
  CATCH cx_bcs INTO DATA(lx_bcs).
    MESSAGE lx_bcs->get_text( ) TYPE 'I'.
ENDTRY.
```

You check the send queue in **SOST**. Recent releases also offer `cl_bcs_mail_message` (simpler).

## Hour 4 – System techniques

### Logical locks (ENQUEUE / DEQUEUE)

Remember the lock objects from day 4? Here's how you use them. Before changing a record, you lock it; if another user has already locked it, you get an error.

```abap
CALL FUNCTION 'ENQUEUE_EZORDERS_COURSE'     " generated from the lock object EZORDERS_COURSE
  EXPORTING
    mode_zorders_course = 'E'               " E = exclusive (write), S = shared (read)
    mandt               = sy-mandt
    order_no            = lv_order_no
  EXCEPTIONS
    foreign_lock        = 1                 " locked by another user (sy-msgv1 = user)
    system_failure      = 2
    OTHERS              = 3.
IF sy-subrc <> 0.
  MESSAGE |Order locked by { sy-msgv1 }| TYPE 'E'.
ENDIF.

" ... read, change, save ...

CALL FUNCTION 'DEQUEUE_EZORDERS_COURSE'
  EXPORTING mode_zorders_course = 'E' mandt = sy-mandt order_no = lv_order_no.
```

> [!TIP]
> A lock is like the "occupied" sign on a bathroom door: it doesn't physically lock the database (it's a logical lock), but every well-behaved program reads it and waits.

Locks are released automatically at the end of the program or, with `_scope = '2'`, at the end of the update task. You see them in **SM12**.

### Update task

Update function modules (attribute "Update module") don't run right away: they're registered and then all run together at `COMMIT WORK` by a dedicated process (V1 = urgent, V2 = statistics). That way, a transaction with several screens writes everything in one LUW.

```abap
CALL FUNCTION 'Z_SAVE_ORDER' IN UPDATE TASK
  EXPORTING is_order = ls_order.
" ... other registrations ...
COMMIT WORK.       " now they all run
```

Update errors show up in **SM13**. Inside an update FM, you don't do `COMMIT`s, popups, or dialog messages.

### Number ranges

To generate unique sequential numbers (for example an order number), you use a **number range object** (transaction **SNRO**) and the FM `NUMBER_GET_NEXT` (in ABAP Cloud: `cl_numberrange_runtime=>number_get`).

```abap
CALL FUNCTION 'NUMBER_GET_NEXT'
  EXPORTING  nr_range_nr = '01' object = 'ZORDER'
  IMPORTING  number      = lv_number
  EXCEPTIONS OTHERS      = 1.
```

> [!WARNING]
> Never generate numbers with `SELECT MAX( ) + 1`: two users at the same time would get the same number.

### Parallel processing

To process millions of records faster, you split them into blocks processed in parallel by several processes:

- `CALL FUNCTION ... STARTING NEW TASK ... DESTINATION IN GROUP DEFAULT` with a method that receives the results (`CALLING ... ON END OF TASK`, `RECEIVE RESULTS FROM FUNCTION`), and `WAIT FOR ASYNCHRONOUS TASKS UNTIL ...`;
- several background jobs (`SUBMIT VIA JOB`);
- modern frameworks: `cl_abap_parallel`, bgPF (_Background Processing Framework_) in ABAP Cloud.

### Long texts and change documents

- **Long texts** (notes on orders, on materials): FMs `READ_TEXT`, `SAVE_TEXT`, `CREATE_TEXT`; identified by object, ID, name, and language (you find them with the text editor: Goto → Header).
- **Change documents**: record who changed what and when. You define an object in **SCDO**, which generates an FM `<object>_WRITE_DOCUMENT`; the data ends up in tables `CDHDR`/`CDPOS` and is read with `CHANGEDOCUMENT_READ`.

### System tools to know

| Transaction | Use                                                      |
| ----------- | -------------------------------------------------------- |
| SM50 / SM66 | active work processes (local / whole system)             |
| SM21        | system log                                               |
| SM04        | logged-on users                                          |
| ST22        | dumps                                                    |
| SM12 / SM13 | locks / updates                                          |
| SM35        | batch input sessions                                     |
| SM36 / SM37 | jobs                                                     |
| SM59        | RFC/HTTP destinations                                    |
| SOAMANAGER  | web services                                             |
| SICF        | HTTP services                                            |
| SLG1        | application logs                                         |
| SE03 / SE09 | transport tools                                          |
| SNOTE       | apply SAP Notes (corrections)                            |
| SPAU / SPDD | adjust modifications and the dictionary after an upgrade |

## Exercises

> [!IMPORTANT]
>
> 1. Using SE18 or the debugger, find a BAdI called while a sales order (VA01/VA02) or a customer master record is saved. Read the interface documentation.
> 2. Create your own Enhancement Spot with a BAdI `ZBADI_DISCOUNT` (method `calculate` with a `CHANGING amount` parameter), a fallback implementation, and two implementations filtered by country. Call it from a report with `GET BADI` / `CALL BADI`.
> 3. Create an append structure on one of your tables or on a test table with a `ZZ` field, and check that it's there in SE11.
> 4. With SHDB, record a change to a simple piece of data and generate the program. Study the `BDCDATA` table it produces.
> 5. Call a public REST API (if your system has Internet access and an SM59 destination) and deserialize the JSON with `/ui2/cl_json`.
> 6. Create a lock object for `ZORDERS_COURSE` and test the lock by opening the program in two sessions at the same time. Look at SM12.
> 7. Create a simple SmartForm with a logo, an address, and an item table, plus its print program with preview.

## Quiz

1. Why don't you change SAP standard objects?
2. What is the difference between a customer exit and a BAdI?
3. How do you find a BAdI used by a transaction?
4. What is an IDoc, and what are its three parts?
5. When do you use batch input?
6. What does SEGW generate?
7. Why do you use `SSF_FUNCTION_MODULE_NAME`?
8. Why not use `SELECT MAX( ) + 1` for sequential numbers?

## Solutions

1. Because they'd be overwritten or need adjusting at every upgrade, and SAP wouldn't guarantee support; you use extension points instead.
2. A customer exit is an FM with a Z include activated through a CMOD project, with a single implementation; a BAdI is based on interfaces and classes, supports filters and multiple implementations, and is the modern technique.
3. A breakpoint on `GET BADI`/`CALL BADI` (or on `CL_EXITHANDLER=>GET_INSTANCE` for classic ones), or a search in SE18/SE84 by package.
4. A structured electronic document for asynchronous exchange: control record, data segments, status records.
5. When there's no BAPI/API to load the data and you have to simulate input on the screens.
6. The MPC (model) and DPC (data provider) classes of an OData service, with their `_EXT` classes to redefine.
7. Because the name of the generated FM changes from system to system.
8. Because two users at the same time could get the same number; number ranges prevent that.

> [!NOTE]
> Today you learned: all the extension techniques (exits, BTEs, appends, BAdIs, enhancements), interfaces (RFC, BAPI, IDoc/ALE, batch input, SOAP, REST/JSON, OData with SEGW), print forms (SAPscript, SmartForms, Adobe), email, locks, the update task, sequential numbers, parallel processing, and system tools. Tomorrow: SAP HANA and CDS views.
