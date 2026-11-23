---
title: ABAP SQL avanzato
description: Common table expression, window function e SELECT da tabelle interne.
level: intermediate
---

Con la [sintassi moderna](./0097-modern-abap-sql.md), ABAP SQL offre funzionalità che prima richiedevano più query e molto codice ABAP: le **common table expression** per costruire una query a passi, le **window function** per calcolare classifiche e totali progressivi, e la `SELECT` sulle **tabelle interne** per unire dati in memoria e dati nel database.

Girano tutte in una sola istruzione sul database, quindi spostano meno dati e richiedono meno round trip. Servono release recenti: le common table expression esistono da ABAP 7.51, la `SELECT` da tabelle interne dalla 7.52 e le window function dalla 7.54.

## Le common table expression

Una **common table expression** (CTE) è una subquery con un nome, che definisci con `WITH` e poi usi come una tabella nella query principale. Il suo nome inizia con `+`.

```abap
WITH
  +bookings AS (
    SELECT FROM sbook
      FIELDS carrid, connid, COUNT(*) AS cnt
      WHERE cancelled = @abap_false
      GROUP BY carrid, connid ),
  +busy AS (
    SELECT FROM +bookings
      FIELDS carrid, connid, cnt
      WHERE cnt > 100 )
SELECT FROM +busy AS b
  INNER JOIN spfli AS p
    ON p~carrid = b~carrid AND p~connid = b~connid
  FIELDS b~carrid, b~connid, p~cityfrom, p~cityto, b~cnt
  ORDER BY b~cnt DESCENDING
  INTO TABLE @DATA(lt_busy).
```

- Ogni CTE può leggere le CTE definite prima di lei.
- Ogni CTE che definisci deve essere usata in una CTE successiva o nella query principale.
- Solo la query principale ha una clausola `INTO`.

Usa una CTE quando una query ha bisogno di un risultato intermedio: un aggregato che poi filtri, metti in join o aggreghi di nuovo.

> [!TIP]
> Una CTE è come il foglio di brutta accanto a un calcolo lungo: scrivi un risultato parziale, gli dai un nome e lo usi nella riga successiva. Solo l'ultima riga finisce nella relazione.

## Le window function

Un aggregato con `GROUP BY` restituisce una riga per gruppo. Una **window function** restituisce un valore per **ogni riga**, calcolato su un insieme di righe correlate chiamato finestra. Definisci la finestra con `OVER( )`:

- `PARTITION BY` divide le righe in gruppi (come `GROUP BY`, ma le righe restano).
- `ORDER BY` stabilisce l'ordine dentro ogni partizione, necessario per classifiche e totali progressivi.

```abap
SELECT FROM sflight
  FIELDS carrid,
         connid,
         fldate,
         seatsocc,
         ROW_NUMBER( ) OVER( PARTITION BY carrid
                             ORDER BY seatsocc DESCENDING ) AS row_no,
         RANK( )       OVER( PARTITION BY carrid
                             ORDER BY seatsocc DESCENDING ) AS rank_no,
         SUM( seatsocc ) OVER( PARTITION BY carrid )         AS carrier_total,
         SUM( seatsocc ) OVER( PARTITION BY carrid, connid
                               ORDER BY fldate )             AS running_total
  INTO TABLE @DATA(lt_ranking).
```

| Funzione                            | Restituisce                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `ROW_NUMBER( )`                     | 1, 2, 3, ... nell'ordine della finestra                                       |
| `RANK( )`                           | la posizione; righe con valori uguali hanno la stessa posizione, poi un salto |
| `DENSE_RANK( )`                     | come `RANK( )`, ma senza salti                                                |
| `SUM`, `AVG`, `MIN`, `MAX`, `COUNT` | l'aggregato sulla finestra; con `ORDER BY`, un valore progressivo             |
| `LEAD( )`, `LAG( )`                 | un valore della riga successiva o precedente (da ABAP 7.55)                   |

Non puoi filtrare su una window function nella clausola `WHERE` della stessa query, perché `WHERE` viene eseguita prima. Metti la query in una CTE e filtra nella query principale. Questa restituisce i tre voli più pieni di ogni compagnia:

