-- Fixes "infinite recursion detected in policy for relation profiles" (Postgres 42P17).
-- The admin policies queried public.profiles from within a policy ON public.profiles,
-- which re-triggers the same policy forever. A SECURITY DEFINER function bypasses RLS
-- for that internal lookup, breaking the recursion.

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'moderator')
  );
$$;

drop policy if exists "admins manage all profiles" on public.profiles;
drop policy if exists "admins manage all photos" on public.photos;
drop policy if exists "admins manage all reports" on public.reports;

create policy "admins manage all profiles" on public.profiles
  for all using (public.is_staff());

create policy "admins manage all photos" on public.photos
  for all using (public.is_staff());

create policy "admins manage all reports" on public.reports
  for all using (public.is_staff());
