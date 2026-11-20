---
title: ABAP su SAP HANA e le CDS view
description: Code pushdown, Core Data Services, controllo accessi, AMDP e analisi delle prestazioni.
---

_Settimana 3 · Livello avanzato · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------- |
| Ora 1  | SAP HANA e il code pushdown; prima CDS view entity                                              |
| Ora 2  | CDS avanzate: join, associazioni, espressioni, parametri, annotazioni, gerarchia di viste (VDM) |
| Ora 3  | Controllo accessi (DCL), table function e AMDP, viste analitiche (cenni)                        |
| Ora 4  | Strumenti di prestazioni: ST05, SAT, SQLM, SWLT, ATC per HANA; regole d'oro                     |

## Ora 1 – SAP HANA e il code pushdown

### Che cosa cambia con HANA

**SAP HANA** è il database di SAP, su cui gira obbligatoriamente S/4HANA. Le sue caratteristiche:

- **In memoria**: i dati stanno nella RAM, non solo su disco: letture velocissime.
- **Colonnare**: i dati sono salvati per colonna, non per riga. Sommare una colonna su milioni di righe è rapidissimo; comprime molto bene i dati.
- **Calcolo parallelo**: usa tutti i processori contemporaneamente.

> [!TIP]
> Database tradizionale: una biblioteca dove i libri sono negli scaffali in cantina; per fare una statistica il bibliotecario (il server ABAP) si fa portare tutti i libri in ufficio e li conta uno per uno. HANA: la biblioteca stessa ha cento assistenti velocissimi che contano direttamente tra gli scaffali e ti mandano solo il risultato.

### Il paradigma "code pushdown"

Prima: **"data to code"** – portare i dati al server applicativo ed elaborarli in ABAP (loop, somme, filtri). Con HANA: **"code to data"** – spingere il calcolo nel database e far tornare solo il risultato.

| Livello di pushdown | Strumento                                                                          |
| ------------------- | ---------------------------------------------------------------------------------- |
| Base                | ABAP SQL moderno: espressioni, aggregazioni, `JOIN`, CTE (giorno 6)                |
| Medio               | CDS view: modelli di dati riutilizzabili definiti in ABAP ma eseguiti nel database |
| Avanzato            | AMDP: procedure scritte in SQLScript (il linguaggio di HANA) gestite da ABAP       |

Regola: usa il livello più semplice che risolve il problema. Le CDS sono la scelta standard.

### Le Core Data Services (CDS)

Le **CDS** sono un linguaggio per definire modelli di dati "intelligenti": viste che oltre ai campi contengono relazioni, calcoli, testi, regole di accesso e metadati per le interfacce utente. Sono la base di tutto S/4HANA: app Fiori, analytics, RAP, API.

> [!TIP]
> Una tabella è un ingrediente crudo. Una CDS view è un piatto già pronto: ingredienti scelti, combinati, condito con calcoli e con l'etichetta che dice a cosa serve e chi può mangiarlo. Chiunque (ABAP, Fiori, analytics) può servirlo senza ricucinarlo.

Esistono due generazioni:

| Tipo                                   | Sintassi                                                                     | Stato                              |
| -------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| CDS view DDIC-based (`define view`)    | genera anche una vista SQL nel DDIC (annotazione `@AbapCatalog.sqlViewName`) | obsoleta dalla 7.56                |
| CDS view entity (`define view entity`) | nessuna vista SQL aggiuntiva, attivazione più veloce, controlli più severi   | da usare sempre per nuovi sviluppi |

Le CDS si creano solo in Eclipse **ADT** (New → Other ABAP Repository Object → Core Data Services → Data Definition).

