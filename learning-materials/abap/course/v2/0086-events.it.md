---
title: Gli eventi
description: EVENTS, RAISE EVENT e SET HANDLER.
---

_Livello intermedio_

Di solito un oggetto che vuole far fare qualcosa chiama un metodo di un altro oggetto, quindi deve conoscerlo. Con gli **eventi** funziona al contrario: un oggetto annuncia che è successo qualcosa, e un numero qualsiasi di altri oggetti può reagire, senza che il primo sappia chi sono. Così le classi restano indipendenti: un volo non ha bisogno di conoscere l'ufficio vendite, il log o il servizio email che vogliono sapere quando si riempie.

Gli eventi passano per tre momenti: la classe **dichiara** l'evento, un oggetto lo **solleva**, e girano i metodi gestori che sono stati **registrati** per quell'evento.

## Dichiarare e sollevare un evento

Dichiari un evento di istanza con `EVENTS` (o uno statico con `CLASS-EVENTS`) nella definizione della classe. Un evento può avere solo parametri `EXPORTING`, passati per valore:

```abap
REPORT zevents.

CLASS lcl_flight DEFINITION.
  PUBLIC SECTION.
    EVENTS seats_low
      EXPORTING VALUE(ev_free) TYPE i.
    EVENTS flight_full.

    METHODS constructor
      IMPORTING iv_connid TYPE s_conn_id
                iv_seats  TYPE i.
    METHODS book_seat.
    DATA mv_connid TYPE s_conn_id READ-ONLY.
  PRIVATE SECTION.
    DATA mv_free TYPE i.
ENDCLASS.

CLASS lcl_flight IMPLEMENTATION.
  METHOD constructor.
    mv_connid = iv_connid.
    mv_free   = iv_seats.
  ENDMETHOD.

  METHOD book_seat.
    IF mv_free = 0.
      RETURN.
    ENDIF.
    mv_free = mv_free - 1.
    IF mv_free = 0.
      RAISE EVENT flight_full.
    ELSEIF mv_free <= 2.
      RAISE EVENT seats_low EXPORTING ev_free = mv_free.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

`RAISE EVENT` si può usare solo nei metodi della classe che dichiara l'evento (o delle sue sottoclassi). Sollevare un evento che nessuno ascolta va bene: non succede nulla.

## I metodi gestori

Un **metodo gestore** (_handler_) è un metodo normale dichiarato con `FOR EVENT ... OF`. Può importare i parametri dell'evento, e ogni gestore può importare anche `sender`, un parametro implicito con il riferimento all'oggetto che ha sollevato l'evento:

```abap
CLASS lcl_sales_office DEFINITION.
  PUBLIC SECTION.
    METHODS on_seats_low FOR EVENT seats_low OF lcl_flight
      IMPORTING ev_free sender.
    METHODS on_flight_full FOR EVENT flight_full OF lcl_flight
      IMPORTING sender.
ENDCLASS.

CLASS lcl_sales_office IMPLEMENTATION.
  METHOD on_seats_low.
    WRITE: / 'Volo', sender->mv_connid, 'restano solo', ev_free, 'posti'.
  ENDMETHOD.

  METHOD on_flight_full.
    WRITE: / 'Volo', sender->mv_connid, 'pieno'.
  ENDMETHOD.
ENDCLASS.
```

Il gestore non deve importare tutti i parametri; elenca solo quelli che ti servono. Il tipo statico di `sender` è la classe indicata dopo `OF`.

> [!TIP]
> Gli eventi funzionano come un allarme antincendio. Chi vede il fumo tira la leva; non telefona uno per uno ai pompieri, all'amministratore e a tutti gli uffici. Chi deve reagire sa già che deve ascoltare la sirena. Se nel palazzo arriva un nuovo ufficio, comincia semplicemente ad ascoltarla anche lui.

## Registrare i gestori con SET HANDLER

Dichiarare un gestore non basta: viene eseguito solo dopo che lo registri con `SET HANDLER`, a runtime.

```abap
START-OF-SELECTION.
  DATA(lo_flight) = NEW lcl_flight( iv_connid = '0400' iv_seats = 4 ).
  DATA(lo_office) = NEW lcl_sales_office( ).

  SET HANDLER lo_office->on_seats_low
              lo_office->on_flight_full FOR lo_flight.

  DO 5 TIMES.
    lo_flight->book_seat( ).
  ENDDO.
