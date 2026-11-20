---
title: I moduli funzione di aggiornamento
description: CALL FUNCTION IN UPDATE TASK, PERFORM ON COMMIT e SM13.
---

_Livello intermedio_

Una LUW SAP spesso attraversa più schermate, e ogni passo può girare in un work process diverso, con il suo commit di database. Per tenere insieme tutte le modifiche non scrivi subito nel database: **registri** le modifiche e lasci che SAP le esegua tutte insieme quando il programma chiama `COMMIT WORK`. Lo strumento per farlo è il **modulo funzione di aggiornamento** (update function module).

Questa lezione parte da [la LUW: COMMIT e ROLLBACK](./0060-luw-commit-and-rollback.it.md) e da [i moduli funzione](./0070-function-modules.it.md).

## Come funziona l'update task

Quando chiami un modulo funzione `IN UPDATE TASK`, il modulo non gira. Il runtime salva il suo nome e i valori dei parametri nelle tabelle di aggiornamento (`VBHDR`, `VBMOD`, `VBDATA`). Solo al `COMMIT WORK` un **work process di aggiornamento** legge quei record ed esegue tutti i moduli registrati in un'unica LUW di database.

- Se tutti i moduli finiscono senza errori, il work process di aggiornamento fa il commit.
- Se un modulo fallisce, tutto l'aggiornamento viene annullato e il record resta nelle tabelle di aggiornamento con uno stato di errore.
- Un `ROLLBACK WORK` prima del commit butta via tutte le chiamate registrate.

> [!TIP]
> È come il carrello di un negozio online. Metti gli articoli nel carrello mentre navighi (le chiamate `CALL FUNCTION ... IN UPDATE TASK`), ma non paghi nulla. Alla cassa (`COMMIT WORK`) paghi tutto in un'unica transazione, oppure niente.

## Creare un modulo funzione di aggiornamento

In `SE37` crei il modulo funzione e nella scheda **Attributi** imposti il **tipo di elaborazione** su **Modulo di aggiornamento**. Poi scegli una di queste opzioni:

| Opzione                        | Significato                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Avvio immediato (V1)           | aggiornamento critico: gira per primo, si può ripetere da `SM13` dopo un errore      |
| Avvio immediato, senza riavvio | aggiornamento V1 che non si può ripetere                                             |
| Avvio ritardato (V2)           | aggiornamento non critico (statistiche, log): gira dopo la fine di tutti i moduli V1 |
| Esecuzione collettiva          | aggiornamento V2 che aspetta un report di esecuzione collettiva                      |

Regole per l'interfaccia:

- solo parametri `IMPORTING` e `TABLES`, tutti passati per valore; niente parametri `EXPORTING`, perché nessuno aspetta un risultato;
- niente `COMMIT WORK` e niente `ROLLBACK WORK` dentro il modulo;
- per interrompere l'aggiornamento invii un messaggio di tipo `A` (o `X`), oppure sollevi un'eccezione.

```abap
FUNCTION z_flight_booking_insert.
*"----------------------------------------------------------------------
*"  IMPORTING
*"     VALUE(IS_BOOKING) TYPE SBOOK
*"----------------------------------------------------------------------
  INSERT sbook FROM is_booking.
  IF sy-subrc <> 0.
    " Messaggio di tipo A: l'intero aggiornamento viene annullato e registrato in SM13
    MESSAGE 'Impossibile inserire la prenotazione' TYPE 'A'.
  ENDIF.
ENDFUNCTION.
```

## Registrare e fare il commit

```abap
DATA(ls_booking) = VALUE sbook( carrid   = 'LH'
                                connid   = '0400'
                                fldate   = '20261215'
                                bookid   = '00012345'
                                customid = '00000001'
                                class    = 'Y' ).

CALL FUNCTION 'Z_FLIGHT_BOOKING_INSERT' IN UPDATE TASK
  EXPORTING
    is_booking = ls_booking.

ls_booking-bookid = '00012346'.          " la prima chiamata conserva la sua copia

CALL FUNCTION 'Z_FLIGHT_BOOKING_INSERT' IN UPDATE TASK
  EXPORTING
    is_booking = ls_booking.

COMMIT WORK AND WAIT.                    " ora girano entrambi gli insert, insieme
IF sy-subrc <> 0.
  WRITE / 'Aggiornamento fallito: controlla la SM13'.
ENDIF.
```

I valori dei parametri vengono copiati quando **registri** la chiamata, non quando il modulo gira. Per questo cambiare `ls_booking` dopo la prima chiamata non la influenza.

- `COMMIT WORK` è **asincrono**: il programma prosegue mentre l'aggiornamento gira.
- `COMMIT WORK AND WAIT` è **sincrono**: il programma aspetta la fine dell'aggiornamento e `sy-subrc` ti dice se è andato a buon fine. Usalo quando il passo successivo legge i dati appena scritti.
- `SET UPDATE TASK LOCAL` prima della prima registrazione esegue l'aggiornamento nello stesso work process, al momento del commit. È comune nei job in background e nei programmi batch.

> [!WARNING]
> Non usare mai `COMMIT WORK` in codice che gira dentro la LUW di qualcun altro, come una exit, una BAdI o un modulo funzione chiamato da una transazione standard. Faresti il commit dei dati a metà del chiamante.

## PERFORM ON COMMIT

