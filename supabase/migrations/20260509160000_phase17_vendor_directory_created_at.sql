-- Phase 17: expose profile created_at for homepage "new vendors" ordering (real data).

drop function if exists public.public_vendor_directory(text, text, text);

create or replace function public.public_vendor_directory(
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
  created_at timestamptz
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
    p.created_at
  from public.profiles p
  left join public.quotes q on q.vendor_id = p.id
  left join public.event_services es on es.id = q.event_service_id
  left join public.categories c on c.id = es.category_id
  where p.role = 'vendor'
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
    p.created_at
  having (
    p_category is null
    or bool_or(lower(c.name) = lower(p_category))
  )
  order by lower(p.business_name) asc;
$$;
