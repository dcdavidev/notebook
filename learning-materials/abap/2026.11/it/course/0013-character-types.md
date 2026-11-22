---
title: 'I tipi carattere: c, n, string'
description: Testo a lunghezza fissa, testo numerico e stringhe di qualsiasi lunghezza.
---

_Livello principiante_

Gran parte dei dati di business è testo: nomi, città, codici di compagnie aeree, numeri di documento. ABAP ha tre tipi per il testo, e scegliere quello giusto conta più che in altri linguaggi, perché il tipo decide la lunghezza, il valore iniziale e il modo in cui vengono trattati spazi e cifre.

| Tipo     | Che cosa contiene   | Lunghezza                      | Valore iniziale     |
| -------- | ------------------- | ------------------------------ | ------------------- |
| `c`      | caratteri qualsiasi | fissa, da 1 a 262.143          | spazi               |
| `n`      | solo cifre          | fissa, da 1 a 262.143          | zeri (`'0000'`)     |
| `string` | caratteri qualsiasi | variabile, cresce quanto serve | vuota (lunghezza 0) |

## Il tipo c: testo a lunghezza fissa

Una variabile di tipo `c` (carattere) ha sempre esattamente la lunghezza che dichiari. I valori più corti vengono completati con spazi a destra; quelli più lunghi vengono troncati a destra:

```abap
REPORT zchar_demo.

DATA lv_city TYPE c LENGTH 10.

lv_city = 'Roma'.             " memorizzato come "Roma      " (4 lettere + 6 spazi)
lv_city = 'San Francisco'.    " memorizzato come "San Franci": troncato a 10 caratteri
WRITE / lv_city.
```

Gli **spazi finali** di un campo `c` vengono ignorati nella maggior parte delle operazioni: confronti, concatenazioni e la funzione di lunghezza `strlen( )` trattano `'Roma      '` come `'Roma'`. Gli spazi iniziali invece contano.

Senza `LENGTH`, una variabile `c` ha lunghezza 1. Troverai spesso la vecchia forma breve con la lunghezza tra parentesi:

```abap
DATA lv_flag(1) TYPE c.    " forma vecchia: uguale a TYPE c LENGTH 1
DATA lv_code.              " forma vecchia: nessun tipo significa TYPE c LENGTH 1
```

Riconosci queste forme nel codice vecchio, ma scrivi `TYPE c LENGTH n`.

> [!WARNING]
> Il troncamento è silenzioso. Se assegni un nome di 40 caratteri a un campo `c` di lunghezza 20, gli ultimi 20 caratteri si perdono senza alcun errore. Rendi i campi `c` abbastanza lunghi, o prendi la lunghezza da un tipo del Dizionario, come in [Definire tipi con TYPES e LIKE](./0017-types-and-like.md).

## Il tipo n: testo numerico

Il tipo `n` (testo numerico) contiene **solo cifre**, con lunghezza fissa. È un testo, non un numero: lo usi per codici fatti di cifre, come numeri di volo, codici postali o numeri di documento, che non sommi né moltiplichi mai.

```abap
DATA lv_connid TYPE n LENGTH 4.

lv_connid = '17'.         " memorizzato come "0017": allineato a destra, completato con zeri
lv_connid = 'LH 400'.     " memorizzato come "0400": restano solo le cifre
lv_connid = 123456.       " memorizzato come "3456": troncato a SINISTRA
WRITE / lv_connid.
```

Le assegnazioni a `n` tengono solo le cifre, le allineano a destra e riempiono il resto con zeri iniziali. Se le cifre sono troppe, si perdono quelle più a sinistra. Le regole complete sono in [Le conversioni di tipo](./0019-type-conversions.md).

Il numero di volo `CONNID` della tabella `SPFLI` è un buon esempio: nel Dizionario è `NUMC` di lunghezza 4, quindi il volo 17 è memorizzato come `0017`.

> [!TIP]
> Un campo di tipo `n` è come il contachilometri di una vecchia auto: mostra sempre lo stesso numero di cifre, riempie con zeri quelle non usate, e quando va oltre il massimo le cifre più a sinistra semplicemente spariscono.

