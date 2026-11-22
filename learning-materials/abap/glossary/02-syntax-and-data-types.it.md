---
title: Sintassi e tipi di dati
description: Le regole del linguaggio, variabili, tipi, conversioni e stringhe.
---

**`abap_bool`, `abap_true`, `abap_false`**: il tipo e le costanti per i valori booleani: in ABAP vero è `'X'` e falso è uno spazio. Lezione [16](../course/v2/0016-boolean-values.it.md).

**Campo di sistema**: un campo della struttura `sy` che il runtime aggiorna da solo: `sy-subrc`, `sy-tabix`, `sy-datum`, `sy-uname` e altri. Lezione [23](../course/v2/0023-system-fields.it.md).

**Conversione di tipo**: il passaggio di un valore da un tipo a un altro, automatico con le regole di conversione o esplicito con `CONV` ed `EXACT`. Lezione [19](../course/v2/0019-type-conversions.it.md).

**Costante**: un dato con un valore fisso, dichiarato con `CONSTANTS`, che non si può modificare a runtime. Lezione [12](../course/v2/0012-variables-and-constants.it.md).

**Dichiarazione inline**: la dichiarazione di una variabile nel punto in cui viene usata, con `DATA(...)` o `FIELD-SYMBOL(...)`, con il tipo dedotto dal contesto. Lezione [18](../course/v2/0018-inline-declarations.it.md).

**`LIKE`**: l'aggiunta che dichiara un dato con lo stesso tipo di un altro dato esistente. Lezione [17](../course/v2/0017-types-and-like.it.md).

**Pretty printer**: la funzione dell'editor che riformatta il codice: indentazione e maiuscole o minuscole delle parole chiave. Lezione [10](../course/v2/0010-comments-and-formatting.it.md).

**`sy-subrc`**: il codice di ritorno dell'ultima istruzione: `0` vuol dire successo. Va controllato dopo `SELECT`, `READ TABLE` e chiamate. Lezione [23](../course/v2/0023-system-fields.it.md).

**Template di stringa**: una stringa fra barre verticali (`|...|`) con espressioni fra graffe `{ }` e opzioni di formattazione. Lezione [22](../course/v2/0022-string-templates.it.md).

**Tipi carattere**: i tipi per il testo: `c` a lunghezza fissa, `n` per testo numerico, `string` a lunghezza variabile. Lezione [13](../course/v2/0013-character-types.it.md).

**Tipi data e ora**: i tipi `d` (data, `AAAAMMGG`), `t` (ora, `HHMMSS`), `utclong` e i time stamp, con cui si possono fare calcoli. Lezione [15](../course/v2/0015-date-and-time-types.it.md).

**Tipi numerici**: i tipi per i numeri: `i` e `int8` interi, `p` packed con decimali fissi, `decfloat16` e `decfloat34`, `f` a virgola mobile binaria. Lezione [14](../course/v2/0014-numeric-types.it.md).

**`TYPES`**: l'istruzione che definisce un tipo di dato locale, da usare poi con `TYPE`. Lezione [17](../course/v2/0017-types-and-like.it.md).

**Variabile**: un dato con nome, dichiarato con `DATA`, il cui valore può cambiare durante l'esecuzione. Lezione [12](../course/v2/0012-variables-and-constants.it.md).

**`WRITE`**: l'istruzione che stampa testo e valori in una lista classica. Lezione [11](../course/v2/0011-output-with-write.it.md).

**`xsdbool`**: la funzione che trasforma un'espressione logica in `abap_true` o `abap_false`. Lezione [16](../course/v2/0016-boolean-values.it.md).
