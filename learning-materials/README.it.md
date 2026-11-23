# Contenuti dei corsi

Ogni corso di Notebook è una cartella di file Markdown. L'app legge questi file e li mostra, quindi puoi aggiungere o correggere una lezione senza toccare il codice: clona il repository, modifica un file `.md` e apri una pull request.

## Struttura delle cartelle

```text
learning-materials/
└── <topic>/                         # abap, sap, javascript, typescript, golang, ...
    └── <edition>/                   # 2026.11: anno e mese dell'edizione
        ├── en/                      # inglese
        │   ├── course/
        │   │   ├── README.md        # home page del corso
        │   │   ├── 0001-<slug>.md   # lezione 1
        │   │   └── 0002-<slug>.md
        │   └── glossary/            # facoltativo
        │       ├── README.md        # home page del glossario, con l'indice
        │       ├── abap.md          # una voce: un termine e quelli simili
        │       └── internal-table.md
        └── it/                      # italiano, con gli stessi nomi di file
            ├── course/
            └── glossary/
```

- Il nome della cartella dell'argomento compare nell'URL. Usa lettere minuscole, cifre e trattini.
- La cartella di un'edizione ha come nome l'anno e il mese, `YYYY.MM`, per esempio `2026.11`. Nell'URL si scrive `YYYY-MM`. Non creare mai una cartella `latest`: `latest` esiste solo nell'URL, come alias dell'edizione più recente. La sidebar e `/learn/<topic>` aprono `latest`.
- Ogni lingua ha la sua cartella. Le traduzioni di un file hanno **lo stesso nome di file**, così il selettore della lingua le trova. Se in una lingua manca un file, il sito mostra quello inglese.
- La sidebar elenca i corsi in ordine alfabetico per titolo.

URL:

| Pagina                  | URL                                                  |
| ----------------------- | ---------------------------------------------------- |
| Home page del corso     | `/<lang>/learn/<topic>/<edition>/course`             |
| Lezione                 | `/<lang>/learn/<topic>/<edition>/course/<NNNN-slug>` |
| Home page del glossario | `/<lang>/learn/<topic>/<edition>/glossary`           |
| Voce del glossario      | `/<lang>/learn/<topic>/<edition>/glossary/<term>`    |

`<edition>` è `latest` oppure un'edizione come `2026-11`. Per esempio, `learning-materials/abap/2026.11/it/course/0033-internal-tables-intro.md` si apre a `/it/learn/abap/2026-11/course/0033-internal-tables-intro` e, finché `2026.11` è l'edizione più recente, anche a `/it/learn/abap/latest/course/0033-internal-tables-intro`.

## Home page del corso (`course/README.md`)

Ogni lingua di un'edizione ha un `course/README.md`. È la home page del corso sul sito. Scrivi qui:

- a chi è rivolto il corso;
- come è organizzato il corso (livelli, struttura di una lezione);
- l'indice, con un link a ogni lezione;
- che cosa serve per seguirlo (sistemi, strumenti, dati di esempio);
- che cosa ha di specifico questa edizione.

Il README contiene anche i metadati del corso. Inizialo con un blocco di front matter per la descrizione e i tag, poi l'argomento come titolo `#`: il sito usa il titolo come nome del corso, nella sidebar e nella pagina.

```markdown
---
description: Un corso ABAP completo, al tuo ritmo.
tags:
  - SAP
  - ABAP
---

# ABAP
```

La sidebar usa il README dell'edizione più recente. I tag descrivono il corso e collegano i corsi simili: riusa i tag che hanno già gli altri corsi, quando vanno bene.

Collega le lezioni con un percorso relativo al file, così i link funzionano sia su GitHub sia sul sito:

```markdown
1. [Le tabelle interne](./0033-internal-tables-intro.md): elenchi di dati in memoria.
```

## Lezioni

Le sezioni che ogni lezione deve avere, in ordine, sono descritte in [Come scrivere una lezione](../docs/contributing/lesson-structure.it.md).

### Nome del file

`NNNN-slug.md`, nella cartella `course/` della sua lingua, dove:

- `NNNN` è il passo a quattro cifre: `0001`, `0002`, ... Stabilisce l'ordine delle lezioni.
- `slug` è un nome breve in inglese, in minuscolo con i trattini, per esempio `internal-tables`.

### Front matter

Ogni lezione inizia con un blocco di front matter YAML:

```markdown
---
title: Le tabelle interne
description: Conservare ed elaborare elenchi di dati in memoria.
level: basic
---
```

`level` è uno fra `beginner`, `basic`, `intermediate` e `pro`, in inglese in tutte le lingue. Vedi [Come scrivere una lezione](../docs/contributing/lesson-structure.it.md#1-front-matter).

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

## Glossario (facoltativo)

Un'edizione può avere un glossario accanto al corso, in `<edition>/<lang>/glossary/`.

- `README.md` inizia con la `description` nel front matter e un titolo `#`, come il README del corso. Scrivi una breve introduzione e l'indice delle voci in ordine alfabetico, con link relativi (`./internal-table.md`).
- Ogni voce è un file `<term>.md`, con il nome del termine principale in inglese, in minuscolo con i trattini. Il front matter contiene `title` (il termine principale) e `description` (i termini che spiega).
- Una voce spiega il termine principale e quelli simili, per esempio `sap.md` spiega SAP, SAP GUI, SAP HANA e SAP S/4HANA. Scrivi un titolo `##` per termine, con il termine in inglese in tutte le lingue, seguito dalla definizione e dal link alla lezione: `Lezione [33](../course/0033-internal-tables-intro.md).`

Il glossario si può scaricare come un unico file PDF o Markdown, oppure come ZIP con un file per voce, e gli archivi del corso lo includono.

## Prima di aprire una pull request

Esegui i controlli. Fanno anche il lint, la formattazione e il controllo ortografico dei file Markdown:

```bash
pnpm check
```

Se CSpell segnala una parola corretta, aggiungila in minuscolo alla lista giusta in `.config/cspell/`: `technical.txt` per sigle, nomi di prodotti e altri termini tecnici; `english.txt` per le parole inglesi; `italian.txt` per le parole italiane (controllate solo nei file in italiano).

Questa è la traduzione italiana di [README.md](README.md). In caso di differenze, vale la versione inglese.
