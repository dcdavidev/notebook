---
title: I cicli DO e WHILE
description: Ripetere codice un numero fisso di volte o finché vale una condizione.
---

_Livello principiante_

Un **ciclo** esegue lo stesso blocco di codice più volte. ABAP ha due cicli che non dipendono da una tabella: `DO` ripete il codice un certo numero di volte, e `WHILE` lo ripete finché una condizione è vera. (Per scorrere le righe di una tabella userai `LOOP AT`, in [Ciclare sulle tabelle interne](./0038-looping-internal-tables.it.md).)

Ogni esecuzione del blocco si chiama **passo** o iterazione.

## DO n TIMES

```abap
REPORT zdo_demo.

DO 5 TIMES.
  WRITE / sy-index.     " 1, 2, 3, 4, 5
ENDDO.
```

- Il numero dopo `DO` può essere un letterale o una variabile. Se è 0 o negativo, il blocco non viene eseguito affatto.
- Il campo di sistema `sy-index` contiene il numero del passo corrente, a partire da 1. L'hai conosciuto in [I campi di sistema](./0023-system-fields.it.md).

Un uso classico è un calcolo che si ripete un numero fisso di volte, per esempio l'interesse composto:

```abap
DATA lv_amount TYPE p LENGTH 10 DECIMALS 2 VALUE '1000.00'.
DATA lv_years  TYPE i VALUE 3.

DO lv_years TIMES.
  lv_amount = lv_amount * 105 / 100.        " 5% all'anno
  WRITE: / 'Anno', sy-index, lv_amount.
ENDDO.
```

## DO senza TIMES

Senza `TIMES`, `DO` si ripete **all'infinito**, finché un'istruzione dentro il blocco non esce dal ciclo. Di solito è `EXIT`, che vedrai in dettaglio in [EXIT, CONTINUE e CHECK](./0027-exit-continue-check.it.md):

```abap
DATA lv_seats TYPE i VALUE 0.

DO.
  lv_seats += 30.
  IF lv_seats >= 100.
    EXIT.               " esce dal ciclo
  ENDIF.
ENDDO.

WRITE / lv_seats.       " 120
```

> [!CAUTION]
> Un `DO` senza `TIMES` e senza un `EXIT` che funzioni non finisce mai. In un programma di dialogo il sistema lo interrompe dopo un po' con l'errore a runtime `TIME_OUT`; in un job in background può girare molto più a lungo e tenere occupato un work process. Assicurati sempre che la condizione di uscita venga raggiunta.

## WHILE

`WHILE` controlla una condizione **prima** di ogni passo: se è vera, il blocco viene eseguito; se è falsa, il ciclo finisce.

```abap
DATA lv_booked TYPE i VALUE 0.
DATA lv_max    TYPE i VALUE 5.

WHILE lv_booked < lv_max.
  lv_booked += 1.
  WRITE: / 'Prenotazione', lv_booked, 'passo', sy-index.
ENDWHILE.
```

Se la condizione è falsa fin dall'inizio, il blocco non viene mai eseguito. La condizione è un'espressione logica, come in [IF](./0024-if-and-logical-expressions.it.md), quindi anche qui funzionano `AND`, `OR` e `NOT`. Anche in `WHILE`, `sy-index` conta i passi.

> [!TIP]
> `DO 5 TIMES` è "fai cinque flessioni". `WHILE` è "continua a correre finché hai energia": prima di ogni giro controlli come ti senti, e magari non corri affatto.

## Quale scegliere

| Conosci...                                          | Usa           |
| --------------------------------------------------- | ------------- |
| quante volte deve girare il codice                  | `DO n TIMES`  |
| una condizione che deve essere vera per continuare  | `WHILE`       |
| la condizione solo dopo aver fatto parte del lavoro | `DO` + `EXIT` |

## Cicli annidati e sy-index

Puoi mettere un ciclo dentro un altro. `sy-index` si riferisce sempre al ciclo **in cui ti trovi**, e torna al valore esterno quando il ciclo interno finisce:

```abap
DO 3 TIMES.
  DATA(lv_row) = sy-index.         " salva il contatore esterno
  DO 2 TIMES.
    WRITE: / 'Fila', lv_row, 'posto', sy-index.
  ENDDO.
ENDDO.
```

> [!WARNING]
> Non assegnare mai un valore a `sy-index`: non cambia il numero di passi, rende solo sbagliato il codice. Se ti serve un contatore tuo, dichiara una variabile. E se dentro un ciclo interno ti serve il `sy-index` esterno, copialo prima, come nell'esempio.

Nel codice vecchio trovi a volte `DO ... VARYING` per scorrere una serie di campi. È obsoleto: riconoscilo, ma non usarlo.

## Esercizio

> [!IMPORTANT]
>
> 1. Con `DO`, stampa i multipli di 7 da 7 a 70.
> 2. Con `WHILE`, trova quanti anni servono perché 1000.00 diventi almeno 2000.00 con un interesse del 6% all'anno. Stampa il numero di anni e l'importo finale.

### Soluzione

```abap
REPORT zloops_exercise.

DO 10 TIMES.
  DATA(lv_multiple) = sy-index * 7.
  WRITE / lv_multiple.
ENDDO.

DATA lv_amount TYPE p LENGTH 10 DECIMALS 2 VALUE '1000.00'.
DATA lv_years  TYPE i.

WHILE lv_amount < 2000.
  lv_amount = lv_amount * 106 / 100.
  lv_years += 1.
ENDWHILE.

WRITE: / 'Anni:', lv_years,              " 12
       / 'Importo:', lv_amount.
```

> [!NOTE]
>
> - `DO n TIMES ... ENDDO` ripete un blocco un numero fisso di volte; con 0 o meno non viene eseguito.
> - `DO ... ENDDO` senza `TIMES` si ripete fino a `EXIT`: assicurati che l'uscita venga raggiunta.
> - `WHILE condizione ... ENDWHILE` controlla la condizione prima di ogni passo.
> - `sy-index` contiene il passo corrente, a partire da 1, e si riferisce al ciclo più interno.
> - Non modificare `sy-index`; usa una tua variabile contatore quando ti serve.
