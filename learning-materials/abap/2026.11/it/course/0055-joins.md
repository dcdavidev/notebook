---
title: I join
description: INNER JOIN e LEFT OUTER JOIN fra più tabelle.
level: basic
---

I dati di business sono distribuiti su più tabelle. Il nome della compagnia aerea sta in `SCARR`, i suoi collegamenti in `SPFLI` e i singoli voli in `SFLIGHT`. Un **join** combina le righe di due o più tabelle in una sola `SELECT`, facendo corrispondere le colonne che hanno in comune.

Un join è quasi sempre meglio di più `SELECT` e cicli in ABAP: l'abbinamento lo fa il database, e al tuo programma arriva solo il risultato combinato.

## INNER JOIN

Un **inner join** restituisce solo le righe che hanno una corrispondenza da entrambe le parti. Questa query elenca ogni collegamento con il nome della sua compagnia:

```abap
REPORT zjoin_demo.

SELECT scarr~carrid, scarr~carrname, spfli~connid, spfli~cityfrom, spfli~cityto
  FROM scarr
  INNER JOIN spfli ON spfli~carrid = scarr~carrid
  INTO TABLE @DATA(lt_connections).

LOOP AT lt_connections INTO DATA(ls_conn).
  WRITE: / ls_conn-carrname, ls_conn-connid, ls_conn-cityfrom, ls_conn-cityto.
ENDLOOP.
```

- `ON` indica la **condizione di join**: quali colonne devono coincidere.
- Il **selettore di colonna** `~` dice da quale tabella viene una colonna: `scarr~carrid`. Ti serve quando lo stesso nome di colonna esiste in più tabelle, e rende ogni query più leggibile.
- La tabella inline ha un componente per ogni colonna, con il nome della colonna: `carrid`, `carrname`, `connid` e così via.

Una compagnia senza collegamenti non compare nel risultato: un inner join scarta le righe senza corrispondenza.

> [!TIP]
> Un inner join è come abbinare gli invitati alla disposizione dei tavoli. Nella lista finale finiscono solo le persone che hanno sia l'invito sia un posto assegnato. Un invitato senza posto, o un posto senza invitato, non c'è.

## Gli alias delle tabelle

I nomi lunghi delle tabelle rendono i join difficili da leggere. Dai a ogni tabella un **alias** breve con `AS` e usalo in tutta la query:

```abap
SELECT c~carrname, p~connid, f~fldate, f~price, f~currency
  FROM scarr AS c
  INNER JOIN spfli   AS p ON p~carrid = c~carrid
  INNER JOIN sflight AS f ON f~carrid = p~carrid
                         AND f~connid = p~connid
  WHERE c~carrid = 'LH'
  ORDER BY p~connid, f~fldate
  INTO TABLE @DATA(lt_flights).
```

Questa query mette in join tre tabelle. `SFLIGHT` richiede due colonne nella condizione, perché un volo appartiene a un collegamento tramite sia `CARRID` sia `CONNID`. Se ne dimentichi una, ogni volo viene abbinato anche ai collegamenti sbagliati.

> [!WARNING]
> Fai sempre il join sulla chiave **completa** che collega le tabelle. Una colonna mancante nella condizione `ON` non dà errore: moltiplica le righe in silenzio, e i totali del tuo report sono sbagliati.

Puoi anche rinominare una colonna del risultato con `AS`, per esempio `p~cityfrom AS departure`. Il componente della tabella interna si chiama allora `departure`.

## LEFT OUTER JOIN

Un **left outer join** restituisce tutte le righe della tabella di sinistra, con o senza corrispondenza. Quando la corrispondenza manca, le colonne della tabella di destra sono vuote.

```abap
SELECT c~carrid, c~carrname, p~connid
  FROM scarr AS c
  LEFT OUTER JOIN spfli AS p ON p~carrid = c~carrid
  ORDER BY c~carrid, p~connid
  INTO TABLE @DATA(lt_all_airlines).

LOOP AT lt_all_airlines INTO DATA(ls_airline).
  IF ls_airline-connid IS INITIAL.
    WRITE: / ls_airline-carrid, ls_airline-carrname, 'non ha collegamenti'.
  ELSE.
    WRITE: / ls_airline-carrid, ls_airline-carrname, ls_airline-connid.
  ENDIF.
ENDLOOP.
```

Sul database le colonne mancanti sono **null**. ABAP non ha il valore nullo, quindi arrivano nel tuo programma come valori iniziali: `connid` vale `'0000'`, un testo è vuoto, un numero vale `0`.

Per trovare solo le compagnie senza collegamenti, filtra sul valore nullo nella `WHERE`:

```abap
SELECT c~carrid, c~carrname
  FROM scarr AS c
  LEFT OUTER JOIN spfli AS p ON p~carrid = c~carrid
  WHERE p~connid IS NULL
  INTO TABLE @DATA(lt_no_connections).
```

Esiste anche `RIGHT OUTER JOIN`, che tiene tutte le righe della tabella di destra. Scambiare le tabelle in un left join dà lo stesso risultato ed è più facile da leggere.

## Inner o outer

| Domanda                                                                      | Join                          |
| ---------------------------------------------------------------------------- | ----------------------------- |
| Mostrare solo le righe che hanno dati da entrambe le parti                   | `INNER JOIN`                  |
| Mostrare tutte le righe della tabella principale, anche senza corrispondenza | `LEFT OUTER JOIN`             |
| Trovare le righe senza corrispondenza                                        | `LEFT OUTER JOIN` + `IS NULL` |

Una condizione `WHERE` sulla tabella di destra di un outer join elimina le righe in cui quella tabella è nulla. Se vuoi restringere la parte destra ma tenere tutte le righe di sinistra, metti la condizione nella clausola `ON`.

I join su più di poche tabelle diventano difficili da mantenere. Quando riusi lo stesso join in molti programmi, definiscilo una volta sola come [CDS view entity](./0132-cds-view-entities.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Elenca tutte le prenotazioni del cliente `1` in `SBOOK`, con il nome del cliente da `SCUSTOM` e il nome della compagnia da `SCARR`.
> 2. Elenca i clienti il cui nome comincia con "A" insieme alle loro prenotazioni, compresi i clienti che non hanno mai prenotato.

### Soluzione

```abap
REPORT zjoin_exercise.

SELECT b~bookid, b~carrid, b~connid, b~fldate, s~name, c~carrname
  FROM sbook AS b
  INNER JOIN scustom AS s ON s~id = b~customid
  INNER JOIN scarr   AS c ON c~carrid = b~carrid
  WHERE b~customid = '00000001'
  INTO TABLE @DATA(lt_bookings).

SELECT s~id, s~name, b~carrid, b~connid, b~fldate, b~bookid
  FROM scustom AS s
  LEFT OUTER JOIN sbook AS b ON b~customid = s~id
  WHERE s~name LIKE 'A%'
  ORDER BY s~id
  INTO TABLE @DATA(lt_customers).
```

Il numero cliente `CUSTOMID` è un testo numerico di 8 cifre, quindi il letterale è `'00000001'`.

> [!NOTE]
>
> - Un join combina le righe di più tabelle in una sola `SELECT`, con le colonne da far coincidere in `ON`.
> - `INNER JOIN` tiene solo le righe con corrispondenza; `LEFT OUTER JOIN` tiene tutte le righe della tabella di sinistra.
> - Usa `~` per dire a quale tabella appartiene una colonna e `AS` per gli alias brevi.
> - Fai il join sulla chiave di collegamento completa, altrimenti le righe si moltiplicano.
> - Le colonne senza corrispondenza sono null sul database e arrivano in ABAP come valori iniziali.
