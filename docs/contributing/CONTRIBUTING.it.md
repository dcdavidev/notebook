# Contribuire a Notebook

Grazie per il tuo interesse a contribuire. Questa guida spiega come preparare il progetto e inviare le modifiche.

Partecipando a questo progetto accetti di seguire il [Codice di condotta](../../CODE_OF_CONDUCT.md).

## Come contribuire

- Segnala un bug con il [modulo di segnalazione bug](https://github.com/dcdavidev/notebook/issues/new?template=bug_report.yml).
- Proponi un'idea con il [modulo per le nuove funzioni](https://github.com/dcdavidev/notebook/issues/new?template=feature_request.yml).
- Correggi un refuso o un errore in un corso o in un appunto.
- Apri una pull request con una correzione o una nuova funzione.

Per segnalare una vulnerabilità di sicurezza, segui [SECURITY.md](../../SECURITY.md). Non aprire una issue pubblica.

## Scrivere i corsi

I corsi sono file Markdown nella cartella `learning-materials/`. Per aggiungere o correggere una lezione basta modificare un file `.md`. La [guida ai contenuti](../../learning-materials/README.it.md) spiega la struttura delle cartelle, il front matter, i nomi dei file e la sintassi dei riquadri.

## Preparare l'ambiente di sviluppo

Requisiti:

- Node.js 24 o successivo
- pnpm (la versione è indicata nel campo `packageManager` di `package.json`)

Passi:

1. Fai il fork del repository e clona il tuo fork.
2. Installa le dipendenze. Questo installa anche gli hook Git con Lefthook.

   ```bash
   pnpm install
   ```

3. Avvia il server di sviluppo.

   ```bash
   pnpm dev
   ```

Ti consigliamo VS Code con le estensioni in `.vscode/extensions.json`. VS Code te le propone quando apri il progetto.

## Fare le modifiche

1. Crea un branch da `main`, per esempio `feat/search` o `fix/broken-link`.
2. Fai le tue modifiche.
3. Esegui tutti i controlli prima del push:

   ```bash
   pnpm check
   pnpm build
   ```

## Messaggi di commit

Questo progetto usa i [Conventional Commits](https://www.conventionalcommits.org). Commitlint controlla ogni messaggio di commit nell'hook `commit-msg`.

Per scrivere un messaggio valido con un prompt interattivo, esegui:

```bash
pnpm commit
```

Esempi (i messaggi di commit si scrivono in inglese):

```text
feat: add search to the notes page
fix: correct the download link of the Git course
docs: update the setup steps
```

L'hook `pre-commit` esegue ESLint e Prettier sui file in stage.

## Pull request

1. Fai il push del tuo branch e apri una pull request verso `main`.
2. Compila il modello della pull request.
3. Limita ogni pull request a una sola modifica.
4. Assicurati che tutti i controlli passino.

Il maintainer revisiona le pull request il prima possibile.

## Licenza

Contribuendo accetti che i tuoi contributi siano distribuiti con la [GNU Affero General Public License v3.0](../../LICENSE).

Questa è la traduzione italiana di [CONTRIBUTING.md](../../CONTRIBUTING.md). In caso di differenze, vale la versione inglese.
