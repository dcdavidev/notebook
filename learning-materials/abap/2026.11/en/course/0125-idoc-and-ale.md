---
title: IDocs and ALE
description: Exchange business documents between systems.
level: pro
---

An **IDoc** (intermediate document) is SAP's standard container for business data that travels between systems: a purchase order sent to a supplier, a material master copied to another SAP system, an invoice received from an EDI provider. **ALE** (Application Link Enabling) is the framework that distributes IDocs between SAP systems, asynchronously and reliably. Many integration platforms (SAP Integration Suite, SAP PI/PO, EDI tools) still speak IDoc, so you'll meet them in almost every project.

## The structure of an IDoc

| Term         | Meaning                                                 | Example                       | Transaction |
| ------------ | ------------------------------------------------------- | ----------------------------- | ----------- |
| message type | the business meaning of the data                        | `ORDERS`, `MATMAS`, `DEBMAS`  | `WE81`      |
| basic type   | the technical structure: which segments, in which order | `ORDERS05`, `MATMAS05`        | `WE30`      |
| extension    | your extra segments added to a basic type               | `ZORDERS05_EXT`               | `WE30`      |
| segment      | one group of fields, like a structure                   | `E1EDK01` (header), `E1MARAM` | `WE31`      |

Every IDoc in the database has three parts:

- one **control record** (`EDIDC`): IDoc number, message type, basic type, sender, receiver, direction, and current status;
- many **data records** (`EDID4`): each one holds a segment name and up to 1000 characters of data in the field `SDATA`;
- many **status records** (`EDIDS`): the history, one row per status change.

> [!TIP]
> An IDoc is a shipping parcel. The control record is the label outside (sender, receiver, what kind of goods). The data records are the items inside, each in its own labeled bag (the segment). The status records are the tracking history: "handed to the courier", "delivered", "refused at the door".

## The ALE configuration

To send IDocs, a few objects must be in place. Basis and functional consultants usually set them up, but you need to know them to test and debug:

1. **Logical systems** (`BD54`, assigned to the client in `SCC4`): the names of the systems, such as `S4DCLNT100`.
2. **RFC destination** (`SM59`) and **port** (`WE21`): how IDocs reach the receiver (a tRFC port for SAP systems, a file or XML HTTP port for others).
3. **Partner profile** (`WE20`): for each partner and message type, the outbound port and basic type, or the inbound **process code** (`WE42`) that says which function module processes the IDoc. It also says whether to send/process immediately or collect.
4. **Distribution model** (`BD64`): which message types go from which sender to which receiver, optionally with filters.

## Status codes and monitoring

| Status | Direction | Meaning                                      |
| ------ | --------- | -------------------------------------------- |
| `30`   | outbound  | IDoc ready for dispatch (waiting to be sent) |
| `03`   | outbound  | data passed to the port: sent                |
| `02`   | outbound  | error passing data to the port               |
| `64`   | inbound   | IDoc ready to be passed to the application   |
| `53`   | inbound   | application document posted                  |
| `51`   | inbound   | application document not posted: error       |

Useful transactions:

- `WE02` / `WE05`: display IDocs, with their segments and status history;
- `BD87`: reprocess IDocs, for example status `51` after fixing master data, or `30` to send them;
- `WE19`: test tool: copy an existing IDoc, change fields, and process it inbound or outbound;
- `WE60`: documentation of basic types and segments.

## Send an IDoc from ABAP

For standard objects, SAP creates IDocs itself (through output determination, change pointers, or programs like `BD10` for materials). For a custom message type, you fill the control record and the data records and call `MASTER_IDOC_DISTRIBUTE`:

