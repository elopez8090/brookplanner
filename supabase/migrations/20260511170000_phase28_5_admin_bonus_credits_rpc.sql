-- Phase 28.5: bonus credits RPC (mirrors promotional; adjustment_type = bonus for reporting).

create or replace function public.admin_grant_vendor_bonus_credits(
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
  values (p_vendor_id, v_admin, v_n, v_reason, 'bonus');

  insert into public.credit_transactions (vendor_id, amount, type, description)
  values (p_vendor_id, v_n, 'admin_adjustment', v_reason);
end;
$$;

grant execute on function public.admin_grant_vendor_bonus_credits(uuid, integer, text) to authenticated;

-- Recent adjustments for admin Credits UI (joined labels; admin-only).

create or replace function public.admin_fetch_recent_credit_adjustments(p_limit integer default 50)
returns table (
  id uuid,
  vendor_id uuid,
  admin_id uuid,
  credits_added integer,
  reason text,
  adjustment_type text,
  created_at timestamptz,
  vendor_label text,
  admin_label text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
begin
  if not exists (
    select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    a.id,
    a.vendor_id,
    a.admin_id,
    a.credits_added,
    a.reason,
    a.adjustment_type,
    a.created_at,
    coalesce(nullif(trim(vp.business_name), ''), nullif(trim(vp.full_name), ''), 'Vendor')::text,
    coalesce(nullif(trim(ap.full_name), ''), 'Admin')::text
  from public.admin_credit_adjustments a
  join public.profiles vp on vp.id = a.vendor_id
  join public.profiles ap on ap.id = a.admin_id
  order by a.created_at desc
  limit v_limit;
end;
$$;

grant execute on function public.admin_fetch_recent_credit_adjustments(integer) to authenticated;
