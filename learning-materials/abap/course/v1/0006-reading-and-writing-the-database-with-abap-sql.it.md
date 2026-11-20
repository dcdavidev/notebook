---
title: 'Leggere e scrivere nel database: ABAP SQL'
description: SELECT, JOIN, aggregazioni, INSERT, UPDATE, DELETE, COMMIT e LUW.
---

_Settimana 2 · Livello intermedio · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                         |
| ------ | ----------------------------------------------------------------- |
| Ora 1  | SELECT di base: singola riga, più righe, WHERE, ORDER BY, UP TO   |
| Ora 2  | JOIN, aggregazioni, GROUP BY, HAVING, sottoquery, FOR ALL ENTRIES |
| Ora 3  | Espressioni SQL moderne: CASE, funzioni, CTE, UNION; prestazioni  |
| Ora 4  | Scrivere: INSERT, UPDATE, MODIFY, DELETE; COMMIT, ROLLBACK, LUW   |

## Ora 1 – SELECT di base

### Che cos'è ABAP SQL (Open SQL)

**ABAP SQL** (prima chiamato Open SQL) è la versione di SQL integrata in ABAP. Scrivi le query direttamente nel codice e SAP le traduce nel dialetto del database sottostante (HANA, Oracle...). Vantaggi:

- funziona uguale su tutti i database;
- gestisce in automatico il mandante (aggiunge da solo `WHERE mandt = sy-mandt`);
- controlla la sintassi già quando attivi il programma;
- usa il buffer delle tabelle quando possibile.

> [!TIP]
> ABAP SQL è come un interprete che parla tutte le lingue: tu gli parli sempre in "ABAP", e lui traduce per il database che ha davanti, qualunque esso sia.

Esiste anche il **Native SQL** (`EXEC SQL` o la classe ADBC `cl_sql_statement`) per comandi specifici di un database, da usare solo in casi eccezionali.

### Sintassi moderna e vecchia

Dalla versione 7.40 SP05 esiste la sintassi "strict": variabili ABAP precedute da `@` e campi separati da virgole. È quella che usiamo. La vecchia (senza `@` e senza virgole) la troverai nel codice esistente: non mescolare le due nella stessa istruzione.

```abap
* Moderna
SELECT carrid, connid, cityfrom
  FROM spfli
  WHERE carrid = @lv_carrid
  INTO TABLE @DATA(lt_voli).

* Vecchia
SELECT carrid connid cityfrom FROM spfli INTO TABLE lt_voli
  WHERE carrid = lv_carrid.
```

### Leggere una sola riga: SELECT SINGLE

```abap
DATA(lv_carrid) = 'LH'.

SELECT SINGLE carrname, currcode
  FROM scarr
  WHERE carrid = @lv_carrid
  INTO @DATA(ls_compagnia).

IF sy-subrc = 0.
  WRITE: / ls_compagnia-carrname, ls_compagnia-currcode.
ELSE.
  WRITE / 'Compagnia non trovata'.
ENDIF.
```

Usa `SELECT SINGLE` quando nella `WHERE` specifichi **tutta la chiave primaria** (risultato univoco). Altrimenti il database restituisce "una riga a caso" tra quelle che corrispondono.

```abap
* Verificare solo l'esistenza
SELECT SINGLE @abap_true FROM scarr WHERE carrid = @lv_carrid INTO @DATA(lv_esiste).
```

### Leggere più righe: INTO TABLE

```abap
SELECT carrid, connid, cityfrom, cityto, deptime
  FROM spfli
  WHERE cityfrom = 'FRANKFURT'
  ORDER BY carrid, connid
  INTO TABLE @DATA(lt_voli).

DATA(lv_quanti) = sy-dbcnt.   " numero di righe lette
```

- `ORDER BY` ordina (anche `DESCENDING`, o `ORDER BY PRIMARY KEY`).
- `UP TO n ROWS` limita il numero di righe (es. i primi 10).
- `OFFSET n` salta le prime `n` righe (paginazione).
- `APPENDING TABLE` aggiunge senza svuotare la tabella.
- `INTO CORRESPONDING FIELDS OF TABLE @lt_x` copia i campi per nome, utile quando la tabella di destinazione ha una struttura diversa.

