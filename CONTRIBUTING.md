# Contributing to Notebook

Thank you for your interest in contributing. This guide explains how to set up the project and submit changes.

By taking part in this project, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- Report a bug with the [bug report form](https://github.com/dcdavidev/notebook/issues/new?template=bug_report.yml).
- Suggest an idea with the [feature request form](https://github.com/dcdavidev/notebook/issues/new?template=feature_request.yml).
- Fix a typo or an error in a course or study note.
- Open a pull request with a fix or a new feature.

To report a security vulnerability, follow [SECURITY.md](SECURITY.md). Do not open a public issue.

## Writing courses

Courses are Markdown files in the `content/` folder. To add or fix a lesson, you only need to edit a `.md` file. The [content guide](content/README.md) explains the folder structure, the front matter, the file names, and the callout syntax.

## Development setup

Requirements:

- Node.js 24 or later
- pnpm (the version is set in the `packageManager` field of `package.json`)

Steps:

1. Fork the repository and clone your fork.
2. Install the dependencies. This also installs the Git hooks with Lefthook.

   ```bash
   pnpm install
   ```

3. Start the development server.

   ```bash
   pnpm dev
   ```

We recommend VS Code with the extensions in `.vscode/extensions.json`. VS Code suggests them when you open the project.

## Making changes

1. Create a branch from `main`, for example `feat/search` or `fix/broken-link`.
2. Make your changes.
3. Run all the checks before you push:

   ```bash
   pnpm check
   pnpm build
   ```

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org). Commitlint checks each commit message in the `commit-msg` hook.

To write a valid message with an interactive prompt, run:

```bash
pnpm commit
```

Examples:

```text
feat: add search to the notes page
fix: correct the download link of the Git course
docs: update the setup steps
```

The `pre-commit` hook runs ESLint and Prettier on the staged files.

## Pull requests

1. Push your branch and open a pull request against `main`.
2. Fill in the pull request template.
3. Keep each pull request focused on one change.
4. Make sure all the checks pass.

The maintainer reviews pull requests as soon as possible.

## License

By contributing, you agree that your contributions are licensed under the [GNU Affero General Public License v3.0](LICENSE).
