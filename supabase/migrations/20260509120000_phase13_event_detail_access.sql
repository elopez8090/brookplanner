-- Phase 13: vendors can read events they quoted (any status) + full vendor fields for customer quote cards via RPC.

drop function if exists public.customer_quote_vendor_profiles(uuid);

create function public.customer_quote_vendor_profiles(p_event_id uuid)
returns table (
  vendor_id uuid,
  full_name text,
  business_name text,
  slug text,
  service_areas text,
  logo_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (p.id)
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.service_areas,
    p.logo_url
  from public.profiles p
  inner join public.quotes q on q.vendor_id = p.id
  inner join public.event_services es on es.id = q.event_service_id
  inner join public.events e on e.id = es.event_id
  where e.id = p_event_id
    and (
      e.customer_id = (select auth.uid())
      or exists (
        select 1
        from public.profiles viewer
        where viewer.id = (select auth.uid())
          and viewer.role = 'admin'
      )
    )
  order by p.id;
$$;

grant execute on function public.customer_quote_vendor_profiles(uuid) to authenticated;

-- Events: vendors can read events they have submitted at least one quote for (includes closed events).
drop policy if exists "events_select_vendor_quoted" on public.events;
create policy "events_select_vendor_quoted"
  on public.events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'vendor'
    )
    and exists (
      select 1
      from public.quotes q
      join public.event_services es on es.id = q.event_service_id
      where q.vendor_id = (select auth.uid())
        and es.event_id = events.id
    )
  );

-- event_services: vendors can read all rows for events they quoted on (context for multi-service events).
drop policy if exists "event_services_select_vendor_quoted_event" on public.event_services;
create policy "event_services_select_vendor_quoted_event"
  on public.event_services
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'vendor'
    )
    and exists (
      select 1
      from public.quotes q
      join public.event_services es_q on es_q.id = q.event_service_id
      where q.vendor_id = (select auth.uid())
        and es_q.event_id = event_services.event_id
    )
  );