```abap
WITH +ranked AS (
  SELECT FROM sflight
    FIELDS carrid, connid, fldate, seatsocc,
           ROW_NUMBER( ) OVER( PARTITION BY carrid
                               ORDER BY seatsocc DESCENDING ) AS row_no )
SELECT FROM +ranked
  FIELDS carrid, connid, fldate, seatsocc
  WHERE row_no <= 3
  INTO TABLE @DATA(lt_top3).
```

## SELECT da tabelle interne

Una tabella interna può essere la sorgente dati di una `SELECT`, con `FROM @itab AS alias`. L'alias è obbligatorio.

```abap
TYPES: BEGIN OF ty_request,
         carrid TYPE s_carr_id,
         connid TYPE s_conn_id,
       END OF ty_request,
       tt_request TYPE STANDARD TABLE OF ty_request WITH EMPTY KEY.

DATA(lt_requests) = VALUE tt_request(
  ( carrid = 'LH' connid = '0400' )
  ( carrid = 'AZ' connid = '0555' ) ).

SELECT FROM sflight AS f
  INNER JOIN @lt_requests AS r
    ON f~carrid = r~carrid AND f~connid = r~connid
  FIELDS f~carrid, f~connid, f~fldate, f~price
  INTO TABLE @DATA(lt_selected).
```

Il join con una tabella interna è un'alternativa moderna a [FOR ALL ENTRIES](./0057-for-all-entries.md): non si rompe con una tabella vuota (il join semplicemente non restituisce righe), non elimina duplicati a tua insaputa e puoi combinarlo con aggregati e `ORDER BY`.

Puoi anche aggregare o ordinare con l'SQL una tabella interna da sola:

```abap
SELECT FROM @lt_selected AS s
  FIELDS carrid, COUNT(*) AS flights, MAX( price ) AS max_price
  GROUP BY carrid
  INTO TABLE @DATA(lt_summary).
```

> [!WARNING]
> Quando una `SELECT` legge una tabella interna insieme a tabelle del database, la tabella interna viene inviata al database. Su SAP HANA è veloce, ma non inviare tabelle con centinaia di migliaia di righe. Sui database che non supportano la funzionalità, il controllo di sintassi mostra un warning; leggilo prima di nasconderlo con il pragma `##itab_db_select`.

## Esercizio

> [!IMPORTANT]
>
> 1. Con una window function, leggi ogni volo di `SFLIGHT` con il suo prezzo e il prezzo medio della sua compagnia (`AVG( price ) OVER( PARTITION BY carrid )`).
> 2. Racchiudi la query in una CTE e tieni solo i voli che costano più della media della compagnia.

### Soluzione

```abap
WITH +prices AS (
  SELECT FROM sflight
    FIELDS carrid, connid, fldate, price,
           AVG( price AS DEC( 15, 2 ) ) OVER( PARTITION BY carrid ) AS avg_price )
SELECT FROM +prices
  FIELDS carrid, connid, fldate, price, avg_price
  WHERE price > avg_price
  ORDER BY carrid, price DESCENDING
  INTO TABLE @DATA(lt_expensive).

cl_demo_output=>display( lt_expensive ).
```

`AVG( ... AS DEC( 15, 2 ) )` stabilisce il tipo del risultato; senza, `AVG` restituisce un numero in virgola mobile.

> [!NOTE]
>
> - Una CTE (`WITH +nome AS ( ... )`) è un risultato intermedio con un nome, che le query successive usano come una tabella.
> - Le window function con `OVER( PARTITION BY ... ORDER BY ... )` restituiscono un valore per ogni riga: classifiche, totali, somme progressive.
> - Per filtrare su una window function, calcolala in una CTE e filtra nella query principale.
> - `FROM @itab AS alias` legge una tabella interna con l'SQL, da sola o in join con tabelle del database.
> - Controlla la release: le CTE richiedono la 7.51, le tabelle interne come sorgente la 7.52, le window function la 7.54.
