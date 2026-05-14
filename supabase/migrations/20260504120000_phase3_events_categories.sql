-- Phase 3: events, event_services, categories + RLS + MVP category seed
-- Run in Supabase SQL editor or via supabase db push.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  credits_required integer not null check (credits_required >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  event_type text not null,
  neighborhood text not null,
  event_date date not null,
  guest_count integer not null check (guest_count > 0),
  budget_range text not null default '',
  details text not null default '',
  status text not null default 'active' check (status in ('active', 'draft', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_customer_id_idx on public.events (customer_id);
create index if not exists events_event_date_idx on public.events (event_date);

create table if not exists public.event_services (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (event_id, category_id)
);

create index if not exists event_services_event_id_idx on public.event_services (event_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.event_services enable row level security;

-- Categories: any signed-in user can read (posting form + future vendor UX).
drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_authenticated"
  on public.categories
  for select
  to authenticated
  using (true);

-- Events: customers see own; admins see all. Vendors: no policies (no access).
drop policy if exists "events_select_customer_or_admin" on public.events;
create policy "events_select_customer_or_admin"
  on public.events
  for select
  to authenticated
  using (
    customer_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

drop policy if exists "events_insert_customer_own" on public.events;
create policy "events_insert_customer_own"
  on public.events
  for insert
  to authenticated
  with check (
    customer_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'customer'
    )
  );

drop policy if exists "events_update_customer_or_admin" on public.events;
create policy "events_update_customer_or_admin"
  on public.events
  for update
  to authenticated
  using (
    customer_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  )
  with check (
    customer_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

drop policy if exists "events_delete_customer_or_admin" on public.events;
create policy "events_delete_customer_or_admin"
  on public.events
  for delete
  to authenticated
  using (
    customer_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  );

-- event_services: readable if parent event is visible; insert only for own events.
drop policy if exists "event_services_select_via_event" on public.event_services;
create policy "event_services_select_via_event"
  on public.event_services
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_services.event_id
        and (
          e.customer_id = (select auth.uid())
          or exists (
            select 1
            from public.profiles p
            where p.id = (select auth.uid())
              and p.role = 'admin'
          )
        )
    )
  );

drop policy if exists "event_services_insert_own_event" on public.event_services;
create policy "event_services_insert_own_event"
  on public.event_services
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_services.event_id
        and e.customer_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'customer'
    )
  );

drop policy if exists "event_services_delete_own_event" on public.event_services;
create policy "event_services_delete_own_event"
  on public.event_services
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_services.event_id
        and e.customer_id = (select auth.uid())
    )
  );

-- Grants (Supabase defaults vary; explicit is safer for new tables.)
grant select on public.categories to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, delete on public.event_services to authenticated;

-- ---------------------------------------------------------------------------
-- Seed MVP categories (idempotent)
-- ---------------------------------------------------------------------------

insert into public.categories (name, slug, description, credits_required)
values
  (
    'DJs',
    'djs',
    'Sound, mixing, and dance-floor energy for Brooklyn parties and receptions.',
    2
  ),
  (
    'Photographers',
    'photographers',
    'Documentary-style coverage, portraits, and editing for your event.',
    3
  ),
  (
    'Caterers',
    'caterers',
    'Menus, service staff, and dietary accommodations for gatherings of any size.',
    4
  ),
  (
    'Event Planners',
    'event-planners',
    'Timeline, vendor coordination, and on-site execution so you can enjoy the day.',
    4
  ),
  (
    'Venues',
    'venues',
    'Unique Brooklyn spaces with capacity, permits, and logistics handled cleanly.',
    5
  ),
  (
    'Party Rentals',
    'party-rentals',
    'Tables, chairs, tents, lighting, and specialty rentals delivered and staged.',
    2
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  credits_required = excluded.credits_required;
