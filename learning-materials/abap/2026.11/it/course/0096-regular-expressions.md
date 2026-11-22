---
title: FIND, REPLACE e le espressioni regolari
description: Cercare e modificare testi con i pattern.
---

_Livello intermedio_

[Lavorare con le stringhe](./0021-working-with-strings.md) ti ha mostrato come concatenare, dividere e cambiare il maiuscolo di un testo. Questa lezione riguarda la ricerca al suo interno: trovare una parola, sostituirne tutte le occorrenze e, con le **espressioni regolari**, trovare il testo che corrisponde a un pattern, come "due lettere seguite da quattro cifre". Ti servirà per validare l'input, ripulire i file caricati ed estrarre valori da un testo libero.

## FIND

`FIND` cerca una sottostringa. `sy-subrc` vale `0` se la trova e `4` se no:

```abap
REPORT zfind_replace.

DATA(lv_text) = `Flight LH 0400 from Frankfurt to New York, LH 0402 back`.

FIND `LH` IN lv_text MATCH OFFSET DATA(lv_offset).
IF sy-subrc = 0.
  WRITE: / 'Primo LH all''offset', lv_offset.          " 7
ENDIF.

FIND ALL OCCURRENCES OF `lh` IN lv_text
     IGNORING CASE
     MATCH COUNT DATA(lv_count).
WRITE: / 'Occorrenze:', lv_count.                      " 2
```

| Aggiunta                       | Effetto                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `FIRST OCCURRENCE OF`          | il default: si ferma alla prima corrispondenza                     |
| `ALL OCCURRENCES OF`           | trova tutte le corrispondenze                                      |
| `IGNORING CASE`                | maiuscole e minuscole sono uguali                                  |
| `MATCH OFFSET`, `MATCH LENGTH` | posizione e lunghezza dell'(ultima) corrispondenza                 |
| `MATCH COUNT`                  | numero di corrispondenze                                           |
| `RESULTS`                      | tutte le corrispondenze, in una tabella di tipo `match_result_tab` |
| `IN TABLE`                     | cerca in tutte le righe di una tabella interna di stringhe         |

## REPLACE

`REPLACE` cambia la prima occorrenza, o tutte, e imposta `sy-subrc` a `0` se ha sostituito qualcosa:

```abap
DATA(lv_route) = `ROME - FRANKFURT - NEW YORK`.

REPLACE ` - ` IN lv_route WITH ` > `.                   " solo la prima
REPLACE ALL OCCURRENCES OF ` - ` IN lv_route WITH ` > `
        REPLACEMENT COUNT DATA(lv_replaced).
WRITE: / lv_route, lv_replaced.                         " ROME > FRANKFURT > NEW YORK 1
```

Il testo da cercare e quello sostitutivo sono operandi di qualsiasi tipo carattere. Usa letterali stringa con gli apici inversi quando gli spazi contano: in un letterale `c` come `' - '` gli spazi finali vengono ignorati.

## Le espressioni regolari

Un'**espressione regolare** (regex) descrive un pattern invece di un testo fisso. Da ABAP 7.55 il motore regex consigliato è **PCRE** (Perl Compatible Regular Expressions), che usi con l'aggiunta `PCRE`. La vecchia aggiunta `REGEX` usa la sintassi POSIX; è obsoleta, ma la troverai ancora nel codice esistente.

Gli elementi più comuni:

| Pattern          | Corrisponde a                                        |
| ---------------- | ---------------------------------------------------- |
| `.`              | qualsiasi carattere                                  |
| `\d`, `\w`, `\s` | una cifra, un carattere di parola, uno spazio        |
| `[A-Z]`          | un carattere dell'intervallo                         |
| `[^0-9]`         | un carattere che **non** è nell'intervallo           |
| `x*`, `x+`, `x?` | zero o più, uno o più, zero o una `x`                |
| `x{4}`, `x{2,3}` | esattamente 4, fra 2 e 3 `x`                         |
| `^`, `$`         | inizio e fine del testo                              |
| `( ... )`        | un gruppo, che puoi leggere come sottocorrispondenza |
| `a\|b`           | `a` oppure `b`                                       |

> [!TIP]
> Una ricerca semplice è come cercare un nome preciso nell'elenco del telefono. Un'espressione regolare è come chiedere "tutti i cognomi che iniziano con la M e hanno cinque lettere": descrivi la forma di quello che vuoi, e il motore trova tutto ciò che ci corrisponde.

## FIND e REPLACE con PCRE

Con `SUBMATCHES` ottieni il testo di ogni gruppo:

```abap
DATA(lv_flight_code) = `LH0400`.

FIND PCRE `^([A-Z0-9]{2})(\d{4})$` IN lv_flight_code
     SUBMATCHES DATA(lv_carrid) DATA(lv_connid).
IF sy-subrc = 0.
  WRITE: / 'Compagnia', lv_carrid, 'collegamento', lv_connid.
ELSE.
  WRITE: / 'Non è un codice volo'.
ENDIF.
```