`PERFORM ... ON COMMIT` registra una subroutine che gira al `COMMIT WORK`, nel work process corrente, **prima** dei moduli di aggiornamento. Una subroutine registrata più volte gira una volta sola, con i valori che le variabili globali hanno al momento del commit. Il codice standard la usa per raccogliere i dati durante il dialogo e registrare le chiamate di aggiornamento in un solo punto.

```abap
DATA gt_bookings TYPE STANDARD TABLE OF sbook WITH EMPTY KEY.

START-OF-SELECTION.
  gt_bookings = VALUE #( ( carrid = 'LH' connid = '0400' fldate = '20261215'
                           bookid = '00012347' customid = '00000001' ) ).
  PERFORM save_bookings ON COMMIT.
  COMMIT WORK.

FORM save_bookings.
  LOOP AT gt_bookings INTO DATA(ls_booking).
    CALL FUNCTION 'Z_FLIGHT_BOOKING_INSERT' IN UPDATE TASK
      EXPORTING
        is_booking = ls_booking.
  ENDLOOP.
ENDFORM.
```

`PERFORM ... ON ROLLBACK` è l'opposto: la subroutine gira al `ROLLBACK WORK`. Le `FORM` sono obsolete nel codice nuovo (vedi [include e subroutine](./0069-includes-and-subroutines.it.md)), ma troverai `ON COMMIT` in molti programmi standard.

## Monitorare gli aggiornamenti falliti in SM13

La transazione `SM13` elenca i record di aggiornamento. Seleziona per utente e data e guarda lo stato:

| Stato          | Significato                                                          |
| -------------- | -------------------------------------------------------------------- |
| `Init`         | in attesa di elaborazione                                            |
| `Run`          | in esecuzione                                                        |
| `Err`          | l'aggiornamento è fallito: il record conserva i valori dei parametri |
| `V1 processed` | V1 terminato, V2 ancora in attesa                                    |

Fai doppio clic su un record `Err` per vedere i moduli e il messaggio di errore, e salta al dump in `ST22`. Dopo aver risolto la causa, puoi ripetere un aggiornamento V1 che lo consente (**Richieste di aggiornamento > Ripeti aggiornamento**). Di default l'utente riceve anche un messaggio express in SAP quando il suo aggiornamento fallisce.

> [!CAUTION]
> Un aggiornamento fallito significa che l'utente ha visto un messaggio "salvato", ma i dati non sono nel database. Controlla la `SM13` con regolarità in produzione, e non cancellare mai un record `Err` prima di sapere se i dati vanno registrati di nuovo.

## Esercizio

> [!IMPORTANT]
>
> 1. Crea una tabella `ZFLIGHT_NOTE` (chiave: `CARRID`, `CONNID`; campo `NOTE` di tipo `CHAR80`) e un modulo funzione di aggiornamento `Z_FLIGHT_NOTE_INSERT` che inserisce una riga.
> 2. Scrivi un report che registra due insert ed esegue `COMMIT WORK AND WAIT`. Controlla il contenuto della tabella.
> 3. Esegui di nuovo il report con le stesse chiavi, in modo che l'`INSERT` fallisca, e trova l'errore in `SM13`.

### Soluzione

```abap
FUNCTION z_flight_note_insert.
*"  IMPORTING
*"     VALUE(IS_NOTE) TYPE ZFLIGHT_NOTE
  INSERT zflight_note FROM is_note.
  IF sy-subrc <> 0.
    MESSAGE 'Nota di volo duplicata' TYPE 'A'.
  ENDIF.
ENDFUNCTION.
```

```abap
REPORT zflight_note_update.

CALL FUNCTION 'Z_FLIGHT_NOTE_INSERT' IN UPDATE TASK
  EXPORTING is_note = VALUE zflight_note( carrid = 'LH' connid = '0400' note = 'Volo notturno' ).
CALL FUNCTION 'Z_FLIGHT_NOTE_INSERT' IN UPDATE TASK
  EXPORTING is_note = VALUE zflight_note( carrid = 'AZ' connid = '0555' note = 'Aereo nuovo' ).

COMMIT WORK AND WAIT.
WRITE / COND string( WHEN sy-subrc = 0 THEN 'Salvato' ELSE 'Aggiornamento fallito: vedi SM13' ).
```

Alla seconda esecuzione il primo `INSERT` fallisce, tutto l'aggiornamento viene annullato (non viene scritta nessuna delle due righe) e la `SM13` mostra un record con stato `Err`.

> [!NOTE]
>
> - `CALL FUNCTION ... IN UPDATE TASK` registra solo la chiamata; il modulo gira al `COMMIT WORK`.
> - Tutti i moduli registrati girano in un'unica LUW di database: o riescono tutti, o vengono annullati tutti.
> - I moduli di aggiornamento hanno solo parametri `IMPORTING` e `TABLES`, passati per valore, e non fanno mai commit.
> - `COMMIT WORK AND WAIT` aspetta l'aggiornamento e imposta `sy-subrc`; `SET UPDATE TASK LOCAL` lo esegue nello stesso work process.
> - `PERFORM ... ON COMMIT` esegue una subroutine una volta sola al commit, prima dei moduli di aggiornamento.
> - La `SM13` mostra gli aggiornamenti falliti: controllala e ripeti o registra di nuovo i dati.