### SELECT ... ENDSELECT (ciclo sul database)

```abap
SELECT carrid, connid FROM spfli INTO @DATA(ls_volo).
  WRITE: / ls_volo-carrid, ls_volo-connid.
ENDSELECT.
```

> [!WARNING]
> `SELECT ... ENDSELECT` legge una riga alla volta e fa molti giri tra server e database. Nella quasi totalità dei casi è meglio `INTO TABLE` e poi `LOOP AT`. **Mai mettere un `SELECT` dentro un `LOOP`**: è la causa n. 1 di programmi lenti.

### La WHERE in dettaglio

| Condizione                 | Esempio                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| Confronti                  | `WHERE prezzo >= 500`                                                  |
| `AND` / `OR` / `NOT`       | `WHERE carrid = 'LH' AND ( cityto = 'ROMA' OR cityto = 'BERLIN' )`     |
| `BETWEEN`                  | `WHERE fldate BETWEEN @lv_da AND @lv_a`                                |
| `IN` lista                 | `WHERE carrid IN ('LH', 'AZ', 'AA')`                                   |
| `IN` range / select-option | `WHERE carrid IN @s_carrid`                                            |
| `LIKE`                     | `WHERE cityto LIKE 'NEW%'` (`%` = qualsiasi testo, `_` = un carattere) |
| `IS NULL` / `IS INITIAL`   | `WHERE email IS INITIAL`                                               |
| `EXISTS`                   | `WHERE EXISTS ( SELECT ... )`                                          |

### SELECT \* e i campi necessari

`SELECT *` legge tutte le colonne. È comodo, ma se la tabella ha 200 colonne e te ne servono 3, trasferisci molti più dati del necessario. **Elenca sempre i campi che ti servono.**

## Ora 2 – JOIN, aggregazioni e FOR ALL ENTRIES

### INNER JOIN e LEFT OUTER JOIN

Un **JOIN** combina righe di più tabelle che hanno un campo in comune.

```abap
SELECT s~carrid, c~carrname, s~connid, s~cityfrom, s~cityto
  FROM spfli AS s
  INNER JOIN scarr AS c ON c~carrid = s~carrid
  WHERE s~cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_voli_compagnie).
```

- `AS s` dà un alias alla tabella; la tilde `~` separa alias e campo.
- `INNER JOIN`: solo le righe che hanno corrispondenza in **entrambe** le tabelle.
- `LEFT OUTER JOIN`: **tutte** le righe della tabella di sinistra, anche senza corrispondenza a destra (i campi di destra restano vuoti).
- Esistono anche `RIGHT OUTER JOIN` e `CROSS JOIN`.

> [!TIP]
> `INNER JOIN` è come la lista degli invitati che hanno risposto all'invito: solo chi compare in entrambe le liste. `LEFT OUTER JOIN` è la lista di tutti gli invitati, con accanto la risposta se c'è, o uno spazio vuoto se non hanno risposto.

```abap
* Tutte le compagnie, anche quelle senza voli
SELECT c~carrid, c~carrname, s~connid
  FROM scarr AS c
  LEFT OUTER JOIN spfli AS s ON s~carrid = c~carrid
  INTO TABLE @DATA(lt_tutte).
```

### Funzioni di aggregazione e GROUP BY

| Funzione                        | Significato              |
| ------------------------------- | ------------------------ |
| `COUNT(*)`                      | numero di righe          |
| `COUNT( DISTINCT campo )`       | numero di valori diversi |
| `SUM( campo )`                  | somma                    |
| `AVG( campo )`                  | media                    |
| `MIN( campo )` / `MAX( campo )` | minimo / massimo         |

