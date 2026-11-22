---
title: Subquery e UNION
description: EXISTS, IN con una subquery e la combinazione di risultati.
---

_Livello base_

Una **subquery** è una `SELECT` dentro la clausola `WHERE` o `HAVING` di un'altra `SELECT`. Ti permette di filtrare in base a una domanda su un'altra tabella: "le compagnie che hanno almeno un collegamento", "i voli più cari della media". Il database risponde a tutto con una sola istruzione.

`UNION` va nella direzione opposta: mette i risultati di due query uno dopo l'altro in un unico risultato, per esempio le partenze e gli arrivi di una stessa città.

## EXISTS

`EXISTS ( subquery )` è vero se la subquery restituisce almeno una riga. È il modo più chiaro per chiedere "esiste una riga collegata?":

```abap
REPORT zsubquery_demo.

" Compagnie che hanno almeno un collegamento
SELECT carrid, carrname
  FROM scarr
  WHERE EXISTS ( SELECT * FROM spfli WHERE carrid = scarr~carrid )
  INTO TABLE @DATA(lt_active).

" Compagnie senza nessun collegamento
SELECT carrid, carrname
  FROM scarr
  WHERE NOT EXISTS ( SELECT * FROM spfli WHERE carrid = scarr~carrid )
  INTO TABLE @DATA(lt_inactive).
```

La subquery fa riferimento alla tabella esterna con `scarr~carrid`. Una subquery che usa colonne della query esterna si chiama **correlata**: il database la valuta per ogni riga di `SCARR`. Con `EXISTS` la lista di selezione della subquery non conta, perché conta solo l'esistenza di una riga; di solito si scrive `SELECT *`.

Confronta `NOT EXISTS` con il `LEFT OUTER JOIN ... IS NULL` visto in [I join](./0055-joins.md): entrambi trovano le compagnie senza collegamenti, ma `NOT EXISTS` lo dice in modo più diretto e non produce mai duplicati.

> [!TIP]
> `EXISTS` è come chiedere alla reception di un albergo "c'è qualcuno della mia azienda che alloggia qui?". Il receptionist controlla il registro e risponde sì o no. Non ti dà l'elenco dei nomi, solo la risposta.

## IN con una subquery

`col IN ( subquery )` è vero se il valore della colonna è fra i valori restituiti dalla subquery. La subquery deve restituire esattamente una colonna:

```abap
" Collegamenti che hanno almeno un volo tutto esaurito
SELECT carrid, connid, cityfrom, cityto
  FROM spfli
  WHERE connid IN ( SELECT connid FROM sflight
                      WHERE carrid   = spfli~carrid
                        AND seatsocc >= seatsmax )
  INTO TABLE @DATA(lt_full_connections).
```

`NOT IN ( subquery )` dà il contrario.

## Il confronto con un singolo valore

Una subquery che restituisce un solo valore può stare a destra di un confronto. Si chiama **subquery scalare**:

```abap
" I voli più cari
SELECT carrid, connid, fldate, price
  FROM sflight
  WHERE price = ( SELECT MAX( price ) FROM sflight )
  INTO TABLE @DATA(lt_top).

" I voli più cari della media della loro compagnia
SELECT carrid, connid, fldate, price
  FROM sflight AS f
  WHERE price > ( SELECT AVG( price ) FROM sflight WHERE carrid = f~carrid )
  INTO TABLE @DATA(lt_above_average).
```

> [!WARNING]
> Una subquery scalare deve restituire al massimo una riga. Se ne restituisce di più, l'istruzione termina con un errore a runtime. Per esserne sicuro usa un aggregato come `MAX` o `AVG`, oppure una condizione sulla chiave completa. Per i confronti "con almeno uno" o "con tutti" usa `ANY` o `ALL`: `WHERE price > ALL ( SELECT price FROM ... )`.

## UNION

`UNION` combina le righe di due o più `SELECT` in un unico risultato. È disponibile da ABAP 7.56 (SAP S/4HANA 2021); nei rilasci precedenti esegui due `SELECT` e usa `APPENDING TABLE` per la seconda.

```abap
" Tutti i collegamenti che toccano Francoforte, in partenza o in arrivo
SELECT carrid, connid, cityto AS other_city, 'D' AS direction
  FROM spfli
  WHERE cityfrom = 'FRANKFURT'
UNION ALL
SELECT carrid, connid, cityfrom AS other_city, 'A' AS direction
  FROM spfli
  WHERE cityto = 'FRANKFURT'
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_frankfurt).
```

Le regole:

- Ogni `SELECT` deve avere lo stesso numero di colonne, con tipi compatibili. I nomi delle colonne del risultato vengono dalla prima `SELECT`.
- `UNION ALL` tiene tutte le righe, duplicati compresi. `UNION` (o `UNION DISTINCT`) elimina le righe duplicate, e questo costa lavoro in più al database.
- `ORDER BY` e `INTO` compaiono una volta sola, alla fine, e valgono per l'intero risultato.

Usa `UNION ALL` quando sai che le parti non possono sovrapporsi, come qui: un collegamento non può partire da Francoforte e arrivare a Francoforte nello stesso momento.

I rilasci più recenti supportano anche `INTERSECT` (righe presenti in entrambi i risultati) ed `EXCEPT` (righe presenti nel primo ma non nel secondo), con le stesse regole.

## Esercizio

> [!IMPORTANT]
>
> 1. Elenca i clienti di `SCUSTOM` che hanno almeno una prenotazione non annullata (`SBOOK-CANCELLED` vuoto).
> 2. Elenca i voli di `SFLIGHT` il cui prezzo è il più basso del loro collegamento.

### Soluzione

```abap
REPORT zsubquery_exercise.

SELECT id, name, city
  FROM scustom
  WHERE EXISTS ( SELECT * FROM sbook
                   WHERE customid  = scustom~id
                     AND cancelled = @abap_false )
  INTO TABLE @DATA(lt_customers).

SELECT carrid, connid, fldate, price
  FROM sflight AS f
  WHERE price = ( SELECT MIN( price ) FROM sflight
                    WHERE carrid = f~carrid
                      AND connid = f~connid )
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_cheapest).
```

Se due voli dello stesso collegamento hanno lo stesso prezzo minimo, nel secondo risultato compaiono entrambi.

> [!NOTE]
>
> - Una subquery è una `SELECT` dentro la `WHERE` o la `HAVING` di un'altra `SELECT`.
> - `EXISTS` e `NOT EXISTS` controllano se esistono righe collegate; fai riferimento alla tabella esterna con `~`.
> - `IN ( subquery )` confronta con un elenco di una colonna; una subquery scalare deve restituire un solo valore.
> - `UNION ALL` accoda i risultati; `UNION` elimina anche i duplicati. Entrambi richiedono colonne corrispondenti.
> - `UNION` richiede ABAP 7.56 o successivo.
