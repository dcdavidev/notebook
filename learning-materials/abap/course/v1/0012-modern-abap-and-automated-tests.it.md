---
title: ABAP moderno e test automatici
description: Espressioni 7.4/7.5x, raggruppamenti, ABAP Unit, test double e qualità del codice.
---

_Settimana 3 · Livello avanzato · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------- |
| Ora 1  | Operatori costruttori: `VALUE`, `NEW`, `CONV`, `CAST`, `REF`, `EXACT`, `CORRESPONDING`, `LET`  |
| Ora 2  | Iterazioni nelle espressioni: `FOR`, `REDUCE`, `FILTER`; `LOOP AT GROUP BY`; mesh (cenni)      |
| Ora 3  | ABAP Unit: classi di test, asserzioni, fixture, copertura                                      |
| Ora 4  | Test double (iniezione delle dipendenze, test seams, framework OSQL/CDS), ATC e Code Inspector |

## Ora 1 – Gli operatori costruttori

Dalla versione 7.40 ABAP è diventato molto più espressivo: molte operazioni che richiedevano 5–10 righe ora si scrivono in un'unica espressione. Ne hai già visti alcuni; qui li mettiamo tutti in fila.

> [!TIP]
> Il vecchio ABAP era come montare un mobile vite per vite seguendo il libretto. Gli operatori costruttori sono come ricevere il mobile già montato: dici cosa vuoi e lo ottieni pronto.

| Operatore         | Che cosa costruisce                                 |
| ----------------- | --------------------------------------------------- |
| `VALUE`           | strutture e tabelle con valori                      |
| `NEW`             | oggetti e dati anonimi (con riferimento)            |
| `REF`             | un riferimento a un dato esistente                  |
| `CONV`            | un valore convertito in un altro tipo               |
| `EXACT`           | come `CONV`, ma con errore se si perde informazione |
| `CAST`            | un riferimento convertito (down-cast)               |
| `CORRESPONDING`   | una struttura/tabella copiata per nome dei campi    |
| `COND` / `SWITCH` | un valore scelto in base a condizioni               |
| `FILTER`          | una tabella filtrata                                |
| `REDUCE`          | un singolo valore calcolato iterando                |

Il simbolo `#` significa "deduci il tipo dal contesto" (dalla variabile di destinazione o dal parametro).

### VALUE in tutte le sue forme

```abap
TYPES: BEGIN OF ty_pers, nome TYPE string, eta TYPE i, citta TYPE string, END OF ty_pers.
TYPES tt_pers TYPE STANDARD TABLE OF ty_pers WITH EMPTY KEY.

DATA(ls_p) = VALUE ty_pers( nome = `Anna` eta = 30 citta = `Roma` ).

* Valori comuni "a fattor comune"
DATA(lt_p) = VALUE tt_pers( citta = `Milano`
                            ( nome = `Luca`  eta = 25 )
                            ( nome = `Marta` eta = 41 )
                            citta = `Torino`
                            ( nome = `Gino`  eta = 33 ) ).

* Copiare una struttura cambiando solo qualche campo
DATA(ls_p2) = VALUE #( BASE ls_p eta = 31 ).

* Tabella di range
DATA(lr_eta) = VALUE range_of_i( ( sign = 'I' option = 'BT' low = 18 high = 65 ) ).
```

(`range_of_i` è un esempio: definisci il tuo tipo con `TYPES ty_r TYPE RANGE OF i.`)

### CORRESPONDING

Copia i campi **con lo stesso nome** da una struttura/tabella a un'altra di tipo diverso.

```abap
TYPES: BEGIN OF ty_breve, nome TYPE string, citta TYPE string, END OF ty_breve.
DATA lt_breve TYPE STANDARD TABLE OF ty_breve WITH EMPTY KEY.

lt_breve = CORRESPONDING #( lt_p ).                       " copia nome e citta
lt_breve = CORRESPONDING #( lt_p MAPPING citta = nome ).  " mappa campi con nomi diversi
lt_breve = CORRESPONDING #( lt_p EXCEPT citta ).          " escludi campi
ls_p     = CORRESPONDING #( BASE ( ls_p ) ls_altra ).     " mantieni i valori non sovrascritti

* Con tabella di lookup (7.51+): riempie campi cercando in un'altra tabella
lt_ordini = CORRESPONDING #( lt_ordini FROM lt_clienti USING kunnr = kunnr
                             MAPPING nome_cliente = name1 ).
```

