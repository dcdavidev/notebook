---
title: Variabili, tipi di dato e operazioni
description: Come ABAP conserva numeri, testi, date e come li trasforma.
---

_Settimana 1 · Livello base · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                         |
| ------ | --------------------------------------------------------------------------------- |
| Ora 1  | Variabili, costanti, tipi predefiniti (C, N, I, P, D, T, STRING...)               |
| Ora 2  | TYPES, dichiarazioni inline, valori iniziali, conversioni, CONV                   |
| Ora 3  | Operazioni aritmetiche e funzioni numeriche, date e ore                           |
| Ora 4  | Lavorare con i testi: concatenare, dividere, cercare, sostituire, string template |

## Ora 1 – Variabili e tipi di dato

### Che cos'è una variabile

Una **variabile** è un contenitore con un nome, dove il programma conserva un valore che può cambiare. Ogni variabile ha un **tipo**, che dice che cosa può contenere (numeri, testo, date...) e quanto spazio occupa.

> [!TIP]
> Una variabile è come un barattolo in cucina con un'etichetta. L'etichetta è il nome (`lv_zucchero`), la forma del barattolo è il tipo (un barattolo per liquidi non va bene per gli spaghetti), il contenuto è il valore. Puoi svuotarlo e riempirlo quante volte vuoi.

Si dichiara con `DATA`:

```abap
DATA lv_eta     TYPE i.                     " numero intero
DATA lv_nome    TYPE string.                " testo di lunghezza libera
DATA lv_importo TYPE p LENGTH 10 DECIMALS 2 VALUE '125.50'.

lv_eta  = 35.
lv_nome = `Giulia`.
WRITE: / lv_nome, lv_eta, lv_importo.
```

- `TYPE` indica il tipo.
- `VALUE` assegna un valore iniziale.
- `=` assegna un valore (il valore a destra va nella variabile a sinistra).

### Convenzioni sui nomi

Non sono obbligatorie ma quasi tutte le aziende le usano. Il prefisso dice "di che genere" è l'oggetto:

| Prefisso                      | Significato                                            | Esempio             |
| ----------------------------- | ------------------------------------------------------ | ------------------- |
| `lv_`                         | variabile locale (_local variable_)                    | `lv_totale`         |
| `gv_`                         | variabile globale                                      | `gv_contatore`      |
| `ls_` / `gs_`                 | struttura (una riga)                                   | `ls_cliente`        |
| `lt_` / `gt_`                 | tabella interna                                        | `lt_ordini`         |
| `lc_` / `gc_`                 | costante                                               | `lc_iva`            |
| `lr_` / `lo_`                 | riferimento / oggetto                                  | `lo_alv`            |
| `iv_` / `ev_` / `cv_` / `rv_` | parametri importing / exporting / changing / returning | `iv_matnr`          |
| `ty_`                         | tipo                                                   | `ty_riga`           |
| `p_` / `s_`                   | parametro / select-option a video                      | `p_data`, `s_kunnr` |

> [!WARNING]
> Le linee guida moderne (Clean ABAP) suggeriscono di ridurre i prefissi e usare nomi descrittivi. In molte aziende però troverai ancora i prefissi: imparali, li leggerai ovunque. I nomi possono avere al massimo 30 caratteri e possono contenere lettere, cifre e underscore.

### I tipi predefiniti (built-in)

