---
title: I tipi data e ora
description: Date, ore, time stamp e calcoli con essi.
---

_Livello principiante_

Date dei voli, orari di prenotazione, scadenze, termini di consegna: i dati di business sono pieni di date e orari. ABAP ha un tipo per le date (`d`), un tipo per gli orari (`t`) e i **time stamp**, che combinano i due e funzionano tra fusi orari diversi. Con le date puoi fare calcoli direttamente: aggiungere giorni, contare i giorni tra due date e molto altro.

## I tipi d e t

| Tipo | Formato    | Lunghezza | Valore iniziale | Esempio                        |
| ---- | ---------- | --------- | --------------- | ------------------------------ |
| `d`  | `YYYYMMDD` | 8         | `'00000000'`    | `'20261231'`: 31 dicembre 2026 |
| `t`  | `HHMMSS`   | 6         | `'000000'`      | `'143000'`: le 14:30           |

Entrambi sono memorizzati come cifre in un formato fisso, qualunque siano le impostazioni dell'utente. Solo l'output con `WRITE` usa il formato data dell'utente, come hai visto in [L'output con WRITE](./0011-output-with-write.it.md).

```abap
REPORT zdate_demo.

DATA lv_flight_date TYPE d VALUE '20261224'.
DATA lv_departure   TYPE t VALUE '093000'.

WRITE: / lv_flight_date,      " 24.12.2026 o 12/24/2026, a seconda dell'utente
       / lv_departure.        " 09:30:00
```

La data e l'ora correnti arrivano dai **campi di sistema**: `sy-datum` e `sy-uzeit` sono la data e l'ora dell'application server; `sy-datlo` e `sy-timlo` sono la data e l'ora nel fuso orario dell'utente. Altri campi di sistema sono in [I campi di sistema](./0023-system-fields.it.md).

## Calcolare con le date

Nei calcoli una data vale come un numero di giorni, quindi puoi aggiungere e togliere giorni direttamente:

```abap
DATA lv_today    TYPE d.
DATA lv_due_date TYPE d.
DATA lv_days     TYPE i.

lv_today = sy-datum.
lv_due_date = lv_today + 30.              " fra 30 giorni
lv_days = lv_due_date - lv_today.         " 30: differenza in giorni
WRITE: / lv_due_date, / lv_days.
```

I cambi di mese e di anno, anni bisestili compresi, li gestisce il sistema: `'20280228' + 1` è `'20280229'`, perché il 2028 è bisestile.

Poiché una data è anche un testo, puoi leggerne o cambiarne le parti con **offset e lunghezza**: `+4(2)` significa "salta 4 caratteri, prendine 2".

```abap
DATA lv_date  TYPE d VALUE '20261117'.
DATA lv_first TYPE d.
DATA lv_last  TYPE d.

WRITE: / lv_date+0(4), lv_date+4(2), lv_date+6(2).   " 2026 11 17

lv_first = lv_date.
lv_first+6(2) = '01'.             " primo giorno del mese: 20261101

lv_last = lv_first + 31.          " un giorno del mese successivo
lv_last+6(2) = '01'.              " primo giorno del mese successivo: 20261201
lv_last = lv_last - 1.            " ultimo giorno di questo mese: 20261130
```

> [!WARNING]
> ABAP non controlla che un campo `d` contenga una data valida. `'20260231'` (31 febbraio) si può memorizzare senza errori, ma i calcoli con questo valore danno risultati sbagliati. Quando una data arriva dall'esterno (un file, un'interfaccia, un input dell'utente nei tuoi campi), controllala prima di usarla, per esempio con il modulo funzione `DATE_CHECK_PLAUSIBILITY`.

## Calcolare con gli orari

Gli orari valgono come secondi dalla mezzanotte:

```abap
DATA lv_start  TYPE t VALUE '223000'.
DATA lv_end    TYPE t.
DATA lv_secs   TYPE i.

lv_end = lv_start + 7200.          " due ore dopo: 003000, dopo la mezzanotte
lv_secs = lv_end - lv_start.       " -79200: la data non fa parte di un orario
WRITE: / lv_end, / lv_secs.
```

Il risultato di un calcolo con gli orari è sempre un'ora del giorno: a mezzanotte ricomincia da capo. Un campo di tipo `t` non sa niente della data, quindi per le durate che superano la mezzanotte servono anche le date, oppure un time stamp.

