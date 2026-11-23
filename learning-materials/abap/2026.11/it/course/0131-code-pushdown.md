---
title: ABAP su SAP HANA e code pushdown
description: Spostare la logica sui dati dall'application server al database.
level: pro
---

L'ABAP classico è nato per database lenti in tutto ciò che andava oltre le letture semplici, quindi i programmi copiavano le righe nella memoria dell'application server e facevano lì il lavoro. SAP HANA ribalta la situazione: è un database in memoria e a colonne che aggrega e calcola su milioni di righe più velocemente di qualsiasi ciclo ABAP.

Il **code pushdown** consiste nello spostare la logica che lavora su molti dati verso il database, così all'application server arriva solo il risultato. Questa lezione spiega perché conviene e quali strumenti usi; le lezioni successive approfondiscono ciascuno strumento.

## Che cosa rende diverso SAP HANA

| Caratteristica       | Che cosa significa per il tuo codice                             |
| -------------------- | ---------------------------------------------------------------- |
| In memoria           | i dati si leggono dalla RAM, non dal disco                       |
| Column store         | aggregare una colonna (`SUM( price )`) legge solo quella colonna |
| Compressione         | le colonne con pochi valori distinti occupano poca memoria       |
| Esecuzione parallela | una query gira su molti core contemporaneamente                  |
| Motore di calcolo    | join, espressioni e aggregati girano dove stanno i dati          |

La parte lenta di un programma tipico non è più la lettura dal database, ma il **trasferimento** di molte righe all'application server e i cicli ABAP su di esse.

> [!TIP]
> Pensa a una biblioteca. Il vecchio metodo è portare alla scrivania tutti i libri dello scaffale per contare quanti parlano di storia. Il code pushdown è chiederlo al bibliotecario, che sta proprio accanto allo scaffale, e ricevere un solo numero.

## Da "dati verso il codice" a "codice verso i dati"

Ecco un report classico che calcola i posti occupati per compagnia aerea. Legge tutti i voli e somma in ABAP:

```abap
TYPES: BEGIN OF ty_load,
         carrid   TYPE s_carr_id,
         seatsocc TYPE s_seatsocc,
       END OF ty_load.
DATA lt_load TYPE SORTED TABLE OF ty_load WITH UNIQUE KEY carrid.

SELECT carrid, seatsocc FROM sflight INTO TABLE @DATA(lt_flights).  " viaggiano tutte le righe

DATA ls_load TYPE ty_load.
LOOP AT lt_flights INTO DATA(ls_flight).
  ls_load = CORRESPONDING #( ls_flight ).
  COLLECT ls_load INTO lt_load.                                     " somma in ABAP
ENDLOOP.
```

Lo stesso risultato con il lavoro spostato sul database, da cui torna una sola riga per compagnia:

```abap
SELECT FROM sflight
  FIELDS carrid,
         SUM( seatsocc ) AS seatsocc,
         COUNT( * )      AS flights
  GROUP BY carrid
  ORDER BY carrid
  INTO TABLE @DATA(lt_load_db).
```

Su una tabella con milioni di voli, la seconda versione sposta qualche decina di righe invece di milioni. Ed è anche più corta. Le lezioni su [ABAP SQL moderno](./0097-modern-abap-sql.md) e [ABAP SQL avanzato](./0098-advanced-abap-sql.md) mostrano le espressioni, il `CASE`, le window function e le common table expression che puoi usare nella query.

## Gli strumenti del pushdown

Scegli lo strumento più semplice che fa il lavoro, in quest'ordine:

| Livello | Strumento                                                                    | Quando usarlo                                                                           |
| ------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1       | ABAP SQL con espressioni, join, aggregati                                    | la logica appartiene a un solo programma                                                |
| 2       | [CDS view entity](./0132-cds-view-entities.md)                               | lo stesso modello di dati serve a molti programmi, app Fiori o analisi                  |
| 3       | [AMDP](./0137-amdp.md) e [CDS table function](./0138-cds-table-functions.md) | la logica richiede SQLScript o funzioni specifiche di HANA che ABAP SQL e CDS non hanno |

ABAP SQL e CDS girano su tutti i database supportati da SAP, quindi sono portabili. Le AMDP sono scritte in SQLScript e girano solo su SAP HANA: tienile per i casi che i primi due livelli non coprono.

> [!WARNING]
> Pushdown non significa "spostare tutta la logica in SQL". Le regole di business che controllano l'input dell'utente, chiamano BAPI o dipendono da molte tabelle di configurazione sono spesso più chiare in ABAP. Sposta sul database ciò che elabora **molte righe**; tieni in ABAP ciò che decide **che cosa farne**.

## Abitudini che cambiano su SAP HANA

Alcune vecchie regole sulle prestazioni valgono ancora, altre cambiano:

- **Valgono ancora**: leggi solo le colonne che ti servono (niente `SELECT *` su tabelle larghe), filtra con `WHERE` nel database ed evita le `SELECT` dentro i cicli.
- **Preferisci i join** alle `SELECT` annidate e, nella maggior parte dei casi, a [`FOR ALL ENTRIES`](./0057-for-all-entries.md): un join è un solo giro verso il database, e l'optimizer del database vede tutta la query.
- **Meno indici secondari**: il column store è già veloce per la maggior parte dei filtri. Non aggiungere un indice prima di aver misurato.
- **Misura** con la traccia SQL (`ST05`) e con `SAT`, come in [analisi delle prestazioni](./0108-performance-analysis.md). Su tutto il sistema, l'SQL Monitor (`SQLM`) mostra quali istruzioni costano di più in produzione.

Anche il codice custom di un sistema più vecchio può richiedere correzioni per HANA: l'esempio classico è il codice che si affida all'ordinamento implicito di una `SELECT` senza `ORDER BY`. L'ABAP Test Cockpit ha una variante di controllo apposta (vedi [qualità del codice](./0107-code-quality.md)).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che legge tutte le prenotazioni da `SBOOK` e calcola, in ABAP, il numero di prenotazioni e il totale di `LOCCURAM` per compagnia.
> 2. Riscrivilo con una sola `SELECT` che fa l'aggregazione nel database.
> 3. Confronta le due versioni in `ST05`: quante righe trasferisce ciascuna?

### Soluzione

```abap
SELECT FROM sbook
  FIELDS carrid,
         loccurkey,
         COUNT( * )       AS bookings,
         SUM( loccuram )  AS total
  WHERE cancelled = @abap_false
  GROUP BY carrid, loccurkey
  ORDER BY carrid
  INTO TABLE @DATA(lt_totals).
```

La versione ABAP trasferisce una riga per prenotazione; questa una riga per compagnia e valuta.

> [!NOTE]
>
> - SAP HANA è in memoria e a colonne: aggregati e calcoli sono veloci nel database.
> - Il code pushdown sposta il lavoro sui dati verso il database, così all'application server arriva solo il risultato.
> - Usa prima ABAP SQL, poi le CDS view entity per i modelli riutilizzabili, e le AMDP solo quando ti serve SQLScript.
> - Sposta sul database il lavoro su molte righe; tieni in ABAP le decisioni di business.
> - Misura prima e dopo con `ST05`, `SAT` e `SQLM`.
