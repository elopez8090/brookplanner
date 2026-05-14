-- Phase 20: customer reviews after accepting a quote (MVP reputation layer).

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  quote_id uuid not null references public.quotes (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (quote_id)
);

create index if not exists reviews_vendor_id_idx on public.reviews (vendor_id);
create index if not exists reviews_customer_id_idx on public.reviews (customer_id);
create index if not exists reviews_event_id_idx on public.reviews (event_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);

comment on table public.reviews is 'Customer reviews tied one-to-one to accepted quotes; public listings respect is_public.';

-- ---------------------------------------------------------------------------
-- Integrity: only the event owner can insert; quote must be accepted and align with vendor/event.
-- ---------------------------------------------------------------------------

create or replace function public.reviews_enforce_insert_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q_vendor uuid;
  q_status text;
  ev_id uuid;
  ev_customer uuid;
begin
  if new.customer_id is distinct from (select auth.uid()) then
    raise exception 'Review customer mismatch';
  end if;

  if not exists (
    select 1 from public.profiles pr where pr.id = new.customer_id and pr.role = 'customer'
  ) then
    raise exception 'Only customers can leave reviews';
  end if;

  select q.vendor_id, q.status, e.id, e.customer_id
  into q_vendor, q_status, ev_id, ev_customer
  from public.quotes q
  inner join public.event_services es on es.id = q.event_service_id
  inner join public.events e on e.id = es.event_id
  where q.id = new.quote_id;

  if not found then
    raise exception 'Quote not found';
  end if;

  if q_status is distinct from 'accepted' then
    raise exception 'You can only review after accepting a quote';
  end if;

  if q_vendor is distinct from new.vendor_id then
    raise exception 'Vendor mismatch';
  end if;

  if ev_id is distinct from new.event_id then
    raise exception 'Event mismatch';
  end if;

  if ev_customer is distinct from new.customer_id then
    raise exception 'Not your event';
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_enforce_insert_integrity_trg on public.reviews;
create trigger reviews_enforce_insert_integrity_trg
before insert on public.reviews
for each row
execute function public.reviews_enforce_insert_integrity();

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_scope" on public.reviews;
create policy "reviews_select_scope"
  on public.reviews
  for select
  to anon, authenticated
  using (
    is_public = true
    or customer_id = (select auth.uid())
    or vendor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

drop policy if exists "reviews_insert_customer_self" on public.reviews;
create policy "reviews_insert_customer_self"
  on public.reviews
  for insert
  to authenticated
  with check (customer_id = (select auth.uid()));

grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: toggle visibility (no deletes).
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_review_visibility(
  p_review_id uuid,
  p_is_public boolean
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

  update public.reviews r
  set is_public = p_is_public
  where r.id = p_review_id;

  if not found then
    raise exception 'review not found';
  end if;
end;
$$;

grant execute on function public.admin_set_review_visibility(uuid, boolean) to authenticated;

drop function if exists public.admin_list_reviews(integer);

create or replace function public.admin_list_reviews(p_limit integer default 120)
returns table (
  id uuid,
  vendor_id uuid,
  vendor_label text,
  vendor_slug text,
  customer_id uuid,
  customer_label text,
  event_id uuid,
  event_title text,
  quote_id uuid,
  rating integer,
  review_text text,
  is_public boolean,
  created_at timestamptz
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
    r.id,
    r.vendor_id,
    coalesce(nullif(trim(vp.business_name), ''), nullif(trim(vp.full_name), ''), 'Vendor')::text as vendor_label,
    vp.slug::text as vendor_slug,
    r.customer_id,
    coalesce(nullif(trim(cp.full_name), ''), 'Customer')::text as customer_label,
    r.event_id,
    coalesce(nullif(trim(e.title), ''), '(untitled)')::text as event_title,
    r.quote_id,
    r.rating,
    r.review_text,
    r.is_public,
    r.created_at
  from public.reviews r
  left join public.profiles vp on vp.id = r.vendor_id
  left join public.profiles cp on cp.id = r.customer_id
  left join public.events e on e.id = r.event_id
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 120), 500));
end;
$$;

grant execute on function public.admin_list_reviews(integer) to authenticated;
