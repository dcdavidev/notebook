---
title: Aggregati, GROUP BY e HAVING
description: COUNT, SUM, AVG, MIN, MAX e risultati raggruppati.
---

_Livello base_

Quanti voli ha Lufthansa? Quanti posti sono occupati su ogni collegamento? Potresti leggere tutti i voli e sommare i numeri in un ciclo, ma il database può farlo al posto tuo e restituirti solo i totali.

Le **funzioni di aggregazione** calcolano un valore a partire da molte righe. Con `GROUP BY` ottieni una riga di risultato per ogni gruppo, per esempio per compagnia aerea, e con `HAVING` tieni solo i gruppi che soddisfano una condizione.

## Le funzioni di aggregazione

ABAP SQL ha cinque funzioni di aggregazione:

| Funzione                   | Risultato                                  |
| -------------------------- | ------------------------------------------ |
| `COUNT(*)`                 | il numero di righe                         |
| `COUNT( DISTINCT col )`    | il numero di valori diversi in una colonna |
| `SUM( col )`               | la somma di una colonna numerica           |
| `AVG( col )`               | la media di una colonna numerica           |
| `MIN( col )`, `MAX( col )` | il valore più piccolo e il più grande      |

Quando la lista di selezione contiene solo aggregati, il risultato è una sola riga, quindi puoi leggerla in una struttura o in una variabile senza `SINGLE`:

```abap
REPORT zaggregate_demo.

SELECT COUNT(*) AS flights,
       SUM( seatsocc ) AS occupied,
       MAX( price ) AS max_price
  FROM sflight
  WHERE carrid = 'LH'
  INTO @DATA(ls_totals).

WRITE: / 'Voli:', ls_totals-flights,
       / 'Posti occupati:', ls_totals-occupied,
       / 'Prezzo più alto:', ls_totals-max_price.
```

Dai a ogni aggregato un alias con `AS`: diventa il nome del componente della struttura inline.

`AVG` restituisce un numero in virgola mobile (tipo `f`). Assegnalo a un numero packed prima di stamparlo, altrimenti la lista lo mostra in notazione scientifica.

> [!WARNING]
> `SUM( price )` sui voli di compagnie diverse somma insieme euro, dollari e yen. Prima di sommare degli importi, raggruppa per valuta oppure filtra su una sola valuta.

## GROUP BY

`GROUP BY` divide le righe in gruppi con gli stessi valori nelle colonne elencate e calcola gli aggregati per ogni gruppo:

```abap
SELECT carrid, connid,
       COUNT(*) AS flights,
       SUM( seatsocc ) AS occupied
  FROM sflight
  GROUP BY carrid, connid
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_per_connection).

LOOP AT lt_per_connection INTO DATA(ls_conn).
  WRITE: / ls_conn-carrid, ls_conn-connid, ls_conn-flights, ls_conn-occupied.
ENDLOOP.
```

La regola: ogni colonna della lista di selezione che non sta dentro un aggregato deve comparire in `GROUP BY`. Qui `carrid` e `connid` stanno in entrambi. Se aggiungessi `fldate` alla lista di selezione senza raggruppare per quel campo, il controllo sintattico rifiuterebbe la query, perché un gruppo ha molte date.

> [!TIP]
> `GROUP BY` è come smistare una pila di scontrini in buste, una busta per negozio. Poi scrivi su ogni busta quanti scontrini contiene e il loro totale. Le buste sono i gruppi; i numeri scritti sopra sono gli aggregati.

## HAVING

`WHERE` filtra le righe **prima** del raggruppamento. `HAVING` filtra i gruppi **dopo** il raggruppamento, quindi può usare gli aggregati:

```abap
SELECT carrid,
       COUNT(*) AS flights,
       SUM( seatsocc ) AS occupied
  FROM sflight
  WHERE fldate >= '20250101'                  " righe: solo i voli dal 2025
  GROUP BY carrid
  HAVING SUM( seatsocc ) > 1000               " gruppi: solo le compagnie più piene
  ORDER BY occupied DESCENDING
  INTO TABLE @DATA(lt_busy).
```

Leggila in quest'ordine: il database prende le righe che passano la `WHERE`, le raggruppa per compagnia, calcola i totali, scarta i gruppi che non passano la `HAVING` e ordina quello che resta. `ORDER BY` può usare l'alias `occupied`.

| Clausola | Filtra | Può usare aggregati |
| -------- | ------ | ------------------- |
| `WHERE`  | righe  | no                  |
| `HAVING` | gruppi | sì                  |

## Aggregati con i join

Gli aggregati funzionano anche sui join. Questa query conta le prenotazioni per cliente, con il nome del cliente:

```abap
SELECT s~id, s~name, COUNT(*) AS bookings
  FROM scustom AS s
  INNER JOIN sbook AS b ON b~customid = s~id
  WHERE b~cancelled = @abap_false
  GROUP BY s~id, s~name
  ORDER BY bookings DESCENDING
  INTO TABLE @DATA(lt_top_customers)
  UP TO 10 ROWS.
```

`s~name` sta nella lista di selezione, quindi deve stare anche in `GROUP BY`, anche se ogni ID cliente ha un solo nome.

Quando un aggregato non ha righe su cui lavorare, il database restituisce null, e ABAP lo trasforma in un valore iniziale: `SUM` dà `0`. `COUNT(*)` dà sempre un numero, `0` se nessuna riga corrisponde.

Se ti servono i totali insieme alle singole righe, o un secondo livello di raggruppamento in memoria, vedi [Raggruppare le tabelle interne](./0095-grouping-internal-tables.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Per ogni compagnia aerea, stampa il numero di collegamenti in `SPFLI` e il tempo di volo più lungo.
> 2. Stampa i collegamenti di `SFLIGHT` la cui media di posti occupati per volo è superiore a 100, con quella media.

### Soluzione

```abap
REPORT zaggregate_exercise.

SELECT carrid, COUNT(*) AS connections, MAX( fltime ) AS longest
  FROM spfli
  GROUP BY carrid
  ORDER BY carrid
  INTO TABLE @DATA(lt_per_airline).

LOOP AT lt_per_airline INTO DATA(ls_airline).
  WRITE: / ls_airline-carrid, ls_airline-connections, ls_airline-longest.
ENDLOOP.

SELECT carrid, connid, AVG( seatsocc ) AS avg_occupied
  FROM sflight
  GROUP BY carrid, connid
  HAVING AVG( seatsocc ) > 100
  INTO TABLE @DATA(lt_full).

DATA lv_avg TYPE p LENGTH 8 DECIMALS 1.
LOOP AT lt_full INTO DATA(ls_full).
  lv_avg = ls_full-avg_occupied.            " dal tipo f a un numero packed
  WRITE: / ls_full-carrid, ls_full-connid, lv_avg.
ENDLOOP.
```

> [!NOTE]
>
> - `COUNT`, `SUM`, `AVG`, `MIN` e `MAX` calcolano sul database un valore a partire da molte righe.
> - Dai a ogni aggregato un alias con `AS`.
> - Con `GROUP BY`, ogni colonna non aggregata della lista di selezione deve stare nella lista di `GROUP BY`.
> - `WHERE` filtra le righe prima del raggruppamento; `HAVING` filtra i gruppi dopo.
> - Non sommare importi in valute diverse.