| Tipo                        | Che cosa contiene           | Lunghezza                     | Valore iniziale | Esempio                     |
| --------------------------- | --------------------------- | ----------------------------- | --------------- | --------------------------- |
| `c`                         | Testo a lunghezza fissa     | 1–262143 caratteri            | spazi           | `'ROMA'`                    |
| `n`                         | Testo numerico (solo cifre) | fissa                         | `'000...'`      | `'00012'` (CAP, codici)     |
| `string`                    | Testo a lunghezza variabile | libera                        | vuota           | `` `Ciao a tutti` ``        |
| `i`                         | Intero                      | 4 byte (±2,1 miliardi)        | 0               | `42`                        |
| `int8`                      | Intero grande               | 8 byte                        | 0               | `9000000000`                |
| `p`                         | Numero decimale "impaccato" | 1–16 byte, fino a 14 decimali | 0               | `1234.56`                   |
| `decfloat16` / `decfloat34` | Decimale in virgola mobile  | 8 / 16 byte                   | 0               | calcoli scientifici precisi |
| `f`                         | Virgola mobile binaria      | 8 byte                        | 0               | da evitare per gli importi  |
| `d`                         | Data AAAAMMGG               | 8 caratteri                   | `'00000000'`    | `'20261113'`                |
| `t`                         | Ora HHMMSS                  | 6 caratteri                   | `'000000'`      | `'153000'`                  |
| `x`                         | Byte esadecimali, fissi     | fissa                         | `X'00'`         | dati binari                 |
| `xstring`                   | Byte esadecimali, variabili | libera                        | vuota           | file, immagini              |
| `utclong`                   | Timestamp UTC               | 8 byte                        | vuoto           | data + ora precisa          |

Dettagli importanti:

- `c` ha **lunghezza fissa**: se dichiari `TYPE c LENGTH 10` e scrivi `'ROMA'`, il resto è riempito di spazi. Se il testo è più lungo, viene **troncato** senza errori.
- `n` si usa per i "numeri che non si sommano": CAP, numeri di documento, codici. Le cifre sono allineate a destra con zeri davanti.
- `p` è il tipo giusto per **soldi e quantità**: calcola in decimale esatto, senza gli errori di arrotondamento di `f`.
- `d` e `t` sono in realtà testi di 8 e 6 caratteri, ma ABAP sa fare calcoli con loro (giorni e secondi).
- `string` e `xstring` crescono e si restringono da sole.

> [!TIP]
> Il tipo `c` è come un modulo cartaceo con 10 caselle: se scrivi un nome corto le caselle restano vuote, se è troppo lungo le ultime lettere non ci stanno. Il tipo `string` è come un foglio bianco: scrivi quanto vuoi.

```abap
DATA lv_citta TYPE c LENGTH 5.
DATA lv_cap   TYPE n LENGTH 5.
DATA lv_oggi  TYPE d.
DATA lv_ora   TYPE t.

lv_citta = 'FIRENZE'.  " diventa 'FIREN' (troncato!)
lv_cap   = 123.        " diventa '00123'
lv_oggi  = sy-datum.   " data di sistema
lv_ora   = sy-uzeit.   " ora di sistema

WRITE: / lv_citta, / lv_cap, / lv_oggi, / lv_ora.
```

### Costanti

Una **costante** è un valore che non può cambiare. Si dichiara con `CONSTANTS` e il `VALUE` è obbligatorio.

```abap
CONSTANTS lc_aliquota_iva TYPE p LENGTH 3 DECIMALS 2 VALUE '22.00'.
CONSTANTS lc_paese        TYPE c LENGTH 2 VALUE 'IT'.

* lc_paese = 'DE'.  " ERRORE di sintassi: una costante non si modifica
```

Usa costanti invece di "numeri magici" sparsi nel codice: se l'aliquota cambia, la modifichi in un posto solo.

### Le strutture (prima occhiata)

Una **struttura** raggruppa più campi in un'unica variabile, come una riga di un foglio Excel.

```abap
DATA: BEGIN OF ls_persona,
        nome    TYPE string,
        cognome TYPE string,
        eta     TYPE i,
      END OF ls_persona.

ls_persona-nome    = `Luca`.
ls_persona-cognome = `Bianchi`.
ls_persona-eta     = 40.
WRITE: / ls_persona-nome, ls_persona-cognome, ls_persona-eta.
```

