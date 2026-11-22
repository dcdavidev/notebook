-- Accounts that support Notebook, for the "Supporter" badge. Visitors can
-- only read their own row: rows are added by hand in the Supabase dashboard
-- (Table Editor or SQL editor) or, later, by the payment webhook with the
-- service role key, which bypasses Row Level Security.
create table public.supporters (
  user_id uuid primary key references auth.users (id) on delete cascade,
  since timestamptz not null default now(),
  -- Free text for now, for example "ko-fi" or "monthly".
  note text check (char_length(note) <= 200)
);

alter table public.supporters enable row level security;

create policy "Supporters can read their own row"
  on public.supporters for select
  to authenticated
  using ((select auth.uid()) = user_id);
