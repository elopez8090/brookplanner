-- Fix vendor dashboard reads that can recurse through events <-> event_services RLS.
-- Vendor lead-board and quote history reads now use SECURITY DEFINER RPCs.

drop policy if exists "events_select_vendor_quoted" on public.events;
drop policy if exists "event_services_select_vendor_quoted_event" on public.event_services;

drop function if exists public.vendor_list_active_events();
drop function if exists public.vendor_list_quoted_service_ids();
drop function if exists public.vendor_list_submitted_quotes();
drop function if exists public.vendor_list_quote_category_names();

create function public.vendor_list_active_events()
returns table (
  id uuid,
  customer_id uuid,
  title text,
  event_type text,
  neighborhood text,
  event_date date,
  guest_count integer,
  budget_range text,
  details text,
  status text,
  created_at timestamptz,
  event_services jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'vendor'
  ) then
    return;
  end if;

  return query
  select
    e.id,
    e.customer_id,
    e.title,
    e.event_type,
    e.neighborhood,
    e.event_date,
    e.guest_count,
    e.budget_range,
    e.details,
    e.status,
    e.created_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', es.id,
          'event_id', es.event_id,
          'category_id', es.category_id,
          'current_quote_count', es.current_quote_count,
          'categories',
            case
              when c.id is null then null
              else jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'credits_required', c.credits_required
              )
            end
        )
        order by c.name
      ) filter (where es.id is not null),
      '[]'::jsonb
    ) as event_services
  from public.events e
  left join public.event_services es on es.event_id = e.id
  left join public.categories c on c.id = es.category_id
  where e.status = 'active'
  group by
    e.id,
    e.customer_id,
    e.title,
    e.event_type,
    e.neighborhood,
    e.event_date,
    e.guest_count,
    e.budget_range,
    e.details,
    e.status,
    e.created_at
  order by e.event_date asc;
end;
$$;

create function public.vendor_list_quoted_service_ids()
returns table (
  event_id uuid,
  event_service_id uuid
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'vendor'
  ) then
    return;
  end if;

  return query
  select
    es.event_id,
    q.event_service_id
  from public.quotes q
  inner join public.event_services es on es.id = q.event_service_id
  where q.vendor_id = (select auth.uid())
  order by q.created_at desc;
end;
$$;

create function public.vendor_list_submitted_quotes()
returns table (
  id uuid,
  event_id uuid,
  event_title text,
  event_date date,
  neighborhood text,
  service_name text,
  quote_amount numeric,
  message text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'vendor'
  ) then
    return;
  end if;

  return query
  select
    q.id,
    e.id as event_id,
    e.title as event_title,
    e.event_date,
    e.neighborhood,
    c.name as service_name,
    q.quote_amount,
    q.message,
    q.status,
    q.created_at
  from public.quotes q
  inner join public.event_services es on es.id = q.event_service_id
  inner join public.events e on e.id = es.event_id
  left join public.categories c on c.id = es.category_id
  where q.vendor_id = (select auth.uid())
  order by q.created_at desc;
end;
$$;

create function public.vendor_list_quote_category_names()
returns table (
  name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'vendor'
  ) then
    return;
  end if;

  return query
  select distinct c.name
  from public.quotes q
  inner join public.event_services es on es.id = q.event_service_id
  inner join public.categories c on c.id = es.category_id
  where q.vendor_id = (select auth.uid())
    and nullif(trim(c.name), '') is not null
  order by c.name asc;
end;
$$;

grant execute on function public.vendor_list_active_events() to authenticated;
grant execute on function public.vendor_list_quoted_service_ids() to authenticated;
grant execute on function public.vendor_list_submitted_quotes() to authenticated;
grant execute on function public.vendor_list_quote_category_names() to authenticated;
