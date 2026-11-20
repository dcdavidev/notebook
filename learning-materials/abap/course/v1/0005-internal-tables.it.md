---
title: Le tabelle interne
description: Lo strumento più usato in ABAP, elenchi di dati in memoria.
---

_Settimana 1 · Livello base · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                             |
| ------ | ------------------------------------------------------------------------------------- |
| Ora 1  | Che cos'è una tabella interna, tipi (standard, sorted, hashed), chiavi, dichiarazione |
| Ora 2  | Riempire e leggere: APPEND, INSERT, VALUE, READ TABLE, espressioni tabella            |
| Ora 3  | LOOP AT, MODIFY, DELETE, SORT, COLLECT, field-symbols e riferimenti                   |
| Ora 4  | Operazioni utili, prestazioni, ripasso della settimana e mini-progetto                |

## Ora 1 – Che cos'è una tabella interna

Una **tabella interna** è un elenco di righe **in memoria**, che esiste solo mentre il programma gira. Tutte le righe hanno la stessa struttura. Di solito si leggono dati dal database in una tabella interna, li si elabora e poi si mostrano o si salvano.

> [!TIP]
> Il database è il grande archivio dell'azienda nello scantinato. La tabella interna è la pila di fogli fotocopiati che porti sulla tua scrivania per lavorarci: ci scrivi sopra, la riordini, butti i fogli che non servono. Quando hai finito, se vuoi, aggiorni l'archivio. Se butti la pila (fine programma), l'archivio non cambia.

### I tre tipi di tabella

| Tipo       | Come è organizzata                                           | Accesso per chiave                                     | Quando usarla                                       |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------- |
| `STANDARD` | righe nell'ordine di inserimento, con indice                 | lento (lettura sequenziale) se non usi `BINARY SEARCH` | la più comune; tabelle piccole, accesso per indice  |
| `SORTED`   | sempre ordinata per chiave, con indice                       | veloce (ricerca binaria automatica)                    | accessi frequenti per chiave, servono dati ordinati |
| `HASHED`   | nessun indice, accesso solo per chiave tramite funzione hash | velocissimo e costante, anche con milioni di righe     | grandi tabelle lette solo per chiave unica          |

> [!TIP]
> `STANDARD` è un mazzo di carte nell'ordine in cui le hai pescate: per trovare l'asso di cuori devi guardarle una per una. `SORTED` è un dizionario: trovi la parola aprendo a metà e restringendo. `HASHED` è un guardaroba con lo scontrino numerato: dai il numero e ti restituiscono subito il cappotto, senza cercare.

### Dichiarare una tabella interna

```abap
TYPES: BEGIN OF ty_volo,
         carrid   TYPE s_carr_id,   " compagnia
         connid   TYPE s_conn_id,   " numero volo
         cityfrom TYPE s_from_cit,
         cityto   TYPE s_to_city,
         prezzo   TYPE s_price,
       END OF ty_volo.

* Tabella standard con chiave di default (tutti i campi carattere)
DATA lt_voli TYPE STANDARD TABLE OF ty_volo WITH DEFAULT KEY.

* Tabella standard senza chiave (spesso la scelta migliore per le standard)
DATA lt_voli2 TYPE STANDARD TABLE OF ty_volo WITH EMPTY KEY.

* Tabella ordinata con chiave unica
DATA lt_ordinata TYPE SORTED TABLE OF ty_volo WITH UNIQUE KEY carrid connid.

* Tabella hashed (la chiave deve essere UNIQUE)
DATA lt_hash TYPE HASHED TABLE OF ty_volo WITH UNIQUE KEY carrid connid.

* Forma breve: TABLE OF = STANDARD TABLE OF ... WITH DEFAULT KEY
DATA lt_breve TYPE TABLE OF ty_volo.

* Con riga presa da una tabella del DDIC
DATA lt_spfli TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.

* Definire prima un TIPO tabella, poi la variabile
TYPES tt_voli TYPE STANDARD TABLE OF ty_volo WITH EMPTY KEY.
DATA lt_voli3 TYPE tt_voli.

* Work area: una variabile con la struttura di UNA riga
DATA ls_volo TYPE ty_volo.
```

