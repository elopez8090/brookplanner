-- Phase 29.4: Platform health alert payload (admin-only, security definer).

create or replace function public.admin_platform_health_alerts(p_limit integer default 20)
returns table (
  pending_approval_count bigint,
  pending_approvals jsonb,
  active_events_no_quotes_count bigint,
  active_events_no_quotes jsonb,
  incomplete_vendor_count bigint,
  incomplete_vendors jsonb,
  credit_issue_count bigint,
  credit_purchase_issues jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_lim integer := least(greatest(coalesce(p_limit, 20), 1), 50);
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  with
  pending_approval_rows as (
    select
      v.id as vendor_id,
      v.full_name,
      v.business_name,
      v.slug,
      coalesce(v.status, 'active') as status,
      v.created_at
    from public.profiles v
    where v.role = 'vendor'
      and coalesce(v.is_profile_complete, false) = true
      and coalesce(v.is_public, true) = false
    order by v.created_at desc
    limit v_lim
  ),
  pending_approval_agg as (
    select
      (select count(*)::bigint from public.profiles v2 where v2.role = 'vendor'
        and coalesce(v2.is_profile_complete, false) = true
        and coalesce(v2.is_public, true) = false) as cnt,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'vendor_id', r.vendor_id,
              'full_name', r.full_name,
              'business_name', r.business_name,
              'slug', r.slug,
              'status', r.status,
              'created_at', r.created_at
            )
            order by r.created_at desc
          )
          from pending_approval_rows r
        ),
        '[]'::jsonb
      ) as js
  ),
  events_no_q_rows as (
    select
      e.id as event_id,
      e.title,
      e.neighborhood,
      e.status,
      e.created_at,
      cust.full_name as customer_name
    from public.events e
    join public.profiles cust on cust.id = e.customer_id
    where e.status = 'active'
      and not exists (
        select 1
        from public.quotes q
        join public.event_services es on es.id = q.event_service_id
        where es.event_id = e.id
      )
    order by e.created_at desc
    limit v_lim
  ),
  events_no_q_agg as (
    select
      (select count(*)::bigint
       from public.events e2
       where e2.status = 'active'
         and not exists (
           select 1
           from public.quotes q2
           join public.event_services es2 on es2.id = q2.event_service_id
           where es2.event_id = e2.id
         )) as cnt,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'event_id', er.event_id,
              'title', er.title,
              'neighborhood', er.neighborhood,
              'status', er.status,
              'customer_name', er.customer_name,
              'created_at', er.created_at
            )
            order by er.created_at desc
          )
          from events_no_q_rows er
        ),
        '[]'::jsonb
      ) as js
  ),
  incomplete_rows as (
    select
      v.id as vendor_id,
      v.full_name,
      v.business_name,
      v.slug,
      coalesce(v.status, 'active') as status,
      v.created_at
    from public.profiles v
    where v.role = 'vendor'
      and coalesce(v.is_profile_complete, false) = false
    order by v.created_at desc
    limit v_lim
  ),
  incomplete_agg as (
    select
      (select count(*)::bigint from public.profiles v2 where v2.role = 'vendor'
        and coalesce(v2.is_profile_complete, false) = false) as cnt,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'vendor_id', r.vendor_id,
              'full_name', r.full_name,
              'business_name', r.business_name,
              'slug', r.slug,
              'status', r.status,
              'created_at', r.created_at
            )
            order by r.created_at desc
          )
          from incomplete_rows r
        ),
        '[]'::jsonb
      ) as js
  ),
  credit_issue_rows as (
    select
      cp.id,
      cp.vendor_id,
      cp.status,
      cp.credits_added,
      cp.amount_paid,
      cp.stripe_session_id,
      cp.created_at,
      p.full_name as vendor_full_name,
      p.business_name as vendor_business_name
    from public.credit_purchases cp
    join public.profiles p on p.id = cp.vendor_id
    where cp.status = 'failed'
      or (cp.status = 'pending' and cp.created_at < now() - interval '1 hour')
    order by cp.created_at desc
    limit v_lim
  ),
  credit_issue_agg as (
    select
      (select count(*)::bigint
       from public.credit_purchases cp2
       where cp2.status = 'failed'
          or (cp2.status = 'pending' and cp2.created_at < now() - interval '1 hour')) as cnt,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', cr.id,
              'vendor_id', cr.vendor_id,
              'status', cr.status,
              'credits_added', cr.credits_added,
              'amount_paid', cr.amount_paid,
              'stripe_session_id', cr.stripe_session_id,
              'created_at', cr.created_at,
              'vendor_full_name', cr.vendor_full_name,
              'vendor_business_name', cr.vendor_business_name
            )
            order by cr.created_at desc
          )
          from credit_issue_rows cr
        ),
        '[]'::jsonb
      ) as js
  )
  select
    pa.cnt,
    pa.js,
    eq.cnt,
    eq.js,
    ia.cnt,
    ia.js,
    ca.cnt,
    ca.js
  from pending_approval_agg pa
  cross join events_no_q_agg eq
  cross join incomplete_agg ia
  cross join credit_issue_agg ca;
end;
$$;

grant execute on function public.admin_platform_health_alerts(integer) to authenticated;

comment on function public.admin_platform_health_alerts(integer) is
  'Admin-only JSON bundles for platform-health alerts: pending marketplace approvals, active events without quotes, incomplete vendor profiles, and stuck/failed credit purchases.';
