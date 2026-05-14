-- Login redirect fix: guarantee every authenticated user can read their own
-- profile row, and admins can read every profile row.
--
-- Symptom: a user with a valid public.profiles row was redirected to /register
-- after sign-in. Root cause: client-side `select id, role, status from profiles
-- where id = auth.uid()` returned no rows because no SELECT policy matched on
-- the live database (or only the older policy variants existed).
--
-- This migration is idempotent and safe to re-run.

-- 1) Make absolutely sure RLS is on.
alter table public.profiles enable row level security;

-- 2) Drop any prior variants of these policies so we end with one canonical
--    "self" policy and one canonical "admin" policy. Older names are kept
--    here so this migration cleans up whichever ones happen to exist.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_select_admin_all" on public.profiles;

-- 3) Authenticated user can always read their own row. This is the policy the
--    login flow depends on for role-based redirect.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- 4) Admins can read any profile row (admin tools, marketplace controls, etc.).
--    The inner sub-select against public.profiles is itself filtered by
--    `profiles_select_own`, so the admin's own row is visible to the
--    sub-select, which is sufficient for the EXISTS to return true.
create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = (select auth.uid())
        and admin_profile.role::text = 'admin'
    )
  );

-- 5) Defensive grant. Without SELECT granted to `authenticated`, RLS policies
--    don't matter — the role can never read the table at all.
grant select on public.profiles to authenticated;
