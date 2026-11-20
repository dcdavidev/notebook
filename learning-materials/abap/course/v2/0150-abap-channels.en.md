---
title: ABAP channels
description: Push messages with ABAP Messaging Channels and ABAP Push Channels.
---

_Pro level_

Classic ABAP works with requests and responses: a program or a browser asks, the server answers. If something changes on the server, for example a new booking arrives, the client doesn't know until it asks again. **ABAP channels** turn this around and let the server **push** messages as soon as an event happens. There are two kinds:

- **ABAP Messaging Channels** (AMC) send messages between ABAP sessions, also on different application servers of the same system, with a publish and subscribe model.
- **ABAP Push Channels** (APC) open a **WebSocket** connection between the ABAP server and a client such as a browser, so that both sides can send messages at any time.

Used together, an ABAP program publishes on an AMC channel, and an APC forwards each message to every connected browser.

## Messaging channels

You define a messaging channel in transaction `SAMC`:

1. Create an application, for example `ZFLIGHT_AMC`.
2. Add a channel, for example `/bookings`, with the message type **TEXT** (other types are binary and **Push Channel Protocol**, a simple format with header fields and a body).
3. Set the **activity scope**: who receives the messages: every session of the system, only sessions of the same client, or only sessions of the same user.
4. Under **Authorized Programs**, list each program or class that may send or receive on the channel, with the activity **Send** or **Receive**. A program that isn't in the list gets an exception.

A **producer** sends a message to the channel:

```abap
REPORT zamc_send_booking.

PARAMETERS p_text TYPE string LOWER CASE DEFAULT `New booking for LH 0400`.

START-OF-SELECTION.
  TRY.
      DATA(lo_producer) = CAST if_amc_message_producer_text(
        cl_amc_channel_manager=>create_message_producer(
          i_application_id = 'ZFLIGHT_AMC'
          i_channel_id     = '/bookings' ) ).
      lo_producer->send( i_message = p_text ).
      WRITE / 'Message sent'.
    CATCH cx_amc_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).
  ENDTRY.
```

A **consumer** registers a receiver object and waits. The receiver implements an interface that matches the message type, here `if_amc_message_receiver_text`:

```abap
REPORT zamc_receive_booking.

CLASS lcl_receiver DEFINITION.
  PUBLIC SECTION.
    INTERFACES if_amc_message_receiver_text.
    DATA mt_messages TYPE string_table READ-ONLY.
ENDCLASS.

CLASS lcl_receiver IMPLEMENTATION.
  METHOD if_amc_message_receiver_text~receive.
    APPEND i_message TO mt_messages.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_receiver) = NEW lcl_receiver( ).
  TRY.
      cl_amc_channel_manager=>create_message_consumer(
          i_application_id = 'ZFLIGHT_AMC'
          i_channel_id     = '/bookings'
        )->start_message_delivery( i_receiver = lo_receiver ).
    CATCH cx_amc_error INTO DATA(lx_error).
      WRITE / lx_error->get_text( ).
      RETURN.
  ENDTRY.

  " the program sleeps until a message arrives, at most 60 seconds
  WAIT FOR MESSAGING CHANNELS UNTIL lines( lo_receiver->mt_messages ) > 0 UP TO 60 SECONDS.

  LOOP AT lo_receiver->mt_messages INTO DATA(lv_message).
    WRITE / lv_message.
  ENDLOOP.
```

Run the receiver in one session and the sender in another: the receiver wakes up and prints the message. Messages are delivered only to consumers that are listening at that moment; AMC doesn't store them.

> [!WARNING]
> `WAIT FOR MESSAGING CHANNELS` is the only point where the receiver gets messages: the method `receive` is called while the program waits, never in the middle of other code. Always set `UP TO n SECONDS`, or the program can wait forever.

## Push channels

You define a push channel in transaction `SAPC`:

