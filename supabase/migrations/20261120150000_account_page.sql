-- Preferences that follow the visitor on every device, and the functions
-- behind the account page.

alter table public.profiles
  add column locale text check (locale in ('it', 'en')),
  add column color_mode text check (color_mode in ('light', 'dark', 'system')),
  add column palette text check (char_length(palette) <= 64),
  add constraint profiles_display_name_length
    check (char_length(display_name) between 1 and 80);

-- Accounts created before the profiles table get their row now.
insert into public.profiles (id, display_name, avatar_url)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'name',
    raw_user_meta_data ->> 'user_name'
  ),
  coalesce(
    raw_user_meta_data ->> 'avatar_url',
    raw_user_meta_data ->> 'picture'
  )
from auth.users
on conflict (id) do nothing;

-- Lets a visitor create their own row if it is missing.
create policy "Profiles are insertable by their owner"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Keeps `updated_at` current.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Deletes the account of the visitor who calls it, with every row that
-- references it (`on delete cascade`). It runs as the owner of the
-- function because visitors cannot delete from `auth.users` themselves,
-- and it can only ever delete the caller.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = caller;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