L'istruzione classica equivalente è `MOVE-CORRESPONDING a TO b.` (con `EXPANDING NESTED TABLES` e `KEEPING TARGET LINES` per le tabelle).

### LET: variabili locali in un'espressione

```abap
DATA(lv_txt) = COND string(
  LET totale = ls_ord-qta * ls_ord-prezzo
      iva    = totale * '0.22' IN
  WHEN totale > 1000 THEN |Grande: { totale + iva }|
  ELSE |Piccolo: { totale + iva }| ).
```

### EXACT, CONV, CAST, REF, NEW

```abap
DATA lv_p TYPE p LENGTH 5 DECIMALS 2.
TRY.
    lv_p = EXACT #( '1.234' ).   " eccezione CX_SY_CONVERSION_ROUNDING: perderei un decimale
  CATCH cx_sy_conversion_error.
ENDTRY.

DATA(lo_col)  = CAST cl_salv_column_table( lo_cols->get_column( 'X' ) ).
DATA(lr_riga) = REF #( lt_p[ 1 ] ).
DATA(lo_obj)  = NEW zcl_conto( `Mario` ).
DATA(lr_int)  = NEW i( 5 ).
```

## Ora 2 – FOR, REDUCE, FILTER e GROUP BY

### FOR: costruire una tabella da un'altra

```abap
* Trasformare ogni riga
DATA(lt_nomi) = VALUE string_table( FOR ls IN lt_p ( ls-nome ) ).

* Con condizione
DATA(lt_adulti) = VALUE tt_pers( FOR ls IN lt_p WHERE ( eta >= 18 ) ( ls ) ).

* Con calcoli e indice
DATA(lt_desc) = VALUE string_table( FOR ls IN lt_p INDEX INTO i
                                    ( |{ i }. { ls-nome } ({ ls-eta })| ) ).

* Come un ciclo a contatore
DATA(lt_quadrati) = VALUE int4_table( FOR n = 1 UNTIL n > 10 ( n * n ) ).

* FOR annidati (prodotto di due tabelle)
DATA(lt_comb) = VALUE string_table( FOR a IN lt_colori FOR b IN lt_taglie ( |{ a }-{ b }| ) ).
```

> [!TIP]
> `FOR` è come una catena di montaggio: le righe entrano da una parte, ognuna viene lavorata nello stesso modo, e dall'altra parte esce una tabella nuova.

### REDUCE: ridurre una tabella a un valore

```abap
* Somma delle età
DATA(lv_somma) = REDUCE i( INIT s = 0 FOR ls IN lt_p NEXT s = s + ls-eta ).

* Più valori accumulati insieme
DATA(lv_info) = REDUCE string(
  INIT txt = `` sep = ``
  FOR ls IN lt_p
  NEXT txt = txt && sep && ls-nome
       sep = `, ` ).                 " "Luca, Marta, Gino"

* Massimo
DATA(lv_max) = REDUCE i( INIT m = 0 FOR ls IN lt_p NEXT m = nmax( val1 = m val2 = ls-eta ) ).
```

### FILTER

Restituisce le righe che soddisfano una condizione sulla chiave (serve una tabella `SORTED`/`HASHED` o una chiave secondaria):

```abap
DATA lt_s TYPE SORTED TABLE OF ty_pers WITH NON-UNIQUE KEY citta.
lt_s = lt_p.
DATA(lt_milano) = FILTER #( lt_s WHERE citta = `Milano` ).
DATA(lt_altri)  = FILTER #( lt_s EXCEPT WHERE citta = `Milano` ).

* Con una tabella di filtro
DATA lt_citta_ok TYPE SORTED TABLE OF string WITH UNIQUE KEY table_line.
lt_citta_ok = VALUE #( ( `Roma` ) ( `Torino` ) ).
DATA(lt_sel) = FILTER #( lt_s IN lt_citta_ok WHERE citta = table_line ).
```

