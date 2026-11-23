---
title: Breakpoint e watchpoint
description: Fermare il programma esattamente dove e quando vuoi.
level: beginner
---

In [Il debugger: primi passi](./0028-debugger-basics.md) hai fermato un programma su una riga e l'hai eseguito passo per passo. Nei programmi veri, con migliaia di righe e cicli su migliaia di righe di dati, premere F5 non basta. Vuoi che il programma si fermi **esattamente** dove succede qualcosa di interessante: a una certa istruzione, in un certo passo di un ciclo, o nel momento in cui una variabile cambia.

È il compito dei diversi tipi di **breakpoint** e dei **watchpoint**.

## Breakpoint di sessione ed esterni

Un breakpoint che imposti nell'editor viene memorizzato nel sistema per il tuo utente. Ne esistono due tipi:

| Tipo                                       | Vale per                                                 | Uso tipico                                     |
| ------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| **Breakpoint di sessione**                 | la tua sessione SAP GUI corrente; sparisce quando esci   | i programmi che avvii tu stesso in SAP GUI     |
| **Breakpoint esterno** (breakpoint utente) | il tuo utente, anche nelle sessioni avviate dall'esterno | app Fiori, chiamate OData e HTTP, chiamate RFC |

In SAP GUI scegli il tipo nell'editor ABAP con i due pulsanti dei breakpoint. In ADT i breakpoint sono esterni per default, quindi fermano anche le richieste che arrivano da un browser o da un altro sistema, purché girino con il tuo utente.

> [!TIP]
> Un breakpoint di sessione è un post-it sulla tua copia di un libro: lo vedi solo tu, e sparisce quando restituisci il libro. Un breakpoint esterno è un biglietto al banco della biblioteca: "fermatemi ogni volta che prendo in prestito questo libro, in qualsiasi sede".

## Breakpoint nel codice: BREAK-POINT

Puoi anche scrivere un breakpoint nel codice sorgente:

```abap
REPORT zbreak_demo.

DATA lv_total TYPE i.

DO 5 TIMES.
  lv_total += sy-index.
  BREAK-POINT.                      " si ferma qui per OGNI utente
ENDDO.
```

> [!CAUTION]
> `BREAK-POINT` ferma il programma per **ogni utente** che lo esegue in dialogo, e nei job in background scrive una voce nel log di sistema. Non trasportare mai codice che lo contiene: per questo il code inspector e l'ATC lo segnalano.

Il codice vecchio contiene anche `BREAK nomeutente.`, che si ferma solo per l'utente indicato. È meno pericoloso, ma resta vietato nel codice di produzione. Quando ti serve un breakpoint da accendere e spegnere senza modificare il codice, usa `BREAK-POINT ID gruppo`: il **gruppo di checkpoint** si attiva nella transazione `SAAB`, e quando è inattivo l'istruzione non fa nulla.

## Breakpoint dinamici nel debugger

Mentre fai il debug, puoi creare breakpoint che non appartengono a una riga, ma a un **tipo di istruzione** o a un evento. Nel debugger di SAP GUI usa il menu **Breakpoint > Breakpoint su**; in ADT usa la vista **Breakpoints**.

| Breakpoint su...        | Si ferma...                                         | Esempio                                |
| ----------------------- | --------------------------------------------------- | -------------------------------------- |
| istruzione              | a ogni istruzione di quel tipo                      | ogni `SELECT`, ogni `MESSAGE`          |
| metodo, modulo funzione | quando quel metodo o modulo funzione viene chiamato | `BAPI_FLIGHT_GETLIST`                  |
| eccezione               | quando viene sollevata un'eccezione                 | `CX_SY_ZERODIVIDE`                     |
| messaggio               | quando viene emesso un certo messaggio              | messaggio `001` della classe `ZFLIGHT` |

Un breakpoint sull'istruzione `MESSAGE` è il modo classico per scoprire da dove arriva un messaggio di errore in un programma che non conosci.

Puoi anche aggiungere una **condizione** a un breakpoint, così si ferma solo quando la condizione è vera, per esempio `sy-index = 4` o `lv_carrid = 'LH'`. Nel debugger di SAP GUI modifica il breakpoint nella scheda **Break./Watchpoint**; in ADT apri le proprietà del breakpoint.

## Watchpoint: fermarsi quando un valore cambia

Un **watchpoint** non è legato a una riga: ferma il programma **quando il valore di una variabile cambia**, ovunque succeda. È lo strumento per domande come "chi sovrascrive questo campo?".

1. Avvia il debugger con un breakpoint normale.
2. Crea un watchpoint per la variabile: in SAP GUI, il pulsante **Watchpoint** (o la scheda **Break./Watchpoint**); in ADT, fai clic destro sulla variabile nella vista **Variables** e imposta il watchpoint dal menu contestuale.
3. Se vuoi, aggiungi una condizione, per esempio `lv_total > 10`.
4. Premi F8: il debugger si ferma subito dopo l'istruzione che ha cambiato il valore.

```abap
REPORT zwatch_demo.

DATA lv_total TYPE i.
DATA lv_count TYPE i.

DO 10 TIMES.
  lv_count += 1.
  IF sy-index MOD 3 = 0.
    lv_total += sy-index.           " un watchpoint su lv_total si ferma qui
  ENDIF.
ENDDO.
```

> [!WARNING]
> I watchpoint funzionano solo mentre il debugger è attivo, e rallentano il programma, perché il debugger deve controllare la variabile dopo ogni istruzione. Toglili quando hai trovato quello che cercavi.

## Esercizio

> [!IMPORTANT]
>
> 1. In `zwatch_demo`, metti un breakpoint sulla riga `lv_count += 1.` con la condizione `sy-index = 6`, e controlla i valori di `lv_count` e `lv_total` quando si ferma.
> 2. Crea un watchpoint su `lv_total` e premi F8 più volte: in quali passi si ferma il debugger?
> 3. Imposta un breakpoint dinamico sull'istruzione `WRITE` in un tuo report qualsiasi ed eseguilo.

### Soluzione

1. Con la condizione `sy-index = 6`, il programma si ferma al passo 6, prima che la riga venga eseguita: `lv_count` vale 5 e `lv_total` vale 3 (finora solo il passo 3 ha aggiunto un valore).
2. Il watchpoint si ferma ai passi 3, 6 e 9, gli unici in cui `lv_total` cambia; il valore finale è 18.
3. Il debugger si ferma alla prima istruzione `WRITE`, ovunque si trovi nel programma.

> [!NOTE]
>
> - I breakpoint di sessione durano quanto la tua sessione SAP GUI; quelli esterni valgono per il tuo utente anche nelle richieste Fiori, HTTP e RFC.
> - `BREAK-POINT` nel codice ferma ogni utente: non trasportarlo mai. Usa i gruppi di checkpoint (`SAAB`) per i breakpoint da accendere e spegnere.
> - I breakpoint dinamici si fermano su un tipo di istruzione, un metodo, un modulo funzione, un'eccezione o un messaggio.
> - Le condizioni fanno fermare un breakpoint solo quando un'espressione è vera.
> - Un watchpoint ferma il programma quando una variabile cambia, ovunque succeda.
