---
title: ABAP SQL moderno
description: Variabili host, dichiarazioni inline, espressioni SQL e CASE.
---

_Livello intermedio_

Da ABAP 7.40 SP05, ABAP SQL ha una sintassi nuova e più rigorosa. Contrassegna ogni variabile ABAP con `@`, separa i campi con le virgole, dichiara la tabella di destinazione inline e permette al database di calcolare valori con le **espressioni SQL**, invece di farlo con cicli in ABAP.

`SELECT`, `WHERE`, join e aggregati li conosci già dal [livello base](./0052-select-basics.md). Qui vedi come si scrivono le stesse query nel codice moderno e che cosa puoi ora delegare al database.

## La nuova sintassi in breve

```abap
DATA lv_carrid TYPE s_carr_id VALUE 'LH'.

* Stile vecchio: niente virgole, niente @, destinazione dichiarata prima
DATA lt_old TYPE STANDARD TABLE OF spfli.
SELECT carrid connid cityfrom cityto
  FROM spfli
  INTO CORRESPONDING FIELDS OF TABLE lt_old
  WHERE carrid = lv_carrid.

* Stile moderno
SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  WHERE carrid = @lv_carrid
  ORDER BY connid
  INTO TABLE @DATA(lt_connections).
```

Le regole della nuova sintassi:

- Una **variabile host** è un oggetto dati ABAP usato dentro l'SQL. Riceve il carattere di escape `@`: `@lv_carrid`, `@abap_true`, `@DATA(...)`. Tutto quello che non ha `@` è una colonna o una parola chiave SQL.
- I campi dell'elenco sono separati da virgole.
- La clausola `INTO` va per ultima, dopo `WHERE`, `GROUP BY` e `ORDER BY`.
- `INTO TABLE @DATA(lt_x)` dichiara la destinazione inline. Il suo tipo di riga ha esattamente i campi dell'elenco, con i nomi che gli dai.

Appena usi una di queste caratteristiche, il compilatore passa in **modalità strict** e pretende anche tutte le altre nella stessa istruzione. Mescolare stile vecchio e nuovo nella stessa `SELECT` è un errore di sintassi.

> [!TIP]
> La `@` è come l'etichetta "dalla mia scrivania" su un foglio che passi a un collega dell'archivio: quello che ha l'etichetta viene da te, tutto il resto lo cerca nei suoi schedari.

## FIELDS: prima il FROM

Puoi anche scrivere prima la clausola `FROM` ed elencare le colonne dopo la parola chiave `FIELDS`. Così ADT può suggerirti i nomi delle colonne, perché conosce già la tabella.

```abap
SELECT FROM sflight
  FIELDS carrid, connid, fldate, price, currency
  WHERE carrid = @lv_carrid
    AND fldate >= @sy-datum
  INTO TABLE @DATA(lt_flights)
  UP TO 50 ROWS.
```

`SELECT SINGLE` funziona allo stesso modo, con `INTO @DATA(ls_x)` per una struttura o `INTO @DATA(lv_x)` per una sola colonna:

```abap
SELECT SINGLE FROM scarr
  FIELDS carrname
  WHERE carrid = @lv_carrid
  INTO @DATA(lv_carrname).
```

## Le espressioni SQL

Nell'elenco dei campi, nella clausola `WHERE` e in altri punti puoi scrivere espressioni che il database valuta riga per riga. Dai a ogni colonna calcolata un alias con `AS`, così la destinazione inline riceve un nome leggibile.

```abap
SELECT FROM sflight
  FIELDS carrid,
         connid,
         fldate,
         seatsmax - seatsocc                     AS seats_free,
         price * @lv_factor                      AS price_new,
         carrid && '-' && connid                 AS flight_key,
         CAST( seatsocc AS FLTP ) / CAST( seatsmax AS FLTP ) * 100
                                                 AS occupancy,
         @sy-uname                               AS read_by
  WHERE carrid = @lv_carrid
  INTO TABLE @DATA(lt_stats).
```

Dichiara `lv_factor` prima della query, per esempio `DATA lv_factor TYPE p LENGTH 3 DECIMALS 2 VALUE '1.10'`.

| Tipo                | Esempi                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Aritmetiche         | `+`, `-`, `*`, `/` (solo virgola mobile), `div( a, b )`, `mod( a, b )`                                |
| Stringhe            | `&&`, `concat( a, b )`, `upper( )`, `lower( )`, `substring( s, pos, len )`, `length( )`, `replace( )` |
| Funzioni numeriche  | `abs( )`, `ceil( )`, `floor( )`, `round( x, n )`                                                      |
| Conversione di tipo | `CAST( x AS tipo )`                                                                                   |
| Gestione dei null   | `coalesce( a, b )`: il primo valore che non è null                                                    |
| Valori host         | `@lv_value`, `@( espressione )` per un'espressione ABAP                                               |

> [!WARNING]
> L'operatore `/` funziona solo con operandi in virgola mobile. Per gli interi usa `div( )`; per i decimali, fai prima un cast a `FLTP` o `DEC`. Altrimenti il controllo di sintassi rifiuta l'istruzione.

## CASE in SQL

`CASE` restituisce un valore che dipende da condizioni, come [`COND` e `SWITCH`](./0092-cond-and-switch.md) in ABAP. Il **case semplice** confronta un operando con dei valori; il **case con ricerca** verifica condizioni complete.

```abap
SELECT FROM sflight
  FIELDS carrid,
         connid,
         fldate,
         CASE carrid
           WHEN 'LH' THEN 'Lufthansa'
           WHEN 'AZ' THEN 'Alitalia'
           ELSE 'Altra'
         END AS carrier_text,
         CASE
           WHEN seatsocc >= seatsmax          THEN 'PIENO'
           WHEN seatsocc * 10 >= seatsmax * 8 THEN 'QUASI PIENO'
           ELSE 'DISPONIBILE'
         END AS status
  WHERE fldate >= @sy-datum
  INTO TABLE @DATA(lt_status).
```

Ogni ramo deve restituire un tipo compatibile. Senza `ELSE`, le righe che non soddisfano nessun ramo ricevono il valore null, che nella destinazione ABAP diventa il valore iniziale.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi tutti i voli di una compagnia da `SFLIGHT` con la sintassi moderna e una tabella di destinazione inline.
> 2. Aggiungi una colonna `revenue` calcolata come `price * seatsocc` e una colonna `load_class` che vale `'ALTO'` se è occupato più dell'80% dei posti, `'BASSO'` altrimenti.
> 3. Mostra il risultato con `cl_demo_output=>display( )`.

### Soluzione

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT FROM sflight
    FIELDS carrid, connid, fldate,
           price * seatsocc AS revenue,
           CASE WHEN seatsocc * 10 > seatsmax * 8 THEN 'ALTO'
                ELSE 'BASSO'
           END AS load_class
    WHERE carrid = @p_carrid
    ORDER BY fldate
    INTO TABLE @DATA(lt_result).

  cl_demo_output=>display( lt_result ).
```

> [!NOTE]
>
> - Le variabili host iniziano con `@`; i campi sono separati da virgole; `INTO` va per ultima.
> - `INTO TABLE @DATA(...)` dichiara la destinazione inline con i campi dell'elenco.
> - `SELECT FROM ... FIELDS ...` mette prima la sorgente e aiuta il completamento del codice.
> - Le espressioni SQL (aritmetiche, stringhe, `CAST`, `coalesce`) fanno calcolare i valori al database.
> - `CASE` restituisce un valore per riga; dai a ogni colonna calcolata un alias con `AS`.
