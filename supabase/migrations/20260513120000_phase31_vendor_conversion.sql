-- Phase 31: vendor conversion — public directory trust fields, vendor page aggregates, marketplace stats.

-- ---------------------------------------------------------------------------
-- Public vendor directory: expose review, rating, and quote activity (already in CTE)
-- ---------------------------------------------------------------------------

drop function if exists public.public_vendor_directory(text, text, text, text);

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
  is_featured boolean,
  review_count integer,
  avg_rating numeric,
  quotes_submitted_count bigint
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
    b.is_featured,
    b.review_cnt as review_count,
    case when b.review_cnt > 0 then round(b.avg_rating::numeric, 2) else null end as avg_rating,
    b.quote_cnt::bigint as quotes_submitted_count
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
-- Public vendor profile page: trust aggregates (no change to access rules)
-- ---------------------------------------------------------------------------

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
  categories text[],
  is_profile_complete boolean,
  is_featured boolean,
  quote_activity_count bigint,
  public_review_count bigint,
  public_avg_rating numeric
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
    coalesce(array_agg(distinct c.name) filter (where c.name is not null), '{}') as categories,
    coalesce(p.is_profile_complete, false) as is_profile_complete,
    coalesce(p.is_featured, false) as is_featured,
    count(distinct q.id)::bigint as quote_activity_count,
    count(distinct r.id)::bigint as public_review_count,
    case
      when count(distinct r.id) > 0 then round(avg(r.rating)::numeric, 2)
      else null
    end as public_avg_rating
  from public.profiles p
  left join public.quotes q on q.vendor_id = p.id
  left join public.event_services es on es.id = q.event_service_id
  left join public.categories c on c.id = es.category_id
  left join public.reviews r on r.vendor_id = p.id and r.is_public = true
  where p.role = 'vendor'
    and coalesce(p.status, 'active') = 'active'
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
    p.cover_image_url,
    p.is_profile_complete,
    p.is_featured
  limit 1;
$$;

grant execute on function public.public_vendor_page(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Homepage / marketing stats: social proof add-ons
-- ---------------------------------------------------------------------------

drop function if exists public.public_marketplace_stats();

create or replace function public.public_marketplace_stats()
returns table (
  vendor_count bigint,
  events_posted bigint,
  quotes_submitted bigint,
  boroughs_with_vendor_coverage bigint,
  public_reviews_count bigint,
  vendor_profiles_complete bigint,
  vendors_joined_last_30_days bigint
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
        and coalesce(p.status, 'active') = 'active'
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
          and coalesce(p.status, 'active') = 'active'
          and coalesce(p.is_public, true) = true
          and p.is_profile_complete = true
          and p.slug is not null
          and nullif(trim(p.slug), '') is not null
          and p.business_name is not null
          and nullif(trim(p.business_name), '') is not null
          and lower(coalesce(p.service_areas, '')) like '%' || v.keyword || '%'
      )
    ) as boroughs_with_vendor_coverage,
    (
      select count(*)::bigint
      from public.reviews r
      where r.is_public = true
    ) as public_reviews_count,
    (
      select count(*)::bigint
      from public.profiles p
      where p.role = 'vendor'
        and coalesce(p.status, 'active') = 'active'
        and coalesce(p.is_profile_complete, false) = true
    ) as vendor_profiles_complete,
    (
      select count(*)::bigint
      from public.profiles p
      where p.role = 'vendor'
        and coalesce(p.status, 'active') = 'active'
        and coalesce(p.is_public, true) = true
        and p.is_profile_complete = true
        and p.slug is not null
        and nullif(trim(p.slug), '') is not null
        and p.business_name is not null
        and nullif(trim(p.business_name), '') is not null
        and p.created_at >= (timezone('utc', now()) - interval '30 days')
    ) as vendors_joined_last_30_days;
$$;

grant execute on function public.public_marketplace_stats() to anon, authenticated;
