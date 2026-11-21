-- Favorite courses of each account. A course is its topic folder, for
-- example `abap`, so a favorite covers every version of the course.
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  course text not null
    check (course ~ '^[a-z0-9]+([.-][a-z0-9]+)*$' and char_length(course) <= 64),
  created_at timestamptz not null default now(),
  primary key (user_id, course)
);

alter table public.favorites enable row level security;

-- Each visitor can read, add, and remove only their own favorites.
create policy "Favorites are readable by their owner"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Favorites are insertable by their owner"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Favorites are deletable by their owner"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);