### La prima view entity

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Voli - vista base'
define view entity ZI_Volo
  as select from sflight
{
  key carrid   as CompagniaId,
  key connid   as VoloId,
  key fldate   as DataVolo,
      @Semantics.amount.currencyCode: 'Valuta'
      price    as Prezzo,
      currency as Valuta,
      seatsmax as PostiTotali,
      seatsocc as PostiOccupati
}
```

- Il nome segue le convenzioni del **VDM** (_Virtual Data Model_): `I_` (interface, vista base riutilizzabile), `C_` (consumption, per un'app specifica), `R_` (restricted, RAP), `P_` (private). Le tue avranno un prefisso Z: `ZI_`, `ZC_`, `ZR_`.
- `key` indica i campi chiave della vista.
- `as` assegna alias leggibili (CamelCase).
- Le righe con `@` sono **annotazioni**: metadati per il compilatore, per Fiori, per l'analytics.

Usarla da ABAP è come leggere una tabella:

```abap
SELECT CompagniaId, VoloId, DataVolo, Prezzo, Valuta
  FROM zi_volo
  WHERE CompagniaId = 'LH'
  INTO TABLE @DATA(lt_voli).
```

In ADT puoi vedere i dati con **F8** (Data Preview) direttamente sulla CDS.

## Ora 2 – CDS avanzate

### Espressioni e funzioni

```sql
define view entity ZI_VoloCalcolato
  as select from sflight
{
  key carrid,
  key connid,
  key fldate,
      seatsmax - seatsocc                                   as PostiLiberi,
      cast( seatsocc as abap.dec(15,2) ) * 100
        / cast( seatsmax as abap.dec(15,2) )                as PercentualeOccupazione,
      case
        when seatsocc >= seatsmax then 'PIENO'
        when seatsocc = 0         then 'VUOTO'
        else 'DISPONIBILE'
      end                                                   as Stato,
      concat_with_space( carrid, connid, 1 )                as CodiceVolo,
      dats_days_between( $session.system_date, fldate )     as GiorniAllaPartenza,
      @Semantics.amount.currencyCode: 'currency'
      price,
      currency
}
where fldate >= $session.system_date
```

Variabili di sessione: `$session.user`, `$session.client`, `$session.system_date`, `$session.system_language`, `$session.user_timezone`.

### JOIN e associazioni

Le CDS supportano i `JOIN` classici, ma lo strumento tipico sono le **associazioni**: relazioni dichiarate che il database esegue solo se servono (join "pigri", _lazy_).

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Collegamenti di volo'
define view entity ZI_Collegamento
  as select from spfli
  association [1..1] to ZI_Compagnia as _Compagnia on $projection.CompagniaId = _Compagnia.CompagniaId
  association [0..*] to ZI_Volo      as _Voli      on  $projection.CompagniaId = _Voli.CompagniaId
                                                   and $projection.VoloId      = _Voli.VoloId
{
  key carrid   as CompagniaId,
  key connid   as VoloId,
      cityfrom as CittaPartenza,
      cityto   as CittaArrivo,
      _Compagnia.NomeCompagnia,   // campo preso navigando l'associazione (diventa un join)
      _Compagnia,                 // associazione "esposta": chi usa la vista può navigarla
      _Voli
}
```

- La **cardinalità** `[1..1]`, `[0..1]`, `[0..*]`, `[1..*]` descrive quante righe corrispondono.
- Per convenzione il nome delle associazioni inizia con underscore `_`.
- `$projection` si riferisce ai campi (con alias) della vista stessa.
- Un'associazione esposta può essere navigata da altre CDS o da ABAP SQL con le **espressioni di percorso**:

```abap
SELECT FROM zi_collegamento
  FIELDS CompagniaId, VoloId, \_Compagnia-NomeCompagnia AS Nome
  INTO TABLE @DATA(lt_res).
```

> [!TIP]
> Un `JOIN` è come prenotare in anticipo un taxi per ogni possibile spostamento della giornata. Un'associazione è come avere l'app del taxi: lo chiami solo quando devi davvero spostarti.

Esistono anche le **composizioni** (`composition of` / `association to parent`) che descrivono relazioni padre-figlio (testata-posizioni): sono la base di RAP (giorno 15).