### LOOP AT ... GROUP BY

Il modo moderno di raggruppare, al posto di `AT NEW`/`COLLECT` (la tabella non deve essere ordinata):

```abap
LOOP AT lt_p INTO DATA(ls_pers)
     GROUP BY ( citta  = ls_pers-citta
                quanti = GROUP SIZE )
     ASCENDING
     INTO DATA(ls_gruppo).

  WRITE / |{ ls_gruppo-citta }: { ls_gruppo-quanti } persone|.

  LOOP AT GROUP ls_gruppo INTO DATA(ls_membro).   " i membri del gruppo
    WRITE /5 ls_membro-nome.
  ENDLOOP.
ENDLOOP.

* Raggruppare e sommare in un'unica espressione
TYPES: BEGIN OF ty_tot, citta TYPE string, eta_tot TYPE i, END OF ty_tot.
TYPES tt_tot TYPE STANDARD TABLE OF ty_tot WITH EMPTY KEY.
DATA(lt_tot) = VALUE tt_tot(
  FOR GROUPS g OF ls IN lt_p GROUP BY ls-citta
  ( citta   = g
    eta_tot = REDUCE i( INIT s = 0 FOR m IN GROUP g NEXT s = s + m-eta ) ) ).
```

### Altre novità utili

| Funzionalità                    | Esempio                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Espressioni tabella con default | `VALUE #( itab[ 1 ] OPTIONAL )`                                                        |
| Predicato `line_exists`         | `IF line_exists( itab[ nome = 'X' ] ).`                                                |
| Operatori di assegnazione       | `x += 1. x *= 2. s &&= 'x'.`                                                           |
| Dichiarazioni `FINAL`           | `FINAL(lv) = 5.` (non modificabile)                                                    |
| Operatore booleano              | `xsdbool( cond )`                                                                      |
| Enumerazioni                    | `TYPES: BEGIN OF ENUM ty_stato, nuovo, aperto, chiuso, END OF ENUM ty_stato.`          |
| Funzioni stringa                | `to_mixed`, `from_mixed`, `escape`, `condense`, `matches`                              |
| SQL moderno                     | espressioni, CTE, `@DATA`, CDS (giorno 14)                                             |
| Tabelle mesh                    | strutture di tabelle collegate da associazioni, navigabili con `\_assoc[ ]` (uso raro) |

> [!WARNING]
> **Leggibilità prima di tutto.** Le espressioni sono potenti, ma un `REDUCE` con tre `LET` e due `FOR` annidati può diventare illeggibile. Regola Clean ABAP: usa l'espressione quando rende il codice più chiaro; se serve un commento per capirla, forse un `LOOP` normale è meglio.

## Ora 3 – ABAP Unit: i test automatici

Un **test unitario** è un pezzo di codice che verifica automaticamente che un altro pezzo di codice (un metodo) faccia la cosa giusta. ABAP ha un framework integrato: **ABAP Unit**.

> [!TIP]
> I test automatici sono come le spie del cruscotto dell'auto: controllano continuamente che tutto funzioni. Quando modifichi il codice (fai un intervento al motore), basta un clic per sapere se hai rotto qualcosa, invece di accorgertene quando l'auto si ferma in autostrada (in produzione).

Perché scriverli:

- trovi gli errori subito, non in collaudo o in produzione;
- puoi modificare il codice (refactoring) con fiducia;
- documentano il comportamento atteso;
- sono richiesti in molti progetti e in ABAP Cloud.

### La classe di test

I test sono classi locali speciali, nella scheda **Test Classes** di una classe globale (in ADT) o in fondo al report.

