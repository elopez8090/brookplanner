-- Phase 5: vendor quote submission with max 4 quotes per event service.

alter table public.event_services
  add column if not exists current_quote_count integer not null default 0 check (current_quote_count >= 0 and current_quote_count <= 4);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  event_service_id uuid not null references public.event_services (id) on delete cascade,
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  quote_amount numeric(12,2) not null check (quote_amount > 0),
  message text not null default '',
  what_is_included text not null default '',
  availability_note text not null default '',
  estimated_timeframe text not null default '',
  business_phone text not null default '',
  business_email text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_service_id, vendor_id)
);

create index if not exists quotes_event_service_id_idx on public.quotes (event_service_id);
create index if not exists quotes_vendor_id_idx on public.quotes (vendor_id);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row
execute function public.update_updated_at_column();

create or replace function public.enforce_quote_slot_and_sync_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_count integer;
begin
  if tg_op = 'INSERT' then
    select current_quote_count
    into slot_count
    from public.event_services
    where id = new.event_service_id
    for update;

    if slot_count is null then
      raise exception 'Event service not found for quote.';
    end if;

    if slot_count >= 4 then
      raise exception 'This service already has 4 vendor quotes.';
    end if;

    update public.event_services
    set current_quote_count = current_quote_count + 1
    where id = new.event_service_id;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.event_services
    set current_quote_count = greatest(0, current_quote_count - 1)
    where id = old.event_service_id;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists quotes_enforce_cap_sync_counts on public.quotes;
create trigger quotes_enforce_cap_sync_counts
before insert or delete on public.quotes
for each row
execute function public.enforce_quote_slot_and_sync_counts();

update public.event_services es
set current_quote_count = coalesce(q.count_quotes, 0)
from (
  select event_service_id, count(*)::integer as count_quotes
  from public.quotes
  group by event_service_id
) q
where es.id = q.event_service_id;

update public.event_services
set current_quote_count = 0
where id not in (select distinct event_service_id from public.quotes);

alter table public.quotes enable row level security;

drop policy if exists "quotes_select_vendor_own" on public.quotes;
create policy "quotes_select_vendor_own"
  on public.quotes
  for select
  to authenticated
  using (
    vendor_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'vendor'
    )
  );

drop policy if exists "quotes_insert_vendor_own_active_event" on public.quotes;
create policy "quotes_insert_vendor_own_active_event"
  on public.quotes
  for insert
  to authenticated
  with check (
    vendor_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'vendor'
    )
    and exists (
      select 1
      from public.event_services es
      join public.events e on e.id = es.event_id
      where es.id = quotes.event_service_id
        and e.status = 'active'
    )
  );

drop policy if exists "quotes_select_customer_own_events" on public.quotes;
create policy "quotes_select_customer_own_events"
  on public.quotes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.event_services es
      join public.events e on e.id = es.event_id
      join public.profiles p on p.id = (select auth.uid())
      where es.id = quotes.event_service_id
        and e.customer_id = (select auth.uid())
        and p.role = 'customer'
    )
  );

drop policy if exists "quotes_select_admin_all" on public.quotes;
create policy "quotes_select_admin_all"
  on public.quotes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "quotes_insert_admin_all" on public.quotes;
create policy "quotes_insert_admin_all"
  on public.quotes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "quotes_update_admin_all" on public.quotes;
create policy "quotes_update_admin_all"
  on public.quotes
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

drop policy if exists "quotes_delete_admin_all" on public.quotes;
create policy "quotes_delete_admin_all"
  on public.quotes
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

grant select, insert, update, delete on public.quotes to authenticated;
