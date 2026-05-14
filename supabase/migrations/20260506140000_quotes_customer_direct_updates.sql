-- Allow event-owning customers to PATCH quote status from the app (no RPC).

drop policy if exists "quotes_update_customer_own_events" on public.quotes;

create policy "quotes_update_customer_own_events"
  on public.quotes
  for update
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
  )
  with check (
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

create or replace function public.enforce_quotes_customer_immutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select p.role into v_role from public.profiles p where p.id = auth.uid();
  if v_role is distinct from 'customer' then
    return new;
  end if;

  if (
    old.event_service_id,
    old.vendor_id,
    old.quote_amount,
    old.message,
    old.what_is_included,
    old.availability_note,
    old.estimated_timeframe,
    old.business_phone,
    old.business_email,
    old.created_at
  ) is distinct from (
    new.event_service_id,
    new.vendor_id,
    new.quote_amount,
    new.message,
    new.what_is_included,
    new.availability_note,
    new.estimated_timeframe,
    new.business_phone,
    new.business_email,
    new.created_at
  ) then
    raise exception 'Customers may only change quote status.';
  end if;

  return new;
end;
$$;

drop trigger if exists quotes_enforce_customer_immutable on public.quotes;
create trigger quotes_enforce_customer_immutable
before update on public.quotes
for each row
execute function public.enforce_quotes_customer_immutable_fields();
