---
title: SELECT-OPTIONS e range
description: Far inserire all'utente intervalli ed elenchi di valori.
---

_Livello base_

Un parametro accetta un solo valore. Gli utenti spesso vogliono di più: le compagnie da `AA` a `LH`, tutte le date di volo di marzo tranne il 15, tutte le città che cominciano con "NEW". `SELECT-OPTIONS` offre loro un campo con un valore "da" e un valore "a", e un pulsante di selezione multipla in cui inserire elenchi, intervalli, modelli ed esclusioni.

Dietro ogni select-option c'è una **tabella range**, una tabella interna con una struttura fissa. La passi direttamente a una `WHERE` con `IN`, e il database applica qualsiasi cosa l'utente abbia inserito.

## Dichiarare una select-option

`SELECT-OPTIONS` richiede un riferimento a un oggetto dati, da cui prende il tipo:

```abap
REPORT zselect_options_demo.

DATA gv_carrid TYPE s_carr_id.
DATA gv_fldate TYPE s_date.

SELECT-OPTIONS:
  s_carr FOR gv_carrid,
  s_date FOR gv_fldate.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, price
    FROM sflight
    WHERE carrid IN @s_carr
      AND fldate IN @s_date
    ORDER BY carrid, connid, fldate
    INTO TABLE @DATA(lt_flights).

  WRITE: / lines( lt_flights ), 'voli'.
```

- Il nome ha al massimo 8 caratteri; `s_` è il prefisso abituale.
- Il campo riceve l'aiuto F4 e le etichette del tipo di `gv_carrid`.
- `IN @s_carr` applica l'intera selezione. Se l'utente lascia il campo vuoto, la condizione è sempre vera: vengono lette **tutte** le compagnie.

> [!TIP]
> Una select-option è come un filtro in un negozio online. Puoi spuntare alcune marche, impostare una fascia di prezzo ed escludere un colore. Se non imposti nessun filtro, il negozio ti mostra tutti i prodotti.

## La tabella range

Una select-option è una tabella interna con quattro colonne:

| Colonna  | Significato                                      | Valori                                                     |
| -------- | ------------------------------------------------ | ---------------------------------------------------------- |
| `SIGN`   | includere o escludere i valori che corrispondono | `I` includi, `E` escludi                                   |
| `OPTION` | l'operatore di confronto                         | `EQ`, `NE`, `GT`, `GE`, `LT`, `LE`, `BT`, `NB`, `CP`, `NP` |
| `LOW`    | il valore, o il limite inferiore                 | stesso tipo del campo di riferimento                       |
| `HIGH`   | il limite superiore, per `BT` e `NB`             | stesso tipo del campo di riferimento                       |

`BT` significa "compreso fra" e `NB` "non compreso fra". `CP` e `NP` significano "corrisponde a un modello" e "non corrisponde", con `*` per qualsiasi sequenza di caratteri e `+` per un carattere. Il sistema imposta `CP` automaticamente quando l'utente scrive un `*`.

Per esempio, "compagnie da `AA` a `LH`, ma non `DL`" viene memorizzato così:

```text
SIGN  OPTION  LOW  HIGH
I     BT      AA   LH
E     EQ      DL
```

Un valore corrisponde se soddisfa almeno una riga `I` e nessuna riga `E`.

> [!WARNING]
> Per ragioni storiche, una select-option è una tabella **con riga di intestazione** (_header line_): `s_carr` da solo può indicare la riga di intestazione, mentre `s_carr[]` indica il corpo della tabella. Nel codice moderno scrivi `s_carr[]` quando intendi la tabella, per esempio `IF s_carr[] IS INITIAL` o `LOOP AT s_carr[] INTO ...`. In `WHERE ... IN @s_carr` funzionano entrambe le forme.

## Aggiunte utili

```abap
DATA gv_connid TYPE s_conn_id.

SELECT-OPTIONS:
  s_carr FOR gv_carrid DEFAULT 'AA' TO 'LH',           " intervallo come default
  s_date FOR gv_fldate NO-EXTENSION,                    " senza pulsante di selezione multipla
  s_conn FOR gv_connid NO INTERVALS,                    " solo valori singoli, senza campo "a"
  s_req  FOR gv_carrid OBLIGATORY.                      " almeno il primo campo obbligatorio
```