```

L'output mostra due righe "restano solo" e una riga "pieno". Quando un evento viene sollevato, i gestori registrati girano uno dopo l'altro, in modo **sincrono**: `RAISE EVENT` torna solo dopo che sono finiti tutti.

Le varianti di `SET HANDLER`:

| Istruzione                                           | Effetto                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `SET HANDLER h FOR lo_flight.`                       | reagisce agli eventi di quel solo oggetto                   |
| `SET HANDLER h FOR ALL INSTANCES.`                   | reagisce a ogni oggetto della classe, anche a quelli futuri |
| `SET HANDLER h.`                                     | per gli eventi statici (`CLASS-EVENTS`): senza `FOR`        |
| `SET HANDLER h FOR lo_flight ACTIVATION abap_false.` | annulla la registrazione                                    |

Anche un metodo statico può fare da gestore: `SET HANDLER lcl_log=>on_flight_full FOR ALL INSTANCES.`

> [!WARNING]
> Una registrazione tiene in vita l'oggetto gestore: finché è registrato, il garbage collector non lo può liberare. Se crei e registri molti oggetti gestori di breve durata, annulla la registrazione con `ACTIVATION abap_false` quando non ti servono più. E non contare sull'ordine in cui girano i gestori: se uno deve girare prima di un altro, gli eventi sono lo strumento sbagliato.

## Gli eventi nelle interfacce

Anche un'interfaccia può dichiarare eventi. La classe che la implementa li solleva con `RAISE EVENT lif_nome~evento`, e i gestori si dichiarano `FOR EVENT evento OF lif_nome`. Così classi non correlate possono annunciare lo stesso tipo di evento.

Ritroverai gli eventi nell'[ALV grid control](./0100-alv-grid-control.it.md), dove la griglia solleva eventi come `double_click` e il tuo gestore ci reagisce.

## Esercizio

> [!IMPORTANT]
>
> 1. Aggiungi una classe `lcl_logger` con un metodo gestore **statico** `on_flight_full` per l'evento `flight_full` di `lcl_flight`, che scrive `Log: volo pieno`.
> 2. Registralo `FOR ALL INSTANCES`, crea due voli con 1 posto ciascuno e prenota un posto su ognuno.
> 3. Controlla che la riga di log compaia due volte, anche se hai registrato il gestore una volta sola.

### Soluzione

```abap
CLASS lcl_logger DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS on_flight_full FOR EVENT flight_full OF lcl_flight
      IMPORTING sender.
ENDCLASS.

CLASS lcl_logger IMPLEMENTATION.
  METHOD on_flight_full.
    WRITE: / 'Log: volo pieno', sender->mv_connid.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SET HANDLER lcl_logger=>on_flight_full FOR ALL INSTANCES.

  DATA(lo_first)  = NEW lcl_flight( iv_connid = '0400' iv_seats = 1 ).
  DATA(lo_second) = NEW lcl_flight( iv_connid = '0402' iv_seats = 1 ).
  lo_first->book_seat( ).
  lo_second->book_seat( ).
```

> [!NOTE]
>
> - `EVENTS` (o `CLASS-EVENTS`) dichiara un evento; i suoi parametri sono `EXPORTING` e passati per `VALUE`.
> - `RAISE EVENT ... EXPORTING ...` lo solleva da un metodo della classe.
> - Un gestore è un metodo dichiarato `FOR EVENT evento OF classe`, che può importare i parametri e `sender`.
> - I gestori girano solo dopo `SET HANDLER`, per un oggetto, `FOR ALL INSTANCES` o senza `FOR` per gli eventi statici.
> - I gestori girano in modo sincrono; annulli la registrazione con `ACTIVATION abap_false`.