```abap
" Z1FLIGHT: custom segment with fields CARRID, CONNID, FLDATE, PRICE (all character)
DATA ls_segment TYPE z1flight.
DATA lt_data    TYPE STANDARD TABLE OF edidd WITH EMPTY KEY.
DATA lt_comm    TYPE STANDARD TABLE OF edidc WITH EMPTY KEY.

SELECT SINGLE carrid, connid, fldate, price FROM sflight
  WHERE carrid = 'LH' AND connid = '0400'
  INTO @DATA(ls_flight).

ls_segment = VALUE #( carrid = ls_flight-carrid
                      connid = ls_flight-connid
                      fldate = ls_flight-fldate
                      price  = |{ ls_flight-price }| ).
APPEND VALUE #( segnam = 'Z1FLIGHT' sdata = ls_segment ) TO lt_data.

DATA(ls_control) = VALUE edidc( mestyp = 'ZFLIGHT'       " message type
                                idoctp = 'ZFLIGHT01'     " basic type
                                rcvprt = 'LS'            " receiver: logical system
                                rcvprn = 'S4QCLNT100' ).

CALL FUNCTION 'MASTER_IDOC_DISTRIBUTE'
  EXPORTING
    master_idoc_control            = ls_control
  TABLES
    communication_idoc_control     = lt_comm
    master_idoc_data               = lt_data
  EXCEPTIONS
    error_in_idoc_control          = 1
    error_writing_idoc_status      = 2
    error_in_idoc_data             = 3
    sending_logical_system_unknown = 4
    OTHERS                         = 5.

IF sy-subrc = 0.
  COMMIT WORK.                       " the IDocs are saved and dispatched only now
  LOOP AT lt_comm INTO DATA(ls_comm).
    WRITE / |IDoc { ls_comm-docnum } created|.
  ENDLOOP.
ENDIF.
```

`lt_comm` returns one control record per receiver in the distribution model: one call can create several IDocs. Segment fields are always character fields, so convert numbers and amounts to text yourself.

> [!WARNING]
> `MASTER_IDOC_DISTRIBUTE` doesn't commit. Without `COMMIT WORK`, no IDoc is saved. Inside a standard process (an exit or a BAdI), don't commit yourself: the IDoc is saved with the standard commit.

## Process an inbound IDoc

Inbound IDocs are processed by a function module with a standard interface, linked to the message type through a process code (`WE42`) and the partner profile. Copy the interface of a standard one such as `IDOC_INPUT_ORDERS`: it receives `IDOC_CONTRL` and `IDOC_DATA`, and returns `IDOC_STATUS` and `WORKFLOW_RESULT`. The core of the logic reads the segments:

```abap
DATA ls_segment TYPE z1flight.

LOOP AT idoc_contrl INTO DATA(ls_control).
  LOOP AT idoc_data INTO DATA(ls_data)
       WHERE docnum = ls_control-docnum AND segnam = 'Z1FLIGHT'.
    ls_segment = ls_data-sdata.             " character data back into the segment
    " ... check and post the data, for example with a BAPI ...
  ENDLOOP.

  APPEND VALUE #( docnum = ls_control-docnum
                  status = '53'              " posted
                  msgty  = 'S'
                  msgid  = 'ZFLIGHT'
                  msgno  = '001'
                  msgv1  = ls_segment-carrid ) TO idoc_status.
ENDLOOP.
```

On errors, append status `51` with the message instead, and set `workflow_result` so that the error workflow starts.

> [!CAUTION]
> Reprocessing an IDoc in `BD87` posts the document again. If an inbound function module posted part of the data before it failed, reprocessing can create duplicates. Make inbound processing all-or-nothing (one LUW, roll back on error), and check for an existing document before you post.

## Exercise

> [!IMPORTANT]
>
> 1. In `WE02`, display the most recent IDocs of your system, and open one with status `51` or `53`.
> 2. Look at its control record, its segments in `WE60`, and its status history.
> 3. In `WE19`, copy the IDoc and run it through inbound processing in the debugger.

### Solution

`WE02` lists the IDocs by direction and status. The control record shows the message type, the basic type, and the partners; each data record shows a segment with its fields; the status records show each step. In `WE19`, **Standard inbound** runs the function module from the partner profile, and **Inbound function module** lets you pick it and start it in debug mode.

> [!NOTE]
>
> - An IDoc has a control record (`EDIDC`), data records with segments (`EDID4`), and status records (`EDIDS`).
> - The message type is the meaning, the basic type the structure; extensions add your own segments.
> - ALE needs logical systems, ports, partner profiles (`WE20`), and a distribution model (`BD64`).
> - Monitor in `WE02` and `WE05`, reprocess in `BD87`, test in `WE19`.
> - Outbound: `MASTER_IDOC_DISTRIBUTE` plus `COMMIT WORK`; inbound: a function module with the standard interface that sets status `53` or `51`.
