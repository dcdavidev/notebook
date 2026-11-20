---
title: SQL dinamico e chiamate dinamiche
description: Costruire query e chiamare metodi di cui conosci il nome solo a runtime.
---

_Livello intermedio_

In ABAP SQL quasi ogni clausola può essere un **token dinamico**: una stringa di caratteri fra parentesi che il runtime analizza quando l'istruzione gira. La stessa idea vale per le chiamate: il nome di una classe, di un metodo o di un modulo funzione può arrivare da una variabile. È così che i framework leggono le tabelle di configurazione e decidono a runtime che cosa selezionare e quale codice eseguire.

La parte sui dati (creare la tabella di destinazione) è in [gli oggetti dati dinamici](./0116-dynamic-data.it.md).

## I token dinamici nella SELECT

| Clausola         | Forma dinamica        | Contenuto di esempio       |
| ---------------- | --------------------- | -------------------------- |
| elenco dei campi | `SELECT (lv_fields)`  | `carrid, connid, cityfrom` |
| sorgente dati    | `FROM (lv_table)`     | `SPFLI`                    |
| condizione       | `WHERE (lv_where)`    | `carrid = @p_carrid`       |
| ordinamento      | `ORDER BY (lv_order)` | `cityfrom DESCENDING`      |
| raggruppamento   | `GROUP BY (lv_group)` | `carrid`                   |

```abap
PARAMETERS p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  DATA(lv_fields) = `carrid, connid, cityfrom, cityto`.
  DATA(lv_table)  = `SPFLI`.
  DATA(lv_where)  = `carrid = @p_carrid`.     " variabile host dentro il token
  DATA(lv_order)  = `cityfrom`.

  DATA lt_result TYPE STANDARD TABLE OF spfli WITH EMPTY KEY.

  TRY.
      SELECT (lv_fields)
        FROM (lv_table)
        WHERE (lv_where)
        ORDER BY (lv_order)
        INTO CORRESPONDING FIELDS OF TABLE @lt_result.
    CATCH cx_sy_dynamic_osql_error INTO DATA(lx_sql).
      WRITE / lx_sql->get_text( ).
  ENDTRY.
```

- Una variabile host citata in un token dinamico (`@p_carrid`) deve essere visibile dove gira la `SELECT`.
- Gli errori nel token (una colonna sconosciuta, un errore di battitura) non vengono trovati dal controllo di sintassi. A runtime sollevano eccezioni di `CX_SY_DYNAMIC_OSQL_ERROR`, come `CX_SY_DYNAMIC_OSQL_SEMANTICS`. Intercettale sempre.
- Una `WHERE` dinamica può anche essere una tabella interna di righe di caratteri, che il runtime unisce.

## La SQL injection

Non costruire mai un token incollandoci dentro l'input dell'utente. Un valore come `LH' OR carrid <> '` trasforma il tuo filtro in "tutte le righe".

```abap
" SBAGLIATO: l'utente controlla l'SQL
DATA(lv_bad_where) = |carrid = '{ p_carrid }'|.

" GIUSTO: il valore viaggia come variabile host
DATA(lv_good_where) = `carrid = @p_carrid`.

" Se devi costruire un letterale, fai l'escape
DATA(lv_quoted_where) = |carrid = { cl_abap_dyn_prg=>quote( p_carrid ) }|.
```

Per i nomi (tabelle, colonne), controllali rispetto a un elenco di valori ammessi prima di usarli:

```abap
DATA(lt_allowed) = VALUE string_table( ( `SCARR` ) ( `SPFLI` ) ( `SFLIGHT` ) ).
IF NOT line_exists( lt_allowed[ table_line = lv_table ] ).
  WRITE / 'Tabella non ammessa'.
  RETURN.
ENDIF.
```

`CL_ABAP_DYN_PRG` ha altri metodi di supporto, come `escape_quotes`, `check_column_name` e `check_table_name_str`.

> [!CAUTION]
> Un `UPDATE` o un `DELETE` dinamico con una `WHERE` manipolata può modificare tutte le righe di una tabella, in tutti i mandanti se usi anche `CLIENT SPECIFIED` o `USING ALL CLIENTS`. Tratta ogni scrittura dinamica come un punto da rivedere per la sicurezza, ed eseguici sopra i controlli di sicurezza dell'ATC.

## Chiamate di metodo e creazione di oggetti dinamiche

Il nome della classe o del metodo va fra parentesi. I parametri si possono passare normalmente, oppure in una **tabella dei parametri** di tipo `ABAP_PARMBIND_TAB` quando non li conosci nemmeno in fase di compilazione.

```abap
DATA lo_object TYPE REF TO object.
DATA(lv_class)  = `ZCL_FLIGHT_EXPORT_CSV`.     " per esempio letto da una tabella di Customizing
DATA(lv_method) = `EXPORT`.

TRY.
    CREATE OBJECT lo_object TYPE (lv_class).

    DATA(lt_params) = VALUE abap_parmbind_tab(
      ( name  = 'IV_CARRID'
        kind  = cl_abap_objectdescr=>exporting     " dal punto di vista del chiamante
        value = REF #( p_carrid ) ) ).

    CALL METHOD lo_object->(lv_method) PARAMETER-TABLE lt_params.

  CATCH cx_sy_create_object_error cx_sy_dyn_call_error INTO DATA(lx_call).
    WRITE / lx_call->get_text( ).
ENDTRY.
```

