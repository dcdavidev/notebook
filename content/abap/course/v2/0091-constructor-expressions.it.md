---
title: Le espressioni costruttore
description: VALUE, NEW, CONV, CAST, REF, EXACT e LET.
---

_Livello intermedio_

Un'**espressione costruttore** crea un valore di un certo tipo proprio dove ti serve: in un'assegnazione, come argomento di un metodo o dentro un'altra espressione. Sostituisce con una sola espressione le variabili di appoggio e i blocchi su più righe dell'ABAP più vecchio. Ne hai già usate due, `VALUE` per [riempire le tabelle interne](./0036-filling-internal-tables.it.md) e `NEW` per [creare oggetti](./0076-classes-and-objects.it.md). Questa lezione copre l'intera famiglia dei costruttori di base.

## La forma generale

Ogni espressione costruttore ha la stessa forma:

```text
OPERATORE tipo( argomenti )
```

| Operatore | Crea                                                                  |
| --------- | --------------------------------------------------------------------- |
| `VALUE`   | una struttura o una tabella interna                                   |
| `NEW`     | un oggetto o un oggetto dati anonimo, e ne restituisce il riferimento |
| `CONV`    | un valore convertito in un altro tipo                                 |
| `EXACT`   | un valore convertito, ma solo se non si perde nulla                   |
| `CAST`    | un riferimento con un altro tipo statico                              |
| `REF`     | un riferimento ai dati di un oggetto dati esistente                   |

Il tipo può essere un nome di tipo, oppure `#` per lasciare che ABAP lo deduca dalla posizione dell'operando, per esempio dalla destinazione dell'assegnazione o dal parametro del metodo. Con una dichiarazione inline `DATA(...)` non c'è nulla da cui dedurlo, quindi il tipo lo devi indicare.

Gli altri operatori costruttore hanno lezioni loro: [`COND` e `SWITCH`](./0092-cond-and-switch.it.md), [`FOR` e `REDUCE`](./0093-for-and-reduce.it.md), e [`FILTER` e `CORRESPONDING`](./0094-filter-and-corresponding.it.md).

> [!TIP]
> Le espressioni costruttore sono come ordinare un piatto pronto invece di cucinarlo tu. Dici che cosa vuoi ("un valore convertito", "una tabella con queste righe") e arriva nel piatto in un solo passaggio. Non devi tirare fuori padella, coltello e tagliere come istruzioni separate.

## VALUE

`VALUE` costruisce strutture e tabelle. Per una struttura elenchi i componenti; per una tabella metti ogni riga fra parentesi proprie:

```abap
REPORT zconstructor_expressions.

TYPES tt_carriers TYPE STANDARD TABLE OF scarr WITH EMPTY KEY.

DATA(ls_carrier) = VALUE scarr( carrid = 'LH' carrname = 'Lufthansa' currcode = 'EUR' ).

DATA(lt_carriers) = VALUE tt_carriers(
  ( carrid = 'AZ' carrname = 'ITA Airways' currcode = 'EUR' )
  ( ls_carrier )
  ( carrid = 'AA' carrname = 'American Airlines' currcode = 'USD' ) ).

lt_carriers = VALUE #( BASE lt_carriers ( carrid = 'UA' ) ).   " mantiene le righe esistenti
ls_carrier = VALUE #( ).                                       " valore iniziale
```

Un valore ripetuto su molte righe può stare prima delle righe: `VALUE #( currcode = 'EUR' ( carrid = 'AZ' ) ( carrid = 'LH' ) )` imposta la valuta su entrambe.

## NEW

`NEW` crea un oggetto e ne restituisce un riferimento. Con un tipo di dati crea un **oggetto dati anonimo**, che esiste solo attraverso il riferimento:

```abap
DATA(lo_ticket) = NEW lcl_ticket( iv_connid = '0400' iv_price = 500 ).

DATA(lr_count)  = NEW i( 42 ).                             " REF TO i
DATA(lr_flight) = NEW sflight( carrid = 'LH' connid = '0400' ).
WRITE: / lr_count->*, lr_flight->carrid.
```

I riferimenti ai dati e l'operatore di dereferenziazione `->*` li hai visti nei [riferimenti ai dati](./0042-data-references.it.md).

## CONV ed EXACT

`CONV` converte un valore in un tipo, seguendo le normali [regole di conversione](./0019-type-conversions.it.md). Usalo dove un parametro di metodo o una funzione chiede un tipo che non hai, invece di dichiarare una variabile di appoggio:

```abap
DATA lv_text TYPE c LENGTH 10 VALUE '12.5'.

DATA(lv_amount) = CONV decfloat34( lv_text ).              " 12.5
DATA(lv_digits) = strlen( CONV string( lv_text ) ).        " 4: gli spazi finali non restano
```

Anche `EXACT` converte, ma solleva un'eccezione se la conversione arrotonderebbe un numero o perderebbe dati. Usalo quando una perdita silenziosa sarebbe un bug:

```abap
TRY.
    DATA(lv_seats) = EXACT i( '3.5' ).                     " verrebbe arrotondato a 4
  CATCH cx_sy_conversion_error INTO DATA(lx_conversion).
    WRITE / lx_conversion->get_text( ).
ENDTRY.
```

Le eccezioni sono sottoclassi di `CX_SY_CONVERSION_ERROR`, per esempio `CX_SY_CONVERSION_ROUNDING` e `CX_SY_CONVERSION_DATA_LOSS`.

## CAST e REF

`CAST` è la forma a espressione del down cast `?=` che hai visto in [polimorfismo e casting](./0085-polymorphism-and-casting.it.md). Funziona per riferimenti a oggetti e a dati, e ti permette di usare subito il risultato:

```abap
DATA(lo_struct) = CAST cl_abap_structdescr(
                    cl_abap_typedescr=>describe_by_name( 'SFLIGHT' ) ).
WRITE / lines( lo_struct->components ).                    " numero di campi

DATA lo_any TYPE REF TO lcl_ticket.
lo_any = NEW lcl_business_ticket( ).
WRITE / CAST lcl_business_ticket( lo_any )->get_lounge( ).
```

Come con `?=`, un cast sbagliato solleva `CX_SY_MOVE_CAST_ERROR`. Le classi del primo esempio vengono dai [RTTS](./0115-rtts.it.md); `lcl_ticket` e `lcl_business_ticket` sono le classi della lezione sul polimorfismo.

`REF` restituisce un riferimento ai dati di un oggetto dati esistente, come `GET REFERENCE OF`, ma sotto forma di espressione:

```abap
DATA lv_price TYPE s_price VALUE 500.
DATA(lr_price) = REF #( lv_price ).
lr_price->* = 600.                                         " ora lv_price vale 600
```

## LET

`LET` dichiara variabili locali di appoggio dentro un'espressione costruttore. Esistono solo in quell'espressione, e ti permettono di calcolare un valore una volta e usarlo più volte:

```abap
DATA(ls_summary) = VALUE ty_summary(
  LET lv_free = ls_flight-seatsmax - ls_flight-seatsocc
      lv_rate = ls_flight-price IN
  carrid     = ls_flight-carrid
  free_seats = lv_free
  revenue    = lv_rate * ls_flight-seatsocc
  can_book   = xsdbool( lv_free > 0 ) ).
```

Qui `ty_summary` è un tipo struttura con quei quattro campi. `LET` è ammesso in tutte le espressioni costruttore, non solo in `VALUE`.

> [!WARNING]
> Le espressioni costruttore si possono annidare senza limiti, ed è proprio questa la trappola. Un'espressione di venti righe con tre livelli di `VALUE`, `LET` e `CONV` è più difficile da leggere e da debuggare di poche istruzioni semplici. Nel debugger non puoi fermarti a metà di un'espressione. Se non sta in poche righe, dividila.

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi una riga di `SFLIGHT` in `ls_flight`. Con un solo `VALUE` e un `LET` costruisci una struttura con `carrid`, `connid` e `occupancy` (tipo `p LENGTH 5 DECIMALS 1`), la percentuale di posti occupati.
> 2. Passa `ls_flight-price` a un metodo che si aspetta una `string`, usando `CONV`.
> 3. Prova `EXACT i( ls_flight-price )` e cattura `cx_sy_conversion_error` quando il prezzo ha decimali.

### Soluzione

```abap
TYPES: BEGIN OF ty_load,
         carrid    TYPE s_carr_id,
         connid    TYPE s_conn_id,
         occupancy TYPE p LENGTH 5 DECIMALS 1,
       END OF ty_load.

SELECT SINGLE * FROM sflight INTO @DATA(ls_flight).

DATA(ls_load) = VALUE ty_load(
  LET lv_max = nmax( val1 = ls_flight-seatsmax val2 = 1 ) IN
  carrid    = ls_flight-carrid
  connid    = ls_flight-connid
  occupancy = ls_flight-seatsocc * 100 / lv_max ).

DATA(lv_text) = condense( CONV string( ls_flight-price ) ).

TRY.
    DATA(lv_whole) = EXACT i( ls_flight-price ).
  CATCH cx_sy_conversion_error.
    WRITE / 'Il prezzo ha decimali'.
ENDTRY.
```

> [!NOTE]
>
> - Le espressioni costruttore hanno la forma `OPERATORE tipo( ... )`; `#` deduce il tipo dal contesto.
> - `VALUE` costruisce strutture e tabelle; `NEW` crea oggetti e oggetti dati anonimi.
> - `CONV` converte; `EXACT` converte solo senza perdite e altrimenti solleva sottoclassi di `CX_SY_CONVERSION_ERROR`.
> - `CAST` è la forma a espressione di `?=`; `REF` restituisce un riferimento ai dati di una variabile esistente.
> - `LET` definisce variabili locali di appoggio in qualsiasi espressione costruttore. Tieni le espressioni abbastanza corte da poterle leggere.
