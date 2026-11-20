---
title: Variabili e costanti
description: Dichiarare oggetti dati con DATA e CONSTANTS e usare i letterali.
---

_Livello principiante_

I programmi lavorano con dei valori: un numero di posti, un codice di compagnia aerea, un prezzo. In ABAP ogni valore vive in un **oggetto dati**: un pezzo di memoria con un nome e un tipo fisso. Una **variabile** è un oggetto dati il cui valore può cambiare mentre il programma gira; una **costante** è un oggetto dati il cui valore è fisso. Un **letterale** è un valore scritto direttamente nel codice, come `'LH'` o `42`.

Questa lezione mostra come dichiarare variabili con `DATA`, costanti con `CONSTANTS` e come scrivere i letterali.

## Dichiarare variabili con DATA

`DATA` dichiara una variabile. Le dai un nome e un tipo:

```abap
REPORT zvariables_demo.

DATA lv_seats   TYPE i.                     " intero, parte da 0
DATA lv_carrier TYPE c LENGTH 3.            " testo di 3 caratteri, parte vuoto
DATA lv_city    TYPE string VALUE `Roma`.   " testo di qualsiasi lunghezza, con un valore iniziale

lv_seats = 150.
lv_carrier = 'LH'.

WRITE: / lv_carrier, lv_seats, lv_city.
```

- `TYPE` imposta il tipo: che genere di valori contiene la variabile e quanta memoria usa. I tipi `i`, `c` e `string` sono trattati in [I tipi carattere](./0013-character-types.it.md) e [I tipi numerici](./0014-numeric-types.it.md).
- `VALUE` imposta il **valore di partenza**. Senza `VALUE`, la variabile parte con il **valore iniziale** del suo tipo: `0` per i numeri, spazi per `c`, una stringa vuota per `string`.
- `=` assegna un nuovo valore. Il valore a destra viene copiato nella variabile a sinistra.

Più dichiarazioni di solito si scrivono come un'unica istruzione concatenata, con nomi e tipi allineati:

```abap
DATA: lv_carrier TYPE c LENGTH 3,
      lv_connid  TYPE n LENGTH 4,
      lv_seats   TYPE i.
```

Una variabile dichiarata con `DATA` esiste fino alla fine del suo contesto: per un report, l'intera esecuzione del programma. Non puoi usare una variabile prima della riga che la dichiara.

> [!TIP]
> Una variabile è una scatola con un'etichetta. L'etichetta è il nome, la forma e la misura della scatola sono il tipo, e quello che ci metti dentro è il valore. Puoi togliere il contenuto e metterne uno nuovo, ma una volta fatta la scatola non puoi cambiarle forma.

## Azzerare con CLEAR

`CLEAR` riporta una variabile al valore iniziale del suo tipo, non al suo `VALUE`:

```abap
DATA lv_seats TYPE i VALUE 150.

CLEAR lv_seats.
WRITE lv_seats.       " 0, non 150
```

Per controllare se una variabile contiene il suo valore iniziale, ABAP ha il predicato `IS INITIAL`, che vedrai in [IF e le espressioni logiche](./0024-if-and-logical-expressions.it.md).

## Le costanti

`CONSTANTS` dichiara un oggetto dati il cui valore non può mai cambiare. L'aggiunta `VALUE` è obbligatoria:

```abap
CONSTANTS: lc_max_seats TYPE i VALUE 300,
           lc_home_hub  TYPE c LENGTH 3 VALUE 'FRA',
           lc_vat_rate  TYPE p LENGTH 3 DECIMALS 2 VALUE '0.22'.

WRITE: / 'Hub:', lc_home_hub, 'posti massimi:', lc_max_seats.
```

Se provi ad assegnare un valore a una costante, il controllo di sintassi segnala un errore.

Usa le costanti al posto dei **numeri magici**: valori che compaiono nel codice senza spiegazione. `IF lv_seats > lc_max_seats` dice che cosa significa; `IF lv_seats > 300` no, e quando il limite cambia devi cercare ogni `300` nel programma.

> [!WARNING]
> Le costanti non sono impostazioni. Se un valore cambia da un'azienda all'altra o nel tempo (un'aliquota, un limite deciso dal business), il suo posto è una tabella di customizing, non il codice. Le costanti servono per i valori fissati dalla logica, come un codice di stato o un limite tecnico.

## I letterali

Un **letterale** è un valore scritto direttamente nel codice sorgente. Non ha nome, e il sistema ne ricava il tipo dal modo in cui lo scrivi:

| Letterale                | Esempio      | Tipo                                     |
| ------------------------ | ------------ | ---------------------------------------- |
| letterale numerico       | `42`, `-7`   | `i` (o `p` se il numero è troppo grande) |
| letterale di campo testo | `'LH'`       | `c`, lungo quanto il testo               |
| letterale di stringa     | `` `Roma` `` | `string`                                 |

Regole da ricordare:

- **I letterali numerici sono solo numeri interi.** Nel codice ABAP non esiste `3.14`. Per un numero con decimali, scrivi un letterale di campo testo: `VALUE '19.99'`. Il sistema lo converte nel tipo di destinazione.
- Per mettere un apice dentro un letterale, raddoppialo: `'L''aereo'` stampa `L'aereo`. In un letterale di stringa raddoppi allo stesso modo il backquote.
- **Spazi finali**: un letterale di campo testo ignora gli spazi finali nella maggior parte delle operazioni; un letterale di stringa li conserva. La differenza è mostrata in [I tipi carattere](./0013-character-types.it.md).

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '19.99'.   " decimali: usa gli apici
DATA lv_text  TYPE string.

lv_text = 'L''aereo è in ritardo'.
WRITE: / lv_price, / lv_text.
```

Dalla release 7.40 puoi anche dichiarare una variabile proprio dove la riempi, con `DATA(...)`. È l'argomento di [Le dichiarazioni inline](./0018-inline-declarations.it.md). I tuoi tipi con nome, con `TYPES`, sono in [Definire tipi con TYPES e LIKE](./0017-types-and-like.it.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che dichiari una variabile per un codice di compagnia aerea, un numero di volo e il numero di posti liberi, con valori iniziali `'AZ'`, `'0555'` e `12`.
> 2. Dichiara una costante per la capienza dell'aereo, `280`, e stampa compagnia, volo, posti liberi e capienza su una riga.
> 3. Azzera i posti liberi e stampali di nuovo.

### Soluzione

```abap
REPORT zflight_seats.

CONSTANTS lc_capacity TYPE i VALUE 280.

DATA: lv_carrier    TYPE c LENGTH 3 VALUE 'AZ',
      lv_connid     TYPE n LENGTH 4 VALUE '0555',
      lv_free_seats TYPE i VALUE 12.

WRITE: / lv_carrier, lv_connid, lv_free_seats, lc_capacity.

CLEAR lv_free_seats.
WRITE: / 'Posti liberi dopo CLEAR:', lv_free_seats.    " 0
```

> [!NOTE]
>
> - Un oggetto dati è un pezzo di memoria con un nome e un tipo fisso; le variabili cambiano, le costanti no.
> - `DATA nome TYPE tipo [VALUE iniziale].` dichiara una variabile; senza `VALUE` parte dal valore iniziale del suo tipo.
> - `CONSTANTS` richiede `VALUE`; usa le costanti al posto dei numeri magici.
> - `CLEAR` riporta una variabile al valore iniziale del suo tipo.
> - I letterali numerici sono interi; scrivi i decimali come `'19.99'`, i testi come `'...'` (tipo `c`) o `` `...` `` (tipo `string`).
