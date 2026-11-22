---
title: WHERE e ORDER BY
description: Filtrare e ordinare le righe che il database restituisce.
---

_Livello base_

La clausola `WHERE` dice al database quali righe vuoi; la clausola `ORDER BY` gli dice in che ordine restituirle. Entrambe vengono eseguite sul database, prima che i dati arrivino al tuo programma.

Filtrare sul database è la regola più importante per avere ABAP veloce: leggi solo le righe che ti servono, invece di leggere tutto e cancellare righe in ABAP.

## I confronti nella WHERE

Una clausola `WHERE` è un'espressione logica sulle colonne della sorgente dati. Confronti una colonna con un letterale, con una variabile ABAP (con la `@`) o con un'altra colonna.

```abap
REPORT zwhere_demo.

PARAMETERS p_carr TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, price, seatsmax, seatsocc
    FROM sflight
    WHERE carrid = @p_carr
      AND price < 1000
      AND seatsocc < seatsmax             " colonna confrontata con una colonna
    INTO TABLE @DATA(lt_flights).

  WRITE: / sy-dbcnt, 'voli con posti liberi sotto i 1000'.
```

Gli operatori di confronto sono gli stessi di ABAP:

| Operatore | Alternativa | Significato       |
| --------- | ----------- | ----------------- |
| `=`       | `EQ`        | uguale            |
| `<>`      | `NE`        | diverso           |
| `<`       | `LT`        | minore            |
| `>`       | `GT`        | maggiore          |
| `<=`      | `LE`        | minore o uguale   |
| `>=`      | `GE`        | maggiore o uguale |

Combina le condizioni con `AND`, `OR` e `NOT`, e usa le parentesi per rendere esplicito il raggruppamento. `AND` lega più forte di `OR`, proprio come nell'[IF](./0024-if-and-logical-expressions.md).

```abap
SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  WHERE ( cityfrom = 'FRANKFURT' OR cityfrom = 'ROME' )
    AND carrid = 'LH'
  INTO TABLE @DATA(lt_conn).
```

> [!WARNING]
> Senza parentesi, la condizione qui sopra significa "da Francoforte, oppure da Roma con Lufthansa": otterresti anche i voli da Francoforte di tutte le altre compagnie. Quando mescoli `AND` e `OR`, aggiungi sempre le parentesi.

## BETWEEN, IN, LIKE e IS NULL

ABAP SQL ha altri predicati per i filtri più comuni:

```abap
DATA lv_from TYPE d VALUE '20250101'.
DATA lv_to   TYPE d VALUE '20251231'.

SELECT carrid, connid, fldate
  FROM sflight
  WHERE fldate BETWEEN @lv_from AND @lv_to        " limiti inclusi
    AND carrid IN ( 'AA', 'LH', 'UA' )            " uno dei valori dell'elenco
  INTO TABLE @DATA(lt_year).

SELECT carrid, carrname
  FROM scarr
  WHERE carrname LIKE 'A%'                        " comincia con A
  INTO TABLE @DATA(lt_a_airlines).
```

- `BETWEEN a AND b` include entrambi i limiti.
- `IN ( ... )` controlla un elenco di valori. Con una **tabella range** al posto dell'elenco, `IN @range` lascia decidere il filtro all'utente: vedi [SELECT-OPTIONS e range](./0064-select-options-and-ranges.md).
- `LIKE` confronta con un modello: `%` corrisponde a qualsiasi sequenza di caratteri, `_` a esattamente un carattere. Il confronto distingue maiuscole e minuscole.
- `IS NULL` e `IS NOT NULL` controllano il valore nullo del database. Le colonne di una tabella normale sono raramente nulle, ma i valori nulli li incontrerai con gli [outer join](./0055-joins.md).

Per negare un predicato metti `NOT` davanti alla parola chiave: `NOT BETWEEN`, `NOT IN`, `NOT LIKE`, `IS NOT NULL`.

> [!TIP]
> `LIKE 'A%'` funziona come la ricerca con i caratteri jolly in un file manager: `A*` trova tutti i file che cominciano con A. In SQL il jolly è `%` invece di `*`, e `_` sta per una sola lettera, come `?`.

## Ordinare con ORDER BY

Senza `ORDER BY`, il database restituisce le righe nell'ordine che gli fa più comodo. Quell'ordine può cambiare da un'esecuzione all'altra, da un sistema all'altro e da un rilascio all'altro, quindi non farci mai affidamento.

```abap
SELECT carrid, connid, fldate, price
  FROM sflight
  WHERE carrid = 'LH'
  ORDER BY fldate DESCENDING, connid ASCENDING
  INTO TABLE @DATA(lt_sorted).
```

- Elenca una o più colonne, separate da virgole.
- `ASCENDING` è il default; `DESCENDING` inverte l'ordine. Ogni colonna ha la sua direzione.
- `ORDER BY PRIMARY KEY` ordina per i campi chiave della tabella.

Puoi anche ordinare la tabella interna in ABAP con `SORT` (vedi [Ordinare, sommare e togliere i duplicati](./0040-sorting-and-duplicates.md)). Ordina sul database quando ti serve anche `UP TO n ROWS`, perché il limite si applica dopo l'ordinamento.

## Dove mettere ogni clausola

Nella sintassi moderna le clausole seguono quest'ordine. La clausola `INTO` può anche stare subito dopo la lista di selezione, ma metterla in fondo è lo stile moderno.

```abap
SELECT carrid, connid, fldate          " 1. lista di selezione
  FROM sflight                         " 2. sorgente dati
  WHERE carrid = @p_carr               " 3. filtro
  ORDER BY fldate DESCENDING           " 4. ordinamento
  INTO TABLE @DATA(lt_result)          " 5. destinazione
  UP TO 10 ROWS.                       " 6. limite
```

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi tutti i collegamenti di `SPFLI` che partono da Francoforte o da New York e durano più di 6 ore (`FLTIME` è in minuti), ordinati per città di partenza e poi per durata, dal più lungo.
> 2. Leggi le compagnie di `SCARR` il cui nome contiene "Air" in qualsiasi posizione.

### Soluzione

```abap
REPORT zwhere_exercise.

SELECT carrid, connid, cityfrom, cityto, fltime
  FROM spfli
  WHERE ( cityfrom = 'FRANKFURT' OR cityfrom = 'NEW YORK' )
    AND fltime > 360
  ORDER BY cityfrom, fltime DESCENDING
  INTO TABLE @DATA(lt_long).

LOOP AT lt_long INTO DATA(ls_long).
  WRITE: / ls_long-cityfrom, ls_long-cityto, ls_long-carrid, ls_long-connid, ls_long-fltime.
ENDLOOP.

SELECT carrid, carrname
  FROM scarr
  WHERE carrname LIKE '%Air%'
  INTO TABLE @DATA(lt_air).

LOOP AT lt_air INTO DATA(ls_air).
  WRITE: / ls_air-carrid, ls_air-carrname.
ENDLOOP.
```

In `SPFLI` i nomi delle città sono salvati in maiuscolo, quindi confrontali in maiuscolo.

> [!NOTE]
>
> - `WHERE` filtra le righe sul database: leggi solo quello che ti serve.
> - Usa la `@` per le variabili ABAP; confronta le colonne con letterali, variabili o altre colonne.
> - Aggiungi le parentesi ogni volta che mescoli `AND` e `OR`.
> - `BETWEEN`, `IN`, `LIKE` e `IS NULL` coprono i filtri più comuni; `LIKE` distingue maiuscole e minuscole.
> - Senza `ORDER BY` l'ordine delle righe non è definito.
