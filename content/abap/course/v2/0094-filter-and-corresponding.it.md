---
title: FILTER e CORRESPONDING
description: Filtrare tabelle per chiave e mappare campi fra strutture.
---

_Livello intermedio_

Due lavori ricorrono in quasi ogni programma: prendere le righe di una tabella che soddisfano una condizione, e copiare dati fra strutture o tabelle i cui campi hanno lo stesso nome. `FILTER` fa il primo, `CORRESPONDING` il secondo. Sono entrambe [espressioni costruttore](./0091-constructor-expressions.it.md) e sostituiscono cicli che altrimenti scriveresti a mano.

## FILTER con una condizione WHERE

`FILTER` restituisce una nuova tabella con le righe della tabella di origine che soddisfano una condizione `WHERE`. Il risultato ha lo stesso tipo dell'origine.

```abap
REPORT zfilter_corresponding.

DATA lt_flights TYPE SORTED TABLE OF sflight
                WITH NON-UNIQUE KEY carrid connid.

SELECT * FROM sflight INTO TABLE @lt_flights.

DATA(lt_lufthansa) = FILTER #( lt_flights WHERE carrid = 'LH' ).
DATA(lt_others)    = FILTER #( lt_flights EXCEPT WHERE carrid = 'LH' ).
```

`EXCEPT` inverte la condizione: tiene le righe che **non** la soddisfano.

`FILTER` è veloce perché lavora attraverso una chiave della tabella, e questa è anche la sua regola principale: la condizione può usare solo i componenti di una **chiave sorted o hashed** della tabella di origine, confrontati con `=` e uniti con `AND`. Per una chiave hashed devi indicarne tutti i componenti. Se la chiave primaria non va bene, aggiungi una [chiave secondaria](./0035-table-keys.it.md) e indicala con `USING KEY`:

```abap
DATA lt_by_date TYPE STANDARD TABLE OF sflight WITH EMPTY KEY
                WITH NON-UNIQUE SORTED KEY by_date COMPONENTS fldate.

SELECT * FROM sflight INTO TABLE @lt_by_date.

DATA(lt_today) = FILTER #( lt_by_date USING KEY by_date WHERE fldate = sy-datum ).
```

> [!WARNING]
> Una tabella standard senza una chiave sorted o hashed non si può usare con `FILTER ... WHERE`: ottieni un errore di sintassi. Per condizioni libere su qualsiasi campo usa `VALUE #( FOR ... WHERE ( ... ) ( ... ) )` della lezione su [FOR e REDUCE](./0093-for-and-reduce.it.md), oppure `LOOP AT ... WHERE`.

## FILTER con una tabella filtro

La seconda forma tiene le righe i cui valori compaiono in un'altra tabella, la **tabella filtro**. Qui la chiave sorted o hashed serve alla tabella filtro, mentre la tabella di origine può essere di qualsiasi tipo:

```abap
TYPES tt_carrids TYPE SORTED TABLE OF s_carr_id WITH UNIQUE KEY table_line.

DATA(lt_wanted) = VALUE tt_carrids( ( 'AA' ) ( 'LH' ) ).
SELECT * FROM spfli INTO TABLE @DATA(lt_connections).

DATA(lt_selected) = FILTER #( lt_connections IN lt_wanted
                              WHERE carrid = table_line ).
```

A sinistra di `=` c'è un componente della tabella di origine, a destra un componente della tabella filtro (`table_line` per una tabella senza struttura). `EXCEPT IN` tiene le righe che non sono nella tabella filtro.

> [!TIP]
> `FILTER` è un buttafuori con la lista degli invitati. Con `WHERE` controlla ogni ospite rispetto a una regola ("solo Lufthansa"); con una tabella filtro controlla ogni ospite rispetto ai nomi della lista. La lista è in ordine alfabetico, ed è per questo che è veloce.

## CORRESPONDING per le strutture

`CORRESPONDING` copia i componenti con lo **stesso nome** da una struttura a un'altra e lascia fuori gli altri:

```abap
TYPES: BEGIN OF ty_flight_info,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
         note     TYPE string,
       END OF ty_flight_info.

SELECT SINGLE * FROM spfli WHERE carrid = 'LH' INTO @DATA(ls_spfli).

DATA(ls_info) = CORRESPONDING ty_flight_info( ls_spfli ).          " note resta iniziale
ls_info = CORRESPONDING #( BASE ( ls_info ) ls_spfli ).            " mantiene il valore di note
```

