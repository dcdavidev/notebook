---
title: Smart Forms and Adobe forms
description: Print invoices, labels, and other documents.
level: pro
---

Sooner or later every SAP project has to print something: an invoice, a delivery note, a shipping label, a boarding pass. SAP has three form technologies for this. This lesson shows what each one is, how a **print program** calls a form, and how to get a PDF back instead of a printout.

The layout work happens in graphical editors, so this lesson focuses on the ABAP side: the form interface and the calls that fill it.

## Three form technologies

| Technology                                   | Editor       | Output                        | Status                                                    |
| -------------------------------------------- | ------------ | ----------------------------- | --------------------------------------------------------- |
| SAPscript                                    | `SE71`       | OTF, spool                    | obsolete; still behind many standard forms                |
| Smart Forms                                  | `SMARTFORMS` | OTF, spool, PDF by conversion | still widely used in ECC and S/4HANA                      |
| Adobe forms (SAP Interactive Forms by Adobe) | `SFP`        | PDF                           | the strategic choice; needs Adobe Document Services (ADS) |

All three follow the same idea: the form defines the **layout**, and a print program reads the data and passes it to the form. The form never selects data from the database on its own (it can, but you shouldn't).

> [!TIP]
> A form is like a printed template at a print shop: you bring the text and the numbers, the shop puts them in the right boxes. The print program is you, gathering the content before you walk in.

In S/4HANA, standard documents such as billing documents use **output management** with Adobe forms and BRF+ rules to decide which form goes to whom. In ABAP Cloud you use the Adobe forms service through released APIs. Both build on the same Adobe concepts you see below.

## Smart Forms

In transaction `SMARTFORMS` you create a form, for example `ZSF_FLIGHT_LIST`. Its main parts are:

- **Form interface**: the import parameters, for example `IS_CARRIER` (a structure of type `SCARR`) and `IT_FLIGHTS` (a table type of `SFLIGHT` rows).
- **Global definitions**: variables, types, and initialization code used inside the form.
- **Pages and windows**: a **main window** that flows across pages (the item list) and **secondary windows** with a fixed position (logo, address, footer).
- **Nodes**: texts, graphics, addresses, and **table** nodes that loop over an internal table.

When you activate the form, the system generates a function module with a technical name such as `/1BCDWB/SF00000042`. The name differs from system to system, so you never hard-code it: ask `SSF_FUNCTION_MODULE_NAME` for it.

```abap
DATA lv_fm_name TYPE rs38l_fnam.
DATA ls_control TYPE ssfctrlop.     " control parameters
DATA ls_options TYPE ssfcompop.     " output options

SELECT SINGLE * FROM scarr WHERE carrid = 'LH' INTO @DATA(ls_carrier).
SELECT * FROM sflight WHERE carrid = 'LH' INTO TABLE @DATA(lt_flights).

CALL FUNCTION 'SSF_FUNCTION_MODULE_NAME'
  EXPORTING
    formname           = 'ZSF_FLIGHT_LIST'
  IMPORTING
    fm_name            = lv_fm_name
  EXCEPTIONS
    no_form            = 1
    no_function_module = 2
    OTHERS             = 3.
IF sy-subrc <> 0.
  MESSAGE 'Form ZSF_FLIGHT_LIST not found' TYPE 'E'.
ENDIF.

ls_control-no_dialog = abap_true.   " no print dialog
ls_control-preview   = abap_true.   " show the print preview
ls_options-tddest    = 'LP01'.      " output device

CALL FUNCTION lv_fm_name
  EXPORTING
    control_parameters = ls_control
    output_options     = ls_options
    user_settings      = space
    is_carrier         = ls_carrier  " form interface
    it_flights         = lt_flights  " form interface
  EXCEPTIONS
    formatting_error   = 1
    internal_error     = 2
    send_error         = 3
    user_canceled      = 4
    OTHERS             = 5.
```

To get a PDF instead of a printout, set `ls_control-getotf = abap_true`, read the `job_output_info` parameter (type `SSFCRESCL`), and convert its `otfdata` table with the function module `CONVERT_OTF` and format `'PDF'`. That's the usual way to attach a Smart Form to an [email](./0119-sending-email.md).

## Adobe forms

In transaction `SFP` you create two objects:

1. An **interface** with the import parameters, like the Smart Forms interface. Choose the ABAP Dictionary-based type.
2. A **form** that uses the interface. Its **context** decides which interface data reaches the layout, and its **layout** is designed in Adobe LiveCycle Designer, launched from `SFP`.

The PDF itself is rendered by **Adobe Document Services (ADS)**, a separate component that your Basis team must configure. Without ADS, the call fails at runtime.

The print program always follows the same four steps: open a print job, get the generated function module name, call it, close the job.

```abap
DATA ls_outparams  TYPE sfpoutputparams.
DATA ls_docparams  TYPE sfpdocparams.
DATA ls_formoutput TYPE fpformoutput.
DATA lv_fm_name    TYPE funcname.

ls_outparams-nodialog = abap_true.
ls_outparams-getpdf   = abap_true.   " return the PDF instead of printing

CALL FUNCTION 'FP_JOB_OPEN'
  CHANGING
    ie_outputparams = ls_outparams
  EXCEPTIONS
    cancel          = 1
    usage_error     = 2
    system_error    = 3
    internal_error  = 4
    OTHERS          = 5.

TRY.
    CALL FUNCTION 'FP_FUNCTION_MODULE_NAME'
      EXPORTING
        i_name     = 'ZAF_FLIGHT_LIST'
      IMPORTING
        e_funcname = lv_fm_name.
  CATCH cx_fp_api_repository cx_fp_api_usage cx_fp_api_internal INTO DATA(lx_fp).
    MESSAGE lx_fp->get_text( ) TYPE 'E'.
ENDTRY.

ls_docparams-langu = sy-langu.

CALL FUNCTION lv_fm_name
  EXPORTING
    /1bcdwb/docparams  = ls_docparams
    is_carrier         = ls_carrier
    it_flights         = lt_flights
  IMPORTING
    /1bcdwb/formoutput = ls_formoutput
  EXCEPTIONS
    usage_error        = 1
    system_error       = 2
    internal_error     = 3
    OTHERS             = 4.

CALL FUNCTION 'FP_JOB_CLOSE'
  EXCEPTIONS
    usage_error    = 1
    system_error   = 2
    internal_error = 3
    OTHERS         = 4.

" ls_formoutput-pdf is an xstring with the PDF document
```

With `getpdf` off and `ls_outparams-dest` set to a printer, the same code sends the document to the spool instead.

> [!WARNING]
> Keep data selection in the print program, not in the form. Code hidden in form nodes is hard to find, hard to test, and runs again every time the form is rendered.

## Exercise

> [!IMPORTANT]
>
> 1. In `SMARTFORMS`, create `ZSF_FLIGHT_LIST` with an interface `IS_CARRIER` and `IT_FLIGHTS`, a secondary window with the airline name, and a table node with date, price, and currency of each flight.
> 2. Write a report that reads airline `LH` and its flights and shows the form in print preview.
> 3. Change the report so it gets the OTF data back instead. Which field of `SSFCTRLOP` do you set?

### Solution

Use the Smart Forms print program above. For step 3, set `ls_control-getotf = abap_true`, add `IMPORTING job_output_info = ls_job_info` (type `SSFCRESCL`) to the call, and pass `ls_job_info-otfdata` to `CONVERT_OTF` with `format = 'PDF'`.

> [!NOTE]
>
> - SAPscript (`SE71`) is obsolete, Smart Forms (`SMARTFORMS`) is still common, Adobe forms (`SFP`) are the strategic choice.
> - A print program selects the data and passes it to the form through the form interface.
> - Never hard-code the generated function module: use `SSF_FUNCTION_MODULE_NAME` or `FP_FUNCTION_MODULE_NAME`.
> - Adobe forms need `FP_JOB_OPEN` and `FP_JOB_CLOSE` around the call, and Adobe Document Services to render the PDF.
> - Set `getotf` (Smart Forms) or `getpdf` (Adobe forms) to get the document back instead of printing it.
