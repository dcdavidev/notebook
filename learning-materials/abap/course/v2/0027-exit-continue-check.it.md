---
title: EXIT, CONTINUE e CHECK
description: Uscire da un ciclo o saltare al passo successivo.
---

_Livello principiante_

A volte un ciclo non deve fare tutti i suoi passi: hai trovato quello che cercavi, oppure il passo corrente non ha niente da fare. ABAP ha tre istruzioni per controllare un ciclo dall'interno: `EXIT` esce dal ciclo, `CONTINUE` salta al passo successivo e `CHECK` salta al passo successivo quando una condizione è falsa.

Funzionano in tutti i cicli: `DO`, `WHILE` e il `LOOP AT` che imparerai in [Ciclare sulle tabelle interne](./0038-looping-internal-tables.it.md).

## EXIT: uscire dal ciclo

`EXIT` termina subito il ciclo. Il programma prosegue con la prima istruzione dopo `ENDDO`, `ENDWHILE` o `ENDLOOP`.

```abap
REPORT zexit_demo.

DATA lv_seats_free TYPE i VALUE 0.

DO 10 TIMES.
  lv_seats_free = sy-index * 3.
  IF lv_seats_free > 10.
    WRITE: / 'Posti sufficienti trovati al passo', sy-index.
    EXIT.
  ENDIF.
ENDDO.

WRITE / 'Dopo il ciclo'.
```

Il ciclo si ferma al passo 4, quando `lv_seats_free` vale 12. `EXIT` è anche il modo per terminare un `DO` senza `TIMES`, come hai visto in [I cicli DO e WHILE](./0026-do-and-while-loops.it.md).

Nei cicli annidati, `EXIT` esce solo dal ciclo **più interno**; il ciclo esterno prosegue con il suo passo successivo.

## CONTINUE: saltare al passo successivo

`CONTINUE` termina il **passo corrente** e inizia il successivo. Le istruzioni che lo seguono nel blocco vengono saltate solo per questo passo.

```abap
DO 10 TIMES.
  IF sy-index MOD 2 = 0.
    CONTINUE.             " salta i numeri pari
  ENDIF.
  WRITE / sy-index.       " 1, 3, 5, 7, 9
ENDDO.
```

> [!TIP]
> Stai leggendo una pila di lettere. `CONTINUE` è "questa è pubblicità: buttala e apri la prossima". `EXIT` è "ho trovato la lettera che aspettavo: smetto di aprire le altre".

## CHECK: proseguire solo se una condizione è vera

`CHECK condizione.` è una forma breve: se la condizione è **vera** non succede nulla; se è **falsa**, il passo termina come con `CONTINUE`.

```abap
DO 10 TIMES.
  CHECK sy-index MOD 2 = 1.   " tiene solo i numeri dispari
  WRITE / sy-index.           " 1, 3, 5, 7, 9
ENDDO.
```

I due cicli di questa lezione fanno esattamente la stessa cosa. Nota che le condizioni sono opposte: con `CONTINUE` scrivi quando **saltare**, con `CHECK` scrivi quando **andare avanti**.

| Istruzione         | Dentro un ciclo                                    |
| ------------------ | -------------------------------------------------- |
| `EXIT`             | termina tutto il ciclo                             |
| `CONTINUE`         | termina il passo corrente                          |
| `CHECK condizione` | termina il passo corrente se la condizione è falsa |

> [!WARNING]
> Molti sviluppatori trovano `CHECK` più difficile da leggere, perché la condizione è rovesciata. Nei cicli, `IF ... CONTINUE` di solito è più chiaro; le guide di stile come Clean ABAP lo consigliano.

## Fuori da un ciclo

Tutte e tre le istruzioni funzionano anche fuori da un ciclo, ma in quel caso non agiscono su un ciclo: escono dal **blocco di elaborazione** corrente, per esempio un metodo o un blocco evento di un report.

```abap
DATA lv_carrid TYPE s_carr_id.

CHECK lv_carrid IS NOT INITIAL.   " fuori da un ciclo: esce dal blocco di elaborazione
WRITE / 'Questa riga viene eseguita solo con una compagnia'.
```

> [!CAUTION]
> Fuori dai cicli, `EXIT` e `CHECK` si comportano in modo diverso a seconda del blocco di elaborazione, e in un report possono terminare il programma prima che mostri qualsiasi output. Per uscire da un metodo usa `RETURN`, che vedrai in [Attributi e metodi](./0077-attributes-and-methods.it.md). Tieni `EXIT`, `CONTINUE` e `CHECK` per i cicli.

## Esercizio

> [!IMPORTANT]
>
> Con un ciclo `DO 20 TIMES`:
>
> 1. Salta i multipli di 3 con `CONTINUE`.
> 2. Stampa gli altri numeri e sommali in un totale.
> 3. Esci dal ciclo con `EXIT` appena il totale supera 50. Stampa il totale dopo il ciclo.

### Soluzione

```abap
REPORT zexit_exercise.

DATA lv_total TYPE i.

DO 20 TIMES.
  IF sy-index MOD 3 = 0.
    CONTINUE.
  ENDIF.

  WRITE / sy-index.
  lv_total += sy-index.

  IF lv_total > 50.
    EXIT.
  ENDIF.
ENDDO.

WRITE: / 'Totale:', lv_total.     " 1+2+4+5+7+8+10+11+13 = 61
```

> [!NOTE]
>
> - `EXIT` esce dal ciclo; nei cicli annidati, solo da quello più interno.
> - `CONTINUE` salta il resto del passo corrente e inizia il successivo.
> - `CHECK condizione` termina il passo corrente quando la condizione è falsa.
> - Nei cicli preferisci `IF ... CONTINUE` a `CHECK`: la condizione è più facile da leggere.
> - Fuori dai cicli queste istruzioni escono dal blocco di elaborazione; per uscire da un metodo usa `RETURN`.
