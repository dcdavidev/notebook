---
title: Validations, determinations, and actions
description: Business logic in the behavior pool.
---

_Pro level_

The managed framework already creates, updates, deletes, and saves travels. What it can't know are your business rules: the end date can't be before the begin date, a new travel starts with status "open", a travel gets the next free number, and an agent can accept a travel with one click. These rules are **validations**, **determinations**, and **actions**. You declare them in the [behavior definition](./0141-rap-behavior-definition.md) and implement them in the **behavior pool**.

## Declaring the logic

Add these lines to the `ZR_Travel` block of the behavior definition, and make `TravelID` read-only, because a determination fills it:

```abap
  field ( readonly ) TravelID, OverallStatus, LastChangedAt, LocalLastChangedAt;

  validation validateDates on save { create; field BeginDate, EndDate; }
  determination setStatusToOpen on modify { create; }
  determination setTravelID on save { create; }
  action acceptTravel result [1] $self;
```

| Element                   | When it runs                                                | What it does                                 |
| ------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Validation                | in the save sequence, when its trigger happened             | checks data; on error, the save is rejected  |
| Determination `on modify` | right after the triggering change, in the interaction phase | computes values the user sees immediately    |
| Determination `on save`   | in the save sequence, before the validations                | computes values that only matter when saving |
| Action                    | when a consumer calls it, for example from a button         | a non-standard operation with its own logic  |

The **trigger** in braces lists the operations (`create`, `update`, `delete`) and the fields (`field BeginDate, EndDate`) that make the validation or determination run.

Put the cursor on each new name and use the quick fix (`Ctrl+1`) to add the method to the behavior pool.

> [!TIP]
> Think of an online form. A determination is the field that fills itself (the city appears when you type the postcode). A validation is the red message when you press **Send** with a wrong date. An action is an extra button, like **Approve**, that does one specific thing.

## The handler class

The behavior pool `ZBP_R_TRAVEL` is an almost empty global class. The code lives in a **local handler class** in its **Local Types** tab, inheriting from `cl_abap_behavior_handler`. Each method declares what it handles with `FOR VALIDATE`, `FOR DETERMINE`, or `FOR MODIFY`:

```abap
CLASS lhc_travel DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS get_instance_authorizations FOR INSTANCE AUTHORIZATION
      IMPORTING keys REQUEST requested_authorizations FOR Travel RESULT result.
    METHODS validateDates FOR VALIDATE ON SAVE
      IMPORTING keys FOR Travel~validateDates.
    METHODS setStatusToOpen FOR DETERMINE ON MODIFY
      IMPORTING keys FOR Travel~setStatusToOpen.
    METHODS setTravelID FOR DETERMINE ON SAVE
      IMPORTING keys FOR Travel~setTravelID.
    METHODS acceptTravel FOR MODIFY
      IMPORTING keys FOR ACTION Travel~acceptTravel RESULT result.
ENDCLASS.
```

Every method gets `keys`, the instances it must handle, and has the implicit changing parameters `failed`, `reported`, and, for actions, `mapped`. The methods read and change the business object only with [EML](./0143-eml.md), always `IN LOCAL MODE`: that skips the authorization and feature checks, which apply to consumers, not to the business object's own logic.

## Validations

```abap
  METHOD validateDates.
    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel
        FIELDS ( BeginDate EndDate ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).

    LOOP AT lt_travels INTO DATA(ls_travel).
      IF ls_travel-EndDate < ls_travel-BeginDate.
        APPEND VALUE #( %tky = ls_travel-%tky ) TO failed-travel.
        APPEND VALUE #( %tky             = ls_travel-%tky
                        %msg             = new_message_with_text(
                                             severity = if_abap_behv_message=>severity-error
                                             text     = 'The end date is before the begin date' )
                        %element-EndDate = if_abap_behv=>mk-on ) TO reported-travel.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.
```

A row in `failed-travel` stops the save. A row in `reported-travel` carries the message, and `%element` tells Fiori which field to highlight. `%tky` is the **transactional key**: the key plus RAP's technical fields, such as the draft indicator. Always pass `%tky`, not only the key fields.

## Determinations

```abap
  METHOD setStatusToOpen.
    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel FIELDS ( OverallStatus ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).
    DELETE lt_travels WHERE OverallStatus IS NOT INITIAL.
    CHECK lt_travels IS NOT INITIAL.

    MODIFY ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel UPDATE FIELDS ( OverallStatus )
      WITH VALUE #( FOR ls_travel IN lt_travels
                    ( %tky = ls_travel-%tky  OverallStatus = 'O' ) ).
  ENDMETHOD.

  METHOD setTravelID.
    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel FIELDS ( TravelID ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).
    DELETE lt_travels WHERE TravelID IS NOT INITIAL.
    CHECK lt_travels IS NOT INITIAL.

    SELECT SINGLE FROM ztravel FIELDS MAX( travel_id ) INTO @DATA(lv_max_id).

    MODIFY ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel UPDATE FIELDS ( TravelID )
      WITH VALUE #( FOR ls_travel IN lt_travels INDEX INTO lv_index
                    ( %tky = ls_travel-%tky  TravelID = lv_max_id + lv_index ) ).
  ENDMETHOD.
```

Determinations must be **idempotent**: running them twice gives the same result. That's why both skip the instances that already have a value.

> [!WARNING]
> `MAX( travel_id ) + 1` is fine for learning, but two users saving at the same moment can get the same number. In a real app, take the number from a [number range](./0111-number-ranges.md).

## Actions

```abap
  METHOD acceptTravel.
    MODIFY ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel UPDATE FIELDS ( OverallStatus )
      WITH VALUE #( FOR ls_key IN keys ( %tky = ls_key-%tky  OverallStatus = 'A' ) ).

    READ ENTITIES OF zr_travel IN LOCAL MODE
      ENTITY Travel ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(lt_travels).

    result = VALUE #( FOR ls_travel IN lt_travels
                      ( %tky = ls_travel-%tky  %param = ls_travel ) ).
  ENDMETHOD.
```

`result [1] $self` in the behavior definition means the action returns the changed travel, so Fiori can refresh the screen. To disable the button for travels already accepted, declare the action with `( features : instance )` and decide in `get_instance_features`.

## Exercise

> [!IMPORTANT]
>
> 1. Add the validation, the two determinations, and the action to the behavior definition, and implement them in `ZBP_R_TRAVEL`.
> 2. Add an action `rejectTravel` that sets the status to `X`.
> 3. Add a validation `validateCustomer` that rejects travels whose customer doesn't exist in `/DMO/I_Customer`.

### Solution

```abap
  action rejectTravel result [1] $self;
  validation validateCustomer on save { create; field CustomerID; }
```

`rejectTravel` is a copy of `acceptTravel` with `OverallStatus = 'X'`. For `validateCustomer`, read `CustomerID` of the instances, select the existing ones from `/dmo/i_customer` with `FOR ALL ENTRIES` or a join on an internal table, and fill `failed-travel` and `reported-travel` with `%element-CustomerID = if_abap_behv=>mk-on` for each missing customer.

> [!NOTE]
>
> - Validations check data in the save sequence; an entry in `failed` stops the save.
> - Determinations compute values `on modify` (visible at once) or `on save`; keep them idempotent.
> - Actions are extra operations, declared with `action name result [1] $self;`.
> - The logic lives in a local handler class inheriting from `cl_abap_behavior_handler`, in the behavior pool.
> - Use EML `IN LOCAL MODE` and `%tky` inside the behavior pool; report messages with `reported` and `%msg`.
