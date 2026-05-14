-- Phase 38: Admin marketplace operations — supply/demand, funnel, neighborhoods, alerts.
-- Admin-only security definer RPCs; no new client-side table access.

create or replace function public.admin_marketplace_ops_supply_demand_by_category()
returns table (
  category_id uuid,
  category_name text,
  category_slug text,
  active_events bigint,
  quote_volume bigint,
  marketplace_vendor_supply bigint
)
language plpgsql
stable
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
  with ready_vendors as (
    select p.id
    from public.profiles p
    where p.role = 'vendor'
      and coalesce(p.status, 'active') = 'active'
      and coalesce(p.is_public, true) = true
      and coalesce(p.is_profile_complete, false) = true
      and p.slug is not null
      and nullif(trim(p.slug), '') is not null
      and p.business_name is not null
      and nullif(trim(p.business_name), '') is not null
  ),
  cat_events as (
    select
      c.id as cid,
      count(distinct e.id) filter (where e.status = 'active')::bigint as active_ev,
      count(q.id)::bigint as quotes_n
    from public.categories c
    left join public.event_services es on es.category_id = c.id
    left join public.events e on e.id = es.event_id
    left join public.quotes q on q.event_service_id = es.id
    group by c.id
  ),
  cat_vendors as (
    select
      c.id as cid,
      count(distinct q.vendor_id) filter (where rv.id is not null)::bigint as vendor_n
    from public.categories c
    left join public.event_services es on es.category_id = c.id
    left join public.quotes q on q.event_service_id = es.id
    left join ready_vendors rv on rv.id = q.vendor_id
    group by c.id
  )
  select
    c.id,
    c.name,
    c.slug,
    coalesce(ce.active_ev, 0),
    coalesce(ce.quotes_n, 0),
    coalesce(cv.vendor_n, 0)
  from public.categories c
  left join cat_events ce on ce.cid = c.id
  left join cat_vendors cv on cv.cid = c.id
  order by coalesce(ce.active_ev, 0) desc, c.name asc;
end;
$$;

create or replace function public.admin_marketplace_ops_quote_funnel_snapshot()
returns table (
  quotes_total bigint,
  quotes_pending bigint,
  quotes_accepted bigint,
  quotes_declined bigint,
  accepted_rate_pct numeric,
  active_events_total bigint,
  active_events_with_quotes bigint,
  avg_quotes_per_active_event numeric,
  quotes_submitted_last_7_days bigint,
  distinct_vendors_quoting_last_7_days bigint,
  quotes_submitted_last_30_days bigint
)
language plpgsql
stable
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
  with qstat as (
    select
      count(*)::bigint as qt,
      count(*) filter (where q.status = 'pending')::bigint as qp,
      count(*) filter (where q.status = 'accepted')::bigint as qa,
      count(*) filter (where q.status = 'declined')::bigint as qd
    from public.quotes q
  ),
  ev as (
    select
      count(*) filter (where e.status = 'active')::bigint as active_tot,
      count(*) filter (where e.status = 'active' and exists (
        select 1
        from public.event_services es
        join public.quotes q2 on q2.event_service_id = es.id
        where es.event_id = e.id
      ))::bigint as active_with_q
    from public.events e
  ),
  per_event as (
    select
      e.id,
      count(q3.id)::bigint as qc
    from public.events e
    left join public.event_services es3 on es3.event_id = e.id
    left join public.quotes q3 on q3.event_service_id = es3.id
    where e.status = 'active'
    group by e.id
  ),
  recent as (
    select
      count(*) filter (where q4.created_at >= (now() - interval '7 days'))::bigint as q7,
      count(distinct q4.vendor_id) filter (where q4.created_at >= (now() - interval '7 days'))::bigint as v7,
      count(*) filter (where q4.created_at >= (now() - interval '30 days'))::bigint as q30
    from public.quotes q4
  )
  select
    qs.qt,
    qs.qp,
    qs.qa,
    qs.qd,
    case
      when qs.qt > 0 then round(100.0 * (qs.qa::numeric / qs.qt::numeric), 1)
      else 0::numeric
    end,
    ev.active_tot,
    ev.active_with_q,
    coalesce((select round(avg(pe.qc)::numeric, 2) from per_event pe), 0::numeric),
    r.q7,
    r.v7,
    r.q30
  from qstat qs
  cross join ev
  cross join recent r;
end;
$$;

create or replace function public.admin_marketplace_ops_neighborhood_demand(p_limit integer default 35)
returns table (
  borough text,
  neighborhood text,
  active_events bigint,
  quote_volume bigint,
  avg_quotes_per_active_event numeric
)
language plpgsql
stable
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
  with lim as (
    select least(greatest(coalesce(p_limit, 35), 5), 80)::integer as n
  ),
  hood as (
    select
      e.neighborhood as nh,
      case
        when lower(trim(e.neighborhood)) in (
          'soho', 'tribeca', 'upper west side', 'upper west-side', 'manhattan'
        ) then 'Manhattan'
        when lower(trim(e.neighborhood)) in (
          'astoria', 'long island city', 'long island-city', 'queens'
        ) then 'Queens'
        when lower(trim(e.neighborhood)) in (
          'williamsburg', 'park slope', 'bushwick', 'greenpoint', 'dumbo', 'fort greene',
          'bed-stuy', 'bed stuy', 'crown heights', 'brooklyn'
        )
          or lower(trim(e.neighborhood)) like '%brooklyn%'
        then 'Brooklyn'
        else 'Other NYC'
      end as br,
      e.id as eid
    from public.events e
    where e.status = 'active'
  ),
  agg as (
    select
      h.br,
      h.nh,
      count(distinct h.eid)::bigint as ev_c,
      count(q.id)::bigint as q_c
    from hood h
    join public.event_services es on es.event_id = h.eid
    left join public.quotes q on q.event_service_id = es.id
    group by h.br, h.nh
  )
  select
    a.br,
    a.nh,
    a.ev_c,
    a.q_c,
    case
      when a.ev_c > 0 then round(a.q_c::numeric / a.ev_c::numeric, 2)
      else 0::numeric
    end
  from agg a
  cross join lim
  order by a.ev_c desc, a.q_c desc
  limit (select lim.n from lim);
