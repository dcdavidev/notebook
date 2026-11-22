---
title: Gli errori a runtime e la ST22
description: Leggere un dump e trovare la causa di un crash.
---

_Livello principiante_

Il controllo di sintassi scopre molti errori prima che un programma giri, ma non tutti. Una divisione per zero, un testo che non è un numero, un ciclo che non finisce mai: questi errori compaiono solo mentre il programma gira. Quando ABAP ne incontra uno che non sa gestire, ferma il programma e scrive un rapporto di **errore a runtime**, chiamato **short dump** o semplicemente dump.

Ogni sviluppatore ABAP legge i dump. La transazione `ST22` li raccoglie, e con un po' di pratica un dump ti dice esattamente che cosa è andato storto e dove.

## Che cosa succede quando un programma va in dump

```abap
REPORT zdump_demo.

DATA lv_seats  TYPE i VALUE 220.
DATA lv_groups TYPE i VALUE 0.
DATA lv_result TYPE i.

lv_result = lv_seats / lv_groups.      " divisione per zero
WRITE / lv_result.
```

Quando esegui questo report:

1. Il programma si ferma alla divisione; il `WRITE` non viene mai eseguito.
2. Al posto della lista, l'utente vede una schermata intitolata **Errore a runtime** con il nome dell'errore, qui `COMPUTE_INT_ZERODIVIDE`.
3. Le modifiche al database della transazione corrente non ancora confermate vengono annullate.
4. Il sistema memorizza il dump completo, così puoi analizzarlo dopo.

> [!TIP]
> Un dump è la scatola nera di un aereo: quando qualcosa va storto, registra dov'era l'aereo, che cosa mostravano gli strumenti e le ultime azioni dell'equipaggio. La leggi dopo per capire la causa.

## Trovare il dump nella ST22

Apri la transazione `ST22` (**Errore runtime ABAP**). Vedi i dump di **oggi** e di **ieri**, oppure puoi cercare per data, utente, programma o nome dell'errore con la **selezione propria**. Fai doppio clic su un dump per aprirlo.

In ADT, la vista **Feed Reader** può abbonarsi agli errori a runtime del tuo utente, così i nuovi dump compaiono in Eclipse appena si verificano.

Il sistema cancella i dump vecchi dopo un certo tempo. Se te ne serve uno più a lungo, per esempio per mostrarlo a un collega, selezionalo e usa **Conserva/Rilascia**.

## Leggere un dump

Un dump è lungo, ma è diviso in sezioni. Leggi prima queste, in quest'ordine:

| Sezione                             | Che cosa ti dice                                                |
| ----------------------------------- | --------------------------------------------------------------- |
| **Short Text**                      | l'errore in una frase, per esempio "Division by 0 (type I)"     |
| **What happened?**                  | una descrizione semplice e il nome del programma                |
| **Error analysis**                  | i dettagli: quale eccezione, quali valori erano coinvolti       |
| **Information on where terminated** | il programma, l'include e il numero di riga                     |
| **Source Code Extract**             | il codice intorno alla riga che ha fallito, segnata con `>>>>>` |
| **Contents of system fields**       | `sy-subrc`, `sy-index`, `sy-tabix` e gli altri in quel momento  |
| **Chosen variables**                | i valori delle variabili dell'istruzione che ha fallito         |
| **Active Calls/Events**             | la catena di chiamate che ha portato all'errore                 |

I nomi delle sezioni dipendono dalla lingua di accesso; qui sono in inglese, come li vedi con un accesso in inglese. La sezione **How to correct the error** a volte contiene buoni consigli, a volte solo testo generico. Dall'estratto del codice sorgente puoi saltare all'editor con un doppio clic.

Nell'esempio, l'estratto del codice segna la riga `lv_result = lv_seats / lv_groups.`, e le variabili mostrano `LV_GROUPS = 0`. È tutta la storia: il divisore era zero.

## Gli errori a runtime più comuni

