---
title: Definire tipi con TYPES e LIKE
description: I tuoi tipi, i riferimenti ai tipi del Dizionario e LIKE.
---

_Livello principiante_

Finora hai dichiarato le variabili con i tipi predefiniti: `c`, `n`, `i`, `p`, `d` e gli altri. Nei programmi veri gli stessi dettagli tecnici si ripetono molte volte: "il nome di un cliente è lungo 25 caratteri", "un importo è un numero packed con 2 decimali". Se scrivi questi dettagli in ogni istruzione `DATA`, per cambiarli devi modificare decine di righe.

L'istruzione `TYPES` ti permette di definire un **tipo** una volta sola, dargli un nome e riusarlo. Con `TYPE` puoi anche puntare a tipi che esistono già nel Dizionario ABAP, e con `LIKE` puoi copiare il tipo di un'altra variabile.

## Tipi e oggetti dati

Un **tipo** è una descrizione: dice com'è fatto un valore (genere, lunghezza, decimali) ma non occupa memoria. Un **oggetto dati** (una variabile o una costante) è un pezzo concreto di memoria che ha un tipo e contiene un valore.

| Istruzione  | Crea          | Occupa memoria | Contiene un valore |
| ----------- | ------------- | -------------- | ------------------ |
| `TYPES`     | un tipo       | no             | no                 |
| `DATA`      | una variabile | sì             | sì                 |
| `CONSTANTS` | una costante  | sì             | sì, fisso          |

> [!TIP]
> Un tipo è uno stampo per biscotti; un oggetto dati è un biscotto. Lo stampo dice che forma avrà il biscotto, ma non puoi mangiarlo. Con un solo stampo fai tutti i biscotti che vuoi, tutti con la stessa forma.

## I tuoi tipi con TYPES

`TYPES` usa le stesse aggiunte di `DATA` (`TYPE`, `LENGTH`, `DECIMALS`), ma senza `VALUE`, perché un tipo non contiene valori.

```abap
REPORT ztypes_demo.

TYPES ty_name   TYPE c LENGTH 25.               " un nome: 25 caratteri
TYPES ty_amount TYPE p LENGTH 8 DECIMALS 2.     " un importo con 2 decimali
TYPES ty_code   TYPE n LENGTH 4.                " un codice di 4 cifre

DATA lv_customer TYPE ty_name.
DATA lv_supplier TYPE ty_name.
DATA lv_price    TYPE ty_amount VALUE '199.90'.
DATA lv_flight   TYPE ty_code VALUE '0400'.

lv_customer = 'Rossi'.
WRITE: / lv_customer, lv_price, lv_flight.
```

Se un giorno i nomi devono diventare lunghi 40 caratteri, cambi una sola riga: `ty_name`. Tutte le variabili basate su quel tipo si adeguano.

Per convenzione, i nomi dei tipi locali iniziano con `ty_`. Come con `DATA`, puoi concatenare più tipi con i due punti:

```abap
TYPES: ty_city    TYPE c LENGTH 20,
       ty_country TYPE c LENGTH 3.
```