| Aggiunta                                      | Effetto                                                               |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `DEFAULT a TO b`                              | propone un intervallo (`DEFAULT a` da solo propone un valore singolo) |
| `NO INTERVALS`                                | nasconde il campo "a"                                                 |
| `NO-EXTENSION`                                | nasconde il pulsante di selezione multipla: una sola riga             |
| `OBLIGATORY`                                  | l'utente deve inserire un valore nel primo campo                      |
| `NO INTERVALS NO-EXTENSION`                   | insieme, un campo per un valore singolo che resta comunque un range   |
| `LOWER CASE`, `MEMORY ID`, `MATCHCODE OBJECT` | come per [PARAMETERS](./0063-parameters.md)                           |

## I range nel tuo codice

Puoi costruire tabelle range anche da solo, senza una schermata di selezione. Dichiara il tipo con `TYPE RANGE OF` e riempilo con `VALUE`:

```abap
TYPES ty_carrid_range TYPE RANGE OF s_carr_id.

DATA(lt_carriers) = VALUE ty_carrid_range(
  ( sign = 'I' option = 'EQ' low = 'LH' )
  ( sign = 'I' option = 'EQ' low = 'AA' )
  ( sign = 'I' option = 'BT' low = 'SQ' high = 'UA' ) ).

SELECT carrid, carrname
  FROM scarr
  WHERE carrid IN @lt_carriers
  INTO TABLE @DATA(lt_selected).
```

L'operatore `IN` funziona anche nelle espressioni logiche ABAP, fuori dalle istruzioni SQL:

```abap
IF 'LH' IN lt_carriers.
  WRITE: / 'LH è selezionata'.
ENDIF.
```

Nel codice più vecchio vedrai `RANGES r_carr FOR scarr-carrid.`: dichiara una tabella range con riga di intestazione ed è obsoleto. Usa invece `TYPE RANGE OF`.

> [!CAUTION]
> Una tabella range con molte migliaia di righe diventa una clausola `WHERE` enorme e può finire in un errore del database. Non usare i range per passare lunghi elenchi di chiavi presi da un'altra tabella: usa un [join](./0055-joins.md) o [FOR ALL ENTRIES](./0057-for-all-entries.md).

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report con select-option per compagnia e città di partenza su `SPFLI`, in cui la città non ha intervallo.
> 2. Stampa i collegamenti che corrispondono, e stampa "tutte le compagnie" se l'utente ha lasciato vuoto il campo della compagnia.
> 3. Costruisci nel codice un range che esclude `LH` e aggiungilo alla `WHERE`.

### Soluzione

```abap
REPORT zselect_options_exercise.

DATA gv_carrid TYPE s_carr_id.
DATA gv_city   TYPE s_from_cit.

SELECT-OPTIONS:
  s_carr FOR gv_carrid,
  s_city FOR gv_city NO INTERVALS.

START-OF-SELECTION.
  IF s_carr[] IS INITIAL.
    WRITE: / 'Tutte le compagnie'.
  ENDIF.

  TYPES ty_carrid_range TYPE RANGE OF s_carr_id.
  DATA(lt_no_lh) = VALUE ty_carrid_range( ( sign = 'E' option = 'EQ' low = 'LH' ) ).

  SELECT carrid, connid, cityfrom, cityto
    FROM spfli
    WHERE carrid   IN @s_carr
      AND carrid   IN @lt_no_lh
      AND cityfrom IN @s_city
    ORDER BY carrid, connid
    INTO TABLE @DATA(lt_connections).

  LOOP AT lt_connections INTO DATA(ls_conn).
    WRITE: / ls_conn-carrid, ls_conn-connid, ls_conn-cityfrom, ls_conn-cityto.
  ENDLOOP.
```

Un range con sole righe `E` corrisponde a tutti i valori tranne quelli esclusi.

> [!NOTE]
>
> - `SELECT-OPTIONS s_x FOR dobj` permette all'utente di inserire valori singoli, intervalli, modelli ed esclusioni.
> - Ogni select-option è una tabella range con `SIGN`, `OPTION`, `LOW` e `HIGH`.
> - `WHERE col IN @s_x` applica la selezione; un range vuoto seleziona tutto.
> - Usa `s_x[]` per il corpo della tabella, perché le select-option hanno una riga di intestazione.
> - Costruisci i tuoi range con `TYPE RANGE OF` e `VALUE`; `RANGES` è obsoleto.
