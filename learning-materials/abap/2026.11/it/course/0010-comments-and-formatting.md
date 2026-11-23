---
title: Commenti e formattazione
description: Commenti di riga e di fine riga, il pretty printer e il codice leggibile.
level: beginner
---

Il codice si legge molto più spesso di quanto si scriva: lo leggono i tuoi colleghi, la persona che correggerà un bug fra cinque anni e tu stesso, quando avrai dimenticato perché l'hai scritto così. I **commenti** spiegano quello che il codice non può dire da solo, e una **formattazione** coerente rende visibile la struttura a colpo d'occhio.

ABAP ti offre due tipi di commento e uno strumento, il pretty printer, che formatta il codice al posto tuo.

## Due tipi di commento

| Sintassi | Dove                          | Che cosa commenta                              |
| -------- | ----------------------------- | ---------------------------------------------- |
| `*`      | nella prima colonna           | l'intera riga                                  |
| `"`      | in qualsiasi punto della riga | tutto ciò che segue, fino alla fine della riga |

```abap
REPORT zcomments_demo.

* Stampa un saluto per l'utente.
* Questo è un commento di riga intera: l'asterisco è nella colonna 1.
WRITE 'Ciao!'.       " commento di fine riga dopo un'istruzione

"WRITE 'Arrivederci!'.   istruzione commentata: non viene eseguita
```

Le virgolette dentro un letterale non sono un commento: in `WRITE 'Dite "cheese"'.` viene stampato tutto il testo.

> [!WARNING]
> L'asterisco funziona solo nella primissima colonna. Se lo indenti, `*` non è più un commento e il controllo di sintassi segnala un errore. Usa `"` per i commenti che vuoi indentare insieme al codice.

ABAP non ha commenti a blocchi come `/* ... */` di altri linguaggi. Per commentare più righe, selezionale e usa la scorciatoia dell'editor:

| Editor           | Commenta | Togli il commento |
| ---------------- | -------- | ----------------- |
| ADT              | `Ctrl+<` | `Ctrl+Shift+<`    |
| SAP GUI (`SE38`) | `Ctrl+<` | `Ctrl+>`          |

Entrambe mettono un `*` davanti a ogni riga selezionata, o lo tolgono.

## Commenti che aiutano

Un buon commento dice **perché**, non **che cosa**. Che cosa fa, lo dice già il codice:

```abap
DATA lv_days TYPE i VALUE 30.

* Sbagliato: ripete il codice
lv_days = lv_days + 1.   " aggiunge 1 a lv_days

* Giusto: spiega il motivo
lv_days = lv_days + 1.   " il contratto conta sia il primo sia l'ultimo giorno
```

Alcune abitudini mantengono utili i commenti:

- Scrivi un breve commento di intestazione all'inizio di un programma: che cosa fa e chi lo usa.
- Preferisci un nome chiaro a un commento: `lv_max_passengers` non ha bisogno di spiegazioni, `lv_x` sì.
- Non tenere vecchio codice commentato "per sicurezza". Il sistema conserva ogni versione attivata: in `SE38` apri **Utilità > Versioni > Gestione versioni**, in ADT usa **Compare With > Revision History**.
- Aggiorna o cancella un commento quando cambi il codice che descrive. Un commento sbagliato è peggio di nessun commento.

Più avanti incontrerai anche due forme speciali di commento: i commenti **ABAP Doc**, che iniziano con `"!` e documentano classi e metodi, e gli **pseudo-commenti** come `"#EC ...`, che disattivano un controllo specifico. I controlli arrivano in [Qualità del codice: ATC e Clean ABAP](./0107-code-quality.md).

## Il pretty printer

Il **pretty printer** riformatta il codice sorgente: indenta i blocchi in modo coerente e converte maiuscole e minuscole di parole chiave e nomi. Premi `Shift+F1` in uno qualsiasi dei due editor.

```abap
* Prima
report zcomments_demo.
data lv_count type i value 3.
if lv_count > 2.
write 'Più di due'.
endif.

* Dopo il pretty printer (parole chiave in maiuscolo, blocchi indentati)
REPORT zcomments_demo.
DATA lv_count TYPE i VALUE 3.
IF lv_count > 2.
  WRITE 'Più di due'.
ENDIF.
```

L'istruzione `IF` dell'esempio è spiegata in [IF e le espressioni logiche](./0024-if-and-logical-expressions.md); qui serve solo a mostrare come il pretty printer indenta un blocco.

Le impostazioni le scegli una volta sola:

- **SAP GUI**: **Utilità > Impostazioni > ABAP Editor > Pretty Printer**: spunta **Indentare** e scegli **Parole chiave in maiuscolo**.
- **ADT**: clic destro sul progetto ABAP, **Properties > ABAP Development > Editors > Source Code Editors > Formatter**. Le impostazioni appartengono al progetto, così tutto il team può condividerle.

> [!TIP]
> Il pretty printer è come un correttore ortografico che sistema l'impaginazione invece dell'ortografia. Tu continui a scrivere in fretta; un tasto rende la pagina ordinata prima che qualcun altro la legga.

## Un layout leggibile

Oltre a quello che fa il pretty printer, alcune scelte di impaginazione rendono il codice più facile da leggere:

- Un'istruzione per riga.
- Righe vuote tra i blocchi logici, come i paragrafi di un testo.
- Dichiarazioni allineate nelle istruzioni concatenate, così nomi e tipi formano delle colonne.
- Righe corte: se un'istruzione diventa lunga, vai a capo dopo una parola chiave o un operando e indenta il resto.

## Esercizio

> [!IMPORTANT]
>
> 1. Scrivi questo programma esattamente com'è, tutto in minuscolo, poi esegui il pretty printer con le parole chiave in maiuscolo.
> 2. Aggiungi un commento di intestazione con `*` e un commento di fine riga con `"`.
> 3. Commenta il secondo `write` con la scorciatoia dell'editor ed esegui il programma.
>
> ```abap
> report zformat_test.
> write 'Primo'.
> write 'Secondo'.
> ```

### Soluzione

```abap
* Esercizio: commenti e formattazione
* Stampa una riga di testo.
REPORT zformat_test.
WRITE 'Primo'.       " questo viene stampato
*WRITE 'Secondo'.
```

Viene stampato solo `Primo`. La scorciatoia ha messo l'`*` nella colonna 1, quindi la seconda istruzione è un commento.

> [!NOTE]
>
> - `*` nella prima colonna commenta l'intera riga; `"` commenta il resto di una riga.
> - Non esistono commenti a blocchi: seleziona le righe e usa la scorciatoia dell'editor.
> - Commenta il perché, non il che cosa; preferisci nomi chiari ai commenti.
> - `Shift+F1` esegue il pretty printer: indentazione e maiuscole delle parole chiave coerenti.
> - Non tenere codice morto commentato: la cronologia delle versioni conserva le versioni precedenti.
