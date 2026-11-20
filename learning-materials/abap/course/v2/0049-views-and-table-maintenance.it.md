---
title: Viste e manutenzione delle tabelle
description: Viste di database, viste di manutenzione e SM30.
---

_Livello base_

Una **vista** è un oggetto del Dizionario che mostra i dati di una o più tabelle senza memorizzarli una seconda volta. Sceglie i campi che ti servono e, quando combina più tabelle, le mette in join. I programmi leggono una vista come se fosse una tabella.

Molte tabelle custom contengono configurazioni che i key user devono tenere aggiornate: codici, testi, soglie. Non scrivi un programma per ognuna: generi un **dialogo di manutenzione** e gli utenti modificano le righe con la transazione `SM30`.

## I quattro tipi di vista del Dizionario

In `SE11`, alla voce **Vista**, puoi creare quattro tipi di vista:

| Tipo                  | Che cosa fa                                                  | Uso tipico                                     |
| --------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| Vista di database     | un inner join di una o più tabelle, creato sul database      | leggere dati collegati con una sola `SELECT`   |
| Vista di proiezione   | un sottoinsieme dei campi di **una** tabella                 | nascondere i campi che non servono             |
| Vista di manutenzione | unisce tabelle legate da chiavi esterne, per `SM30`          | mantenere tabelle collegate in un solo dialogo |
| Vista di help         | un outer join usato solo come origine di un aiuto di ricerca | aiuto F4 che attraversa più tabelle            |

Solo le viste di database esistono sul database. Le viste di proiezione, di manutenzione e di help vivono solo nel livello ABAP.

> [!TIP]
> Una vista è come una finestra su una stanza: vedi solo una parte di quello che c'è dentro, e dall'angolazione che hai scelto, ma i mobili restano nella stanza. Se sposti una sedia, chiunque guardi dalla finestra la vede spostata.

## Le viste di database

Una vista di database ha tre parti:

1. **Tabelle e condizioni di join**: per esempio `SCARR` e `SPFLI`, collegate con `SCARR-CARRID = SPFLI-CARRID`. Il join è sempre un inner join.
2. **Campi della vista**: le colonne della vista, ognuna presa da un campo di tabella.
3. **Condizioni di selezione**: una `WHERE` fissa e facoltativa, per esempio `SPFLI-COUNTRYFR = 'DE'`.

Dopo l'attivazione la leggi come una tabella. Supponi di aver creato la vista `ZV_CARR_CONN` con i campi `CARRID`, `CARRNAME`, `CONNID`, `CITYFROM` e `CITYTO`:

```abap
SELECT carrid, carrname, connid, cityfrom, cityto
  FROM zv_carr_conn
  INTO TABLE @DATA(lt_connections).
```

La `SELECT` la impari in [Leggere dati con SELECT](./0052-select-basics.it.md). Una vista di database su più tabelle è di sola lettura. Una vista su una sola tabella si può modificare se nello stato di manutenzione imposti l'**accesso** a "lettura e modifica".

> [!WARNING]
> In SAP S/4HANA le viste di database del Dizionario sono obsolete per i nuovi sviluppi. Crea invece una [CDS view entity](./0132-cds-view-entities.it.md). Le viste di database le trovi comunque in ogni sistema, quindi impara a leggerle.

## Il generatore della manutenzione tabelle

Per far modificare agli utenti una tabella custom in `SM30`, segui questi passi per una tabella come `ZSCARR` (una copia di `SCARR` creata come in [Le tabelle del database](./0046-database-tables.it.md)):

