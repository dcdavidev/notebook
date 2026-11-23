---
title: I template di stringa
description: Costruire testi con espressioni incorporate e opzioni di formato.
level: beginner
---

Costruire un messaggio come "Il volo LH 0400 ha 35 posti liberi" con `&&` o `CONCATENATE` vuol dire tanti pezzetti e tanti apici. Un **template di stringa** ti permette di scrivere tutto il testo in un colpo solo, con le variabili proprio dove devono stare.

I template di stringa sono il modo standard di costruire testi nell'ABAP moderno: per messaggi, righe di file, voci di log e output. In più formattano per te date, numeri e codici.

## La sintassi

Un template di stringa inizia e finisce con una barra verticale `|`. Dentro, tutto è testo letterale, tranne quello che metti fra parentesi graffe `{ }`: è un'**espressione incorporata**, e il suo valore viene inserito nel testo.

```abap
REPORT ztemplates_demo.

DATA lv_carrid TYPE s_carr_id VALUE 'LH'.
DATA lv_connid TYPE s_conn_id VALUE '0400'.
DATA lv_free   TYPE i VALUE 35.

DATA(lv_text) = |Il volo { lv_carrid } { lv_connid } ha { lv_free } posti liberi|.
WRITE / lv_text.        " Il volo LH 0400 ha 35 posti liberi
```

- Il risultato è sempre di tipo `string`.
- Dentro le graffe serve uno spazio dopo `{` e prima di `}`.
- Un'espressione incorporata può essere una variabile, un calcolo o una chiamata di funzione: `{ lv_max - lv_booked }`, `{ to_upper( lv_city ) }`.
- I numeri vengono scritti senza spazi iniziali, e il segno meno va davanti: `{ lv_delta }` dà `-5`, non `5-`.

> [!TIP]
> Un template di stringa è una lettera prestampata: il testo è già scritto, e le graffe sono gli spazi vuoti in cui scrivi il nome e la data per ogni copia.

## I caratteri speciali

Alcuni caratteri hanno un significato dentro un template. Per scriverli come testo, mettici davanti una barra rovesciata:

- `\|` per una barra verticale, `\{` e `\}` per le graffe, `\\` per una barra rovesciata;
- `\n` per un a capo e `\t` per una tabulazione.

```abap
DATA(lv_csv)  = |LH\t0400\tFRANKFURT|.     " separati da tabulazioni
DATA(lv_note) = |Usa \{ e \} nei template|.
```

Puoi unire più template con `&&` per dividere un testo lungo su più righe di codice:

```abap
DATA(lv_long) = |Volo { lv_carrid } { lv_connid }: | &&
                |{ lv_free } posti rimasti|.
```

## Le opzioni di formato

Dopo l'espressione, dentro le graffe, puoi aggiungere delle **opzioni di formato** nella forma `OPZIONE = valore`.

| Opzione                         | Che cosa fa                                       | Esempio di risultato |
| ------------------------------- | ------------------------------------------------- | -------------------- |
| `WIDTH = n`                     | lunghezza minima del valore inserito              |                      |
| `ALIGN = LEFT / RIGHT / CENTER` | allineamento dentro la larghezza                  |                      |
| `PAD = 'c'`                     | carattere di riempimento al posto degli spazi     | `0035`               |
| `CASE = UPPER / LOWER`          | maiuscolo o minuscolo                             | `FRANKFURT`          |
| `DECIMALS = n`                  | numero di decimali                                | `249.90`             |
| `NUMBER = USER`                 | separatori decimali e delle migliaia dell'utente  | `1.234,50`           |
| `DATE = USER / ISO`             | data nel formato dell'utente, oppure `YYYY-MM-DD` | `31.12.2026`         |
| `TIME = USER / ISO`             | ora nel formato dell'utente, oppure `hh:mm:ss`    | `14:30:00`           |
| `ALPHA = IN / OUT`              | aggiunge o toglie gli zeri iniziali               | `0000000400` / `400` |

```abap
DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '1234.5'.
DATA lv_cust  TYPE c LENGTH 10 VALUE '0000004711'.

WRITE: / |Posti: { lv_free WIDTH = 6 ALIGN = RIGHT PAD = '0' }|,   " Posti: 000035
       / |Prezzo: { lv_price NUMBER = USER }|,                      " p.es. 1.234,50
       / |Data: { sy-datum DATE = ISO }|,                           " p.es. 2026-11-19
       / |Data: { sy-datum DATE = USER }|,                          " p.es. 19.11.2026
       / |Ora: { sy-uzeit TIME = ISO }|,                            " p.es. 14:30:00
       / |Cliente: { lv_cust ALPHA = OUT }|,                        " Cliente: 4711
       / |Città: { `Frankfurt` CASE = UPPER }|.                     " Città: FRANKFURT
```

Senza opzioni, una data viene scritta così com'è memorizzata: `{ sy-datum }` dà `20261119`. Raramente è quello che un utente vuole leggere, quindi per l'output aggiungi `DATE = USER`.

> [!WARNING]
> I formati `USER` dipendono dalle impostazioni dell'utente (transazione `SU3`), quindi lo stesso programma stampa `1.234,50` per un utente e `1,234.50` per un altro. Usa `ISO` o nessuna opzione quando il testo va in un file o verso un altro sistema, e `USER` solo per i testi che legge una persona.

`ALPHA = IN` e `ALPHA = OUT` sono comodi per i codici come i numeri cliente o materiale, che il database memorizza con gli zeri iniziali: `OUT` li toglie per la visualizzazione, `IN` li rimette fino alla lunghezza completa del campo.

## Esercizio

> [!IMPORTANT]
>
> 1. Con `lv_carrid = 'AZ'`, `lv_connid = '0555'`, la data del volo 31 dicembre 2026 e un prezzo di 1299.9, costruisci il testo `AZ 0555 il 2026-12-31: 1299.90 EUR` con un solo template di stringa.
> 2. Stampa la stessa data nel tuo formato utente.
> 3. Stampa il numero del volo senza zeri iniziali, allineato a destra in una larghezza di 8.

### Soluzione

```abap
REPORT ztemplates_exercise.

DATA lv_carrid TYPE s_carr_id VALUE 'AZ'.
DATA lv_connid TYPE s_conn_id VALUE '0555'.
DATA lv_date   TYPE d VALUE '20261231'.
DATA lv_price  TYPE p LENGTH 8 DECIMALS 2 VALUE '1299.9'.

WRITE: / |{ lv_carrid } { lv_connid } il { lv_date DATE = ISO }: { lv_price } EUR|,
       / |{ lv_date DATE = USER }|,
       / |{ lv_connid ALPHA = OUT WIDTH = 8 ALIGN = RIGHT }|.
```

Un campo `p` con 2 decimali viene sempre scritto con 2 decimali, quindi `{ lv_price }` dà `1299.90`.

> [!NOTE]
>
> - Un template di stringa è un testo fra barre `|`; `{ espressione }` inserisce un valore, e il risultato è una `string`.
> - Lascia uno spazio dopo `{` e prima di `}`; fai l'escape di `|`, `{`, `}` e `\` con una barra rovesciata, e usa `\n` e `\t` per a capo e tabulazioni.
> - Le opzioni di formato comprendono `WIDTH`, `ALIGN`, `PAD`, `CASE`, `DECIMALS`, `NUMBER`, `DATE`, `TIME` e `ALPHA`.
> - I formati `USER` seguono le impostazioni dell'utente: usali per le persone, e `ISO` per file e interfacce.
> - Preferisci i template di stringa a `&&` e `CONCATENATE` quando il testo contiene variabili.