```abap
" Codice da testare (classe globale ZCL_CALCOLATRICE_IVA)
CLASS zcl_calcolatrice_iva DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS lordo IMPORTING iv_netto TYPE decfloat34
                            iv_aliq  TYPE decfloat34 DEFAULT 22
                  RETURNING VALUE(rv) TYPE decfloat34
                  RAISING   cx_parameter_invalid_range.
ENDCLASS.

CLASS zcl_calcolatrice_iva IMPLEMENTATION.
  METHOD lordo.
    IF iv_netto < 0.
      RAISE EXCEPTION NEW cx_parameter_invalid_range( parameter = 'IV_NETTO' ).
    ENDIF.
    rv = round( val = iv_netto * ( 1 + iv_aliq / 100 ) dec = 2 ).
  ENDMETHOD.
ENDCLASS.
```

```abap
" Scheda Test Classes
CLASS ltc_calcolatrice DEFINITION FINAL
  FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    DATA mo_cut TYPE REF TO zcl_calcolatrice_iva.   " cut = class under test
    METHODS setup.
    METHODS lordo_con_iva_22      FOR TESTING RAISING cx_static_check.
    METHODS lordo_aliquota_zero   FOR TESTING RAISING cx_static_check.
    METHODS netto_negativo_errore FOR TESTING.
ENDCLASS.

CLASS ltc_calcolatrice IMPLEMENTATION.
  METHOD setup.                 " eseguito prima di OGNI test
    mo_cut = NEW #( ).
  ENDMETHOD.

  METHOD lordo_con_iva_22.
    " Given / When / Then
    DATA(lv_risultato) = mo_cut->lordo( 100 ).
    cl_abap_unit_assert=>assert_equals( exp = 122 act = lv_risultato
                                        msg = 'IVA 22% su 100 deve dare 122' ).
  ENDMETHOD.

  METHOD lordo_aliquota_zero.
    cl_abap_unit_assert=>assert_equals( exp = 50 act = mo_cut->lordo( iv_netto = 50 iv_aliq = 0 ) ).
  ENDMETHOD.

  METHOD netto_negativo_errore.
    TRY.
        mo_cut->lordo( -1 ).
        cl_abap_unit_assert=>fail( 'Doveva sollevare un''eccezione' ).
      CATCH cx_parameter_invalid_range.
        " ok: comportamento atteso
    ENDTRY.
  ENDMETHOD.
ENDCLASS.
```

Esecuzione: in ADT **Ctrl+Shift+F10** (Run As → ABAP Unit Test); in SE80/SE24 menu Classe → Unit Test (Ctrl+Shift+F10). I risultati mostrano quali test sono passati (verdi) e quali falliti (rossi), con il messaggio.

### Le parti di una classe di test