Il trattino `-` separa la struttura dal campo: `ls_persona-nome` si legge "il campo nome della struttura ls_persona". Le strutture sono ovunque in ABAP: ne riparliamo nei giorni 4 e 5.

## Ora 2 – TYPES, inline, conversioni

### Definire i propri tipi con TYPES

`TYPES` crea un **tipo** (uno stampo), non una variabile. Poi usi lo stampo per creare quante variabili vuoi.

> [!TIP]
> `TYPES` è lo stampo per i biscotti, `DATA` è il biscotto. Con uno stampo fai tanti biscotti uguali.

```abap
TYPES ty_importo TYPE p LENGTH 13 DECIMALS 2.

TYPES: BEGIN OF ty_articolo,
         codice      TYPE c LENGTH 10,
         descrizione TYPE string,
         prezzo      TYPE ty_importo,
       END OF ty_articolo.

DATA ls_art1 TYPE ty_articolo.
DATA ls_art2 TYPE ty_articolo.
DATA lv_tot  TYPE ty_importo.
```

### TYPE e LIKE

- `TYPE` si riferisce a un tipo: `DATA a TYPE i.`
- `LIKE` si riferisce a un'altra variabile: `DATA b LIKE a.` (`b` avrà lo stesso tipo di `a`).

Si può tipizzare anche facendo riferimento al **Dizionario Dati** (giorno 4): `DATA lv_cliente TYPE kunnr.` oppure a un campo di tabella: `DATA lv_nome TYPE kna1-name1.` Questo è il modo più usato nei programmi reali, perché il campo ha già lunghezza, descrizioni e aiuti di ricerca corretti.

### Dichiarazioni inline (ABAP 7.40 e successivi)

Invece di dichiarare tutto all'inizio, puoi dichiarare una variabile **nel punto in cui la usi** con `DATA(...)`. Il tipo viene dedotto dal valore a destra.

```abap
DATA(lv_numero) = 10.        " tipo i
DATA(lv_testo)  = `Ciao`.    " tipo string (backtick)
DATA(lv_c)      = 'Ciao'.    " tipo c LENGTH 4 (apici)
DATA(lv_oggi)   = sy-datum.  " tipo d
```

Esiste anche `FINAL(...)` (dalla versione 7.57): come `DATA` inline ma il valore non si può più cambiare.

> [!WARNING]
> Apici singoli `'...'` creano un testo di tipo `c` (gli spazi finali vengono ignorati). Backtick `` `...` `` creano una `string` (gli spazi finali contano). Con le dichiarazioni inline la differenza diventa importante.

### Valore iniziale, CLEAR e IS INITIAL

Ogni tipo ha un **valore iniziale** (0 per i numeri, spazi per `c`, vuoto per `string`, `'00000000'` per `d`).

- `CLEAR lv_x.` riporta la variabile al valore iniziale.
- `IF lv_x IS INITIAL.` controlla se la variabile è al valore iniziale.
- `FREE lv_x.` come `CLEAR` ma libera anche la memoria (utile per tabelle grandi).

### Conversioni automatiche

Se assegni un valore di un tipo a una variabile di un altro tipo, ABAP **converte automaticamente** seguendo delle regole:

```abap
DATA lv_i TYPE i.
DATA lv_c TYPE c LENGTH 10.
DATA lv_p TYPE p LENGTH 8 DECIMALS 2.

lv_c = '123'.
lv_i = lv_c.    " 123: testo convertito in numero
lv_p = '7.55'.
lv_i = lv_p.    " 8: arrotondato (commercialmente)
lv_c = 'ABC'.
* lv_i = lv_c.  " DUMP CX_SY_CONVERSION_NO_NUMBER: 'ABC' non è un numero
```

> [!TIP]
> La conversione automatica è come un traduttore simultaneo: quasi sempre capisce, ma se gli dai una frase senza senso ("ABC" come numero) si blocca.

### L'operatore CONV

