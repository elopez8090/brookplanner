-- Phase 23: vendor profile completion checklist support.
-- Adds profile business_email and expands admin vendor RPC payload so admin UI can compute completion %.

alter table public.profiles
  add column if not exists business_email text;

drop function if exists public.admin_fetch_marketplace_vendors();

create or replace function public.admin_fetch_marketplace_vendors()
returns table (
  id uuid,
  full_name text,
  business_name text,
  slug text,
  bio text,
  business_phone text,
  business_email text,
  service_areas text,
  logo_url text,
  cover_image_url text,
  website text,
  instagram text,
  facebook text,
  tiktok text,
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
    p.bio,
    p.business_phone,
    p.business_email,
    p.service_areas,
    p.logo_url,
    p.cover_image_url,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
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