```abap
SELECT carrid,
       COUNT(*)        AS num_voli,
       SUM( seatsocc ) AS posti_occupati,
       AVG( price )    AS prezzo_medio,
       MAX( price )    AS prezzo_max
  FROM sflight
  GROUP BY carrid
  HAVING COUNT(*) > 5
  ORDER BY num_voli DESCENDING
  INTO TABLE @DATA(lt_statistiche).
```

- `GROUP BY`: un risultato per ogni valore del campo di raggruppamento.
- `HAVING`: come `WHERE`, ma filtra **dopo** il raggruppamento.
- `AS`: dà un nome alla colonna calcolata.

```abap
SELECT COUNT(*) FROM sbook WHERE carrid = 'LH' INTO @DATA(lv_prenotazioni).
```

### Sottoquery

```abap
* Voli il cui prezzo è sopra la media
SELECT carrid, connid, fldate, price FROM sflight
  WHERE price > ( SELECT AVG( price ) FROM sflight )
  INTO TABLE @DATA(lt_cari).

* Compagnie che hanno almeno un volo
SELECT carrid, carrname FROM scarr AS c
  WHERE EXISTS ( SELECT carrid FROM spfli WHERE carrid = c~carrid )
  INTO TABLE @DATA(lt_attive).
```

### FOR ALL ENTRIES

Prima che esistessero JOIN potenti, il modo classico per leggere dati collegati a una tabella interna era `FOR ALL ENTRIES IN`: il `SELECT` viene eseguito per tutte le righe della tabella interna.

```abap
SELECT carrid, connid FROM spfli WHERE cityfrom = 'FRANKFURT'
  INTO TABLE @DATA(lt_spfli).

IF lt_spfli IS NOT INITIAL.          " FONDAMENTALE!
  SELECT carrid, connid, fldate, price
    FROM sflight
    FOR ALL ENTRIES IN @lt_spfli
    WHERE carrid = @lt_spfli-carrid
      AND connid = @lt_spfli-connid
    INTO TABLE @DATA(lt_sflight).
ENDIF.
```

> [!WARNING]
> Tre regole di `FOR ALL ENTRIES`:
>
> 1. Se la tabella interna è **vuota**, la `WHERE` viene ignorata e il `SELECT` legge **tutta** la tabella del database! Controlla sempre `IS NOT INITIAL`.
> 2. I **duplicati** nel risultato vengono eliminati: seleziona tutti i campi chiave per non perdere righe.
> 3. Non si possono usare `ORDER BY` e la maggior parte delle aggregazioni.
>
> Oggi, quando possibile, preferisci un JOIN o una CDS view.

### Usare una tabella interna come fonte (7.52+)

```abap
SELECT carrid, connid FROM @lt_spfli AS itab
  WHERE carrid = 'LH'
  INTO TABLE @DATA(lt_filtrati).
```

Utile per fare join tra una tabella interna e una del database (su HANA viene gestito in modo efficiente).

## Ora 3 – SQL moderno e prestazioni

### Espressioni nel SELECT

```abap
SELECT carrid, connid, fldate, price, currency,
       price * 2 AS prezzo_doppio,
       CAST( seatsocc AS FLTP ) / CAST( seatsmax AS FLTP ) * 100 AS percentuale,
       CASE
         WHEN seatsocc >= seatsmax THEN 'PIENO'
         WHEN seatsocc = 0         THEN 'VUOTO'
         ELSE 'DISPONIBILE'
       END AS stato,
       concat( carrid, connid )     AS codice_volo,
       coalesce( planetype, '???' ) AS aereo,
       @sy-uname                    AS utente
  FROM sflight
  INTO TABLE @DATA(lt_risultato).
```

Funzioni disponibili (selezione): `concat`, `concat_with_space`, `substring`, `length`, `upper`, `lower`, `lpad`, `rpad`, `replace`, `abs`, `round`, `ceil`, `floor`, `div`, `mod`, `division`, `coalesce`, `cast`, `dats_days_between`, `dats_add_days`, `dats_add_months`, `tstmp_current_utctimestamp`, `currency_conversion`, `unit_conversion`.

