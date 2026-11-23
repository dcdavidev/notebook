---
title: Le operazioni aritmetiche
description: Operatori, DIV e MOD, arrotondamenti e funzioni numeriche.
level: beginner
---

Prezzi, posti, totali, medie, percentuali: quasi ogni programma calcola qualcosa. ABAP ha i soliti operatori aritmetici, due operatori per la divisione intera e una serie di funzioni predefinite per gli arrotondamenti e le altre operazioni comuni.

C'è una particolarità di ABAP che devi conoscere: il tipo della **variabile di destinazione** partecipa al calcolo. La stessa espressione può dare risultati diversi a seconda di dove la memorizzi.

## Gli operatori

| Operatore | Significato           | Esempio   | Risultato |
| --------- | --------------------- | --------- | --------- |
| `+`       | addizione             | `7 + 2`   | 9         |
| `-`       | sottrazione           | `7 - 2`   | 5         |
| `*`       | moltiplicazione       | `7 * 2`   | 14        |
| `/`       | divisione             | `7 / 2`   | 3.5       |
| `DIV`     | divisione intera      | `7 DIV 2` | 3         |
| `MOD`     | resto della divisione | `7 MOD 2` | 1         |
| `**`      | potenza               | `2 ** 3`  | 8         |

```abap
REPORT zarith_demo.

DATA lv_seats_max TYPE i VALUE 220.
DATA lv_seats_occ TYPE i VALUE 185.
DATA lv_free      TYPE i.

lv_free = lv_seats_max - lv_seats_occ.
WRITE: / 'Posti liberi:', lv_free.

lv_free = ( lv_seats_max - lv_seats_occ ) * 2.   " prima le parentesi
```

Operatori e parentesi vanno separati da **spazi**: `lv_a+lv_b` e `(lv_a + lv_b)` sono errori di sintassi; scrivi `lv_a + lv_b` e `( lv_a + lv_b )`. Come in matematica, `*` e `/` vengono prima di `+` e `-`.

Per cambiare una variabile partendo dal suo stesso valore, usa le forme brevi `+=`, `-=`, `*=` e `/=` (dal rilascio 7.54):

```abap
lv_seats_occ += 2.      " come lv_seats_occ = lv_seats_occ + 2.
lv_seats_max *= 2.
```

> [!WARNING]
> Il codice vecchio usa le istruzioni `ADD`, `SUBTRACT`, `MULTIPLY`, `DIVIDE` e `COMPUTE` (per esempio `ADD 2 TO lv_seats_occ.`). Sono obsolete: riconoscile, ma scrivi gli operatori.

## Il tipo del risultato conta

ABAP sceglie un **tipo di calcolo** guardando tutte le variabili dell'istruzione, **compresa quella a sinistra**. Se una di loro è un numero packed (`p`), il calcolo si fa con i numeri packed; se sono tutte intere, si fa con gli interi e il risultato viene arrotondato.

```abap
DATA lv_int TYPE i.
DATA lv_avg TYPE p LENGTH 8 DECIMALS 2.

lv_int = 10 / 4.        " 3: 2.5 arrotondato a intero
lv_avg = 10 / 4.        " 2.50: la destinazione è p, quindi il calcolo è in p
lv_avg = 10 / 3.        " 3.33
```

> [!TIP]
> La variabile di destinazione è il recipiente in cui versi il calcolo. Una tazza con scritto "solo numeri interi" (`i`) ti obbliga ad arrotondare; un misurino con le tacche per due decimali (`p DECIMALS 2`) tiene i centesimi.

Usa `p` con `DECIMALS` per gli importi e per gli altri valori con un numero fisso di decimali. Non usare `f` per gli importi: la virgola mobile binaria non riesce a memorizzare esattamente valori come 0.1. L'attributo di programma **aritmetica a virgola fissa** (_fixed point arithmetic_) deve essere attivo (lo è di default); senza, i decimali dei campi `p` vengono ignorati nei calcoli.

## DIV e MOD

`DIV` dà la parte intera di una divisione e `MOD` il resto. Sono utili per suddividere quantità e per controlli del tipo "una riga ogni 10":

```abap
DATA lv_passengers TYPE i VALUE 17.
DATA lv_per_row    TYPE i VALUE 6.

DATA(lv_full_rows) = lv_passengers DIV lv_per_row.   " 2
DATA(lv_remaining) = lv_passengers MOD lv_per_row.   " 5

IF lv_passengers MOD 2 = 0.
  WRITE / 'Numero pari di passeggeri'.
ENDIF.
```

