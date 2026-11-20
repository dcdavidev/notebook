---
title: Raggruppare le tabelle interne
description: LOOP AT ... GROUP BY e LOOP AT GROUP.
---

_Livello intermedio_

I report hanno spesso bisogno di dati per gruppo: prenotazioni per cliente, voli per compagnia, posti per mese. Le istruzioni di livello di controllo `AT NEW` e `AT END OF` della lezione su come [ciclare sulle tabelle interne](./0038-looping-internal-tables.it.md) lo sanno fare, ma solo se la tabella è ordinata nel modo giusto e i campi del gruppo stanno all'inizio della riga. Il **raggruppamento** con `LOOP AT ... GROUP BY` non ha nessuno dei due limiti: indichi la chiave del gruppo, ABAP costruisce i gruppi, e tu elabori ogni gruppo e le sue righe.

## LOOP AT ... GROUP BY

Il ciclo esterno gira **una volta per gruppo**. `GROUP BY` indica la chiave, e `INTO` ti dà una variabile che rappresenta il gruppo:

```abap
REPORT zgrouping.

SELECT * FROM sflight INTO TABLE @DATA(lt_flights).

LOOP AT lt_flights INTO DATA(ls_flight)
     GROUP BY ls_flight-carrid
     INTO DATA(lv_carrid).

  WRITE / lv_carrid.

  LOOP AT GROUP lv_carrid INTO DATA(ls_member).
    WRITE: / '  ', ls_member-connid, ls_member-fldate.
  ENDLOOP.

ENDLOOP.
```

- `GROUP BY ls_flight-carrid` è la chiave del gruppo: un gruppo per ogni compagnia distinta.
- `INTO DATA(lv_carrid)` dichiara il **binding della chiave di gruppo**. Con una chiave semplice ha il tipo della chiave.
- `LOOP AT GROUP lv_carrid` è il ciclo interno sui **membri** del gruppo corrente, cioè le righe originali.

La tabella non deve essere ordinata. Di norma i gruppi arrivano nell'ordine in cui compare nella tabella la loro prima riga.

> [!TIP]
> Raggruppare è come smistare un mucchio di posta nelle caselle. Scorri il mucchio una volta e infili ogni lettera nella casella con il nome del destinatario. Poi passi da una casella all'altra: l'etichetta è la chiave del gruppo, e le lettere dentro sono i membri.

## Chiavi con più campi

Per una chiave con più componenti scrivi una struttura fra parentesi. Puoi aggiungere `GROUP SIZE` e `GROUP INDEX` per avere il numero di righe del gruppo e la posizione del gruppo:

```abap
LOOP AT lt_flights INTO ls_flight
     GROUP BY ( carrid = ls_flight-carrid
                connid = ls_flight-connid
                size   = GROUP SIZE
                index  = GROUP INDEX )
     ASCENDING
     INTO DATA(ls_group).

  WRITE: / ls_group-index, ls_group-carrid, ls_group-connid,
           ls_group-size, 'voli'.

ENDLOOP.
```

I nomi fra parentesi (`carrid`, `connid`, `size`, `index`) diventano i componenti di `ls_group`. I componenti della chiave possono essere qualsiasi espressione, non solo campi: `month = ls_flight-fldate(6)` raggruppa per anno e mese.

`ASCENDING` o `DESCENDING` ordina i gruppi per chiave. Le righe dentro ogni gruppo mantengono il loro ordine originale.

## Calcolare per gruppo

Dentro il ciclo sul gruppo puoi fare con i membri tutto quello che ti serve. Spesso vuoi solo una somma o un conteggio:

```abap
LOOP AT lt_flights INTO ls_flight
     GROUP BY ls_flight-carrid
     INTO DATA(lv_carrier).

  DATA(lv_seats) = 0.
  LOOP AT GROUP lv_carrier INTO DATA(ls_row).
    lv_seats = lv_seats + ls_row-seatsocc.
  ENDLOOP.

  WRITE: / lv_carrier, lv_seats.
ENDLOOP.
```

