---
title: 'Scrivere dati: INSERT, UPDATE, MODIFY, DELETE'
description: Modificare il contenuto delle tabelle del database.
level: basic
---

Leggere è solo metà del lavoro. ABAP SQL ha quattro istruzioni che modificano il contenuto di una tabella del database: `INSERT` aggiunge righe, `UPDATE` le modifica, `MODIFY` aggiunge o modifica, e `DELETE` le elimina.

Gli esempi usano `ZSCARR`, una copia di `SCARR` con i campi `MANDT`, `CARRID`, `CARRNAME`, `CURRCODE` e `URL` (creala come in [Le tabelle del database](./0046-database-tables.md)). Esercitati solo sulle tue tabelle Z.

> [!CAUTION]
> Non scrivere mai direttamente nelle tabelle standard SAP come `MARA`, `VBAK` o `BKPF`. Salti tutti i controlli e tutte le tabelle collegate, e i dati diventano incoerenti. Modifica i dati standard solo tramite BAPI, moduli funzione o API rilasciate (vedi [Le BAPI](./0071-bapis.md)).

## INSERT

`INSERT` aggiunge una nuova riga. Se esiste già una riga con la stessa chiave primaria, non viene scritto niente e `sy-subrc` vale `4`.

```abap
REPORT zinsert_demo.

DATA ls_carrier TYPE zscarr.

ls_carrier-carrid   = 'ZZ'.
ls_carrier-carrname = 'Notebook Air'.
ls_carrier-currcode = 'EUR'.

INSERT zscarr FROM @ls_carrier.

IF sy-subrc = 0.
  WRITE: / 'Compagnia aggiunta'.
ELSE.
  WRITE: / 'La compagnia', ls_carrier-carrid, 'esiste già'.
ENDIF.
```

`MANDT` non lo riempi: ABAP SQL scrive sempre nel mandante corrente, qualunque cosa contenga la work area.

Per inserire molte righe in una volta usa `FROM TABLE`. È molto più veloce di un `INSERT` per riga dentro un ciclo:

```abap
DATA lt_carriers TYPE STANDARD TABLE OF zscarr WITH EMPTY KEY.

lt_carriers = VALUE #( ( carrid = 'Z1' carrname = 'First Air'  currcode = 'EUR' )
                       ( carrid = 'Z2' carrname = 'Second Air' currcode = 'USD' ) ).

INSERT zscarr FROM TABLE @lt_carriers ACCEPTING DUPLICATE KEYS.
WRITE: / sy-dbcnt, 'righe inserite'.
```

> [!WARNING]
> Senza `ACCEPTING DUPLICATE KEYS`, una chiave duplicata in `FROM TABLE` fa terminare il programma con un errore a runtime. Con questa aggiunta i duplicati vengono saltati, le altre righe vengono inserite e `sy-subrc` vale `4`.

## UPDATE

`UPDATE ... FROM` sovrascrive una riga esistente, trovata in base alla chiave primaria. Se la riga non esiste, non succede niente e `sy-subrc` vale `4`.

```abap
ls_carrier-carrid   = 'ZZ'.
ls_carrier-carrname = 'Notebook Airlines'.
ls_carrier-currcode = 'EUR'.

UPDATE zscarr FROM @ls_carrier.        " tutti i campi non chiave vengono sovrascritti
```

Viene scritto ogni campo della work area, quindi un campo che hai lasciato vuoto diventa vuoto nel database. Per modificare solo alcune colonne usa `SET` con una `WHERE`:

```abap
UPDATE zscarr
  SET currcode = 'USD'
  WHERE carrid = 'Z1'.

UPDATE zscarr
  SET url = 'https://example.com'
  WHERE currcode = 'EUR'.              " può modificare molte righe

WRITE: / sy-dbcnt, 'righe modificate'.
```

`UPDATE ... FROM TABLE @itab` modifica molte righe in una volta, in base alla chiave.

## MODIFY

`MODIFY` inserisce la riga se la sua chiave non esiste e la modifica se esiste. È comodo quando non sai, o non ti interessa, quale dei due casi si applica, per esempio quando carichi dati da un file.

```abap
MODIFY zscarr FROM @ls_carrier.               " una riga
MODIFY zscarr FROM TABLE @lt_carriers.        " molte righe
```

