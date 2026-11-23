---
title: Le dichiarazioni inline
description: 'DATA(...) e FINAL(...): dichiarare una variabile dove la riempi la prima volta.'
level: beginner
---

Con `DATA` all'inizio del programma dichiari una variabile in un punto e la riempi da un'altra parte, spesso molte righe più sotto. Una **dichiarazione inline** fa le due cose in un colpo solo: dichiari la variabile proprio nel punto in cui riceve il primo valore, e ABAP ne ricava il tipo da quel valore.

Le dichiarazioni inline sono ovunque nell'ABAP moderno. Accorciano il codice, ma devi sapere che tipo riceve la variabile, altrimenti avrai delle sorprese.

## DATA(...) in un'assegnazione

Scrivi `DATA(nome)` a sinistra di un'assegnazione. La variabile viene dichiarata con il tipo del lato destro:

```abap
REPORT zinline_demo.

DATA lv_price TYPE p LENGTH 8 DECIMALS 2 VALUE '250.00'.
DATA lv_seats TYPE i VALUE 3.

DATA(lv_total) = lv_price * lv_seats.   " tipo p, come il calcolo
DATA(lv_copy)  = lv_price.              " tipo p LENGTH 8 DECIMALS 2
DATA(lv_today) = sy-datum.              " tipo d

WRITE: / lv_total, lv_copy, lv_today.
```

Le due forme qui sotto sono equivalenti; la seconda è quella inline:

```abap
DATA lv_name TYPE string.
lv_name = `Lufthansa`.

DATA(lv_name2) = `Lufthansa`.
```

Dopo la dichiarazione, `lv_total` è una variabile normale: puoi leggerla e cambiarla come qualsiasi altra.

## Che tipo riceve la variabile?

Il tipo viene dal lato destro, e con i **letterali** arrivano le sorprese:

| Lato destro        | Tipo della nuova variabile    |
| ------------------ | ----------------------------- |
| `'Roma'`           | `c` di lunghezza 4            |
| `` `Roma` ``       | `string`                      |
| `42`               | `i`                           |
| `'3.14'`           | `c` di lunghezza 4 (è testo!) |
| un'altra variabile | il tipo di quella variabile   |
| `sy-datum`         | `d`                           |

```abap
DATA(lv_city) = 'Roma'.       " c LENGTH 4
lv_city = 'Francoforte'.      " troncato: 'Fran'

DATA(lv_city2) = `Roma`.      " string
lv_city2 = `Francoforte`.     " nessun problema: una stringa cresce quanto serve
```

> [!WARNING]
> `DATA(lv_x) = 'ABC'.` ti dà un campo `c` lungo esattamente 3 caratteri. Se poi assegni un testo più lungo, viene tagliato senza avvisi. Per le variabili di testo usa un letterale stringa con gli apici inversi, oppure dichiara prima la variabile con `DATA ... TYPE`.

Quando il tipo conta (importi, tipi del Dizionario), dichiara la variabile nel modo classico, oppure assegnale una variabile che ha già il tipo giusto.

> [!TIP]
> Una dichiarazione inline è come un'etichettatrice che stampa l'etichetta della misura della prima cosa su cui la attacchi. Perfetta se sai che cosa ci andrà dentro; sbagliata se dopo arriveranno cose più grandi.

## Dove puoi usare le dichiarazioni inline

`DATA(...)` funziona in molte istruzioni che scrivono in una variabile, non solo nelle assegnazioni. Le incontrerai nelle prossime lezioni:

```abap
SPLIT `LH,0400` AT ',' INTO DATA(lv_carrid) DATA(lv_connid).   " entrambe string

SELECT SINGLE carrname FROM scarr
  WHERE carrid = 'LH'
  INTO @DATA(lv_carrname).                                     " tipo della colonna
```

- `SPLIT` e `CONCATENATE` dichiarano variabili `string`: vedi [Lavorare con le stringhe](./0021-working-with-strings.md).
- `SELECT ... INTO @DATA(...)` prende i tipi dal database: vedi [Leggere dati con SELECT](./0052-select-basics.md).
- `LOOP AT ... INTO DATA(...)` dichiara una variabile per la riga: vedi [Ciclare sulle tabelle interne](./0038-looping-internal-tables.md).

## Dove la variabile è visibile

Una dichiarazione inline è visibile **dall'istruzione in cui compare fino alla fine del programma o del metodo**, non solo dentro l'`IF` o il ciclo in cui l'hai scritta.

```abap
IF lv_seats > 0.
  DATA(lv_message) = `Posti disponibili`.
ENDIF.

WRITE / lv_message.     " valido, ma confuso: può essere vuota
```

Inoltre non puoi dichiarare due volte lo stesso nome nello stesso programma o metodo: il secondo `DATA(lv_message)` è un errore di sintassi. Dichiara una variabile inline solo dove nasce davvero il suo primo valore, e non contare su di lei fuori da quel blocco.

## FINAL(...): una variabile che non puoi cambiare

`FINAL(nome)` funziona come `DATA(nome)`, ma la variabile è **immutabile**: dopo la prima assegnazione, qualsiasi istruzione che prova a modificarla è un errore di sintassi.

```abap
FINAL(lv_max_seats) = 220.
FINAL(lv_user)      = sy-uname.

lv_max_seats = 300.     " errore di sintassi: lv_max_seats è final
```

Usa `FINAL` per i valori che calcoli una volta e poi leggi soltanto. Dichiara la tua intenzione e il controllo di sintassi la difende.

> [!WARNING]
> `FINAL(...)` esiste dal rilascio ABAP 7.57 (SAP S/4HANA 2022 e SAP BTP ABAP Environment). Sui sistemi più vecchi è un errore di sintassi: lì usa `DATA(...)`.

## Esercizio

> [!IMPORTANT]
>
> 1. Dichiara inline `lv_seats_max` con il valore `220` e `lv_seats_occ` con `185`, poi dichiara inline `lv_free` come loro differenza. Stampala.
> 2. Dichiara inline `lv_carrier = 'LH'` e poi assegnale `'Lufthansa'`. Stampala e spiega il risultato.
> 3. Se il tuo sistema lo permette, dichiara invece `lv_seats_max` con `FINAL` e prova a modificarla.

### Soluzione

```abap
REPORT zinline_exercise.

DATA(lv_seats_max) = 220.             " i
DATA(lv_seats_occ) = 185.             " i
DATA(lv_free) = lv_seats_max - lv_seats_occ.
WRITE: / 'Posti liberi:', lv_free.    " 35

DATA(lv_carrier) = 'LH'.              " c LENGTH 2
lv_carrier = 'Lufthansa'.
WRITE: / lv_carrier.                  " 'Lu': il campo è lungo solo 2 caratteri
```

Con `FINAL(lv_seats_max) = 220.`, la riga `lv_seats_max = 300.` non supera il controllo di sintassi.

> [!NOTE]
>
> - `DATA(nome) = valore.` dichiara una variabile e la riempie con una sola istruzione.
> - Il tipo viene dal lato destro: `'abc'` dà un `c` di quella lunghezza, gli apici inversi danno `string`, `42` dà `i`.
> - Le dichiarazioni inline funzionano anche in `SPLIT`, `SELECT ... INTO @DATA(...)`, `LOOP AT ... INTO DATA(...)` e altre istruzioni.
> - La variabile è visibile dalla dichiarazione fino alla fine del programma o del metodo.
> - `FINAL(nome)` dichiara una variabile che poi non puoi più cambiare (dal rilascio 7.57).
