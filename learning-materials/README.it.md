# Contenuti dei corsi

Ogni corso di Notebook è una cartella di file Markdown. L'app legge questi file e li mostra, quindi puoi aggiungere o correggere una lezione senza toccare il codice: clona il repository, modifica un file `.md` e apri una pull request.

## Struttura delle cartelle

```text
learning-materials/
└── <topic>/                       # abap, sap, javascript, typescript, golang, ...
    └── course/
        ├── v1/                    # prima versione del corso
        │   ├── README.en.md       # home page del corso, in inglese
        │   ├── README.it.md       # home page del corso, in italiano
        │   ├── 0001-<slug>.en.md  # lezione 1, inglese
        │   ├── 0001-<slug>.it.md  # lezione 1, italiano
        │   └── 0002-<slug>.en.md
        └── v2/                    # una nuova edizione del corso
            └── ...
```

- Il nome della cartella dell'argomento compare nell'URL. Usa lettere minuscole, cifre e trattini.
- Le cartelle delle versioni si chiamano sempre `v1`, `v2`, `v3`, ... Non creare mai una cartella `latest`: `latest` esiste solo nell'URL, come alias della versione più alta. La sidebar e `/learn/<topic>` aprono `latest`.
- Ogni lezione ha un file per lingua, con la lingua prima di `.md`. Le traduzioni hanno **lo stesso nome base**, così il selettore della lingua le trova.
- La sidebar elenca i corsi in ordine alfabetico per titolo.

URL:

| Pagina              | URL                                                  |
| ------------------- | ---------------------------------------------------- |
| Home page del corso | `/<lang>/learn/<topic>/course/<version>`             |
| Lezione             | `/<lang>/learn/<topic>/course/<version>/<NNNN-slug>` |

`<version>` è `latest` oppure il nome di una cartella come `v1`. Per esempio, `learning-materials/abap/course/v1/0005-internal-tables.en.md` si apre a `/en/learn/abap/course/v1/0005-internal-tables` e, finché `v1` è la versione più alta, anche a `/en/learn/abap/course/latest/0005-internal-tables`.

## Home page del corso (`README.<locale>.md`)

Ogni cartella di versione ha un `README.<locale>.md` per lingua: `README.en.md` e `README.it.md`. È la home page del corso sul sito; se manca una lingua, il sito mostra quella inglese. Scrivi qui:

- a chi è rivolto il corso;
- come è organizzato il corso (settimane, livelli, struttura di una lezione);
- l'indice, con un link a ogni lezione;
- che cosa serve per seguirlo (sistemi, strumenti, dati di esempio);
- che cosa ha di specifico questa versione.

Il README contiene anche i metadati del corso. Inizialo con un blocco di front matter per la descrizione e i tag, poi l'argomento come titolo `#`: il sito usa il titolo come nome del corso, nella sidebar e nella pagina.

```markdown
---
description: Corso intensivo di 15 giorni su SAP e ABAP.
tags:
  - SAP
  - ABAP
---

# ABAP
```

La sidebar usa il README della versione più alta. I tag descrivono il corso e collegano i corsi simili: riusa i tag che hanno già gli altri corsi, quando vanno bene.

Collega le lezioni con un percorso relativo al file, così i link funzionano sia su GitHub sia sul sito:

```markdown
1. [Le tabelle interne](./0005-internal-tables.it.md): elenchi di dati in memoria.
```

## Lezioni

### Nome del file

`NNNN-slug.<locale>.md`, dove:

- `NNNN` è il passo a quattro cifre: `0001`, `0002`, ... Stabilisce l'ordine delle lezioni.
- `slug` è un nome breve in inglese, in minuscolo con i trattini, per esempio `internal-tables`.
- `locale` è la lingua: `en` o `it`.

### Front matter

Ogni lezione inizia con un blocco di front matter YAML:

```markdown
---
title: Le tabelle interne
description: Conservare ed elaborare elenchi di dati in memoria.
---
```

Metti il titolo fra apici se contiene i due punti, per esempio `title: 'Modularizzazione: dividere il codice in blocchi'`.

Non ripetere il titolo come intestazione `#` nel testo: la pagina lo mostra già. Inizia le sezioni da `##`.

### Blocchi di codice

I blocchi di codice delimitati sono evidenziati con [Shiki](https://shiki.style). Indica sempre il linguaggio:

````markdown
```abap
WRITE 'Ciao, mondo!'.
```
````

Linguaggi supportati: `abap`, `sql`, `json`, `xml`, `javascript`, `typescript`, `shellscript`. Usa `text` per tutto il resto. Per aggiungere un linguaggio, modifica `langs` in `src/lib/markdown.ts`.

### Riquadri

Usa la sintassi degli avvisi di GitHub. Ogni tipo ha un titolo tradotto:

| Sintassi         | Titolo (en / it)     | Usalo per                             |
| ---------------- | -------------------- | ------------------------------------- |
| `> [!NOTE]`      | Summary / Riepilogo  | il riepilogo di fine lezione          |
| `> [!TIP]`       | Analogy / Analogia   | un'analogia della vita di ogni giorno |
| `> [!IMPORTANT]` | Exercise / Esercizio | l'elenco degli esercizi               |
| `> [!WARNING]`   | Warning / Attenzione | un errore comune o un rischio         |
| `> [!CAUTION]`   | Caution / Attenzione | qualcosa che può rovinare i dati      |

```markdown
> [!WARNING]
> Controlla sempre `sy-subrc` dopo una `SELECT SINGLE`.
```

Funzionano anche le tabelle, le liste di attività e le note a piè di pagina di GitHub Flavored Markdown.

## Prima di aprire una pull request

Esegui i controlli. Fanno anche il lint, la formattazione e il controllo ortografico dei file Markdown:

```bash
pnpm check
```

Se CSpell segnala una parola corretta, aggiungila in minuscolo alla lista giusta in `.config/cspell/`: `technical.txt` per sigle, nomi di prodotti e altri termini tecnici; `english.txt` per le parole inglesi; `italian.txt` per le parole italiane (controllate solo nei file in italiano).

Questa è la traduzione italiana di [README.md](README.md). In caso di differenze, vale la versione inglese.