- `UNIQUE KEY`: due righe non possono avere la stessa chiave (obbligatorio per `HASHED`).
- `NON-UNIQUE KEY`: chiavi duplicate ammesse (possibile per `STANDARD` e `SORTED`).
- **Chiavi secondarie** (`WITH NON-UNIQUE SORTED KEY nome COMPONENTS ...`): una tabella può avere ulteriori chiavi per accessi veloci su altri campi.

```abap
DATA lt_voli_k TYPE SORTED TABLE OF ty_volo
               WITH UNIQUE KEY carrid connid
               WITH NON-UNIQUE SORTED KEY by_city COMPONENTS cityfrom.
```

### Vecchie sintassi da riconoscere

Nel codice vecchio troverai tabelle **con riga di intestazione** (_header line_), dove la tabella e la sua work area hanno lo stesso nome:

```abap
DATA itab TYPE TABLE OF ty_volo WITH HEADER LINE.   " OBSOLETO
DATA: BEGIN OF itab2 OCCURS 0, ... END OF itab2.    " OBSOLETO
TABLES spfli.                                       " OBSOLETO (tranne che per le schermate)
```

`itab` indica la work area e `itab[]` l'intera tabella. Queste forme sono vietate nelle classi e nel codice moderno: riconoscile, ma non usarle.

## Ora 2 – Riempire e leggere

### APPEND e INSERT

```abap
DATA lt_voli TYPE STANDARD TABLE OF ty_volo WITH EMPTY KEY.
DATA ls_volo TYPE ty_volo.

ls_volo-carrid = 'AZ'. ls_volo-connid = '0555'.
ls_volo-cityfrom = 'ROMA'. ls_volo-cityto = 'FRANKFURT'. ls_volo-prezzo = 180.
APPEND ls_volo TO lt_voli.                       " aggiunge in fondo

* Moderno: senza work area
APPEND VALUE #( carrid = 'LH' connid = '0400' cityfrom = 'FRANKFURT'
                cityto = 'NEW YORK' prezzo = 650 ) TO lt_voli.

* INSERT in una posizione precisa (standard) ...
INSERT VALUE #( carrid = 'AA' connid = '0017' ) INTO lt_voli INDEX 1.

* ... o secondo la chiave (sorted/hashed: la posizione la decide la chiave)
INSERT VALUE #( carrid = 'AZ' connid = '0555' ) INTO TABLE lt_ordinata.
IF sy-subrc <> 0.
  WRITE 'Chiave già presente!'.                  " sy-subrc = 4 con chiave duplicata
ENDIF.
```

> [!WARNING]
> Con le tabelle `SORTED` non usare `APPEND` se la riga non va "in fondo" secondo l'ordine: provoca un dump. Usa sempre `INSERT ... INTO TABLE` per `SORTED` e `HASHED`.

### Riempire tutto in una volta con VALUE

```abap
DATA(lt_citta) = VALUE string_table( ( `Roma` ) ( `Milano` ) ( `Napoli` ) ).

lt_voli = VALUE #(
  ( carrid = 'AZ' connid = '0555' cityfrom = 'ROMA'      cityto = 'FRANKFURT' prezzo = 180 )
  ( carrid = 'AZ' connid = '0789' cityfrom = 'ROMA'      cityto = 'TOKYO'     prezzo = 900 )
  ( carrid = 'LH' connid = '0400' cityfrom = 'FRANKFURT' cityto = 'NEW YORK'  prezzo = 650 ) ).

* Aggiungere senza cancellare il contenuto esistente: BASE
lt_voli = VALUE #( BASE lt_voli ( carrid = 'UA' connid = '0941' ) ).
```

### Quante righe ci sono?

```abap
DATA(lv_righe) = lines( lt_voli ).
IF lt_voli IS INITIAL.
  WRITE 'Tabella vuota'.
ENDIF.
```

### Leggere una riga: READ TABLE (classico)

