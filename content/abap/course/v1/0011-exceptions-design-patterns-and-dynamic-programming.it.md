---
title: Eccezioni, design pattern e programmazione dinamica
description: Gestire gli errori in modo professionale e scrivere codice che si adatta a runtime.
---

_Settimana 3 · Livello avanzato · 4 ore_

### Programma di oggi

| Blocco | Contenuto                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------- |
| Ora 1  | Eccezioni basate su classi: `TRY`, `CATCH`, `CLEANUP`, `RAISE`, `RETRY`, `RESUME`                  |
| Ora 2  | Creare le proprie eccezioni; messaggi nelle eccezioni; le tre categorie                            |
| Ora 3  | Design pattern: singleton, factory, strategy, observer, MVC; principi SOLID                        |
| Ora 4  | Programmazione dinamica: riferimenti a dati, field-symbols dinamici, RTTI/RTTS, chiamate dinamiche |

## Ora 1 – Le eccezioni basate su classi

Un'**eccezione** è un evento anomalo che interrompe il flusso normale del programma: un file che non esiste, una divisione per zero, un cliente non trovato. Finora hai visto `sy-subrc` e le vecchie `EXCEPTIONS` dei moduli funzione. Il modo moderno sono le **eccezioni basate su classi**.

> [!TIP]
> Un'eccezione è come l'allarme antincendio di un palazzo. Chi scopre il fuoco (il codice che trova l'errore) non deve sapere chi lo spegnerà: preme il pulsante (`RAISE`). L'allarme sale piano dopo piano (la pila delle chiamate) finché qualcuno preposto (`CATCH`) interviene. Se nessuno interviene, il palazzo viene evacuato (dump).

### TRY ... CATCH ... ENDTRY

```abap
DATA lv_a TYPE i VALUE 10.
DATA lv_b TYPE i VALUE 0.

TRY.
    DATA(lv_r) = lv_a / lv_b.
    WRITE lv_r.                             " non viene eseguito
  CATCH cx_sy_zerodivide INTO DATA(lx_div).
    WRITE / |Errore: { lx_div->get_text( ) }|.
ENDTRY.

WRITE / 'Il programma continua'.
```

- Il codice "a rischio" va nel blocco `TRY`.
- Se si verifica un'eccezione, il resto del `TRY` viene saltato e si passa al `CATCH` corrispondente.
- `INTO` ti dà l'oggetto eccezione, con metodi come `get_text( )` (testo leggibile), `get_longtext( )`, `get_source_position( )`.
- L'attributo `previous` contiene l'eccezione precedente (per catene di errori).

### Più CATCH e gerarchia

Le eccezioni sono classi organizzate in una gerarchia. Un `CATCH` su una superclasse cattura anche tutte le sottoclassi.

```abap
TRY.
    DATA(ls_volo) = lt_voli[ carrid = 'XX' ].
    DATA(lv_x) = CONV i( lv_testo ).
  CATCH cx_sy_itab_line_not_found.
    WRITE 'Riga non trovata'.
  CATCH cx_sy_conversion_no_number cx_sy_conversion_overflow.   " più classi insieme
    WRITE 'Conversione non riuscita'.
  CATCH cx_root INTO DATA(lx_all).                              " tutto il resto
    WRITE lx_all->get_text( ).
ENDTRY.
```

> [!WARNING]
> Metti i `CATCH` dal più specifico al più generico: il primo che corrisponde vince. Catturare `cx_root` ovunque "per sicurezza" è una cattiva pratica: nasconde errori che dovresti conoscere.

### La gerarchia principale

| Classe             | Significato                                                                                       | Controllo del compilatore                                  |
| ------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `CX_ROOT`          | radice di tutte le eccezioni                                                                      |                                                            |
| `CX_STATIC_CHECK`  | errori previsti che il chiamante deve gestire (es. cliente non trovato)                           | obbligatorio dichiararle con `RAISING` (avviso altrimenti) |
| `CX_DYNAMIC_CHECK` | errori che si possono evitare con un controllo prima (es. divisione per zero, indice fuori range) | dichiarazione richiesta, controllata a runtime             |
| `CX_NO_CHECK`      | errori gravi, di sistema, che possono avvenire ovunque (es. memoria esaurita)                     | nessuna dichiarazione necessaria                           |

### CLEANUP

Il blocco `CLEANUP` viene eseguito quando un'eccezione **lascia** il `TRY` senza essere gestita lì: serve a "rimettere in ordine" (chiudere file, rilasciare blocchi) prima che l'eccezione salga.

```abap
METHOD elabora_file.
  OPEN DATASET mv_file FOR INPUT IN TEXT MODE ENCODING DEFAULT.
  TRY.
      leggi_righe( ).           " può sollevare zcx_formato_errato
    CLEANUP.
      CLOSE DATASET mv_file.    " eseguito solo se l'eccezione esce dal TRY
  ENDTRY.
  CLOSE DATASET mv_file.
ENDMETHOD.
```

### RETRY e RESUME

- `RETRY.` (in un `CATCH`) riesegue il blocco `TRY` da capo: utile dopo aver corretto la causa (es. riconnettersi). Attenzione ai cicli infiniti.
- `RESUME.` riprende l'esecuzione subito dopo il punto in cui l'eccezione è stata sollevata. Funziona solo con eccezioni sollevate con `RAISE RESUMABLE EXCEPTION` e catturate con `CATCH BEFORE UNWIND`.

## Ora 2 – Creare le proprie eccezioni

### La classe di eccezione

In ADT: New → ABAP Class, nome `ZCX_VOLO_NON_TROVATO`, superclasse `CX_STATIC_CHECK`. Per usare i messaggi di SE91 si implementa l'interfaccia `IF_T100_MESSAGE` (o `IF_T100_DYN_MSG`).

```abap
CLASS zcx_volo_non_trovato DEFINITION PUBLIC
  INHERITING FROM cx_static_check FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_t100_dyn_msg.
    DATA mv_carrid TYPE s_carr_id READ-ONLY.
    DATA mv_connid TYPE s_conn_id READ-ONLY.
    METHODS constructor
      IMPORTING textid    LIKE if_t100_message=>t100key OPTIONAL
                previous  LIKE previous OPTIONAL
                iv_carrid TYPE s_carr_id OPTIONAL
                iv_connid TYPE s_conn_id OPTIONAL.
ENDCLASS.

CLASS zcx_volo_non_trovato IMPLEMENTATION.
  METHOD constructor ##ADT_SUPPRESS_GENERATION.
    super->constructor( previous = previous ).
    mv_carrid = iv_carrid.
    mv_connid = iv_connid.
    CLEAR me->textid.
    if_t100_message~t100key = COND #( WHEN textid IS INITIAL
                                      THEN if_t100_message=>default_textid
                                      ELSE textid ).
  ENDMETHOD.
ENDCLASS.
```

Con `IF_T100_DYN_MSG` il modo più semplice di sollevarla è con un messaggio:

```abap
METHOD get_volo.
  SELECT SINGLE * FROM spfli
    WHERE carrid = @iv_carrid AND connid = @iv_connid
    INTO @rs_volo.
  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE zcx_volo_non_trovato
      MESSAGE e001(zcorso) WITH iv_carrid iv_connid
      EXPORTING iv_carrid = iv_carrid iv_connid = iv_connid.
  ENDIF.
ENDMETHOD.
```

Il metodo deve dichiarare l'eccezione nella sua firma:

```abap
METHODS get_volo
  IMPORTING iv_carrid       TYPE s_carr_id
            iv_connid       TYPE s_conn_id
  RETURNING VALUE(rs_volo)  TYPE spfli
  RAISING   zcx_volo_non_trovato.
```

E il chiamante la gestisce:

```abap
TRY.
    DATA(ls_volo) = lo_repo->get_volo( iv_carrid = 'LH' iv_connid = '9999' ).
  CATCH zcx_volo_non_trovato INTO DATA(lx).
    MESSAGE lx TYPE 'I' DISPLAY LIKE 'E'.   " un'eccezione T100 si può mostrare direttamente
ENDTRY.
```

### Altre forme di RAISE

```abap
RAISE EXCEPTION NEW zcx_volo_non_trovato( iv_carrid = 'LH' ).   " con oggetto

DATA(lv_val) = COND #( WHEN lv_ok = abap_true THEN 1
                       ELSE THROW zcx_errore( ) ).              " dentro un'espressione

RAISE EXCEPTION lx_esistente.                                    " rilanciare un oggetto
```

### Propagare e incapsulare

Un metodo può non gestire un'eccezione e lasciarla salire, dichiarandola in `RAISING`. Oppure può catturarla e trasformarla in un'eccezione del proprio livello, passando l'originale in `previous`:

```abap
TRY.
    lo_db->salva( ls_ordine ).
  CATCH cx_sy_open_sql_db INTO DATA(lx_sql).
    RAISE EXCEPTION NEW zcx_ordine_errore( previous = lx_sql ).
ENDTRY.
```

> [!TIP]
> È come il passaparola tra reparti: il magazzino segnala "scaffale vuoto" all'ufficio vendite, che al cliente non dice "scaffale vuoto" ma "prodotto non disponibile" (eccezione del suo livello), conservando però il messaggio originale per chi vuole indagare.

### Eccezioni classiche e moderne a confronto

| Aspetto      | Classiche (`EXCEPTIONS`)      | Basate su classi                                |
| ------------ | ----------------------------- | ----------------------------------------------- |
| Dove         | FM, metodi vecchi             | ovunque, standard moderno                       |
| Informazioni | solo `sy-subrc` (+ `sy-msg*`) | oggetto con testi, attributi, catena `previous` |
| Propagazione | no, finisce al chiamante      | sale automaticamente nella pila                 |
| Gestione     | `IF sy-subrc ...`             | `TRY ... CATCH`                                 |

Un metodo non può usare entrambe le tecniche nella stessa firma.

### Asserzioni e checkpoint

- `ASSERT condizione.` se la condizione è falsa → dump `ASSERTION_FAILED`. Si usa per verificare ipotesi "impossibili" durante lo sviluppo.
- **Checkpoint group** (transazione SAAB): permettono di attivare/disattivare asserzioni, breakpoint e log (`LOG-POINT`) senza modificare il codice.

### Il log applicativo (SLG1)

Per i programmi in background e le interfacce, gli errori si registrano nel **log applicativo**: oggetti e sottooggetti definiti in SLG0, consultazione con SLG1, scrittura con i FM `BAL_LOG_CREATE`, `BAL_LOG_MSG_ADD`, `BAL_DB_SAVE` o, in ABAP Cloud, con `cl_bali_log`.

## Ora 3 – Design pattern e principi

I **design pattern** sono soluzioni collaudate a problemi ricorrenti di progettazione.

### Singleton: un solo oggetto

```abap
CLASS lcl_config DEFINITION CREATE PRIVATE.   " nessuno può fare NEW da fuori
  PUBLIC SECTION.
    CLASS-METHODS get_instance RETURNING VALUE(ro_inst) TYPE REF TO lcl_config.
    METHODS get_valore IMPORTING iv_chiave TYPE string RETURNING VALUE(rv) TYPE string.
  PRIVATE SECTION.
    CLASS-DATA go_instance TYPE REF TO lcl_config.
ENDCLASS.

CLASS lcl_config IMPLEMENTATION.
  METHOD get_instance.
    IF go_instance IS NOT BOUND.
      go_instance = NEW #( ).
    ENDIF.
    ro_inst = go_instance.
  ENDMETHOD.

  METHOD get_valore.
    rv = |valore di { iv_chiave }|.
  ENDMETHOD.
ENDCLASS.

" uso
DATA(lv_v) = lcl_config=>get_instance( )->get_valore( `PAESE` ).
```

> [!TIP]
> Il singleton è come il Presidente della Repubblica: ce n'è uno solo, e chiunque lo cerchi trova sempre lo stesso.

### Factory: chi crea gli oggetti

```abap
CLASS lcl_forma_factory DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS crea IMPORTING iv_tipo TYPE string iv_dim TYPE decfloat34
                       RETURNING VALUE(ro) TYPE REF TO lcl_forma.   " la classe astratta del giorno 10
ENDCLASS.

CLASS lcl_forma_factory IMPLEMENTATION.
  METHOD crea.
    ro = SWITCH #( iv_tipo
                   WHEN `CERCHIO`  THEN NEW lcl_cerchio( iv_dim )
                   WHEN `QUADRATO` THEN NEW lcl_quadrato( iv_dim )
                   ELSE THROW cx_sy_create_object_error( ) ).
  ENDMETHOD.
ENDCLASS.
```

Il chiamante non sa quali classi concrete esistono: chiede alla factory. Aggiungere una forma nuova tocca un solo punto.

### Strategy: algoritmi intercambiabili

Un'interfaccia `lif_calcolo_sconto` con implementazioni `lcl_sconto_standard`, `lcl_sconto_vip`, `lcl_sconto_natale`. L'oggetto ordine riceve la strategia adatta e chiama sempre `calcola( )`. È esattamente il polimorfismo del giorno 10.

### Observer: avvisare chi è interessato

Implementato in ABAP con gli eventi (`RAISE EVENT` / `SET HANDLER`) del giorno 10.

### MVC: separare dati, logica e presentazione

- **Model**: accesso ai dati e regole di business (classi che leggono/scrivono).
- **View**: la presentazione (ALV, Dynpro, Fiori).
- **Controller**: coordina, riceve le azioni dell'utente e chiama il model.

Un report professionale ha almeno una classe per i dati e una per l'output: se domani passi da ALV a Fiori, cambi solo la view.

### I principi SOLID (in parole semplici)

| Principio             | In parole semplici                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Single responsibility | una classe fa una cosa sola                                                                       |
| Open/closed           | aperta alle estensioni (nuove classi), chiusa alle modifiche (non riscrivere quello che funziona) |
| Liskov substitution   | una sottoclasse deve poter sostituire la superclasse senza sorprese                               |
| Interface segregation | meglio tante interfacce piccole che una gigantesca                                                |
| Dependency inversion  | dipendi da interfacce, non da classi concrete (così puoi sostituirle nei test, giorno 12)         |

Riferimento consigliato: la guida open source **Clean ABAP** (repository SAP su GitHub), con regole su nomi, metodi brevi, commenti, eccezioni e test.

## Ora 4 – Programmazione dinamica

A volte non sai mentre scrivi il codice quale tabella, campo o classe userai: lo scopri solo a runtime (es. un programma che mostra qualsiasi tabella scelta dall'utente). Per questo ABAP offre strumenti dinamici.

> [!TIP]
> La programmazione statica è come una ricetta con ingredienti precisi. Quella dinamica è come un cuoco che apre il frigo, guarda cosa c'è e decide al momento cosa cucinare.

### Riferimenti a dati

```abap
DATA lr_num TYPE REF TO i.
lr_num = NEW #( 42 ).          " crea un intero anonimo in memoria
lr_num->* = lr_num->* + 1.     " ->* = il contenuto puntato (dereferenziazione)

DATA lv_x TYPE i VALUE 5.
DATA(lr_x) = REF #( lv_x ).    " riferimento a una variabile esistente
lr_x->* = 10.                  " ora lv_x vale 10

* Riferimento generico: può puntare a qualsiasi cosa
DATA lr_any TYPE REF TO data.
CREATE DATA lr_any TYPE string.
CREATE DATA lr_any TYPE ('SFLIGHT').                   " tipo deciso a runtime
CREATE DATA lr_any TYPE STANDARD TABLE OF ('SPFLI').   " tabella di tipo dinamico
```

### Field-symbols dinamici

```abap
FIELD-SYMBOLS <lt_tab>   TYPE STANDARD TABLE.
FIELD-SYMBOLS <ls_riga>  TYPE any.
FIELD-SYMBOLS <lv_campo> TYPE any.

DATA(lv_tabella) = `SCARR`.    " scelta a runtime (es. dall'utente)

DATA lr_tab TYPE REF TO data.
CREATE DATA lr_tab TYPE STANDARD TABLE OF (lv_tabella).
ASSIGN lr_tab->* TO <lt_tab>.

SELECT * FROM (lv_tabella) INTO TABLE @<lt_tab> UP TO 10 ROWS.   " SQL dinamico

LOOP AT <lt_tab> ASSIGNING <ls_riga>.
  ASSIGN COMPONENT 'CARRNAME' OF STRUCTURE <ls_riga> TO <lv_campo>.   " campo per nome
  IF sy-subrc = 0.
    WRITE / <lv_campo>.
  ENDIF.
ENDLOOP.

* Forma moderna di accesso dinamico a un componente
ASSIGN <ls_riga>-('CARRID') TO <lv_campo>.
```

Anche le altre parti di una `SELECT` possono essere dinamiche: `SELECT (lv_campi) FROM (lv_tab) WHERE (lv_where)`.

> [!WARNING]
> SQL dinamico con testi inseriti dall'utente è pericoloso (**SQL injection**). Valida sempre i nomi con la classe `cl_abap_dyn_prg` (es. `check_table_name_str`, `check_column_name`, `quote`) prima di usarli.

### RTTI e RTTS: conoscere e creare i tipi a runtime

**RTTI** (_Run Time Type Information_) ti dice com'è fatto un dato. **RTTS** (_Run Time Type Services_) ti permette anche di creare nuovi tipi a runtime. Le classi sono `cl_abap_typedescr` e sottoclassi (`cl_abap_elemdescr`, `cl_abap_structdescr`, `cl_abap_tabledescr`, `cl_abap_classdescr`, `cl_abap_refdescr`).

```abap
* Che tipo è?
DATA(lo_type) = cl_abap_typedescr=>describe_by_data( lv_x ).
WRITE: / lo_type->type_kind, lo_type->length.

* Quali campi ha una struttura?
DATA(lo_struct) = CAST cl_abap_structdescr(
                    cl_abap_typedescr=>describe_by_name( 'SCARR' ) ).
LOOP AT lo_struct->components INTO DATA(ls_comp).
  WRITE: / ls_comp-name, ls_comp-type_kind, ls_comp-length.
ENDLOOP.

* Campi con descrizioni DDIC
DATA(lt_ddic) = lo_struct->get_ddic_field_list( p_langu = sy-langu ).

* Creare a runtime una struttura con due campi e una tabella di quel tipo
DATA(lo_new_struct) = cl_abap_structdescr=>get( VALUE #(
  ( name = 'CODICE' type = cl_abap_elemdescr=>get_c( 10 ) )
  ( name = 'VALORE' type = cl_abap_elemdescr=>get_p( p_length = 8 p_decimals = 2 ) ) ) ).
DATA(lo_new_table) = cl_abap_tabledescr=>get( lo_new_struct ).
DATA lr_dyn TYPE REF TO data.
CREATE DATA lr_dyn TYPE HANDLE lo_new_table.
```

### Chiamate dinamiche

```abap
DATA(lv_classe) = `ZCL_CONTO`.
DATA(lv_metodo) = `GET_SALDO`.
DATA lo_obj TYPE REF TO object.

CREATE OBJECT lo_obj TYPE (lv_classe).
CALL METHOD lo_obj->(lv_metodo).                   " metodo dinamico

DATA(lt_par) = VALUE abap_parmbind_tab(
  ( name = 'RV_SALDO' kind = cl_abap_objectdescr=>receiving value = REF #( lv_saldo ) ) ).
CALL METHOD lo_obj->(lv_metodo) PARAMETER-TABLE lt_par.

CALL FUNCTION lv_nome_fm EXPORTING ...             " modulo funzione dinamico
PERFORM (lv_form) IN PROGRAM (lv_prog).            " subroutine dinamica
SUBMIT (lv_report) AND RETURN.                     " report dinamico
```

Le eccezioni tipiche della programmazione dinamica: `CX_SY_DYNAMIC_OSQL_ERROR`, `CX_SY_CREATE_DATA_ERROR`, `CX_SY_DYN_CALL_ERROR`, `CX_SY_ASSIGN_CAST_ERROR`. Gestiscile sempre.

### Generazione di codice (cenni)

`GENERATE SUBROUTINE POOL` e `INSERT REPORT` creano codice a runtime. Sono strumenti estremi, vietati in ABAP Cloud e da evitare nei progetti normali.

## Esercizi

> [!IMPORTANT]
>
> 1. Scrivi un metodo che divide due numeri e gestisce la divisione per zero con `TRY`/`CATCH`, restituendo un messaggio leggibile.
> 2. Crea la classe di eccezione `ZCX_VOLO_NON_TROVATO` collegata al messaggio 001 di `ZCORSO`. Crea la classe `ZCL_VOLO_REPO` con il metodo `get_volo` che la solleva. Chiamala da un report e mostra il messaggio.
> 3. Implementa un singleton `ZCL_LOGGER` con i metodi `add( iv_msg )` e `display( )` (mostra i messaggi raccolti in un ALV).
> 4. Crea una factory che, dato un tipo cliente (`'STD'`, `'VIP'`), restituisce una strategia di sconto (interfaccia con metodo `calcola`).
> 5. Scrivi il report `ZES11_SHOW_TABLE` con un parametro "nome tabella": verifica il nome con `cl_abap_dyn_prg`, leggi le prime 100 righe in modo dinamico e mostrale in `CL_SALV_TABLE`.
> 6. Con RTTI stampa nome, tipo e lunghezza di tutti i campi della tabella `SFLIGHT`.

## Quiz

1. Che differenza c'è tra `CX_STATIC_CHECK`, `CX_DYNAMIC_CHECK` e `CX_NO_CHECK`?
2. Quando viene eseguito `CLEANUP`?
3. Perché i `CATCH` vanno ordinati dal più specifico al più generico?
4. A che cosa serve l'attributo `previous`?
5. Che cosa garantisce un singleton? Come si impedisce il `NEW` dall'esterno?
6. Che cosa significa `lr_ref->*`?
7. Che cosa fa `ASSIGN COMPONENT ... OF STRUCTURE`?
8. Quale rischio comporta il SQL dinamico e come lo eviti?

## Soluzioni

```abap
REPORT zes11_show_table.

PARAMETERS p_tab TYPE tabname OBLIGATORY DEFAULT 'SCARR'.

START-OF-SELECTION.
  TRY.
      DATA(lv_tab) = cl_abap_dyn_prg=>check_table_name_str(
                       val      = to_upper( p_tab )
                       packages = '' ).

      DATA lr_data TYPE REF TO data.
      CREATE DATA lr_data TYPE STANDARD TABLE OF (lv_tab).
      ASSIGN lr_data->* TO FIELD-SYMBOL(<lt_data>).

      SELECT * FROM (lv_tab) INTO TABLE @<lt_data> UP TO 100 ROWS.

      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = <lt_data> ).
      lo_alv->get_functions( )->set_all( ).
      lo_alv->display( ).

    CATCH cx_abap_not_a_table cx_abap_not_in_package.
      MESSAGE 'Nome tabella non valido' TYPE 'S' DISPLAY LIKE 'E'.
    CATCH cx_sy_create_data_error cx_sy_dynamic_osql_error cx_salv_msg INTO DATA(lx).
      MESSAGE lx->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
  ENDTRY.
```

Nota: `packages = ''` disattiva il filtro sui pacchetti; in un sistema reale limita l'elenco ai pacchetti ammessi e aggiungi un `AUTHORITY-CHECK` su `S_TABU_NAM` per la tabella richiesta.

Quiz:

1. STATIC: errori previsti, da dichiarare e gestire (il compilatore controlla); DYNAMIC: evitabili con controlli preventivi, verificati a runtime; NO_CHECK: errori di sistema possibili ovunque, senza dichiarazione.
2. Quando un'eccezione esce dal `TRY` senza essere gestita in quel `TRY`.
3. Perché vince il primo `CATCH` compatibile: un `CATCH` generico in alto "ruberebbe" tutte le eccezioni.
4. A collegare l'eccezione originale a quella nuova (catena delle cause).
5. Che esista una sola istanza; con `CREATE PRIVATE` e un metodo statico `get_instance`.
6. Il dato puntato dal riferimento.
7. Collega un field-symbol a un campo di una struttura indicato per nome (o posizione) a runtime.
8. SQL injection: si validano nomi e valori con `cl_abap_dyn_prg` e si controllano le autorizzazioni.

> [!NOTE]
> Oggi hai imparato: eccezioni basate su classi (`TRY`, `CATCH`, `CLEANUP`, `RETRY`, `RESUME`, `RAISE`, `THROW`), classi di eccezione con messaggi T100, log applicativo, design pattern (singleton, factory, strategy, observer, MVC), SOLID e Clean ABAP, programmazione dinamica con riferimenti, field-symbols, RTTI/RTTS e chiamate dinamiche. Domani: ABAP moderno e test automatici.