`CONV` converte esplicitamente un valore in un tipo, dentro un'espressione:

```abap
DATA(lv_testo)    = CONV string( 42 ).
DATA(lv_decimale) = CONV decfloat34( 10 / 3 ).
```

### Zeri iniziali: ALPHA

In SAP molti codici (cliente, materiale) sono salvati con gli zeri davanti: il cliente "4711" nel database è `0000004711`. Per convertire:

```abap
DATA lv_kunnr TYPE kunnr VALUE '4711'.

lv_kunnr = |{ lv_kunnr ALPHA = IN }|.        " '0000004711'
DATA(lv_vis) = |{ lv_kunnr ALPHA = OUT }|.   " '4711'
```

In alternativa esistono i moduli funzione `CONVERSION_EXIT_ALPHA_INPUT` e `CONVERSION_EXIT_ALPHA_OUTPUT`, che vedrai spesso nel codice vecchio.

> [!WARNING]
> Dimenticare gli zeri iniziali è uno degli errori più comuni: la `SELECT` con `'4711'` non trova nulla, perché nel database c'è `'0000004711'`.

## Ora 3 – Calcoli, date e ore

### Operatori aritmetici

| Operatore | Significato      | Esempio   | Risultato                                         |
| --------- | ---------------- | --------- | ------------------------------------------------- |
| `+`       | somma            | `7 + 2`   | 9                                                 |
| `-`       | sottrazione      | `7 - 2`   | 5                                                 |
| `*`       | moltiplicazione  | `7 * 2`   | 14                                                |
| `/`       | divisione        | `7 / 2`   | 3.5 (con `p`) oppure 4 (in un intero: arrotonda!) |
| `DIV`     | divisione intera | `7 DIV 2` | 3                                                 |
| `MOD`     | resto            | `7 MOD 2` | 1                                                 |
| `**`      | potenza          | `2 ** 3`  | 8                                                 |

```abap
DATA lv_a TYPE i VALUE 7.
DATA lv_b TYPE i VALUE 2.
DATA lv_r TYPE p LENGTH 8 DECIMALS 2.

lv_r = lv_a / lv_b.             " 3.50
DATA(lv_int) = lv_a DIV lv_b.   " 3
DATA(lv_mod) = lv_a MOD lv_b.   " 1

* operatori di assegnazione abbreviati
lv_a += 1.   " lv_a = lv_a + 1
lv_a -= 2.
lv_a *= 3.
lv_a /= 2.
```

> [!WARNING]
> Ricorda gli spazi: `lv_a = lv_b + 1.` è corretto; `lv_a=lv_b+1.` dà errore di sintassi. Le parentesi vogliono lo spazio dentro: `( a + b ) * c`.

### Funzioni numeriche

| Funzione              | Cosa fa               | Esempio                                 |
| --------------------- | --------------------- | --------------------------------------- |
| `abs( )`              | valore assoluto       | `abs( -5 )` = 5                         |
| `sign( )`             | segno (-1, 0, 1)      | `sign( -5 )` = -1                       |
| `ceil( )`             | arrotonda per eccesso | `ceil( '2.1' )` = 3                     |
| `floor( )`            | arrotonda per difetto | `floor( '2.9' )` = 2                    |
| `trunc( )`            | parte intera          | `trunc( '2.9' )` = 2                    |
| `frac( )`             | parte decimale        | `frac( '2.9' )` = 0.9                   |
| `round( )`            | arrotonda             | `round( val = '2.456' dec = 2 )` = 2.46 |
| `sqrt( )`             | radice quadrata       | `sqrt( 16 )` = 4                        |
| `ipow( )`             | potenza intera        | `ipow( base = 2 exp = 10 )` = 1024      |
| `nmax( )` / `nmin( )` | massimo / minimo      | `nmax( val1 = 3 val2 = 8 )` = 8         |

### L'aritmetica a punto fisso