```abap
* Per indice
READ TABLE lt_voli INTO ls_volo INDEX 2.

* Per chiave (o per campi qualsiasi)
READ TABLE lt_voli INTO ls_volo WITH KEY carrid = 'LH' connid = '0400'.
IF sy-subrc = 0.
  WRITE: / 'Trovato in posizione', sy-tabix, ls_volo-cityto.
ELSE.
  WRITE / 'Non trovato'.
ENDIF.

* Solo verificare l'esistenza, senza copiare la riga
READ TABLE lt_voli TRANSPORTING NO FIELDS WITH KEY carrid = 'LH'.

* Ricerca binaria su tabella STANDARD (deve essere ORDINATA prima con SORT!)
SORT lt_voli BY carrid connid.
READ TABLE lt_voli INTO ls_volo WITH KEY carrid = 'LH' connid = '0400' BINARY SEARCH.
```

### Leggere una riga: espressioni tabella (moderno)

```abap
DATA(ls_v1)   = lt_voli[ 1 ].                              " per indice
DATA(ls_v2)   = lt_voli[ carrid = 'LH' connid = '0400' ].  " per campi
DATA(lv_dest) = lt_voli[ carrid = 'LH' ]-cityto.           " direttamente un campo
DATA(ls_v3)   = lt_ordinata[ KEY primary_key carrid = 'AZ' connid = '0555' ].
```

> [!WARNING]
> Se la riga non esiste, l'espressione tabella genera l'eccezione `CX_SY_ITAB_LINE_NOT_FOUND` (dump se non gestita). Hai tre soluzioni, qui sotto.

```abap
* 1. Controllare prima
IF line_exists( lt_voli[ carrid = 'XX' ] ).
  DATA(ls_x) = lt_voli[ carrid = 'XX' ].
ENDIF.

* 2. Valore di default
DATA(ls_y) = VALUE #( lt_voli[ carrid = 'XX' ] OPTIONAL ).         " riga vuota
DATA(ls_z) = VALUE #( lt_voli[ carrid = 'XX' ] DEFAULT ls_volo ).  " riga alternativa

* 3. Gestire l'eccezione (giorno 11)
TRY.
    DATA(ls_w) = lt_voli[ carrid = 'XX' ].
  CATCH cx_sy_itab_line_not_found.
    WRITE 'Riga non trovata'.
ENDTRY.

* Posizione di una riga
DATA(lv_idx) = line_index( lt_voli[ carrid = 'LH' ] ).   " 0 se non trovata
```

## Ora 3 – Scorrere e modificare

### LOOP AT

```abap
LOOP AT lt_voli INTO ls_volo.
  WRITE: / sy-tabix, ls_volo-carrid, ls_volo-connid, ls_volo-cityto.
ENDLOOP.

* Con condizione
LOOP AT lt_voli INTO ls_volo WHERE carrid = 'AZ' AND prezzo > 200.
  WRITE / ls_volo-cityto.
ENDLOOP.

* Con dichiarazione inline
LOOP AT lt_voli INTO DATA(ls_v).
  ...
ENDLOOP.

* Solo un intervallo di righe
LOOP AT lt_voli INTO ls_volo FROM 2 TO 5.
ENDLOOP.
```

Dentro il loop `sy-tabix` contiene l'indice della riga corrente. Dopo il loop, `sy-subrc` vale 0 se almeno una riga è stata elaborata, 4 altrimenti.

### Modificare le righe

Con `INTO` lavori su una **copia** della riga: cambiare `ls_volo` non cambia la tabella. Per modificare hai tre strade:

```abap
* 1. MODIFY con work area (classico)
LOOP AT lt_voli INTO ls_volo.
  ls_volo-prezzo = ls_volo-prezzo * '1.1'.
  MODIFY lt_voli FROM ls_volo.                  " modifica la riga corrente
ENDLOOP.

* 2. FIELD-SYMBOL: un "puntatore" diretto alla riga (più veloce)
LOOP AT lt_voli ASSIGNING FIELD-SYMBOL(<ls_volo>).
  <ls_volo>-prezzo = <ls_volo>-prezzo * '1.1'.  " modifica direttamente la tabella
ENDLOOP.

* 3. REFERENCE INTO: un riferimento alla riga
LOOP AT lt_voli REFERENCE INTO DATA(lr_volo).
  lr_volo->prezzo = lr_volo->prezzo * '1.1'.
ENDLOOP.

* MODIFY senza loop: tutte le righe che soddisfano la condizione
ls_volo-prezzo = 0.
MODIFY lt_voli FROM ls_volo TRANSPORTING prezzo WHERE carrid = 'UA'.

* Con espressione tabella
lt_voli[ carrid = 'LH' connid = '0400' ]-prezzo = 700.
```