### Common Table Expression (WITH)

Una **CTE** è una sottoquery con un nome, che puoi riusare nella query principale (7.51+):

```abap
WITH +voli_lh AS (
  SELECT carrid, connid, cityfrom, cityto FROM spfli WHERE carrid = 'LH' )
SELECT v~connid, v~cityto, f~fldate, f~price
  FROM +voli_lh AS v
  INNER JOIN sflight AS f ON f~carrid = v~carrid AND f~connid = v~connid
  INTO TABLE @DATA(lt_cte).
```

### UNION

```abap
SELECT cityfrom AS citta FROM spfli
UNION
SELECT cityto AS citta FROM spfli
  INTO TABLE @DATA(lt_citta).   " tutte le città, senza doppioni (UNION ALL li mantiene)
```

### Dati di riferimento: valute e lingue

Quando leggi testi, filtra per lingua: `WHERE spras = @sy-langu`. Quando sommi importi, raggruppa anche per valuta: sommare euro e dollari non ha senso.

### Le 5 regole d'oro delle prestazioni SQL

1. **Leggi meno righe**: `WHERE` il più precisa possibile, usa campi indicizzati (chiave primaria in primis).
2. **Leggi meno colonne**: niente `SELECT *` se non serve.
3. **Meno viaggi al database**: niente `SELECT` nei `LOOP`; usa JOIN, `FOR ALL ENTRIES` o tabelle interne come fonte.
4. **Lascia lavorare il database**: aggregazioni, somme e filtri in SQL, non in ABAP (su HANA questo vale ancora di più: "code pushdown", giorno 14).
5. **Usa il buffer**: le tabelle bufferizzate vengono lette dalla memoria; alcune clausole (JOIN, aggregazioni, `BYPASSING BUFFER`) lo saltano.

> [!TIP]
> Andare al database è come andare al supermercato. Fare un `SELECT` dentro un `LOOP` è come andare al supermercato 100 volte per comprare 100 prodotti, uno alla volta. Un `SELECT` con JOIN è come andare una volta con la lista completa.

### Blocchi di righe: PACKAGE SIZE e cursori

Per milioni di righe, leggere tutto in memoria può esaurirla. Si legge a pacchetti:

```abap
SELECT carrid, connid, fldate FROM sflight
  INTO TABLE @DATA(lt_pacchetto) PACKAGE SIZE 10000.
  " elabora 10.000 righe alla volta
ENDSELECT.

* Oppure con un cursore
OPEN CURSOR @DATA(lv_cursore) FOR SELECT * FROM sbook.
DO.
  FETCH NEXT CURSOR @lv_cursore INTO TABLE @DATA(lt_blocco) PACKAGE SIZE 5000.
  IF sy-subrc <> 0. EXIT. ENDIF.
  " elabora lt_blocco
ENDDO.
CLOSE CURSOR @lv_cursore.
```

## Ora 4 – Scrivere nel database

> [!WARNING]
> Regola fondamentale: **non si scrive mai direttamente nelle tabelle standard SAP** (`VBAK`, `BKPF`, `MARA`...). Si salterebbero tutti i controlli e si corromperebbero i dati. Per i dati standard si usano BAPI e API ufficiali (giorni 7 e 13). `INSERT`/`UPDATE`/`DELETE` si usano solo sulle tue tabelle Z.

### INSERT

```abap
DATA ls_ordine TYPE zordini_corso.

ls_ordine = VALUE #( ordine   = '0000000001' cliente = '0000001000'
                     data_ord = sy-datum     importo = '150.00' valuta = 'EUR'
                     stato    = 'N' ).

INSERT zordini_corso FROM @ls_ordine.
IF sy-subrc <> 0.
  WRITE 'Ordine già esistente'.        " sy-subrc = 4: chiave duplicata
ENDIF.

* Più righe in una volta
INSERT zordini_corso FROM TABLE @lt_ordini.                          " dump se c'è un duplicato
INSERT zordini_corso FROM TABLE @lt_ordini ACCEPTING DUPLICATE KEYS. " salta i duplicati, sy-subrc = 4
```