1. In `SE11`, nella scheda **Consegna e manutenzione**, imposta **Data Browser/Manutenzione vista tabella** su "Visualizzazione/manutenzione consentita".
2. Scegli **Utilità > Generatore manutenzione tabelle**.
3. Compila i campi:
   - **Gruppo di autorizzazione**: `&NC&` significa "nessun gruppo"; un gruppo vero ti permette di limitare chi può modificare (vedi [I controlli di autorizzazione](./0110-authorization-checks.it.md)).
   - **Gruppo funzione**: un nuovo gruppo funzione Z che conterrà il codice generato, per esempio `ZSCARR_MAINT`.
   - **Tipo di manutenzione**: **a un livello** (una sola lista in cui modifichi le righe) o **a due livelli** (una lista, poi una schermata di dettaglio per ogni riga).
   - **Numeri di schermata**: usa **Trova numeri schermata** per farteli proporre dal sistema.
   - **Routine di registrazione**: la "routine di registrazione standard" chiede una richiesta di trasporto quando l'utente salva, così le righe possono viaggiare verso gli altri sistemi.
4. Scegli **Crea** e salva in un package e in una richiesta di trasporto.

```text
SE11 > Tabella ZSCARR > Modifica
  Utilità > Generatore manutenzione tabelle
    Gruppo di autorizzazione:  &NC&
    Gruppo funzione:           ZSCARR_MAINT
    Tipo di manutenzione:      A un livello
    Schermata panoramica:      0001
    Routine di registrazione:  Routine di registrazione standard
```

> [!CAUTION]
> Se cambi i campi della tabella dopo la generazione, le schermate generate non corrispondono più. Riapri il generatore e scegli **Modifica** per rigenerare, altrimenti gli utenti avranno errori o non vedranno i nuovi campi.

## SM30 e le transazioni custom

Apri `SM30`, inserisci `ZSCARR` in **Tabella/vista** e scegli **Manutenzione**. Ottieni una lista in cui puoi aggiungere, modificare, copiare ed eliminare righe. Le modifiche arrivano al database quando salvi.

Gli utenti non dovrebbero conoscere i nomi delle tabelle. Crea una **transazione con parametri** in `SE93`:

```text
SE93 > Codice transazione ZSCARR > Crea > Transazione con parametri
  Valori di default per transazione:  SM30
  Salta schermata iniziale:           selezionato
  Valori di default:
    VIEWNAME   ZSCARR
    UPDATE     X
```

Ora la transazione `ZSCARR` apre direttamente il dialogo di manutenzione.

Per un gruppo di tabelle collegate, come una testata e le sue posizioni, un **cluster di viste** (transazione `SE54`, mantenuto con `SM34`) riunisce più dialoghi di manutenzione sotto un unico albero di navigazione.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea la vista di database `ZV_CARR_CONN` su `SCARR` e `SPFLI` con i campi di questa lezione, e mostrane il contenuto con **Utilità > Contenuto**.
> 2. Genera un dialogo di manutenzione a un livello per la tua tabella `ZSCARR`, aggiungi due compagnie aeree in `SM30` e crea la transazione con parametri `ZSCARR`.

### Soluzione

Per la vista, in `SE11` crea una vista di database, inserisci le tabelle `SCARR` e `SPFLI` e scegli **Relazioni** per farti proporre dal sistema la condizione di join `SPFLI-CARRID = SCARR-CARRID` a partire dalla chiave esterna. Nella scheda **Campi vista** aggiungi `CARRID`, `CARRNAME` da `SCARR` e `CONNID`, `CITYFROM`, `CITYTO` da `SPFLI`. Attivala.

Per la manutenzione, segui i passi della sezione sul generatore, poi `SE93` con `SM30`, `VIEWNAME = ZSCARR` e `UPDATE = X`.

> [!NOTE]
>
> - Una vista mostra i dati di una o più tabelle senza copiarli.
> - Una vista di database è un inner join creato sul database; in S/4HANA, per i nuovi sviluppi, usa le CDS view entity.
> - Il generatore della manutenzione tabelle crea il dialogo di `SM30` in un gruppo funzione a tua scelta.
> - Rigenera il dialogo ogni volta che cambi la struttura della tabella.
> - Una transazione con parametri in `SE93` apre `SM30` direttamente sulla tua tabella.