### Field-symbols spiegati bene

Un **field-symbol** (nome tra `< >`) non contiene dati: è un **nome alternativo** per un dato che esiste già da un'altra parte.

> [!TIP]
> Un field-symbol è come il telecomando della TV: non è la TV, ma se premi un tasto la TV cambia davvero. Una work area (`INTO`) invece è come una foto della TV: puoi scarabocchiarla quanto vuoi, la TV non cambia.

```abap
DATA lv_numero TYPE i VALUE 5.
FIELD-SYMBOLS <fs> TYPE i.

ASSIGN lv_numero TO <fs>.
<fs> = 10.
WRITE lv_numero.           " 10: abbiamo modificato lv_numero attraverso <fs>

READ TABLE lt_voli ASSIGNING FIELD-SYMBOL(<riga>) WITH KEY carrid = 'AZ'.
IF sy-subrc = 0.           " o: IF <riga> IS ASSIGNED.
  <riga>-prezzo = 99.
ENDIF.
```

> [!WARNING]
> Usare un field-symbol non assegnato causa un dump `GETWA_NOT_ASSIGNED`. Controlla sempre `sy-subrc` o `IS ASSIGNED` dopo `READ`/`ASSIGN`.

### DELETE

```abap
DELETE lt_voli INDEX 1.                                            " per indice
DELETE lt_voli WHERE prezzo < 100.                                 " per condizione
DELETE TABLE lt_hash WITH TABLE KEY carrid = 'AZ' connid = '0555'. " per chiave

LOOP AT lt_voli INTO ls_volo.
  IF ls_volo-cityto IS INITIAL.
    DELETE lt_voli.        " la riga corrente (sconsigliato, preferisci WHERE)
  ENDIF.
ENDLOOP.

* Eliminare i doppioni (la tabella deve essere ordinata prima!)
SORT lt_voli BY carrid connid.
DELETE ADJACENT DUPLICATES FROM lt_voli COMPARING carrid connid.

CLEAR lt_voli.   " svuota la tabella
FREE lt_voli.    " svuota e libera la memoria
```

### SORT

```abap
SORT lt_voli BY carrid ASCENDING prezzo DESCENDING.
SORT lt_voli BY cityto AS TEXT.   " ordine alfabetico secondo la lingua (accenti)
SORT lt_voli STABLE BY carrid.    " mantiene l'ordine relativo delle righe uguali
```

Le tabelle `SORTED` non si possono riordinare con `SORT` (sono già ordinate per chiave); le `HASHED` sì, ma solo per comodità di stampa.

### COLLECT: sommare per chiave

`COLLECT` inserisce una riga, ma se esiste già una riga con gli stessi campi non numerici (la chiave), **somma** i campi numerici.

```abap
TYPES: BEGIN OF ty_tot,
         carrid TYPE s_carr_id,
         totale TYPE s_price,
       END OF ty_tot.
DATA lt_tot TYPE STANDARD TABLE OF ty_tot WITH DEFAULT KEY.

LOOP AT lt_voli INTO ls_volo.
  COLLECT VALUE ty_tot( carrid = ls_volo-carrid totale = ls_volo-prezzo ) INTO lt_tot.
ENDLOOP.
" Una riga per compagnia con la somma dei prezzi
```

Nel giorno 12 vedrai alternative moderne (`REDUCE` e `LOOP AT ... GROUP BY`).

### Gli eventi di controllo nel loop (AT NEW, AT END OF)

Sintassi classica per i raggruppamenti, ancora molto diffusa (la tabella deve essere ordinata per i campi di raggruppamento, che devono essere i primi della struttura):

```abap
SORT lt_voli BY carrid.
LOOP AT lt_voli INTO ls_volo.
  AT NEW carrid.
    WRITE / |Compagnia { ls_volo-carrid }|.
  ENDAT.

  WRITE /5 ls_volo-connid.

  AT END OF carrid.
    SUM.                          " somma i campi numerici del gruppo
    WRITE /5 |Totale: { ls_volo-prezzo }|.
  ENDAT.

  AT LAST.
    SUM.
    WRITE / |Totale generale: { ls_volo-prezzo }|.
  ENDAT.
ENDLOOP.
```

