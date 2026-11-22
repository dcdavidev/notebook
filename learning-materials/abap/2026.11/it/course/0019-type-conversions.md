---
title: Le conversioni di tipo
description: Che cosa succede quando assegni un valore a una variabile di un altro tipo.
---

_Livello principiante_

In molti linguaggi assegnare un testo a una variabile numerica è un errore. ABAP è più tollerante: quando origine e destinazione hanno tipi diversi, **converte** il valore automaticamente, seguendo un insieme fisso di **regole di conversione**. Quasi sempre il risultato è quello che ti aspetti. A volte il valore viene troncato, arrotondato o riempito, e a volte il programma si ferma con un errore a runtime.

Conoscere le regole più comuni ti evita bug difficili da vedere, perché il codice sembra del tutto corretto.

## Tipi compatibili e convertibili

- Due tipi sono **compatibili** quando sono tecnicamente identici: stesso tipo, stessa lunghezza, stessi decimali. Il valore viene copiato così com'è.
- Altrimenti ABAP cerca una regola di conversione. Se esiste, i tipi sono **convertibili** e il valore viene convertito. Se non esiste (per esempio da una data a un'ora), ottieni un errore di sintassi.

> [!TIP]
> Una conversione è come versare una bevanda in un bicchiere diverso. In un bicchiere identico non cambia nulla. In uno più piccolo trabocca; in uno più largo resta spazio vuoto; in un bicchiere della forma sbagliata può non funzionare affatto.

## Da testo a testo: troncamento e riempimento

Fra campi `c` il valore viene allineato a sinistra. Se la destinazione è più corta, il resto viene tagliato; se è più lunga, viene riempita di spazi.

```abap
REPORT zconv_demo.

DATA lv_long  TYPE c LENGTH 10 VALUE 'FRANKFURT'.
DATA lv_short TYPE c LENGTH 5.

lv_short = lv_long.
WRITE: / lv_short.          " FRANK
```

In un campo `n` (testo numerico) vengono prese solo le **cifre**, allineate a destra e completate con zeri. Se le cifre sono troppe, si perdono quelle più a sinistra.

```abap
DATA lv_conn TYPE n LENGTH 4.

lv_conn = '17'.             " 0017
lv_conn = 'LH 400'.         " 0400: lettere e spazi vengono scartati
lv_conn = '123456'.         " 3456: le prime cifre vanno perse
```

## Da testo a numero

Quando assegni un valore `c` o `string` a un numero (`i`, `p`), ABAP legge il testo come un numero. Il testo può contenere spazi, un segno e il punto come separatore decimale.

```abap
DATA lv_int   TYPE i.
DATA lv_price TYPE p LENGTH 8 DECIMALS 2.

lv_int   = '  42 '.         " 42
lv_int   = '-7'.            " -7
lv_price = '199.95'.        " 199.95
lv_int   = '2.5'.           " 3: arrotondato a intero
```

Se il testo non è un numero valido, il programma si ferma con l'errore a runtime `CONVT_NO_NUMBER`:

```abap
lv_int = 'ABC'.             " errore a runtime CONVT_NO_NUMBER
lv_int = '1,000'.           " errore anche qui: la virgola non è ammessa
```

> [!WARNING]
> I valori che arrivano dagli utenti, dai file o da altri sistemi sono testo. Non dare mai per scontato che contengano un numero valido: controllali prima (vedrai come con `CO` in [IF e le espressioni logiche](./0024-if-and-logical-expressions.md)), oppure intercetta l'errore con le tecniche di [Le eccezioni basate su classi](./0089-class-based-exceptions.md).

## Da numero a numero e da numero a testo

Fra tipi numerici il valore viene **arrotondato** in modo commerciale quando la destinazione ha meno decimali:

```abap
DATA lv_p3 TYPE p LENGTH 8 DECIMALS 3 VALUE '12.345'.
DATA lv_p2 TYPE p LENGTH 8 DECIMALS 2.

lv_p2  = lv_p3.             " 12.35
lv_int = lv_p3.             " 12
lv_int = '-2.5'.            " -3: le metà si arrotondano lontano dallo zero
```

Se il valore non entra nella destinazione, per esempio 5 miliardi in un `i`, ottieni l'errore a runtime `CONVT_OVERFLOW`.

Un numero assegnato a un campo `c` viene scritto **allineato a destra**, e l'ultima posizione è riservata al segno: un meno **dopo** le cifre, oppure uno spazio per i numeri positivi.

```abap
DATA lv_text TYPE c LENGTH 8.

lv_text = 42.               " '     42 '
lv_text = -42.              " '     42-'
```

Quando il numero ha più cifre del campo, ABAP taglia quelle più a sinistra e mette un asterisco nella prima posizione. Per costruire testi leggibili a partire dai numeri usa piuttosto i [template di stringa](./0022-string-templates.md): con `lv_int = -42`, il template `|{ lv_int }|` dà `-42`.

## Date e ore

Una data (`d`) è memorizzata come il testo `YYYYMMDD`. Assegnata a un numero, diventa il numero di giorni trascorsi dal 01.01.0001; per questo puoi fare calcoli con le date, come hai visto in [I tipi data e ora](./0015-date-and-time-types.md).

```abap
DATA lv_date TYPE d.

lv_date = '20261231'.       " una data valida
lv_date = '20261340'.       " accettata senza errori, ma non è una data vera!
```

> [!CAUTION]
> Assegnare un testo a un campo data non controlla la data. Un valore non valido come `20261340` passa senza avvisi e produce risultati sbagliati più avanti, per esempio quando lo salvi nel database. Valida le date che arrivano dall'esterno prima di usarle.

## Esercizio

> [!IMPORTANT]
>
> Prevedi il risultato di ogni assegnazione, poi esegui il programma e verifica:
>
> 1. `'LH0400X'` in un campo `n` di lunghezza 4.
> 2. `'7.5'` in un campo `i`.
> 3. `-3` in un campo `c` di lunghezza 4.

### Soluzione

```abap
REPORT zconv_exercise.

DATA lv_n    TYPE n LENGTH 4.
DATA lv_i    TYPE i.
DATA lv_text TYPE c LENGTH 4.

lv_n    = 'LH0400X'.        " 0400: restano solo le cifre 0400
lv_i    = '7.5'.            " 8: arrotondamento commerciale
lv_text = -3.               " '  3-': allineato a destra, segno in fondo

WRITE: / lv_n, / lv_i, / lv_text.
```

> [!NOTE]
>
> - Quando i tipi sono diversi, ABAP converte il valore automaticamente con regole fisse.
> - Da `c` a `c`: allineato a sinistra, troncato o riempito di spazi. Verso `n`: solo cifre, allineate a destra, completate con zeri.
> - Da testo a numero: il testo deve essere un numero valido, altrimenti ottieni l'errore a runtime `CONVT_NO_NUMBER`.
> - I numeri vengono arrotondati in modo commerciale se la destinazione ha meno decimali; i valori che non ci stanno causano `CONVT_OVERFLOW`.
> - Il testo assegnato a una data non viene validato: controlla tu le date.
