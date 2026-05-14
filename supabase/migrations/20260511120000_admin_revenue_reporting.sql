-- Phase 28.1: Admin revenue reporting — database/RPC foundation only.
--
-- Metrics:
-- - Paid purchases: public.credit_purchases (status = 'completed').
-- - Remaining credits: public.profiles.credits_balance (vendors only for aggregates).
-- - Credits spent on quotes: sum(categories.credits_required) for each vendor's rows in
--   public.quotes joined through public.event_services (matches submit_quote_with_credits).
-- - Face value / liability: 1 credit = USD $5 => liability_cents = credits * 500.
--
-- Promotional grants: schema has admin_credit_adjustments, but this phase returns
-- promotional totals as 0 until product defines how to split promo vs purchased in UI.

-- ---------------------------------------------------------------------------
-- credit_purchases (Stripe checkout + webhook; ensure table exists in migrations)
-- ---------------------------------------------------------------------------

create table if not exists public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  stripe_session_id text not null,
  stripe_payment_intent_id text null,
  amount_paid integer not null check (amount_paid >= 0),
  credits_added integer not null check (credits_added > 0),
  status text not null default 'pending',
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.credit_purchases drop constraint if exists credit_purchases_status_check;
alter table public.credit_purchases
  add constraint credit_purchases_status_check
  check (status in ('pending', 'completed', 'failed'));

create unique index if not exists credit_purchases_stripe_session_id_key
  on public.credit_purchases (stripe_session_id);

create index if not exists credit_purchases_vendor_status_completed_idx
  on public.credit_purchases (vendor_id, status, completed_at desc);

alter table public.credit_purchases enable row level security;

-- ---------------------------------------------------------------------------
-- admin_get_revenue_overview
-- ---------------------------------------------------------------------------

