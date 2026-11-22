---
title: Gli oggetti dati dinamici
description: CREATE DATA, ASSIGN COMPONENT e i tipi generici.
---

_Livello intermedio_

Un **oggetto dati dinamico** è una variabile il cui tipo viene deciso mentre il programma gira. Lo crei con `CREATE DATA`, lo raggiungi tramite un riferimento ai dati e ci lavori con field symbol di un **tipo generico**. Insieme ai [RTTS](./0115-rtts.md), è così che scrivi codice che gestisce qualsiasi tabella o struttura: export generici, upload e strumenti di confronto.

Per questa lezione ti servono [i field symbol](./0041-field-symbols.md) e [i riferimenti ai dati](./0042-data-references.md).

## I tipi generici

Un tipo generico lascia aperta una parte del tipo. Puoi usarlo per i field symbol e per i parametri di metodi e moduli funzione, ma non con `DATA`.

| Tipo generico    | Accetta                                                           |
| ---------------- | ----------------------------------------------------------------- |
| `any` / `data`   | qualsiasi oggetto dati                                            |
| `simple`         | qualsiasi tipo elementare e le strutture piatte di tipo carattere |
| `clike`          | `c`, `n`, `d`, `t`, `string`, strutture piatte di tipo carattere  |
| `csequence`      | `c` e `string`                                                    |
| `numeric`        | `i`, `int8`, `p`, `decfloat16`, `decfloat34`, `f`                 |
| `any table`      | qualsiasi tabella interna                                         |
| `index table`    | tabelle standard e sorted                                         |
| `standard table` | solo tabelle standard                                             |
| `REF TO data`    | un riferimento a qualsiasi oggetto dati                           |

Più il tipo è specifico, più cose puoi farci. Con `any table` puoi ciclare e inserire per chiave, ma non accedere per indice; con `index table` sì.

## Creare dati a runtime

`CREATE DATA` crea un oggetto dati anonimo e mette un riferimento a esso in una variabile di tipo `REF TO data`. Il tipo può essere statico, un nome fra parentesi o un descrittore RTTS:

```abap
DATA lr_data TYPE REF TO data.

CREATE DATA lr_data TYPE i.                          " tipo statico
CREATE DATA lr_data TYPE ('SCARR').                  " nome del tipo noto a runtime
CREATE DATA lr_data TYPE STANDARD TABLE OF ('SPFLI') " tabella di un tipo a runtime
                    WITH EMPTY KEY.
CREATE DATA lr_data TYPE HANDLE lo_type.             " descrittore RTTS (REF TO cl_abap_datadescr)
```

Per usare l'oggetto, dereferenzialo in un field symbol:

```abap
FIELD-SYMBOLS <lt_table> TYPE STANDARD TABLE.

DATA(lv_name) = `SPFLI`.
CREATE DATA lr_data TYPE STANDARD TABLE OF (lv_name) WITH EMPTY KEY.
ASSIGN lr_data->* TO <lt_table>.

SELECT * FROM (lv_name) INTO TABLE @<lt_table> UP TO 10 ROWS.
WRITE / |{ lines( <lt_table> ) } righe lette da { lv_name }|.
```

Il `FROM (lv_name)` dinamico è spiegato in [SQL dinamico e chiamate dinamiche](./0117-dynamic-sql-and-calls.md).

> [!WARNING]
> Se il nome del tipo non esiste, `CREATE DATA` solleva `CX_SY_CREATE_DATA_ERROR`. Quando il nome arriva dall'utente, racchiudi l'istruzione in un `TRY ... CATCH cx_sy_create_data_error`.

> [!TIP]
> `CREATE DATA` è come ordinare una scatola a un magazzino tramite il codice articolo. Non ne conosci la forma in anticipo, quindi ricevi una bolla di consegna (il riferimento). Per aprire la scatola e lavorare sul contenuto vai allo scaffale dove è riposta (il field symbol).

## ASSIGN COMPONENT

Quando non conosci la struttura di una riga, `ASSIGN COMPONENT` raggiunge un componente per **nome** o per **posizione**:

```abap
FIELD-SYMBOLS <ls_row>   TYPE any.
FIELD-SYMBOLS <lv_value> TYPE any.

LOOP AT <lt_table> ASSIGNING <ls_row>.
  ASSIGN COMPONENT 'CITYFROM' OF STRUCTURE <ls_row> TO <lv_value>.   " per nome
  IF sy-subrc = 0.
    WRITE / <lv_value>.
  ENDIF.
ENDLOOP.
```

