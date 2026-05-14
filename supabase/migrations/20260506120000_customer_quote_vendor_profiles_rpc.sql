-- Customers see vendor identity on their event quotes without exposing credits_balance
-- via a broad profiles SELECT policy.
drop function if exists public.customer_quote_vendor_profiles(uuid);

create or replace function public.customer_quote_vendor_profiles(p_event_id uuid)
returns table (
  vendor_id uuid,
  full_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (p.id)
    p.id,
    p.full_name
  from public.profiles p
  inner join public.quotes q on q.vendor_id = p.id
  inner join public.event_services es on es.id = q.event_service_id
  inner join public.events e on e.id = es.event_id
  where es.event_id = p_event_id
    and e.customer_id = (select auth.uid())
  order by p.id;
$$;

grant execute on function public.customer_quote_vendor_profiles(uuid) to authenticated;
