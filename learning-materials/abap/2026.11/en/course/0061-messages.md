---
title: Messages
description: Message classes, message types, and the MESSAGE statement.
level: basic
---

Programs talk to users with **messages**: "Airline LH not found", "Booking saved", "Enter a date in the future". In SAP, these texts don't live in the code. They're stored in a **message class**, with a number, and translated like every other text.

The `MESSAGE` statement shows a message. Its **message type** decides what the user sees and what happens to the program next.

## Message classes

A message class is a container of up to 1,000 messages, numbered from `000` to `999`. Create it in `SE91` or in ADT (**New > Other ABAP Repository Object > Message Class**). A custom class starts with `Z` or `Y`, for example `ZFLIGHT`:

```text
Message class ZFLIGHT
  000  &1 &2 &3 &4
  001  Airline &1 not found
  002  Booking &1 saved
  003  Flight &1 &2 on &3 is fully booked
  004  Enter a date in the future
```

The placeholders `&1` to `&4` are filled at runtime. A single `&` also works, filled in order, but numbered placeholders let translators change the word order. Each message can also have a **long text** with more explanation, which the user opens by clicking the message.

> [!TIP]
> A message class is like the phrase book of a tour guide. Instead of improvising each time, the guide points to phrase number 1, "the museum is closed on &1", and fills in the day. A translated phrase book works for tourists of every language.

## The MESSAGE statement

There are several ways to write it:

```abap
REPORT zmessage_demo MESSAGE-ID zflight.     " default class for this program

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  " 1. Short form: type, number, and class in one token
  MESSAGE i001(zflight) WITH p_carr.

  " 2. Without the class: the one in REPORT ... MESSAGE-ID is used
  MESSAGE s002 WITH '4711'.

  " 3. Fully dynamic: ID, type, and number can be variables
  MESSAGE ID 'ZFLIGHT' TYPE 'I' NUMBER '001' WITH p_carr.

  " 4. A text without a message class (only for quick tests)
  MESSAGE 'Quick test message' TYPE 'I'.
```

`WITH` passes up to four values for `&1` to `&4`. Prefer messages from a class over text literals: they can be translated, have a long text, and you can find every place where they're used with the where-used list.

## Message types

| Type | Name        | What usually happens                                                                                         |
| ---- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `S`  | success     | shown in the status bar of the next screen; the program continues                                            |
| `I`  | information | shown in a dialog box; the program continues after the user confirms                                         |
| `W`  | warning     | shown in the status bar; on an input check the user can confirm and go on                                    |
| `E`  | error       | shown in the status bar; on an input check the screen stays ready for correction, elsewhere processing stops |
| `A`  | abort       | shown in a dialog box; the program ends and the user returns to the menu                                     |
| `X`  | exit        | the program ends with the runtime error `MESSAGE_TYPE_X`                                                     |

The exact behavior of `W` and `E` depends on where the message is sent: in an input check of a selection screen (see [Report events](./0066-report-events.md)), in a dialog screen, in a list, in a background job. In a background job, every message goes to the job log, and an `E` or `A` message ends the job.

> [!WARNING]
> An `E` message in `START-OF-SELECTION` ends the report: the user doesn't get back to the selection screen to correct the input. To show an error and return to the selection screen, send a success message that looks like an error, then leave list processing.

```abap
IF lt_flights IS INITIAL.
  MESSAGE s001(zflight) WITH p_carr DISPLAY LIKE 'E'.
  LEAVE LIST-PROCESSING.
ENDIF.
```

`DISPLAY LIKE` changes only the icon and the color, not the behavior of the type.

## Messages into a variable

With `INTO`, the message isn't shown: its text goes into a variable, and the system fields are filled. That's how you build logs and return messages:

```abap
DATA lv_text TYPE string.

MESSAGE e001(zflight) WITH p_carr INTO lv_text.

WRITE: / lv_text.                                  " Airline LH not found
WRITE: / sy-msgid, sy-msgty, sy-msgno, sy-msgv1.   " ZFLIGHT E 001 LH
```

The fields `sy-msgid`, `sy-msgty`, `sy-msgno`, and `sy-msgv1` to `sy-msgv4` describe the last message. Many function modules fill them when they raise an exception, so you can repeat the message to the user with `MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4`.

To collect many messages and show them together, use the [application log](./0112-application-log.md). In classes, errors are reported with [class-based exceptions](./0089-class-based-exceptions.md), which can carry a message from a message class.

## Exercise

> [!IMPORTANT]
>
> 1. Create the message class `ZFLIGHT` with messages `001` and `002` as shown.
> 2. Write a report with an airline parameter that reads `SCARR`. If the airline doesn't exist, show message `001` as an error and return to the selection screen. Otherwise show a success message with the airline's name: add message `005`, `Airline &1 (&2) found`, to the class.

### Solution

```abap
REPORT zmessage_exercise MESSAGE-ID zflight.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT SINGLE carrname
    FROM scarr
    WHERE carrid = @p_carr
    INTO @DATA(lv_name).

  IF sy-subrc <> 0.
    MESSAGE s001 WITH p_carr DISPLAY LIKE 'E'.
    LEAVE LIST-PROCESSING.
  ENDIF.

  MESSAGE s005 WITH p_carr lv_name.
  WRITE: / p_carr, lv_name.
```

> [!NOTE]
>
> - Message texts live in a message class (`SE91`), numbered `000` to `999`, with placeholders `&1` to `&4`.
> - `MESSAGE e001(zflight) WITH ...` shows a message; `REPORT ... MESSAGE-ID` sets the default class.
> - The type (`S`, `I`, `W`, `E`, `A`, `X`) decides what happens next, and the effect depends on the context.
> - `DISPLAY LIKE` changes only the look; `INTO` puts the text into a variable without showing it.
> - `sy-msgid`, `sy-msgty`, `sy-msgno`, and `sy-msgv1` to `sy-msgv4` describe the last message.
