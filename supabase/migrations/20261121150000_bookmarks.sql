-- Bookmarked lessons of each account. A lesson is its course topic, its
-- named version folder (never the `latest` alias), and its slug, for
-- example `abap`, `v1`, `0001-welcome-to-sap-and-abap`.
create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  course text not null
    check (course ~ '^[a-z0-9]+([.-][a-z0-9]+)*$' and char_length(course) <= 64),
  version text not null
    check (version ~ '^v[0-9]+$' and char_length(version) <= 16),
  lesson text not null
    check (lesson ~ '^[0-9]{4}-[a-z0-9]+(-[a-z0-9]+)*$' and char_length(lesson) <= 128),
  created_at timestamptz not null default now(),
  primary key (user_id, course, version, lesson)
);

alter table public.bookmarks enable row level security;

-- Each visitor can read, add, and remove only their own bookmarks.
create policy "Bookmarks are readable by their owner"
  on public.bookmarks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Bookmarks are insertable by their owner"
  on public.bookmarks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Bookmarks are deletable by their owner"
  on public.bookmarks for delete
  to authenticated
  using ((select auth.uid()) = user_id);
