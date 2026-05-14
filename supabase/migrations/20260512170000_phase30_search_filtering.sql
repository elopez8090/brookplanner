-- Phase 30: search, filtering, and sorting (URL-driven, server-side RPCs).

-- ---------------------------------------------------------------------------
-- Public vendor directory: keyword (name + bio), sort modes, safe aggregates
-- ---------------------------------------------------------------------------

drop function if exists public.public_vendor_directory(text, text, text);

create or replace function public.public_vendor_directory(
  p_query text default null,
  p_category text default null,
  p_area text default null,
  p_sort text default 'name'
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
  with base as (
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
      p.is_featured,
      count(distinct q.id) as quote_cnt,
      coalesce(avg(r.rating), 0)::numeric as avg_rating,
      count(distinct r.id)::integer as review_cnt
    from public.profiles p
    left join public.quotes q on q.vendor_id = p.id
    left join public.event_services es on es.id = q.event_service_id
    left join public.categories c on c.id = es.category_id
    left join public.reviews r on r.vendor_id = p.id and r.is_public = true
    where p.role = 'vendor'
      and coalesce(p.status, 'active') = 'active'
      and coalesce(p.is_public, true) = true
      and p.is_profile_complete = true
      and p.slug is not null
      and nullif(trim(p.slug), '') is not null
      and p.business_name is not null
      and nullif(trim(p.business_name), '') is not null
      and (
        nullif(trim(p_query), '') is null
        or p.business_name ilike ('%' || trim(p_query) || '%')
        or coalesce(p.bio, '') ilike ('%' || trim(p_query) || '%')
      )
      and (
        nullif(trim(p_area), '') is null
        or coalesce(p.service_areas, '') ilike ('%' || trim(p_area) || '%')
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
      nullif(trim(p_category), '') is null
      or bool_or(lower(c.name) = lower(trim(p_category)))
    )
  )
  select
    b.id,
    b.business_name,
    b.slug,
    b.bio,
    b.service_areas,
    b.logo_url,
    b.categories,
    b.website,
    b.instagram,
    b.facebook,
    b.tiktok,
    b.cover_image_url,
    b.created_at,
    b.is_featured
  from base b
  order by
    case lower(coalesce(nullif(trim(p_sort), ''), 'name'))
      when 'newest' then extract(epoch from b.created_at)
    end desc nulls last,
    case lower(coalesce(nullif(trim(p_sort), ''), 'name'))
      when 'oldest' then extract(epoch from b.created_at)
    end asc nulls last,
    case when lower(coalesce(nullif(trim(p_sort), ''), 'name')) = 'active' then b.quote_cnt end desc nulls last,
    case when lower(coalesce(nullif(trim(p_sort), ''), 'name')) = 'rated' then (b.review_cnt > 0)::int end desc nulls last,
    case when lower(coalesce(nullif(trim(p_sort), ''), 'name')) = 'rated' then b.avg_rating end desc nulls last,
    lower(b.business_name) asc;
$$;

grant execute on function public.public_vendor_directory(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin marketplace vendors: filters + sort (single RPC; avoids RLS recursion)
-- ---------------------------------------------------------------------------

drop function if exists public.admin_fetch_marketplace_vendors();

create or replace function public.admin_fetch_marketplace_vendors(
  p_query text default null,
  p_status text default null,
  p_visibility text default null,
  p_profile text default null,
  p_category text default null,
  p_area text default null,
  p_sort text default 'newest'
)
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
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'newest'));
  v_vis text := lower(coalesce(nullif(trim(p_visibility), ''), ''));
  v_prof text := lower(coalesce(nullif(trim(p_profile), ''), ''));
  v_status_f text := lower(coalesce(nullif(trim(p_status), ''), ''));
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
  left join lateral (
    select count(*)::integer as qc
    from public.quotes q
    where q.vendor_id = p.id
  ) qcounts on true
  left join lateral (
    select
      coalesce(avg(r.rating), 0)::numeric as ar,
      count(*)::integer as rc
    from public.reviews r
    where r.vendor_id = p.id
  ) rev on true
  where p.role::text = 'vendor'
    and (
      nullif(trim(p_query), '') is null
      or p.full_name ilike ('%' || trim(p_query) || '%')
      or coalesce(p.business_name, '') ilike ('%' || trim(p_query) || '%')
      or coalesce(p.slug, '') ilike ('%' || trim(p_query) || '%')
      or coalesce(p.service_areas, '') ilike ('%' || trim(p_query) || '%')
    )
    and (
      v_status_f = ''
      or v_status_f = 'all'
      or coalesce(p.status, 'active')::text = v_status_f
    )
    and (
      v_vis = ''
      or v_vis = 'all'
      or (v_vis = 'public' and coalesce(p.is_public, true) = true)
      or (v_vis = 'hidden' and coalesce(p.is_public, true) = false)
    )
    and (
      v_prof = ''
      or v_prof = 'all'
      or (v_prof = 'complete' and p.is_profile_complete = true)
      or (v_prof = 'incomplete' and p.is_profile_complete = false)
    )
    and (
      nullif(trim(p_category), '') is null
      or exists (
        select 1
        from public.quotes qx
        inner join public.event_services esx on esx.id = qx.event_service_id
        inner join public.categories cx on cx.id = esx.category_id
        where qx.vendor_id = p.id
          and lower(cx.name) = lower(trim(p_category))
      )
    )
    and (
      nullif(trim(p_area), '') is null
      or coalesce(p.service_areas, '') ilike ('%' || trim(p_area) || '%')
    )
  order by
    case when v_sort = 'oldest' then extract(epoch from p.created_at) end asc nulls last,
    case when v_sort = 'newest' then extract(epoch from p.created_at) end desc nulls last,
    case when v_sort = 'active' then qcounts.qc end desc nulls last,
    case when v_sort = 'credits' then coalesce(p.credits_balance, 0) end desc nulls last,
    case when v_sort = 'rated' then (rev.rc > 0)::int end desc nulls last,
    case when v_sort = 'rated' then rev.ar end desc nulls last,
    case when v_sort = 'name' then lower(coalesce(p.business_name, p.full_name, '')) end asc nulls last,
    case when v_sort not in ('oldest', 'newest', 'active', 'credits', 'rated', 'name') then extract(epoch from p.created_at) end desc nulls last,
    lower(coalesce(p.business_name, p.full_name, '')) asc;