### UPDATE

```abap
* Riga intera (identificata dalla chiave nella struttura)
ls_ordine-stato = 'L'.
UPDATE zordini_corso FROM @ls_ordine.

* Solo alcuni campi, con condizione
UPDATE zordini_corso SET stato = 'C'
  WHERE data_ord < @lv_limite AND stato = 'L'.
WRITE |Ordini chiusi: { sy-dbcnt }|.
```

> [!WARNING]
> Un `UPDATE ... SET` senza `WHERE` modifica **tutte** le righe della tabella. Ricontrolla sempre prima di eseguire.

### MODIFY (inserisce o aggiorna)

```abap
MODIFY zordini_corso FROM @ls_ordine.        " se la chiave esiste aggiorna, altrimenti inserisce
MODIFY zordini_corso FROM TABLE @lt_ordini.
```

### DELETE

```abap
DELETE zordini_corso FROM @ls_ordine.              " per chiave
DELETE FROM zordini_corso WHERE stato = 'C'.       " per condizione
```

### La LUW (Logical Unit of Work)

Una **LUW** è un insieme di modifiche che devono avvenire **tutte insieme o per niente**.

> [!TIP]
> Pensa a un bonifico: togliere 100 euro dal conto A e aggiungerli al conto B sono due operazioni. Se la seconda fallisce, la prima deve essere annullata, altrimenti i soldi spariscono. LUW = "o tutto o niente".

- `COMMIT WORK.` conferma definitivamente tutte le modifiche fatte dall'ultimo commit.
- `ROLLBACK WORK.` annulla tutte le modifiche non ancora confermate.
- `COMMIT WORK AND WAIT.` aspetta che anche gli aggiornamenti asincroni (update task) siano completati.

```abap
INSERT zordini_corso FROM @ls_ordine1.
DATA(lv_ok) = xsdbool( sy-subrc = 0 ).
INSERT zordini_corso FROM @ls_ordine2.

IF lv_ok = abap_true AND sy-subrc = 0.
  COMMIT WORK.
ELSE.
  ROLLBACK WORK.
ENDIF.
```

### LUW di database e LUW SAP

Esistono due livelli di LUW:

- **LUW di database**: il database fa un commit implicito a ogni cambio di schermata, a ogni chiamata RFC, a ogni messaggio di tipo dialogo. Quindi una transazione SAP con più schermate non può tenere tutto in un'unica LUW di database.
- **LUW SAP**: SAP raccoglie le modifiche durante tutte le schermate e le scrive solo alla fine, al `COMMIT WORK`, usando:
  - moduli funzione di aggiornamento (`CALL FUNCTION ... IN UPDATE TASK`): vengono registrati e poi eseguiti tutti insieme al `COMMIT` (giorno 13);
  - subroutine `PERFORM ... ON COMMIT`.

Gli errori negli update task si vedono in **SM13**. Nel modello RAP (giorno 15) tutto questo è gestito dal framework.

> [!WARNING]
> In ABAP Cloud e nei metodi RAP le istruzioni `COMMIT`/`ROLLBACK` sono spesso vietate: il framework decide quando confermare. Nei report classici invece sono responsabilità tua.

## Esercizi

> [!IMPORTANT]
>
> 1. Leggi con `SELECT SINGLE` il nome della compagnia `'AZ'` da `SCARR`.
> 2. Leggi tutti i voli (`SPFLI`) da `'ROME'` o `'FRANKFURT'` ordinati per orario di partenza, solo i campi `carrid`, `connid`, `cityfrom`, `cityto`, `deptime`.
> 3. Con un JOIN tra `SPFLI` e `SCARR` stampa nome della compagnia, numero volo, città di partenza e arrivo.
> 4. Con `GROUP BY` calcola per ogni compagnia il numero di voli in `SFLIGHT`, il prezzo medio e il totale dei posti occupati. Mostra solo le compagnie con più di 10 voli.
> 5. Rifai l'esercizio 3 con `FOR ALL ENTRIES` (prima `SPFLI`, poi `SCARR`) e confronta i tempi con la transazione SAT.
> 6. Inserisci 3 ordini nella tua tabella `ZORDINI_CORSO`, aggiornane uno, cancellane un altro, fai `COMMIT` e verifica con SE16N. Poi rifai tutto con `ROLLBACK` e verifica che non sia cambiato nulla.
> 7. Con un `CASE` nel `SELECT` classifica i voli di `SFLIGHT` in "Economico" (< 500), "Medio" (< 1000), "Caro".