Senza `BASE`, i componenti della destinazione che non hanno corrispondenza nell'origine sono iniziali. Con `BASE ( ... )` mantengono il valore della base.

Due aggiunte adattano la mappatura:

```abap
TYPES: BEGIN OF ty_route,
         airline  TYPE s_carr_id,
         flight   TYPE s_conn_id,
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
       END OF ty_route.

DATA(ls_route) = CORRESPONDING ty_route( ls_spfli
                   MAPPING airline = carrid flight = connid    " destinazione = origine
                   EXCEPT cityto ).                            " questo non copiarlo
```

La vecchia istruzione `MOVE-CORRESPONDING ls_spfli TO ls_info.` fa lo stesso di `CORRESPONDING` con `BASE`: cambia solo i componenti corrispondenti della destinazione. La troverai dappertutto nel codice esistente, ed è ancora valida.

## CORRESPONDING per le tabelle

Con le tabelle interne, `CORRESPONDING` mappa ogni riga:

```abap
TYPES tt_routes TYPE STANDARD TABLE OF ty_route WITH EMPTY KEY.

SELECT * FROM spfli INTO TABLE @DATA(lt_spfli).

DATA(lt_routes) = CORRESPONDING tt_routes( lt_spfli
                    MAPPING airline = carrid flight = connid ).
```

Se la tabella di destinazione ha una chiave unica e due righe di origine producono la stessa chiave, `CORRESPONDING` solleva `CX_SY_ITAB_DUPLICATE_KEY`. Da ABAP 7.52 l'aggiunta `DISCARDING DUPLICATES` salta invece quelle righe. Per strutture e tabelle annidate dentro le righe, `DEEP` mappa anche i componenti interni.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi `SFLIGHT` in una tabella con una chiave secondaria sorted su `planetype`. Con `FILTER` prendi i voli del tipo di aereo `A380-800` (o di uno che esiste nei tuoi dati).
> 2. Definisci un tipo struttura con `airline`, `flight`, `date` e `free_seats`. Con `CORRESPONDING` e `MAPPING` mappa i voli filtrati in una tabella di quel tipo.
> 3. Riempi `free_seats` in un `LOOP AT ... ASSIGNING`, perché è un valore calcolato e non si può mappare.

### Soluzione

```abap
TYPES: BEGIN OF ty_free,
         airline    TYPE s_carr_id,
         flight     TYPE s_conn_id,
         date       TYPE s_date,
         free_seats TYPE i,
       END OF ty_free,
       tt_free TYPE STANDARD TABLE OF ty_free WITH EMPTY KEY.

DATA lt_flights TYPE STANDARD TABLE OF sflight WITH EMPTY KEY
                WITH NON-UNIQUE SORTED KEY by_plane COMPONENTS planetype.

SELECT * FROM sflight INTO TABLE @lt_flights.

DATA(lt_a380) = FILTER #( lt_flights USING KEY by_plane WHERE planetype = 'A380-800' ).

DATA(lt_free) = CORRESPONDING tt_free( lt_a380
                  MAPPING airline = carrid flight = connid date = fldate ).

LOOP AT lt_free ASSIGNING FIELD-SYMBOL(<ls_free>).
  DATA(ls_flight) = lt_a380[ sy-tabix ].
  <ls_free>-free_seats = ls_flight-seatsmax - ls_flight-seatsocc.
ENDLOOP.
```

Le due tabelle hanno lo stesso ordine di righe, quindi `sy-tabix` le collega.

> [!NOTE]
>
> - `FILTER #( itab [EXCEPT] [USING KEY k] WHERE ... )` tiene le righe che soddisfano una condizione su una chiave sorted o hashed.
> - `FILTER #( itab [EXCEPT] IN ftab WHERE ... )` tiene le righe i cui valori compaiono in una tabella filtro con una chiave adatta.
> - `CORRESPONDING` copia i componenti con lo stesso nome; `BASE` mantiene gli altri valori della destinazione.
> - `MAPPING destinazione = origine` mappa nomi diversi, ed `EXCEPT` esclude dei componenti.
> - Con le tabelle fai attenzione alle chiavi duplicate nella destinazione; `DISCARDING DUPLICATES` le salta.
