---
title: I tipi numerici
description: Interi, numeri packed, virgola mobile decimale e binaria.
---

_Livello principiante_

Posti a sedere, prezzi, pesi e tassi di cambio sono tutti numeri, ma non a tutti serve lo stesso tipo. ABAP ha tipi interi per i contatori, **numeri packed** per importi e quantità e due tipi di numeri in virgola mobile per i valori con molte cifre. Scegliere quello giusto decide se i tuoi totali sono esatti.

## Panoramica

| Tipo         | Che cosa contiene                         | Intervallo o precisione             | Uso tipico                         |
| ------------ | ----------------------------------------- | ----------------------------------- | ---------------------------------- |
| `i`          | numeri interi, 4 byte                     | da −2.147.483.648 a 2.147.483.647   | contatori, indici, posti           |
| `int8`       | numeri interi, 8 byte                     | circa ±9,2 × 10¹⁸                   | conteggi molto grandi              |
| `p`          | decimale packed, numero fisso di decimali | fino a 31 cifre, fino a 14 decimali | importi, quantità, prezzi          |
| `decfloat16` | virgola mobile decimale                   | 16 cifre significative              | valori decimali di qualsiasi scala |
| `decfloat34` | virgola mobile decimale                   | 34 cifre significative              | valori decimali ad alta precisione |
| `f`          | virgola mobile binaria                    | circa 17 cifre significative        | valori scientifici o tecnici       |

Tutti i tipi numerici partono dal valore iniziale `0`.

## Gli interi: i e int8

Il tipo `i` è l'intero di tutti i giorni: usalo per contatori, indici dei cicli e tutto ciò che conti. `int8` (disponibile dalla release 7.50) fa lo stesso con un intervallo molto più ampio.

```abap
REPORT znumeric_demo.

DATA lv_seats  TYPE i VALUE 280.
DATA lv_booked TYPE i VALUE 265.
DATA lv_free   TYPE i.

lv_free = lv_seats - lv_booked.
WRITE / lv_free.                  " 15
```

Quando assegni un valore con decimali a un intero, viene **arrotondato**, non troncato: `'7.5'` diventa `8`, `'7.4'` diventa `7`.

> [!WARNING]
> Un risultato fuori dall'intervallo di `i` non ricomincia da capo: il programma si ferma con un errore di runtime (un overflow aritmetico). Se un numero può superare i due miliardi, per esempio una somma di importi in centesimi, usa `int8` o `p`.

Nei campi delle tabelle incontrerai anche i tipi del Dizionario `INT1` e `INT2` (1 e 2 byte). Corrispondono ai tipi interni `b` e `s`, che non puoi dichiarare direttamente in un programma.

## I numeri packed: p

Il tipo `p` memorizza i numeri decimali in modo esatto, con un numero fisso di decimali. Scegli tu:

- `LENGTH`: la dimensione in byte, da 1 a 16. Un numero packed di lunghezza `n` contiene `2n − 1` cifre. Default: 8 (15 cifre).
- `DECIMALS`: quante di queste cifre stanno dopo la virgola, da 0 a 14. Default: 0.

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '459.90'.
DATA lv_tax   TYPE p LENGTH 8 DECIMALS 2.