## Quiz

1. Perché in ABAP SQL non serve scrivere la condizione sul mandante?
2. Quando è corretto usare `SELECT SINGLE`?
3. Che cosa succede con `FOR ALL ENTRIES` se la tabella interna è vuota?
4. Differenza tra `INNER JOIN` e `LEFT OUTER JOIN`?
5. Differenza tra `WHERE` e `HAVING`?
6. Che cosa fa `MODIFY` su una tabella del database?
7. Perché non si scrive con `INSERT`/`UPDATE` nelle tabelle standard SAP?
8. Che cos'è una LUW?

## Soluzioni

```abap
REPORT zes06_soluzioni.

START-OF-SELECTION.
* Es. 1
  SELECT SINGLE carrname FROM scarr WHERE carrid = 'AZ' INTO @DATA(lv_nome).
  WRITE / lv_nome.

* Es. 2
  SELECT carrid, connid, cityfrom, cityto, deptime FROM spfli
    WHERE cityfrom IN ('ROME', 'FRANKFURT')
    ORDER BY deptime
    INTO TABLE @DATA(lt_spfli).

* Es. 3
  SELECT c~carrname, s~connid, s~cityfrom, s~cityto
    FROM spfli AS s INNER JOIN scarr AS c ON c~carrid = s~carrid
    INTO TABLE @DATA(lt_join).
  LOOP AT lt_join INTO DATA(ls_j).
    WRITE: / ls_j-carrname, ls_j-connid, ls_j-cityfrom, ls_j-cityto.
  ENDLOOP.

* Es. 4
  SELECT carrid, COUNT(*) AS voli, AVG( price ) AS medio, SUM( seatsocc ) AS posti
    FROM sflight GROUP BY carrid HAVING COUNT(*) > 10
    INTO TABLE @DATA(lt_stat).

* Es. 7
  SELECT carrid, connid, fldate, price,
         CASE WHEN price < 500  THEN 'Economico'
              WHEN price < 1000 THEN 'Medio'
              ELSE 'Caro' END AS fascia
    FROM sflight INTO TABLE @DATA(lt_fasce).
```

Quiz:

1. Perché ABAP SQL aggiunge automaticamente il filtro sul mandante corrente.
2. Quando la `WHERE` contiene l'intera chiave primaria (o vuoi solo sapere se esiste almeno una riga).
3. La `WHERE` viene ignorata e si legge l'intera tabella.
4. `INNER`: solo righe con corrispondenza in entrambe; `LEFT OUTER`: tutte le righe di sinistra anche senza corrispondenza.
5. `WHERE` filtra le righe prima del raggruppamento, `HAVING` i gruppi dopo.
6. Aggiorna se la chiave esiste, altrimenti inserisce.
7. Si saltano controlli, dipendenze e log: i dati diventerebbero incoerenti; si usano BAPI/API.
8. Un insieme di modifiche che devono essere confermate tutte insieme o annullate tutte insieme.

> [!NOTE]
> Oggi hai imparato: ABAP SQL in lettura (`SELECT`, JOIN, aggregazioni, sottoquery, `FOR ALL ENTRIES`, CTE, espressioni) e in scrittura (`INSERT`, `UPDATE`, `MODIFY`, `DELETE`), le regole di prestazione, `COMMIT`, `ROLLBACK` e la LUW. Domani: dividere il codice in blocchi riutilizzabili.
