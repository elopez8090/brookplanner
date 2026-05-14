-- Phase 28.3: Credit adjustments + promotional credit tracking (reporting foundation).
-- Extends existing public.admin_credit_adjustments (Phase 21) with adjustment_type;
-- revenue RPCs sum promotional + bonus grants; vendors remain blocked from direct table access.

-- ---------------------------------------------------------------------------
-- admin_credit_adjustments: adjustment_type + stricter row checks
-- ---------------------------------------------------------------------------

alter table public.admin_credit_adjustments
  add column if not exists adjustment_type text;

update public.admin_credit_adjustments
set adjustment_type = 'promotional'
where adjustment_type is null;

alter table public.admin_credit_adjustments
  alter column adjustment_type set default 'promotional',
  alter column adjustment_type set not null;

alter table public.admin_credit_adjustments
  drop constraint if exists admin_credit_adjustments_adjustment_type_check;

alter table public.admin_credit_adjustments
  add constraint admin_credit_adjustments_adjustment_type_check
  check (adjustment_type in ('promotional', 'correction', 'refund', 'bonus'));

alter table public.admin_credit_adjustments
  drop constraint if exists admin_credit_adjustments_credits_added_check;

alter table public.admin_credit_adjustments
  add constraint admin_credit_adjustments_credits_delta_check
  check (
    (adjustment_type in ('promotional', 'bonus') and credits_added > 0)
    or (adjustment_type in ('correction', 'refund') and credits_added <> 0)
  );

comment on column public.admin_credit_adjustments.adjustment_type is
  'promotional/bonus: positive credits_added; correction/refund: signed delta (reporting; balance changes use separate flows).';

create index if not exists admin_credit_adjustments_admin_id_idx
  on public.admin_credit_adjustments (admin_id);

create index if not exists admin_credit_adjustments_created_at_idx
  on public.admin_credit_adjustments (created_at desc);

create index if not exists admin_credit_adjustments_adjustment_type_idx
  on public.admin_credit_adjustments (adjustment_type);

-- ---------------------------------------------------------------------------
-- RLS (same pattern as Phase 21; vendors never match admin USING)
-- ---------------------------------------------------------------------------

alter table public.admin_credit_adjustments enable row level security;

drop policy if exists "admin_credit_adjustments_admin_select" on public.admin_credit_adjustments;
create policy "admin_credit_adjustments_admin_select"
  on public.admin_credit_adjustments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "admin_credit_adjustments_admin_insert" on public.admin_credit_adjustments;
create policy "admin_credit_adjustments_admin_insert"
  on public.admin_credit_adjustments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

grant select, insert on public.admin_credit_adjustments to authenticated;

-- ---------------------------------------------------------------------------
-- admin_grant_vendor_promotional_credits: tag rows as promotional
-- ---------------------------------------------------------------------------

create or replace function public.admin_grant_vendor_promotional_credits(
  p_vendor_id uuid,
  p_credits_added integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_n integer := p_credits_added;
  v_reason text := coalesce(nullif(trim(p_reason), ''), 'Manual adjustment');
begin
  if v_admin is null then
    raise exception 'not authorized';
  end if;

  if not exists (
    select 1 from public.profiles pr where pr.id = v_admin and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  if v_n is null or v_n <= 0 then
    raise exception 'Credits must be a positive integer.';
  end if;

  update public.profiles
  set credits_balance = credits_balance + v_n
  where id = p_vendor_id
    and role = 'vendor';

  if not found then
    raise exception 'vendor profile not found';
  end if;

  insert into public.admin_credit_adjustments (vendor_id, admin_id, credits_added, reason, adjustment_type)
  values (p_vendor_id, v_admin, v_n, v_reason, 'promotional');

  insert into public.credit_transactions (vendor_id, amount, type, description)
  values (p_vendor_id, v_n, 'admin_adjustment', v_reason);
end;
$$;

grant execute on function public.admin_grant_vendor_promotional_credits(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Phase 22 snapshot: promotional total = promotional + bonus only
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
      where a.adjustment_type in ('promotional', 'bonus')
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
-- Phase 28.1 revenue RPCs: promotional credits from adjustments (promo + bonus)
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
  promo_agg as (
    select coalesce(sum(a.credits_added), 0)::bigint as promo_n
    from public.admin_credit_adjustments a
    where a.adjustment_type in ('promotional', 'bonus')
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
    pr.promo_n,
    qs.spent_n,
    ba.remaining_n,
    (ba.remaining_n * v_credit_cents)::bigint,
    pa.paying_vendors_n,
    case
      when pa.purchase_n > 0 then (pa.revenue_cents / pa.purchase_n)::bigint
      else 0::bigint
    end
  from purchase_agg pa
  cross join promo_agg pr
  cross join quote_spend qs
  cross join bal ba;
end;
$$;

grant execute on function public.admin_get_revenue_overview() to authenticated;

drop function if exists public.admin_get_top_spending_vendors(integer);

create or replace function public.admin_get_top_spending_vendors(p_limit integer default 20)
returns table (
  vendor_id uuid,
  vendor_name text,
  vendor_email text,
  total_spent_cents bigint,
  credits_purchased bigint,
  promotional_credits_granted bigint,
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
    coalesce(pa.promo_n, 0)::bigint,
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
    select coalesce(sum(a.credits_added), 0)::bigint as promo_n
    from public.admin_credit_adjustments a
    where a.vendor_id = p.id
      and a.adjustment_type in ('promotional', 'bonus')
  ) pa on true
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
  promo as (
    select coalesce(sum(a.credits_added), 0)::bigint as n
    from public.admin_credit_adjustments a
    where a.adjustment_type in ('promotional', 'bonus')
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
    pr.n,
    sp.n,
    re.n,
    (re.n * v_credit_cents)::bigint
  from purchased pu
  cross join promo pr
  cross join spent sp
  cross join remaining re;
end;
$$;

grant execute on function public.admin_get_credit_activity_breakdown() to authenticated;
