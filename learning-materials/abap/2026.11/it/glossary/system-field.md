---
title: System field
description: System field, sy-subrc, sy-tabix.
---

## System field

Un campo della struttura `sy` che il runtime aggiorna da solo: `sy-subrc`, `sy-tabix`, `sy-datum`, `sy-uname` e altri. Lezione [23](../course/0023-system-fields.md).

## `sy-subrc`

Il codice di ritorno dell'ultima istruzione: `0` vuol dire successo. Va controllato dopo `SELECT`, `READ TABLE` e chiamate. Lezione [23](../course/0023-system-fields.md).

## `sy-tabix`

Il campo di sistema con l'indice della riga corrente in un `LOOP AT` o dell'ultima riga letta con `READ TABLE`. Lezioni [23](../course/0023-system-fields.md), [38](../course/0038-looping-internal-tables.md).