end;
$$;

grant execute on function public.admin_fetch_marketplace_vendors(text, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin customers
-- ---------------------------------------------------------------------------

drop function if exists public.admin_list_customers(integer);

create or replace function public.admin_list_customers(
  p_limit integer default 200,
  p_query text default null,
  p_status text default null,
  p_sort text default 'newest'
)
returns table (
  id uuid,
  full_name text,
  status text,
  suspended_at timestamptz,
  suspended_reason text,
  admin_notes text,
  created_at timestamptz,
  events_posted_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'newest'));
  v_status_f text := lower(coalesce(nullif(trim(p_status), ''), ''));
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
    coalesce(p.status, 'active')::text,
    p.suspended_at,
    p.suspended_reason,
    p.admin_notes,
    p.created_at,
    (
      select count(*)::bigint
      from public.events e
      where e.customer_id = p.id
    ) as events_posted_count
  from public.profiles p
  where p.role = 'customer'
    and (
      nullif(trim(p_query), '') is null
      or p.full_name ilike ('%' || trim(p_query) || '%')
    )
    and (
      v_status_f = ''
      or v_status_f = 'all'
      or coalesce(p.status, 'active')::text = v_status_f
    )
  order by
    case when v_sort = 'oldest' then extract(epoch from p.created_at) end asc nulls last,
    case when v_sort = 'newest' then extract(epoch from p.created_at) end desc nulls last,
    case when v_sort = 'active' then (
      select count(*)::numeric from public.events e where e.customer_id = p.id
    ) end desc nulls last,
    case when v_sort = 'name' then lower(p.full_name) end asc nulls last,
    case when v_sort not in ('oldest', 'newest', 'active', 'name') then extract(epoch from p.created_at) end desc nulls last,
    lower(p.full_name) asc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
end;
$$;

