-- Phase 6: vendor credit wallet + quote spend tracking.

alter table public.profiles
  add column if not exists credits_balance integer not null default 0 check (credits_balance >= 0);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('purchase', 'quote_spend', 'refund', 'admin_adjustment')),
  description text not null default '',
  quote_id uuid null references public.quotes (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_vendor_id_idx on public.credit_transactions (vendor_id, created_at desc);
create index if not exists credit_transactions_quote_id_idx on public.credit_transactions (quote_id);
create index if not exists credit_transactions_type_idx on public.credit_transactions (type);

alter table public.credit_transactions enable row level security;

drop policy if exists "credit_transactions_select_vendor_own" on public.credit_transactions;
create policy "credit_transactions_select_vendor_own"
  on public.credit_transactions
  for select
  to authenticated
  using (
    vendor_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'vendor'
    )
  );

drop policy if exists "credit_transactions_select_admin_all" on public.credit_transactions;
create policy "credit_transactions_select_admin_all"
  on public.credit_transactions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "credit_transactions_insert_admin_all" on public.credit_transactions;
create policy "credit_transactions_insert_admin_all"
  on public.credit_transactions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

grant select, insert on public.credit_transactions to authenticated;

create or replace function public.submit_quote_with_credits(
  p_event_id uuid,
  p_event_service_id uuid,
  p_quote_amount numeric,
  p_message text,
  p_what_is_included text,
  p_availability_note text,
  p_estimated_timeframe text,
  p_business_phone text,
  p_business_email text
)
returns table (
  quote_id uuid,
  credits_spent integer,
  remaining_credits integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid := auth.uid();
  v_role text;
  v_event_status text;
  v_existing_quote_count integer;
  v_duplicate_quote_id uuid;
  v_credits_required integer;
  v_category_name text;
  v_vendor_credits integer;
  v_quote_id uuid;
begin
  if v_vendor_id is null then
    raise exception 'You must be signed in as a vendor to submit a quote.';
  end if;

  select role, credits_balance
  into v_role, v_vendor_credits
  from public.profiles
  where id = v_vendor_id
  for update;

  if v_role is distinct from 'vendor' then
    raise exception 'Only vendor accounts can submit quotes.';
  end if;

  select e.status,
         c.credits_required,
         c.name
  into v_event_status, v_credits_required, v_category_name
  from public.event_services es
  join public.events e on e.id = es.event_id
  join public.categories c on c.id = es.category_id
  where es.id = p_event_service_id
    and es.event_id = p_event_id
  for update of es;

  if v_event_status is null then
    raise exception 'This service is no longer available for quotes.';
  end if;

  if v_event_status <> 'active' then
    raise exception 'This service is no longer accepting quotes.';
  end if;

  select count(*)::integer
  into v_existing_quote_count
  from public.quotes
  where event_service_id = p_event_service_id;

  if v_existing_quote_count >= 4 then
    raise exception 'This service already has 4 vendor quotes.';
  end if;

  select id
  into v_duplicate_quote_id
  from public.quotes
  where event_service_id = p_event_service_id
    and vendor_id = v_vendor_id
  limit 1;

  if v_duplicate_quote_id is not null then
    raise exception 'You already submitted a quote for this service.';
  end if;

  if v_vendor_credits < v_credits_required then
    raise exception 'You need more credits to submit this quote.';
  end if;

  insert into public.quotes (
    event_service_id,
    vendor_id,
    quote_amount,
    message,
    what_is_included,
    availability_note,
    estimated_timeframe,
    business_phone,
    business_email,
    status
  )
  values (
    p_event_service_id,
    v_vendor_id,
    p_quote_amount,
    p_message,
    p_what_is_included,
    p_availability_note,
    p_estimated_timeframe,
    p_business_phone,
    p_business_email,
    'pending'
  )
  returning id into v_quote_id;

  update public.profiles
  set credits_balance = credits_balance - v_credits_required
  where id = v_vendor_id;

  insert into public.credit_transactions (
    vendor_id,
    amount,
    type,
    description,
    quote_id
  )
  values (
    v_vendor_id,
    -v_credits_required,
    'quote_spend',
    format('Quote submitted for %s', coalesce(v_category_name, 'service')),
    v_quote_id
  );

  return query
  select
    v_quote_id,
    v_credits_required,
    (v_vendor_credits - v_credits_required);
end;
$$;

grant execute on function public.submit_quote_with_credits(uuid, uuid, numeric, text, text, text, text, text, text) to authenticated;
