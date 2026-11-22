---
title: COND e SWITCH
description: Espressioni condizionali che restituiscono un valore.
---

_Livello intermedio_

[`IF`](./0024-if-and-logical-expressions.md) e [`CASE`](./0025-case.md) sono istruzioni: scelgono quale codice eseguire. Molto spesso quel codice fa una cosa sola, assegnare un valore a una variabile. `COND` e `SWITCH` sono **espressioni condizionali**: scelgono un valore e lo restituiscono, così puoi scrivere la scelta proprio dove serve il valore, in un'assegnazione, in un argomento di metodo o in un template di stringa.

## COND

`COND` controlla in ordine delle espressioni logiche e restituisce il valore dopo il primo `THEN` la cui condizione è vera:

```abap
REPORT zcond_switch.

DATA lv_free TYPE i VALUE 3.

DATA(lv_status) = COND string(
  WHEN lv_free = 0  THEN `Pieno`
  WHEN lv_free <= 5 THEN `Quasi pieno`
  ELSE                   `Disponibile` ).

WRITE / lv_status.                              " Quasi pieno
```

Equivale a questo blocco `IF`, ma in una sola espressione e senza ripetere la destinazione:

```abap
IF lv_free = 0.
  lv_status = `Pieno`.
ELSEIF lv_free <= 5.
  lv_status = `Quasi pieno`.
ELSE.
  lv_status = `Disponibile`.
ENDIF.
```

Dopo `WHEN` puoi scrivere qualsiasi espressione logica: `AND`, `OR`, `NOT`, `IS INITIAL`, `line_exists( )` e così via. Se nessuna condizione è vera e manca l'`ELSE`, `COND` restituisce il valore iniziale del tipo.

> [!TIP]
> `COND` è come la macchina smistatrice di un ufficio postale. Ogni lettera passa per una serie di controlli: troppo pesante? per l'estero? raccomandata? Finisce nel contenitore del primo controllo che soddisfa, e quella che non ne soddisfa nessuno va nel contenitore generico, l'`ELSE`.

## SWITCH

`SWITCH` confronta **un solo** operando con un elenco di valori, come `CASE`, e restituisce il valore del `WHEN` corrispondente:

```abap
DATA lv_class TYPE s_class VALUE 'C'.

DATA(lv_class_text) = SWITCH string( lv_class
  WHEN 'Y' THEN `Economy`
  WHEN 'C' THEN `Business`
  WHEN 'F' THEN `First`
  ELSE          `Sconosciuta` ).
```

Usa `SWITCH` quando ogni ramo confronta la stessa variabile con `=`; usa `COND` per tutto il resto, come intervalli, più variabili o predicati. Un `WHEN` di `SWITCH` accetta un solo valore: non c'è l'`OR` di `CASE`, quindi se ti serve ripeti il valore del `THEN` su due righe `WHEN`.

## Il tipo del risultato

Il tipo prima delle parentesi è il tipo del risultato. Con `#`, ABAP lo prende dalla posizione dell'operando:

```abap
DATA lv_label TYPE string.
lv_label = COND #( WHEN lv_free = 0 THEN `Pieno` ELSE `Aperto` ).   " string, da lv_label
```

Quando non c'è nulla da cui dedurlo, come in una dichiarazione inline, ABAP usa il tipo dell'operando dopo il **primo** `THEN`.

> [!WARNING]
> Con `#` o con una dichiarazione inline, il tipo lo decide il primo `THEN`, e i letterali di testo fra apici singoli hanno tipo `c` con la loro lunghezza esatta. In `DATA(lv_text) = COND #( WHEN lv_free = 0 THEN 'Pieno' ELSE 'Disponibile' )` il risultato ha tipo `c LENGTH 5`, quindi `Disponibile` viene tagliato in `Dispo`. Indica il tipo in modo esplicito (`COND string( ... )`) o usa letterali stringa con gli apici inversi.

## Usarli dentro altre espressioni

Il vero vantaggio di `COND` e `SWITCH` è che li puoi usare in qualsiasi posizione di operando:

```abap
SELECT * FROM sflight INTO TABLE @DATA(lt_flights) UP TO 10 ROWS.

LOOP AT lt_flights INTO DATA(ls_flight).
  DATA(lv_seats) = COND string(
    WHEN ls_flight-seatsocc >= ls_flight-seatsmax THEN `pieno`
    ELSE |{ ls_flight-seatsmax - ls_flight-seatsocc } liberi| ).
  WRITE / |{ ls_flight-connid }: { lv_seats }, { COND string( WHEN ls_flight-seatsocc = 0 THEN `vuoto` ELSE `prenotato` ) }|.
ENDLOOP.
```

Come le altre [espressioni costruttore](./0091-constructor-expressions.md), entrambe accettano `LET` prima del primo `WHEN`, per calcolare una volta sola un valore di appoggio:

```abap
DATA(lv_load) = COND string(
  LET lv_pct = ls_flight-seatsocc * 100 / nmax( val1 = ls_flight-seatsmax val2 = 1 ) IN
  WHEN lv_pct >= 90 THEN `Alto`
  WHEN lv_pct >= 50 THEN `Medio`
  ELSE                   `Basso` ).
```

## THROW: sollevare un'eccezione da un ramo

Invece di un valore, un ramo può sollevare un'[eccezione](./0089-class-based-exceptions.md) con `THROW`:

```abap
DATA(lv_name) = SWITCH string( lv_class
  WHEN 'Y' THEN `Economy`
  WHEN 'C' THEN `Business`
  WHEN 'F' THEN `First`
  ELSE THROW cx_sy_itab_line_not_found( ) ).
```

`THROW` funziona come `RAISE EXCEPTION NEW`; fra le parentesi puoi passare i parametri del costruttore, per esempio l'ID di testo e gli attributi della tua [classe di eccezione](./0090-custom-exception-classes.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Leggi fino a 20 righe da `SFLIGHT`. Per ognuna stampa la compagnia, il collegamento e una fascia di prezzo calcolata con `COND`: `Economico` sotto 300, `Normale` fino a 800, `Caro` oltre.
> 2. Stampa anche il giorno della settimana di `fldate` con `SWITCH`. Prima calcola `lv_weekday = ls_flight-fldate MOD 7` in una variabile di tipo `i`: `0` è un sabato, `1` una domenica, `2` un lunedì, e così via.

### Soluzione

```abap
SELECT * FROM sflight INTO TABLE @DATA(lt_flights) UP TO 20 ROWS.

DATA lv_weekday TYPE i.

LOOP AT lt_flights INTO DATA(ls_flight).
  lv_weekday = ls_flight-fldate MOD 7.
  DATA(lv_band) = COND string(
    WHEN ls_flight-price < 300  THEN `Economico`
    WHEN ls_flight-price <= 800 THEN `Normale`
    ELSE                             `Caro` ).

  DATA(lv_day) = SWITCH string( lv_weekday
    WHEN 0 THEN `Sab` WHEN 1 THEN `Dom` WHEN 2 THEN `Lun`
    WHEN 3 THEN `Mar` WHEN 4 THEN `Mer` WHEN 5 THEN `Gio`
    ELSE `Ven` ).

  WRITE: / ls_flight-carrid, ls_flight-connid, lv_band, lv_day.
ENDLOOP.
```

Nel codice di produzione preferisci il modulo funzione `DATE_COMPUTE_DAY` al trucco del `MOD 7`.

> [!NOTE]
>
> - `COND tipo( WHEN condizione THEN valore ... ELSE valore )` restituisce il valore della prima condizione vera.
> - `SWITCH tipo( operando WHEN valore THEN risultato ... ELSE risultato )` confronta un operando con valori fissi.
> - Senza `ELSE` e senza corrispondenze, il risultato è il valore iniziale.
> - Con `#` o con le dichiarazioni inline il tipo lo fissa il primo `THEN`: indica il tipo o usa letterali con apici inversi per evitare troncamenti.
> - Entrambe accettano `LET`, e un ramo può sollevare un'eccezione con `THROW`.