1. Create an application, for example `ZFLIGHT_APC`, with the connection type **WebSocket** and the stateless type.
2. Let `SAPC` generate the class, for example `ZCL_APC_WSP_EXT_ZFLIGHT_APC`, which inherits from `CL_APC_WSP_EXT_STATELESS_BASE`.
3. Activate the service. `SAPC` creates the matching node in `SICF`, so the channel answers at a URL such as `wss://host:port/sap/bc/apc/sap/zflight_apc`.

In the generated class you redefine two methods: `on_start`, called when a client connects, and `on_message`, called when the client sends a message. Here `on_start` binds the connection to the AMC channel, so every message published on `/bookings` goes straight to the browser, and `on_message` answers the client:

```abap
METHOD if_apc_wsp_extension~on_start.
  TRY.
      i_context->get_binding_manager( )->bind_amc_message_consumer(
        i_application_id = 'ZFLIGHT_AMC'
        i_channel_id     = '/bookings' ).
    CATCH cx_apc_error INTO DATA(lx_error).
      DATA(lv_text) = lx_error->get_text( ).
      MESSAGE lv_text TYPE 'E'.
  ENDTRY.
ENDMETHOD.

METHOD if_apc_wsp_extension~on_message.
  TRY.
      DATA(lv_request) = i_message->get_text( ).
      DATA(lo_reply) = i_message_manager->create_message( ).
      lo_reply->set_text( |Received: { lv_request }| ).
      i_message_manager->send( lo_reply ).
    CATCH cx_apc_error INTO DATA(lx_error).
      DATA(lv_text) = lx_error->get_text( ).
      MESSAGE lv_text TYPE 'E'.
  ENDTRY.
ENDMETHOD.
```

For the binding to work, add the APC class to the authorized programs of the channel in `SAMC`, with the activity **Receive via APC**. On the client side, a few lines of JavaScript are enough:

```javascript
const socket = new WebSocket('wss://myhost:44300/sap/bc/apc/sap/zflight_apc');

socket.onopen = () => socket.send('Hello from the browser');
socket.onmessage = (event) => console.log('Server says:', event.data);
```

Now run `ZAMC_SEND_BOOKING`: the message appears in the browser console without a refresh.

> [!TIP]
> AMC is like a radio station: whoever is tuned in at that moment hears the news, and whoever isn't misses it. APC is a phone line between the station and a listener's home, so the news can reach people outside the building too.

## When to use ABAP channels

- Live dashboards and monitors that update as soon as data changes.
- Telling a user that a background job has finished, instead of letting them refresh.
- Collaboration, when several users work on the same object.
- Waking up an ABAP session that waits for another session, instead of polling a database table in a loop.

For messages that must not be lost, or that must reach other systems, use a queue or an event infrastructure instead, such as bgRFC (see [parallel and background processing](./0114-parallel-processing.en.md)) or RAP business events.

## Exercise

> [!IMPORTANT]
>
> 1. Create the AMC application `ZFLIGHT_AMC` with the channel `/bookings` in `SAMC`, and authorize the two reports.
> 2. Run `ZAMC_RECEIVE_BOOKING` in one session and `ZAMC_SEND_BOOKING` in a second one, and check that the text arrives.
> 3. Change the receiver so that it waits for three messages instead of one.

### Solution

Steps 1 and 2 use the code above. For step 3, change only the condition of the wait:

```abap
WAIT FOR MESSAGING CHANNELS UNTIL lines( lo_receiver->mt_messages ) >= 3 UP TO 60 SECONDS.
```

> [!NOTE]
>
> - ABAP channels push messages instead of waiting for the client to ask.
> - AMC (`SAMC`) sends messages between ABAP sessions with producers, consumers, and `WAIT FOR MESSAGING CHANNELS`.
> - APC (`SAPC`) opens a WebSocket to a client; redefine `on_start` and `on_message` in the generated class.
> - Bind an APC connection to an AMC channel to forward ABAP messages to the browser.
> - Every sender and receiver must be authorized in `SAMC`; AMC messages aren't stored.
