# Come scrivere una lezione

Ogni lezione in `learning-materials/` segue la stessa struttura, così chi legge sa sempre dove trovare gli obiettivi, la spiegazione, l'esercizio e il riepilogo. Questa guida descrive la struttura. Per le cartelle, i nomi dei file, i blocchi di codice e la sintassi dei riquadri, leggi la [guida ai contenuti](../../learning-materials/README.it.md).

## Modello

````markdown
---
title: <Titolo della lezione>
description: <Una frase: che cosa impara chi legge.>
level: <beginner | basic | intermediate | pro>
---

<Introduzione: uno o due paragrafi che spiegano il problema e definiscono in grassetto i termini principali.>

In questa lezione impari a:

- <obiettivo 1>
- <obiettivo 2>
- <obiettivo 3>

## <Primo argomento>

<Spiegazione, esempi di codice, riquadri.>

## <Secondo argomento>

<...>

## Esercizio

> [!IMPORTANT]
>
> 1. <Primo compito.>
> 2. <Secondo compito.>

### Soluzione

```abap
<Codice completo e funzionante.>
```

> [!NOTE]
>
> - <Punto chiave 1.>
> - <Punto chiave 2.>
````

## Sezioni

### 1. Front matter

```yaml
---
title: Variabili e costanti
description: Dichiarare oggetti dati con DATA e CONSTANTS e usare i letterali.
level: beginner
---
```

- `title` è il titolo della lezione. La pagina lo mostra come intestazione, quindi **non ripeterlo come intestazione `#`** nel testo.
- `description` è una frase che dice che cosa impara chi legge. La pagina la mostra sotto il titolo e il sito la usa nell'elenco delle lezioni e nei risultati di ricerca. Non ripeterla nel testo.
- `level` è la difficoltà della lezione: `beginner` (principiante), `basic` (base), `intermediate` (intermedio) o `pro`. Scrivilo in inglese in tutte le lingue, con lo stesso valore in ogni traduzione: la pagina lo mostra tradotto, accanto al nome del corso. Qualsiasi altro valore blocca la build. Non scrivere il livello nel testo.
- Metti il titolo fra apici se contiene i due punti: `title: 'Modularizzazione: dividere il codice in blocchi'`.

### 2. Introduzione

Uno o due paragrafi brevi, senza intestazione:

- parti da un problema concreto che chi legge riconosce;
- definisci in **grassetto** i termini nuovi la prima volta che compaiono;
- collega le lezioni precedenti che servono.

### 3. Obiettivi

Un elenco di due-cinque obiettivi dopo l'introduzione, preceduto da "In questa lezione impari a:". Ogni obiettivo inizia con un verbo e descrive qualcosa che chi legge sa fare alla fine della lezione, per esempio "dichiarare una variabile con `DATA`", non "le variabili".

Il corpo deve trattare ogni obiettivo e, quando possibile, l'esercizio deve farlo mettere in pratica.

### 4. Corpo

- Una sezione `##` per argomento, nell'ordine in cui servono. Usa `###` per le sottosezioni. Non usare mai `#`.
- Spiega con paragrafi brevi e un esempio di codice per ogni idea. Gli esempi devono compilare e usare gli stessi dati di esempio del resto del corso.
- Usa i riquadri della [guida ai contenuti](../../learning-materials/README.it.md#riquadri): `[!TIP]` per un'analogia, `[!WARNING]` per un errore comune, `[!CAUTION]` per qualcosa che può rovinare i dati.
- Collega le lezioni che approfondiscono un argomento invece di spiegarlo due volte.

### 5. Esercizio

Una sezione `## Esercizio` con i compiti in un unico riquadro `[!IMPORTANT]`, come elenco numerato:

- da due a quattro compiti, dal più facile al più difficile;
- ogni compito mette in pratica uno o più obiettivi;
- ogni compito dice esattamente che cosa costruire, con nomi e valori, così chi legge può confrontare il suo risultato con la soluzione.

### 6. Soluzione

Una sottosezione `### Soluzione`, sotto l'esercizio:

- codice completo che risolve tutti i compiti e funziona così com'è;
- commenti solo dove un passo non è ovvio, o per mostrare il risultato atteso (`" 0`);
- se un compito ha più risposte valide, mostrane una e spiega le altre in una frase.

### 7. Riepilogo

Un riquadro `[!NOTE]` alla fine della lezione, dopo la soluzione: da tre a sei punti con le cose da ricordare. Non aggiungere informazioni nuove.

## Lista di controllo

Prima di aprire una pull request, controlla che la lezione:

- [ ] abbia `title`, `description` e `level` nel front matter, e nessuna intestazione `#`;
- [ ] abbia un'introduzione e l'elenco degli obiettivi;
- [ ] tratti ogni obiettivo nel corpo;
- [ ] abbia `## Esercizio` con un riquadro `[!IMPORTANT]` e `### Soluzione` con codice funzionante;
- [ ] finisca con il riepilogo `[!NOTE]`;
- [ ] esista con lo stesso nome di file in ogni cartella di lingua dell'edizione.

Questa è la traduzione italiana di [lesson-structure.md](lesson-structure.md). In caso di differenze, vale la versione inglese.
