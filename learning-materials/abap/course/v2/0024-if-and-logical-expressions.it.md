---
title: IF e le espressioni logiche
description: Confronti, AND, OR, NOT e predicati come IS INITIAL.
---

_Livello principiante_

Un programma che fa sempre la stessa cosa non è molto utile. Con `IF` il tuo codice prende decisioni: stampa un avviso quando un volo è pieno, applica uno sconto sopra una certa cifra, si ferma quando manca un valore.

La condizione dopo `IF` è un'**espressione logica**: qualcosa che è vero oppure falso. Questa lezione mostra come costruirne una, dal confronto semplice alle combinazioni con `AND`, `OR` e `NOT`.

## IF, ELSEIF, ELSE

```abap
REPORT zif_demo.

DATA lv_seats_free TYPE i VALUE 3.

IF lv_seats_free = 0.
  WRITE / 'Volo pieno'.
ELSEIF lv_seats_free < 10.
  WRITE / 'Restano pochi posti'.
ELSE.
  WRITE / 'Posti disponibili'.
ENDIF.
```

- ABAP controlla le condizioni dall'alto in basso ed esegue **solo il primo ramo** la cui condizione è vera.
- `ELSEIF` ed `ELSE` sono facoltativi; puoi avere tutti i rami `ELSEIF` che ti servono.
- Ogni `IF` termina con `ENDIF`, e ogni riga termina con un punto.

> [!TIP]
> Un `IF` con gli `ELSEIF` è come un buttafuori con una lista di regole: "se sei nella lista degli invitati, entra; altrimenti, se hai il biglietto, entra; altrimenti torna a casa." Si ferma alla prima regola che fa al caso tuo.

## Gli operatori di confronto

| Operatore | Alternativa | Significato       |
| --------- | ----------- | ----------------- |
| `=`       | `EQ`        | uguale            |
| `<>`      | `NE`        | diverso           |
| `<`       | `LT`        | minore            |
| `>`       | `GT`        | maggiore          |
| `<=`      | `LE`        | minore o uguale   |
| `>=`      | `GE`        | maggiore o uguale |

Preferisci i simboli; le forme con le lettere sono comuni nel codice vecchio. Ci sono altre due forme comode:

```abap
IF lv_price BETWEEN 100 AND 500.            " 100 <= lv_price <= 500
  WRITE / 'Tariffa media'.
ENDIF.

IF lv_carrid IS INITIAL.                    " vuoto: '', 0, 00000000, ...
  WRITE / 'Compagnia mancante'.
ENDIF.
```

`IS INITIAL` è vero quando una variabile contiene il **valore iniziale** del suo tipo: spazi per i `c`, una stringa vuota, `0` per i numeri, `00000000` per le date. Il contrario è `IS NOT INITIAL`.

> [!WARNING]
> ABAP non ha scorciatoie come `IF lv_flag.` per i booleani. Confronta sempre in modo esplicito: `IF lv_flag = abap_true.` Vedi [I valori booleani](./0016-boolean-values.it.md).

## AND, OR, NOT

Combina le condizioni con `AND` (devono essere vere entrambe), `OR` (almeno una) e `NOT` (il contrario):

```abap
DATA lv_carrid TYPE s_carr_id VALUE 'LH'.
DATA lv_price  TYPE p LENGTH 8 DECIMALS 2 VALUE '650'.

IF lv_carrid = 'LH' AND lv_price > 500.
  WRITE / 'Volo Lufthansa costoso'.
ENDIF.

IF lv_carrid = 'LH' OR lv_carrid = 'AZ'.
  WRITE / 'Compagnia europea'.
ENDIF.

IF NOT lv_price > 1000.                     " come lv_price <= 1000
  WRITE / 'Dentro il budget'.
ENDIF.
```

Prima viene valutato `NOT`, poi `AND`, poi `OR`. Quindi `a OR b AND c` vuol dire `a OR ( b AND c )`. Quando mescoli `AND` e `OR`, aggiungi sempre le parentesi, con gli spazi intorno:

```abap
IF ( lv_carrid = 'LH' OR lv_carrid = 'AZ' ) AND lv_price < 300.
  WRITE / 'Volo europeo economico'.
ENDIF.
```