> [!TIP]
> Un campo `t` è un orologio da parete: dopo le 23:59:59 torna a 00:00:00, e non può dirti che giorno è. Un time stamp è un orologio con il calendario, regolato su un fuso orario di riferimento.

## I time stamp

Un **time stamp** è una data e un'ora insieme, sempre in **UTC** (tempo coordinato universale). I time stamp servono a registrare quando è successo qualcosa, indipendentemente da dove si trovano l'utente o il server.

I time stamp classici sono numeri packed nel formato `YYYYMMDDhhmmss`:

| Tipo del Dizionario | Formato                  | Precisione      |
| ------------------- | ------------------------ | --------------- |
| `TIMESTAMP`         | `YYYYMMDDhhmmss`         | secondi         |
| `TIMESTAMPL`        | `YYYYMMDDhhmmss.sssssss` | 100 nanosecondi |

```abap
DATA lv_stamp TYPE timestamp.
DATA lv_date  TYPE d.
DATA lv_time  TYPE t.

GET TIME STAMP FIELD lv_stamp.                     " adesso, in UTC

CONVERT TIME STAMP lv_stamp TIME ZONE sy-zonlo     " nel fuso orario dell'utente
        INTO DATE lv_date TIME lv_time.
WRITE: / lv_stamp, / lv_date, lv_time.
```

`CONVERT DATE lv_date TIME lv_time INTO TIME STAMP lv_stamp TIME ZONE sy-zonlo` fa il contrario. Non sommare numeri a un time stamp classico: `20261231235959 + 1` non è un orario valido. Usa la classe `CL_ABAP_TSTMP`, per esempio `cl_abap_tstmp=>add( )`.

Dalla release 7.54 esiste anche un tipo time stamp predefinito, `utclong`, con delle funzioni per calcolare:

```abap
DATA lv_now   TYPE utclong.
DATA lv_later TYPE utclong.

lv_now   = utclong_current( ).                      " adesso, in UTC
lv_later = utclong_add( val = lv_now days = 1 ).    " domani alla stessa ora
WRITE: / lv_now, / lv_later.
```

Nelle release precedenti usa `TIMESTAMP` o `TIMESTAMPL`.

## Esercizio

> [!IMPORTANT]
>
> 1. Un volo parte il 28 febbraio 2028 alle 22:45 e atterra 3 ore e 30 minuti dopo. Calcola la data e l'ora di arrivo.
> 2. Calcola quanti giorni mancano da oggi al 31 dicembre dell'anno corrente.

### Soluzione

```abap
REPORT zflight_arrival.

DATA: lv_dep_date TYPE d VALUE '20280228',
      lv_dep_time TYPE t VALUE '224500',
      lv_arr_date TYPE d,
      lv_arr_time TYPE t,
      lv_year_end TYPE d,
      lv_days     TYPE i.

lv_arr_time = lv_dep_time + 12600.               " 3 h 30 min = 12600 secondi: 021500
lv_arr_date = lv_dep_date.
IF lv_arr_time < lv_dep_time.                    " l'orologio è ripartito: giorno dopo
  lv_arr_date = lv_arr_date + 1.                 " 20280229, anno bisestile
ENDIF.
WRITE: / 'Arrivo:', lv_arr_date, lv_arr_time.

lv_year_end = sy-datum.
lv_year_end+4(4) = '1231'.
lv_days = lv_year_end - sy-datum.
WRITE: / 'Giorni alla fine dell''anno:', lv_days.
```

L'istruzione `IF` è trattata in [IF e le espressioni logiche](./0024-if-and-logical-expressions.it.md): qui aggiunge un giorno quando l'ora di arrivo è precedente all'ora di partenza.

> [!NOTE]
>
> - `d` è una data (`YYYYMMDD`), `t` è un orario (`HHMMSS`); entrambi sono memorizzati come cifre e formattati solo in output.
> - Data più numero dà una data; data meno data dà i giorni. I calcoli con gli orari sono in secondi e ricominciano a mezzanotte.
> - Offset e lunghezza (`+6(2)`) leggono e cambiano le parti di una data.
> - ABAP non convalida i campi `d`: controlla le date che arrivano dall'esterno.
> - I time stamp (`TIMESTAMP`, `TIMESTAMPL` e, dalla 7.54, `utclong`) sono in UTC; si convertono con `CONVERT TIME STAMP`.