> [!WARNING]
> Dentro `AT NEW` / `AT END OF` i campi a destra del campo di raggruppamento appaiono come `*` o valori iniziali. È un comportamento che sorprende sempre i principianti.

## Ora 4 – Operazioni utili e prestazioni

### Copiare e confrontare tabelle

```abap
DATA(lt_copia) = lt_voli.                              " copia completa
APPEND LINES OF lt_voli TO lt_copia.                   " accoda tutte le righe
INSERT LINES OF lt_voli FROM 1 TO 2 INTO TABLE lt_copia.
IF lt_voli = lt_copia.                                 " confronto riga per riga
ENDIF.
```

### Tabelle di tabelle (tabelle profonde)

Una riga può contenere un'altra tabella:

```abap
TYPES: BEGIN OF ty_cliente,
         nome   TYPE string,
         ordini TYPE STANDARD TABLE OF i WITH EMPTY KEY,
       END OF ty_cliente.
DATA lt_clienti TYPE STANDARD TABLE OF ty_cliente WITH EMPTY KEY.

lt_clienti = VALUE #( ( nome = `Rossi` ordini = VALUE #( ( 1 ) ( 2 ) ) ) ).
```

### Regole d'oro di prestazioni

| Situazione                                      | Cosa fare                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Lettura per chiave in tabella grande            | usa `SORTED` o `HASHED`, o una chiave secondaria                                                          |
| Tabella `STANDARD` letta molte volte per chiave | `SORT` una volta + `BINARY SEARCH`                                                                        |
| Modificare righe in un loop                     | `ASSIGNING FIELD-SYMBOL` invece di `INTO` + `MODIFY`                                                      |
| Loop annidati (tabella dentro tabella)          | il loop interno con `WHERE` su tabella `SORTED` per la chiave: evita il "loop dentro il loop" su standard |
| Tabelle enormi non più usate                    | `FREE`                                                                                                    |

> [!TIP]
> Un loop annidato su due tabelle standard da 10.000 righe ciascuna fa 100 milioni di confronti: è come cercare un nome in un elenco telefonico non ordinato, una volta per ogni abitante della città. Ordinando l'elenco (`SORTED`) ogni ricerca diventa istantanea.

### Ripasso della settimana: mini-progetto

Scrivi il report `ZMINI_PROGETTO_S1` che:

1. Definisce un tipo per uno studente (matricola, nome, corso, voto).
2. Riempie una tabella con almeno 8 studenti di 3 corsi diversi usando `VALUE`.
3. Stampa l'elenco ordinato per corso e poi per voto decrescente.
4. Per ogni corso stampa il numero di studenti e la media dei voti (`AT NEW`/`AT END OF` o `COLLECT`).
5. Aumenta di 1 il voto di chi ha meno di 18 (`ASSIGNING`), senza superare 30.
6. Elimina gli studenti con voto ancora sotto 18 e stampa quanti sono rimasti.
7. Cerca uno studente per matricola con un'espressione tabella gestendo il caso "non trovato".

## Esercizi

> [!IMPORTANT]
>
> 1. Crea una tabella standard di stringhe con 5 nomi, ordinala alfabeticamente e stampala.
> 2. Crea una tabella `HASHED` di prodotti (codice, descrizione, prezzo) con chiave unica il codice. Prova a inserire due volte lo stesso codice e controlla `sy-subrc`.
> 3. Data una tabella di vendite (regione, importo) con righe ripetute per regione, calcola il totale per regione con `COLLECT`.
> 4. Con un `LOOP` e un field-symbol aumenta del 5% tutti i prezzi superiori a 100.
> 5. Leggi la tabella `SPFLI` in una tabella interna con `SELECT * FROM spfli INTO TABLE @DATA(lt_spfli).` (anticipazione di domani) e stampa i voli che partono da FRANKFURT.
> 6. Completa il mini-progetto della settimana.

## Quiz

