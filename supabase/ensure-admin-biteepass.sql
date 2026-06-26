-- Run this once in Supabase SQL Editor if admin actions say:
-- "Supabase restaurants update failed: no matching row was updated"

create or replace function public.is_bitepass_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()::text
      and u.role = 'admin'
  )
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'biteepass1@gmail.com';
$$;

insert into public.users (id, name, email, password, role, avatar)
select
  au.id::text,
  coalesce(au.raw_user_meta_data ->> 'name', 'BitePass Admin'),
  lower(au.email),
  '',
  'admin',
  'A'
from auth.users au
where lower(au.email) = 'biteepass1@gmail.com'
on conflict (id) do update
set
  name = excluded.name,
  email = excluded.email,
  role = 'admin',
  avatar = coalesce(public.users.avatar, excluded.avatar);

update public.users
set role = 'admin'
where lower(email) = 'biteepass1@gmail.com';
