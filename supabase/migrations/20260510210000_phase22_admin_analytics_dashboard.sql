-- Phase 22: Admin analytics snapshot + marketplace health lists (security definer RPCs).

-- ---------------------------------------------------------------------------
-- Single-row dashboard metrics
-- ---------------------------------------------------------------------------

create or replace function public.admin_analytics_snapshot()
returns table (
  customer_total bigint,
  vendor_total bigint,
  vendor_active bigint,
  users_suspended bigint,
  events_total bigint,
  events_open bigint,
  events_completed bigint,
  quotes_total bigint,
  quotes_accepted bigint,
  quotes_declined bigint,
  credits_purchased_total bigint,
  credits_promotional_granted_total bigint,
  vendor_credits_balance_total bigint,
  vendors_featured_count bigint,
  vendors_public_listed_count bigint,
  reviews_pending_count bigint,
  reviews_approved_count bigint
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
    (select count(*)::bigint from public.profiles c where c.role = 'customer'),
    (select count(*)::bigint from public.profiles v where v.role = 'vendor'),
    (
      select count(*)::bigint
      from public.profiles v
      where v.role = 'vendor'
        and coalesce(v.status, 'active') = 'active'
    ),
    (select count(*)::bigint from public.profiles p where p.status = 'suspended'),
    (select count(*)::bigint from public.events),
    (select count(*)::bigint from public.events e where e.status = 'active'),
    (select count(*)::bigint from public.events e where e.status = 'closed'),
    (select count(*)::bigint from public.quotes),
    (select count(*)::bigint from public.quotes q where q.status = 'accepted'),
    (select count(*)::bigint from public.quotes q where q.status = 'declined'),
    (
      select coalesce(sum(ct.amount), 0)::bigint
      from public.credit_transactions ct
      where ct.type = 'purchase'
        and ct.amount > 0
    ),
    (
      select coalesce(sum(a.credits_added), 0)::bigint
      from public.admin_credit_adjustments a
    ),
    (
      select coalesce(sum(p.credits_balance), 0)::bigint
      from public.profiles p
      where p.role = 'vendor'
    ),
    (select count(*)::bigint from public.profiles v where v.role = 'vendor' and v.is_featured = true),
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
    (select count(*)::bigint from public.reviews r where r.is_public = false),
    (select count(*)::bigint from public.reviews r where r.is_public = true);
end;
$$;

grant execute on function public.admin_analytics_snapshot() to authenticated;

-- ---------------------------------------------------------------------------
-- Vendors at or below a credit balance threshold
-- ---------------------------------------------------------------------------

create or replace function public.admin_health_vendors_low_credits(
  p_limit integer default 12,
  p_max_balance integer default 10
)
returns table (
  vendor_id uuid,
  full_name text,
  business_name text,
  slug text,
  credits_balance integer,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 12), 1), 60);
  v_max integer := greatest(coalesce(p_max_balance, 10), 0);
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
    p.credits_balance,
    coalesce(p.status, 'active')::text
  from public.profiles p
  where p.role = 'vendor'
    and p.credits_balance <= v_max
  order by p.credits_balance asc, p.business_name asc nulls last, p.full_name asc
  limit v_limit;
end;
$$;

grant execute on function public.admin_health_vendors_low_credits(integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Vendors ranked by submitted quotes (all time)
-- ---------------------------------------------------------------------------

create or replace function public.admin_health_most_active_vendors(p_limit integer default 10)
returns table (
  vendor_id uuid,
  full_name text,
  business_name text,
  slug text,
  quote_count bigint,
  credits_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    v.id,
    v.full_name,
    v.business_name,
    v.slug,
    cnt.qc,
    v.credits_balance
  from (
    select q.vendor_id as vid, count(*)::bigint as qc
    from public.quotes q
    group by q.vendor_id
  ) cnt
  inner join public.profiles v on v.id = cnt.vid and v.role = 'vendor'
  order by cnt.qc desc, coalesce(nullif(trim(v.business_name), ''), v.full_name) asc
  limit v_limit;
end;
$$;

grant execute on function public.admin_health_most_active_vendors(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Categories by number of event service rows (requested services)
-- ---------------------------------------------------------------------------

create or replace function public.admin_health_top_event_categories(p_limit integer default 10)
returns table (
  category_id uuid,
  category_name text,
  category_slug text,
  event_request_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 40);
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    c.id,
    c.name,
    c.slug,
    count(*)::bigint
  from public.event_services es
  inner join public.categories c on c.id = es.category_id
  group by c.id, c.name, c.slug
  order by count(*) desc, c.name asc
  limit v_limit;
end;
$$;

grant execute on function public.admin_health_top_event_categories(integer) to authenticated;
