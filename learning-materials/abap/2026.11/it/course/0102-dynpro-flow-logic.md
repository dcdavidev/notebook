---
title: 'La flow logic: PBO e PAI'
description: Moduli, codici OK e il ciclo fra schermo e programma.
level: intermediate
---

Un [dynpro](./0101-dynpro-basics.md) non esegue direttamente ABAP. Ha un suo piccolo linguaggio, la **flow logic**, che chiama dei **moduli** ABAP in due momenti: prima che la schermata sia mostrata e dopo l'azione dell'utente. Capire questo ciclo è la chiave di ogni schermata classica.

## I due eventi

La flow logic di una schermata ha due blocchi:

- **PBO** (Process Before Output) viene eseguito prima che la schermata sia inviata all'utente. Qui imposti il GUI status e il titolo, riempi i campi e cambi gli attributi dei campi.
- **PAI** (Process After Input) viene eseguito quando l'utente preme Invio, un pulsante, una voce di menu o un tasto funzione. Qui leggi l'input e decidi che cosa succede dopo.

```abap
PROCESS BEFORE OUTPUT.
  MODULE status_0100.
  MODULE fill_fields_0100.

PROCESS AFTER INPUT.
  MODULE user_command_0100.
```

La flow logic non è ABAP: conosce solo poche istruzioni come `MODULE`, `FIELD`, `CHAIN`, `LOOP` e `CALL SUBSCREEN`. La scrivi nella scheda Flow logic dello Screen Painter. Fai doppio clic sul nome di un modulo che non esiste ancora, e il sistema ti propone di crearlo nell'include giusto.

## I moduli

Un modulo è un blocco di codice ABAP che la flow logic chiama. I moduli `OUTPUT` sono per il PBO, quelli `INPUT` per il PAI.

```abap
MODULE status_0100 OUTPUT.
  SET PF-STATUS 'STATUS_0100'.
  SET TITLEBAR 'TITLE_0100'.
ENDMODULE.

MODULE fill_fields_0100 OUTPUT.
  IF scarr-carrid IS INITIAL.
    scarr-carrid = 'LH'.                   " valore di default
  ENDIF.
ENDMODULE.
```

I moduli non hanno parametri né dati locali: un'istruzione `DATA` dentro un modulo dichiara una variabile **globale**. Tieni i moduli corti e chiama i metodi di una classe per il lavoro vero.

> [!WARNING]
> Non usare dichiarazioni inline come `DATA(lv_x)` dentro i moduli. Sembrano locali, ma sono variabili globali del programma, visibili e ancora piene in tutti gli altri moduli.

## L'OK code e il modulo PAI

Quando l'utente attiva una funzione, il sistema scrive il suo **codice funzione** nel campo OK code della schermata. Con il trasporto dei dati arriva alla variabile del programma con lo stesso nome, `ok_code`. Lo schema abituale lo copia e lo svuota subito, così un vecchio valore non attiva mai più una funzione:

```abap
" Include TOP
DATA ok_code    TYPE sy-ucomm.
DATA gv_save_ok TYPE sy-ucomm.

" Include PAI
MODULE user_command_0100 INPUT.
  gv_save_ok = ok_code.
  CLEAR ok_code.

  CASE gv_save_ok.
    WHEN 'BACK' OR 'EXIT' OR 'CANCEL'.
      LEAVE TO SCREEN 0.                   " torna dove c'era CALL SCREEN
    WHEN 'READ'.
      SELECT SINGLE * FROM scarr
        WHERE carrid = @scarr-carrid
        INTO @scarr.
      IF sy-subrc <> 0.
        MESSAGE 'Compagnia non trovata' TYPE 'S' DISPLAY LIKE 'E'.
      ENDIF.
    WHEN 'DETAIL'.
      CALL SCREEN 200.                     " una nuova schermata sopra questa
    WHEN OTHERS.
      " Invio: niente da fare, la schermata viene mostrata di nuovo
  ENDCASE.
ENDMODULE.
```

Premere Invio invia un codice funzione vuoto, a meno che tu non assegni un codice a Invio nel GUI status. Anche il campo di sistema `sy-ucomm` contiene il codice funzione, ma leggilo solo attraverso il campo OK code: `sy-ucomm` non è affidabile in tutte le situazioni.