Con i numeri negativi, `MOD` non è mai negativo: `-17 MOD 6` vale 1, e `-17 DIV 6` vale -3.

> [!CAUTION]
> Dividere per zero ferma il programma con un errore a runtime (`COMPUTE_INT_ZERODIVIDE` per gli interi, `BCD_ZERODIVIDE` per i numeri packed). Controlla il divisore prima di dividere. Unica eccezione: `0 / 0` dà 0.

## Le funzioni numeriche

ABAP ha funzioni predefinite per le operazioni più comuni. Le funzioni con un solo argomento lo ricevono direttamente; quelle con più argomenti li ricevono per nome.

| Funzione                    | Risultato                         | Esempio (`lv_x` vale -2.6) |
| --------------------------- | --------------------------------- | -------------------------- |
| `abs( x )`                  | valore assoluto                   | `abs( lv_x )` = 2.6        |
| `sign( x )`                 | -1, 0 o 1                         | `sign( lv_x )` = -1        |
| `ceil( x )`                 | il più piccolo intero non minore  | `ceil( lv_x )` = -2        |
| `floor( x )`                | il più grande intero non maggiore | `floor( lv_x )` = -3       |
| `trunc( x )`                | parte intera                      | `trunc( lv_x )` = -2       |
| `frac( x )`                 | parte decimale                    | `frac( lv_x )` = -0.6      |
| `round( val = x dec = n )`  | x arrotondato a n decimali        | vedi sotto                 |
| `ipow( base = b exp = e )`  | b elevato alla e                  | vedi sotto                 |
| `nmax( val1 = a val2 = b )` | il valore più grande              | vedi sotto                 |
| `nmin( val1 = a val2 = b )` | il valore più piccolo             | vedi sotto                 |
| `sqrt( x )`                 | radice quadrata                   | `sqrt( 16 )` = 4           |

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 3 VALUE '199.955'.
DATA lv_round TYPE p LENGTH 8 DECIMALS 2.

lv_round = round( val = lv_price dec = 2 ).              " 199.96
lv_int   = ipow( base = 2 exp = 10 ).                    " 1024
lv_int   = nmax( val1 = lv_seats_occ val2 = 200 ).       " il più grande
```

Di default `round` arrotonda le metà lontano dallo zero. Per altre regole passa `mode`, per esempio `round( val = lv_price dec = 2 mode = cl_abap_math=>round_half_even )`.

## Esercizio

> [!IMPORTANT]
>
> Un volo ha 220 posti e 190 prenotazioni; un biglietto costa 249.90.
>
> 1. Calcola i posti liberi e l'incasso (prenotazioni per prezzo) in un campo `p` con 2 decimali.
> 2. Calcola la percentuale di riempimento, arrotondata a 1 decimale.
> 3. I passeggeri si imbarcano in gruppi da 30: calcola quanti gruppi completi ci sono e quanti passeggeri restano.

### Soluzione

```abap
REPORT zflight_calc.

DATA lv_seats    TYPE i VALUE 220.
DATA lv_booked   TYPE i VALUE 190.
DATA lv_price    TYPE p LENGTH 8 DECIMALS 2 VALUE '249.90'.
DATA lv_revenue  TYPE p LENGTH 10 DECIMALS 2.
DATA lv_exact    TYPE p LENGTH 8 DECIMALS 4.
DATA lv_percent  TYPE p LENGTH 5 DECIMALS 1.

DATA(lv_free) = lv_seats - lv_booked.                  " 30
lv_revenue = lv_booked * lv_price.                     " 47481.00
lv_exact   = lv_booked * 100 / lv_seats.               " 86.3636
lv_percent = round( val = lv_exact dec = 1 ).          " 86.4
DATA(lv_groups) = lv_booked DIV 30.                    " 6
DATA(lv_left)   = lv_booked MOD 30.                    " 10

WRITE: / lv_free, / lv_revenue, / lv_percent, / lv_groups, / lv_left.
```

> [!NOTE]
>
> - Gli operatori sono `+`, `-`, `*`, `/`, `**`, `DIV` e `MOD`; separali con spazi. Usa `+=` e le altre forme brevi al posto degli obsoleti `ADD` e compagni.
> - La variabile di destinazione partecipa al calcolo: con una destinazione `i` il risultato viene arrotondato a intero.
> - Usa `p` con `DECIMALS` per gli importi, mai `f`.
> - Dividere per zero causa un errore a runtime, tranne `0 / 0`.
> - `round`, `ceil`, `floor`, `trunc`, `abs`, `ipow`, `nmax` e `nmin` coprono le esigenze numeriche comuni.
