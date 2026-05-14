-- Phase 14: anonymous-safe aggregate counts for the marketing homepage (real data only).

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
          and p.is_profile_complete = true
          and p.slug is not null
          and nullif(trim(p.slug), '') is not null
          and p.business_name is not null
          and nullif(trim(p.business_name), '') is not null
          and lower(coalesce(p.service_areas, '')) like '%' || v.keyword || '%'
      )
    ) as boroughs_with_vendor_coverage;
$$;

grant execute on function public.public_marketplace_stats() to anon, authenticated;
