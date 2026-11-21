# 17. Use Supabase for Accounts

Date: 2026-11-20

## Status

Accepted

## Context

Visitors should be able to save favorites and their progress across devices. That needs accounts and a database. The courses stay as Markdown files in the repository, so anyone can still contribute with a pull request, and the pages must stay statically prerendered.

## Decision

We use **Supabase** for accounts and their data:

1. **Third-party sign-in only**: Google, GitHub, and Facebook. There is no email or password sign-in, so the site stores no passwords and sends no emails.
2. **Session in the browser**: the browser client from `@supabase/ssr` keeps the session in first-party cookies and refreshes it by itself. The only server code is the `/auth/callback` route handler, which swaps the sign-in code for a session. There is no proxy, and no page reads cookies on the server.
3. **Row Level Security**: every table has RLS on, and each visitor can read and change only their own rows. The public key is safe to ship to the browser.
4. **Migrations in the repository**: the database schema lives in `supabase/migrations`.
5. **One account page at `/account`**, without a language in the URL. The browser picks the saved language and loads the account data, so the page is static too. Visitors can edit their display name, link and unlink providers, download their data, and delete their account. Deletion runs through `delete_own_account()`, a database function that can only delete the caller, so the site needs no secret key.
6. **Preferences in the profile**: language, color mode, and palette are saved in `profiles` and applied on sign-in, so they follow the visitor on every device.
7. **Favorites per course**: the `favorites` table stores one row per account and course topic (for example `abap`), so a favorite covers every version of the course. The star button updates the page at once and undoes the change if saving fails.
8. **Bookmarks per lesson**: the `bookmarks` table stores one row per account and lesson, keyed by course topic, named version folder (never the `latest` alias), and lesson slug, so a bookmark keeps pointing at the lesson it was saved on. The bookmark button on the lesson page works like the star button.

## Consequences

### Positive

- The pages stay static and cached: account data loads in the browser after the page.
- No passwords to protect, and no email delivery to set up.
- Without the Supabase environment variables, for example in a fork, the account button is hidden and the site works as before.

### Negative or Trade-offs

- Account UI appears a moment after the page, once the browser has read the session.
- Each provider needs an app configured in its own developer console and in the Supabase dashboard.
- The privacy and cookie policies must cover the account data and the sign-in cookies.