Nelle proprietà di ogni programma c'è la spunta **"Aritmetica a punto fisso"** (_Fixed point arithmetic_). Deve essere **sempre attiva**: senza di essa i numeri di tipo `p` ignorano la virgola nei calcoli e ottieni risultati sbagliati di fattori 100 o 1000.

### Lavorare con le date

Una data (tipo `d`) si può sommare e sottrarre con interi: l'unità è il **giorno**.

```abap
DATA lv_oggi     TYPE d.
DATA lv_scadenza TYPE d.
DATA lv_giorni   TYPE i.

lv_oggi     = sy-datum.
lv_scadenza = lv_oggi + 30.          " fra 30 giorni
lv_giorni   = lv_scadenza - lv_oggi. " 30

* Accedere a parti della data con offset e lunghezza
DATA(lv_anno)   = lv_oggi(4).        " primi 4 caratteri: AAAA
DATA(lv_mese)   = lv_oggi+4(2).      " dalla posizione 4, 2 caratteri: MM
DATA(lv_giorno) = lv_oggi+6(2).      " GG

* Primo giorno del mese corrente
DATA(lv_primo) = lv_oggi.
lv_primo+6(2) = '01'.

* Ultimo giorno del mese precedente
DATA(lv_ultimo_prec) = lv_primo - 1.
```

> [!TIP]
> L'offset funziona come le posizioni a teatro: `+4(2)` vuol dire "salta i primi 4 posti e prendi i 2 successivi". Le posizioni partono da 0.

Il **formato di visualizzazione** (13.11.2026 oppure 11/13/2026) dipende dalle impostazioni dell'utente (transazione SU3). Nel database la data è sempre AAAAMMGG.

```abap
WRITE / lv_oggi.                         " formattata secondo l'utente
DATA(lv_txt) = |{ lv_oggi DATE = USER }|. " stessa cosa in un testo
DATA(lv_iso) = |{ lv_oggi DATE = ISO }|.  " 2026-11-13
```

### Ore e timestamp

```abap
DATA lv_ora TYPE t VALUE '083000'.
lv_ora = lv_ora + 3600.              " un'ora dopo: 093000 (unità = secondi)

* Timestamp: data + ora in un unico valore (UTC)
GET TIME STAMP FIELD DATA(lv_ts).    " tipo timestamp, formato AAAAMMGGhhmmss
CONVERT TIME STAMP lv_ts TIME ZONE 'CET'
        INTO DATE DATA(lv_d) TIME DATA(lv_t).

* Moderno: utclong
DATA(lv_utc) = utclong_current( ).
```

Moduli funzione utili per le date (li riconoscerai nel codice reale): `RP_CALC_DATE_IN_INTERVAL` (somma mesi/anni), `DATE_GET_WEEK` (settimana), `HR_JP_MONTH_BEGIN_END_DATE` (inizio/fine mese), `DAY_ATTRIBUTES_GET` (giorno della settimana e festivi). Nei sistemi moderni esiste anche la classe `cl_abap_datfm` e le funzioni di data delle CDS.

### I campi di sistema (SY)

La struttura `sy` (o `syst`) contiene informazioni sul sistema, disponibili sempre:

| Campo                   | Contenuto                                               |
| ----------------------- | ------------------------------------------------------- |
| `sy-datum`              | data di oggi (del server)                               |
| `sy-uzeit`              | ora attuale (del server)                                |
| `sy-datlo` / `sy-timlo` | data e ora nel fuso dell'utente                         |
| `sy-uname`              | utente collegato                                        |
| `sy-mandt`              | mandante                                                |
| `sy-sysid`              | nome del sistema (es. DEV)                              |
| `sy-langu`              | lingua di accesso                                       |
| `sy-subrc`              | codice di ritorno dell'ultima istruzione (0 = tutto ok) |
| `sy-tabix`              | indice della riga corrente in una tabella interna       |
| `sy-index`              | numero del giro corrente in `DO` / `WHILE`              |
| `sy-dbcnt`              | numero di righe lette/modificate dal database           |
| `sy-repid`              | nome del programma corrente                             |
| `sy-tcode`              | transazione corrente                                    |