`sy-subrc` vale `0` quando tutte le righe sono state scritte.

> [!TIP]
> `INSERT` è aggiungere un nuovo contatto in rubrica: se il nome c'è già, il telefono si rifiuta. `UPDATE` è modificare un contatto che deve già esistere. `MODIFY` è "salva": il telefono crea il contatto o lo sovrascrive, a seconda di cosa serve.

## DELETE

`DELETE` elimina righe, in base alla chiave di una work area o di una tabella, oppure in base a una condizione:

```abap
DELETE zscarr FROM @ls_carrier.               " per la chiave della work area
DELETE zscarr FROM TABLE @lt_carriers.        " per le chiavi delle righe della tabella

DELETE FROM zscarr WHERE carrid LIKE 'Z%'.    " per una condizione
WRITE: / sy-dbcnt, 'righe eliminate'.
```

> [!CAUTION]
> `DELETE FROM zscarr` senza `WHERE` elimina **tutte** le righe della tabella nel mandante corrente. Ricontrolla la `WHERE` di ogni `DELETE` e di ogni `UPDATE ... SET` prima di eseguirli, e prova su un sistema di sviluppo.

## `sy-subrc`, `sy-dbcnt` e i passi successivi

| Istruzione | `sy-subrc = 0`                       | `sy-subrc = 4`                                                            |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------- |
| `INSERT`   | tutte le righe inserite              | una chiave esiste già (quella riga viene saltata)                         |
| `UPDATE`   | le righe sono state modificate       | nessuna riga trovata, o con `FROM TABLE` almeno una riga non trovata      |
| `MODIFY`   | tutte le righe inserite o modificate | una riga non è stata scritta (per esempio per un indice secondario unico) |
| `DELETE`   | le righe sono state eliminate        | nessuna riga trovata, o con `FROM TABLE` almeno una riga non trovata      |

`sy-dbcnt` contiene sempre il numero di righe elaborate.

Prima di scrivere programmi veri contano altre due cose. Primo, blocca i dati prima di modificarli, così due utenti non si sovrascrivono a vicenda: vedi [Gli oggetti di blocco](./0051-lock-objects.md). Secondo, le modifiche non sono definitive finché non vengono confermate: vedi [La LUW: COMMIT e ROLLBACK](./0060-luw-commit-and-rollback.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Inserisci tre compagnie in `ZSCARR` con un solo `INSERT ... FROM TABLE`.
> 2. Cambia la valuta di una di esse con `UPDATE ... SET`.
> 3. Eliminale tutte e tre con un solo `DELETE ... WHERE`, e stampa `sy-dbcnt` dopo ogni passo.

### Soluzione

```abap
REPORT zwrite_exercise.

DATA lt_carriers TYPE STANDARD TABLE OF zscarr WITH EMPTY KEY.

lt_carriers = VALUE #( ( carrid = 'Z1' carrname = 'Alpha Air' currcode = 'EUR' )
                       ( carrid = 'Z2' carrname = 'Beta Air'  currcode = 'EUR' )
                       ( carrid = 'Z3' carrname = 'Gamma Air' currcode = 'EUR' ) ).

INSERT zscarr FROM TABLE @lt_carriers ACCEPTING DUPLICATE KEYS.
WRITE: / 'Inserite:', sy-dbcnt.

UPDATE zscarr SET currcode = 'JPY' WHERE carrid = 'Z3'.
WRITE: / 'Modificate:', sy-dbcnt.

DELETE FROM zscarr WHERE carrid IN ( 'Z1', 'Z2', 'Z3' ).
WRITE: / 'Eliminate:', sy-dbcnt.
```

> [!NOTE]
>
> - `INSERT` aggiunge righe, `UPDATE` le modifica, `MODIFY` fa l'una o l'altra cosa, `DELETE` le elimina.
> - Usa `FROM TABLE` per elaborare molte righe con una sola istruzione.
> - `UPDATE ... FROM` sovrascrive tutti i campi; `UPDATE ... SET` modifica solo le colonne elencate.
> - Controlla `sy-subrc` e `sy-dbcnt`; un `DELETE` o un `UPDATE ... SET` senza `WHERE` colpisce tutte le righe.
> - Scrivi solo nelle tue tabelle; modifica i dati standard tramite BAPI o API rilasciate.
