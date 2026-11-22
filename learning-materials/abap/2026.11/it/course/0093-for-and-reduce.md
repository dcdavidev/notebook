---
title: FOR e REDUCE
description: Costruire e riassumere tabelle in una sola espressione.
---

_Livello intermedio_

Molto codice ABAP cicla su una tabella solo per costruirne un'altra, o per calcolare un solo numero da tutte le righe. Una **table comprehension** fa il primo lavoro in una sola espressione: `VALUE` o `NEW` con dentro un ciclo `FOR`. Una **riduzione di tabella** fa il secondo: `REDUCE` esegue un ciclo `FOR` e restituisce un solo valore. Sono entrambe [espressioni costruttore](./0091-constructor-expressions.md), quindi possono stare ovunque sia atteso un valore.

## FOR dentro VALUE

`FOR riga IN itab` percorre una tabella e produce una nuova riga per ogni riga di origine:

```abap
REPORT zfor_reduce.

TYPES: BEGIN OF ty_route,
         connid TYPE s_conn_id,
         route  TYPE string,
       END OF ty_route,
       tt_routes TYPE STANDARD TABLE OF ty_route WITH EMPTY KEY.

SELECT * FROM spfli INTO TABLE @DATA(lt_connections).

DATA(lt_routes) = VALUE tt_routes(
  FOR ls_conn IN lt_connections
  ( connid = ls_conn-connid
    route  = |{ ls_conn-cityfrom } -> { ls_conn-cityto }| ) ).
```

È la forma a espressione di questo ciclo:

```abap
LOOP AT lt_connections INTO DATA(ls_conn).
  APPEND VALUE #( connid = ls_conn-connid
                  route  = |{ ls_conn-cityfrom } -> { ls_conn-cityto }| ) TO lt_routes.
ENDLOOP.
```

La variabile dopo `FOR` (`ls_conn`) è locale all'espressione. Scrivi `FOR <ls_conn> IN ...` per usare un field symbol invece di una copia.

> [!TIP]
> `FOR` è una catena di montaggio. I pezzi grezzi (le righe di origine) entrano uno alla volta, ogni stazione li lavora allo stesso modo, e alla fine escono i pezzi finiti (le nuove righe), già inscatolati in una nuova tabella.

## Filtri, indice e FOR annidati

`FOR` accetta le stesse aggiunte che conosci da `LOOP AT`:

```abap
DATA(lt_from_frankfurt) = VALUE tt_routes(
  FOR ls_conn IN lt_connections INDEX INTO lv_idx
      WHERE ( cityfrom = 'FRANKFURT' )
  ( connid = ls_conn-connid
    route  = |{ lv_idx }: { ls_conn-cityto }| ) ).
```

- `WHERE ( ... )` filtra le righe; le parentesi sono obbligatorie.
- `INDEX INTO` dà il numero di riga nella tabella di origine.
- `FROM` e `TO` limitano l'intervallo di indici; `USING KEY` sceglie una chiave della tabella.

Più `FOR` di seguito sono cicli annidati, per esempio per combinare ogni compagnia con ogni classe di prenotazione:

```abap
DATA(lt_classes) = VALUE string_table( ( `Y` ) ( `C` ) ( `F` ) ).
SELECT carrid FROM scarr INTO TABLE @DATA(lt_carriers).

DATA(lt_fares) = VALUE string_table(
  FOR ls_carrier IN lt_carriers
  FOR lv_class IN lt_classes
  ( |{ ls_carrier-carrid }-{ lv_class }| ) ).          " AA-Y, AA-C, AA-F, AC-Y, ...
```

## I cicli FOR condizionali

Senza `IN`, `FOR` è un ciclo con contatore, come `DO` o `WHILE`:

```abap
DATA(lt_rows) = VALUE string_table(
  FOR i = 1 UNTIL i > 5
  ( |Riga { i }| ) ).                                  " Riga 1 ... Riga 5

DATA(lt_powers) = VALUE string_table(
  FOR j = 1 THEN j * 2 WHILE j <= 64
  ( |{ j }| ) ).                                       " 1, 2, 4, ... 64
```