1. Che differenza c'è tra tabella interna e tabella del database?
2. Quale tipo di tabella scegli per leggere per chiave unica una tabella da un milione di righe?
3. Che cosa succede se leggi con `lt_tab[ ... ]` una riga che non esiste?
4. Che differenza c'è tra `LOOP AT ... INTO` e `LOOP AT ... ASSIGNING`?
5. Che cosa fa `COLLECT`?
6. Che cosa bisogna fare prima di `DELETE ADJACENT DUPLICATES` e di `BINARY SEARCH`?
7. Che cosa contiene `sy-tabix` in un loop?

## Soluzioni

```abap
REPORT zes05_soluzioni.

TYPES: BEGIN OF ty_prod,
         codice TYPE c LENGTH 5,
         descr  TYPE string,
         prezzo TYPE p LENGTH 8 DECIMALS 2,
       END OF ty_prod.
TYPES: BEGIN OF ty_vendita,
         regione TYPE c LENGTH 20,
         importo TYPE p LENGTH 10 DECIMALS 2,
       END OF ty_vendita.
TYPES tt_vendite TYPE STANDARD TABLE OF ty_vendita WITH EMPTY KEY.

START-OF-SELECTION.
* Es. 1
  DATA(lt_nomi) = VALUE string_table( ( `Paolo` ) ( `Anna` ) ( `Zeno` ) ( `Carla` ) ( `Bruno` ) ).
  SORT lt_nomi.
  LOOP AT lt_nomi INTO DATA(lv_nome).
    WRITE / lv_nome.
  ENDLOOP.

* Es. 2
  DATA lt_prod TYPE HASHED TABLE OF ty_prod WITH UNIQUE KEY codice.
  INSERT VALUE #( codice = 'P001' descr = `Penna`  prezzo = '1.50' ) INTO TABLE lt_prod.
  INSERT VALUE #( codice = 'P001' descr = `Matita` prezzo = '0.80' ) INTO TABLE lt_prod.
  WRITE / |Secondo inserimento sy-subrc = { sy-subrc }|.   " 4

* Es. 3
  DATA(lt_vend) = VALUE tt_vendite(
    ( regione = 'NORD' importo = 100 ) ( regione = 'SUD'    importo = 50 )
    ( regione = 'NORD' importo = 200 ) ( regione = 'CENTRO' importo = 70 ) ).
  DATA lt_tot TYPE STANDARD TABLE OF ty_vendita WITH DEFAULT KEY.
  LOOP AT lt_vend INTO DATA(ls_v).
    COLLECT ls_v INTO lt_tot.
  ENDLOOP.
  LOOP AT lt_tot INTO DATA(ls_t).
    WRITE / |{ ls_t-regione }: { ls_t-importo }|.
  ENDLOOP.

* Es. 4
  INSERT VALUE #( codice = 'P002' descr = `Zaino` prezzo = 120 ) INTO TABLE lt_prod.
  LOOP AT lt_prod ASSIGNING FIELD-SYMBOL(<p>) WHERE prezzo > 100.
    <p>-prezzo = <p>-prezzo * '1.05'.
  ENDLOOP.

* Es. 5
  SELECT * FROM spfli INTO TABLE @DATA(lt_spfli).
  LOOP AT lt_spfli INTO DATA(ls_spfli) WHERE cityfrom = 'FRANKFURT'.
    WRITE: / ls_spfli-carrid, ls_spfli-connid, ls_spfli-cityto.
  ENDLOOP.
```

Quiz:

1. La tabella interna vive in memoria solo durante l'esecuzione; quella del database è permanente.
2. `HASHED` con chiave unica.
3. Eccezione `CX_SY_ITAB_LINE_NOT_FOUND` (dump se non gestita).
4. `INTO` copia la riga (le modifiche non toccano la tabella); `ASSIGNING` punta direttamente alla riga (le modifiche cambiano la tabella ed è più veloce).
5. Inserisce una riga o, se la chiave esiste già, ne somma i campi numerici.
6. Ordinare la tabella con `SORT` per i campi usati.
7. L'indice della riga corrente.

> [!NOTE]
> Settimana 1 completata! Ora conosci le basi: sistema SAP, sintassi, tipi, decisioni, cicli, debugger, Dizionario Dati e tabelle interne. La prossima settimana passi al livello intermedio, a partire dalla lettura e scrittura nel database con Open SQL.