Con un numero al posto del nome ottieni l'n-esimo componente. Un ciclo `DO` che si ferma quando `sy-subrc` non è 0 percorre tutti i componenti di qualsiasi struttura:

```abap
DO.
  ASSIGN COMPONENT sy-index OF STRUCTURE <ls_row> TO <lv_value>.
  IF sy-subrc <> 0.
    EXIT.                         " componenti finiti
  ENDIF.
  WRITE <lv_value>.
ENDDO.
```

Controlla sempre `sy-subrc` (o `IS ASSIGNED`) dopo un `ASSIGN` dinamico. Se fallisce, il field symbol conserva l'assegnazione precedente, oppure resta non assegnato, e usare un field symbol non assegnato provoca un dump.

## Un metodo generico

I parametri generici permettono a un solo metodo di servire qualsiasi tabella:

```abap
CLASS lcl_table_printer DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS print IMPORTING it_table TYPE ANY TABLE.
ENDCLASS.

CLASS lcl_table_printer IMPLEMENTATION.
  METHOD print.
    FIELD-SYMBOLS <ls_row>   TYPE any.
    FIELD-SYMBOLS <lv_value> TYPE any.

    LOOP AT it_table ASSIGNING <ls_row>.
      NEW-LINE.
      DO.
        ASSIGN COMPONENT sy-index OF STRUCTURE <ls_row> TO <lv_value>.
        IF sy-subrc <> 0.
          EXIT.
        ENDIF.
        WRITE <lv_value>.
      ENDDO.
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  SELECT * FROM scarr INTO TABLE @DATA(lt_carriers) UP TO 5 ROWS.
  lcl_table_printer=>print( lt_carriers ).
```

## Esercizio

> [!IMPORTANT]
> Scrivi un report con un parametro `p_tab TYPE tabname DEFAULT 'SCARR'` e un parametro `p_field TYPE fieldname DEFAULT 'CARRNAME'`. Leggi le prime 20 righe della tabella in una tabella interna creata dinamicamente e stampa solo il campo richiesto. Mostra un messaggio se la tabella o il campo non esistono.

### Soluzione

```abap
REPORT zdynamic_field.

PARAMETERS: p_tab   TYPE tabname   DEFAULT 'SCARR',
            p_field TYPE fieldname DEFAULT 'CARRNAME'.

START-OF-SELECTION.
  DATA lr_table TYPE REF TO data.
  FIELD-SYMBOLS: <lt_table> TYPE STANDARD TABLE,
                 <ls_row>   TYPE any,
                 <lv_value> TYPE any.

  TRY.
      CREATE DATA lr_table TYPE STANDARD TABLE OF (p_tab) WITH EMPTY KEY.
    CATCH cx_sy_create_data_error.
      WRITE / |Tabella sconosciuta: { p_tab }|.
      RETURN.
  ENDTRY.
  ASSIGN lr_table->* TO <lt_table>.

  SELECT * FROM (p_tab) INTO TABLE @<lt_table> UP TO 20 ROWS.

  LOOP AT <lt_table> ASSIGNING <ls_row>.
    ASSIGN COMPONENT p_field OF STRUCTURE <ls_row> TO <lv_value>.
    IF sy-subrc <> 0.
      WRITE / |Campo sconosciuto: { p_field }|.
      RETURN.
    ENDIF.
    WRITE / <lv_value>.
  ENDLOOP.
```

> [!NOTE]
>
> - I tipi generici (`any`, `data`, `any table`, `index table`, `clike`, ...) valgono per field symbol e parametri, non con `DATA`.
> - `CREATE DATA` crea un oggetto dati di un tipo statico, di un tipo per nome o di un tipo RTTS e restituisce un `REF TO data`.
> - Dereferenzia con `ASSIGN lr_data->* TO <fs>` per lavorarci.
> - `ASSIGN COMPONENT nome_o_indice OF STRUCTURE` raggiunge un componente che conosci solo a runtime.
> - Controlla sempre `sy-subrc` dopo un `ASSIGN` dinamico e intercetta `CX_SY_CREATE_DATA_ERROR`.
