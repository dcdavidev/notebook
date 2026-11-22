---
title: I campi di sistema
description: sy-subrc, sy-datum, sy-uname e gli altri campi che il runtime riempie.
---

_Livello principiante_

Mentre il tuo programma gira, il runtime ABAP tiene aggiornate per te una serie di variabili: la data e l'ora correnti, il nome dell'utente, il mandante, il risultato dell'ultima istruzione, il passo corrente di un ciclo. Sono i **campi di sistema**, e ogni programma può leggerli senza dichiarare nulla.

Alcuni di loro, soprattutto `sy-subrc`, li userai in quasi tutti i programmi che scriverai.

## Da dove vengono i campi di sistema

Tutti i campi di sistema sono componenti di una struttura che si chiama `sy` (il nome completo è `syst`, definita nel Dizionario ABAP). Leggi un campo con il nome della struttura, un trattino e il nome del campo:

```abap
REPORT zsysfields_demo.

WRITE: / 'Utente:  ', sy-uname,
       / 'Data:    ', sy-datum,
       / 'Ora:     ', sy-uzeit,
       / 'Mandante:', sy-mandt,
       / 'Sistema: ', sy-sysid.
```

Ogni programma vede la stessa struttura `sy`, riempita con i valori della propria sessione.

> [!TIP]
> I campi di sistema sono il cruscotto di un'auto: velocità, carburante, l'ora, una spia che si accende quando qualcosa va storto. Non sei tu a costruire questi strumenti; li guardi mentre guidi.

## `sy-subrc`: ha funzionato?

Molte istruzioni ABAP impostano `sy-subrc` (**codice di ritorno**) per dirti come sono finite:

- `0` vuol dire successo;
- qualsiasi altro valore (di solito `4` o `8`) vuol dire "non trovato", "non possibile" o un errore. Il significato dipende dall'istruzione.

Il caso più tipico è la lettura dal database, che imparerai in [SELECT SINGLE e UP TO n ROWS](./0053-select-single-and-up-to.md):

```abap
DATA lv_carrname TYPE scarr-carrname.

SELECT SINGLE carrname FROM scarr
  WHERE carrid = 'LH'
  INTO @lv_carrname.

IF sy-subrc = 0.
  WRITE: / 'Compagnia:', lv_carrname.
ELSE.
  WRITE: / 'Compagnia non trovata'.
ENDIF.
```

> [!WARNING]
> Controlla `sy-subrc` **subito dopo** l'istruzione che lo imposta. La prossima istruzione che lo imposta sovrascrive il valore, e sono tante: è facile aggiungerne una in mezzo senza accorgersene. Se il valore ti serve più avanti, copialo prima in una tua variabile.

## I campi di sistema più usati

| Campo                  | Contenuto                                               |
| ---------------------- | ------------------------------------------------------- |
| `sy-subrc`             | codice di ritorno dell'ultima istruzione che lo imposta |
| `sy-datum`, `sy-uzeit` | data e ora dell'application server                      |
| `sy-datlo`, `sy-timlo` | data e ora nel fuso orario dell'utente                  |
| `sy-uname`             | il nome utente                                          |
| `sy-mandt`             | il mandante in cui hai fatto l'accesso                  |
| `sy-langu`             | la lingua di accesso                                    |
| `sy-sysid`             | l'ID del sistema, per esempio `DEV`                     |
| `sy-repid`             | il nome del programma corrente                          |
| `sy-tcode`             | il codice transazione corrente                          |
| `sy-index`             | il passo corrente di un ciclo `DO` o `WHILE`            |
| `sy-tabix`             | la riga corrente di una tabella interna                 |
| `sy-dbcnt`             | il numero di righe del database lette o modificate      |
| `sy-fdpos`             | l'offset trovato da alcuni confronti fra testi          |
| `sy-batch`             | `X` quando il programma gira in background              |

Incontrerai `sy-index` in [I cicli DO e WHILE](./0026-do-and-while-loops.md), `sy-tabix` in [Ciclare sulle tabelle interne](./0038-looping-internal-tables.md) e `sy-dbcnt` con le istruzioni sul database. Per vedere tutti i campi, apri la struttura `SYST` in `SE11` o in ADT.

`sy-datum` viene dal server, non dal PC dell'utente. Se i tuoi utenti lavorano in fusi orari diversi, usa `sy-datlo` e `sy-timlo` per quello che vedono a video.

## Regole per usare i campi di sistema

- **Leggili, non scriverli mai.** Il controllo di sintassi ti permette di assegnare un valore alla maggior parte dei campi di sistema, ma il runtime conta su di loro. Cambiare a mano `sy-subrc` o `sy-datum` nasconde solo i problemi.
- **Copia quello che ti serve.** Se usi un valore più volte, o dopo altre istruzioni, salvalo in una variabile: `DATA(lv_rc) = sy-subrc.`
- **Non passarli come parametri.** Una procedura può cambiare i campi di sistema mentre gira; passane una copia.

> [!WARNING]
> In ABAP Cloud molti campi di sistema non sono ammessi. Per esempio, al posto di `sy-datum` e `sy-uname` si usa la classe `cl_abap_context_info`, come vedrai in [ABAP Cloud e clean core](./0148-abap-cloud.md).

Puoi anche usare un campo di sistema come tipo: `DATA lv_date TYPE sy-datum.` dichiara una variabile con lo stesso tipo del campo.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi un report che stampi il nome utente, il mandante, l'ID del sistema, il nome del programma e data e ora del server nel formato utente.
> 2. Leggi da `SCARR` con `SELECT SINGLE` il nome della compagnia `XX`, salva `sy-subrc` in una variabile e stampa un messaggio che dipende dal suo valore.

### Soluzione

```abap
REPORT zsysfields_exercise.

DATA lv_carrname TYPE scarr-carrname.

WRITE: / |Utente:    { sy-uname }|,
       / |Mandante:  { sy-mandt }|,
       / |Sistema:   { sy-sysid }|,
       / |Programma: { sy-repid }|,
       / |Adesso:    { sy-datum DATE = USER } { sy-uzeit TIME = USER }|.

SELECT SINGLE carrname FROM scarr
  WHERE carrid = 'XX'
  INTO @lv_carrname.
DATA(lv_rc) = sy-subrc.

IF lv_rc = 0.
  WRITE: / 'Trovata:', lv_carrname.
ELSE.
  WRITE: / |Non trovata, sy-subrc = { lv_rc }|.   " di solito 4
ENDIF.
```

> [!NOTE]
>
> - I campi di sistema sono componenti della struttura `sy` (`syst`), riempiti dal runtime.
> - `sy-subrc` vale `0` dopo un'istruzione riuscita; controllalo subito dopo l'istruzione che lo imposta.
> - `sy-datum` e `sy-uzeit` sono data e ora del server; `sy-datlo` e `sy-timlo` seguono il fuso orario dell'utente.
> - `sy-index` conta i passi dei cicli, `sy-tabix` le righe delle tabelle e `sy-dbcnt` le righe del database.
> - Leggi i campi di sistema, non cambiarli mai, e copia il valore quando ti serve più avanti.