## Confrontare i testi

I confronti fra testi seguono alcune regole che è bene conoscere:

- Confrontando due campi `c` di lunghezza diversa, ABAP riempie di spazi il più corto: `'LH'` è uguale a `'LH   '`.
- `=` **distingue maiuscole e minuscole**: `'lh'` non è uguale a `'LH'`. Se serve, converti con `to_upper( )`.

Per i pattern e gli insiemi di caratteri, ABAP ha operatori speciali:

| Operatore | Vero quando                                                                                    | Esempio                    |
| --------- | ---------------------------------------------------------------------------------------------- | -------------------------- |
| `CO`      | il testo contiene **solo** caratteri di un insieme                                             | `lv_input CO '0123456789'` |
| `CA`      | il testo contiene **almeno un** carattere di un insieme                                        | `lv_name CA '0123456789'`  |
| `CS`      | il testo contiene una sottostringa (senza distinguere maiuscole)                               | `lv_city CS 'york'`        |
| `CP`      | il testo segue un pattern (`*` qualsiasi testo, `+` un carattere; senza distinguere maiuscole) | `lv_city CP 'NEW*'`        |

Le loro negazioni sono `CN`, `NA`, `NS` e `NP`. `CO` è il controllo classico prima di convertire un testo in numero, come hai visto in [Le conversioni di tipo](./0019-type-conversions.it.md):

```abap
DATA lv_input TYPE c LENGTH 4 VALUE '0400'.

IF lv_input CO '0123456789'.
  WRITE / 'Solo cifre: conversione sicura'.
ENDIF.
```

> [!WARNING]
> `CO` controlla tutta la lunghezza di un campo `c`, **spazi finali compresi**. Con `lv_input` lungo 6 e valore `'0400'`, `CO '0123456789'` è falso a causa dei due spazi. Confronta invece un valore senza spazi finali, per esempio `condense( lv_input ) CO '0123456789'`.

Per i pattern complessi usa le espressioni regolari di [FIND, REPLACE e le espressioni regolari](./0096-regular-expressions.it.md).

## Esercizio

> [!IMPORTANT]
>
> Scrivi un report con `lv_carrid`, `lv_price` e `lv_seats_free`, e stampa:
>
> 1. `Esaurito` se non ci sono posti liberi, `Ultimi posti` se sono meno di 5, altrimenti `Disponibile`.
> 2. `Offerta speciale` se la compagnia è `AZ` o `LH` e il prezzo è sotto 200.
> 3. `Compagnia non valida` se `lv_carrid` è vuoto o contiene una cifra.

### Soluzione

```abap
REPORT zif_exercise.

DATA lv_carrid     TYPE s_carr_id VALUE 'AZ'.
DATA lv_price      TYPE p LENGTH 8 DECIMALS 2 VALUE '180'.
DATA lv_seats_free TYPE i VALUE 4.

IF lv_seats_free = 0.
  WRITE / 'Esaurito'.
ELSEIF lv_seats_free < 5.
  WRITE / 'Ultimi posti'.
ELSE.
  WRITE / 'Disponibile'.
ENDIF.

IF ( lv_carrid = 'AZ' OR lv_carrid = 'LH' ) AND lv_price < 200.
  WRITE / 'Offerta speciale'.
ENDIF.

IF lv_carrid IS INITIAL OR lv_carrid CA '0123456789'.
  WRITE / 'Compagnia non valida'.
ENDIF.
```

> [!NOTE]
>
> - `IF ... ELSEIF ... ELSE ... ENDIF` esegue solo il primo ramo la cui condizione è vera.
> - Confronta con `=`, `<>`, `<`, `>`, `<=`, `>=`, `BETWEEN`, e controlla i valori vuoti con `IS INITIAL`.
> - `NOT` viene prima di `AND`, e `AND` prima di `OR`: usa le parentesi quando li mescoli.
> - `=` sui testi distingue maiuscole e minuscole; `CS` e `CP` no.
> - `CO`, `CA`, `CS`, `CP` e le loro negazioni controllano insiemi di caratteri e pattern; `CO` conta gli spazi finali.