`THEN` imposta il valore successivo; senza, la variabile aumenta di 1. `UNTIL` si ferma quando la condizione diventa vera, `WHILE` quando diventa falsa.

## REDUCE

`REDUCE` parte da un valore iniziale, lo aggiorna a ogni passaggio del ciclo `FOR` e restituisce il valore finale:

```abap
SELECT * FROM sflight INTO TABLE @DATA(lt_flights).

DATA(lv_occupied) = REDUCE i(
  INIT lv_sum = 0
  FOR ls_flight IN lt_flights
  NEXT lv_sum = lv_sum + ls_flight-seatsocc ).
```

- `INIT` dichiara una o più variabili di appoggio con i loro valori di partenza. La **prima** è il risultato.
- `FOR` è uno qualsiasi dei cicli visti sopra.
- `NEXT` assegna nuovi valori alle variabili di `INIT` a ogni passaggio.

Con più variabili `INIT` puoi calcolare più di una cosa, e puoi restituire qualsiasi tipo, per esempio una stringa:

```abap
DATA(lv_max_price) = REDUCE s_price(
  INIT lv_max = CONV s_price( 0 )
  FOR ls_flight IN lt_flights
  NEXT lv_max = nmax( val1 = lv_max val2 = ls_flight-price ) ).

DATA(lv_list) = REDUCE string(
  INIT lv_text = `` lv_sep = ``
  FOR ls_carrier IN lt_carriers
  NEXT lv_text = lv_text && lv_sep && ls_carrier-carrid
       lv_sep  = `, ` ).                                " AA, AC, AF, ...
```

> [!WARNING]
> Una variabile di `INIT` prende il tipo dal valore che le assegni, come una dichiarazione inline. `INIT lv_sum = 0` rende `lv_sum` un `i`, anche dentro `REDUCE s_price( ... )`: ogni passaggio arrotonda a un numero intero, e solo il risultato finale viene convertito in `s_price`. Quando sommi importi con decimali, dai alla variabile il tipo giusto con `CONV`, come in `INIT lv_sum = CONV s_price( 0 )`.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi tutte le righe di `SFLIGHT` della compagnia `LH`. Con `VALUE` e `FOR` costruisci una `string_table` con una riga per volo: data e posti liberi.
> 2. Con `REDUCE` calcola il ricavo totale di quei voli come somma di `price * seatsocc`, con tipo `s_price`.
> 3. Con `REDUCE` e un `WHERE` conta i voli completamente pieni.

### Soluzione

```abap
SELECT * FROM sflight WHERE carrid = 'LH' INTO TABLE @DATA(lt_flights).

DATA(lt_lines) = VALUE string_table(
  FOR ls_flight IN lt_flights
  ( |{ ls_flight-fldate DATE = USER }: { ls_flight-seatsmax - ls_flight-seatsocc } liberi| ) ).

DATA(lv_revenue) = REDUCE s_price(
  INIT lv_sum = CONV s_price( 0 )
  FOR ls_flight IN lt_flights
  NEXT lv_sum = lv_sum + ls_flight-price * ls_flight-seatsocc ).

DATA(lv_full) = REDUCE i(
  INIT lv_count = 0
  FOR ls_flight IN lt_flights WHERE ( seatsocc >= seatsmax )
  NEXT lv_count = lv_count + 1 ).
```

> [!NOTE]
>
> - `VALUE tipo( FOR riga IN itab ( ... ) )` costruisce una nuova tabella da una esistente in una sola espressione.
> - `FOR` accetta `WHERE ( ... )`, `INDEX INTO`, `FROM`, `TO` e `USING KEY`; più `FOR` sono cicli annidati.
> - `FOR i = inizio [THEN successivo] UNTIL|WHILE condizione` è un ciclo con contatore.
> - `REDUCE tipo( INIT ... FOR ... NEXT ... )` riduce tutti i passaggi a un solo valore; la prima variabile di `INIT` è il risultato.
> - Dai alle variabili di `INIT` il tipo giusto con `CONV` per evitare arrotondamenti. Per i gruppi di righe vedi [raggruppare le tabelle interne](./0095-grouping-internal-tables.md).