end;
$$;

create or replace function public.admin_marketplace_ops_alerts(p_limit integer default 25)
returns table (
  zero_quote_active_events jsonb,
  category_supply_gaps jsonb,
  marketplace_ready_vendors_no_quotes jsonb,
  hot_neighborhoods jsonb,
  event_services_near_quote_cap jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_lim integer := least(greatest(coalesce(p_limit, 25), 5), 60);
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  with
  zero_q as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'event_id', b.event_id,
            'title', b.title,
            'neighborhood', b.neighborhood,
            'status', b.status,
            'customer_name', b.customer_name,
            'created_at', b.created_at
          )
          order by b.created_at desc
        )
        from (
          select
            e2.id as event_id,
            e2.title,
            e2.neighborhood,
            e2.status,
            e2.created_at,
            cust2.full_name as customer_name
          from public.events e2
          join public.profiles cust2 on cust2.id = e2.customer_id
          where e2.status = 'active'
            and not exists (
              select 1
              from public.quotes qx
              join public.event_services esx on esx.id = qx.event_service_id
              where esx.event_id = e2.id
            )
          order by e2.created_at desc
          limit v_lim
        ) b
      ),
      '[]'::jsonb
    ) as js
  ),
  cat_gap as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'category_id', x.category_id,
            'category_name', x.category_name,
            'category_slug', x.category_slug,
            'active_events', x.active_events,
            'marketplace_vendor_supply', x.marketplace_vendor_supply
          )
          order by x.active_events desc
        )
        from (
          select *
          from public.admin_marketplace_ops_supply_demand_by_category() s
          where s.active_events >= 2
            and (
              s.marketplace_vendor_supply = 0
              or (s.active_events::numeric / greatest(s.marketplace_vendor_supply, 1)::numeric) >= 3
            )
          limit v_lim
        ) x
      ),
      '[]'::jsonb
    ) as js
  ),
  no_q_v as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'vendor_id', v.id,
            'full_name', v.full_name,
            'business_name', v.business_name,
            'slug', v.slug,
            'created_at', v.created_at
          )
          order by v.created_at desc
        )
        from (
          select p.id, p.full_name, p.business_name, p.slug, p.created_at
          from public.profiles p
          where p.role = 'vendor'
            and coalesce(p.status, 'active') = 'active'
            and coalesce(p.is_public, true) = true
            and coalesce(p.is_profile_complete, false) = true
            and p.slug is not null
            and nullif(trim(p.slug), '') is not null
            and p.business_name is not null
            and nullif(trim(p.business_name), '') is not null
            and not exists (select 1 from public.quotes q where q.vendor_id = p.id)
          order by p.created_at desc
          limit v_lim
        ) v
      ),
      '[]'::jsonb
    ) as js
  ),
  hot_n as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'borough', hn.borough,
            'neighborhood', hn.neighborhood,
            'active_events', hn.active_events,
            'quote_volume', hn.quote_volume
          )
          order by hn.active_events desc
        )
        from (
          select n.*
          from public.admin_marketplace_ops_neighborhood_demand(80) n
          where n.active_events >= 2
          order by n.active_events desc, n.quote_volume desc
          limit v_lim
        ) hn
      ),
      '[]'::jsonb
    ) as js
  ),
  near_cap as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'event_id', e.id,
            'event_title', e.title,
            'neighborhood', e.neighborhood,
            'category_name', c.name,
            'slots_filled', es.current_quote_count
          )
          order by es.current_quote_count desc, e.created_at desc
        )
        from (
          select es2.id, es2.event_id, es2.category_id, es2.current_quote_count
          from public.event_services es2
          inner join public.events ev2 on ev2.id = es2.event_id and ev2.status = 'active'
          where es2.current_quote_count >= 3
          order by es2.current_quote_count desc
          limit v_lim
        ) es
        join public.events e on e.id = es.event_id
        join public.categories c on c.id = es.category_id
      ),
      '[]'::jsonb
    ) as js
  )
  select zq.js, cg.js, nv.js, hn.js, nc.js
  from zero_q zq
  cross join cat_gap cg
  cross join no_q_v nv
  cross join hot_n hn
  cross join near_cap nc;
end;
$$;

grant execute on function public.admin_marketplace_ops_supply_demand_by_category() to authenticated;
grant execute on function public.admin_marketplace_ops_quote_funnel_snapshot() to authenticated;
grant execute on function public.admin_marketplace_ops_neighborhood_demand(integer) to authenticated;
grant execute on function public.admin_marketplace_ops_alerts(integer) to authenticated;

comment on function public.admin_marketplace_ops_supply_demand_by_category() is
  'Phase 38: admin-only category rows — active events, quote volume, marketplace-ready vendors with quotes in category.';

comment on function public.admin_marketplace_ops_quote_funnel_snapshot() is
  'Phase 38: admin-only quote funnel counts, acceptance rate, active-event coverage, recent vendor activity.';

comment on function public.admin_marketplace_ops_neighborhood_demand(integer) is
  'Phase 38: admin-only active-event demand and quote volume by neighborhood (borough inferred from label).';

comment on function public.admin_marketplace_ops_alerts(integer) is
  'Phase 38: admin-only JSON bundles for marketplace operations alerts.';
