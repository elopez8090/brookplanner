-- Phase 19: admin marketplace flags + public visibility + featured selection support.

alter table public.profiles
  add column if not exists is_public boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists admin_notes text;

comment on column public.profiles.is_public is 'When false, vendor is hidden from public directory, vendor page, and marketplace stats counts.';
comment on column public.profiles.is_featured is 'Admin-curated spotlight; homepage/category spotlight lists featured rows first.';
comment on column public.profiles.admin_notes is 'Internal admin notes; never shown publicly.';

-- ---------------------------------------------------------------------------
-- Public RPCs: respect is_public; expose is_featured for client-side ranking.
-- ---------------------------------------------------------------------------

drop function if exists public.public_vendor_directory(text, text, text);

create function public.public_vendor_directory(
  p_query text default null,
  p_category text default null,
  p_area text default null
)
returns table (
  id uuid,
  business_name text,
  slug text,
  bio text,
  service_areas text,
  logo_url text,
  categories text[],
  website text,
  instagram text,
  facebook text,
  tiktok text,
  cover_image_url text,
  created_at timestamptz,
  is_featured boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.business_name,
    p.slug,
    p.bio,
    p.service_areas,
    p.logo_url,
    coalesce(array_agg(distinct c.name) filter (where c.name is not null), '{}') as categories,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.cover_image_url,
    p.created_at,
    p.is_featured
  from public.profiles p
  left join public.quotes q on q.vendor_id = p.id
  left join public.event_services es on es.id = q.event_service_id
  left join public.categories c on c.id = es.category_id
  where p.role = 'vendor'
    and coalesce(p.is_public, true) = true
    and p.is_profile_complete = true
    and p.slug is not null
    and nullif(trim(p.slug), '') is not null
    and p.business_name is not null
    and nullif(trim(p.business_name), '') is not null
    and (
      p_query is null
      or p.business_name ilike ('%' || p_query || '%')
    )
    and (
      p_area is null
      or coalesce(p.service_areas, '') ilike ('%' || p_area || '%')
    )
  group by
    p.id,
    p.business_name,
    p.slug,
    p.bio,
    p.service_areas,
    p.logo_url,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.cover_image_url,
    p.created_at,
    p.is_featured
  having (
    p_category is null
    or bool_or(lower(c.name) = lower(p_category))
  )
  order by lower(p.business_name) asc;
$$;

grant execute on function public.public_vendor_directory(text, text, text) to anon, authenticated;

drop function if exists public.public_vendor_page(text);

create or replace function public.public_vendor_page(p_slug text)
returns table (
  id uuid,
  full_name text,
  business_name text,
  slug text,
  bio text,
  business_phone text,
  website text,
  instagram text,
  facebook text,
  tiktok text,
  service_areas text,
  logo_url text,
  cover_image_url text,
  categories text[]
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.bio,
    p.business_phone,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.service_areas,
    p.logo_url,
    p.cover_image_url,
    coalesce(array_agg(distinct c.name) filter (where c.name is not null), '{}') as categories
  from public.profiles p
  left join public.quotes q on q.vendor_id = p.id
  left join public.event_services es on es.id = q.event_service_id
  left join public.categories c on c.id = es.category_id
  where p.role = 'vendor'
    and coalesce(p.is_public, true) = true
    and p.slug = p_slug
  group by
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.bio,
    p.business_phone,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.service_areas,
    p.logo_url,
    p.cover_image_url
  limit 1;
$$;

drop function if exists public.public_marketplace_stats();

create or replace function public.public_marketplace_stats()
returns table (
  vendor_count bigint,
  events_posted bigint,
  quotes_submitted bigint,
  boroughs_with_vendor_coverage bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (
      select count(*)::bigint
      from public.profiles p
      where p.role = 'vendor'
        and coalesce(p.is_public, true) = true
        and p.is_profile_complete = true
        and p.slug is not null
        and nullif(trim(p.slug), '') is not null
        and p.business_name is not null
        and nullif(trim(p.business_name), '') is not null
    ) as vendor_count,
    (
      select count(*)::bigint
      from public.events e
      where e.status in ('active', 'closed')
    ) as events_posted,
    (
      select count(*)::bigint
      from public.quotes q
    ) as quotes_submitted,
    (
      select count(*)::bigint
      from (values ('manhattan'), ('brooklyn'), ('queens'), ('bronx'), ('staten island')) as v(keyword)
      where exists (
        select 1
        from public.profiles p
        where p.role = 'vendor'
          and coalesce(p.is_public, true) = true
          and p.is_profile_complete = true
          and p.slug is not null
          and nullif(trim(p.slug), '') is not null
          and p.business_name is not null
          and nullif(trim(p.business_name), '') is not null
          and lower(coalesce(p.service_areas, '')) like '%' || v.keyword || '%'
      )
    ) as boroughs_with_vendor_coverage;
$$;

-- ---------------------------------------------------------------------------
-- Admin-only RPCs (SECURITY DEFINER; caller must be role = admin in profiles)
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_marketplace_vendors()
returns table (
  id uuid,
  full_name text,
  business_name text,
  slug text,
  is_profile_complete boolean,
  is_public boolean,
  is_featured boolean,
  admin_notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
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
    p.created_at
  from public.profiles p
  where p.role = 'vendor'
  order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_marketplace_vendors() to authenticated;

create or replace function public.admin_set_vendor_marketplace_flags(
  p_vendor_id uuid,
  p_is_public boolean,
  p_is_featured boolean,
  p_admin_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set
    is_public = p_is_public,
    is_featured = p_is_featured,
    admin_notes = nullif(trim(p_admin_notes), '')
  where id = p_vendor_id
    and role = 'vendor';

  if not found then
    raise exception 'vendor profile not found';
  end if;
end;
$$;

grant execute on function public.admin_set_vendor_marketplace_flags(uuid, boolean, boolean, text) to authenticated;

create or replace function public.admin_profiles_summary()
returns table (
  vendor_total bigint,
  vendor_public_listed bigint,
  vendor_incomplete bigint,
  vendor_hidden bigint,
  vendor_featured_flags bigint,
  customer_total bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*)::bigint from public.profiles v where v.role = 'vendor'),
    (
      select count(*)::bigint
      from public.profiles v
      where v.role = 'vendor'
        and coalesce(v.is_public, true) = true
        and v.is_profile_complete = true
        and v.slug is not null
        and nullif(trim(v.slug), '') is not null
        and v.business_name is not null
        and nullif(trim(v.business_name), '') is not null
    ),
    (select count(*)::bigint from public.profiles v where v.role = 'vendor' and v.is_profile_complete = false),
    (select count(*)::bigint from public.profiles v where v.role = 'vendor' and coalesce(v.is_public, true) = false),
    (select count(*)::bigint from public.profiles v where v.role = 'vendor' and v.is_featured = true),
    (select count(*)::bigint from public.profiles v where v.role = 'customer');
end;
$$;

grant execute on function public.admin_profiles_summary() to authenticated;

create or replace function public.admin_list_recent_events(p_limit integer default 50)
returns table (
  id uuid,
  title text,
  neighborhood text,
  status text,
  created_at timestamptz,
  customer_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    e.id,
    e.title,
    e.neighborhood,
    e.status,
    e.created_at,
    cust.full_name as customer_name
  from public.events e
  join public.profiles cust on cust.id = e.customer_id
  order by e.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

grant execute on function public.admin_list_recent_events(integer) to authenticated;

create or replace function public.admin_list_recent_quotes(p_limit integer default 80)
returns table (
  id uuid,
  quote_amount numeric,
  quote_status text,
  created_at timestamptz,
  vendor_business_name text,
  vendor_full_name text,
  event_title text,
  event_neighborhood text,
  event_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    q.id,
    q.quote_amount,
    q.status as quote_status,
    q.created_at,
    v.business_name as vendor_business_name,
    v.full_name as vendor_full_name,
    e.title as event_title,
    e.neighborhood as event_neighborhood,
    e.status as event_status
  from public.quotes q
  join public.event_services es on es.id = q.event_service_id
  join public.events e on e.id = es.event_id
  join public.profiles v on v.id = q.vendor_id
  order by q.created_at desc
  limit least(greatest(coalesce(p_limit, 80), 1), 200);
end;
$$;

grant execute on function public.admin_list_recent_quotes(integer) to authenticated;