lv_tax = lv_price * '0.22'.
WRITE / lv_tax.                   " 101,18 (101,178 arrotondato a 2 decimali)
```

I risultati vengono arrotondati in modo commerciale ai decimali della destinazione: da `,5` in su si arrotonda per eccesso. Nel codice il separatore decimale dei letterali è sempre il punto (`'459.90'`); la virgola compare solo nell'output, secondo le impostazioni utente. I numeri packed sono lo standard per gli importi: i campi importo delle tabelle SAP, come `PRICE` in `SFLIGHT`, sono del tipo del Dizionario `CURR`, che è un numero packed.

> [!CAUTION]
> Ogni programma ha l'attributo **Aritmetica a virgola fissa**, attivo per default. Se qualcuno lo disattiva, i numeri packed vengono calcolati come se non avessero decimali, e gli importi risultano sbagliati di un fattore 100 o più. Non disattivarlo mai.

> [!TIP]
> Un numero packed è come un registratore di cassa: mostra sempre due decimali, conta i centesimi in modo esatto e, quando deve, arrotonda al centesimo più vicino. Un float binario è come una calcolatrice tascabile degli anni '80: veloce e brava con i numeri enormi, ma `0,1 + 0,2` non sempre dà esattamente `0,3`.

## La virgola mobile: decfloat e f

I tipi in **virgola mobile decimale** (`decfloat16`, `decfloat34`) memorizzano un numero fisso di cifre significative, con la virgola dove serve. Calcolano in modo esatto in base 10, come `p`, ma non devi scegliere in anticipo il numero di decimali.

La **virgola mobile binaria** (`f`) memorizza i numeri in base 2. Molte frazioni decimali, come 0,1, non si possono rappresentare esattamente in base 2, e così compaiono piccoli errori:

```abap
DATA lv_float   TYPE f.
DATA lv_decimal TYPE decfloat34.

lv_float = '0.1'.
lv_float = lv_float + '0.2'.
WRITE / lv_float.                 " 3,0000000000000004E-01: non esattamente 0,3

lv_decimal = '0.1'.
lv_decimal = lv_decimal + '0.2'.
WRITE / lv_decimal.               " 0,3
```

Usa `f` solo per valori tecnici o scientifici in cui le piccole differenze non contano, e mai per gli importi.

## Quale usare

- **Contare** (righe, posti, cicli): `i`, o `int8` per numeri enormi.
- **Importi e quantità**: `p` con i decimali giusti, o meglio il tipo del Dizionario del campo, per esempio `TYPE s_price`.
- **Valori decimali di scala sconosciuta** (tassi, risultati di divisioni da tenere esatti): `decfloat34`.
- **Calcoli tecnici**: `f`, sapendo che ha errori di arrotondamento.

Gli operatori aritmetici e le funzioni di arrotondamento sono in [Le operazioni aritmetiche](./0020-arithmetic-operations.it.md); che cosa succede quando mescoli i tipi è in [Le conversioni di tipo](./0019-type-conversions.it.md).

## Esercizio

> [!IMPORTANT]
> Un volo ha 280 posti, 265 sono prenotati e un biglietto costa 459,90.
>
> 1. Calcola i posti liberi e l'incasso dei posti prenotati.
> 2. Scegli un tipo adatto per ogni variabile e stampa i risultati.

### Soluzione

```abap
REPORT zflight_revenue.

DATA: lv_seats   TYPE i VALUE 280,
      lv_booked  TYPE i VALUE 265,
      lv_free    TYPE i,
      lv_price   TYPE p LENGTH 8 DECIMALS 2 VALUE '459.90',
      lv_revenue TYPE p LENGTH 10 DECIMALS 2.

lv_free    = lv_seats - lv_booked.
lv_revenue = lv_booked * lv_price.

WRITE: / 'Posti liberi:', lv_free,       " 15
       / 'Incasso:', lv_revenue.         " 121.873,50
```

I posti si contano, quindi sono interi; prezzo e incasso sono importi, quindi sono numeri packed con due decimali. L'incasso ha una lunghezza maggiore per lasciare spazio ai totali grandi.

> [!NOTE]
>
> - `i` (e `int8`) sono numeri interi; i decimali vengono arrotondati; un overflow è un errore di runtime.
> - `p` memorizza decimali esatti con `LENGTH` (byte, `2n − 1` cifre) e `DECIMALS`; è il tipo per gli importi.
> - `decfloat16` e `decfloat34` calcolano in modo esatto in base 10 con una virgola flessibile.
> - `f` è la virgola mobile binaria: veloce, ma con errori di arrotondamento; non usarla mai per gli importi.
> - Tieni sempre attivo l'attributo del programma **Aritmetica a virgola fissa**.
