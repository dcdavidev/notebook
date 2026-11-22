---
title: I valori booleani
description: abap_bool, abap_true, abap_false e xsdbool.
---

_Livello principiante_

Molti valori di un programma sono semplicemente sì o no: il volo è pieno, il cliente è bloccato, l'utente ha spuntato la casella? A differenza della maggior parte dei linguaggi, ABAP non ha un vero tipo booleano. Usa un campo di un carattere con `'X'` per vero e uno spazio per falso, e ti dà dei nomi per questi valori, così il codice resta leggibile.

## abap_bool, abap_true e abap_false

Il tipo e le costanti arrivano dal gruppo di tipi `ABAP`, che ogni programma può usare senza dichiararlo:

| Nome             | Definizione       | Significato                            |
| ---------------- | ----------------- | -------------------------------------- |
| `abap_bool`      | `TYPE c LENGTH 1` | il tipo per un valore di verità        |
| `abap_true`      | `VALUE 'X'`       | vero                                   |
| `abap_false`     | `VALUE ' '`       | falso (il valore iniziale)             |
| `abap_undefined` | `VALUE '-'`       | sconosciuto, per la logica a tre stati |

```abap
REPORT zboolean_demo.

DATA lv_is_full TYPE abap_bool.            " parte come abap_false
DATA lv_is_late TYPE abap_bool VALUE abap_true.

lv_is_full = abap_true.
WRITE: / 'Pieno:', lv_is_full,             " X
       / 'In ritardo:', lv_is_late.        " X
```

Poiché `abap_false` è uno spazio, è anche il valore iniziale: una nuova variabile `abap_bool` è falsa finché non la imposti.

> [!TIP]
> Un `abap_bool` è una casella su un modulo di carta. Una croce nella casella significa sì, una casella vuota significa no. Nessuno scrive "sì" o "S" nella casella: la croce è il segno concordato, e `abap_true` è il nome che ABAP le dà.

Scrivi `abap_true` e `abap_false`, non i letterali `'X'` e `' '`. Il significato è lo stesso, ma i nomi dicono che cosa intendi e si ritrovano facilmente cercando nel codice.

## Controllare un flag

Un flag si controlla confrontandolo con `abap_true` o `abap_false`. L'istruzione `IF` è trattata in [IF e le espressioni logiche](./0024-if-and-logical-expressions.md); per ora leggila come "se questa condizione vale, esegui le righe fino a `ENDIF`":

```abap
IF lv_is_full = abap_true.
  WRITE / 'Nessun posto libero.'.
ENDIF.

IF lv_is_late = abap_false.
  WRITE / 'In orario.'.
ENDIF.
```

Nel codice esistente vedrai anche `IF lv_is_full IS NOT INITIAL` e `IF lv_is_full IS INITIAL`. Funzionano, perché falso è il valore iniziale, ma il confronto con `abap_true` è più chiaro.

> [!WARNING]
> Un flag è affidabile solo se contiene `'X'` o uno spazio. Se in un campo `abap_bool` finisce un valore come `'Y'` o `'1'`, `= abap_true` è falso e `IS NOT INITIAL` è vero: i due controlli non sono d'accordo. Assegna solo `abap_true` e `abap_false`, o il risultato di `xsdbool( )`.

## `xsdbool`: una condizione come valore

Spesso vuoi memorizzare il risultato di una condizione. Dalla release 7.40 la funzione predefinita `xsdbool( )` trasforma un'**espressione logica** in un valore `abap_bool`:

```abap
DATA lv_seats_max TYPE i VALUE 280.
DATA lv_seats_occ TYPE i VALUE 280.
DATA lv_is_full   TYPE abap_bool.

lv_is_full = xsdbool( lv_seats_occ >= lv_seats_max ).   " abap_true
WRITE / lv_is_full.
```

Senza `xsdbool( )` ti servirebbe un `IF` con due assegnazioni per ottenere lo stesso risultato.

Il codice vecchio a volte usa `boolc( )` allo stesso scopo. Evitala: `boolc( )` restituisce una `string`, non un `abap_bool`, e una `string` con uno spazio non è uguale ad `abap_false`. Così `boolc( 1 = 2 ) = abap_false` è falso, e raramente è quello che vuoi. `xsdbool( )` restituisce il tipo giusto e non ha nessuna di queste sorprese.

## I booleani nel Dizionario

Tabelle di database e strutture non possono usare direttamente `abap_bool`; usano elementi dati del Dizionario con gli stessi valori. Questi li incontrerai spesso:

| Elemento dati  | Dove lo vedi                                         |
| -------------- | ---------------------------------------------------- |
| `ABAP_BOOLEAN` | tabelle moderne, viste CDS e business object RAP     |
| `BOOLE_D`      | tabelle più vecchie e interfacce dei moduli funzione |
| `XFELD`        | checkbox e flag nelle applicazioni classiche         |

Contengono tutti `'X'` o uno spazio, quindi puoi confrontarli con `abap_true` e `abap_false`. Le checkbox di una schermata di selezione funzionano allo stesso modo, come vedrai in [Schermate di selezione: PARAMETERS](./0063-parameters.md).

## Esercizio

> [!IMPORTANT]
> Un volo ha 280 posti e 265 sono prenotati.
>
> 1. Dichiara un flag `lv_has_seats` e impostalo con `xsdbool( )`: vero quando ci sono posti liberi.
> 2. Dichiara un flag `lv_is_full` che sia l'opposto, sempre con `xsdbool( )`.
> 3. Stampa entrambi i flag.

### Soluzione

```abap
REPORT zflight_flags.

DATA: lv_seats     TYPE i VALUE 280,
      lv_booked    TYPE i VALUE 265,
      lv_has_seats TYPE abap_bool,
      lv_is_full   TYPE abap_bool.

lv_has_seats = xsdbool( lv_booked < lv_seats ).      " abap_true
lv_is_full   = xsdbool( lv_has_seats = abap_false ). " abap_false

WRITE: / 'Posti liberi:', lv_has_seats,              " X
       / 'Pieno:', lv_is_full.                       " spazio
```

> [!NOTE]
>
> - ABAP non ha un vero tipo booleano: `abap_bool` è `c LENGTH 1`, con `abap_true` (`'X'`) e `abap_false` (spazio).
> - Una nuova variabile `abap_bool` è falsa, perché lo spazio è il valore iniziale.
> - Usa le costanti, non i letterali `'X'` e `' '`, e confronta con `= abap_true`.
> - `xsdbool( condizione )` trasforma una condizione in un `abap_bool`; evita `boolc( )`, che restituisce una stringa.
> - Nel Dizionario i flag usano elementi dati come `ABAP_BOOLEAN`, `BOOLE_D` e `XFELD`.