| Elemento                         | Significato                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FOR TESTING`                    | è una classe/metodo di test                                                                                                                      |
| `RISK LEVEL`                     | `HARMLESS` (non cambia nulla), `DANGEROUS` (può cambiare dati), `CRITICAL` (cambia configurazione). I sistemi possono vietare i livelli più alti |
| `DURATION`                       | `SHORT`, `MEDIUM`, `LONG`: il test fallisce se supera il tempo previsto                                                                          |
| `class_setup` / `class_teardown` | una volta per classe, prima/dopo tutti i test (statici)                                                                                          |
| `setup` / `teardown`             | prima/dopo ogni singolo test                                                                                                                     |

### Le asserzioni principali (CL_ABAP_UNIT_ASSERT)

| Metodo                                         | Verifica che                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `assert_equals( exp act )`                     | i due valori siano uguali (anche tabelle e strutture)                  |
| `assert_differs( exp act )`                    | siano diversi                                                          |
| `assert_true` / `assert_false( act )`          | il valore sia `abap_true` / `abap_false`                               |
| `assert_initial` / `assert_not_initial( act )` | il valore sia (o non sia) iniziale                                     |
| `assert_bound` / `assert_not_bound( act )`     | il riferimento sia (o non sia) valorizzato                             |
| `assert_subrc( exp act )`                      | `sy-subrc` abbia il valore atteso                                      |
| `assert_char_cp( exp act )`                    | il testo corrisponda al pattern                                        |
| `assert_table_contains( line table )`          | la tabella contenga la riga                                            |
| `assert_number_between( lower upper number )`  | il numero sia nell'intervallo                                          |
| `fail( msg )`                                  | fallisci sempre (usato per i rami che non dovrebbero essere raggiunti) |

### Test-Driven Development (TDD)

Una tecnica diffusa: prima scrivi il test (che fallisce, rosso), poi il codice minimo per farlo passare (verde), poi migliori il codice (refactoring) mantenendo i test verdi. "**Red – Green – Refactor**".

### Copertura del codice

In ADT: Run As → ABAP Unit Test With → Coverage. Mostra quali righe sono state eseguite dai test (verdi) e quali no (rosse). Obiettivo realistico: coprire tutta la logica di business importante.

## Ora 4 – Test double e qualità del codice

### Il problema: le dipendenze

Un metodo che legge dal database, chiama una BAPI o usa la data di sistema è difficile da testare: i dati cambiano, la BAPI scrive davvero. La soluzione è sostituire le dipendenze con **controfigure** (_test double_) durante il test.

> [!TIP]
> In un film le scene pericolose le gira lo stuntman, non l'attore. Nei test, al posto del vero database o della vera BAPI, usi uno "stuntman" che si comporta in modo prevedibile e non fa danni.

### Iniezione delle dipendenze

Il codice non crea da solo le sue dipendenze, ma le **riceve** (dal costruttore). Così nel test puoi passarne una finta.

```abap
INTERFACE zif_voli_dao.
  METHODS get_voli IMPORTING iv_carrid  TYPE s_carr_id
                   RETURNING VALUE(rt)  TYPE ztt_sflight.
ENDINTERFACE.

CLASS zcl_analisi_voli DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS constructor IMPORTING io_dao TYPE REF TO zif_voli_dao OPTIONAL.
    METHODS posti_liberi IMPORTING iv_carrid TYPE s_carr_id RETURNING VALUE(rv) TYPE i.
  PRIVATE SECTION.
    DATA mo_dao TYPE REF TO zif_voli_dao.
ENDCLASS.

CLASS zcl_analisi_voli IMPLEMENTATION.
  METHOD constructor.
    mo_dao = COND #( WHEN io_dao IS BOUND THEN io_dao ELSE NEW zcl_voli_dao_db( ) ).
  ENDMETHOD.

  METHOD posti_liberi.
    rv = REDUCE i( INIT s = 0 FOR v IN mo_dao->get_voli( iv_carrid )
                   NEXT s = s + v-seatsmax - v-seatsocc ).
  ENDMETHOD.
ENDCLASS.

" Nel test: una classe finta che implementa la stessa interfaccia
CLASS ltd_dao_finto DEFINITION FOR TESTING.
  PUBLIC SECTION.
    INTERFACES zif_voli_dao.
ENDCLASS.

CLASS ltd_dao_finto IMPLEMENTATION.
  METHOD zif_voli_dao~get_voli.
    rt = VALUE #( ( carrid = 'LH' seatsmax = 100 seatsocc = 90 )
                  ( carrid = 'LH' seatsmax = 200 seatsocc = 150 ) ).
  ENDMETHOD.
ENDCLASS.

CLASS ltc_analisi DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    METHODS calcola_posti FOR TESTING.
ENDCLASS.

CLASS ltc_analisi IMPLEMENTATION.
  METHOD calcola_posti.
    DATA(lo_cut) = NEW zcl_analisi_voli( io_dao = NEW ltd_dao_finto( ) ).
    cl_abap_unit_assert=>assert_equals( exp = 60 act = lo_cut->posti_liberi( 'LH' ) ).
  ENDMETHOD.