create or replace function public.admin_get_revenue_overview()
returns table (
  total_revenue_cents bigint,
  total_credit_purchases bigint,
  total_credits_sold bigint,
  total_promotional_credits bigint,
  total_credits_spent bigint,
  total_credits_remaining bigint,
  estimated_credit_liability_cents bigint,
  active_paying_vendors bigint,
  average_purchase_value_cents bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_credit_cents constant integer := 500;
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  with
  purchase_agg as (
    select
      coalesce(
        sum(cp.amount_paid::bigint * 100) filter (where cp.status = 'completed'),
        0
      )::bigint as revenue_cents,
      count(*) filter (where cp.status = 'completed')::bigint as purchase_n,
      coalesce(sum(cp.credits_added) filter (where cp.status = 'completed'), 0)::bigint as credits_sold_n,
      count(distinct cp.vendor_id) filter (where cp.status = 'completed')::bigint as paying_vendors_n
    from public.credit_purchases cp
  ),
  quote_spend as (
    select coalesce(sum(c.credits_required), 0)::bigint as spent_n
    from public.quotes q
    join public.event_services es on es.id = q.event_service_id
    join public.categories c on c.id = es.category_id
  ),
  bal as (
    select coalesce(sum(p.credits_balance), 0)::bigint as remaining_n
    from public.profiles p
    where p.role = 'vendor'
  )
  select
    pa.revenue_cents,
    pa.purchase_n,
    pa.credits_sold_n,
    0::bigint, -- promotional credits: reserved for future breakdown (see migration header)
    qs.spent_n,
    ba.remaining_n,
    (ba.remaining_n * v_credit_cents)::bigint,
    pa.paying_vendors_n,
    case
      when pa.purchase_n > 0 then (pa.revenue_cents / pa.purchase_n)::bigint
      else 0::bigint
    end
  from purchase_agg pa
  cross join quote_spend qs
  cross join bal ba;
end;
$$;

grant execute on function public.admin_get_revenue_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- admin_get_monthly_revenue
-- ---------------------------------------------------------------------------

create or replace function public.admin_get_monthly_revenue()
returns table (
  month date,
  revenue_cents bigint,
  purchases_count bigint,
  credits_sold bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    (date_trunc('month', timezone('UTC', cp.completed_at)))::date as month,
    coalesce(sum(cp.amount_paid::bigint * 100), 0)::bigint as revenue_cents,
    count(*)::bigint as purchases_count,
    coalesce(sum(cp.credits_added), 0)::bigint as credits_sold
  from public.credit_purchases cp
  where cp.status = 'completed'
    and cp.completed_at is not null
  group by 1
  order by 1 desc
  limit 48;
end;
$$;

grant execute on function public.admin_get_monthly_revenue() to authenticated;

-- ---------------------------------------------------------------------------
-- admin_get_top_spending_vendors (auth.users joined only for vendor email)
-- ---------------------------------------------------------------------------

create or replace function public.admin_get_top_spending_vendors(p_limit integer default 20)
returns table (
  vendor_id uuid,
  vendor_name text,
  vendor_email text,
  total_spent_cents bigint,
  credits_purchased bigint,
  credits_spent bigint,
  credits_remaining integer,
  purchase_count bigint
)
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 80);
  v_credit_cents constant integer := 500;
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    p.id,
    coalesce(nullif(trim(p.business_name), ''), p.full_name, 'Vendor')::text,
    coalesce(u.email::text, '')::text,
    (coalesce(qs.spent_credits, 0) * v_credit_cents)::bigint,
    coalesce(cp.credits_bought, 0)::bigint,
    coalesce(qs.spent_credits, 0)::bigint,
    p.credits_balance,
    coalesce(cp.purchase_n, 0)::bigint
  from public.profiles p
  left join lateral (
    select
      coalesce(sum(cpp.credits_added), 0)::bigint as credits_bought,
      count(*)::bigint as purchase_n
    from public.credit_purchases cpp
    where cpp.vendor_id = p.id
      and cpp.status = 'completed'
  ) cp on true
  left join lateral (
    select coalesce(sum(c.credits_required), 0)::bigint as spent_credits
    from public.quotes q
    join public.event_services es on es.id = q.event_service_id
    join public.categories c on c.id = es.category_id
    where q.vendor_id = p.id
  ) qs on true
  left join auth.users u on u.id = p.id
  where p.role = 'vendor'
    and (
      coalesce(cp.credits_bought, 0) > 0
      or coalesce(qs.spent_credits, 0) > 0
    )
  order by
    coalesce(qs.spent_credits, 0) desc,
    coalesce(cp.credits_bought, 0) desc,
    coalesce(nullif(trim(p.business_name), ''), p.full_name) asc
  limit v_limit;
end;
$$;

grant execute on function public.admin_get_top_spending_vendors(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_get_credit_activity_breakdown
-- ---------------------------------------------------------------------------

create or replace function public.admin_get_credit_activity_breakdown()
returns table (
  purchased_credits bigint,
  promotional_credits bigint,
  spent_credits bigint,
  remaining_credits bigint,
  liability_cents bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_credit_cents constant integer := 500;
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  with
  purchased as (
    select coalesce(sum(cp.credits_added), 0)::bigint as n
    from public.credit_purchases cp
    where cp.status = 'completed'
  ),
  spent as (
    select coalesce(sum(c.credits_required), 0)::bigint as n
    from public.quotes q
    join public.event_services es on es.id = q.event_service_id
    join public.categories c on c.id = es.category_id
  ),
  remaining as (
    select coalesce(sum(p.credits_balance), 0)::bigint as n
    from public.profiles p
    where p.role = 'vendor'
  )
  select
    pu.n,
    0::bigint, -- promotional credits: reserved for future breakdown (see migration header)
    sp.n,
    re.n,
    (re.n * v_credit_cents)::bigint
  from purchased pu
  cross join spent sp
  cross join remaining re;
end;
$$;

grant execute on function public.admin_get_credit_activity_breakdown() to authenticated;
