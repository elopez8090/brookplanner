-- Phase 32: customer conversion — public review aggregates on quote vendor RPC (no credits/financials).

drop function if exists public.customer_quote_vendor_profiles(uuid);

create function public.customer_quote_vendor_profiles(p_event_id uuid)
returns table (
  vendor_id uuid,
  full_name text,
  business_name text,
  slug text,
  service_areas text,
  logo_url text,
  public_review_count bigint,
  public_avg_rating numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (p.id)
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.service_areas,
    p.logo_url,
    coalesce(rv.cnt, 0)::bigint,
    case
      when coalesce(rv.cnt, 0) > 0 then round(rv.avg_rating::numeric, 2)
      else null
    end
  from public.profiles p
  inner join public.quotes q on q.vendor_id = p.id
  inner join public.event_services es on es.id = q.event_service_id
  inner join public.events e on e.id = es.event_id
  left join lateral (
    select
      count(*)::bigint as cnt,
      avg(r.rating)::numeric as avg_rating
    from public.reviews r
    where r.vendor_id = p.id
      and r.is_public = true
  ) rv on true
  where e.id = p_event_id
    and (
      e.customer_id = (select auth.uid())
      or exists (
        select 1
        from public.profiles viewer
        where viewer.id = (select auth.uid())
          and viewer.role = 'admin'
      )
    )
  order by p.id;
$$;

grant execute on function public.customer_quote_vendor_profiles(uuid) to authenticated;