`sy-subrc` è il più importante: quasi tutte le istruzioni lo impostano. **0 significa successo**, un altro valore significa che qualcosa non ha funzionato (es. riga non trovata). Imparerai a controllarlo sempre.

> [!WARNING]
> Non assegnare mai valori ai campi di sistema: sono in sola lettura per convenzione e modificarli causa comportamenti imprevedibili.

## Ora 4 – Lavorare con i testi

### Concatenare

```abap
DATA(lv_nome)    = `Anna`.
DATA(lv_cognome) = `Verdi`.

* Modo classico
DATA lv_completo TYPE string.
CONCATENATE lv_nome lv_cognome INTO lv_completo SEPARATED BY space.

* Operatore &&
lv_completo = lv_nome && ` ` && lv_cognome.

* String template (il modo moderno e più comodo)
lv_completo = |{ lv_nome } { lv_cognome }|.
```

### String template in dettaglio

Il testo va tra barre verticali `| ... |`. Le parti tra graffe `{ ... }` sono espressioni che vengono calcolate e inserite.

```abap
DATA(lv_qta)    = 3.
DATA(lv_prezzo) = CONV decfloat34( '19.90' ).
DATA(lv_msg)    = |Hai comprato { lv_qta } articoli per { lv_qta * lv_prezzo } euro.|.

* Opzioni di formattazione
DATA(a) = |{ lv_prezzo DECIMALS = 1 }|.                 " 19.9
DATA(b) = |{ 42 WIDTH = 8 ALIGN = RIGHT PAD = '0' }|.   " 00000042
DATA(c) = |{ `ciao` CASE = UPPER }|.                    " CIAO
DATA(d) = |{ 1234567 NUMBER = USER }|.                  " 1.234.567 (formato utente)
DATA(e) = |Riga 1\nRiga 2\tcon tab|.                    " \n a capo, \t tabulazione
```

> [!TIP]
> Lo string template è come un modulo prestampato "Gentile {nome}, il suo ordine n. {numero} è pronto": tu scrivi il modulo una volta e ABAP riempie gli spazi tra graffe.

### Funzioni sui testi

| Funzione                           | Cosa fa                                | Esempio                                                   | Risultato  |
| ---------------------------------- | -------------------------------------- | --------------------------------------------------------- | ---------- |
| `strlen( )`                        | lunghezza (senza spazi finali per `c`) | ``strlen( `Roma` )``                                      | 4          |
| `to_upper( )` / `to_lower( )`      | maiuscolo / minuscolo                  | ``to_upper( `ciao` )``                                    | CIAO       |
| `condense( )`                      | toglie spazi doppi e ai bordi          | ``condense( ` a  b ` )``                                  | `a b`      |
| `substring( )`                     | estrae una parte                       | ``substring( val = `ABCDEF` off = 2 len = 3 )``           | CDE        |
| `substring_after( )`               | parte dopo un testo                    | ``substring_after( val = `a=b` sub = `=` )``              | b          |
| `substring_before( )`              | parte prima di un testo                | ``substring_before( val = `a=b` sub = `=` )``             | a          |
| `find( )`                          | posizione di un testo (-1 se assente)  | ``find( val = `Roma` sub = `m` )``                        | 2          |
| `replace( )`                       | sostituisce                            | ``replace( val = `a-b-c` sub = `-` with = `/` occ = 0 )`` | a/b/c      |
| `shift_left( )` / `shift_right( )` | sposta / toglie caratteri              | ``shift_left( val = `0012` sub = `0` )``                  | 12         |
| `reverse( )`                       | inverte                                | ``reverse( `abc` )``                                      | cba        |
| `repeat( )`                        | ripete                                 | ``repeat( val = `-` occ = 5 )``                           | -----      |
| `segment( )`                       | n-esimo pezzo separato da un carattere | ``segment( val = `a;b;c` index = 2 sep = `;` )``          | b          |
| `contains( )`                      | contiene? (vero/falso)                 | ``contains( val = `Roma` sub = `om` )``                   | vero       |
| `matches( )`                       | corrisponde a un pattern regex?        | ``matches( val = lv_cap pcre = `\d{5}` )``                | vero/falso |