ENDCLASS.
```

### I framework di test double di SAP

| Framework                                                    | Che cosa sostituisce                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ABAP OO Test Double Framework (`cl_abap_testdouble`)         | crea in automatico controfigure di interfacce, con valori di ritorno configurabili e verifica delle chiamate |
| ABAP SQL Test Double Framework (`cl_osql_test_environment`)  | le tabelle del database lette dal codice: le `SELECT` leggono dati di test                                   |
| CDS Test Double Framework (`cl_cds_test_environment`)        | le CDS view e le loro fonti (giorno 14)                                                                      |
| Function module test double (`cl_function_test_environment`) | moduli funzione                                                                                              |
| Test seams (`TEST-SEAM` / `TEST-INJECTION`)                  | pezzi di codice legacy sostituibili nei test senza refactoring                                               |

```abap
" Esempio: sostituire la tabella SFLIGHT
CLASS ltc_sql DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    CLASS-DATA go_env TYPE REF TO if_osql_test_environment.
    CLASS-METHODS class_setup.
    CLASS-METHODS class_teardown.
    METHODS test_lettura FOR TESTING.
ENDCLASS.

CLASS ltc_sql IMPLEMENTATION.
  METHOD class_setup.
    go_env = cl_osql_test_environment=>create( i_dependency_list = VALUE #( ( 'SFLIGHT' ) ) ).
  ENDMETHOD.

  METHOD class_teardown.
    go_env->destroy( ).
  ENDMETHOD.

  METHOD test_lettura.
    DATA lt_dati TYPE STANDARD TABLE OF sflight.
    lt_dati = VALUE #( ( carrid = 'LH' connid = '0400' seatsmax = 10 seatsocc = 5 ) ).
    go_env->insert_test_data( lt_dati ).
    DATA(lo_cut) = NEW zcl_voli_dao_db( ).
    cl_abap_unit_assert=>assert_equals( exp = 1 act = lines( lo_cut->zif_voli_dao~get_voli( 'LH' ) ) ).
  ENDMETHOD.
ENDCLASS.
```

### Controlli statici: Code Inspector e ATC

- **Controllo esteso della sintassi** (SLIN): avvisi su codice sospetto.
- **Code Inspector** (SCI): controlli configurabili (prestazioni, sicurezza, convenzioni sui nomi, robustezza).
- **ABAP Test Cockpit** (ATC): la piattaforma che esegue Code Inspector, ABAP Unit e controlli di sicurezza in modo centralizzato; spesso obbligatoria prima di rilasciare un trasporto. In ADT: tasto destro → Run As → ABAP Test Cockpit (Ctrl+Shift+F2).
- **Pragma e pseudo-commenti**: `##NEEDED`, `##NO_TEXT`, `"#EC CI_NOWHERE` sopprimono avvisi specifici quando sono giustificati. Usali con parsimonia e solo con motivazione.

Controlli tipici: `SELECT` nei loop, `SELECT` senza `WHERE`, mancanza di `AUTHORITY-CHECK`, testi non traducibili, variabili non usate, eccezioni non gestite, SQL injection, uso di API non rilasciate (in ABAP Cloud).

## Esercizi

> [!IMPORTANT]
>
> 1. Riscrivi con le espressioni moderne: una tabella di numeri da 1 a 20, la tabella dei soli pari, la loro somma (`REDUCE`), una stringa con tutti i numeri separati da virgola.
> 2. Data una tabella di vendite (regione, prodotto, importo), con `LOOP AT GROUP BY` stampa per ogni regione il totale e l'elenco dei prodotti.
> 3. Con `CORRESPONDING` copia una tabella `SFLIGHT` in una tabella con soli `carrid`, `connid`, `fldate` e un campo `prezzo` mappato da `price`.
> 4. Scrivi la classe `ZCL_CALCOLATRICE_IVA` con i test unitari: 4 casi normali + 1 caso di errore. Usa TDD: scrivi prima i test.
> 5. Applica l'iniezione delle dipendenze alla classe di analisi voli e scrivi un test con una classe finta e uno con `cl_abap_testdouble`.
> 6. Esegui l'ATC su uno dei tuoi programmi dei giorni precedenti e correggi almeno 3 segnalazioni.

## Quiz

1. Che cosa significa il simbolo `#` in `VALUE #( )`?
2. Differenza tra `CONV` ed `EXACT`?
3. Che cosa fa `REDUCE`?
4. Che requisito ha `FILTER` sulla tabella sorgente?
5. Che vantaggio ha `LOOP AT GROUP BY` rispetto ad `AT NEW`?
6. Che cosa sono `setup` e `teardown`?
7. A che cosa servono i test double?
8. Che cos'è l'ATC?

## Soluzioni

```abap
REPORT zes12_moderno.

TYPES: BEGIN OF ty_vend, regione TYPE string, prodotto TYPE string, importo TYPE i, END OF ty_vend.
TYPES tt_vend TYPE STANDARD TABLE OF ty_vend WITH EMPTY KEY.

START-OF-SELECTION.
* Es. 1
  DATA(lt_num)   = VALUE int4_table( FOR n = 1 UNTIL n > 20 ( n ) ).
  DATA(lt_pari)  = VALUE int4_table( FOR n = 2 THEN n + 2 UNTIL n > 20 ( n ) ).
  DATA(lv_somma) = REDUCE i( INIT s = 0 FOR x IN lt_pari NEXT s = s + x ).
  DATA(lv_lista) = REDUCE string( INIT t = `` sep = `` FOR x IN lt_num
                                  NEXT t = |{ t }{ sep }{ x }| sep = `, ` ).
  WRITE: / lv_somma, / lv_lista.

* Es. 2
  DATA(lt_v) = VALUE tt_vend( ( regione = `Nord` prodotto = `A` importo = 10 )
                              ( regione = `Sud`  prodotto = `B` importo = 20 )
                              ( regione = `Nord` prodotto = `C` importo = 30 ) ).
  LOOP AT lt_v INTO DATA(ls_v) GROUP BY ls_v-regione INTO DATA(lv_reg).
    DATA(lv_tot) = REDUCE i( INIT s = 0 FOR m IN GROUP lv_reg NEXT s = s + m-importo ).
    WRITE / |{ lv_reg }: { lv_tot }|.
    LOOP AT GROUP lv_reg INTO DATA(ls_m).
      WRITE /5 ls_m-prodotto.
    ENDLOOP.
  ENDLOOP.

* Es. 3
  TYPES: BEGIN OF ty_s, carrid TYPE s_carr_id, connid TYPE s_conn_id,
                        fldate TYPE s_date,    prezzo TYPE s_price, END OF ty_s.
  DATA lt_s TYPE STANDARD TABLE OF ty_s WITH EMPTY KEY.
  SELECT * FROM sflight INTO TABLE @DATA(lt_sfl) UP TO 50 ROWS.
  lt_s = CORRESPONDING #( lt_sfl MAPPING prezzo = price ).
```

Nota es. 1: la `WHERE` di un `FOR` accetta solo confronti sui campi, non calcoli come `MOD`; per i pari è più semplice un `FOR` a contatore con passo 2 (`THEN n + 2`).

Quiz:

1. "Deduci il tipo dal contesto".
2. `CONV` converte con le regole standard (anche arrotondando); `EXACT` solleva un'eccezione se la conversione perde informazioni.
3. Calcola un singolo valore (somma, stringa, massimo...) iterando su una tabella.
4. Deve avere una chiave ordinata o hashed (primaria o secondaria) sui campi della condizione.
5. Non richiede tabella ordinata né campi in prima posizione, permette chiavi calcolate e dà accesso ai membri del gruppo.
6. Metodi eseguiti prima e dopo ogni metodo di test, per preparare e ripulire.
7. A sostituire le dipendenze (database, BAPI, altre classi) con controfigure prevedibili durante i test.
8. ABAP Test Cockpit: lo strumento centrale per controlli statici, test e sicurezza.

> [!NOTE]
> Oggi hai imparato: tutti gli operatori costruttori, `FOR`, `REDUCE`, `FILTER`, `GROUP BY`, `LET`, `CORRESPONDING`; ABAP Unit con asserzioni e fixture, TDD, copertura, test double, iniezione delle dipendenze, Code Inspector e ATC. Domani: enhancement, interfacce, moduli di stampa e tecniche di sistema.
