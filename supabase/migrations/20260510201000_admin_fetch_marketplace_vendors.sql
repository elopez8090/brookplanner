-- Admin vendor directory: allow admins to read all profile rows (for admin RPCs + consistency with events policies).
-- New RPC admin_fetch_marketplace_vendors is used by fetchAdminMarketplaceVendors.

drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles adm
      where adm.id = (select auth.uid())
        and adm.role::text = 'admin'
    )
  );

create or replace function public.admin_fetch_marketplace_vendors()
returns table (
  id uuid,
  full_name text,
  business_name text,
  slug text,
  is_profile_complete boolean,
  is_public boolean,
  is_featured boolean,
  admin_notes text,
  created_at timestamptz,
  credits_balance integer,
  status text,
  suspended_at timestamptz,
  suspended_reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_role text;
begin
  select p.role::text
  into v_admin_role
  from public.profiles p
  where p.id = (select auth.uid());

  if v_admin_role is distinct from 'admin' then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.is_profile_complete,
    p.is_public,
    p.is_featured,
    p.admin_notes,
    p.created_at,
    coalesce(p.credits_balance, 0)::integer,
    coalesce(p.status, 'active')::text,
    p.suspended_at,
    p.suspended_reason
  from public.profiles p
  where p.role::text = 'vendor'
  order by p.created_at desc;
end;
$$;

grant execute on function public.admin_fetch_marketplace_vendors() to authenticated;
