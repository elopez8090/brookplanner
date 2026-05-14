-- Allow every signed-in account, including admins, to read its own profile.
-- Login and role redirects depend on this lookup before dashboard routing.

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

grant select on public.profiles to authenticated;