La stessa somma si può scrivere con [`REDUCE`](./0093-for-and-reduce.it.md) e `FOR ... IN GROUP`:

```abap
  DATA(lv_seats2) = REDUCE i( INIT lv_sum = 0
                              FOR ls_row2 IN GROUP lv_carrier
                              NEXT lv_sum = lv_sum + ls_row2-seatsocc ).
```

Se i membri non ti servono affatto, aggiungi `WITHOUT MEMBERS`: ABAP costruisce allora solo le chiavi, ed è più veloce, ma `LOOP AT GROUP` non è più ammesso.

## Gruppi in una sola espressione

`FOR GROUPS` porta il raggruppamento dentro un'[espressione costruttore](./0091-constructor-expressions.it.md). Questa costruisce una tabella con una riga per compagnia e il numero dei suoi voli:

```abap
TYPES: BEGIN OF ty_count,
         carrid  TYPE s_carr_id,
         flights TYPE i,
       END OF ty_count,
       tt_counts TYPE STANDARD TABLE OF ty_count WITH EMPTY KEY.

DATA(lt_counts) = VALUE tt_counts(
  FOR GROUPS ls_grp OF ls_fl IN lt_flights
      GROUP BY ( carrid = ls_fl-carrid size = GROUP SIZE )
  ( carrid = ls_grp-carrid flights = ls_grp-size ) ).
```

> [!WARNING]
> Senza `INTO`, la work area del ciclo esterno diventa il rappresentante del gruppo: contiene la **prima riga** di ogni gruppo, non la chiave, e scrivi `LOOP AT GROUP ls_flight`. Questo **binding del rappresentante** è facile da fraintendere, perché i campi che non fanno parte della chiave mostrano semplicemente i valori di quella prima riga. Preferisci un binding di gruppo esplicito con `INTO`.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi `SBOOK` per la compagnia `LH` (usa `UP TO 1000 ROWS`).
> 2. Raggruppa le prenotazioni per cliente (`customid`), in ordine di cliente, con la dimensione del gruppo.
> 3. Per ogni cliente stampa il numero di prenotazioni e il totale di `forcuram`, ed elenca le prenotazioni cancellate (`cancelled = 'X'`).

### Soluzione

```abap
SELECT * FROM sbook WHERE carrid = 'LH' INTO TABLE @DATA(lt_bookings) UP TO 1000 ROWS.

LOOP AT lt_bookings INTO DATA(ls_booking)
     GROUP BY ( customid = ls_booking-customid size = GROUP SIZE )
     ASCENDING
     INTO DATA(ls_customer).

  DATA(lv_total) = REDUCE s_f_cur_pr( INIT lv_sum = CONV s_f_cur_pr( 0 )
                                      FOR ls_b IN GROUP ls_customer
                                      NEXT lv_sum = lv_sum + ls_b-forcuram ).
  WRITE: / ls_customer-customid, ls_customer-size, lv_total.

  LOOP AT GROUP ls_customer INTO DATA(ls_member) WHERE cancelled = abap_true.
    WRITE: / '  cancellata:', ls_member-bookid.
  ENDLOOP.
ENDLOOP.
```

> [!NOTE]
>
> - `LOOP AT itab ... GROUP BY chiave INTO gruppo` gira una volta per gruppo; la tabella non deve essere ordinata.
> - `LOOP AT GROUP gruppo` cicla sui membri del gruppo corrente; accetta `WHERE`.
> - Una chiave con più campi è una struttura fra parentesi; `GROUP SIZE` e `GROUP INDEX` aggiungono dimensione e posizione.
> - `ASCENDING` o `DESCENDING` ordina i gruppi; `WITHOUT MEMBERS` evita di costruire i membri.
> - `FOR GROUPS ... OF ... IN` e `FOR ... IN GROUP` portano il raggruppamento dentro `VALUE` e `REDUCE`.