## Il tipo string: testo di qualsiasi lunghezza

Una `string` non ha una lunghezza fissa: cresce e si accorcia con il suo contenuto. Il suo valore iniziale è la stringa vuota, di lunghezza 0. Le stringhe sono la scelta naturale per testo libero, messaggi, contenuti di file e tutto ciò di cui non conosci in anticipo la lunghezza.

```abap
DATA lv_text TYPE string.

lv_text = `Volo LH 400 da Francoforte a New York`.
WRITE / lv_text.        " niente viene troncato
```

A differenza di `c`, una stringa conserva gli spazi finali: `` `Roma ` `` ha lunghezza 5.

> [!WARNING]
> Un letterale di campo testo (`'...'`) perde gli spazi finali quando lo assegni a una stringa. `lv_text = 'Roma '.` memorizza `Roma`, lunghezza 4. Se lo spazio ti serve, usa un letterale di stringa con i backquote: ``lv_text = `Roma `.``

```abap
DATA lv_a TYPE string.
DATA lv_b TYPE string.
DATA lv_len TYPE i.

lv_a = 'Roma '.          " letterale di campo testo: spazio finale perso
lv_b = `Roma `.          " letterale di stringa: spazio finale conservato
lv_len = strlen( lv_a ).
WRITE / lv_len.          " 4
lv_len = strlen( lv_b ).
WRITE / lv_len.          " 5
```

`strlen( )` è una **funzione predefinita** (_built-in function_): restituisce la lunghezza di un testo. La ritroverai, insieme a molte altre funzioni sulle stringhe, in [Lavorare con le stringhe](./0021-working-with-strings.md).

## Quale usare

- **`string`** per il testo libero e per la maggior parte del codice nuovo: niente troncamenti, niente spazio sprecato.
- **`c`** per codici brevi a lunghezza fissa (un codice di compagnia, un flag di stato) e ogni volta che un campo del Dizionario è `CHAR`.
- **`n`** per codici di sole cifre che conservano gli zeri iniziali, e ogni volta che un campo del Dizionario è `NUMC`.

In pratica scriverai raramente a mano `c` o `n` con una lunghezza: tipizzerai le variabili come i campi del database che contengono, per esempio `TYPE s_carr_id` o `TYPE spfli-connid`.

ABAP ha anche due tipi byte, `x` e `xstring`, per i dati binari come i contenuti dei file; li usano le lezioni sui file.

## Esercizio

> [!IMPORTANT]
>
> 1. Dichiara un campo `c` di lunghezza 5, un campo `n` di lunghezza 5 e una stringa. Assegna `'AZ 12'` a tutti e tre e stampali. Prima prova a prevedere l'output.
> 2. Assegna `'Lufthansa'` al campo `c` e stampalo di nuovo.

### Soluzione

```abap
REPORT zchar_exercise.

DATA: lv_char TYPE c LENGTH 5,
      lv_numc TYPE n LENGTH 5,
      lv_str  TYPE string.

lv_char = 'AZ 12'.
lv_numc = 'AZ 12'.
lv_str  = 'AZ 12'.
WRITE: / lv_char, / lv_numc, / lv_str.   " AZ 12 / 00012 / AZ 12

lv_char = 'Lufthansa'.
WRITE / lv_char.                         " Lufth: troncato a 5 caratteri
```

> [!NOTE]
>
> - `c` ha lunghezza fissa, parte con spazi, si completa con spazi e si tronca a destra; gli spazi finali vengono ignorati.
> - `n` contiene solo cifre, parte con zeri, è allineato a destra e si tronca a sinistra.
> - `string` ha lunghezza variabile, parte vuota e conserva gli spazi finali.
> - `'...'` è un letterale `c` e perde gli spazi finali; `` `...` `` è un letterale `string` e li conserva.
> - Usa `string` per il testo libero, `c` e `n` per i codici fissi; per i campi del database preferisci i tipi del Dizionario.