### Aggregazioni

```sql
define view entity ZI_StatCompagnia
  as select from sflight
{
  key carrid                         as CompagniaId,
      count( * )                     as NumeroVoli,
      sum( seatsocc )                as PostiVenduti,
      avg( price as abap.dec(15,2) ) as PrezzoMedio,
      max( fldate )                  as UltimoVolo
}
group by carrid
having count( * ) > 0
```

### Parametri

```sql
define view entity ZI_VoliPeriodo
  with parameters
    p_da : abap.dats,
    p_a  : abap.dats
  as select from sflight
{
  key carrid,
  key connid,
  key fldate,
      price,
      currency
}
where fldate between $parameters.p_da and $parameters.p_a
```

```abap
SELECT * FROM zi_voliperiodo( p_da = @lv_da, p_a = @lv_a ) INTO TABLE @DATA(lt_res).
```

### Annotazioni importanti

| Annotazione                                                                | A cosa serve                                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@AccessControl.authorizationCheck`                                        | `#CHECK`, `#NOT_REQUIRED`, `#MANDATORY`: controllo accessi con DCL              |
| `@EndUserText.label`                                                       | descrizione leggibile                                                           |
| `@Semantics.amount.currencyCode` / `@Semantics.quantity.unitOfMeasure`     | collega importi a valute e quantità a unità                                     |
| `@ObjectModel.text.element`                                                | quale campo contiene il testo descrittivo di un codice                          |
| `@ObjectModel.representativeKey`                                           | chiave rappresentativa                                                          |
| `@Consumption.valueHelpDefinition`                                         | aiuto di ricerca per Fiori                                                      |
| `@UI.lineItem` / `@UI.selectionField` / `@UI.identification` / `@UI.facet` | come mostrare i campi nelle app Fiori Elements (giorno 15)                      |
| `@Analytics.dataCategory`                                                  | `#DIMENSION`, `#FACT`, `#CUBE` per l'analytics                                  |
| `@Search.searchable` / `@Search.defaultSearchElement`                      | ricerca libera                                                                  |
| `@VDM.viewType`                                                            | `#BASIC`, `#COMPOSITE`, `#CONSUMPTION`                                          |
| `@Metadata.allowExtensions`                                                | permette di spostare le annotazioni UI in un file separato (Metadata Extension) |

### Altri artefatti CDS

| Artefatto                                                   | Uso                                                |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Projection view (`define view entity ... as projection on`) | strato di consumo per RAP                          |
| Abstract entity                                             | struttura per parametri di azioni RAP              |
| Custom entity                                               | dati forniti da una classe ABAP (non dal database) |
| Table function                                              | dati calcolati da un AMDP                          |
| Metadata extension (DDLX)                                   | annotazioni UI separate dalla vista                |
| Access control (DCL)                                        | regole di autorizzazione                           |
| Extend view                                                 | aggiungere campi a CDS standard                    |
| Hierarchy                                                   | gerarchie padre-figlio                             |
| Tabelle CDS (`define table entity`)                         | nelle versioni recenti: tabelle definite in CDS    |

### Il Virtual Data Model (VDM)

Le viste si organizzano a strati:

1. **Basic** (`I_`): una per tabella, nomi leggibili, associazioni.
2. **Composite** (`I_`): combinano viste basic.
3. **Consumption** (`C_`): per un'app o un report specifico, con annotazioni UI.

SAP fornisce migliaia di viste standard rilasciate (es. `I_Customer`, `I_Product`, `I_SalesOrder`, `I_JournalEntryItem`): in S/4HANA si leggono queste invece delle tabelle, soprattutto in ABAP Cloud dove le tabelle standard non sono accessibili direttamente.

## Ora 3 – Accessi, table function, AMDP

### Controllo accessi CDS (DCL)

Con `@AccessControl.authorizationCheck: #CHECK` SAP applica in automatico, a ogni `SELECT` sulla vista, le regole definite in un **Access Control** (DCL):