- `kind` è visto dal **chiamante**: un parametro `IMPORTING` del metodo si passa con `cl_abap_objectdescr=>exporting`, il suo parametro `RETURNING` con `cl_abap_objectdescr=>receiving`.
- Metodi statici: `CALL METHOD (lv_class)=>(lv_method)`.
- Nomi o parametri sbagliati sollevano sottoclassi di `CX_SY_DYN_CALL_ERROR`, come `CX_SY_DYN_CALL_ILLEGAL_METHOD` e `CX_SY_DYN_CALL_PARAM_MISSING`.

Il più delle volte una chiamata di metodo dinamica non ti serve affatto. Crea l'oggetto in modo dinamico, fai il cast a un'[interfaccia](./0084-interfaces.it.md) e chiama il metodo in modo statico: così il controllo di sintassi verifica la chiamata.

```abap
DATA lo_exporter TYPE REF TO zif_flight_exporter.
CREATE OBJECT lo_exporter TYPE (lv_class).     " la classe deve implementare l'interfaccia
lo_exporter->export( iv_carrid = p_carrid ).
```

> [!TIP]
> Una chiamata dinamica è un numero di telefono scritto su un post-it: funziona solo se qualcuno risponde. Un'interfaccia è un contratto con un centralino che ti passa solo persone in grado di fare il lavoro.

## Chiamate dinamiche di moduli funzione

Per i moduli funzione il nome è sempre un oggetto dati, quindi una variabile funziona direttamente. Per parametri sconosciuti ci sono `PARAMETER-TABLE` di tipo `ABAP_FUNC_PARMBIND_TAB` ed `EXCEPTION-TABLE` di tipo `ABAP_FUNC_EXCPBIND_TAB`.

```abap
DATA(lv_function) = `Z_FLIGHTS_OF_CARRIER`.
DATA lv_seats TYPE i.

CALL FUNCTION lv_function
  EXPORTING
    iv_carrid     = p_carrid
  IMPORTING
    ev_seats_free = lv_seats
  EXCEPTIONS
    OTHERS        = 1.
```

## Esercizio

> [!IMPORTANT]
> Scrivi un report con i parametri `p_table` (una fra `SCARR`, `SPFLI`, `SFLIGHT`) e `p_carrid`. Leggi le prime 10 righe di quella tabella per la compagnia, con un `FROM` dinamico e una `WHERE` dinamica che usa una variabile host. Rifiuta qualsiasi altro nome di tabella.

### Soluzione

```abap
REPORT zdynamic_select.

PARAMETERS: p_table  TYPE tabname   DEFAULT 'SFLIGHT',
            p_carrid TYPE s_carr_id DEFAULT 'LH'.

START-OF-SELECTION.
  DATA(lt_allowed) = VALUE string_table( ( `SCARR` ) ( `SPFLI` ) ( `SFLIGHT` ) ).
  IF NOT line_exists( lt_allowed[ table_line = CONV string( p_table ) ] ).
    WRITE / 'Tabella non ammessa'.
    RETURN.
  ENDIF.

  DATA lr_table TYPE REF TO data.
  FIELD-SYMBOLS <lt_table> TYPE STANDARD TABLE.
  CREATE DATA lr_table TYPE STANDARD TABLE OF (p_table) WITH EMPTY KEY.
  ASSIGN lr_table->* TO <lt_table>.

  DATA(lv_where) = `carrid = @p_carrid`.
  TRY.
      SELECT * FROM (p_table)
        WHERE (lv_where)
        INTO TABLE @<lt_table>
        UP TO 10 ROWS.
    CATCH cx_sy_dynamic_osql_error INTO DATA(lx_sql).
      WRITE / lx_sql->get_text( ).
      RETURN.
  ENDTRY.

  WRITE / |{ lines( <lt_table> ) } righe da { p_table }|.
```

> [!NOTE]
>
> - Elenco dei campi, `FROM`, `WHERE`, `ORDER BY` e `GROUP BY` accettano token dinamici fra parentesi.
> - Gli errori nei token emergono solo a runtime: intercetta `CX_SY_DYNAMIC_OSQL_ERROR`.
> - Passa i valori come variabili host dentro il token, oppure fai l'escape con `CL_ABAP_DYN_PRG`; controlla i nomi rispetto a un elenco ammesso.
> - `CREATE OBJECT ... TYPE (nome)` e `CALL METHOD obj->(nome)` chiamano codice per nome; le tabelle dei parametri coprono le firme sconosciute.
> - Preferisci la creazione dinamica più una chiamata statica tramite interfaccia alle chiamate completamente dinamiche.
