---
title: 'La LUW: COMMIT e ROLLBACK'
description: LUW di database, LUW SAP e la coerenza dei dati.
---

_Livello base_

Un'operazione di business modifica spesso più tabelle: una prenotazione aggiunge una riga a `SBOOK` e aumenta i posti occupati in `SFLIGHT`. O avvengono entrambe le modifiche, o nessuna delle due. Una prenotazione fatta a metà, con la riga in `SBOOK` ma il vecchio numero di posti, è peggio di nessuna prenotazione.

Una **LUW** (_logical unit of work_, unità logica di lavoro) è un gruppo di modifiche che il sistema tratta come una sola: vengono salvate tutte insieme con un **commit**, o annullate tutte insieme con un **rollback**. SAP ha due tipi di LUW, e devi conoscerli entrambi.

## La LUW di database

Una **LUW di database** è una transazione sul database. Ogni modifica che fai con `INSERT`, `UPDATE`, `MODIFY` o `DELETE` (vedi [Scrivere dati](./0059-writing-to-the-database.it.md)) resta provvisoria fino a un commit di database. Fino a quel momento gli altri utenti non la vedono, e un rollback può annullarla.

```abap
REPORT zluw_demo.

DATA ls_carrier TYPE zscarr.

ls_carrier = VALUE #( carrid = 'Z1' carrname = 'Alpha Air' currcode = 'EUR' ).
INSERT zscarr FROM @ls_carrier.
DATA(lv_ok) = xsdbool( sy-subrc = 0 ).

ls_carrier = VALUE #( carrid = 'Z2' carrname = 'Beta Air' currcode = 'EUR' ).
INSERT zscarr FROM @ls_carrier.
IF sy-subrc <> 0.
  lv_ok = abap_false.
ENDIF.

IF lv_ok = abap_true.
  COMMIT WORK.                         " entrambe le righe diventano definitive
  WRITE: / 'Entrambe le compagnie salvate'.
ELSE.
  ROLLBACK WORK.                       " nessuna riga viene salvata
  WRITE: / 'Niente salvato'.
ENDIF.
```

- `COMMIT WORK` rende definitive tutte le modifiche fatte dall'ultimo commit.
- `ROLLBACK WORK` annulla tutte le modifiche fatte dall'ultimo commit.

> [!TIP]
> Una LUW è come il carrello di un negozio online. Aggiungi e togli articoli come vuoi, ma non compri niente finché non premi "Paga". Se invece chiudi il browser, il carrello si svuota e il tuo conto in banca non cambia.

## I commit di database impliciti

Il work process che esegue il tuo programma è condiviso con altri utenti. Ogni volta che il programma lo restituisce, il sistema chiude la LUW di database con un **commit implicito**. Succede, per esempio:

- quando viene mostrata una schermata (una schermata di selezione, una schermata di dialogo, una lista);
- quando in un dialogo viene mostrato un messaggio `I`, `W` o `E` (vedi [I messaggi](./0061-messages.it.md));
- a una chiamata RFC sincrona o asincrona (vedi [Le chiamate di funzione remote](./0124-rfc.it.md));
- a un'istruzione `WAIT`.

Il sistema esegue invece un rollback automatico in caso di errore a runtime e di messaggio `A` o `X`.

> [!WARNING]
> I commit impliciti dividono le tue modifiche in più LUW di database senza che tu scriva `COMMIT WORK`. Se modifichi la tabella A, mostri un popup all'utente e poi modifichi la tabella B, la modifica ad A è già definitiva quando B fallisce. Fai tutte le modifiche di un'operazione di business insieme, dopo l'interazione con l'utente.

## La LUW SAP

Una transazione di business come "crea un ordine di vendita" attraversa più schermate, quindi più LUW di database. La **LUW SAP** è la parentesi che le racchiude: raccoglie le modifiche durante il dialogo e le scrive tutte in **una sola** LUW di database alla fine, quando il programma chiama `COMMIT WORK`.

Le modifiche vengono raccolte con tecniche speciali che vengono eseguite solo al `COMMIT WORK`:

- i **moduli funzione di aggiornamento**, chiamati con `CALL FUNCTION ... IN UPDATE TASK`;
- le **subroutine e i metodi registrati per il commit**, con `PERFORM ... ON COMMIT`.

Li imparerai in [I moduli funzione di aggiornamento](./0113-update-task.it.md). A questo livello ricorda che cosa fa `COMMIT WORK` in un sistema SAP, oltre al commit di database:

1. esegue tutti i moduli di aggiornamento e le subroutine registrate;
2. rilascia i blocchi SAP impostati con lo scope di default (vedi [Gli oggetti di blocco](./0051-lock-objects.it.md));
3. chiude la LUW SAP corrente e ne apre una nuova.

Anche `ROLLBACK WORK` scarta gli aggiornamenti registrati, esegue il rollback del database e rilascia i blocchi.

`COMMIT WORK AND WAIT` aspetta che i moduli di aggiornamento abbiano finito e imposta `sy-subrc`. Usalo quando il passo successivo deve leggere i dati appena salvati.

## Il COMMIT dopo le BAPI

Le BAPI non eseguono mai il commit da sole. Dopo una BAPI che modifica dati chiami `BAPI_TRANSACTION_COMMIT` se la chiamata è andata bene, oppure `BAPI_TRANSACTION_ROLLBACK` se ha restituito errori:

```abap
CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
  EXPORTING
    wait = abap_true.                  " come COMMIT WORK AND WAIT
```

[Le BAPI](./0071-bapis.it.md) mostra lo schema completo con la tabella dei messaggi di ritorno.

> [!CAUTION]
> Non mettere `COMMIT WORK` dentro un metodo o un modulo funzione che altri riutilizzano. Il chiamante perde il controllo della sua LUW: le sue modifiche a metà vengono confermate nel mezzo del suo lavoro. Lascia il commit al programma che possiede l'intera operazione di business.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che inserisce due compagnie in `ZSCARR`, dove la seconda ha la stessa chiave della prima.
> 2. Esegui il rollback quando un inserimento fallisce, e controlla in `SE16` che la tabella non sia cambiata.
> 3. Cambia le chiavi in modo che entrambi gli inserimenti riescano, esegui il commit e controlla di nuovo.

### Soluzione

Il report della sezione "La LUW di database" fa esattamente questo. Con `carrid = 'Z1'` in entrambe le work area, il secondo `INSERT` restituisce `sy-subrc = 4`, il programma esegue `ROLLBACK WORK` e sparisce anche la prima riga. Con `Z1` e `Z2` entrambe le righe vengono confermate e sono visibili in `SE16`.

> [!NOTE]
>
> - Una LUW è un gruppo di modifiche salvate o annullate insieme.
> - `COMMIT WORK` rende definitive le modifiche; `ROLLBACK WORK` le annulla.
> - Schermate, messaggi di dialogo, chiamate RFC e `WAIT` provocano commit di database impliciti.
> - La LUW SAP raccoglie le modifiche di più schermate e le scrive al `COMMIT WORK`, che rilascia anche i blocchi.
> - Esegui il commit nel programma che possiede l'operazione, non nel codice riutilizzabile; dopo le BAPI usa `BAPI_TRANSACTION_COMMIT`.