```sql
@EndUserText.label: 'Accesso ai voli per compagnia'
@MappingRole: true
define role ZI_Volo_Ruolo {
  grant select on ZI_Volo
    where ( CompagniaId ) = aspect pfcg_auth( S_CARRID, CARRID, ACTVT = '03' );
}
```

L'utente vede solo le righe delle compagnie per cui ha l'autorizzazione `S_CARRID`. Non serve più scrivere `AUTHORITY-CHECK` nel codice: il filtro è aggiunto alla query in automatico.

> [!TIP]
> Il DCL è come un filtro sugli occhiali di ogni utente: due persone guardano la stessa vista, ma ognuna vede solo le righe che è autorizzata a vedere.

Da ABAP SQL si può aggirare con `WITH PRIVILEGED ACCESS` (solo in casi giustificati).

### AMDP: ABAP Managed Database Procedures

Quando la logica è troppo complessa per CDS e ABAP SQL (calcoli iterativi, funzioni specifiche di HANA, algoritmi predittivi), si scrive un metodo in **SQLScript** che viene eseguito nel database ma gestito (trasportato, versionato) come codice ABAP.

```abap
CLASS zcl_amdp_voli DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_amdp_marker_hdb.        " marcatore obbligatorio
    TYPES: BEGIN OF ty_res,
             carrid TYPE s_carr_id,
             ricavo TYPE s_price,
           END OF ty_res,
           tt_res TYPE STANDARD TABLE OF ty_res WITH EMPTY KEY.
    METHODS get_ricavi
      IMPORTING VALUE(iv_mandt) TYPE mandt
      EXPORTING VALUE(et_res)   TYPE tt_res.
ENDCLASS.

CLASS zcl_amdp_voli IMPLEMENTATION.
  METHOD get_ricavi BY DATABASE PROCEDURE FOR HDB
                    LANGUAGE SQLSCRIPT
                    OPTIONS READ-ONLY
                    USING sflight.
    et_res = SELECT carrid, SUM( price * seatsocc ) AS ricavo
               FROM sflight
               WHERE mandt = :iv_mandt
               GROUP BY carrid;
  ENDMETHOD.
ENDCLASS.
```

Differenze da ricordare:

- Il codice dentro il metodo è **SQLScript, non ABAP**: punto e virgola finale, variabili precedute da `:` quando lette.
- Il **mandante non è gestito in automatico**: devi filtrarlo tu (o usare `USING` con CDS client-dependent e l'opzione `CDS SESSION CLIENT`).
- Tutte le tabelle/viste usate vanno elencate in `USING`.
- Parametri solo per valore, tipi elementari o tabelle.
- Debuggabile con il debugger AMDP in ADT.

### Table function

Una **CDS table function** espone il risultato di un AMDP come se fosse una vista, usabile in `SELECT` e in altre CDS:

```sql
@EndUserText.label: 'Ricavi per compagnia'
@ClientHandling.type: #CLIENT_DEPENDENT
define table function ZTF_Ricavi
  with parameters @Environment.systemField: #CLIENT p_mandt : abap.clnt
  returns {
    mandt  : abap.clnt;
    carrid : s_carr_id;
    ricavo : s_price;
  }
  implemented by method zcl_tf_ricavi=>get_data;
```

La classe implementa il metodo `get_data` con `BY DATABASE FUNCTION FOR HDB LANGUAGE SQLSCRIPT` e restituisce con `RETURN SELECT ...;`.

### Analytics (cenni)

Con le annotazioni `@Analytics.dataCategory: #CUBE` (fatti + dimensioni) e una vista di query (`@Analytics.query: true` o le nuove `define transient view entity ... provider contract analytical_query`), le CDS diventano fonti per report analitici multidimensionali (app Fiori "Query Browser", SAP Analytics Cloud, Excel con Analysis). Le dimensioni (`#DIMENSION`) descrivono le anagrafiche, i fatti (`#FACT`) le misure.

## Ora 4 – Analisi delle prestazioni

### Gli strumenti

| Transazione                                                       | Che cosa fa                                                                                          | Quando usarla                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ST05                                                              | traccia SQL (e buffer, RFC, HTTP, blocchi): mostra ogni istruzione inviata al database, tempo, righe | capire quali query sono lente o ripetute           |
| SAT                                                               | Runtime Analysis: dove il programma passa il tempo (ABAP vs database), chiamate, gerarchia           | trovare i colli di bottiglia                       |
| ST12                                                              | combina SAT e ST05 (se installato)                                                                   | analisi completa                                   |
| SQLM                                                              | SQL Monitor: raccoglie in produzione statistiche su tutte le query per giorni                        | trovare i punti critici reali                      |
| SWLT                                                              | SQL Performance Tuning Worklist: incrocia SQLM con i risultati di Code Inspector                     | priorità degli interventi                          |
| SRTCM                                                             | Runtime Check Monitor: controlli runtime per la migrazione a HANA                                    | preparare la migrazione                            |
| ATC con variante per HANA (es. `FUNCTIONAL_DB`, `PERFORMANCE_DB`) | controlli statici per HANA: ordinamenti impliciti, `SELECT` in loop, uso di tabelle pool/cluster     | prima della migrazione a S/4HANA e a ogni sviluppo |
| ST04 / DBACOCKPIT                                                 | statistiche del database                                                                             | con il team Basis                                  |

### Come leggere una traccia ST05

1. ST05 → Attiva traccia (per il tuo utente).
2. Esegui il programma in un'altra sessione.
3. Disattiva e visualizza la traccia.
4. Cerca: istruzioni identiche ripetute (`SELECT` nel loop!), istruzioni con molte righe o tempo alto, accessi senza indice (piano di esecuzione: "Explain").
5. Usa "Structure-identical statements" per vedere quante volte una query è stata eseguita con valori diversi.

> [!TIP]
> ST05 è come la telecamera del casello autostradale: registra ogni auto (query) che passa, quanto tempo ci mette e cosa trasporta. Se vedi la stessa auto passare mille volte, hai trovato il problema.

### Le regole d'oro per HANA

1. **Riduci il trasferimento dei dati**: solo colonne e righe necessarie.
2. **Riduci il numero di accessi**: niente `SELECT` in loop, usa `JOIN`/CDS/`FOR ALL ENTRIES`.
3. **Fai calcolare il database**: aggregazioni e calcoli in SQL/CDS.
4. **Non fidarti dell'ordinamento implicito**: su HANA i risultati senza `ORDER BY` possono arrivare in qualsiasi ordine; se poi usi `BINARY SEARCH` o `AT NEW` su quei dati, aggiungi `ORDER BY` o `SORT`.
5. **Leggere tutte le colonne su HANA costa di più** che su un database a righe (ogni colonna va ricostruita): elenca solo i campi necessari.
6. **Usa CDS standard rilasciate** invece di ricostruire join complessi.
7. **Misura sempre prima e dopo** (SAT, ST05): non ottimizzare "a sensazione".

### Migrazione a S/4HANA: cosa controllare nel codice custom

- Tabelle eliminate o sostituite (es. tabelle di aggregati FI/CO, MM-IM: sostituite da `ACDOCA`, `MATDOC`; clienti/fornitori → Business Partner).
- Campi allungati (es. numero materiale a 40 caratteri).
- Ordinamento implicito non più garantito.
- Tabelle pool/cluster convertite in trasparenti.
- Simplification Items e il Custom Code Migration (app Fiori / ATC con variante `S4HANA_READINESS`).

## Esercizi

> [!IMPORTANT]
>
> 1. In ADT crea la view entity `ZI_Compagnia` su `SCARR` (CompagniaId, NomeCompagnia, Valuta, Url) e `ZI_Volo` su `SFLIGHT`. Visualizza i dati con F8.
> 2. Crea `ZI_Collegamento` su `SPFLI` con associazioni verso `ZI_Compagnia` e `ZI_Volo`. Leggila da ABAP con un'espressione di percorso.
> 3. Crea `ZI_StatCompagnia` con numero di voli, posti venduti, ricavo totale (prezzo × posti occupati) e prezzo medio per compagnia. Mostrala in un ALV da un report.
> 4. Aggiungi un parametro "anno" a una vista e filtra i voli di quell'anno.
> 5. Crea un DCL per `ZI_Volo` basato su `S_CARRID` e verifica (con un utente di test o con SU53) l'effetto.
> 6. Scrivi un AMDP che calcola per ogni compagnia il volo con il maggior ricavo, ed esponilo con una table function.
> 7. Prendi il report del giorno 6 o 8 con un `SELECT` in un loop, misura con ST05 e SAT, riscrivilo con `JOIN` o CDS e misura di nuovo.

## Quiz

1. Che cosa significa "code pushdown"?
2. Differenza tra CDS view DDIC-based e view entity?
3. Che vantaggio ha un'associazione rispetto a un `JOIN`?
4. A che cosa serve un DCL?
5. Perché in un AMDP devi filtrare il mandante?
6. Che cosa mostra ST05? E SAT?
7. Perché su HANA è pericoloso affidarsi all'ordine dei risultati senza `ORDER BY`?

## Soluzioni

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Compagnie aeree'
define view entity ZI_Compagnia
  as select from scarr
{
  key carrid   as CompagniaId,
      carrname as NomeCompagnia,
      currcode as Valuta,
      url      as Url
}
```

```sql
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Statistiche per compagnia'
define view entity ZI_StatCompagnia
  as select from sflight
  association [1..1] to ZI_Compagnia as _Compagnia on $projection.CompagniaId = _Compagnia.CompagniaId
{
  key carrid                                            as CompagniaId,
      _Compagnia.NomeCompagnia                          as NomeCompagnia,
      count( * )                                        as NumeroVoli,
      sum( seatsocc )                                   as PostiVenduti,
      sum( cast( price as abap.dec(15,2) ) * seatsocc ) as Ricavo,
      avg( price as abap.dec(15,2) )                    as PrezzoMedio,
      _Compagnia
}
group by carrid, _Compagnia.NomeCompagnia
```

Nota: il ricavo somma prezzi in valute diverse se le compagnie hanno valute diverse per volo; in un caso reale raggruppa anche per valuta o converti con `currency_conversion( )`.

Quiz:

1. Spostare i calcoli dal server applicativo al database, che restituisce solo il risultato.
2. La DDIC-based genera anche una vista SQL nel dizionario ed è obsoleta; la view entity non la genera, è più rapida e rigorosa ed è lo standard.
3. Viene eseguita solo se un campo dell'associazione è effettivamente richiesto (lazy), e può essere esposta e navigata da altre viste.
4. A definire regole di accesso applicate automaticamente a ogni `SELECT` sulla vista.
5. Perché SQLScript non aggiunge il filtro sul mandante in automatico come ABAP SQL.
6. ST05 mostra le istruzioni inviate al database con tempi e righe; SAT mostra dove il programma spende il tempo (ABAP, database, chiamate).
7. Perché HANA elabora in parallelo e l'ordine non è garantito: `BINARY SEARCH`, `AT NEW` e `DELETE ADJACENT DUPLICATES` darebbero risultati sbagliati.

> [!NOTE]
> Oggi hai imparato: HANA e il code pushdown, CDS view entity con espressioni, associazioni, aggregazioni, parametri e annotazioni, VDM, DCL, AMDP e table function, analytics, gli strumenti di prestazione e i controlli per la migrazione a S/4HANA. Domani, ultimo giorno: RAP, ABAP Cloud e il tuo percorso futuro.
