-- Phase 21: profile status (suspend/deactivate), admin promotional credits audit,
-- marketplace hides non-active vendors, quote RPC account guard, customer event RLS.

-- ---------------------------------------------------------------------------
-- profiles.status + suspension metadata (admin_notes already exists from Phase 19)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists status text default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text;

update public.profiles set status = 'active' where status is null;

alter table public.profiles alter column status set not null;
alter table public.profiles alter column status set default 'active';

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('active', 'suspended', 'deactivated'));

comment on column public.profiles.status is 'Account lifecycle: active, suspended (admin), or deactivated (soft).';
comment on column public.profiles.suspended_at is 'When the account was suspended or deactivated; cleared on restore.';
comment on column public.profiles.suspended_reason is 'Admin-facing reason shown internally; optional customer message via copy on suspended page.';

-- ---------------------------------------------------------------------------
-- Admin promotional credits audit (in addition to credit_transactions ledger)
-- ---------------------------------------------------------------------------

create table if not exists public.admin_credit_adjustments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid not null references public.profiles (id) on delete restrict,
  credits_added integer not null check (credits_added > 0),
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists admin_credit_adjustments_vendor_id_idx
  on public.admin_credit_adjustments (vendor_id, created_at desc);

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
-- Customers: require active profile for posting/mutating events (admins exempt)
-- ---------------------------------------------------------------------------

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
        and coalesce(p.status, 'active') = 'active'
    )
  );