## Il ciclo completo

```text
CALL SCREEN 100
  vengono eseguiti i moduli PBO
  trasporto dati: campi del programma -> campi della schermata
  la schermata è mostrata, l'utente inserisce i dati e preme un tasto
  trasporto dati: campi della schermata -> campi del programma (e l'OK code)
  vengono eseguiti i moduli PAI
  schermata successiva:
    100 -> di nuovo il PBO della schermata 100
    200 -> il PBO della schermata 200
    0   -> ritorno all'istruzione dopo CALL SCREEN
```

> [!TIP]
> È uno scambio a tennis. Il PBO è il programma che serve la palla all'utente; il PAI è l'utente che la rimanda indietro. Lo scambio continua finché qualcuno imposta la schermata successiva a 0.

Dove va il programma dopo il PAI dipende dalla **schermata successiva**. È un attributo statico della schermata (di default la schermata stessa), e puoi cambiarlo a runtime:

| Istruzione             | Effetto                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `SET SCREEN 200.`      | imposta la schermata successiva; il modulo PAI corrente continua |
| `LEAVE SCREEN.`        | termina la schermata corrente e passa alla successiva            |
| `LEAVE TO SCREEN 200.` | le due precedenti in una sola istruzione                         |
| `LEAVE TO SCREEN 0.`   | termina la sequenza di schermate e torna dopo `CALL SCREEN`      |
| `CALL SCREEN 200.`     | avvia una nuova sequenza di schermate sopra quella corrente      |
| `LEAVE PROGRAM.`       | termina l'intero programma                                       |

Ogni `CALL SCREEN` apre un nuovo livello e `LEAVE TO SCREEN 0` lo chiude. Se continui a chiamare schermate senza mai lasciarle, i livelli si accumulano finché il programma si ferma con un errore di runtime.

## Esercizio

> [!IMPORTANT]
>
> 1. Nel module pool `SAPMZFLIGHT` della lezione precedente, aggiungi due pulsanti alla schermata `0100`: "Leggi" con codice funzione `READ` ed "Esci" con codice funzione `EXIT`.
> 2. Scrivi il modulo PBO che propone `LH` come compagnia e il modulo PAI che con `READ` legge la compagnia da `SCARR` e con `EXIT` esce.

### Soluzione

```abap
" Flow logic della schermata 0100
PROCESS BEFORE OUTPUT.
  MODULE fill_fields_0100.

PROCESS AFTER INPUT.
  MODULE user_command_0100.
```

```abap
MODULE fill_fields_0100 OUTPUT.
  IF scarr-carrid IS INITIAL.
    scarr-carrid = 'LH'.
  ENDIF.
ENDMODULE.

MODULE user_command_0100 INPUT.
  gv_save_ok = ok_code.
  CLEAR ok_code.
  CASE gv_save_ok.
    WHEN 'EXIT'.
      LEAVE PROGRAM.
    WHEN 'READ'.
      SELECT SINGLE * FROM scarr WHERE carrid = @scarr-carrid INTO @scarr.
      IF sy-subrc <> 0.
        CLEAR: scarr-carrname, scarr-currcode.
        MESSAGE 'Compagnia non trovata' TYPE 'S' DISPLAY LIKE 'E'.
      ENDIF.
  ENDCASE.
ENDMODULE.
```

> [!NOTE]
>
> - Il PBO viene eseguito prima che la schermata sia mostrata, il PAI dopo l'azione dell'utente; la flow logic chiama moduli `OUTPUT` e `INPUT`.
> - I campi con lo stesso nome vengono copiati dal programma alla schermata dopo il PBO e dalla schermata al programma prima del PAI.
> - All'inizio del modulo PAI copia l'OK code in una variabile di appoggio e svuotalo.
> - I moduli non hanno dati locali: tutto quello che ci dichiari è globale.
> - Controlla la schermata successiva con `SET SCREEN`, `LEAVE TO SCREEN`, `CALL SCREEN` e torna indietro con `LEAVE TO SCREEN 0`.