grant execute on function public.admin_list_customers(integer, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin events list
-- ---------------------------------------------------------------------------

drop function if exists public.admin_list_recent_events(integer);

create or replace function public.admin_list_recent_events(
  p_limit integer default 50,
  p_query text default null,
  p_status text default null,
  p_neighborhood text default null,
  p_category text default null,
  p_sort text default 'newest'
)
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
declare
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'newest'));
  v_status_f text := lower(coalesce(nullif(trim(p_status), ''), ''));
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
  left join lateral (
    select count(*)::integer as qc
    from public.quotes q
    inner join public.event_services es on es.id = q.event_service_id
    where es.event_id = e.id
  ) qcounts on true
  where (
      nullif(trim(p_query), '') is null
      or e.title ilike ('%' || trim(p_query) || '%')
      or e.event_type ilike ('%' || trim(p_query) || '%')
      or cust.full_name ilike ('%' || trim(p_query) || '%')
    )
    and (
      v_status_f = ''
      or v_status_f = 'all'
      or e.status::text = v_status_f
    )
    and (
      nullif(trim(p_neighborhood), '') is null
      or e.neighborhood ilike ('%' || trim(p_neighborhood) || '%')
    )
    and (
      nullif(trim(p_category), '') is null
      or exists (
        select 1
        from public.event_services esx
        inner join public.categories cx on cx.id = esx.category_id
        where esx.event_id = e.id
          and lower(cx.name) = lower(trim(p_category))
      )
    )
  order by
    case when v_sort = 'oldest' then extract(epoch from e.created_at) end asc nulls last,
    case when v_sort = 'newest' then extract(epoch from e.created_at) end desc nulls last,
    case when v_sort = 'quotes' then qcounts.qc end desc nulls last,
    case when v_sort = 'event_date' then e.event_date end asc nulls last,
    case when v_sort not in ('oldest', 'newest', 'quotes', 'event_date') then extract(epoch from e.created_at) end desc nulls last,
    e.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

grant execute on function public.admin_list_recent_events(integer, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Vendor lead board (active events)
-- ---------------------------------------------------------------------------

drop function if exists public.vendor_list_active_events();

create or replace function public.vendor_list_active_events(
  p_query text default null,
  p_neighborhood text default null,
  p_category text default null,
  p_sort text default 'event_date'
)
returns table (
  id uuid,
  customer_id uuid,
  title text,
  event_type text,
  neighborhood text,
  event_date date,
  guest_count integer,
  budget_range text,
  details text,
  status text,
  created_at timestamptz,
  event_services jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'event_date'));
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'vendor'
  ) then
    return;
  end if;

  return query
  select
    e.id,
    e.customer_id,
    e.title,
    e.event_type,
    e.neighborhood,
    e.event_date,
    e.guest_count,
    e.budget_range,
    e.details,
    e.status,
    e.created_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', es.id,
          'event_id', es.event_id,
          'category_id', es.category_id,
          'current_quote_count', es.current_quote_count,
          'categories',
            case
              when c.id is null then null
              else jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'credits_required', c.credits_required
              )
            end
        )
        order by c.name
      ) filter (where es.id is not null),
      '[]'::jsonb
    ) as event_services
  from public.events e
  left join public.event_services es on es.event_id = e.id
  left join public.categories c on c.id = es.category_id
  left join lateral (
    select count(*)::integer as qc
    from public.quotes q
    inner join public.event_services es2 on es2.id = q.event_service_id
    where es2.event_id = e.id
  ) qcounts on true
  where e.status = 'active'
    and (
      nullif(trim(p_query), '') is null
      or e.title ilike ('%' || trim(p_query) || '%')
      or e.event_type ilike ('%' || trim(p_query) || '%')
      or e.neighborhood ilike ('%' || trim(p_query) || '%')
    )
    and (
      nullif(trim(p_neighborhood), '') is null
      or e.neighborhood ilike ('%' || trim(p_neighborhood) || '%')
    )
    and (
      nullif(trim(p_category), '') is null
      or exists (
        select 1
        from public.event_services esx
        inner join public.categories cx on cx.id = esx.category_id
        where esx.event_id = e.id
          and lower(cx.name) = lower(trim(p_category))
      )
    )
  group by
    e.id,
    e.customer_id,
    e.title,
    e.event_type,
    e.neighborhood,
    e.event_date,
    e.guest_count,
    e.budget_range,
    e.details,
    e.status,
    e.created_at,
    qcounts.qc
  order by
    case when v_sort = 'newest' then extract(epoch from e.created_at) end desc nulls last,
    case when v_sort = 'oldest' then extract(epoch from e.created_at) end asc nulls last,
    case when v_sort = 'quotes' then qcounts.qc end desc nulls last,
    case when v_sort = 'event_date' then e.event_date end asc nulls last,
    case when v_sort not in ('newest', 'oldest', 'quotes', 'event_date') then e.event_date end asc nulls last,
    e.event_date asc;
end;
$$;

grant execute on function public.vendor_list_active_events(text, text, text, text) to authenticated;
