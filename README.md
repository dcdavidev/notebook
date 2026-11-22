# Notebook

Digital notebook for free programming courses, downloadable study notes, and personal hobbies.

Website: [notebook.dcdavidev.me](https://notebook.dcdavidev.me)

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with React and TypeScript
- [Material UI](https://mui.com/material-ui/) with CSS theme variables and multiple color palettes from [Coolors](https://coolors.co/palettes/trending)
- [Tabler Icons](https://tabler.io/icons)
- [Supabase](https://supabase.com) for accounts (sign-in with Google, GitHub, and Facebook)
- [Fontsource](https://fontsource.org) fonts: Satisfy (site title), Inter (text), and PT Mono (quotes and code)
- [pnpm](https://pnpm.io) as package manager
- [Spellbookx](https://github.com/dcdavidev/spellbookx) toolchain: ESLint, Prettier, CSpell, Commitlint, and cz-git
- [Lefthook](https://github.com/evilmartians/lefthook) for Git hooks

## Getting started

Requirements: Node.js 26 (the version in `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Accounts (optional)

Sign-in uses [Supabase](https://supabase.com). Copy `.env.example` to `.env.local` and fill in the URL and publishable key of your Supabase project. Without them, the site works without accounts. The database schema is in `supabase/migrations`, and the decision is in [ADR-0017](docs/decisions/0017-use-supabase-for-accounts.md).

## Scripts

| Script            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `pnpm dev`        | Start the development server                       |
| `pnpm build`      | Build for production                               |
| `pnpm start`      | Start the production server                        |
| `pnpm lint`       | Lint and auto-fix with ESLint                      |
| `pnpm fmt`        | Format with Prettier                               |
| `pnpm spellcheck` | Check spelling with CSpell                         |
| `pnpm typecheck`  | Type-check with TypeScript                         |
| `pnpm check`      | Run lint, format check, spellcheck, and type-check |
| `pnpm commit`     | Write a Conventional Commit with the czg prompt    |

## Architecture decisions

The key technical decisions and their reasons are recorded in [docs/decisions](docs/decisions/README.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). To report a vulnerability, follow [SECURITY.md](SECURITY.md).

## License

[GNU Affero General Public License v3.0](LICENSE)