Nel testo sostitutivo, `$1`, `$2`, ... inseriscono i gruppi. Così trasformi le date ISO nel formato europeo:

```abap
DATA(lv_dates) = `Partenze: 2026-12-15, 2026-12-22`.
REPLACE ALL OCCURRENCES OF PCRE `(\d{4})-(\d{2})-(\d{2})` IN lv_dates WITH `$3.$2.$1`.
WRITE / lv_dates.                                       " Partenze: 15.12.2026, 22.12.2026
```

Per elencare tutte le corrispondenze usa `RESULTS`:

```abap
FIND ALL OCCURRENCES OF PCRE `[A-Z]{2} \d{4}` IN lv_text RESULTS DATA(lt_results).
LOOP AT lt_results INTO DATA(ls_result).
  WRITE / substring( val = lv_text off = ls_result-offset len = ls_result-length ).
ENDLOOP.                                                " LH 0400, LH 0402
```

## Le funzioni predefinite con i pattern

Anche le funzioni per le stringhe accettano un parametro `pcre` (o `regex` per POSIX, o `sub` per un testo semplice), così puoi usare i pattern dentro le espressioni:

```abap
DATA(lv_email) = `mario.rossi@example.com`.

IF matches( val = lv_email pcre = `^[\w.+-]+@[\w-]+(\.[\w-]+)+$` ).
  WRITE / 'Email valida'.
ENDIF.

DATA(lv_numbers) = count( val = lv_text pcre = `\d+` ).                 " 2
DATA(lv_first)   = match( val = lv_text pcre = `\d{4}` occ = 1 ).        " 0400
DATA(lv_clean)   = replace( val = lv_text pcre = `\s+` with = ` ` occ = 0 ).
DATA(lv_pos)     = find( val = lv_text pcre = `New\s+York` ).           " offset, o -1
```

`occ = 0` in `replace( )` significa tutte le occorrenze. `contains( val = ... pcre = ... )` è un predicato come `matches( )`, ma è vero se il pattern compare in un punto qualsiasi del testo. Se usi più volte lo stesso pattern complesso, le classi `CL_ABAP_REGEX` e `CL_ABAP_MATCHER` ti permettono di compilarlo una volta e riusarlo.

> [!WARNING]
> Con le espressioni regolari è facile fare le cose quasi giuste. Un pattern senza `^` e `$` corrisponde anche dentro un testo più lungo, quindi `\d{4}` accetta `12345`. Prova i pattern con dati reali, compreso l'input sbagliato, e tienili corti: una regex che nessuno sa leggere è un bug in agguato. Per i testi fissi semplici, `FIND` e `REPLACE` normali sono più veloci e più chiari.

## Esercizio

> [!IMPORTANT]
>
> 1. Riempi una `string_table` con queste righe: `LH0400 ok`, `AA17 bad`, `AZ0555 ok`, `XX12345 bad`.
> 2. Per ogni riga usa `FIND PCRE` con `SUBMATCHES` per controllare se inizia con un codice volo valido (due lettere o cifre seguite da esattamente quattro cifre e uno spazio) e stampa compagnia e collegamento.
> 3. Usa `replace( )` per mascherare con `*` tutte le cifre della riga `Carta 4111 1111 1111 1111`.

### Soluzione

```abap
DATA(lt_lines) = VALUE string_table( ( `LH0400 ok` ) ( `AA17 bad` )
                                     ( `AZ0555 ok` ) ( `XX12345 bad` ) ).

LOOP AT lt_lines INTO DATA(lv_line).
  FIND PCRE `^([A-Z0-9]{2})(\d{4})\s` IN lv_line
       SUBMATCHES DATA(lv_carr) DATA(lv_conn).
  IF sy-subrc = 0.
    WRITE: / lv_carr, lv_conn.
  ELSE.
    WRITE: / 'Non valida:', lv_line.
  ENDIF.
ENDLOOP.

DATA(lv_masked) = replace( val = `Carta 4111 1111 1111 1111` pcre = `\d` with = `*` occ = 0 ).
WRITE / lv_masked.                                      " Carta **** **** **** ****
```

> [!NOTE]
>
> - `FIND` e `REPLACE` cercano e cambiano sottostringhe; `sy-subrc` vale `0` in caso di successo.
> - `ALL OCCURRENCES`, `IGNORING CASE`, `MATCH COUNT`, `MATCH OFFSET` e `RESULTS` controllano la ricerca e ne riportano i risultati.
> - L'aggiunta `PCRE` (da ABAP 7.55) usa le espressioni regolari; `REGEX` (POSIX) è obsoleta.
> - `SUBMATCHES` legge i gruppi di una corrispondenza, e `$1`, `$2` li inseriscono in una sostituzione.
> - Le funzioni `matches`, `contains`, `find`, `count`, `match` e `replace` accettano un parametro `pcre` da usare dentro le espressioni.