`occ = 0` significa "tutte le occorrenze".

### Le istruzioni classiche sui testi

Nel codice esistente troverai spesso queste forme:

```abap
DATA lv_riga TYPE string VALUE `Rossi;Mario;Roma`.
DATA: lv_cognome TYPE string, lv_nome TYPE string, lv_citta TYPE string.

SPLIT lv_riga AT ';' INTO lv_cognome lv_nome lv_citta.

DATA lt_parti TYPE TABLE OF string.          " tabella di testi (giorno 5)
SPLIT lv_riga AT ';' INTO TABLE lt_parti.

FIND 'Mario' IN lv_riga.                     " sy-subrc = 0 se trovato
FIND ALL OCCURRENCES OF ';' IN lv_riga MATCH COUNT DATA(lv_count).
REPLACE ALL OCCURRENCES OF ';' IN lv_riga WITH ','.
TRANSLATE lv_riga TO UPPER CASE.
CONDENSE lv_riga NO-GAPS.                    " toglie TUTTI gli spazi
SHIFT lv_riga LEFT DELETING LEADING '0'.
```

### Operatori di confronto per i testi

| Operatore | Significato                                                               |
| --------- | ------------------------------------------------------------------------- |
| `CO`      | _Contains Only_: contiene solo i caratteri indicati                       |
| `CN`      | _Contains Not only_: il contrario di `CO`                                 |
| `CA`      | _Contains Any_: contiene almeno uno dei caratteri                         |
| `NA`      | _contains Not Any_                                                        |
| `CS`      | _Contains String_: contiene la sottostringa (senza distinguere maiuscole) |
| `NS`      | _contains No String_                                                      |
| `CP`      | _Covers Pattern_: corrisponde al modello con `*` e `+`                    |
| `NP`      | _No Pattern_                                                              |

```abap
IF lv_cap CO '0123456789'.
  WRITE 'CAP valido (solo cifre)'.
ENDIF.

IF lv_mail CP '*@*.*'.
  WRITE 'Sembra una e-mail'.
ENDIF.
```

### Espressioni regolari (cenni)

ABAP supporta le espressioni regolari PCRE (`pcre =`), utili per validare formati complessi:

```abap
DATA(lv_mail) = `mario.rossi@example.com`.
IF matches( val = lv_mail pcre = `^[\w.+-]+@[\w-]+\.[\w.]+$` ).
  WRITE 'E-mail valida'.
ENDIF.
```

## Esercizi

> [!IMPORTANT]
>
> 1. Dichiara due numeri interi, calcola somma, differenza, prodotto, divisione (in un tipo `p` con 2 decimali), divisione intera e resto. Stampa ogni risultato con una descrizione usando gli string template.
> 2. Calcola quanti giorni mancano al 31 dicembre dell'anno corrente (costruisci la data con offset: anno di `sy-datum` + `'1231'`).
> 3. Data una stringa `` ` sap  abap   corso ` `` produci `SAP ABAP CORSO` (togli spazi doppi, maiuscolo).
> 4. Dato `'Rossi;Mario;Roma;00184'` estrai i quattro valori con `SPLIT` e poi con `segment( )`. Controlla con `CO` che il CAP contenga solo cifre.
> 5. Converti il numero cliente `'123'` nel formato interno con `ALPHA = IN` e stampalo, poi riconvertilo.
> 6. Calcola il prezzo con IVA (22%) di un articolo da 49,90 € usando una costante per l'aliquota e arrotonda a 2 decimali.