drop policy if exists "events_update_customer_or_admin" on public.events;
create policy "events_update_customer_or_admin"
  on public.events
  for update
  to authenticated
  using (
    (
      customer_id = (select auth.uid())
      and exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'customer'
          and coalesce(p.status, 'active') = 'active'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
  )
  with check (
    (
      customer_id = (select auth.uid())
      and exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'customer'
          and coalesce(p.status, 'active') = 'active'
      )
    )
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
    (
      customer_id = (select auth.uid())
      and exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'customer'
          and coalesce(p.status, 'active') = 'active'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
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
        and coalesce(p.status, 'active') = 'active'
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
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'customer'
        and coalesce(p.status, 'active') = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- Quote submission: block suspended / deactivated vendors (DB-enforced)
-- ---------------------------------------------------------------------------

drop function if exists public.submit_quote_with_credits(uuid, uuid, numeric, text, text, text, text, text, text);

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
  v_account_status text;
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

  select role, credits_balance, coalesce(status, 'active')
  into v_role, v_vendor_credits, v_account_status
  from public.profiles
  where id = v_vendor_id
  for update;

  if v_role is distinct from 'vendor' then
    raise exception 'Only vendor accounts can submit quotes.';
  end if;

  if v_account_status is distinct from 'active' then
    raise exception 'Your account cannot submit quotes right now. Contact support if you need help.';
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

-- App-facing alias (RPC name used by Next.js server actions)
drop function if exists public.submit_vendor_quote(uuid, uuid, numeric, text, text, text, text, text, text);

create function public.submit_vendor_quote(
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
language sql
security definer
set search_path = public
as $$
  select *
  from public.submit_quote_with_credits(
    p_event_id,
    p_event_service_id,
    p_quote_amount,
    p_message,
    p_what_is_included,
    p_availability_note,
    p_estimated_timeframe,
    p_business_phone,
    p_business_email
  );
$$;

grant execute on function public.submit_vendor_quote(uuid, uuid, numeric, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public vendor surfaces: hide suspended/deactivated vendors
-- ---------------------------------------------------------------------------

drop function if exists public.public_vendor_directory(text, text, text);

create or replace function public.public_vendor_directory(
  p_query text default null,
  p_category text default null,
  p_area text default null
)
returns table (
  id uuid,
  business_name text,
  slug text,
  bio text,
  service_areas text,
  logo_url text,
  categories text[],
  website text,
  instagram text,
  facebook text,
  tiktok text,
  cover_image_url text,
  created_at timestamptz,
  is_featured boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.business_name,
    p.slug,
    p.bio,
    p.service_areas,
    p.logo_url,
    coalesce(array_agg(distinct c.name) filter (where c.name is not null), '{}') as categories,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.cover_image_url,
    p.created_at,
    p.is_featured
  from public.profiles p
  left join public.quotes q on q.vendor_id = p.id
  left join public.event_services es on es.id = q.event_service_id
  left join public.categories c on c.id = es.category_id
  where p.role = 'vendor'
    and coalesce(p.status, 'active') = 'active'
    and coalesce(p.is_public, true) = true
    and p.is_profile_complete = true
    and p.slug is not null
    and nullif(trim(p.slug), '') is not null
    and p.business_name is not null
    and nullif(trim(p.business_name), '') is not null
    and (
      p_query is null
      or p.business_name ilike ('%' || p_query || '%')
    )
    and (
      p_area is null
      or coalesce(p.service_areas, '') ilike ('%' || p_area || '%')
    )
  group by
    p.id,
    p.business_name,
    p.slug,
    p.bio,
    p.service_areas,
    p.logo_url,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.cover_image_url,
    p.created_at,
    p.is_featured
  having (
    p_category is null
    or bool_or(lower(c.name) = lower(p_category))
  )
  order by lower(p.business_name) asc;
$$;

grant execute on function public.public_vendor_directory(text, text, text) to anon, authenticated;

drop function if exists public.public_vendor_page(text);

create or replace function public.public_vendor_page(p_slug text)
returns table (
  id uuid,
  full_name text,
  business_name text,
  slug text,
  bio text,
  business_phone text,
  website text,
  instagram text,
  facebook text,
  tiktok text,
  service_areas text,
  logo_url text,
  cover_image_url text,
  categories text[]
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.bio,
    p.business_phone,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.service_areas,
    p.logo_url,
    p.cover_image_url,
    coalesce(array_agg(distinct c.name) filter (where c.name is not null), '{}') as categories
  from public.profiles p
  left join public.quotes q on q.vendor_id = p.id
  left join public.event_services es on es.id = q.event_service_id
  left join public.categories c on c.id = es.category_id
  where p.role = 'vendor'
    and coalesce(p.status, 'active') = 'active'
    and coalesce(p.is_public, true) = true
    and p.slug = p_slug
  group by
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.bio,
    p.business_phone,
    p.website,
    p.instagram,
    p.facebook,
    p.tiktok,
    p.service_areas,
    p.logo_url,
    p.cover_image_url
  limit 1;
$$;

grant execute on function public.public_vendor_page(text) to anon, authenticated;

drop function if exists public.public_marketplace_stats();

create or replace function public.public_marketplace_stats()
returns table (
  vendor_count bigint,
  events_posted bigint,
  quotes_submitted bigint,
  boroughs_with_vendor_coverage bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (
      select count(*)::bigint
      from public.profiles p
      where p.role = 'vendor'
        and coalesce(p.status, 'active') = 'active'
        and coalesce(p.is_public, true) = true
        and p.is_profile_complete = true
        and p.slug is not null
        and nullif(trim(p.slug), '') is not null
        and p.business_name is not null
        and nullif(trim(p.business_name), '') is not null
    ) as vendor_count,
    (
      select count(*)::bigint
      from public.events e
      where e.status in ('active', 'closed')
    ) as events_posted,
    (
      select count(*)::bigint
      from public.quotes q
    ) as quotes_submitted,
    (
      select count(*)::bigint
      from (values ('manhattan'), ('brooklyn'), ('queens'), ('bronx'), ('staten island')) as v(keyword)
      where exists (
        select 1
        from public.profiles p
        where p.role = 'vendor'
          and coalesce(p.status, 'active') = 'active'
          and coalesce(p.is_public, true) = true
          and p.is_profile_complete = true
          and p.slug is not null
          and nullif(trim(p.slug), '') is not null
          and p.business_name is not null
          and nullif(trim(p.business_name), '') is not null
          and lower(coalesce(p.service_areas, '')) like '%' || v.keyword || '%'
      )
    ) as boroughs_with_vendor_coverage;
$$;

grant execute on function public.public_marketplace_stats() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin RPCs
-- ---------------------------------------------------------------------------

drop function if exists public.admin_list_marketplace_vendors();

create or replace function public.admin_list_marketplace_vendors()
returns table (
  id uuid,
  full_name text,
  business_name text,
  slug text,
  is_profile_complete boolean,
  is_public boolean,
  is_featured boolean,
  admin_notes text,
  created_at timestamptz,
  credits_balance integer,
  status text,
  suspended_at timestamptz,
  suspended_reason text
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
    p.id,
    p.full_name,
    p.business_name,
    p.slug,
    p.is_profile_complete,
    p.is_public,
    p.is_featured,
    p.admin_notes,
    p.created_at,
    p.credits_balance,
    coalesce(p.status, 'active')::text,
    p.suspended_at,
    p.suspended_reason
  from public.profiles p
  where p.role = 'vendor'
  order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_marketplace_vendors() to authenticated;

create or replace function public.admin_set_vendor_marketplace_flags(
  p_vendor_id uuid,
  p_is_public boolean,
  p_is_featured boolean,
  p_admin_notes text
)
returns void
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

  update public.profiles
  set
    is_public = p_is_public,
    is_featured = p_is_featured,
    admin_notes = nullif(trim(p_admin_notes), '')
  where id = p_vendor_id
    and role = 'vendor';

  if not found then
    raise exception 'vendor profile not found';
  end if;
end;
$$;

grant execute on function public.admin_set_vendor_marketplace_flags(uuid, boolean, boolean, text) to authenticated;

create or replace function public.admin_list_customers(p_limit integer default 200)
returns table (
  id uuid,
  full_name text,
  status text,
  suspended_at timestamptz,
  suspended_reason text,
  admin_notes text,
  created_at timestamptz,
  events_posted_count bigint
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
    p.id,
    p.full_name,
    coalesce(p.status, 'active')::text,
    p.suspended_at,
    p.suspended_reason,
    p.admin_notes,
    p.created_at,
    (
      select count(*)::bigint
      from public.events e
      where e.customer_id = p.id
    ) as events_posted_count
  from public.profiles p
  where p.role = 'customer'
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
end;
$$;

grant execute on function public.admin_list_customers(integer) to authenticated;

create or replace function public.admin_set_profile_status(
  p_profile_id uuid,
  p_action text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_role text;
begin
  if v_admin is null then
    raise exception 'not authorized';
  end if;

  if not exists (
    select 1 from public.profiles pr where pr.id = v_admin and pr.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  if p_profile_id = v_admin then
    raise exception 'You cannot change your own account status here.';
  end if;

  select role into v_role from public.profiles where id = p_profile_id;
  if v_role is null then
    raise exception 'profile not found';
  end if;

  if v_role = 'admin' then
    raise exception 'Admin accounts cannot be suspended via this tool.';
  end if;

  if p_action = 'suspend' then
    update public.profiles
    set
      status = 'suspended',
      suspended_at = now(),
      suspended_reason = nullif(trim(p_reason), '')
    where id = p_profile_id
      and role in ('customer', 'vendor');
  elsif p_action = 'restore' then
    update public.profiles
    set
      status = 'active',
      suspended_at = null,
      suspended_reason = null
    where id = p_profile_id
      and role in ('customer', 'vendor');
  elsif p_action = 'deactivate' then
    update public.profiles
    set
      status = 'deactivated',
      suspended_at = coalesce(suspended_at, now()),
      suspended_reason = coalesce(nullif(trim(p_reason), ''), suspended_reason, 'Account deactivated.')
    where id = p_profile_id
      and role in ('customer', 'vendor');
  else
    raise exception 'invalid action';
  end if;

  if not found then
    raise exception 'profile not updated';
  end if;
end;
$$;

grant execute on function public.admin_set_profile_status(uuid, text, text) to authenticated;

create or replace function public.admin_set_customer_admin_notes(
  p_customer_id uuid,
  p_admin_notes text
)
returns void
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

  update public.profiles
  set admin_notes = nullif(trim(p_admin_notes), '')
  where id = p_customer_id
    and role = 'customer';

  if not found then
    raise exception 'customer profile not found';
  end if;
end;
$$;

grant execute on function public.admin_set_customer_admin_notes(uuid, text) to authenticated;

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

  insert into public.admin_credit_adjustments (vendor_id, admin_id, credits_added, reason)
  values (p_vendor_id, v_admin, v_n, v_reason);

  insert into public.credit_transactions (vendor_id, amount, type, description)
  values (p_vendor_id, v_n, 'admin_adjustment', v_reason);
end;
$$;

grant execute on function public.admin_grant_vendor_promotional_credits(uuid, integer, text) to authenticated;
