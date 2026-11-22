---
title: Lavorare con le stringhe
description: Concatenare, dividere, misurare, spostare e cambiare il maiuscolo del testo.
---

_Livello principiante_

Nomi, città, codici, messaggi, righe di file: tantissimi dati aziendali sono testo. ABAP ti dà istruzioni e funzioni predefinite per unire pezzi di testo, tagliarli, misurarli, togliere gli spazi e cambiare maiuscole e minuscole.

Gli esempi funzionano sia con i campi `c` sia con le variabili `string`, che hai conosciuto in [I tipi carattere](./0013-character-types.md). Ricorda la differenza principale: un campo `c` ha una lunghezza fissa e nella maggior parte delle operazioni ABAP ignora i suoi **spazi finali**; una `string` conserva esattamente quello che ci metti.

## Unire testi: && e CONCATENATE

L'operatore `&&` unisce due pezzi di testo in una stringa:

```abap
REPORT zstrings_demo.

DATA lv_from TYPE string VALUE `ROMA`.
DATA lv_to   TYPE string VALUE `FRANCOFORTE`.

DATA(lv_route) = lv_from && ` - ` && lv_to.
WRITE / lv_route.                           " ROMA - FRANCOFORTE
```

L'istruzione `CONCATENATE` fa lo stesso e può aggiungere un separatore fra i pezzi:

```abap
DATA lv_result TYPE string.

CONCATENATE lv_from lv_to INTO lv_result SEPARATED BY ` / `.
WRITE / lv_result.                          " ROMA / FRANCOFORTE
```

> [!WARNING]
> Con i campi `c`, `&&` e `CONCATENATE` eliminano gli spazi finali, quindi `'Ciao '` unito a `'mondo'` dà `Ciaomondo`. Usa i letterali stringa con gli apici inversi (`` `Ciao ` ``), `SEPARATED BY space` oppure l'aggiunta `RESPECTING BLANKS` quando ti servono gli spazi.

Per i testi con variabili dentro, i [template di stringa](./0022-string-templates.md) sono spesso più leggibili di `&&`.

## Dividere testi: SPLIT

`SPLIT` taglia un testo in corrispondenza di ogni separatore e mette i pezzi in variabili:

```abap
DATA lv_line TYPE string VALUE `LH;0400;FRANKFURT;NEW YORK`.

SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_connid)
                          DATA(lv_cityfrom) DATA(lv_cityto).

WRITE: / lv_carrid, / lv_connid, / lv_cityfrom, / lv_cityto.
```

Se i pezzi sono più delle variabili, l'ultima variabile riceve il resto del testo, separatori compresi. `SPLIT ... INTO TABLE` mette i pezzi in una [tabella interna](./0033-internal-tables-intro.md), uno per riga.

## Misurare e tagliare

| Funzione / sintassi                          | Risultato                                                        |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `strlen( lv_text )`                          | la lunghezza, senza gli spazi finali dei `c`                     |
| `substring( val = lv_text off = o len = l )` | `l` caratteri a partire dall'offset `o`                          |
| `lv_text+o(l)`                               | lo stesso, con la sintassi **offset e lunghezza**                |
| `condense( lv_text )`                        | toglie gli spazi iniziali e finali e riduce a uno quelli interni |
| `CONDENSE lv_text NO-GAPS.`                  | toglie tutti gli spazi (forma istruzione)                        |

L'**offset** si conta da 0: il primo carattere ha offset 0.

```abap
DATA lv_city TYPE string VALUE `  NEW    YORK `.

DATA(lv_len) = strlen( lv_city ).           " 14: una stringa conserva i suoi spazi
DATA(lv_clean) = condense( lv_city ).       " `NEW YORK`
lv_len = strlen( lv_clean ).                " 8

DATA(lv_first) = substring( val = lv_clean off = 0 len = 3 ).   " `NEW`
DATA(lv_last)  = lv_clean+4(4).                                 " `YORK`
```

> [!CAUTION]
> Un offset o una lunghezza oltre la fine del testo causano un errore a runtime. Controlla `strlen( )` prima di tagliare un testo che arriva dall'esterno.

> [!TIP]
> Offset e lunghezza funzionano come un righello su una striscia di carta: l'offset è la tacca dove appoggi le forbici, la lunghezza è quanto tagli. Il righello parte da 0, non da 1.

## Togliere caratteri: SHIFT

`SHIFT` sposta il contenuto di una variabile verso sinistra o verso destra. La forma più utile toglie i caratteri iniziali, per esempio gli zeri iniziali di un numero:

```abap
DATA lv_conn TYPE c LENGTH 10 VALUE '0000000400'.

SHIFT lv_conn LEFT DELETING LEADING '0'.
WRITE / lv_conn.                            " 400

DATA lv_code TYPE c LENGTH 6 VALUE 'ABCDEF'.
SHIFT lv_code BY 2 PLACES.                  " CDEF: due caratteri tolti a sinistra
SHIFT lv_code RIGHT DELETING TRAILING ' '.  " allineato a destra
```

Le funzioni `shift_left( )` e `shift_right( )` fanno lo stesso senza modificare la variabile originale, per esempio `shift_left( val = lv_conn sub = '0' )`.

## Maiuscole e minuscole

```abap
DATA(lv_name) = `Lufthansa`.

DATA(lv_upper) = to_upper( lv_name ).       " LUFTHANSA
DATA(lv_lower) = to_lower( lv_name ).       " lufthansa

TRANSLATE lv_name TO UPPER CASE.            " la forma istruzione modifica lv_name
```

Cambiare maiuscole e minuscole è utile prima di confrontare i testi che scrivono gli utenti: `to_upper( lv_input ) = 'LH'` riconosce `lh`, `Lh` e `LH`.

## Esercizio

> [!IMPORTANT]
>
> Da un file ricevi la riga `` `  az;0555;rome;Frankfurt ` ``.
>
> 1. Togli gli spazi all'inizio e alla fine e convertila in maiuscolo.
> 2. Dividila in compagnia, numero del volo, città di partenza e città di arrivo.
> 3. Stampa la tratta come `ROME -> FRANKFURT (AZ 0555)` e la lunghezza della città di partenza.

### Soluzione

```abap
REPORT zstrings_exercise.

DATA(lv_line) = `  az;0555;rome;Frankfurt `.

lv_line = to_upper( condense( lv_line ) ).

SPLIT lv_line AT ';' INTO DATA(lv_carrid) DATA(lv_connid)
                          DATA(lv_cityfrom) DATA(lv_cityto).

DATA(lv_route) = lv_cityfrom && ` -> ` && lv_cityto &&
                 ` (` && lv_carrid && ` ` && lv_connid && `)`.
DATA(lv_len) = strlen( lv_cityfrom ).      " 4

WRITE: / lv_route, / lv_len.
```

> [!NOTE]
>
> - `&&` e `CONCATENATE` uniscono i testi; `CONCATENATE ... SEPARATED BY` aggiunge un separatore.
> - Gli spazi finali dei campi `c` vengono ignorati quando li unisci; le stringhe conservano i loro spazi.
> - `SPLIT ... AT ... INTO` taglia un testo in pezzi.
> - `strlen( )`, `substring( )`, offset e lunghezza (`lv_text+o(l)`) e `condense( )` misurano e puliscono il testo; gli offset partono da 0.
> - `SHIFT ... DELETING LEADING` toglie i caratteri iniziali; `to_upper( )` e `to_lower( )` cambiano maiuscole e minuscole.