| Errore a runtime                           | Causa tipica                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `COMPUTE_INT_ZERODIVIDE`, `BCD_ZERODIVIDE` | divisione per zero con interi o numeri packed                             |
| `CONVT_NO_NUMBER`                          | un testo che non è un numero assegnato a una variabile numerica           |
| `CONVT_OVERFLOW`, `BCD_OVERFLOW`           | un valore troppo grande per il tipo di destinazione                       |
| `ITAB_LINE_NOT_FOUND`                      | un'espressione tabella che legge una riga che non esiste                  |
| `OBJECTS_OBJREF_NOT_ASSIGNED`              | un metodo chiamato su un riferimento a oggetto vuoto                      |
| `TIME_OUT`                                 | un programma di dialogo che gira troppo a lungo, spesso un ciclo infinito |
| `TSV_TNEW_PAGE_ALLOC_FAILED`               | il programma ha esaurito la memoria, spesso leggendo troppe righe         |
| `MESSAGE_TYPE_X`                           | il programma ha emesso di proposito un messaggio di tipo `X`              |

Hai incontrato gli errori di conversione in [Le conversioni di tipo](./0019-type-conversions.md), la divisione per zero in [Le operazioni aritmetiche](./0020-arithmetic-operations.md) e `TIME_OUT` in [I cicli DO e WHILE](./0026-do-and-while-loops.md).

## Dal dump alla correzione

1. Leggi lo short text e il nome dell'errore: ti dicono il **tipo** di problema.
2. Vai alla riga segnata nell'estratto del codice: è **dove** è successo.
3. Guarda le variabili e i campi di sistema: mostrano **quali valori** l'hanno causato.
4. Riproduci l'errore con un breakpoint subito prima di quella riga, come in [Il debugger: primi passi](./0028-debugger-basics.md), e controlla da dove arriva il valore sbagliato.
5. Correggi la causa, non il sintomo: controlla il divisore, valida l'input o gestisci l'eccezione.

Molti errori a runtime nascono da un'**eccezione** che il programma non ha intercettato. Nell'analisi dell'errore del dump trovi la sua classe, per esempio `CX_SY_ZERODIVIDE`. In [Le eccezioni basate su classi](./0089-class-based-exceptions.md) imparerai a intercettare queste eccezioni con `TRY ... CATCH`, così il programma reagisce invece di andare in dump.

> [!WARNING]
> Non ignorare i dump nei sistemi di test e di produzione, anche se "l'utente ha semplicemente ricominciato". Ogni dump vuol dire che un lavoro non è stato fatto, e lo stesso errore può ripetersi con i dati veri. Controlla regolarmente la `ST22` per i programmi di cui sei responsabile.

## Esercizio

> [!IMPORTANT]
>
> 1. Esegui `zdump_demo` di questa lezione e annota il nome dell'errore sulla schermata.
> 2. Apri il dump nella `ST22` e trova il numero di riga, il valore di `LV_GROUPS` e la classe dell'eccezione.
> 3. Correggi il programma in modo che stampi `Nessun gruppo` invece di andare in dump quando `lv_groups` vale 0.

### Soluzione

L'errore è `COMPUTE_INT_ZERODIVIDE`, la classe dell'eccezione è `CX_SY_ZERODIVIDE` e le variabili mostrano `LV_GROUPS = 0`.

```abap
REPORT zdump_demo.

DATA lv_seats  TYPE i VALUE 220.
DATA lv_groups TYPE i VALUE 0.
DATA lv_result TYPE i.

IF lv_groups = 0.
  WRITE / 'Nessun gruppo'.
ELSE.
  lv_result = lv_seats / lv_groups.
  WRITE / lv_result.
ENDIF.
```

> [!NOTE]
>
> - Un errore a runtime ferma il programma, annulla le modifiche al database non confermate e scrive uno short dump.
> - La transazione `ST22` elenca i dump; in ADT puoi seguirli nel **Feed Reader**.
> - Leggi prima lo short text, l'analisi dell'errore, l'estratto del codice e le variabili.
> - Impara gli errori comuni: `COMPUTE_INT_ZERODIVIDE`, `CONVT_NO_NUMBER`, `ITAB_LINE_NOT_FOUND`, `TIME_OUT` e gli altri.
> - Riproduci l'errore nel debugger e correggi la causa; molti dump sono eccezioni che puoi intercettare.