## Quiz

1. Quale tipo useresti per un importo in euro? E per un CAP?
2. Che differenza c'è tra `'testo'` e `` `testo` ``?
3. Che cosa contiene una variabile di tipo `i` appena dichiarata?
4. Che differenza c'è tra `TYPES` e `DATA`?
5. Che cosa succede assegnando `'MILANO'` a una variabile `TYPE c LENGTH 3`?
6. Che valore ha `sy-subrc` se un'istruzione ha avuto successo?
7. Che cosa estrae `lv_data+4(2)` da una data?
8. Perché la spunta "aritmetica a punto fisso" deve essere sempre attiva?

## Soluzioni

```abap
REPORT zes02_soluzioni.

CONSTANTS lc_iva TYPE p LENGTH 3 DECIMALS 2 VALUE '0.22'.

START-OF-SELECTION.
* Es. 1
  DATA(lv_a) = 17.
  DATA(lv_b) = 5.
  DATA lv_div TYPE p LENGTH 8 DECIMALS 2.
  lv_div = lv_a / lv_b.
  WRITE: / |Somma: { lv_a + lv_b }|,
         / |Differenza: { lv_a - lv_b }|,
         / |Prodotto: { lv_a * lv_b }|,
         / |Divisione: { lv_div }|,
         / |Divisione intera: { lv_a DIV lv_b }|,
         / |Resto: { lv_a MOD lv_b }|.

* Es. 2
  DATA lv_fine TYPE d.
  lv_fine = sy-datum(4) && '1231'.
  WRITE / |Giorni a fine anno: { lv_fine - sy-datum }|.

* Es. 3
  DATA(lv_s) = ` sap  abap   corso `.
  WRITE / to_upper( condense( lv_s ) ).

* Es. 4
  DATA(lv_riga) = `Rossi;Mario;Roma;00184`.
  SPLIT lv_riga AT ';' INTO DATA(lv_cog) DATA(lv_nom) DATA(lv_cit) DATA(lv_cap).
  DATA(lv_cap2) = segment( val = lv_riga index = 4 sep = `;` ).
  IF lv_cap CO '0123456789'.
    WRITE / |CAP { lv_cap } valido|.
  ENDIF.

* Es. 5
  DATA lv_kunnr TYPE c LENGTH 10 VALUE '123'.
  lv_kunnr = |{ lv_kunnr ALPHA = IN }|.
  WRITE / lv_kunnr.                     " 0000000123
  WRITE / |{ lv_kunnr ALPHA = OUT }|.   " 123

* Es. 6
  DATA lv_netto TYPE p LENGTH 8 DECIMALS 2 VALUE '49.90'.
  DATA lv_lordo TYPE p LENGTH 8 DECIMALS 2.
  lv_lordo = round( val = lv_netto * ( 1 + lc_iva ) dec = 2 ).
  WRITE / |Prezzo con IVA: { lv_lordo }|.   " 60.88
```

Quiz:

1. Tipo `p` (o un elemento dati del dizionario come `wrbtr`); per il CAP tipo `n LENGTH 5` o `c`.
2. Apici = tipo `c` a lunghezza fissa, spazi finali ignorati; backtick = `string`, gli spazi contano.
3. 0.
4. `TYPES` definisce uno stampo, `DATA` crea una variabile reale.
5. Viene troncato in `'MIL'`.
6. 0.
7. Il mese.
8. Perché senza di essa i calcoli con tipo `p` ignorano i decimali e danno risultati sbagliati.

> [!NOTE]
> Oggi hai imparato: variabili, costanti, tipi predefiniti, `TYPES`, dichiarazioni inline, conversioni, calcoli, date, ore, campi di sistema e manipolazione dei testi. Domani: decisioni e cicli, e il debugger.
