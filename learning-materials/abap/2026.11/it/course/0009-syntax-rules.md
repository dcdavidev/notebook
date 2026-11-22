---
title: Le regole della sintassi ABAP
description: Istruzioni, punti, parole chiave, istruzioni concatenate e nomi.
---

_Livello principiante_

ABAP ha poche regole di sintassi, e la maggior parte l'hai già incontrata in [Il tuo primo programma](./0008-hello-world.md) senza accorgertene. Conoscerle bene ti fa risparmiare molto tempo con il controllo di sintassi: quasi tutti gli errori dei principianti sono un punto mancante, uno spazio mancante o una virgola al posto di un punto.

## Istruzioni e punti

Un programma ABAP è una sequenza di **istruzioni**. Ogni istruzione:

- inizia con una **parola chiave**, come `REPORT`, `DATA` o `WRITE`;
- continua con **operandi** e **aggiunte**, separati da almeno uno spazio;
- finisce con un **punto** (`.`).

```abap
REPORT zsyntax_demo.

DATA lv_count TYPE i VALUE 3.
WRITE lv_count.
```

La disposizione sulle righe non conta: un'istruzione può occupare più righe, e una riga può contenere più istruzioni. Queste due versioni sono lo stesso programma:

```abap
DATA lv_city TYPE string VALUE `Roma`. WRITE lv_city.

DATA lv_city2 TYPE string
  VALUE `Roma`.
WRITE
  lv_city2.
```

Tieni comunque un'istruzione per riga: è più facile da leggere e da debuggare. Una riga può essere lunga fino a 255 caratteri.

## Parole chiave e maiuscole

ABAP **non distingue tra maiuscole e minuscole**: `WRITE`, `write` e `Write` sono la stessa parola chiave, e `lv_count` e `LV_COUNT` sono la stessa variabile. L'unica eccezione è il testo dentro i **letterali**: `'Ciao'` e `'CIAO'` sono valori diversi.

La convenzione più diffusa è parole chiave in maiuscolo e nomi in minuscolo, come in questo corso. Il pretty printer può farlo al posto tuo, come vedrai in [Commenti e formattazione](./0010-comments-and-formatting.md).

## Gli spazi contano

Poiché ABAP divide le istruzioni in parole in corrispondenza degli spazi, molti simboli vogliono uno spazio da entrambi i lati:

```abap
DATA lv_result TYPE i.

lv_result = ( 2 + 3 ) * 4.     " corretto: spazi intorno a operatori e parentesi
lv_result = (2 + 3) * 4.       " errore di sintassi: manca lo spazio dopo "(" e prima di ")"
lv_result=2.                   " errore di sintassi: mancano gli spazi intorno a "="
```

La stessa regola vale per le parentesi delle chiamate di metodo: `out->write( 'Ciao' )` vuole gli spazi dentro le parentesi.

> [!WARNING]
> Il messaggio di errore per uno spazio mancante spesso confonde, per esempio "Il campo "(2" è sconosciuto". Quando il controllo di sintassi si lamenta di un nome strano che contiene una parentesi o un operatore, cerca prima uno spazio mancante.

## Le istruzioni concatenate

Quando più istruzioni iniziano con le stesse parole, puoi scrivere quelle parole una sola volta, seguite dai **due punti** (`:`), e separare il resto con delle **virgole**. È un'**istruzione concatenata** (_chained statement_):

```abap
DATA: lv_first  TYPE i,
      lv_second TYPE i,
      lv_name   TYPE string.

WRITE: 'Prima riga', 'stessa riga'.
```

Il sistema espande la catena in istruzioni separate: `DATA lv_first TYPE i.`, `DATA lv_second TYPE i.` e così via. Solo l'ultima parte finisce con il punto.

> [!TIP]
> Un'istruzione concatenata funziona come una lista della spesa che inizia con "Comprare:". Scrivi il verbo una volta in cima, poi elenchi le cose separate da virgole, e metti il punto solo dopo l'ultima.

Un errore classico è un punto in mezzo alla catena:

```abap
DATA: lv_first  TYPE i.
      lv_second TYPE i.   " errore di sintassi: questa riga non fa più parte di DATA
```

Il punto chiude la catena, quindi la seconda riga inizia una nuova istruzione con la "parola chiave" `lv_second`, che non esiste.

## I nomi

I nomi che scegli per variabili, tipi e altri oggetti di un programma seguono alcune regole:

- al massimo 30 caratteri;
- lettere da `A` a `Z`, cifre e il trattino basso `_`;
- non possono iniziare con una cifra;
- non dovrebbero coincidere con una parola chiave, anche dove la sintassi lo permette.

I nomi degli oggetti del repository (programmi, classi, tabelle) devono anche usare il namespace del cliente, `Z` o `Y`, come hai visto in [Pacchetti e richieste di trasporto](./0007-packages-and-transport-requests.md). La lunghezza massima dipende dal tipo: per esempio 40 caratteri per i programmi, 30 per le classi e 16 per le tabelle di database.

La maggior parte dei team usa anche dei **prefissi** che dicono che cos'è un nome. Questo corso usa questi:

| Prefisso          | Significato                           | Esempio       |
| ----------------- | ------------------------------------- | ------------- |
| `lv_`             | variabile locale                      | `lv_total`    |
| `ls_`             | struttura locale                      | `ls_flight`   |
| `lt_`             | tabella interna locale                | `lt_flights`  |
| `gv_` `gs_` `gt_` | variabile, struttura, tabella globale | `gv_counter`  |
| `ty_` / `tt_`     | tipo / tipo tabella                   | `ty_flight`   |
| `lc_`             | costante locale                       | `lc_max_rows` |

Gli altri (per parametri, oggetti e field symbol) li incontrerai nelle lezioni che li introducono.

## Esercizio

> [!IMPORTANT]
> Trova e correggi i quattro errori di sintassi in questo programma, poi attivalo ed eseguilo.
>
> ```abap
> REPORT zsyntax_errors.
>
> DATA: lv_a TYPE i VALUE 5.
>       lv_b TYPE i VALUE 7,
>       lv_sum TYPE i.
>
> lv_sum = (lv_a + lv_b) * 2
> WRITE lv_sum.
> ```

### Soluzione

```abap
REPORT zsyntax_errors.

DATA: lv_a   TYPE i VALUE 5,    " 1: virgola al posto del punto dentro la catena
      lv_b   TYPE i VALUE 7,
      lv_sum TYPE i.

lv_sum = ( lv_a + lv_b ) * 2.   " 2 e 3: spazi dentro le parentesi; 4: punto alla fine
WRITE lv_sum.                   " stampa 24
```

> [!NOTE]
>
> - Un'istruzione inizia con una parola chiave e finisce con un punto; gli a capo non contano.
> - ABAP non distingue maiuscole e minuscole, tranne che dentro i letterali.
> - Operatori, `=` e parentesi vogliono spazi da entrambi i lati.
> - Un'istruzione concatenata scrive una volta la parte comune, poi i due punti, le virgole tra le parti e un solo punto alla fine.
> - I nomi hanno al massimo 30 caratteri (lettere, cifre, `_`); gli oggetti del repository iniziano con `Z` o `Y`.
