-- Phase 4: vendor lead board read access for active opportunities only.

-- Events: vendors can read active events from all customers.
drop policy if exists "events_select_vendor_active" on public.events;
create policy "events_select_vendor_active"
  on public.events
  for select
  to authenticated
  using (
    status = 'active'
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'vendor'
    )
  );

-- event_services: vendors can read services only for active events.
drop policy if exists "event_services_select_vendor_active_event" on public.event_services;
create policy "event_services_select_vendor_active_event"
  on public.event_services
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      join public.profiles p
        on p.id = (select auth.uid())
      where e.id = event_services.event_id
        and e.status = 'active'
        and p.role = 'vendor'
    )
  );