`TYPES` sa descrivere anche cose più complesse: un gruppo di campi (un tipo struttura, con `BEGIN OF ... END OF`) e un elenco di righe (un tipo tabella). Li vedrai in [Le strutture](./0031-structures.it.md) e in [Che cos'è una tabella interna](./0033-internal-tables-intro.it.md).

## I tipi del Dizionario ABAP

Il **Dizionario ABAP** è il catalogo centrale dei tipi che tutti i programmi del sistema possono usare. Lo studierai bene in [Il Dizionario ABAP](./0043-abap-dictionary-intro.it.md); per ora ti basta sapere che puoi usare i suoi tipi direttamente dopo `TYPE`.

```abap
DATA lv_carrid   TYPE s_carr_id.      " elemento dati: codice compagnia
DATA lv_connid   TYPE s_conn_id.      " elemento dati: numero del volo
DATA lv_cityfrom TYPE spfli-cityfrom. " il tipo di un campo della tabella SPFLI
DATA lv_carrname TYPE scarr-carrname. " il tipo di un campo della tabella SCARR

lv_carrid = 'LH'.
lv_connid = '0400'.
WRITE: / lv_carrid, lv_connid.
```

- `s_carr_id` è un **elemento dati**: un tipo riusabile con un significato di business ("codice compagnia aerea") e delle etichette di campo.
- `spfli-cityfrom` è il tipo del campo `CITYFROM` della tabella di database `SPFLI`. Se la tabella cambia, la tua variabile cambia con lei.

Preferisci i tipi del Dizionario ogni volta che la variabile contiene un valore che vive anche nel database: lunghezza e tipo coincidono sempre.

> [!WARNING]
> Non ricopiare a mano i dettagli tecnici (`TYPE c LENGTH 3` per un codice compagnia). Se la definizione nel Dizionario cambia, la tua copia no, e i valori vengono troncati senza alcun errore.

## LIKE: il tipo di un altro oggetto dati

`LIKE` prende il tipo di un **oggetto dati** esistente, non di un tipo:

```abap
DATA lv_total TYPE p LENGTH 10 DECIMALS 2.
DATA lv_tax   LIKE lv_total.          " stesso tipo di lv_total
DATA lv_net   LIKE lv_total.

CONSTANTS lc_max_seats TYPE i VALUE 300.
DATA lv_free_seats LIKE lc_max_seats. " tipo i
```

La regola è semplice:

- dopo `TYPE` c'è un **tipo**: un tipo predefinito, un tipo definito con `TYPES` o un tipo del Dizionario;
- dopo `LIKE` c'è un **oggetto dati**: una variabile o una costante.

```abap
DATA lv_a TYPE ty_name.    " corretto: ty_name è un tipo
DATA lv_b LIKE lv_a.       " corretto: lv_a è una variabile
DATA lv_c LIKE ty_name.    " errore di sintassi: ty_name non è un oggetto dati
```

Usa `LIKE` quando una variabile di appoggio deve sempre coincidere con un'altra, per esempio la copia di backup di un valore. Quando esiste un tipo con un nome, `TYPE` di solito è più chiaro.

> [!WARNING]
> Nel codice vecchio troverai `LIKE` seguito da un campo di una tabella del Dizionario, per esempio `DATA lv_city LIKE spfli-cityfrom`. È obsoleto e vietato nelle classi: con i tipi del Dizionario usa sempre `TYPE`.

## Esercizio

> [!IMPORTANT]
>
> 1. In un nuovo report, definisci un tipo `ty_seats` di tipo `i` e un tipo `ty_city` di tipo `c` lungo 20.
> 2. Dichiara `lv_max` e `lv_booked` con `ty_seats`, e `lv_free` con `LIKE lv_max`. Calcola i posti liberi e stampali.
> 3. Dichiara `lv_from` con il tipo del campo `CITYFROM` di `SPFLI`, riempila e stampala.

### Soluzione

```abap
REPORT zseats.

TYPES ty_seats TYPE i.
TYPES ty_city  TYPE c LENGTH 20.

DATA lv_max    TYPE ty_seats VALUE 220.
DATA lv_booked TYPE ty_seats VALUE 185.
DATA lv_free   LIKE lv_max.
DATA lv_from   TYPE spfli-cityfrom.

lv_free = lv_max - lv_booked.
lv_from = 'FRANKFURT'.

WRITE: / 'Posti liberi:', lv_free.
WRITE: / 'Partenza:', lv_from.
```

> [!NOTE]
>
> - Un tipo descrive dei valori e non occupa memoria; un oggetto dati contiene un valore.
> - `TYPES` definisce un tipo con un nome da riusare con `TYPE`: lo cambi una volta e tutte le variabili si adeguano.
> - Dopo `TYPE` puoi usare elementi dati del Dizionario (`s_carr_id`) e campi di tabella (`spfli-cityfrom`).
> - `LIKE` copia il tipo di un oggetto dati esistente; `TYPE` si riferisce a un tipo.
> - Preferisci i tipi del Dizionario per i valori che vivono anche nel database.
