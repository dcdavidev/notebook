-- Courses moved from version folders (`v1`, `v2`) to editions named after
-- their year and month: the folder `2026.11` is `2026-11` in the URL, and
-- bookmarks and reading progress store that name. The ABAP course `v2`
-- became the edition `2026-11`; `v1` was removed, so its rows go.

alter table public.bookmarks drop constraint bookmarks_version_check;
alter table public.lesson_progress drop constraint lesson_progress_version_check;

delete from public.bookmarks where course = 'abap' and version = 'v1';
delete from public.lesson_progress where course = 'abap' and version = 'v1';

update public.bookmarks set version = '2026-11'
  where course = 'abap' and version = 'v2';
update public.lesson_progress set version = '2026-11'
  where course = 'abap' and version = 'v2';

-- Rows of any other course still on a `vN` folder have no edition to
-- point to.
delete from public.bookmarks where version !~ '^[0-9]{4}-(0[1-9]|1[0-2])$';
delete from public.lesson_progress where version !~ '^[0-9]{4}-(0[1-9]|1[0-2])$';

alter table public.bookmarks add constraint bookmarks_version_check
  check (version ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
alter table public.lesson_progress add constraint lesson_progress_version_check
  check (version ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

comment on column public.bookmarks.version is
  'Named course edition, such as 2026-11 (never the latest alias).';
comment on column public.lesson_progress.version is
  'Named course edition, such as 2026-11 (never the latest alias).';
