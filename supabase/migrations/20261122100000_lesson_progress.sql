-- Reading progress of each account: one row per lesson the visitor opened.
-- A lesson is its course topic, its named version folder (never the
-- `latest` alias), and its slug, as in `bookmarks`. `last_read_at` moves
-- every time the lesson opens; `completed_at` is set when the visitor marks
-- the lesson as completed, and cleared when they unmark it.
create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course text not null
    check (course ~ '^[a-z0-9]+([.-][a-z0-9]+)*$' and char_length(course) <= 64),
  version text not null
    check (version ~ '^v[0-9]+$' and char_length(version) <= 16),
  lesson text not null
    check (lesson ~ '^[0-9]{4}-[a-z0-9]+(-[a-z0-9]+)*$' and char_length(lesson) <= 128),
  last_read_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, course, version, lesson)
);

-- "Continue where you left off" reads the newest lesson of each course.
create index lesson_progress_last_read
  on public.lesson_progress (user_id, last_read_at desc);

alter table public.lesson_progress enable row level security;

-- Each visitor can read and change only their own progress.
create policy "Progress is readable by its owner"
  on public.lesson_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Progress is insertable by its owner"
  on public.lesson_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Progress is updatable by its owner"
  on public.lesson_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Progress is deletable by its owner"
  on public.lesson_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);
